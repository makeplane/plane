# Phase 3: Integration & Validation

## Context

- Parent plan: [plan.md](plan.md)
- Phase 1: [phase-01-backend-default-view-seed.md](phase-01-backend-default-view-seed.md)
- Phase 2: [phase-02-frontend-default-view-ui.md](phase-02-frontend-default-view-ui.md)

## Overview

| Field       | Value                                         |
| ----------- | --------------------------------------------- |
| Date        | 2026-03-13                                    |
| Description | End-to-end validation of project default view |
| Priority    | P1                                            |
| Status      | ✅ Done                                       |
| Review      | Pending                                       |

## Pre-condition <!-- Updated: Validation Session 2 - run migration before checklist -->

Before starting: `cd apps/api && python manage.py migrate` — migration 0148 must be applied.

## Validation Checklist

### Backend

- [x] `python manage.py migrate` — migration 0148 applies cleanly
- [x] All projects have exactly one `is_default=True` view after migration
- [x] New project creation auto-creates Daily Status view (test signal)
- [x] `DELETE /api/v1/workspaces/{slug}/projects/{id}/views/{view_id}/` → 400 for default view
- [x] `display_properties` has `department_name=False`, `project_name=False`
- [x] `total_logged_minutes` present in spreadsheet issue response (annotation pre-confirmed from workspace plan — verify it surfaces here) <!-- Updated: Validation Session 2 - lightweight verify only -->

### Frontend

- [x] Navigate to project views page → auto-redirects to default view
- [x] Default view shows lock icon + "Default" badge in list
- [x] No "Delete" option in context menu for default view
- [x] Attempting delete via store shows toast, no network call
- [x] Spreadsheet shows 14 columns in correct order (no department_name, project_name)
- [x] `bank_wide_project`, `progress_tracking`, `completed_date`, `reference_link`, `total_log_time` columns render

### Edge Cases

- [x] Project with no `created_by` — fallback to `workspace.owner` as `owned_by`
- [x] Duplicate migration run — idempotent, no duplicate default views created
- [x] Existing project that already has a default view — migration skips it

## Related Files

- `apps/api/plane/db/migrations/0148_seed_default_project_views.py`
- `apps/api/plane/db/signals/project.py`
- `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/(list)/page.tsx`
- `apps/web/core/components/views/view-list-item.tsx`
- `apps/web/core/store/project-view.store.ts`

## Validation Decisions (Session 1 — 2026-03-13)

<!-- Updated: Validation Session 1 - open questions resolved -->

1. **Delete guard**: Must verify `IssueViewViewSet.destroy()` for project views — fix if missing before marking done
2. **Serializer**: Trust `__all__` — verify `is_default` present in GET `/api/v1/workspaces/{slug}/projects/{id}/views/` response during testing
3. **Auto-nav scope**: List page only — direct `/views/{id}` URLs intentionally bypass auto-redirect
4. **Validation mode**: Manual checklist only (no automated tests required)

## Success Criteria

- All checklist items pass
- No console errors on project views page
- Lint passes: `pnpm check:lint`

## Risk Assessment

- **`is_default` not in serializer response**: `IssueViewSerializer` uses `fields = "__all__"` — should auto-include, but verify
- **Signal not registered**: `apps/api/plane/db/signals/__init__.py` must import project signal
