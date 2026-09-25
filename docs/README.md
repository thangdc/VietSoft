# VietSoft QR — Project Knowledge Base

This directory is the source of truth for product behavior, architecture, workflows, integrations, UX rules, and AI change discipline.

## Why this exists

AI-assisted development must not depend on reverse-engineering the codebase and guessing intent. Code is implementation; these documents describe the intended system and the decisions behind it.

## Documentation authority

When changing behavior, use this order:

1. Explicit current requirement from the product owner.
2. Current-state / target-state documentation.
3. Architecture Decision Records (ADR).
4. Existing implementation.
5. Code inference.

If documentation and implementation disagree, **do not silently choose one**. Report the conflict and resolve the intended behavior first.

## Current vs target state

Current-state documentation describes behavior that exists today. Target-state documentation describes approved direction that may not yet be implemented.

Never treat an implementation gap as permission to invent behavior.

## Change lifecycle

Requirement → impact analysis → documentation/decision update → implementation → validation → documentation audit.

A change that affects product behavior, workflow, architecture, integration, data contracts, security, or UX is not complete until the affected documentation is updated and consistency is checked.

## Document map

- [Product](product.md)
- [Architecture](architecture.md)
- [Data model](data-model.md)
- [Integrations](integrations.md)
- [Workflows](workflows.md)
- [Design system](design-system.md)
- [AI rules](ai-rules.md)
- [Document dependency map](document-map.yml)
- [Change impact template](CHANGE_IMPACT.md)

## Before coding

1. Read this file.
2. Identify the affected workflow(s).
3. Read the relevant architecture/integration/data documents.
4. Check the dependency map.
5. Perform impact analysis.
6. Update or create the required decision/documentation before implementation when behavior changes.
7. Implement using existing boundaries and abstractions.
8. Validate the affected workflow and regressions.
9. Run the documentation audit.

## Non-negotiable rules

- Do not guess undocumented business behavior.
- Do not create parallel implementations when an existing abstraction owns the behavior.
- Do not put business rules into presentation-only code.
- Do not duplicate integration access.
- Do not silently change a documented workflow.
- Do not mark a behavior-changing change complete while affected docs remain stale.
