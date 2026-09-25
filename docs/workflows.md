# Workflows

This file is the workflow index and cross-workflow rules. Detailed workflow behavior should be added as the product grows.

## Core user workflow

```
Select QR type
    ↓
Enter data
    ↓
Validate
    ↓
Generate
    ↓
Preview
    ↓
Customize
    ↓
Save / Download / Print / Share
```

Generating a QR does not require login.

## History workflow

### Local history

Generate/save → local history → select item → restore fields + design → regenerate/display.

The QR payload and design must be restored consistently.

### Cloud history

Authentication → cloud history → create/update/delete/sync.

Cloud history must use the cloud history boundary rather than direct UI database operations.

## Import/export workflow

Import:

Select Import → file picker → validate supported template → parse → map to QR records → preview/confirm → generate/save.

Export:

Select records → validate export format → generate compatible workbook/file → download.

Existing workbook compatibility is a product contract. Do not casually change column names or sheet structure.

## Print workflow

Select records → prepare print view → print only the intended QR list.

Print output must not include unwanted browser/application UI, about:blank content, or unintended date/header/footer elements.

## Payment / Pro workflow

Current direction:

Select plan → provide email → initiate payment → verify payment → create/activate license → show license/key or account entitlement.

The client must not be treated as authoritative proof of payment.

## Admin workflow

Admin responsibilities may include:

- license management
- payment verification/support
- customer support
- product configuration

Admin workflows must be documented separately before implementation becomes complex.

## Workflow change rule

A requirement that changes a step, actor, state, prerequisite, entitlement, persistence behavior, error path, or integration must update the relevant workflow documentation and dependency map.
