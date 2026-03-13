# Phase 6: Integration & Validation

## Context

- Lint: `pnpm check:lint`
- Backend tests: `cd apps/api && python run_tests.py`
- Existing test patterns in `apps/api/`

## Overview

End-to-end validation of all 5 prior phases. Verify new workspace seeding, column rendering, filter behavior, deletion protection, and code quality.

## Requirements

1. All existing workspaces have exactly one default view after migration
2. New workspace creation triggers default view auto-creation
3. All 16 columns render correctly in spreadsheet
4. Default view cannot be deleted (API returns 400, UI hides button)
5. Filters resolve "today" correctly
6. No lint errors, no type errors

## Implementation Steps

### 6.1 Backend validation

- [ ] Run migration on test DB, verify view count = workspace count
- [ ] Create new workspace via API, verify default view exists
- [ ] `DELETE /views/{defaultViewId}` returns 400
- [ ] `GET /views/` includes `is_default` field
- [ ] `GET /views/{id}/issues/` returns `total_logged_minutes` and `completed_at`
- [ ] Write unit test: signal creates view on workspace creation
- [ ] Write unit test: destroy returns 400 for default view

### 6.2 Frontend validation

- [ ] Navigate to workspace views -- default view auto-selected
- [ ] Verify 16 columns in correct order
- [ ] Verify each column renders correct data:
  - Department name = workspace name
  - Project name from store
  - Bank-wide Y/N
  - Progress tracking color badges
  - Completed date formatted
  - Reference links clickable
  - Total log time in h:mm format
- [ ] Verify delete button hidden for default view
- [ ] Verify lock icon on default view
- [ ] Regular views still fully functional (create, edit, delete)

### 6.3 Edge cases

- [ ] Workspace with no members -- signal fallback for `owned_by`
- [ ] Issue with no `target_date` -- progress tracking shows "---"
- [ ] Issue with no links -- reference link column shows empty
- [ ] Issue with no worklogs -- total log time shows "0:00"
- [ ] Issue not in completed state -- completed date shows empty

### 6.4 Performance check

- [ ] Spreadsheet with 100+ issues loads without visible lag
- [ ] No N+1 queries in network tab for list endpoint
- [ ] Lazy-loaded columns (links) fetch on scroll only

### 6.5 Code quality

- [ ] `pnpm check:lint` -- 0 errors
- [ ] `pnpm check:format` -- 0 errors
- [ ] Backend: `cd apps/api && python run_tests.py`
- [ ] Grep new imports against `package.json` / existing deps
- [ ] All new files < 150 lines

## Todo

- [ ] Complete all validation items above
- [ ] Fix any issues found
- [ ] Final lint + format pass
- [ ] Create PR

## Success Criteria

- Zero lint/type errors
- All 16 columns functional
- Default view protected + auto-selected
- Backend tests pass
- Manual E2E walkthrough complete

## Risk Assessment

- **Migration rollback**: keep reverse migration function in data migration
- **Timezone edge cases**: "today" filter may differ across timezones; document behavior

## Security Considerations

- Verify `is_default` cannot be set via PATCH/PUT (read-only in serializer)
- Verify links render as text, no raw HTML injection

## Next Steps

Create PR to `develop` branch following git workflow
