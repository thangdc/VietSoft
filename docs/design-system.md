# Design System

## Goal

Provide one consistent visual and interaction language across desktop, tablet, and mobile for the QR Code Generator.

The approved visual direction is **Minimal Utility**: content-first, restrained, readable, fast to scan, and consistent across every QR type. The UI should feel like a tool, not a marketing dashboard.

## Design principles

- Content first: the QR workflow is the primary interface.
- Minimal Utility: neutral surfaces, subtle borders, one restrained blue accent.
- Prefer typography, spacing, and hierarchy over decoration.
- No gradients, glassmorphism, heavy shadows, excessive cards, icon overload, or QR-type-specific visual systems.
- Do not copy a third-party theme; use the product's own tokens and shared components.
- One shared behavior pattern should serve all QR types.
- Existing business/workflow logic remains owned by the application/domain/integration boundaries; presentation code must not duplicate it.

## Target information architecture

### Desktop

Primary generator:

```
Header
  ↓
Page title / short description
  ↓
QR type selector
  ↓
┌──────────────────────┬──────────────────────┐
│ Input / configuration │ Preview / result     │
│                      │                      │
│ Generate             │ QR preview           │
│ Clear                │ Status               │
│                      │ Actions              │
└──────────────────────┴──────────────────────┘
  ↓
Recent history
```

Secondary SEO/help content remains below the application and must not compete visually with the generator.

### Mobile

The layout is a workflow reflow, not a shrunken desktop:

**Type → Input → Generate → Result → Customize → Actions → History**

No horizontal scrolling.

## QR type selector

Use one shared selector for all QR types:

- URL
- Văn bản
- Liên hệ
- Wi-Fi
- Email
- Điện thoại
- SMS
- Vị trí
- Thanh toán

Rules:

- Same visual treatment for every type.
- Active state uses accent color and/or subtle surface change, not a decorative left border.
- Icons are optional and secondary to readable labels.
- On narrow screens the selector may scroll horizontally, but the page itself must not overflow.
- Changing type must preserve the documented query-string state behavior.

## Generator surface

The generator surface contains only the fields needed for the selected QR type plus the primary actions.

Rules:

- One clear form title.
- Labels are always visible.
- Validation appears next to the relevant field or in the shared form status area.
- Primary action is visually dominant.
- Clear/reset is secondary.
- Do not embed unrelated Pro upsell content inside the form.

## Result surface

There is exactly one shared Result Surface for every QR type.

States:

1. Empty — "QR Code sẽ xuất hiện ở đây."
2. Generating — progress/loading state.
3. Generated — QR + status + actions.
4. Error — actionable recovery message.

Generated state:

```
Kết quả

        [ QR ]

✓ QR đã được tạo

[Tải PNG] [Sao chép] [Mở ảnh]

Tùy chỉnh QR ▾
```

Customization is progressive disclosure. It is not a separate page or primary tab.

## Customization

Customization is shared across QR types.

Default state: collapsed after generation.

Expanded controls may include:

- foreground/background color
- QR style
- logo
- size
- error correction

Rules:

- Use the same control patterns everywhere.
- Changing customization updates the current result; it must not create a parallel generation workflow.
- Design state must follow the documented persistence/restore contract.
- Keep advanced controls hidden until requested.

## History

History is a secondary workflow, not part of the primary input form.

Each history item should communicate:

- QR preview/thumbnail
- QR type
- useful identifying content
- timestamp
- selection state when batch operations are active

Rules:

- Clicking the row restores the QR record.
- Avoid per-row action-button clutter.
- Destructive actions use the shared confirmation pattern.
- Search, sort, paging, import/export, ZIP, and print remain workflow capabilities; their UI should not redefine the generator's visual language.
- Empty/loading/error/sync states use shared components.

## Pro gates

Pro should be communicated at the point of a gated action.

Rules:

- Do not visually mark the entire application as "Pro".
- Gated actions use a consistent Pro treatment.
- The gate explains what the action unlocks and provides a clear next step.
- Payment/license authority remains outside presentation code.

## Design tokens

### Color

Use semantic tokens rather than page-specific hex values.

