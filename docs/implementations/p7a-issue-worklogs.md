# P7A Issue Worklogs / Full Time Tracking

## Summary

P7A implements a bounded issue-level worklog vertical slice on this self-hosted
Plane fork: persistent `IssueWorklog` storage, nested CRUD APIs, backend
aggregates for total logged time, project time-tracking toggle enforcement,
activity history, exporter wiring, and work-item detail UI.

P6 already established that self-hosted Community gets implemented functionality
without commercial plan restrictions, while RBAC, tenancy, and operational
safeguards stay authoritative. P7A does not add plan, quota, upgrade, or
license gates on worklogs.

This phase does **not** add global timesheets, payroll, invoicing, or
utilization analytics.

## Existing scaffolding discovered

| Area                               | Finding                                                                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| Worklog model / API / UI           | None before this change                                                                            |
| `Project.is_time_tracking_enabled` | Already existed as a project preference                                                            |
| TIME estimates                     | Implemented and unlocked in P6                                                                     |
| Exporter                           | `ExporterHistory.type` already allowed `issue_worklogs`, but POST always ran the issue export task |
| i18n                               | `common.worklogs`, `activity_empty_state.no_worklogs`, `time_tracking` copy already existed        |
| Activity                           | `IssueActivity` + `issue_activity.delay` used by comments/links; no worklog field                  |
| Permissions                        | `allow_permission(..., creator=True, model=...)` used by comments/links                            |

## Model / migration

`IssueWorklog` (`apps/api/plane/db/models/worklog.py`, table `issue_worklogs`)
extends `ProjectBaseModel`:

- UUID `id`
- `issue` FK (`related_name=issue_worklogs`)
- `actor` FK
- `duration` — positive integer **seconds**
- optional `description`
- `logged_at`
- `created_at` / `updated_at` / `deleted_at` via base models
- `project` / `workspace` from `ProjectBaseModel` (`save()` copies workspace
  from the project)

Indexes:

- `worklog_issue_logged_idx` (`issue`, `logged_at`)
- `worklog_actor_logged_idx` (`actor`, `logged_at`)
- `worklog_proj_logged_idx` (`project`, `logged_at`)
- `worklog_ws_logged_idx` (`workspace`, `logged_at`)

Migration: `apps/api/plane/db/migrations/0141_issueworklog.py` (depends on
`0140_alter_importer_status_cancelled`).

## Duration representation

Canonical store and API value: integer seconds.

- Minimum: `1`
- Maximum: `10_000 * 3600` (`WORKLOG_DURATION_MAX_SECONDS`)
- Rejected: `0`, negative, `bool`, non-integer floats, human strings such as
  `1h 30m`, values above the max

Helpers: `apps/api/plane/utils/worklog.py` (`validate_worklog_duration`) used by
`IssueWorklogSerializer.validate_duration`.

Frontend parse/display (`packages/utils/src/datetime.ts`):

- `parseWorklogDurationInput` accepts only `Xh`, `Ym`, `Zs` combinations (e.g.
  `30m`, `1h`, `1h 30m`). Unit-less numbers are rejected.
- `formatWorklogDuration` renders canonical seconds as `1h 30m`.
- Helpers live in `packages/utils/src/worklog-duration.ts`.

## API routes

App family (used by web), under `/api/`:

```http
GET    /api/workspaces/<slug>/projects/<project_id>/issues/<issue_id>/worklogs/
POST   /api/workspaces/<slug>/projects/<project_id>/issues/<issue_id>/worklogs/
GET    /api/workspaces/<slug>/projects/<project_id>/issues/<issue_id>/worklogs/<pk>/
PATCH  /api/workspaces/<slug>/projects/<project_id>/issues/<issue_id>/worklogs/<pk>/
DELETE /api/workspaces/<slug>/projects/<project_id>/issues/<issue_id>/worklogs/<pk>/
```

List uses cursor pagination (`default_per_page=100`, `max_per_page=100`) and
returns `extra_stats.total_logged_time` for the whole issue, not the current
page.

Issue retrieve annotates `total_logged_time` via a subquery `Sum(duration)`
(`IssueDetailSerializer`).

Public `/api/v1/` worklog routes are not added in P7A.

Exporter:

```http
POST /api/workspaces/<slug>/export-issues/
```

`type` is `issue_exports` (default) or `issue_worklogs`. GET still lists jobs
and may filter with `?type=`.

## Permission rules

- List / retrieve / create: project `ADMIN`, `MEMBER`, or `GUEST`.
- Guests follow existing issue visibility: blocked unless
  `guest_view_all_features` or they created the issue.
- Update / delete: project `ADMIN` **or** the worklog `created_by` (existing
  `allow_permission(..., creator=True, model=IssueWorklog)`). Workspace admins
  who are also project members keep the existing workspace-admin bypass.
- Members cannot update another member's worklog.
- Create always sets `actor` and `created_by` to the requesting user.
- Actor/user payloads use `UserLiteSerializer` (`actor_detail`).

No new globally permissive behavior.

## Tenant isolation

- Queryset is scoped by `workspace__slug`, `project_id`, and `issue_id`.
- `_get_scoped_issue` requires the issue to belong to that project and
  workspace (`404` on mismatch).
- Cross-workspace URL swaps fail `403`/`404`.
- Private/inaccessible projects fail `403` (no project membership).
- Unauthenticated / non-member actors fail `403`.

## Project toggle

`Project.is_time_tracking_enabled` is a project preference, not a commercial
gate.

When disabled:

- Backend rejects **create** and **update** with HTTP 400
  (`Time tracking is disabled for this project.`).
