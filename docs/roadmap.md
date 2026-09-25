# VietSoft QR — Product Roadmap

## Purpose
Approved implementation sequence. Roadmap defines order and gates; GitHub Issues/PRs provide execution evidence.

## Status
Use: `PLANNED`, `READY`, `IN_PROGRESS`, `BLOCKED`, `DONE`.

## Phase 0 — Current State Discovery
**Status:** DONE

## Phase 1 — Documentation & Architecture Foundation
**Status:** DONE

Goal: prevent AI-assisted development from guessing architecture, workflow, ownership, or product intent.

GitHub execution: PR #175.

## Phase 2 — UI Foundation & Minimal Utility
**Status:** IN_PROGRESS

Goal: establish the new presentation system before stabilizing workflow behavior on top of it.

Scope:
- Minimal Utility design tokens and shared primitives.
- Desktop two-column generator/result.
- Mobile Type → Input → Generate → Result → Customize → Actions.
- Shared Result Surface.
- Progressive customization disclosure.
- Row-oriented history.
- Contextual Pro gates.
- Incremental removal of presentation-only legacy shell/CSS.

Exit criteria:
- UI Blueprint v1 is implemented as the presentation target.
- Shared components replace one-off visual patterns.
- 360 / 390 / 768 / desktop have no page-level horizontal overflow.
- Existing workflow boundaries remain intact.
- No duplicate QR/payment/license/history implementation.

## Phase 3 — Workflow Stabilization on New UI
**Status:** READY

Goal: make the core QR workflow predictable using the new presentation system.

Scope:
- Query-string type/state.
- QR generation and result restoration.
- History by QR type/template and full row restore.
- Design persistence/restoration.
- Excel import/export compatibility.
- Print output.
- Payment QR correctness.
- Loading/empty/error/success states.
- End-to-end regression.

Issues #176–#185 are treated as Phase 3 execution items unless explicitly superseded.

Exit criteria:
- Supported QR workflows are consistent.
- Refresh preserves intended state.
- History restores inputs/design.
- Import/export stays compatible.
- Print contains only intended QR output.
- No known console errors in affected flows.

## Phase 4 — Free / Pro / Payment / License
**Status:** PLANNED

Scope: Free/Pro matrix, Pro gates, auth where required, license lifecycle, cloud history/sync, payment provider/server verification, email receipt/key delivery, expiry reminders, and clear payment/license states.

## Phase 5 — SEO / Conversion / Growth
**Status:** PLANNED

Scope: search-intent landing pages, QR-type SEO, internal links, structured metadata, analytics/conversion funnel, Free → Pro conversion points, and Search Console/GA4-driven content.

## Phase 6 — Security / Reliability / Operational Hardening
**Status:** PLANNED

Scope: Supabase RLS, SECURITY DEFINER review, password protection, Edge Function authorization/abuse controls, payment/license auditability, monitoring/diagnostics, and recovery.

## Phase gates
A phase is DONE only when scope is implemented/descoped, exit criteria verified, docs updated, validation evidence exists, and no critical conflict remains.

## AI execution rule
1. Identify roadmap phase.
2. Read source-of-truth documents.
3. Check prerequisites/gates.
4. Perform impact analysis.
5. Implement approved scope only.
6. Validate.
7. Update docs.
8. Link PR/Issue.

If requested work conflicts with the roadmap, surface the conflict instead of silently changing direction.
