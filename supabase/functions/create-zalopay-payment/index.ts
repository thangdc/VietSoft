import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const PROVIDER = "zalopay";
const DEFAULT_EXPIRE_SECONDS = 900;

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

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function vietnamDatePrefix(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "2-digit", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const values = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${values.year}${values.month}${values.day}`;
}

function normalizeEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function createOrderId(): string {
  return `${vietnamDatePrefix()}_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
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
    if (req.method === "OPTIONS") return json({ success: true });
    if (req.method !== "POST") return json({ success: false, message: "Method Not Allowed." }, 405);

    const appId = Number(Deno.env.get("ZALOPAY_APP_ID") || "");
    const key1 = Deno.env.get("ZALOPAY_KEY1") || "";
    const createOrderUrl = Deno.env.get("ZALOPAY_CREATE_ORDER_URL") || "";
    const callbackUrl = Deno.env.get("ZALOPAY_CALLBACK_URL") || "";

    if (!appId || !key1 || !createOrderUrl || !callbackUrl) {
      return json({ success: false, code: "PAYMENT_PROVIDER_NOT_CONFIGURED", message: "ZaloPay chưa được cấu hình." }, 503);
    }

    const body = await readJson(req);
    const productCode = String(body.productCode ?? "").trim();
    const planCode = String(body.planCode ?? "").trim();
    const email = normalizeEmail(body.email);

    if (!productCode || !planCode || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ success: false, code: "INVALID_REQUEST", message: "Product, plan và email hợp lệ là bắt buộc." }, 400);
    }

    const { data: product, error: productError } = await ctx.supabaseAdmin
      .from("payment_products")
      .select("product_code, plan_code, name, amount, currency")
      .eq("product_code", productCode)
      .eq("plan_code", planCode)
      .eq("active", true)
      .maybeSingle();

    if (productError || !product) {
      return json({ success: false, code: "PAYMENT_PRODUCT_NOT_FOUND", message: "Gói thanh toán không tồn tại hoặc đã ngừng bán." }, 400);
    }

    const appUser = `vietsoft:${email}`.slice(0, 50);
    const appTransId = createOrderId();
    const appTime = Date.now();
    const amount = Number(product.amount);
    const expireSeconds = Math.min(Math.max(Number(body.expireSeconds) || DEFAULT_EXPIRE_SECONDS, 300), 2592000);
    const item = JSON.stringify([{ itemid: `${productCode}-${planCode}`, itename: product.name, itemprice: amount, itemquantity: 1 }]);
    const embedData = JSON.stringify({
      preferred_payment_method: ["vietqr"],
      merchantinfo: JSON.stringify({ payment_id: appTransId, product_code: productCode, plan_code: planCode, email }),
    });

    const macInput = [appId, appTransId, appUser, amount, appTime, embedData, item].join("|");
    const mac = await hmacSha256Hex(macInput, key1);

    const form = new URLSearchParams();
    form.set("app_id", String(appId));
    form.set("app_user", appUser);
    form.set("app_trans_id", appTransId);
    form.set("app_time", String(appTime));
    form.set("amount", String(amount));
    form.set("description", product.name);
    form.set("callback_url", callbackUrl);
    form.set("item", item);
    form.set("embed_data", embedData);
    form.set("bank_code", "");
    form.set("expire_duration_seconds", String(expireSeconds));
    form.set("mac", mac);

    const response = await fetch(createOrderUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const providerResponse = await response.json().catch(() => ({}));

    if (!response.ok || Number(providerResponse.return_code) !== 1) {
      console.error("ZaloPay create order failed:", providerResponse);
      return json({ success: false, code: "PAYMENT_PROVIDER_ERROR", message: "Không thể tạo giao dịch ZaloPay." }, 502);
    }

    const expiresAt = new Date(Date.now() + expireSeconds * 1000).toISOString();
    const { data: payment, error: insertError } = await ctx.supabaseAdmin
      .from("payments")
      .insert({
        provider: PROVIDER,
        provider_order_id: appTransId,
        product_code: productCode,
        plan_code: planCode,
        email,
        amount,
        currency: product.currency,
        status: "pending",
        qr_code: providerResponse.qr_code ?? null,
        order_url: providerResponse.order_url ?? null,
        provider_response: providerResponse,
        expires_at: expiresAt,
      })
      .select("id, provider_order_id, amount, currency, status, qr_code, order_url, expires_at")
      .single();

    if (insertError || !payment) {
      console.error("Payment insert failed:", insertError);
      return json({ success: false, code: "PAYMENT_PERSIST_FAILED", message: "Không thể lưu giao dịch." }, 500);
    }

    return json({ success: true, payment });
  }),
};