- `--color-bg`: page background
- `--color-surface`: primary surface
- `--color-surface-muted`: secondary surface
- `--color-border`: default border
- `--color-border-strong`: emphasized border
- `--color-text`: primary text
- `--color-text-muted`: secondary text
- `--color-text-subtle`: tertiary text
- `--color-primary`: primary blue accent
- `--color-primary-hover`: accent hover
- `--color-success`
- `--color-warning`
- `--color-danger`

Initial direction: neutral grayscale + blue accent. Do not introduce additional accent palettes without a documented reason.

### Spacing

Use a small spacing scale instead of arbitrary per-component values.

Recommended base: 4px.

- 4
- 8
- 12
- 16
- 20
- 24
- 32
- 40
- 48

### Radius

Prefer restrained radius:

- small controls: 6px
- cards/surfaces: 8px
- dialogs: 10px
- pill shapes only when semantics require them (for example status/badge).

### Typography

- Clear hierarchy through size and weight.
- Body text must remain readable at mobile widths.
- Avoid all-caps for ordinary labels.
- Kicker/eyebrow text is optional and should not dominate content.

### Shadows

Default: none or very subtle elevation.

Do not use shadows to compensate for weak hierarchy.

## Shared components

The UI foundation should establish reusable patterns for:

- Page shell
- Header/account area
- Type selector
- Form field
- Input / textarea
- Select
- Checkbox / radio
- Button
- Status/alert
- QR preview
- Result surface
- Customize disclosure
- History item
- Empty state
- Loading state
- Error state
- Dialog/modal
- Pro gate
- Toast/notification

A component is shared when the same semantic interaction occurs in multiple places. Do not create generic components merely for abstraction's sake.

## Component states

Every interactive component must define applicable states:

- idle
- hover
- focus-visible
- active/selected
- disabled
- loading
- success
- validation error
- system error

Focus-visible must remain keyboard accessible.

Loading actions must prevent duplicate submissions.

## Workflow state contract

The visual layer reflects, but does not own, workflow state.

Generator target states:

**Idle → Editing → Validating → Generating → Generated → Persisting/Saved**

Recoverable error states must return the user to an actionable prior state.

History target states include:

**Loading → Empty / Loaded → Restoring → Loaded**

and where applicable:

**Syncing → Synced / Sync Error**

## Responsive contract

Required validation widths:

- 360px
- 390px
- 768px
- desktop

Rules:

- no page-level horizontal overflow
- controls remain touch-friendly
- primary actions remain reachable
- dialogs fit the viewport
- QR remains square and visually clear
- desktop two-column layout collapses into the mobile workflow
- do not maintain separate desktop/mobile implementations of the same behavior

## Legacy coexistence rules

The current page still contains Bootstrap/AdminLTE-era shell and CSS alongside the `vs-*` QR UI.

During redesign:

1. Do not rewrite workflow logic merely to change presentation.
2. Do not add another CSS patch layer to override an old patch.
3. Extract or replace the presentation surface deliberately.
4. Keep existing IDs/data hooks stable where practical until the corresponding behavior is migrated and regression-tested.
5. Remove obsolete legacy styling only after its consumers are migrated.

## Current implementation mapping

The current implementation already contains important behavior that should be reused rather than duplicated:

- `libs/custom/qr-code-v2.js`: QR types, field rendering, validation, generation, history, customization, import/export, print and related UI event wiring.
- `libs/custom/qr-history-repository.js`: history persistence boundary.
- `libs/custom/qr-cloud-history.js` / `qr-sync-engine.js`: cloud history/sync boundaries.
- `libs/custom/qr-code-license.js`: license boundary.
- `libs/custom/qr-code-payment.js`: payment boundary.
- `qr-code-generator.html`: current presentation shell and semantic hooks.

These modules are not permission to preserve their current UI structure. The redesign may change presentation while preserving their ownership boundaries.

## UI blueprint reference

See `docs/ui-blueprint-v1.md` for the approved first-pass screen structure and implementation boundaries.

## Redesign rule

Do not keep layering patches onto the legacy UI indefinitely.

**Tokens → shared components → presentation structure → reconnect existing behavior → regression → remove obsolete CSS**

A visual change is not complete if it creates a second interaction pattern for an existing workflow.
