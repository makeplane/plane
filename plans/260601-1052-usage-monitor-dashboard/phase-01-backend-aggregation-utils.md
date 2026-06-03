# Phase 01 — Backend Aggregation Utils + Index Migration + Unit Tests (TDD)

**Priority:** P0 | **Status:** pending

## Overview

Pure, testable functions that turn `IssueWorkLog` rows into active/standard/department metrics, plus one index migration for query performance. No new model. Tests written first.

## Key Insights

- `IssueWorkLog`: `logged_by`(User), `workspace`, `project`, `issue`(non-null FK), `duration_minutes`(PositiveInt, allows 0), `logged_at`(tz-naive DateField). `verified by apps/api/plane/db/models/worklog.py:14-26`
- `.objects` (SoftDeletionManager) excludes soft-deleted **worklog rows**, but NOT worklogs of soft-deleted parents — workspace/project delete fires an async Celery cascade with a bare `except: continue`. `verified by apps/api/plane/db/mixins.py:73-79`, `apps/api/plane/bgtasks/deletion_task.py:97-100`. → base qs MUST filter `workspace__deleted_at__isnull=True, project__deleted_at__isnull=True`.
- `User` is not soft-deletable; it has `is_active` (deactivation) + `is_bot`. `verified by apps/api/plane/db/models/user.py:97,115`. → base qs filters `logged_by__is_bot=False, logged_by__is_active=True` (user decision: exclude both).
- Login history not stored (`last_login_time` single value, `apps/api/plane/db/models/user.py:106`) → worklog proxy; metric = "users who logged time".
- DB-side bucketing precedent: `TruncDate/TruncMonth` already used. `verified by apps/api/plane/utils/analytics_plot.py:152,165` and `apps/api/plane/app/views/analytic/advance.py:536`.
- Standard threshold = 480 min. Active = user-day with summed duration > 0 (user-confirmed; 0-minute-only days excluded).

## Architecture

New module `apps/api/plane/license/utils/usage_metrics.py` (snake_case). The base queryset (built by the view, Phase 02) already applies: date range + user filters (`is_bot=False`, `is_active=True`) + live-parent filters (`workspace/project deleted_at__isnull=True`) + optional `workspace_id`.

Functions:

- `STANDARD_DAILY_MINUTES = 480`
- `user_day_totals(queryset) -> list[dict]`: `[{user_id, day(date), total_minutes}]` via `.values("logged_by","logged_at").annotate(total=Sum("duration_minutes")).filter(total__gt=0)` (post-aggregate HAVING; excludes 0-minute-only days). Used by active + standard (single pass — endpoints share it).
- `user_workspace_day_totals(queryset) -> list[dict]`: `[{user_id, workspace_id, day, total_minutes}]` — adds workspace grain for `department_aggregates` (per-(user,workspace,day) standard classification). Resolves the Critical grain gap.
- `active_users_series(rows, granularity) -> list[{period, active_users}]`: bucket day/month/year (DB `Trunc*` preferred for active series; Python re-bucket from day rows only where needed). distinct user count per bucket. `total_active_users` = distinct users over all rows.
- `standard_users_series(rows, granularity) -> list[{period, standard_user_days, non_standard_user_days}]`: per bucket, count user-days with total≥480 (standard) vs total<480 (non-standard). **Non-overlapping** (was active_user_days — that double-counted; standard ⊆ active).
- `standard_users_pie(rows) -> {standard_users, non_standard_users, total_active_users}`: distinct users with ≥1 standard-day vs active users with none (range semantics — user-confirmed to keep "≥1 standard day").
- `department_aggregates(ws_day_rows, workspaces) -> list[{workspace_id, workspace_name, slug, active_users, standard_users, total_logged_minutes, projects_with_logged_time}]`: per-workspace from `user_workspace_day_totals`. `workspace_name/slug` resolved from the passed `Workspace.objects` map (drops ghost workspaces). `projects_with_logged_time` counted from `Project.objects`-validated project ids (not raw worklog rows).
- `bucket_key(date, granularity)`: day→`YYYY-MM-DD`, month→`YYYY-MM`, year→`YYYY` (helper for Python-side day-grain re-bucketing of the standard metric).

