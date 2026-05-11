# Phase 06 — i18n + Tests

## Context Links

- i18n locales: `packages/i18n/src/locales/{en,ko,vi}/translations.ts` (TypeScript modules, NOT JSON)
- Backend test runner: `cd apps/api && python run_tests.py -u`
- Rules: `.claude/rules/backend-testing.md`, `.claude/rules/i18n-rules.md`

## Overview

Priority: P2 | Status: pending
Translate strings (en/ko/vi) and add unit/contract tests.

## Requirements

### i18n Keys (all 3 locales)

- `project_settings.settings.field_permissions.title` — "Field Permissions" / "필드 권한" / "Quyền chỉnh sửa trường"
- `project_settings.field_permissions.description` — page subtitle
- `project_settings.field_permissions.rows.completed_date.title` + `.description`
- `project_settings.field_permissions.rows.target_date.title` + `.description`
- `project_settings.field_permissions.rows.start_date.title` + `.description`
- `project_settings.field_permissions.rows.delete_work_item.title` + `.description`
- `project_settings.field_permissions.locked_tooltip` — "Locked by project admin"
- `project_settings.field_permissions.toast.update_success` / `.update_error`

### Backend Tests (`apps/api/plane/tests/`)

- `test_project_field_permission_view.py`:
  - GET as project admin → 200, returns row with all `False` defaults (lazy create verified)
  - GET as project member → 200 (read allowed)
  - PATCH as project member → 403
  - PATCH as project admin with valid payload → 200, persists
  - PATCH as workspace admin (non-project-member) → 200 (R4 mitigation verified)
- `test_issue_field_permission_enforcement.py`:
  - **(Validation #7 matrix — apply to completed_at, target_date, start_date)**
  - Member PATCH date (None → value) when toggle False → **200** (empty→value allowed)
  - Member PATCH date (val1 → val2) when toggle False → **403** (value→value blocked)
  - Member PATCH date (value → None) when toggle False → **403** (value→empty blocked)
  - Member PATCH date when toggle True → 200 (any transition)
  - Member DELETE issue when delete toggle False → 403
  - Member DELETE issue when delete toggle True → 204
  - External `plane/api/` path mirrors same outcomes
  - Workspace Admin (non-project-member) PATCH any locked date → 200 (Validation #1)
- `test_project_field_permission_activity.py`: PATCH toggle emits one project activity entry per changed key (Validation #2).

<!-- Updated: Validation Session 1 -->

### Frontend (optional sanity)

- TS compile passes (`pnpm check:lint`)
- Manual checklist (see Phase 05 success criteria)

## Implementation Steps

1. Add keys to `en/`, `ko/`, `vi/` translations.ts files (nested under `project_settings`).
2. Write backend tests using `@pytest.mark.unit` marker + project fixture factory.
3. Run `cd apps/api && python run_tests.py -u -v`.
4. Run `pnpm check:lint` and `pnpm check:format`.

## Todo List

- [ ] EN locale
- [ ] KO locale
- [ ] VI locale
- [ ] View tests (incl. workspace-admin case)
- [ ] Enforcement tests (app + api layer)
- [ ] Run full unit suite green
- [ ] Run lint + format

## Success Criteria

- All 3 locales contain new keys
- All new tests pass; total suite still green
- Lint + format clean

## Risk Assessment

- **R:** Missing locale = runtime fallback to key string. Mitigation: TS-side strict key existence check (if i18n package provides one).
- **R:** Test factory missing `ProjectFieldPermission` setup. Mitigation: tests rely on lazy `get_or_create`.

## Security Considerations

- Tests must include negative case (member without permission) AND workspace-admin positive case to lock regressions.

## Next Steps

- None — final phase.
