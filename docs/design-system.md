# Design System

## Goal

Provide one consistent visual and interaction language across desktop, tablet, and mobile.

## Responsive strategy

Design breakpoints are implementation details; the behavior is the contract:

### Mobile

Single-column flow:

Type → Input → Generate → Result → Customize → Actions

Requirements:

- no horizontal scrolling
- touch-friendly controls
- readable labels and validation
- QR preview remains clear
- dialogs fit the viewport
- actions remain reachable without awkward scrolling

### Desktop

Two-column generator experience is preferred:

Input / configuration ↔ Preview / result

History and secondary workflows can use wider layouts.

## Shared components

The redesign should establish shared patterns for:

- tabs/type selector
- text inputs
- selects
- buttons
- cards
- dialogs
- validation messages
- loading states
- empty states
- toast/notification
- QR preview
- history item
- Pro badge/gate

Do not create one-off visual patterns when a shared component already exists.

## Interaction states

Common actions should have:

- idle
- hover/focus where applicable
- loading
- success
- validation error
- system error
- disabled

Loading actions must prevent duplicate submissions.

## UX consistency rules

- One meaning → one interaction pattern.
- Same action → same button treatment.
- Same validation concept → same error presentation.
- Same destructive action → same confirmation pattern.
- Mobile should reflow the workflow, not merely shrink desktop CSS.

## Redesign rule

Do not keep layering patches onto legacy UI indefinitely. Extract behavior first, establish shared tokens/components, then reconnect existing behavior and regression-test it.
