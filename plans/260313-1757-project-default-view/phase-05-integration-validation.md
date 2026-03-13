# Phase 5: Integration & Validation

## Context

- Lint: `pnpm check:lint`
- Backend tests: `cd apps/api && python run_tests.py`
- Existing test patterns in `apps/api/`

## Overview

End-to-end validation of all 4 prior phases. Verify new project seeding, column rendering, deletion protection, and code quality.

## Requirements

1. All existing projects have exactly one default view after migration
2. New project creation triggers default view auto-creation
3. All 14 columns render correctly in spreadsheet
4. Default project view cannot be deleted (API returns 400, UI hides button)
5. No lint errors, no type errors

## Implementation Steps

### 5.1 Backend validation

- [ ] Run migration on test DB, verify default view count = project count
- [ ] Create new project via API, verify default view exists with `is_default=True`
- [ ] `DELETE /projects/{id}/views/{defaultViewId}` returns 400
- [ ] `GET /projects/{id}/views/` includes `is_default` field
- [ ] `GET /projects/{id}/views/{id}/issues/` returns `total_logged_minutes` and `completed_at`
- [ ] Write unit test: signal creates view on project creation
- [ ] Write unit test: destroy returns 400 for default view
- [ ] Write unit test: data migration idempotency (re-run doesn't create duplicates)

### 5.2 Frontend validation

- [ ] Navigate to project views — default view auto-selected
- [ ] Verify 14 columns in correct order:
  ```
  assignee, modules, bank_wide_project, key, sub_issue_count, priority,
  cycle, state, progress_tracking, start_date, due_date,
  completed_date, reference_link, total_log_time
  ```
- [ ] Verify each CE column renders correct data:
  - `bank_wide_project` = Y/N badge from `project.is_bank_wide`
  - `progress_tracking` = color-coded badge (On Track / At Risk / Due Today / Off Track)
  - `completed_date` = formatted date or empty
  - `reference_link` = lazy-loads links on scroll (IntersectionObserver)
  - `total_log_time` = "Xh Ym" format
- [ ] Verify delete button hidden for default view in project views list
- [ ] Verify lock icon visible on default view
- [ ] Regular project views still fully functional (create, edit, delete)

### 5.3 Edge cases

- [ ] Project with `created_by=None` — signal uses workspace owner as fallback `owned_by`
- [ ] Issue with no `target_date` — progress tracking shows "—"
- [ ] Issue with no links — reference link column shows empty
- [ ] Issue with no worklogs — total log time shows "0h 0m" or empty
- [ ] Issue not in completed state — completed date shows empty
- [ ] Workspace default view still functional and unaffected by this plan's changes

### 5.4 Performance check

- [ ] Spreadsheet with 100+ issues loads without visible lag
- [ ] No N+1 queries in network tab for project view issues endpoint
- [ ] Lazy-loaded columns (links) fetch on scroll only

### 5.5 Code quality

- [ ] `pnpm check:lint` — 0 errors
- [ ] `pnpm check:format` — 0 errors
- [ ] Backend: `cd apps/api && python run_tests.py`
- [ ] All new files < 150 lines
- [ ] No barrel imports from `@plane/propel` (use subpath)
- [ ] All MobX-reading components wrapped with `observer()`
- [ ] All mutations followed by `setToast()`

## Todo

- [ ] Complete all validation items above
- [ ] Fix any issues found
- [ ] Final lint + format pass
- [ ] Create PR to `develop` branch

## Post-Phase Checklist

- [ ] All backend tests pass
- [ ] Zero lint / type errors
- [ ] E2E manual walkthrough complete (project views → default view → all 14 columns)
- [ ] Workspace default view confirmed unaffected
- [ ] PR created

## Success Criteria

- Zero lint/type errors
- All 14 columns functional in project views
- Default view protected + auto-selected
- Backend tests pass
- Manual E2E walkthrough complete

## Risk Assessment

- **Migration rollback**: keep reverse migration function in data migration
- **Workspace plan conflicts**: ensure changes don't break workspace default view (run workspace view tests too)
- **Shared constants**: changes to `SPREADSHEET_PROPERTY_LIST` affect all spreadsheet views — test non-default project views still work

## Security Considerations

- Verify `is_default` cannot be set via PATCH/PUT on project views (read-only)
- Verify links render as text, no raw HTML injection
- Verify project membership enforced on `GET /projects/{id}/views/{viewId}/issues/`

## Next Steps

Create PR to `develop` branch following git workflow
