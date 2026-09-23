import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const PRODUCT = "vietsoft-qr";

function json(data: Record<string, unknown>, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function normalizeEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isExpired(value: string | null): boolean {
  if (!value) return false;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T23:59:59.999Z`
    : value;
  return new Date(normalized).getTime() < Date.now();
}

function publicExpiresAt(value: string | null): string {
  return value ?? "";
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    if (req.method !== "POST") return json({ success: false, message: "Method Not Allowed." }, 405);

    const body = await readJson(req);
    const email = normalizeEmail(body.email);
    const deviceId = String(body.deviceId ?? "").trim();
    const activationToken = String(body.activationToken ?? "").trim();

    if (!email || !deviceId || !activationToken) {
      return json({ success: false, message: "Email, Device ID và Activation Token là bắt buộc." }, 400);
    }

    const activationTokenHash = await sha256(activationToken);

    const { data: activation, error: activationError } = await ctx.supabaseAdmin
      .from("activations")
      .select("id, license_id, device_id, deactivated_at")
      .eq("activation_token_hash", activationTokenHash)
      .maybeSingle();

    if (activationError || !activation) {
      return json({ success: false, message: "Activation Token không hợp lệ." }, 403);
    }

    if (activation.device_id !== deviceId || activation.deactivated_at) {
      return json({ success: false, message: "Thiết bị chưa được kích hoạt." }, 403);
    }

    const { data: license, error: licenseError } = await ctx.supabaseAdmin
      .from("licenses")
      .select("id, email, plan, status, expires_at, product_id")
      .eq("id", activation.license_id)
      .maybeSingle();

    if (licenseError || !license) {
      return json({ success: false, message: "License không tồn tại." }, 403);
    }

    const { data: product, error: productError } = await ctx.supabaseAdmin
      .from("products")
      .select("code")
      .eq("id", license.product_id)
      .maybeSingle();

    if (productError || !product || product.code !== PRODUCT) {
      return json({ success: false, message: "License không dành cho VietSoft QR Code Generator." }, 403);
    }

    if (license.status !== "active") {
      return json({ success: false, message: "License đã bị vô hiệu hóa." }, 403);
    }

    if (normalizeEmail(license.email) !== email) {
      return json({ success: false, message: "Email không khớp với License." }, 403);
    }

    if (isExpired(license.expires_at)) {
      return json({ success: false, message: "License đã hết hạn." }, 403);
    }

    const { error: updateError } = await ctx.supabaseAdmin
      .from("activations")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", activation.id);

    if (updateError) console.error("Last-seen update failed:", updateError);

    return json({
      success: true,
      plan: license.plan,
      expiresAt: publicExpiresAt(license.expires_at),
    });
  }),
};
