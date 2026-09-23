# VietSoft QR Code - Supabase License Backend

Supabase project:

`https://yatmdgjkljmaohdkvzkd.supabase.co`

The browser does not need a Supabase service-role key.

## Existing Edge Functions

The three Edge Functions are created in the Supabase Dashboard:

- `activate-license`
- `validate-license`
- `deactivate-license`

They are called by `libs/custom/qr-code-license.js`.

Expected public endpoints:

- `/functions/v1/activate-license`
- `/functions/v1/validate-license`
- `/functions/v1/deactivate-license`

## Database

Run:

`supabase db push`

or apply:

`supabase/migrations/20260923113000_license_backend.sql`

The product code is **vietsoft-qr** and must match the product value used by the Edge Functions.

## Frontend activation flow

The QR Generator stores only local activation state:

- license key
- email
- device ID
- activation token

The license key itself is still verified locally with the existing Ed25519 public key.

After successful activation, the browser receives an activation token from Supabase. Subsequent Pro checks validate that token against the server.

No login/account is required.

## Important

Do not commit:

- Supabase service-role keys
- database passwords
- private signing keys

Only the public Supabase project URL and publishable key belong in browser code.
