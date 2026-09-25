# VietSoft QR — Product Roadmap

This roadmap defines the approved implementation sequence for the QR Code Generator. GitHub Issues and Projects track execution.

## How to use
- Roadmap = why, what, order, prerequisites, and exit criteria.
- GitHub Issues = specific implementation tasks.
- GitHub Project = execution status and visibility.
- PRs = implementation and review evidence.
- Do not pull work from a later phase forward silently; update the roadmap and impact analysis first.

## Status
Use: `PLANNED`, `READY`, `IN_PROGRESS`, `BLOCKED`, `DONE`.

## Phase 0 — Current State Discovery
**Status:** DONE

Goal: establish a reliable understanding of the existing product before structural changes.

Exit criteria:
- Current behavior is documented.
- Current-vs-target gaps are explicit.
- AI agents have a documented source of truth.

## Phase 1 — Documentation & Architecture Foundation
**Status:** IN_PROGRESS

Goal: prevent AI-assisted development from guessing architecture, workflow, ownership, or product intent.

Scope:
- Documentation source of truth.
- Architecture and data model.
- Integration ownership.
- Workflow definitions.
- Design-system rules.
- AI change governance.
- Roadmap and GitHub execution mapping.

Exit criteria:
- `/docs` governance is merged.
- `CLAUDE.md` and `AGENTS.md` point AI agents to governance.
- Every behavior-changing task can identify affected docs and roadmap phase.
- No known critical documentation conflict remains unresolved.

GitHub execution:
- PR #175 — documentation and AI governance foundation.

## Phase 2 — Workflow Stabilization
**Status:** READY

Goal: make the core QR workflow predictable before major visual redesign or monetization expansion.

Scope:
- Query-string type/state handling.
- QR generation and result restoration.
- History by QR type/template.
- History row → full restore.
- Design persistence/restoration.
- Import/export and existing template compatibility.
- Print output.
- Payment QR generation correctness.
- Loading, empty, error, and success states.

Exit criteria:
- Core workflows are consistent across supported QR types.
- Refresh preserves intended state.
- History restores inputs and design correctly.
- Import/export remains compatible.
- Print contains only intended QR output.
- No known console errors in affected flows.

Gate: do not expand monetization until core workflow behavior is stable.

## Phase 3 — Design System & Responsive UX
**Status:** PLANNED

Goal: replace incremental CSS patching with a coherent mobile-first product UI.

Scope:
- Shared design tokens/components.
- Mobile flow: Type → Input → Generate → Result → Customize → Save/Download/Share.
- Desktop two-column Input/Preview.
- 360 / 390 / 768 / desktop layouts.
- Modal, form, tab, result, history, and customization states.
- No horizontal overflow.

Exit criteria:
- Supported breakpoints pass.
- QR is never distorted.
- Shared components replace page-specific duplicates.
- Stabilized workflows remain functional.
- No major CSS patch chain is required.

## Phase 4 — Free / Pro / Payment / License
**Status:** PLANNED

Goal: create a reliable paid workflow without breaking the free experience.

Scope:
- Explicit Free vs Pro capability matrix.
- Pro gating.
- Account/login only where required.
- License activation/validation/deactivation.
- Cloud history/sync for Pro.
- Payment provider integration and server-side verification.
- Email receipt/key delivery.
- Expiry reminders.
- Clear payment and license states.

Exit criteria:
- Free/Pro rules are defined in one place.
- Client UI does not determine payment success.
- License state is server-validated.
- Payment, activation, expiry, and error states are testable.
- Customer has a deterministic purchase/key flow.

## Phase 5 — SEO / Conversion / Growth
**Status:** PLANNED

Goal: increase qualified organic traffic and convert relevant users into Pro users.

Scope:
- Search-intent-driven landing pages.
- QR-type/tool SEO.
- Internal linking.
- Structured metadata where useful.
- Analytics events and conversion funnel.
- Free → Pro conversion points.
- Search Console/GA4-driven content strategy.
- Help content supporting activation and conversion.

Exit criteria:
- Key conversion events are measurable.
- Landing pages map to explicit search intent.
- SEO work is tied to product workflows, not traffic alone.
- Pro conversion funnel has measurable steps.

## Phase 6 — Security / Reliability / Operational Hardening
**Status:** PLANNED

Goal: harden backend security and operational reliability after product workflows and monetization contracts are stable.

Scope:
- Supabase RLS policies.
- SECURITY DEFINER exposure review.
- Password protection configuration.
- Edge Function authorization and abuse controls.
- Payment/license auditability.
- Error monitoring and operational diagnostics.
- Backup/recovery considerations.

Exit criteria:
- Sensitive tables have explicit reviewed access policies.
- Privileged functions have explicit authorization boundaries.
- Payment/license operations are auditable.
- Critical failure paths have observable diagnostics.

## Phase gates
A phase moves to `DONE` only when:
1. Scope is implemented or explicitly descoped.
2. Exit criteria are verified.
3. Relevant documentation is updated.
4. Validation evidence exists in Issues/PRs.
5. No unresolved critical conflict with an earlier phase remains.

## GitHub Project mapping
GitHub is the execution layer.

Recommended fields:
- `Phase`: 0–6
- `Status`: Backlog / Ready / In Progress / Review / Done / Blocked
- `Type`: Feature / Bug / Refactor / Docs / Security / SEO
- `Priority`: P0 / P1 / P2 / P3
- `Area`: Workflow / UI / Payment / License / Backend / SEO / Analytics / Docs

Every non-trivial Issue should include:
- Roadmap phase.
- Requirement.
- Current behavior.
- Target behavior.
- Affected docs.
- Dependencies.
- Acceptance criteria.
- Validation plan.

## AI execution rule
When an AI agent receives a task:
1. Identify the roadmap phase.
2. Read relevant source-of-truth documents.
3. Check prerequisites and phase gates.
4. Perform change impact analysis.
5. Implement only approved scope.
6. Validate against relevant exit criteria.
7. Update affected documentation.
8. Link the resulting PR/Issue to the roadmap phase.

If requested work conflicts with the roadmap, surface the conflict instead of silently changing direction.
