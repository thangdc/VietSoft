# VietSoft QR Code - Supabase Backend

Supabase project:

https://yatmdgjkljmaohdkvzkd.supabase.co

## Payment foundation

The payment backend is provider-oriented and currently prepared for ZaloPay.

### Database

Migration:

supabase/migrations/20260924181500_payment_foundation.sql

Tables:

- payment_products: server-side product/plan/price catalog.
- payments: one row per payment order.
- payment_events: callback/audit events.

The migration seeds the existing VietSoft QR Pro prices:

- monthly: 39,000 VND
- annual: 199,000 VND

### Edge Functions

- create-zalopay-payment: creates a ZaloPay order and returns the QR/order URL.
- zalopay-callback: validates the ZaloPay callback MAC and marks the payment paid.
- check-zalopay-payment: queries ZaloPay when callback delivery is delayed.

The create-order implementation follows ZaloPay's current API contract: Vietnam yymmdd transaction prefixes, HMAC-SHA256 with key1, and the QR multi-function payment method via VietQR.

### Required Supabase secrets

Set these only after ZaloPay approves the merchant integration:

- ZALOPAY_APP_ID
- ZALOPAY_KEY1
- ZALOPAY_KEY2
- ZALOPAY_CREATE_ORDER_URL
- ZALOPAY_QUERY_ORDER_URL
- ZALOPAY_CALLBACK_URL

Never commit ZaloPay keys or Supabase secret/service-role keys.

### Not included yet

This PR deliberately does not:

- modify the QR Generator UI.
- issue a License automatically after payment.
- deploy ZaloPay credentials.
- enable production payment.

The next step after ZaloPay approval is to configure the secrets, test sandbox callbacks/querying, then connect a successful payment to the existing VietSoft QR license issuance flow.
