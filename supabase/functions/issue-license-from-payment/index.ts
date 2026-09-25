import { createClient } from "npm:@supabase/supabase-js@2";
import { withSupabase } from "@supabase/server";

const PRODUCT = "vietsoft-qr";

function json(data: Record<string, unknown>, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });
}

function normalizeEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlJson(value: unknown): string {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function signLicense(payloadPart: string): Promise<string> {
  const raw = Deno.env.get("VIETSOFT_QR_LICENSE_PRIVATE_JWK") || "";
  if (!raw) throw new Error("License signing key is not configured.");

  const privateJwk = JSON.parse(raw);
  const key = await crypto.subtle.importKey(
    "jwk",
    privateJwk,
    { name: "Ed25519" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { name: "Ed25519" },
    key,
    new TextEncoder().encode(payloadPart),
  );
  return base64Url(new Uint8Array(signature));
}

function addDays(days: number): string {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

async function buildLicenseKey(input: {
  id: string;
  email: string;
  plan: string;
  expiresAt: string;
}): Promise<{ licenseKey: string; licenseKeyHash: string }> {
  const payloadPart = base64UrlJson({
    product: PRODUCT,
    licenseId: input.id,
    email: input.email,
    plan: input.plan,
    expiresAt: input.expiresAt,
  });
  const signaturePart = await signLicense(payloadPart);
  const licenseKey = "VSQR1." + payloadPart + "." + signaturePart;
  return { licenseKey, licenseKeyHash: await sha256(licenseKey) };
}

export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    if (req.method === "OPTIONS") return json({ success: true });
    if (req.method !== "POST") return json({ success: false, message: "Method Not Allowed." }, 405);

    const body = await req.json().catch(() => ({}));
    const paymentId = String(body.paymentId ?? "").trim();
    if (!paymentId) return json({ success: false, code: "INVALID_REQUEST", message: "paymentId là bắt buộc." }, 400);

    const { data: payment, error: paymentError } = await ctx.supabaseAdmin
      .from("payments")
      .select("id, provider, product_code, plan_code, email, amount, currency, status, paid_at")
      .eq("id", paymentId)
      .maybeSingle();

    if (paymentError || !payment) return json({ success: false, code: "PAYMENT_NOT_FOUND", message: "Không tìm thấy giao dịch." }, 404);
    if (payment.status !== "paid") {
      return json({ success: false, code: "PAYMENT_NOT_PAID", message: "Giao dịch chưa được xác nhận thanh toán." }, 409);
    }
    if (payment.product_code !== PRODUCT) {
      return json({ success: false, code: "PRODUCT_NOT_SUPPORTED", message: "Giao dịch không thuộc VietSoft QR." }, 400);
    }

    const { data: existing } = await ctx.supabaseAdmin
      .from("licenses")
      .select("id, email, plan, expires_at")
      .eq("payment_id", payment.id)
      .maybeSingle();

    if (existing) {
      const expiresAt = existing.expires_at ? String(existing.expires_at).slice(0, 10) : "";
      const built = await buildLicenseKey({
        id: existing.id,
        email: normalizeEmail(existing.email),
        plan: existing.plan,
        expiresAt,
      });
      return json({
        success: true,
        license: {
          licenseKey: built.licenseKey,
          email: normalizeEmail(existing.email),
          plan: existing.plan,
          expiresAt,
        },
      });
    }

    const plan = payment.plan_code === "annual" ? "annual" : payment.plan_code === "monthly" ? "monthly" : "";
    if (!plan) return json({ success: false, code: "PLAN_NOT_SUPPORTED", message: "Gói Pro không hợp lệ." }, 400);

    const expiresAt = addDays(plan === "annual" ? 365 : 30);
    const expiresAtDb = expiresAt + "T23:59:59.999Z";

    const productResult = await ctx.supabaseAdmin
      .from("products")
      .select("id")
      .eq("code", PRODUCT)
      .maybeSingle();

    if (productResult.error || !productResult.data) {
      return json({ success: false, code: "LICENSE_PRODUCT_NOT_FOUND", message: "Không tìm thấy sản phẩm License." }, 500);
    }

    const tempId = crypto.randomUUID();
    const initialPayload = {
      product: PRODUCT,
      licenseId: tempId,
      email: normalizeEmail(payment.email),
      plan,
      expiresAt,
    };
    const initialPayloadPart = base64UrlJson(initialPayload);
    const initialKey = "VSQR1." + initialPayloadPart + "." + await signLicense(initialPayloadPart);
    const initialHash = await sha256(initialKey);

    const { data: license, error: insertError } = await ctx.supabaseAdmin
      .from("licenses")
      .insert({
        id: tempId,
        product_id: productResult.data.id,
        payment_id: payment.id,
        license_key_hash: initialHash,
        email: normalizeEmail(payment.email),
        plan,
        status: "active",
        expires_at: expiresAtDb,
        max_devices: 1,
      })
      .select("id, email, plan, expires_at")
      .single();

    if (insertError || !license) {
      if (insertError?.code === "23505") {
        const { data: raced } = await ctx.supabaseAdmin
          .from("licenses")
          .select("id, email, plan, expires_at")
          .eq("payment_id", payment.id)
          .maybeSingle();
        if (raced) {
          const racedExpiresAt = String(raced.expires_at || "").slice(0, 10);
          const racedKey = await buildLicenseKey({
            id: raced.id,
            email: normalizeEmail(raced.email),
            plan: raced.plan,
            expiresAt: racedExpiresAt,
          });
          return json({ success: true, license: { licenseKey: racedKey.licenseKey, email: normalizeEmail(raced.email), plan: raced.plan, expiresAt: racedExpiresAt } });
        }
      }
      console.error("License insert failed:", insertError);
      return json({ success: false, code: "LICENSE_PERSIST_FAILED", message: "Không thể cấp License." }, 500);
    }

    // The license payload is signed using the inserted license ID, so replace the temporary record
    // with the final deterministic hash before returning the key.
    const finalKey = await buildLicenseKey({
      id: license.id,
      email: normalizeEmail(license.email),
      plan: license.plan,
      expiresAt,
    });

    const { error: hashUpdateError } = await ctx.supabaseAdmin
      .from("licenses")
      .update({ license_key_hash: finalKey.licenseKeyHash })
      .eq("id", license.id);

    if (hashUpdateError) {
      console.error("License hash update failed:", hashUpdateError);
      return json({ success: false, code: "LICENSE_PERSIST_FAILED", message: "Không thể hoàn tất License." }, 500);
    }

    return json({
      success: true,
      license: {
        licenseKey: finalKey.licenseKey,
        email: normalizeEmail(license.email),
        plan: license.plan,
        expiresAt,
      },
    });
  }),
};
