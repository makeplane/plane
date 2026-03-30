---
description: Review code changes against Plane design system and architecture standards
---

# Code Review Workflow

## Steps

1. **Read Standards**
   - Read `./docs/code-standards.md`
   - Read `./docs/design-guidelines.md`
   - Read `.agent/rules/development-rules.md` -- verification gates, ESLint, testing integrity
   - Read `.agent/rules/backend-testing.md` -- test runner commands and markers
   - Read `.agent/rules/prettier-formatting.md` -- formatting standards

2. **Backend Review Checklist**
   - [ ] Models inherit `BaseModel` or `ProjectBaseModel`
   - [ ] UUID primary keys (no auto-increment)
   - [ ] Soft delete via `deleted_at` (not hard delete)
   - [ ] Correct manager used (`issue_objects` vs `objects`)
   - [ ] `workspace__slug=slug` filtering (no cross-workspace leaks)
   - [ ] `select_related`/`prefetch_related` for FK/M2M (no N+1)
   - [ ] `@allow_permission` on all view methods
   - [ ] Activity tracking after mutations (`model_activity.delay()`)
   - [ ] `current_instance` captured before updates
   - [ ] Celery tasks pass `str(obj.id)`, not model instances
   - [ ] All new files registered in `__init__.py`
   - [ ] No `print()` — use `log_exception()`

3. **Frontend Review Checklist**
   - [ ] Components use `@plane/propel` (not `@plane/ui` when overlap exists)
   - [ ] Propel imports use subpath: `@plane/propel/button`
   - [ ] Semantic color tokens: `text-*` (NOT `text-color-tertiary`), `border-*` (NOT `border-color-subtle`)
   - [ ] No hardcoded colors (`bg-white`, `text-gray-*`, `#hex`)
   - [ ] Input/form backgrounds use `bg-layer-2` (NOT `bg-surface-1`)
   - [ ] Menus use `CustomMenu`/`Menu` (no custom hover dropdowns)
   - [ ] Layout: `AppHeader` + `ContentWrapper` + `Outlet` in layout.tsx
   - [ ] No manual `dark:` variants
   - [ ] `observer` wrapper on MobX-connected components
   - [ ] `runInAction` for async observable updates
   - [ ] `useTranslation()` for ALL user-facing strings (buttons, toasts, empty states, errors)
   - [ ] `import type` for type-only imports
   - [ ] No `any` type without justification
   - [ ] Components <150 lines, hooks <100 lines
   - [ ] CE-specific code in `ce/` not `core/`
   - [ ] Import order: external → types → @plane → @/ → relative
   - [ ] Dialog: correct system for app (Propel=admin, Headlessui=web, ModalCore=web legacy)
   - [ ] Dialog: `onOpenChange` for Propel (NOT `onClose`), single `p-6` wrapper

4. **Report Findings**
   - Group by severity: 🔴 Critical / 🟡 Warning / 🟢 Suggestion
   - Provide specific file + line references
   - Suggest fixes with code examples
