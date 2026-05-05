---
name: review
description: Review code changes against Plane design system and architecture standards. Use when asked to "review", "check code", "audit", or after implementation.
---

# Code Review

Review code against Plane's architecture rules and design system.

## Instructions

1. **Read rules first**
   - `.agent/rules/plane-design-system.md` (frontend)
   - `.agent/rules/plane-backend-architecture.md` (backend)
   - `.agent/rules/frontend-implementation-checklist.md` (checklist)
   - `.agent/rules/development-rules.md` -- verification gates, ESLint, testing integrity
   - `.agent/rules/backend-testing.md` -- test runner commands and markers
   - `.agent/rules/prettier-formatting.md` -- formatting standards
   - `.agent/rules/frontend-canonical-imports.md` -- verified frontend import paths
   - `.agent/rules/backend-canonical-imports.md` -- verified backend import paths

2. **Identify changed files** — `git diff --name-only` or read plan phases

3. **Review each file** against checklists below

4. **Score and report** — save to `plans/reports/review-{date}-{slug}.md`

## Frontend Checklist

- [ ] ALL text uses `t()` from `@plane/i18n` (zero hardcoded English)
- [ ] Color tokens: `text-*` (NOT `text-color-tertiary`), `border-*` (NOT `border-color-subtle`)
- [ ] Input backgrounds: `bg-layer-2` (NOT `bg-surface-1`)
- [ ] Components from `@plane/propel` (subpath imports, not @plane/ui when overlap)
- [ ] Menus: `CustomMenu`/`Menu` (no custom hover dropdowns)
- [ ] Layout: `AppHeader` + `ContentWrapper` + `Outlet` in layout.tsx
- [ ] `observer()` on all MobX store-reading components
- [ ] `import type` for type-only imports
- [ ] `void` before `handleSubmit(handler)(e)`
- [ ] Files <200 lines, components <150 lines
- [ ] CE code in `ce/` not `core/`
- [ ] Dialog: correct system (Propel=admin, Headlessui=web)
- [ ] No hardcoded colors, no manual `dark:` variants

## Backend Checklist

- [ ] `BaseViewSet`/`BaseAPIView` inherited
- [ ] `@allow_permission` on all view methods
- [ ] `workspace__slug=slug` filtering
- [ ] `Issue.issue_objects` for user queries (not `Issue.objects`)
- [ ] Activity tracking after mutations
- [ ] `current_instance` captured before updates
- [ ] `select_related`/`prefetch_related` (no N+1)
- [ ] Registered in `__init__.py`
- [ ] No `print()` — use `log_exception()`
- [ ] Celery tasks pass `str(obj.id)` not instances

## Report Format

```markdown
# Code Review: {Feature}

## Score: X/10

## Critical Issues 🔴

1. [file:line] Issue description → Fix suggestion

## Warnings 🟡

1. [file:line] Issue description → Fix suggestion

## Suggestions 🟢

1. [file:line] Improvement idea

## Summary

- Files reviewed: N
- Critical: N | Warnings: N | Suggestions: N
- Verdict: Approved / Needs fixes
```
