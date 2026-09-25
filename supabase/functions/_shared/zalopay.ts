import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

export const PROVIDER = "zalopay";

export type PaymentProviderConfig = {
  appId: number;
  key1: string;
  key2: string;
  createOrderUrl: string;
  queryOrderUrl: string;
  callbackUrl: string;
};

export function json(data: Record<string, unknown>, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });
}

export function readConfig(): PaymentProviderConfig | null {
  const appId = Number(Deno.env.get("ZALOPAY_APP_ID") || "");
  const key1 = Deno.env.get("ZALOPAY_KEY1") || "";
  const key2 = Deno.env.get("ZALOPAY_KEY2") || "";
  const createOrderUrl = Deno.env.get("ZALOPAY_CREATE_ORDER_URL") || "";
  const queryOrderUrl = Deno.env.get("ZALOPAY_QUERY_ORDER_URL") || "";
  const callbackUrl = Deno.env.get("ZALOPAY_CALLBACK_URL") || "";

  if (!appId || !key1 || !key2 || !createOrderUrl || !queryOrderUrl || !callbackUrl) {
    return null;
  }

  return { appId, key1, key2, createOrderUrl, queryOrderUrl, callbackUrl };
}

export function createSupabaseHandler(
  handler: Parameters<typeof withSupabase>[1],
) {
  return {
    fetch: withSupabase({ auth: ["publishable", "secret"] }, handler),
  };
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export function normalizeEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function createOrderId(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
}

export async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index++) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

export function providerNotConfigured() {
  return json({
    success: false,
    code: "PAYMENT_PROVIDER_NOT_CONFIGURED",
    message: "ZaloPay chưa được cấu hình.",
  }, 503);
}

export function methodNotAllowed() {
  return json({ success: false, message: "Method Not Allowed." }, 405);
}

export function createOrderMac(
  config: PaymentProviderConfig,
  values: {
    appTransId: string;
    appUser: string;
    amount: number;
    appTime: number;
    embedData: string;
    item: string;
  },
): Promise<string> {
  const message = [
    config.appId,
    values.appTransId,
    values.appUser,
    values.amount,
    values.appTime,
    values.embedData,
    values.item,
  ].join("|");
  return hmacSha256Hex(message, config.key1);
}

export function queryOrderMac(
  config: PaymentProviderConfig,
  appTransId: string,
): Promise<string> {
  return hmacSha256Hex(`${config.appId}|${appTransId}|${config.key1}`, config.key1);
}

export function callbackMac(
  config: PaymentProviderConfig,
  data: string,
): Promise<string> {
  return hmacSha256Hex(data, config.key2);
}

export async function triggerLicenseIssuance(paymentId: string): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("License issuance trigger is not configured.");
    return;
  }

  try {
    const response = await fetch(supabaseUrl + "/functions/v1/issue-license-from-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": "Bearer " + serviceRoleKey,
      },
      body: JSON.stringify({ paymentId }),
    });
    if (!response.ok) {
      console.error("License issuance failed:", await response.text());
    }
  } catch (error) {
    console.error("License issuance trigger failed:", error);
  }
}

export function addPaymentEvent(
  supabase: any,
  paymentId: string,
  eventType: string,
  eventKey: string | null,
  payload: Record<string, unknown>,
) {
  return supabase.from("payment_events").insert({
    payment_id: paymentId,
    provider: PROVIDER,
    event_type: eventType,
    event_key: eventKey,
    payload,
  });
}