Bucketing where day-grain rollup is required (standard classification) is done in Python over day rows; the distinct-active series prefers DB `Trunc* + Count(distinct logged_by)`.

## Index Migration

Add a migration in `apps/api/plane/db/migrations/` adding an index on `IssueWorkLog (workspace, logged_at)` to avoid full-table scans on instance-wide multi-year ranges. Update the model `Meta.indexes`. Migration filename: domain slug only (e.g. `0XXX_issueworklog_workspace_logged_at_index.py`), no plan refs.

## Related Code Files

- Create: `apps/api/plane/license/utils/__init__.py` (if missing), `apps/api/plane/license/utils/usage_metrics.py`
- Modify: `apps/api/plane/db/models/worklog.py` (add index to Meta), new migration file
- Create test: `apps/api/plane/tests/unit/utils/test_usage_metrics.py` (nested `utils/` to match layout, `verified by apps/api/plane/tests/unit/utils/`)
- Modify test infra: `apps/api/plane/tests/factories.py` — **add `IssueFactory` + `IssueWorkLogFactory`** (NEITHER exists; only User/Workspace/Project/Members do, `verified by apps/api/plane/tests/factories.py:12-85`). `issue` is a required non-null FK; `ProjectBaseModel.save()` overwrites `workspace` from `project.workspace` (`apps/api/plane/db/models/project.py:188-190`) — do NOT pass `workspace=` to the worklog factory.

## Implementation Steps

1. Add `IssueFactory` (+ any required FK: project/state/created_by) and `IssueWorkLogFactory` to `factories.py`. Enumerate Issue's mandatory fields first.
2. Write `test_usage_metrics.py` FIRST (`@pytest.mark.unit`, `@pytest.mark.django_db`): cases below.
3. Implement `usage_metrics.py` until tests pass.
4. Add `(workspace, logged_at)` index to model + migration; `python manage.py makemigrations` check.

## Test Cases (write first)

- active: user with 2 worklogs same day counted once; 3 users on a day → active_users=3.
- **0-minute logs**: a user-day with only a single `duration_minutes=0` worklog → NOT active (excluded by `total__gt=0`).
- standard: day total 479 → not standard; 480 → standard; two entries 300+200=500 → standard.
- standard series non-overlap: a bucket with 5 active user-days, 2 standard → `standard_user_days=2, non_standard_user_days=3`.
- granularity: daily vs monthly vs yearly bucket keys correct; user-days summed across month.
- pie: user standard on 1 of 3 active days → counts as standard user; active-but-never-480 → non_standard.
- **bot/deactivated excluded**: a bot worklog and a deactivated-user worklog → excluded from all counts.
- **soft-deleted parent excluded**: soft-delete a workspace WITHOUT running the Celery task → its worklogs excluded.
- **multi-workspace user**: user active in ws A and B → contributes to both department rows but counts once in `total_active_users`.
- workspace filter: rows from other workspace excluded.
- department_aggregates: per-workspace active/standard/total_minutes correct; `projects_with_logged_time` excludes soft-deleted project.
- empty input → zeros / empty lists, no exception.

## Todo

- [ ] Add IssueFactory + IssueWorkLogFactory
- [ ] Write unit tests (failing) in tests/unit/utils/
- [ ] Implement usage_metrics.py (user_day_totals + user_workspace_day_totals + 4 metric fns)
- [ ] Add (workspace, logged_at) index + migration
- [ ] `cd apps/api && python run_tests.py -u` green

## Success Criteria

All unit tests pass; module <200 lines; functions pure (queryset/rows in, dicts out); bots/deactivated/soft-deleted-parent excluded; standard series non-overlapping; migration applies cleanly.

## Risk

- tz: `logged_at` tz-naive, stored project-local. Bucket on the date as-is — acceptable single-region; documented limitation.
- Grain: department metrics MUST use `user_workspace_day_totals`, not `user_day_totals` (different grain).

## Next

Phase 02 wires these into the 2 endpoints.
