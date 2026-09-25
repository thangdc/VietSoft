# AI Development Rules

This file is mandatory context for AI-assisted changes.

## 1. Understand before changing

Read:

1. `docs/README.md`
2. affected workflow
3. relevant architecture/integration/data documents
4. `docs/document-map.yml`
5. relevant ADRs

Do not start by guessing from code alone.

## 2. Never silently resolve contradictions

If docs, requirements, and code disagree:

- identify the conflict
- explain the affected behavior
- ask for/record the intended decision
- then implement

Do not silently choose an assumption when the decision affects product behavior, data, payment, licensing, security, or compatibility.

## 3. Impact analysis is mandatory

Before a behavior-changing implementation, identify:

- product rules
- workflows
- architecture
- integrations
- data
- UX
- security
- tests
- documents to update

Use `docs/CHANGE_IMPACT.md` as the template.

## 4. Reuse existing ownership

Before creating code:

- search for an existing implementation
- identify the owner of the behavior
- extend it when appropriate
- avoid parallel implementations

## 5. No duplicated business rules

Examples:

- QR type rules should not be reimplemented per button.
- Pro entitlement should not be checked independently in many UI handlers.
- Supabase access should not be duplicated across components.
- Payment state should have one authoritative workflow.

## 6. Documentation is part of the change

If behavior changes, update the affected source-of-truth documents in the same change.

A code-only PR is incomplete when documented behavior changed.

## 7. Validate after implementation

Check:

- affected workflow
- regression paths
- mobile
- desktop
- loading/error states
- console errors
- documentation consistency

## 8. Report assumptions explicitly

If a non-critical assumption is unavoidable, record it in the change/PR. Critical assumptions must be resolved before implementation.

## 9. Do not over-document implementation trivia

Document intent, contracts, boundaries, behavior, decisions, and constraints. Do not duplicate every function name or CSS detail into docs.

## 10. Completion standard

A change is complete only when:

Requirement ✓
Impact analysis ✓
Documentation ✓
Implementation ✓
Tests/validation ✓
Documentation audit ✓
