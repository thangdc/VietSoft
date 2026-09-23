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
    const licenseKey = String(body.licenseKey ?? "").trim();
    const deviceId = String(body.deviceId ?? "").trim();

    if (!email || !licenseKey || !deviceId) {
      return json({ success: false, message: "Email, License Key và Device ID là bắt buộc." }, 400);
    }

    const licenseKeyHash = await sha256(licenseKey);

    const { data: product, error: productError } = await ctx.supabaseAdmin
      .from("products")
      .select("id")
      .eq("code", PRODUCT)
      .maybeSingle();

    if (productError || !product) {
      console.error("Product lookup failed:", productError);
      return json({ success: false, message: "Không tìm thấy sản phẩm License." }, 500);
    }

    const { data: license, error: licenseError } = await ctx.supabaseAdmin
      .from("licenses")
      .select("id, email, plan, status, expires_at, max_devices")
      .eq("product_id", product.id)
      .eq("license_key_hash", licenseKeyHash)
      .maybeSingle();

    if (licenseError || !license) {
      return json({ success: false, message: "License Key không tồn tại." }, 403);
    }

    if (license.status !== "active") {
      return json({ success: false, message: "License đã bị vô hiệu hóa." }, 403);
    }

    if (normalizeEmail(license.email) !== email) {
      return json({ success: false, message: "Email không khớp với License Key." }, 403);
    }

    if (isExpired(license.expires_at)) {
      return json({ success: false, message: "License đã hết hạn." }, 403);
    }

    const { data: existing, error: existingError } = await ctx.supabaseAdmin
      .from("activations")
      .select("id, device_id, deactivated_at")
      .eq("license_id", license.id)
      .eq("device_id", deviceId)
      .maybeSingle();

    if (existingError) {
      console.error("Activation lookup failed:", existingError);
      return json({ success: false, message: "Không thể kiểm tra trạng thái kích hoạt." }, 500);
    }

    if (!existing) {
      const { count, error: countError } = await ctx.supabaseAdmin
        .from("activations")
        .select("id", { count: "exact", head: true })
        .eq("license_id", license.id)
        .is("deactivated_at", null);

      if (countError) {
        console.error("Activation count failed:", countError);
        return json({ success: false, message: "Không thể kiểm tra số thiết bị." }, 500);
      }

      if ((count ?? 0) >= license.max_devices) {
        return json({ success: false, message: "License đã đạt giới hạn số thiết bị." }, 403);
      }
    }

    const activationToken = crypto.randomUUID();
    const activationTokenHash = await sha256(activationToken);
    const now = new Date().toISOString();

    if (existing) {
      const { error: updateError } = await ctx.supabaseAdmin
        .from("activations")
        .update({
          activation_token_hash: activationTokenHash,
          activated_at: now,
          last_seen_at: now,
          deactivated_at: null,
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Activation update failed:", updateError);
        return json({ success: false, message: "Không thể kích hoạt License." }, 500);
      }
    } else {
      const { error: insertError } = await ctx.supabaseAdmin
        .from("activations")
        .insert({
          license_id: license.id,
          device_id: deviceId,
          activation_token_hash: activationTokenHash,
          activated_at: now,
          last_seen_at: now,
        });

      if (insertError) {
        console.error("Activation insert failed:", insertError);
        return json({ success: false, message: "Không thể kích hoạt License." }, 500);
      }
    }

    return json({
      success: true,
      plan: license.plan,
      expiresAt: publicExpiresAt(license.expires_at),
      activationToken,
    });
  }),
};
