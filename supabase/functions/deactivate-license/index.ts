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
    if (req.method !== "POST") {
      return json({ success: false, message: "Method Not Allowed." }, 405);
    }

    const body = await readJson(req);
    const email = normalizeEmail(body.email);
    const deviceId = String(body.deviceId ?? "").trim();
    const activationToken = String(body.activationToken ?? "").trim();
    const licenseKey = String(body.licenseKey ?? "").trim();

    if (!email || !deviceId || (!activationToken && !licenseKey)) {
      return json({
        success: false,
        message: "Email, Device ID và Activation Token hoặc License Key là bắt buộc.",
      }, 400);
    }

    let activation: {
      id: string;
      license_id: string;
      device_id: string;
      deactivated_at: string | null;
    } | null = null;

    let license: {
      id: string;
      email: string;
      product_id: string;
    } | null = null;

    // Prefer activation token when available.
    if (activationToken) {
      const { data } = await ctx.supabaseAdmin
        .from("activations")
        .select("id, license_id, device_id, deactivated_at")
        .eq("activation_token_hash", await sha256(activationToken))
        .maybeSingle();

      if (data) activation = data;
    }

    // Fallback to license key + device. This makes clear/deactivate idempotent
    // even when the old activation token is stale or was already deactivated.
    if (!activation && licenseKey) {
      const { data: keyLicense, error } = await ctx.supabaseAdmin
        .from("licenses")
        .select("id, email, product_id")
        .eq("license_key_hash", await sha256(licenseKey))
        .maybeSingle();

      if (error) {
        return json({
          success: false,
          message: "Không thể kiểm tra License.",
          detail: error.message,
        }, 500);
      }

      if (!keyLicense) {
        return json({ success: false, message: "License Key không tồn tại." }, 403);
      }

      if (normalizeEmail(keyLicense.email) !== email) {
        return json({ success: false, message: "Email không khớp với License." }, 403);
      }

      const { data: product, error: productError } = await ctx.supabaseAdmin
        .from("products")
        .select("code")
        .eq("id", keyLicense.product_id)
        .maybeSingle();

      if (productError || !product || product.code !== PRODUCT) {
        return json({
          success: false,
          message: "License không dành cho VietSoft QR Code Generator.",
        }, 403);
      }

      license = keyLicense;

      const { data: deviceActivation, error: deviceError } = await ctx.supabaseAdmin
        .from("activations")
        .select("id, license_id, device_id, deactivated_at")
        .eq("license_id", keyLicense.id)
        .eq("device_id", deviceId)
        .is("deactivated_at", null)
        .order("activated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (deviceError) {
        return json({
          success: false,
          message: "Không thể kiểm tra thiết bị.",
          detail: deviceError.message,
        }, 500);
      }

      if (deviceActivation) activation = deviceActivation;
    }

    if (!activation) {
      if (license) {
        const { count } = await ctx.supabaseAdmin
          .from("activations")
          .select("id", { count: "exact", head: true })
          .eq("license_id", license.id)
          .is("deactivated_at", null);

        return json({
          success: true,
          activeDevices: count ?? 0,
          alreadyDeactivated: true,
        });
      }

      return json({
        success: false,
        message: "Activation Token không hợp lệ.",
      }, 403);
    }

    if (activation.device_id !== deviceId || activation.deactivated_at) {
      return json({
        success: true,
        activeDevices: 0,
        alreadyDeactivated: true,
      });
    }

    if (!license) {
      const { data, error } = await ctx.supabaseAdmin
        .from("licenses")
        .select("id, email, product_id")
        .eq("id", activation.license_id)
        .maybeSingle();

      if (error || !data) {
        return json({ success: false, message: "License không tồn tại." }, 403);
      }

      license = data;
    }

    const { data: product, error: productError } = await ctx.supabaseAdmin
      .from("products")
      .select("code")
      .eq("id", license.product_id)
      .maybeSingle();

    if (productError || !product || product.code !== PRODUCT) {
      return json({
        success: false,
        message: "License không dành cho VietSoft QR Code Generator.",
      }, 403);
    }

    if (normalizeEmail(license.email) !== email) {
      return json({ success: false, message: "Email không khớp với License." }, 403);
    }

    const { error: updateError } = await ctx.supabaseAdmin
      .from("activations")
      .update({ deactivated_at: new Date().toISOString() })
      .eq("id", activation.id);

    if (updateError) {
      console.error("Deactivation failed:", updateError);
      return json({
        success: false,
        message: "Không thể xóa kích hoạt.",
        detail: updateError.message,
      }, 500);
    }

    const { count: activeDevices } = await ctx.supabaseAdmin
      .from("activations")
      .select("id", { count: "exact", head: true })
      .eq("license_id", license.id)
      .is("deactivated_at", null);

    return json({
      success: true,
      activeDevices: activeDevices ?? 0,
    });
  }),
};