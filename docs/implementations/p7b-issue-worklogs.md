# P7B Issue Worklogs / Full Time Tracking

## Summary

Issue-level worklogs already landed on `preview` via PR #8 (`docs/implementations/p7a-issue-worklogs.md`). P7B does not reimplement that slice. It restores the Community Workspace Settings → Worklogs surface as a **bounded download page** wired to the existing `issue_worklogs` exporter, documents the EE timesheet gap, and adds an exporter-list filter contract.

P7A (Import Hub, PR #9) is merged into `preview` and is the base for this branch.

Out of scope remains: payroll, invoicing, utilization analytics, and a global timesheet product.

## Existing scaffolding

Covered by PR #8 / `p7a-issue-worklogs.md`:

- `IssueWorklog` model, migration `0141_issueworklog.py`
- Nested CRUD APIs, duration in integer seconds
- `total_logged_time` on list `extra_stats` and issue retrieve
- Project `is_time_tracking_enabled`
- Activity (`field=worklog`)
- Work-item detail widgets (log/list/edit/delete)
- Exporter POST `type=issue_worklogs` and `issue_worklog_export_task`

## Community Worklogs UI audit

| Surface                          | Finding                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Work-item detail                 | Real Community implementation (PR #8)                                                                                                                  |
| Project Features → Time Tracking | Real toggle, `isPro: false`                                                                                                                            |
| Workspace Settings → Worklogs    | i18n keys existed (`workspace_settings.settings.worklogs`, `settings_empty_state.worklogs`) but **no route, nav item, or page** in this Community tree |
| Historical `settings/worklogs`   | EE wrapper (`WorkspaceWorklogRoot` / `web/ee/components/worklogs`) plus upgrade UI. Removed with EE web. Not ported.                                   |
| Workspace Exports                | Already could choose Worklogs vs work items                                                                                                            |

P7B reconnects the Community **settings menu and route** to the real exporter. It does **not** recreate the EE timesheet browser.

## Model / migration

Unchanged in P7B. Canonical store remains integer seconds on `IssueWorklog.duration`.

## API

Issue worklogs (unchanged):

```http
GET/POST   /api/workspaces/<slug>/projects/<project_id>/issues/<issue_id>/worklogs/
GET/PATCH/DELETE  /api/workspaces/<slug>/projects/<project_id>/issues/<issue_id>/worklogs/<pk>/
```

Exporter (P7B):

```http
GET /api/workspaces/<slug>/export-issues/?type=issue_worklogs&cursor=&per_page=
```

`ExporterHistorySerializer` now includes `type` so filtered history rows are identifiable.

No workspace-wide worklog list endpoint (that would be a timesheet API).

## Permission matrix

Unchanged from P7A issue worklogs:

| Action                           | Who                                                         |
| -------------------------------- | ----------------------------------------------------------- |
| List / retrieve / create         | Project ADMIN, MEMBER, GUEST (guest visibility rules apply) |
| Update / delete                  | Project ADMIN or `created_by`                               |
| Workspace Worklogs page / export | Workspace ADMIN, MEMBER                                     |

## Tenant isolation

Unchanged: queryset scoped by workspace slug, project, issue; mismatch → 404; no membership → 403.

## Duration / totals / project toggle / activity

Unchanged from P7A. Totals are backend `Sum(duration)`, not a frontend page sum.

## Exporter integration

Workspace Worklogs locks export type to `issue_worklogs`, lists previous jobs with `?type=issue_worklogs`, and reuses `ExportForm` / `PrevExports`. Exports settings still allows both types.

## Frontend UX

Issue detail: existing Log time modal (duration, date, description), list, totals, edit/delete.

Workspace Settings → Worklogs (`/:workspaceSlug/settings/worklogs`):

- Features group in the settings sidebar
- Download form locked to worklogs
- Previous worklog export jobs
- Copy states this is a download, not timesheets/payroll/utilization
- No Upgrade / Talk to Sales

## Workspace Worklogs page status

**Partial Community connection.** Navigation and download exist. EE member timesheet grids, date-range browsers, and upgrade gates remain source-absent / deferred.

## Self-hosted gate audit

No paid-plan requirement, quota, Upgrade CTA, or fake Enterprise state on worklog paths. Time Tracking stays `isPro: false`. P6 `capabilities.policy` is unused here because no commercial gate existed to normalize.

## Tests

```bash
docker compose -f docker-compose-test.yml run --rm api-tests pytest \
  plane/tests/contract/app/test_issue_worklogs_app.py \
  plane/tests/unit/utils/test_worklog_export.py -q
```

Result: **23 passed** in 99.90s.

P7B adds `test_exporter_list_can_filter_worklog_jobs`. Remaining cases are the P7A contract/unit suite (create/list/update/delete, duration validation, totals, toggle, RBAC, tenant isolation, Community edition, exporter POST).

## Performance

Issue list still `select_related` + annotated totals. Workspace page uses existing cursor pagination (`per_page=10`). No unbounded workspace worklog table.

## Files changed (P7B)

- Workspace settings types, nav, icon, route, Worklogs page
- Export form `lockedType`, export list `type` query, serializer `type`
- i18n worklogs description/hint and empty-state copy
- Exporter list filter test
- this report

## Deferred work

- EE-style workspace timesheet UI (member × date grid)
- Payroll, invoicing, utilization analytics
- Public `/api/v1/` worklog endpoints
- Workspace-wide live worklog list API
