# VietSoft QR Code - Supabase Backend

Supabase project:

https://yatmdgjkljmaohdkvzkd.supabase.co

## Payment foundation

The payment backend is provider-oriented and currently prepared for ZaloPay.

### Database

Migration:

supabase/migrations/20260924181500_payment_foundation.sql

Tables:

- payment_products: server-side product/plan/price catalog. Product rows are managed separately from the schema migration so prices are not hardcoded in source.
- payments: one row per payment order.
- payment_events: callback/audit events.

### Edge Functions

- create-zalopay-payment: creates a ZaloPay order and returns the QR/order URL.
- zalopay-callback: validates the ZaloPay callback MAC and marks the payment paid.
- check-zalopay-payment: queries ZaloPay when callback delivery is delayed.

Shared ZaloPay helpers live in:

supabase/functions/_shared/zalopay.ts

The create-order implementation follows ZaloPay's API contract: Vietnam transaction prefixes, HMAC-SHA256 signing, and QR multi-function payment configuration.

### Required Supabase secrets

Set these only after ZaloPay approves the merchant integration:

- ZALOPAY_APP_ID
- ZALOPAY_KEY1
- ZALOPAY_KEY2
- ZALOPAY_CREATE_ORDER_URL
- ZALOPAY_QUERY_ORDER_URL
- ZALOPAY_CALLBACK_URL
- PAYMENT_ORDER_EXPIRE_SECONDS (optional; defaults to 900 seconds)

Never commit ZaloPay keys or Supabase secret/service-role keys.

### Product configuration

Payment amounts and product names belong in payment_products, not in Edge Function source code.

Product configuration contains:

- product_code
- plan_code
- name
- amount
- currency
- active

This keeps payment infrastructure independent from VietSoft QR pricing.

### Not included yet

This foundation deliberately does not:

- modify the QR Generator UI.
- issue a License automatically after payment.
- deploy ZaloPay credentials.
- enable production payment.

The next step after ZaloPay approval is to configure product rows and provider secrets, test sandbox callbacks/querying, then connect a successful payment to the existing license issuance flow.
