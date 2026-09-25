# Product — VietSoft QR

## Product purpose

VietSoft QR is a web-based QR code generator focused on making common QR creation, customization, history, import/export, printing, and future Pro workflows simple and reliable.

## Supported QR types

Current product scope includes:

- URL
- Text
- Contact
- Wi-Fi
- Email
- Phone
- SMS
- Location
- Payment / VietQR

The exact field contract for each type belongs to the implementation and workflow documentation. Do not invent fields when changing a QR type.

## Product principles

1. **Reliable first** — existing QR generation must continue to work while UI is redesigned.
2. **Mobile first** — mobile is a first-class workflow, not a compressed desktop layout.
3. **Consistent** — common actions, states, forms, dialogs, errors, and history use shared patterns.
4. **Simple entry** — generating a QR should not require an account.
5. **Progressive account requirement** — authentication is introduced when cloud/protected functionality actually requires it.
6. **Clear Free/Pro boundary** — entitlement rules are centralized rather than implemented ad hoc in buttons.
7. **No duplicate business logic** — QR generation, history, licensing, and integrations have explicit ownership.
8. **Documentation is part of the product engineering process** — behavior changes update the source of truth.

## Current monetization direction

The current direction is to keep basic QR creation broadly accessible and monetize workflows that provide ongoing value, such as multi-item operations, cloud history/sync, and Pro licensing.

The exact entitlement matrix must be maintained separately and must be updated whenever an entitlement changes.

## Current-state vs target-state

Current implementation contains legacy UI and incremental features. Redesign must preserve documented behavior unless a requirement explicitly changes it.

Target direction:

- mobile-first responsive UI
- shared design system
- stable explicit UI states
- centralized Pro/entitlement checks
- clean separation between UI, QR behavior, repositories/services, and external integrations
- documented workflows and change impact
