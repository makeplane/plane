# Project Changelog

All notable changes to the Plane project are documented here. This file tracks major features, performance improvements, bug fixes, and breaking changes.

## [Unreleased] — 2026-05-13

### New Features

- **Copy Project to Another Workspace**: Workspace admins can now deep-copy entire projects to other workspaces they administer. Async copy via Celery maintains all states, labels, estimates, modules, cycles, issues (with comments and worklogs), and project members. Sub-issue parent links are preserved. Frontend polls copy status with 3s interval; identifier conflicts handled inline. All strings via i18n (en/ko/vi).

## [2026-05-05] — Previous Release

### Performance

- **Profile page cross-workspace work items**: Replaced client-side 600-call fan-out with single `/api/users/me/work-items/{today,overdue}/` aggregate endpoint. Page load reduced from 10–25s to <2s. Default `crossWorkspaces=true`; toggle hidden on other-user profiles.
- **`WorkspaceUserProfileStatsEndpoint`**: Collapsed 8 sequential count queries into single `.aggregate()` with `Count(filter=Q(...), distinct=True)` (-3 SQL round-trips per page load).
- **DB partial index `issues_workitems_idx`**: Added on `(target_date, state_id) WHERE parent_id IS NULL AND deleted_at IS NULL AND archived_at IS NULL AND is_draft=FALSE` (migration `0168`, uses `CREATE INDEX CONCURRENTLY`, `atomic=False`).

### Fixes

- **`WorkspaceUserProfileEndpoint`**: Fixed critical counting bug — 3 of 4 issue counts (`created_issues`, `completed_issues`, `pending_issues`) were missing `parent__isnull=True` filter and incorrectly included sub-tasks. All 4 counts now exclude sub-tasks via DRY `_base_issue_q`. Counts may decrease for users with sub-tasks; this is the correct value.
- **Profile sub-task parity**: Legacy fan-out path (other-user profile, feature-flag-off rollback) now applies `parent_id == null` defensive filter to match aggregate-endpoint behavior.

### New Endpoints

- **`GET /api/users/me/work-items/today/`** — Returns open work items assigned to current user with `target_date >= today` (or null). Supports optional `?workspace=<slug>` to filter to single workspace. Capped at 200 items. Includes `select_related`/`prefetch_related` optimization for minimal round-trips.
- **`GET /api/users/me/work-items/overdue/`** — Returns open work items assigned to current user with `target_date < today`. Supports optional `?workspace=<slug>`. Capped at 200 items.

Both endpoints:

- Return `UserCrossWorkspaceWorkItemSerializer` (ID-only serialization: `assignee_ids`, `label_ids` for minimal payload)
- Filter to active workspace/project members only
- Exclude sub-tasks (`parent__isnull=True`)
- Use read replica (`use_read_replica=True`)

### Configuration

- New environment variable `VITE_USE_AGGREGATE_PROFILE_ENDPOINT` (default `"true"`). Set to `"false"` and rebuild frontend to roll back to legacy client-side fan-out path.

### Breaking Changes

None. All existing endpoints (`/api/users/me/`, `/api/workspace/<slug>/users/<id>/profile/`, etc.) remain unchanged in contract; only internal optimizations applied.

---

## Previous Releases

[Releases from prior dates to be added here as project evolves]
