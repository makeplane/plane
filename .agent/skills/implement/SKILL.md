---
name: implement
description: Implement a specific phase from an existing plan. Use when asked to "implement", "build", "code", or when a plan is ready.
---

# Implement

Execute implementation steps from a plan phase file.

## Instructions

1. **Read the phase file** — contains embedded rules + steps + checklist
2. **Read related code files** listed in the phase
3. **Implement each step** following embedded rules exactly
4. **Run verification** after each file:
   - Type check: relevant build command
   - Lint check: `pnpm check:lint` (frontend) or Python syntax (backend)
5. **Run post-phase checklist** — fix any failures before marking done
6. **Update plan.md** — mark phase status as "Done"

## Frontend Implementation Rules

Read `.agent/rules/plane-design-system.md` and `.agent/rules/frontend-implementation-checklist.md` BEFORE coding.

Key rules (always verify):

- ALL text uses `t()` from `@plane/i18n` — zero hardcoded English
- Color tokens: `text-*` (NOT `text-color-tertiary`), `border-*` (NOT `border-color-subtle`)
- Input backgrounds: `bg-layer-2` (NOT `bg-surface-1`)
- Components from `@plane/propel` (subpath imports)
- Menus: `CustomMenu` from `@plane/ui` — NEVER custom hover dropdowns
- Layout: `AppHeader` + `ContentWrapper` + `Outlet` in layout.tsx
- `observer()` on all MobX store-reading components
- CE features in `ce/` directory, NOT `core/`
- Files <200 lines, components <150 lines

## Backend Implementation Rules

Read `.agent/rules/plane-backend-architecture.md` BEFORE coding.

Key rules (always verify):

- Inherit `BaseViewSet` or `BaseAPIView`
- `@allow_permission` on all view methods
- Filter by `workspace__slug=slug`
- `Issue.issue_objects` for user-facing queries
- Activity tracking after mutations
- Register in `__init__.py` for models, views, serializers, URLs
- `select_related`/`prefetch_related` for FK/M2M

## Post-Implementation

After implementing, follow verification gates in `.agent/rules/development-rules.md`.
Verify imports against `.agent/rules/frontend-canonical-imports.md` and `.agent/rules/backend-canonical-imports.md`.
Run the full checklist from the phase file. If any check fails → fix immediately before proceeding.

## Examples

**User:** "Implement phase 2 of the dashboard plan"
**Action:** Read `plans/{date}-dashboard/phase-02-*.md` → implement each step → verify checklist → update plan.md
