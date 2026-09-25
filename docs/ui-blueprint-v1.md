# UI Blueprint v1 — Minimal Utility

## Purpose
Target-state presentation structure for `qr-code-generator.html`, based on inspection of the current HTML and `libs/custom/qr-code-v2.js`. This does not change QR business rules, payment, licensing, persistence, or data contracts.

## Desktop
```
Header
  ↓
Tạo mã QR + short description
  ↓
QR type selector
  ↓
┌──────────────────────────┬───────────────────────────┐
│ Input / configuration    │ Result                    │
│ fields                   │ QR preview                │
│ Generate / Clear         │ status                    │
│                          │ Download / Copy / Open    │
│                          │ Customize ▾               │
└──────────────────────────┴───────────────────────────┘
  ↓
Recent history
  ↓
Supporting SEO/help content
```

## Mobile
```
Tạo mã QR
[ URL ▾ ]
Fields
[ Tạo mã QR ]
Kết quả
[ QR ]
✓ QR đã được tạo
[ Tải PNG ]
[ Sao chép ] [ Mở ảnh ]
Tùy chỉnh QR ▾
Lịch sử gần đây
```

Flow: **Type → Input → Generate → Result → Customize → Actions → History**

## Component hierarchy
- AppShell
  - Header
  - GeneratorPage
    - PageIntro
    - QrTypeSelector
    - GeneratorLayout
      - GeneratorForm
      - ResultSurface
        - QrPreview
        - ResultStatus
        - ResultActions
        - CustomizeDisclosure
    - HistorySection
      - HistoryToolbar
      - HistoryList
      - HistoryItem
    - SupportingContent

## Result Surface
One shared surface for every QR type.

States:
- Empty: concise placeholder.
- Generating: stable dimensions, progress, duplicate-submit prevention.
- Generated: square QR, success status, download/copy/open, collapsed customization.
- Error: user-readable explanation, valid input retained, actionable recovery.

## Customization
Collapsed by default. Keep QR visible while editing. Use shared controls. No separate page/tab.

## History
Secondary to creation. Each row communicates thumbnail, type, useful identifying content, timestamp. Preferred action: **click row → restore fields + design + result**. Batch controls appear contextually.

## Pro
Gate at attempted Pro actions such as Import Excel, Export Excel/ZIP, and Print multiple QR. Core create/download remains free-first.

## Current-code mapping
Reuse behavior boundaries in:
- `libs/custom/qr-code-v2.js`
- `qr-history-repository.js`
- `qr-cloud-history.js`
- `qr-sync-engine.js`
- `qr-code-license.js`
- `qr-code-payment.js`

Presentation may be refactored, but these remain owners of their respective behavior.

## Migration sequence
1. Tokens.
2. Shared button/input/status/result primitives.
3. New shell and generator layout.
4. Reconnect fields.
5. Reconnect generation/result.
6. Reconnect customization.
7. Reconnect history.
8. Reconnect Pro/import/export/print.
9. Mobile reflow.
10. Remove obsolete CSS after regression.
11. End-to-end validation.

## Non-goals
Do not change QR encoding/data contracts, Excel templates, payment verification semantics, license authority, Supabase ownership, or analytics event meaning.

## Acceptance criteria
- Minimal Utility direction is consistent.
- Desktop has clear Input/Result hierarchy.
- Mobile follows the approved workflow.
- One Result Surface is shared.
- Customization is progressive disclosure.
- History is secondary and row-oriented.
- Pro gates are contextual.
- No page-level horizontal overflow at 360/390/768/desktop.
- No parallel QR/history/payment/license implementation.
