import {
  createSupabaseHandler,
  json,
  methodNotAllowed,
  providerNotConfigured,
  queryOrderMac,
  readConfig,
  readJson,
  PROVIDER,
  triggerLicenseIssuance,
} from "../_shared/zalopay.ts";

export default createSupabaseHandler(async (req, ctx) => {
  if (req.method === "OPTIONS") return json({ success: true });
  if (req.method !== "POST") return methodNotAllowed();

  const config = readConfig();
  if (!config) return providerNotConfigured();

  const body = await readJson(req);
  const paymentId = String(body.paymentId ?? "").trim();

  if (!paymentId) return json({ success: false, code: "INVALID_REQUEST", message: "paymentId là bắt buộc." }, 400);

  const { data: payment, error: paymentError } = await ctx.supabaseAdmin
    .from("payments")
    .select("id, provider_order_id, status, amount, currency, product_code, plan_code, email, expires_at")
    .eq("id", paymentId)
    .eq("provider", PROVIDER)
    .maybeSingle();

  if (paymentError || !payment) return json({ success: false, code: "PAYMENT_NOT_FOUND", message: "Không tìm thấy giao dịch." }, 404);
  if (payment.status === "paid") {
    await triggerLicenseIssuance(payment.id);
    return json({ success: true, payment });
  }

  const appTransId = payment.provider_order_id;
  const mac = await queryOrderMac(config, appTransId);
  const form = new URLSearchParams({
    app_id: String(config.appId),
    app_trans_id: appTransId,
    mac,
  });

  const response = await fetch(config.queryOrderUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const providerResponse = await response.json().catch(() => ({}));

  if (!response.ok) {
    return json({ success: false, code: "PAYMENT_PROVIDER_ERROR", message: "Không thể kiểm tra giao dịch." }, 502);
  }

  if (Number(providerResponse.return_code) === 1) {
    const providerAmount = Number(providerResponse.amount ?? 0);
    const providerTransactionId = String(providerResponse.zp_trans_id ?? "");

    if (providerAmount !== Number(payment.amount)) {
      return json({ success: false, code: "PAYMENT_AMOUNT_MISMATCH", message: "Số tiền giao dịch không khớp." }, 409);
    }

    const { error: updateError } = await ctx.supabaseAdmin
      .from("payments")
      .update({
        status: "paid",
        provider_transaction_id: providerTransactionId || null,
        paid_at: new Date().toISOString(),
        provider_response: providerResponse,
      })
      .eq("id", payment.id)
      .eq("status", "pending");

    if (updateError) return json({ success: false, code: "PAYMENT_PERSIST_FAILED", message: "Không thể lưu trạng thái thanh toán." }, 500);
    await triggerLicenseIssuance(payment.id);
  }

  const { data: refreshed } = await ctx.supabaseAdmin
    .from("payments")
    .select("id, provider_order_id, status, amount, currency, product_code, plan_code, email, expires_at")
    .eq("id", payment.id)
    .single();

  return json({
    success: true,
    payment: refreshed,
    provider: {
      returnCode: providerResponse.return_code ?? null,
      returnMessage: providerResponse.return_message ?? null,
      isProcessing: providerResponse.is_processing ?? null,
    },
  });
});