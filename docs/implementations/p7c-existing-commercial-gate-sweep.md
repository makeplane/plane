# P7C Remaining Existing Feature Commercial-Gate Sweep

## Summary

This phase audited remaining user-facing areas not fully covered by P6/P7B for commercial plan/license/edition gates on **already implemented** functionality. The rule remains: unlock existing implementations; do not invent missing domains.

P7B (PR #11) is merged on `preview`. Templates, standalone Wiki, Teamspaces, and Initiatives were not revisited as product work.

**One commercial remnant still hid a complete implementation:** `useBulkOperationStatus()` always returned `false`, which disabled work-item selection in list, spreadsheet, and Gantt layouts and therefore hid the P4A bulk-archive toolbar. That kill-switch now follows `useSelfHostedPolicy()` so self-hosted Community can select and archive. No fake Enterprise/billing/license state was added. GitHub/Slack sync APIs, Customers, Connections, custom dashboards, and generic automation were not built.

## Method

Searched the current tree (Python, TS/TSX, constants, routes, stores, hooks, navigation, services, serializers, permissions, tests, localization) for: `upgrade`, `upgrade_required`, `UpgradeBadge`, `PaidPlanUpgradeModal`, `Talk to Sales`, `pro`, `premium`, `business`, `enterprise`, `free`, `community`, `paid`, `subscription`, `billing`, `plan`, `tier`, `edition`, `license`, `licence`, `entitlement`, `feature_gate`, `featureAccess`, `is_ee`, `isEnterprise`, `isPaid`, `isPro`, `requiresUpgrade`, `feature_not_available`, `enterprise_required`, `subscription_required`, `plan_limit`.

Also inspected dormant/hidden routes (`apps/web/app/routes/core.ts`, empty `extended.ts`), settings navigation, and unused upgrade components.

`upgrade_required` / `enterprise_required` / `plan_limit` / `subscription_required` / `feature_not_available` / `requiresUpgrade` / `feature_gate` — **zero matches** in Python/TS.

Backend `GET /api/instances/` `capabilities.policy` already reports `commercial_gating: false` and null seat/member/project limits (`apps/api/plane/license/utils/capabilities.py`). No backend plan/edition/license rejection path was found on the audited APIs.

## Area table

| Area                  | Backend Exists                                                                                              | Frontend Exists                                                                             | Commercial Gate                                                              | Action                             | Status                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| Customers             | No model/API                                                                                                | Empty-state assets + marketing copy only                                                    | None                                                                         | Document                           | Source absent                                                              |
| Integrations          | Models only (`Integration`, `WorkspaceIntegration`, GitHub/Slack sync tables); **no registered URLs/views** | Orphan settings page not in `core.ts` or workspace settings tabs; client calls missing APIs | None (not a plan gate)                                                       | Do not restore broken route        | Partial                                                                    |
| Connections           | `SocialLoginConnection` is OAuth account linking, not a Connections product                                 | No Connections product UI                                                                   | None                                                                         | Document                           | Source absent                                                              |
| Exports               | Yes (`ExporterHistory`, CSV/JSON/XLSX, worklog export)                                                      | Yes (`/:workspaceSlug/settings/exports`)                                                    | None                                                                         | None                               | Complete/unrestricted (storage/email configuration-dependent for delivery) |
| Webhooks              | Yes (CRUD, logs, SSRF-validated delivery)                                                                   | Yes (`/:workspaceSlug/settings/webhooks`)                                                   | None (no count/plan limit)                                                   | None                               | Complete/unrestricted                                                      |
| Access Tokens         | Yes (`APIToken`, user-owned CRUD)                                                                           | Yes (profile API tokens; workspace path redirects)                                          | None                                                                         | None                               | Complete/unrestricted                                                      |
| Public Projects/Space | Yes (`DeployBoard`, `space/` APIs)                                                                          | Yes (publish modal + `apps/space`)                                                          | None (`public_projects.enabled`)                                             | None                               | Complete/unrestricted                                                      |
| Analytics             | Yes (`AnalyticView`, chart/export APIs)                                                                     | Yes (`/:workspaceSlug/analytics/:tabId`)                                                    | None                                                                         | None                               | Complete/unrestricted (custom dashboard CRUD source absent)                |
| Cycles                | Yes                                                                                                         | Yes                                                                                         | None (`cycle_view` project preference; `isPro: false`)                       | None                               | Complete/unrestricted                                                      |
| Modules               | Yes                                                                                                         | Yes                                                                                         | None (`module_view`; `isPro: false`)                                         | None                               | Complete/unrestricted                                                      |
| Views                 | Yes                                                                                                         | Yes                                                                                         | None (`issue_views_view`; `isPro: false`)                                    | None                               | Complete/unrestricted                                                      |
| Pages                 | Yes (project-scoped)                                                                                        | Yes                                                                                         | None (`page_view`; `isPro: false`)                                           | None                               | Complete/unrestricted (standalone Wiki remains partial/absent per P7B)     |
| Intake                | Yes                                                                                                         | Yes                                                                                         | None (`intake_view` / `inbox_view`; `isPro: false`)                          | None                               | Complete/unrestricted                                                      |
| Active Cycles         | Yes (`WorkspaceActiveCyclesEndpoint`)                                                                       | Yes (real aggregate page)                                                                   | Sidebar `UpgradeBadge` only when `hasCommercialGating` (self-hosted: hidden) | Document unused upgrade component  | Complete/unrestricted                                                      |
| AI                    | Yes (`GPTIntegrationEndpoint`)                                                                              | Yes (editor/issue GPT popover)                                                              | None                                                                         | None                               | Configuration-dependent (`LLM_API_KEY` / provider / model)                 |
| Bulk archive          | Yes (`bulk-archive-issues/`, P4A hardened)                                                                  | Yes (selection toolbar; was unreachable)                                                    | Frontend `useBulkOperationStatus() => false`                                 | Unlock via `useSelfHostedPolicy()` | Existing + unlocked                                                        |

P7B domains (not re-implemented):

| Area        | Status                                               |
| ----------- | ---------------------------------------------------- |
| Worklogs    | Complete/unrestricted (P7B)                          |
| Templates   | Source absent                                        |
| Wiki        | Partial (project Pages only)                         |
| Teamspaces  | Partial (entity source absent; Active Cycles exists) |
| Initiatives | Source absent                                        |

## Gate table

| Gate                                                                                                                 | File                                                                         | Feature                                         | Gate Type                                                         | Previous Behavior                                                      | New Self-Hosted Behavior                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `useBulkOperationStatus() => false`                                                                                  | `apps/web/core/hooks/use-bulk-operation-status.ts`                           | Bulk archive selection (list/spreadsheet/Gantt) | Commercial remnant (frontend kill-switch over P4A implementation) | Selection disabled everywhere; Archive toolbar never appeared          | `return !hasCommercialGating` — self-hosted can select and archive; hosted stays separable if `commercial_gating` is ever true |
| TIME `is_ee: true`                                                                                                   | `packages/constants/src/estimates.ts`; estimate create helper/stage-one      | TIME estimate system                            | Commercial (frontend EE flag)                                     | Cloud: UpgradeBadge. Self-hosted: already enabled in P6                | Unchanged (already unlocked for self-hosted)                                                                                   |
| Sidebar `UpgradeBadge`                                                                                               | `workspace-menu-item.tsx`; `extended-sidebar-item.tsx`                       | Navigation badges                               | Marketing (hosted-only)                                           | Hidden when `hasCommercialGating` is false                             | Unchanged; self-hosted has no PRO badges                                                                                       |
| `PaidPlanUpgradeModal` / billing CTAs                                                                                | `edition-badge.tsx`; `upgrade-modal.tsx`; `plans.tsx`                        | Billing comparison                              | Marketing                                                         | Self-hosted: Community → billing settings; purchase CTAs disabled (P6) | Unchanged                                                                                                                      |
| `BulkOperationsUpgradeBanner`                                                                                        | `apps/web/core/components/issues/bulk-operations/upgrade-banner.tsx`         | Generic bulk marketing                          | Marketing (orphaned; unused)                                      | Not imported by live bulk root                                         | Unchanged (document-only; not deleted)                                                                                         |
| `WorkspaceActiveCyclesUpgrade`                                                                                       | `apps/web/core/components/active-cycles/workspace-active-cycles-upgrade.tsx` | Active Cycles marketing                         | Marketing (orphaned; unused)                                      | Live page uses real aggregate, not this CTA                            | Unchanged (document-only)                                                                                                      |
| Project `isPro` scaffolding                                                                                          | `features-list.tsx`                                                          | Cycles/Modules/Views/Pages/Intake/Time Tracking | Dead commercial scaffolding                                       | All `isPro: false`; badge never renders                                | Unchanged                                                                                                                      |
| `Project.cycle_view` / `module_view` / `issue_views_view` / `page_view` / `intake_view` / `is_time_tracking_enabled` | `db/models/project.py`                                                       | Project features                                | Product/config                                                    | Admin toggles hide/disable features per project                        | Preserved                                                                                                                      |
| Webhook SSRF / token auth / API throttle / pagination / batch 100                                                    | webhook, API token, paginator, bulk archive views                            | Operational/security                            | Operational / RBAC                                                | Enforced                                                               | Preserved                                                                                                                      |
| LLM credentials                                                                                                      | `app/views/external/base.py`                                                 | AI                                              | Configuration                                                     | 400 when unconfigured                                                  | Preserved; not treated as commercial absence                                                                                   |
| `DISABLE_WORKSPACE_CREATION`                                                                                         | workspace create view                                                        | Workspace creation                              | Operator policy                                                   | Instance admin setting                                                 | Preserved                                                                                                                      |

## Existing implementation proof (unlocked feature)

Bulk archive is a complete existing feature, not a stub:

- Backend: `POST /api/workspaces/:slug/projects/:project_id/bulk-archive-issues/` in `apps/api/plane/app/views/issue/archive.py`, registered in `apps/api/plane/app/urls/issue.py`
- Hardening: UUID/duplicate/batch (100)/scope/state-group validation (P4A)
- Frontend toolbar: `apps/web/core/components/issues/bulk-operations/root.tsx` (`Archive selected`, Admin/Member, sequential chunks of 100)
- Selection consumers: `issue-layouts/list/default.tsx`, `spreadsheet/spreadsheet-view.tsx`, `gantt/base-gantt-root.tsx`, `gantt-chart/chart/main-content.tsx`
- Tests: `apps/api/plane/tests/contract/app/test_bulk_issue_archive_app.py` (RBAC, tenant isolation, Community edition without a plan record)

The kill-switch was frontend-only. The API never checked plan/edition.

## Per-area notes

### Customers — Source absent

No Customer/CRM model, URL, view, or settings route. Hits are Space marketing copy, empty-state illustration keys, and billing “customers” wording. Not unlockable.

### Integrations — Partial

- DB: `apps/api/plane/db/models/integration/{base,github,slack}.py`
- Frontend: `apps/web/app/.../settings/(workspace)/integrations/page.tsx` is **not** registered in `core.ts` and is **not** in `WORKSPACE_SETTINGS`
- Client: `IntegrationService` / `AppInstallationService` call `/api/integrations/` and `workspace-integrations/` — **no matching Django URL modules**
- Instance may expose `github_app_name` / `slack_client_id` (configuration), which is insufficient without APIs
- OAuth **sign-in** (Google/GitHub/GitLab/Gitea) is a separate, configuration-dependent auth path

Do not mark Integrations commercially unavailable. Do not restore the settings route until real handlers exist (out of scope).

### Connections — Source absent

No Connections product. `SocialLoginConnection` is social-login linking. Issue relation “links” are unrelated.

### Exports — Complete/unrestricted

`ExportIssuesEndpoint` accepts `csv` / `xlsx` / `json` for `issue_exports` and `issue_worklogs` with workspace Admin/Member RBAC. No plan-limited format or count. Delivery needs object storage (and email where used).

### Webhooks — Complete/unrestricted

Workspace admin CRUD, secret regeneration, logs, async delivery, SSRF validation. No plan cap on webhook count. Operational URL/network rules preserved.

### Access Tokens — Complete/unrestricted

User-owned `APIToken` CRUD under profile settings. Workspace `/settings/api-tokens` redirects. Rate limits (`ApiKeyRateThrottle`) are operational, not commercial.

### Public Projects / Space — Complete/unrestricted

`DeployBoard` publish anchors + `apps/space`. Capability `public_projects` is enabled. Visibility and signed/public-boundary rules preserved; this is not an edition lock.

### Analytics — Complete/unrestricted

Workspace/project analytics, saved analytic views, chart APIs, CSV email export. No upgrade UI on analytics routes. Custom dashboard CRUD (`DashboardService` `/api/workspaces/:slug/dashboard/`) remains source-absent / orphan client — not built.

### Cycles, Modules, Views, Pages, Intake — Complete/unrestricted

Full models/APIs/UI. Remaining gates are project preference booleans (`isPro: false` scaffolding never shows UpgradeBadge). P4B/P6 already addressed Active Cycles / PRO badges; not regressed.

### Active Cycles — Complete/unrestricted

Live page calls `workspaceActiveCycles`. Unused `WorkspaceActiveCyclesUpgrade` is leftover marketing and is not mounted. Extended sidebar PRO badge is already `hasCommercialGating`-gated.

### AI — Configuration-dependent

Editor/issue GPT UI and `GPTIntegrationEndpoint` exist. Requests require LLM configuration; unconfigured instances get a non-secret 400. Not a plan/edition gate. Credentials are not faked.

### Bulk archive — Existing + unlocked

P4A replaced the Upgrade banner with Archive. This phase removes the leftover selection kill-switch for deployments without commercial gating. Deferred: bulk delete UI, bulk dates/labels, generic multi-property edit, query-based select-all.

## Security / RBAC

No permission classes, membership checks, tenant filters, webhook SSRF, token ownership, public-anchor rules, throttles, pagination, or bulk batch bounds were changed. Bulk archive still requires project Admin/Member; guests remain 403; cross-workspace/project IDs still 404 without mutation.

## Tests

No new backend tests (no API change). Re-ran existing suites:

```bash
docker compose -f docker-compose-test.yml run --rm api-tests pytest \
  plane/tests/contract/app/test_bulk_issue_archive_app.py \
  plane/tests/contract/app/test_self_hosted_unlimited.py -k "archive or policy" -q
# 15 passed, 10 deselected in 68.10s
# (12 bulk-archive contract tests including guest 403, cross-workspace/project
# isolation, Community member without a plan record, and batch bound;
# 3 policy endpoint tests: unlimited self-hosted, default Community edition,
# sanitized public policy with no subscription/invoice keys)
```

Frontend:

- `pnpm exec oxfmt --check` on the changed hook and this report: pass
- `pnpm exec oxlint apps/web/core/hooks/use-bulk-operation-status.ts --deny-warnings`: 0 warnings / 0 errors
- `pnpm --filter web check:format`: pass
- `pnpm --filter web check:lint`: exit 0 (779 pre-existing warnings, 0 errors; none from the changed hook)
- No i18n keys added. `apps/web` has no unit-test script for this hook.

## Deferred (explicitly out of scope)

- GitHub/Slack integration management/sync APIs and settings route restore
- Customers / Connections products
- Custom dashboards, generic automation, MFA/OIDC, backup/restore
- Templates, standalone Wiki, Teamspaces, Initiatives
- Deleting unused upgrade components or hosted billing marketing surfaces
- Changing hosted TIME `is_ee` or hosted `PaidPlanUpgradeModal` behavior
