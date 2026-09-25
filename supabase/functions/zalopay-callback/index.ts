import { createClient } from "npm:@supabase/supabase-js@2";
import {
  addPaymentEvent,
  callbackMac,
  json,
  readConfig,
  readJson,
  safeEqual,
  PROVIDER,
  triggerLicenseIssuance,
} from "../_shared/zalopay.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ return_code: 0, return_message: "Method Not Allowed." }, 405);

  const config = readConfig();
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!config || !supabaseUrl || !serviceRoleKey) {
    return json({ return_code: 0, return_message: "Callback not configured." }, 503);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const body = await readJson(req);
  const data = String(body.data ?? "");
  const mac = String(body.mac ?? "");

  if (!data || !mac) return json({ return_code: 0, return_message: "Invalid callback payload." }, 400);

  const expectedMac = await callbackMac(config, data);
  if (!safeEqual(mac.toLowerCase(), expectedMac.toLowerCase())) {
    return json({ return_code: 0, return_message: "Invalid MAC." }, 403);
  }

  let callback: Record<string, unknown>;
  try {
    const parsed = JSON.parse(data);
    callback = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return json({ return_code: 0, return_message: "Invalid callback data." }, 400);
  }

  const appTransId = String(callback.app_trans_id ?? "");
  const amount = Number(callback.amount ?? 0);
  const zpTransId = String(callback.zp_trans_id ?? "");

  if (!appTransId || !amount || !zpTransId) {
    return json({ return_code: 0, return_message: "Incomplete callback data." }, 400);
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, amount, status")
    .eq("provider", PROVIDER)
    .eq("provider_order_id", appTransId)
    .maybeSingle();

  if (paymentError || !payment) {
    console.error("Payment lookup failed:", paymentError);
    return json({ return_code: 0, return_message: "Order not found." }, 404);
  }

  await addPaymentEvent(supabase, payment.id, "callback", zpTransId, callback);

  if (payment.status === "paid") {
    await triggerLicenseIssuance(payment.id);
    return json({ return_code: 1, return_message: "success" });
  }

  if (Number(payment.amount) !== amount) {
    return json({ return_code: 0, return_message: "Amount mismatch." }, 400);
  }

  const { error: updateError } = await supabase
    .from("payments")
    .update({
      status: "paid",
      provider_transaction_id: zpTransId,
      paid_at: new Date().toISOString(),
      provider_response: callback,
    })
    .eq("id", payment.id)
    .eq("status", "pending");

  if (updateError) {
    console.error("Payment update failed:", updateError);
    return json({ return_code: 0, return_message: "Could not persist payment." }, 500);
  }

  await triggerLicenseIssuance(payment.id);
  return json({ return_code: 1, return_message: "success" });
});