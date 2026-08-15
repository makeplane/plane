# P7B Existing Feature Unlock Audit

## Summary

This phase re-audits current `preview` source for five product names that P6 treated as absent or partial. The rule is unlock existing implementations, not invent missing domains.

P7A (Import Hub, PR #9) is merged. Issue worklogs (PR #8) and the Workspace Settings Worklogs download page (PR #10) are also on `preview`.

**No new commercial gate was found that still hides a complete implementation.** No fake Enterprise/billing/license state was added. No Teamspace, Wiki, Template, or Initiative domain was built.

## Method

Searched the tree (models, migrations, URLs, views, services, stores, routes, navigation, constants, i18n, tests) for: `worklog`, `time_tracking`, `timesheet`, `template`, `wiki`, `teamspace`, `initiative`, `portfolio`, plus `is_ee`, `UpgradeBadge`, `upgrade_required`, `enterprise_required`, `plan_limit`, `subscription_required`, `license_required`, `feature_not_available`.

Did not retrieve or port removed EE/SILO source (`apps/web/ee` was deleted in Community).

## Evidence table

| Feature     | Existing Backend                                                                                                                  | Existing Frontend                                                                                          | Gate Found                                                                       | Action                       | Final Status                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------- |
| Worklogs    | Yes (`IssueWorklog`, nested CRUD, exporter)                                                                                       | Yes (issue widget + Settings → Worklogs)                                                                   | None remaining (TIME `is_ee` is hosted-only; self-hosted already bypassed in P6) | None this phase              | Complete — existing implementation unlocked                    |
| Templates   | No model/API (Django email HTML templates only)                                                                                   | i18n + unused `templateId` stubs; no settings route                                                        | Marketing copy only                                                              | Document                     | Source absent                                                  |
| Wiki        | Project `Page` APIs only; no workspace Wiki CRUD                                                                                  | Project Pages UI; `/wiki` path has no route; unused `wiki.json`                                            | Orphan Power K `/wiki/:id` link when a page has no project id                    | Do not add a Wiki domain     | Partial — project Pages work; standalone Wiki source absent    |
| Teamspaces  | Dormant `Team` table in `workspace.py`; `TeamPage`/`TeamMember` removed in migration `0086`; `Team` not exported from `db.models` | `teamspaceId` / `EIssuesStoreType.TEAM*` use `IProjectIssues` stores; empty-state art; no Teamspace routes | Marketing “Teamspaces” / “Teamspace Cycles”                                      | Do not invent Teamspace APIs | Partial — Active Cycles exists; Teamspace entity source absent |
| Initiatives | No model/API                                                                                                                      | Billing `comingSoon`; reserved slugs; empty-state art; theme `initiativesSidebarCollapsed`                 | Marketing only                                                                   | Document                     | Source absent                                                  |

## Gate table

No new unlock in this PR. Remaining/prior gates:

| Feature                                                       | Gate                                                                               | File                                                                                                           | Layer              | Previous Behavior                                                                                                      | New Self-Hosted Behavior                                                        |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| TIME estimates (related to time tracking, not issue worklogs) | `ESTIMATE_SYSTEMS.time.is_ee: true` + `isEstimateSystemEnabled(..., isSelfHosted)` | `packages/constants/src/estimates.ts`; `apps/web/core/components/estimates/create/helper.tsx`; `stage-one.tsx` | Frontend           | Cloud: TIME hidden behind UpgradeBadge. Self-hosted: P6 already enables TIME when `useSelfHostedPolicy().isSelfHosted` | Unchanged this phase (already unlocked for self-hosted; hosted still separable) |
| Issue worklogs                                                | None                                                                               | `apps/api/plane/app/views/issue/worklog.py`; work-item widgets; `settings/worklogs`                            | API + UI           | PR #8/#10 already shipped CRUD, totals, toggle, export                                                                 | Unchanged; no edition/plan check on these paths                                 |
| Project Time Tracking toggle                                  | `Project.is_time_tracking_enabled` (default `False`)                               | `apps/api/plane/db/models/project.py`; `features-list.tsx` (`isPro: false`)                                    | Project preference | Disables new worklog mutations                                                                                         | Unchanged — preference, not a commercial entitlement                            |
| Templates / Wiki / Teamspaces / Initiatives                   | Plan comparison strings                                                            | `packages/constants/src/subscription.ts`; `plans.tsx`                                                          | Marketing          | Cloud comparison copy                                                                                                  | Unchanged; no feature to unlock                                                 |

`upgrade_required` / `enterprise_required` / `plan_limit` / `subscription_required` / `license_required` / `feature_not_available` — **zero matches** in Python/TS.

## Per-feature notes

### Worklogs / Time Tracking — Complete

- Model: `apps/api/plane/db/models/worklog.py`, migration `0141_issueworklog.py`
- API: `apps/api/plane/app/views/issue/worklog.py`
- UI: `apps/web/core/components/issues/issue-detail-widgets/worklogs/`
- Workspace download: `apps/web/app/.../settings/(workspace)/worklogs/`
- Tests: `apps/api/plane/tests/contract/app/test_issue_worklogs_app.py`

Not a commercial gate: `is_time_tracking_enabled`.

### Templates — Source absent

- `packages/i18n/.../template.json` is unused by web components
- `IssueModalProvider` sets `setWorkItemTemplateId: () => {}` and ignores `templateId`
- `CreateProjectForm` (`apps/web/core/components/projects/create/root.tsx`) types `templateId` but does not use it
- No Django template entity (only email HTML under `apps/api/templates/`)

### Wiki — Partial

- Project Pages: `apps/api/plane/app/urls/page.py`, `apps/web/app/routes/core.ts` (`/projects/:id/pages`)
- `Page.is_global` exists; search can return global pages (`app/views/search/base.py`)
- All page URLs still require `project_id`
- `use-workspace-paths.ts` `isWikiPath` and Power K `.../wiki/${page.id}` have **no matching React route**
- `wiki.json` collection copy is unused

Do not add `/wiki` (that would be a new Wiki product). Project Pages stay available.

### Teamspaces — Partial

- Historical `TeamPage` dropped in `0086_issueversion_alter_teampage_unique_together_and_more.py`
- `class Team` remains in `workspace.py` but is not in `db/models/__init__.py` and has no views/URLs
- Frontend `EIssuesStoreType.TEAM` uses `teamIssues: IProjectIssues` in `apps/web/core/store/issue/root.store.ts` (same project-issue store class; no Teamspace API)
- Active Cycles is a separate implemented feature (P4B/P6), not a Teamspace entity

### Initiatives — Source absent

- Reserved slugs: `packages/constants/src/workspace.ts`, `apps/api/plane/utils/constants.py`
- Billing: `plans.tsx` Initiatives `comingSoon: true`
- No model, URL, view, or page

## Security

No RBAC, tenant, or private-project rules were changed. Worklog tests still cover unauthorized actors, private-project denial, cross-workspace 403/404, and member-cannot-update-another-member.

## Tests

Re-ran existing behavioral suites (no new product code):

```bash
docker compose -f docker-compose-test.yml run --rm api-tests pytest \
  plane/tests/contract/app/test_issue_worklogs_app.py \
  plane/tests/unit/utils/test_worklog_export.py -q
# 23 passed

docker compose -f docker-compose-test.yml run --rm api-tests pytest \
  plane/tests/contract/app/test_self_hosted_unlimited.py -k time_estimate -q
# 1 passed, 35 deselected
```

Frontend: no production TS/i18n changes in this PR; format check on the report only.

## Deferred (explicitly out of scope)

- Project / work-item / page template persistence
- Standalone Wiki (collections, `/wiki` app)
- Teamspace membership product
- Initiatives / portfolio
- Changing hosted TIME `is_ee` behavior
