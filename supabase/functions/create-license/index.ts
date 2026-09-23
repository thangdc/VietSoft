import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const PRODUCT = "vietsoft-qr";
const PUBLIC_KEY_SPKI_BASE64 = "MCowBQYDK2VwAyEA3W76cnNqekQ1XCiC4gFn4R9FqOjCvnN0ntXZZZTboRY=";

function json(data: Record<string, unknown>, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function base64UrlToBytes(value: string): Uint8Array {
  let normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4) normalized += "=";
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function normalizeEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function isExpired(value: unknown): boolean {
  if (!value) return false;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? `${value}T23:59:59.999Z`
    : String(value);
  return new Date(normalized).getTime() < Date.now();
}

function normalizeExpiry(value: unknown): string | null {
  if (!value) return null;
  const date = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return `${date}T23:59:59.999Z`;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyLicense(licenseKey: string): Promise<Record<string, unknown> | null> {
  const parts = licenseKey.split(".");
  if (parts.length !== 3 || parts[0] !== "VSQR1") return null;

  try {
    const payloadPart = parts[1];
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payloadPart)),
    ) as Record<string, unknown>;

    const key = await crypto.subtle.importKey(
      "spki",
      base64UrlToBytes(PUBLIC_KEY_SPKI_BASE64),
      { name: "Ed25519" },
      false,
      ["verify"],
    );

    const valid = await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      base64UrlToBytes(parts[2]),
      new TextEncoder().encode(payloadPart),
    );

    if (!valid || payload.product !== PRODUCT || payload.plan !== "pro") {
      return null;
    }

    const email = normalizeEmail(payload.email);
    const licenseId = String(payload.licenseId ?? "").trim();
    const expiresAt = payload.expiresAt ? String(payload.expiresAt).trim() : "";

    if (!email || !licenseId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return null;
    }

    if (expiresAt && !/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) {
      return null;
    }

    return {
      product: PRODUCT,
      plan: "pro",
      licenseId,
      email,
      expiresAt,
    };
  } catch {
    return null;
  }
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object"
      ? body as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    if (req.method !== "POST") {
      return json({ success: false, message: "Method Not Allowed." }, 405);
    }

    const adminKey = Deno.env.get("VIETSOFT_LICENSE_ADMIN_KEY") || "";
    const providedKey = req.headers.get("x-license-admin-key") || "";
    if (!adminKey || providedKey !== adminKey) {
      return json({ success: false, message: "Unauthorized." }, 401);
    }

    const body = await readJson(req);
    const licenseKey = String(body.licenseKey ?? "").trim();
    const maxDevices = Number(body.maxDevices ?? 1);

    if (!licenseKey) {
      return json({ success: false, message: "License Key là bắt buộc." }, 400);
    }

    if (!Number.isInteger(maxDevices) || maxDevices < 1) {
      return json({ success: false, message: "Max devices không hợp lệ." }, 400);
    }

    const payload = await verifyLicense(licenseKey);
    if (!payload) {
      return json({ success: false, message: "License Key không hợp lệ." }, 400);
    }

    if (isExpired(payload.expiresAt)) {
      return json({ success: false, message: "Không thể tạo License đã hết hạn." }, 400);
    }

    const licenseKeyHash = await sha256(licenseKey);
    const expiresAt = normalizeExpiry(payload.expiresAt);

    const { data: product, error: productError } = await ctx.supabaseAdmin
      .from("products")
      .select("id")
      .eq("code", PRODUCT)
      .maybeSingle();

    if (productError || !product) {
      console.error("Product lookup failed:", productError);
      return json({ success: false, message: "Không tìm thấy sản phẩm License." }, 500);
    }

    const { data: existing, error: existingError } = await ctx.supabaseAdmin
      .from("licenses")
      .select("id")
      .eq("license_key_hash", licenseKeyHash)
      .maybeSingle();

    if (existingError) {
      console.error("License lookup failed:", existingError);
      return json({ success: false, message: "Không thể kiểm tra License." }, 500);
    }

    if (existing) {
      return json({ success: false, message: "License Key đã tồn tại." }, 409);
    }

    const { error: insertError } = await ctx.supabaseAdmin
      .from("licenses")
      .insert({
        product_id: product.id,
        license_key_hash: licenseKeyHash,
        email: payload.email,
        plan: payload.plan,
        status: "active",
        expires_at: expiresAt,
        max_devices: maxDevices,
      });

    if (insertError) {
      console.error("License insert failed:", insertError);
      return json({ success: false, message: "Không thể lưu License." }, 500);
    }

    return json({
      success: true,
      licenseId: payload.licenseId,
      email: payload.email,
      plan: payload.plan,
      expiresAt: payload.expiresAt || "",
      maxDevices,
    });
  }),
};
