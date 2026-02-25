---
description: Review code changes against Plane design system and architecture standards
---

# Code Review Workflow

## Steps

1. **Read Standards**
   - Read `./docs/code-standards.md`
   - Read `./docs/design-guidelines.md`

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
   - [ ] Semantic color tokens used (no `bg-white`, `text-gray-*`)
   - [ ] No manual `dark:` variants
   - [ ] `observer` wrapper on MobX-connected components
   - [ ] `runInAction` for async observable updates
   - [ ] `useTranslation()` for all user-facing strings
   - [ ] `import type` for type-only imports
   - [ ] No `any` type without justification
   - [ ] Components <150 lines, hooks <100 lines
   - [ ] CE-specific code in `ce/` not `core/`
   - [ ] Import order: external → types → @plane → @/ → relative

4. **Report Findings**
   - Group by severity: 🔴 Critical / 🟡 Warning / 🟢 Suggestion
   - Provide specific file + line references
   - Suggest fixes with code examples
