---
title: "Fix Dashboard Widget Configuration Flow"
description: "Fix non-interactive widget config modal caused by Headless UI Dialog+Tab focus trap conflicts"
status: complete
priority: P1
effort: 3h
branch: preview
tags: [dashboard, widget, bugfix, headless-ui, modal]
created: 2026-02-15
completed: 2026-02-15
---

# Fix Dashboard Widget Configuration Flow

## Overview

Widget config modal (add/edit) doesn't respond to user interactions. Root cause: Headless UI component conflicts inside Dialog focus trap. Partial fix applied (useState tabs), need end-to-end verification and remaining fixes.

## Implementation Phases

| Phase                                                 | Description                                                     | Status   | Effort |
| ----------------------------------------------------- | --------------------------------------------------------------- | -------- | ------ |
| [Phase 1](./phase-01-replace-headless-ui-in-modal.md) | Replace all Headless UI components inside modal with plain HTML | Complete | 1.5h   |
| [Phase 2](./phase-02-verify-end-to-end-flow.md)       | Verify complete widget CRUD flow end-to-end                     | Complete | 1h     |
| [Phase 3](./phase-03-cleanup-and-review.md)           | Code cleanup, build verification, commit                        | Complete | 0.5h   |

## Key Dependencies

- `packages/ui/src/dropdowns/custom-select.tsx` — Headless UI Combobox (DO NOT modify)
- `packages/ui/src/modals/modal-core.tsx` — Headless UI Dialog (DO NOT modify)
- `apps/web/core/components/dashboards/config/*.tsx` — Widget config sections (modify)
- `apps/web/core/components/dashboards/widget-config-modal.tsx` — Main modal (already partially fixed)

## Root Cause Analysis

Headless UI `Dialog` creates a focus trap. Any other Headless UI component (Tab.Group, Combobox) inside the Dialog competes for focus management. `CustomSelect` (Combobox) portals options to `document.body` outside `Dialog.Panel`, causing Dialog to close or swallow click events.

## Strategy

Replace Headless UI-dependent components (CustomSelect) inside the modal with plain HTML equivalents. Keep shared `@plane/ui` components untouched to avoid breaking other features.