- List and delete remain available so history is not destroyed.
- Frontend hides the Log time action and disables create/edit controls.
- The worklog collapsible still renders when historical logs or
  `total_logged_time` exist.

Turning the setting off does not delete rows.

## Totals

- List: `extra_stats.total_logged_time` from `Sum("duration")` on all worklogs
  for the scoped issue.
- Issue detail: annotated `total_logged_time` (coalesced to `0`).
- Frontend store syncs that backend total after fetch; create/update/delete
  adjust the issue field using the server-returned duration, not a page-only
  sum.

List queryset uses `select_related("actor", "issue", "project", "workspace")`.

## Activity integration

Reuses `issue_activity.delay` / `IssueActivity`:

| Event  | `type`                     | `field`   | `comment`             |
| ------ | -------------------------- | --------- | --------------------- |
| create | `worklog.activity.created` | `worklog` | `logged time`         |
| update | `worklog.activity.updated` | `worklog` | `updated logged time` |
| delete | `worklog.activity.deleted` | `worklog` | `removed logged time` |

`new_value` / `old_value` store duration seconds only. Descriptions are not
copied into activity messages. `notification=False`.

Web activity list renders `IssueWorklogActivity` for `field === "worklog"`.

## Exporter integration

P6 scaffolding filtered GET history by `type=issue_worklogs` but POST ignored
it. P7A:

- Accepts `type` on POST (`issue_exports` | `issue_worklogs`).
- Dispatches `issue_worklog_export_task` for worklogs.
- Serializes real `IssueWorklog` rows
  (`IssueWorklogExportSerializer`: identifier, name, actor, duration seconds
  and hours, description, timestamps).
- Scopes export to the requester's active project memberships.
- Workspace export form can choose Work items vs Worklogs.

## Frontend UX

Work-item detail (no top-level Timesheets app):

- Log time action (hidden when tracking is disabled)
- Modal: duration (`30m` / `1h` / `1h 30m`), optional description, logged date
- Collapsible list: actor, duration, date, description
- Total logged time on the collapsible title
- Edit/delete for the creator or project admin
- Loading / empty / error states

Project settings Features list includes Time Tracking with `isPro: false`.

## Self-hosted commercial-gate audit

Searched new worklog paths for Upgrade / PRO / Enterprise / plan /
subscription / entitlement / license / quota:

- No worklog count quota
- No paid-plan requirement
- No upgrade CTA on worklog UI
- Time tracking feature `isPro: false`
- Community edition instance does not block create/list (tested)
- Hosted commercial comparison pages were not changed
- P6 `capabilities.policy` / `useSelfHostedPolicy()` remain the commercial
  posture source; worklogs do not invent a second entitlement system

## Tests and exact results

Command (repo root):

```bash
docker compose -f docker-compose-test.yml run --rm api-tests pytest \
  plane/tests/contract/app/test_issue_worklogs_app.py \
  plane/tests/unit/utils/test_worklog_export.py -q
```

Result: **22 passed** in 127.95s (2026-08-14).

Coverage:

- create valid worklog
- list + `extra_stats.total_logged_time`
- update authorized worklog
- delete authorized worklog
- invalid / zero / negative / human-string / overflow duration rejected
- issue detail `total_logged_time` aggregate
- disabled tracking rejects mutation and keeps history
- issue/project mismatch → 404
- cross-workspace access → 403/404
- inaccessible private project → 403
- unauthorized actor → 403
- member cannot update another member's worklog; admin can
- Community edition does not commercially block five consecutive creates
- exporter POST `type=issue_worklogs` creates `ExporterHistory` and dispatches
  the worklog task
- export serializer reads real worklog rows

## Validation

| Check                                  | Result                                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@plane/i18n` `sync:check`             | All 19 locales 100% in sync (3,885 keys)                                                                                                                                |
| `@plane/i18n` `check:types` + `build`  | Pass                                                                                                                                                                    |
| `@plane/types` `check:types` + `build` | Pass                                                                                                                                                                    |
| `@plane/utils` `check:types` + `build` | Pass                                                                                                                                                                    |
| `@plane/utils` `check:format`          | Pass                                                                                                                                                                    |
| `@plane/utils` `check:lint`            | Exit 0; 34 pre-existing warnings under max-warnings=38                                                                                                                  |
| `web` `fix:format` / `check:format`    | Pass after formatting P7A files                                                                                                                                         |
| `web` `check:lint`                     | Exit 0; 781 pre-existing warnings under max-warnings=11957                                                                                                              |
| `web` `check:types`                    | Fails on pre-existing `@plane/editor` missing types and unrelated implicit-any errors. P7A-specific errors (required export `type`, invalid Button variant) were fixed. |
| Frontend unit tests                    | No `*.test.ts(x)` / `*.spec.ts(x)` under `apps/web` or `packages/utils`. Manual workflow: Log time → list → edit/delete → toggle off → export type.                     |

## Files changed

Backend: model, migration `0141`, serializer, viewset, URLs, issue retrieve
annotation, activity handlers, exporter POST + task + porter serializer,
duration helper, contract + unit tests.

Frontend: types, datetime helpers, issue service, worklog MobX store, detail
widgets (action, collapsible, modal, list), activity action, export form,
project features list, i18n `worklog.*` in all locales.

Docs: this file.

## Deferred work

- Global timesheets / reporting product
- Payroll, invoicing, utilization analytics
- Public `/api/v1/` worklog endpoints
- Auto-opening the worklogs widget by default
- Dedicated frontend unit/e2e suite (no web test runner in this repo)
- Teamspaces, standalone Wiki, Initiatives, Templates, GitHub importer,
  dashboards, automation, MFA/OIDC (explicitly out of scope)
