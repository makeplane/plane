# Phase 02 — Backend Endpoints (2) + URLs + Contract Tests (TDD)

**Priority:** P0 | **Status:** pending | **Depends:** 01

## Overview

2 instance-admin GET endpoints exposing the Phase-01 metrics. Active + Standard are merged into one `users/` endpoint (they share `user_day_totals` — no duplicate query, no drift). Contract tests first.

## Key Insights

- License `BaseAPIView` enforces `InstanceAdminPermission` + session auth. `verified by apps/api/plane/license/api/views/base.py:43-47`
- Existing monitoring endpoints return plain dicts via `Response(...)` — follow that (no serializer). `verified by .../views/monitoring.py:49-83`
- URL + view export: monitoring is inlined in `urls.py:142-153`; dominant convention is include-modules (`include("plane.license.api.urls.staff")`, `apps/api/plane/license/urls.py:130-138`). **Read `plane/license/api/views/__init__.py` before relying on its export style.** Either follow the include-module convention or document copying the monitoring inline-exception.

## Architecture

New view file `apps/api/plane/license/api/views/usage_monitor.py`:

- `UsageMonitorUsersEndpoint(BaseAPIView).get` → `{series_active:[{period,active_users}], series_standard:[{period,standard_user_days,non_standard_user_days}], total_active_users, pie:{standard_users,non_standard_users,total_active_users}}` — computed from ONE `user_day_totals` pass.
- `UsageMonitorDepartmentsEndpoint(BaseAPIView).get` → `{workspaces:[{workspace_id,workspace_name,slug,active_users,standard_users,total_logged_minutes,projects_with_logged_time}], projects:[{project_id,project_name,total_logged_minutes}]?}` (projects only when `workspace_id` passed). Uses `user_workspace_day_totals`.
- **No `granularity/date_from/date_to` echo fields in responses** (client owns filter state — keeps contract = TS types exactly).

Shared query-param parsing helper in the view file:

- `granularity` ∈ {day,month,year}, default `day`; invalid → 400.
- `date_from`/`date_to`: parse with `datetime.strptime(x, "%Y-%m-%d").date()`; `ValueError` → **400** (not generic 500). Client always sends explicit dates (resolved once in store); server default = last 30 days only as fallback.
- **Max-range cap per granularity** (day ≤ 92d, month ≤ 36mo, year ≤ 10yr) → 400 on overflow (bounds query + chart points).
- `workspace_id` optional: validate with `uuid.UUID(workspace_id)` → 400 on bad value.
- Build base qs: `IssueWorkLog.objects.filter(logged_at__range=(d_from,d_to), logged_by__is_bot=False, logged_by__is_active=True, workspace__deleted_at__isnull=True, project__deleted_at__isnull=True)`, optional `workspace_id=`, then call Phase-01 utils.

URLs (`plane/license/urls.py`):

```
path("usage-monitor/users/", UsageMonitorUsersEndpoint.as_view(), name="usage-monitor-users"),
path("usage-monitor/departments/", UsageMonitorDepartmentsEndpoint.as_view(), name="usage-monitor-departments"),
```

Export the 2 classes in `plane/license/api/views/__init__.py` and import in `urls.py`.

## Related Code Files

- Create: `apps/api/plane/license/api/views/usage_monitor.py`
- Modify: `apps/api/plane/license/api/views/__init__.py`, `apps/api/plane/license/urls.py`
- Create test: `apps/api/plane/tests/contract/license/test_usage_monitor_endpoints.py` (nested `license/` to match layout, `verified by apps/api/plane/tests/contract/license/`)

## Implementation Steps

1. Read an existing `tests/contract/license/` test for the **instance-admin session fixture** + the exact non-admin status code (401 vs 403). Pin assertions to that.
2. Write contract tests FIRST: non-admin → 401/403; admin → 200 + expected keys; `workspace_id` filter narrows results; bad granularity → 400; bad date → 400; bad workspace_id → 400; over-long range → 400; date range respected.
3. Implement view file + param parsing (reuse Phase-01 utils).
4. Register views in `__init__.py`, add URLs.
5. `python run_tests.py -c` green.

## Todo

- [ ] Contract tests (failing) in tests/contract/license/
- [ ] Implement 2 endpoints + param validation (400s for bad date/uuid/granularity/range)
- [ ] Register views + URLs
- [ ] Contract tests green

## Success Criteria

2 endpoints return documented JSON (no echo fields); gated by InstanceAdminPermission; view file <200L; single aggregate pass per request; all bad-input paths return 400 not 500.

## Security

- Instance-admin only (inherited). No workspace-scope leakage — `workspace_id` is an optional, UUID-validated filter; default = all.
- Access-audit-logging of per-employee productivity views: **NOT implemented** (user-confirmed 2026-06-01 — ship without). No audit write path this round.

## Next

Phase 03 builds the frontend service against this 2-endpoint contract.
