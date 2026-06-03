# Project Changelog

All notable changes to the Plane project are documented here. This file tracks major features, performance improvements, bug fixes, and breaking changes.

## [Unreleased] — 2026-06-03

### New Features

- **God-mode workspace owner = General Director**: Workspaces created from God Mode (single create, bulk create, project import) are now owned by the GD (active staff with `job_grade="GD"`) or an explicitly picked user — the acting instance admin is never added as a workspace/project member. The create form gains a searchable Owner picker defaulting to the GD. **Go-live gate:** production staff data must carry grade code `"GD"` on exactly one active staff record (see deployment guide); seed-shaped data stores grade names and will NOT resolve. Existing admin-owned workspaces are intentionally left unchanged (no backfill); project imports into them explicitly exclude the acting admin.
- **Instance-admin menu RBAC (God Mode)**: New Administrators page to add/edit/remove instance admins with per-menu grants (12 keys; config screens grouped under a single `settings` permission). Enforced fail-closed at the API via URL-prefix route groups _and_ mirrored in the sidebar/route guard. First/setup admin and all pre-existing loginable admins are migrated as super-admins (migration `license/0007`). Escalation rules: only super-admins mint super-admins; delegated admins grant only menus they hold and cannot edit their own grants. Lockout guards protect the last active super-admin from demotion, deletion, deactivation, and password seizure.
- **Add-administrator multi-user picker**: The Add-administrator dialog now searches existing active staff by name, email, or staff ID (new `GET /api/instances/admins/user-options/`, gated by the `administrators` menu) and lets you select several users at once — all promoted with the same shared menus/super-admin grant. Submit reports a per-user summary (`N added, M skipped`). Users who are already admins are excluded from results.

### Fixes

- **Admins list staleness**: `GET /api/instances/admins/` cache and its invalidation were keyed to different paths, hiding grant changes for up to 2h in production — both now pinned to the same path.
- **Admin sidebar**: the hand-maintained menu array silently dropped Job Positions; the sidebar now derives from the registry record.

### Known Risks / Accepted Decisions

- Owner FK is `on_delete=CASCADE`: concentrating ownership on the GD means deleting that user cascade-deletes their workspaces. Accepted; mitigated by user-deactivation guards (no hard-delete-user flow in god-mode UI) — revisit if one is added.
- Last-super-admin guard is check-then-act (no row locks): two precisely concurrent demotes on a 2-super instance could leave zero supers. Accepted residual risk.

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
