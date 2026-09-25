# Data Model

## Current Supabase model

The QR product currently uses these relevant tables:

### products

Defines products that can have licenses.

### licenses

Current known fields include:

- product_id
- license_key_hash
- email
- plan
- status
- expires_at
- max_devices
- created_at

License keys are stored as hashes rather than plaintext.

### activations

Current known fields include:

- license_id
- device_id
- activated_at
- last_seen_at
- deactivated_at
- activation_token_hash

Activation tokens are stored as hashes.

### qr_items

Cloud QR history associated with an authenticated user.

Current known fields include:

- user_id
- history_id
- type
- fields (JSONB)
- data
- design (JSONB)
- created_at
- updated_at
- deleted_at

## Data ownership rules

- Local history is client-side functionality and does not require an account.
- Cloud QR history belongs to an authenticated user.
- License state belongs to the licensing system and must be validated through the license boundary.
- Do not add a new persistence path for an existing concept without documenting why.

## Schema change rule

Before changing a table, column, relationship, RLS policy, or data contract:

1. update this document
2. perform impact analysis
3. identify backward compatibility requirements
4. update affected workflows/integrations
5. implement migration and tests
6. audit documentation after implementation

Do not infer that a database change is safe merely because the frontend still renders.

## Security note

The project has previously identified RLS/security hardening work around licensing tables, activation tables, and Supabase functions. Security behavior must be documented when changed and must not be weakened as a side effect of feature work.
