import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const PROVIDER = "zalopay";

function json(data: Record<string, unknown>, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i++) result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return result === 0;
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ return_code: 0, return_message: "Method Not Allowed." }, 405);

  const key2 = Deno.env.get("ZALOPAY_KEY2") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  const legacyServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!key2 || !supabaseUrl || (!secretKeys && !legacyServiceRoleKey)) {
    return json({ return_code: 0, return_message: "Callback not configured." }, 503);
  }

  const serviceRoleKey = legacyServiceRoleKey || JSON.parse(secretKeys!)["default"];
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const body = await readJson(req);
  const data = String(body.data ?? "");
  const mac = String(body.mac ?? "");

  if (!data || !mac) return json({ return_code: 0, return_message: "Invalid callback payload." }, 400);

  const expectedMac = await hmacSha256Hex(data, key2);
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

  await supabase.from("payment_events").insert({
    payment_id: payment.id,
    provider: PROVIDER,
    event_type: "callback",
    event_key: zpTransId,
    payload: callback,
  });

  if (payment.status === "paid") return json({ return_code: 1, return_message: "success" });

  if (Number(payment.amount) !== amount) {
    console.error("Payment amount mismatch:", { paymentId: payment.id, expected: payment.amount, received: amount });
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

  return json({ return_code: 1, return_message: "success" });
});
