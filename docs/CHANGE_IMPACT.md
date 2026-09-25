# Change Impact Template

Copy this template for a requirement/PR that can change documented behavior.

## Requirement

**ID:**  
**Summary:**  
**Reason:**  

## Current state

What happens today?

## Target state

What should happen after the change?

## Impact

### Product

- [ ] Free / Pro
- [ ] Authentication
- [ ] Licensing
- [ ] Billing
- [ ] Other

### Workflows

- [ ] User
- [ ] Admin
- [ ] History
- [ ] Import/export
- [ ] Print
- [ ] Payment
- [ ] License
- [ ] Other

### Architecture

- [ ] UI
- [ ] Application/workflow
- [ ] Domain/shared behavior
- [ ] Repository
- [Supabase]
- [ ] Edge Function
- [ ] External integration

### Data

- [ ] Database schema
- [ ] Data contract
- [ ] Existing data compatibility
- [ ] RLS/security

### UX

- [ ] Desktop
- [ ] Tablet
- [ ] Mobile
- [ ] Loading/error states
- [ ] Accessibility

### Security

- [ ] Authentication
- [ ] Authorization
- [ ] Secrets
- [ ] Payment integrity
- [ ] License integrity
- [ ] Other

## Documents to update

- [ ] `docs/product.md`
- [ ] `docs/architecture.md`
- [ ] `docs/data-model.md`
- [ ] `docs/integrations.md`
- [ ] `docs/workflows.md`
- [ ] `docs/design-system.md`
- [ ] `docs/ai-rules.md`
- [ ] `docs/document-map.yml`
- [ ] ADR required

## Documents confirmed unaffected

List the important documents checked and why they are unaffected.

## Implementation plan

1.
2.
3.

## Validation

- [ ] Unit/logic validation
- [ ] Affected workflow
- [ ] Regression workflow
- [ ] Mobile
- [ ] Desktop
- [ ] Error/loading paths
- [ ] Console errors
- [ ] Security checks where applicable

## Documentation audit

- [ ] Every changed behavior has an updated source-of-truth document.
- [ ] Dependency map is still correct.
- [ ] No stale workflow remains.
- [ ] No contradictory rule remains.
- [ ] Current state and target state are clearly distinguished.
