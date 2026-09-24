import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const PROVIDER = "zalopay";

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
    const queryOrderUrl = Deno.env.get("ZALOPAY_QUERY_ORDER_URL") || "";

    if (!appId || !key1 || !queryOrderUrl) {
      return json({ success: false, code: "PAYMENT_PROVIDER_NOT_CONFIGURED", message: "ZaloPay chưa được cấu hình." }, 503);
    }

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
    if (payment.status === "paid") return json({ success: true, payment });

    const appTransId = payment.provider_order_id;
    const mac = await hmacSha256Hex(`${appId}|${appTransId}|${key1}`, key1);

    const form = new URLSearchParams();
    form.set("app_id", String(appId));
    form.set("app_trans_id", appTransId);
    form.set("mac", mac);

    const response = await fetch(queryOrderUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const providerResponse = await response.json().catch(() => ({}));

    if (!response.ok) return json({ success: false, code: "PAYMENT_PROVIDER_ERROR", message: "Không thể kiểm tra giao dịch." }, 502);

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
  }),
};
