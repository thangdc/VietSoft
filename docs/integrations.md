# Integrations

## Supabase

Purpose:

- authentication
- cloud QR history
- licensing data
- server-side Edge Functions

Known project reference:

- Supabase project ref: `yatmdgjkljmaohdkvzkd`

Relevant Edge Functions:

- `create-license`
- `activate-license`
- `validate-license`
- `deactivate-license`

Rules:

- UI code should not duplicate Supabase access logic.
- Use the existing repository/service/integration boundary.
- Authentication and authorization are separate concerns.
- Never expose admin secrets in browser code.

## Licensing

Current flow:

```
User/license input
    ↓
activate-license
    ↓
license validation
    ↓
activation record
    ↓
activation token
    ↓
validate-license for ongoing validation
```

License validation includes product, email, status, expiry, and device constraints.

Any change to license rules must update:

- product entitlement documentation
- license workflow
- licensing integration
- data model when fields/semantics change

## Payment

ZaloPay is the intended payment provider direction. Approval/integration status may change and must be verified before implementation assumptions are made.

Payment must eventually distinguish:

- payment initiated
- pending
- successful
- failed/cancelled
- duplicate callback/event
- license creation/activation

Payment status must not be inferred solely from a client-side button click.

## Analytics

Analytics is used to understand product usage and conversion. Analytics instrumentation should be treated as an integration concern, not embedded business logic.

## Integration change rule

For any external integration change, document:

- purpose
- owner/boundary
- authentication
- request/response contract
- failure behavior
- retry/idempotency behavior
- affected workflows
- security considerations
