import {
  createOrderId,
  createOrderMac,
  createSupabaseHandler,
  json,
  methodNotAllowed,
  normalizeEmail,
  providerNotConfigured,
  readConfig,
  readJson,
  PROVIDER,
} from "../_shared/zalopay.ts";

const DEFAULT_EXPIRE_SECONDS = Number(Deno.env.get("PAYMENT_ORDER_EXPIRE_SECONDS") || "900");

export default createSupabaseHandler(async (req, ctx) => {
  if (req.method === "OPTIONS") return json({ success: true });
  if (req.method !== "POST") return methodNotAllowed();

  const config = readConfig();
  if (!config) return providerNotConfigured();

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

  const mac = await createOrderMac(config, { appTransId, appUser, amount, appTime, embedData, item });
  const form = new URLSearchParams({
    app_id: String(config.appId),
    app_user: appUser,
    app_trans_id: appTransId,
    app_time: String(appTime),
    amount: String(amount),
    description: product.name,
    callback_url: config.callbackUrl,
    item,
    embed_data: embedData,
    bank_code: "",
    expire_duration_seconds: String(expireSeconds),
    mac,
  });

  const response = await fetch(config.createOrderUrl, {
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
});