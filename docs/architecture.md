# Architecture

## Scope

This document defines the intended boundaries for the VietSoft QR web application. It is a target architecture unless a section explicitly says Current State.

## Logical layers

```
UI / Presentation
    ↓
Application / Workflow orchestration
    ↓
Domain behavior and shared services
    ↓
Repositories / integration adapters
    ↓
Supabase / external services
```

### UI / Presentation

Owns:

- rendering
- user input
- responsive layout
- presentation state
- user-facing validation display
- invoking application/workflow actions

Must not own:

- duplicated QR generation rules
- direct database access when a repository/service exists
- duplicated entitlement logic
- external payment/licensing protocol logic

### Application / Workflow

Owns:

- sequencing user actions
- coordinating validation, generation, persistence, and entitlement checks
- explicit workflow state transitions
- translating integration failures into workflow-level errors

### Domain / Shared behavior

Owns reusable business behavior such as:

- QR type rules
- QR data construction
- design model normalization
- entitlement decisions
- history model rules

### Repositories / integrations

Own:

- persistence
- Supabase access
- authentication integration
- license API calls
- payment-provider integration
- analytics integration

External services should not be called directly from unrelated UI components.

## Current known frontend modules

Relevant existing modules include:

- `libs/custom/qr-code-v2.js`
- `libs/custom/qr-code-license.js`
- `libs/custom/qr-code-auth.js`
- `libs/custom/qr-code-payment.js`
- `libs/custom/qr-history-repository.js`
- `libs/custom/qr-cloud-history.js`
- `libs/custom/qr-sync-engine.js`

These names are implementation references, not permission to bypass architectural boundaries.

## State model

A generator workflow should be explicit:

Idle → Editing → Validating → Generating → Generated → Persisting/Saved

Error states must be explicit and recoverable.

History should similarly distinguish loading, empty, loaded, restoring, deleting, syncing, and sync-error states.

## Change rule

If a new requirement changes a boundary, data contract, integration, or state transition, update this document and the relevant workflow/integration documents before or together with implementation.

If code and this architecture disagree, report the discrepancy rather than normalizing the architecture to the code by assumption.
