# P8B Self-Hosted Integrated Regression & UX Parity

## Summary

P8B is an integrated validation pass over existing self-hosted Community functionality after P3A–P8A. No missing product domains were built. Three reachable wiring/test defects were fixed:

1. Workspace Active Cycles exists (route + API + page) but was omitted from the live sidebar registry, so it was only reachable by URL.
2. Power K page search fell back to `/wiki/:id`, which has no route.
3. Seat-unlimited contract fixtures created users without unique `username` values, so the P6 invite/RBAC suite errored in setup.

Billing purchase CTAs now follow `useSelfHostedPolicy()` instead of a hardcoded `isSelfManaged = true`. No fake Enterprise/license/billing state was added.

P8A (PR #13, merge `178d78d730`) is on `preview`. This branch is based on that tip.

## Method

- Walked `apps/web/app/routes/core.ts`, workspace/project settings constants, live sidebar (`SidebarMenuItems` / `ExtendedAppSidebar` / customize navigation), Admin routes, and Import Hub.
- Searched for `Upgrade`, `Upgrade to`, `PRO`, `Enterprise`, `Talk to Sales`, `Free plan`, `seat limit`, `requests per month`, `is_ee`, `isEnterprise`, `PaidPlanUpgradeModal`.
- Traced `GET /api/instances/` `capabilities.policy` and `useSelfHostedPolicy()`.
- Ran focused Docker pytest suites for policy, bulk archive, worklogs, Jira, capabilities/readiness, Active Cycles, API tokens, and public-project deploy-board scope.
- Browser automation was not available; manual UI steps are listed below.

## Integrated feature matrix

| Area                                                   | Route/UI                                                         | Backend                                    | Self-Hosted Access                                                     | Result                 | Fix                                                                              |
| ------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------- |
| Seats                                                  | Workspace Settings → Members; invite flow                        | Invite/accept has no seat check            | Unlimited (`seat_limit: null`)                                         | Pass after fixture fix | Unique usernames in `test_self_hosted_unlimited.py` so >12 invite/RBAC tests run |
| Bulk archive                                           | Work-item list/spreadsheet/Gantt selection toolbar               | `POST .../bulk-archive-issues/`            | `useBulkOperationStatus()` → `!hasCommercialGating`                    | Pass                   | None                                                                             |
| Active Cycles                                          | `/:workspaceSlug/active-cycles`; now also sidebar More / pin     | `GET /api/workspaces/:slug/active-cycles/` | No PRO badge when `hasCommercialGating` is false                       | Pass after nav restore | Added `active_cycles` to `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS`            |
| Worklogs                                               | Issue widget; Settings → Worklogs                                | Nested CRUD + exporter                     | No commercial gate; project `is_time_tracking_enabled` is a preference | Pass                   | None                                                                             |
| TIME estimates                                         | Project Settings → Estimates                                     | `EstimateType.TIME`                        | Enabled via `isEstimateSystemEnabled(..., isSelfHosted)`               | Pass                   | None                                                                             |
| Import Hub/Jira                                        | `/:workspaceSlug/settings/imports`; `/imports/jira`              | Jira Cloud preview/start/cancel            | Five cards; unavailable modal (not Upgrade); mixed history             | Pass                   | None                                                                             |
| Analytics                                              | `/:workspaceSlug/analytics/:tabId` (redirect from `/analytics`)  | Analytic views/charts/export               | No upgrade UI                                                          | Pass                   | None                                                                             |
| Exports                                                | `/:workspaceSlug/settings/exports`                               | CSV/JSON/XLSX issue + worklog export       | Unrestricted; delivery needs storage/email                             | Pass                   | None                                                                             |
| Webhooks                                               | `/:workspaceSlug/settings/webhooks`                              | CRUD, logs, SSRF-validated delivery        | No count/plan limit                                                    | Pass                   | None                                                                             |
| API tokens                                             | Profile → API tokens; workspace `/settings/api-tokens` redirects | User-owned `APIToken` CRUD                 | Unrestricted; throttle is operational                                  | Pass                   | None                                                                             |
| Public Projects                                        | Publish modal + Space                                            | `DeployBoard` / `space/` APIs              | `public_projects.enabled`                                              | Pass                   | None                                                                             |
| AI                                                     | Issue GPT popover when `has_llm_configured`                      | `.../ai-assistant/`                        | Configuration-required, not paid                                       | Pass                   | None                                                                             |
| SMTP                                                   | Admin Email + Readiness; magic link uses `is_smtp_configured`    | Invites, reset, notifications              | Configuration-required                                                 | Pass                   | None                                                                             |
| Storage                                                | Uploads/exports; Admin Readiness                                 | `S3Storage` + signed URLs                  | Configuration-required                                                 | Pass                   | None                                                                             |
| OAuth                                                  | Web/Space login buttons                                          | Google/GitHub/GitLab/Gitea                 | Buttons follow `capabilities.oauth.providers.*.ready`                  | Pass                   | None                                                                             |
| Workspace/project create                               | `/create-workspace`; project create modal                        | Existing create APIs                       | `DISABLE_WORKSPACE_CREATION` is operator policy                        | Pass                   | None                                                                             |
| Work items / Cycles / Modules / Views / Pages / Intake | Project routes in `core.ts`                                      | Existing models/APIs                       | Project preference toggles only (`isPro: false`)                       | Pass                   | None                                                                             |

## Dead / broken route audit

Live navigation is `SidebarMenuItems` + extended sidebar + customize dialog, all driven by `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS` in `packages/constants/src/workspace.ts`. Unused `workspace-menu.tsx` / `user-menu.tsx` are not mounted.

| Finding                                                                                                              | Decision                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Active Cycles page and API exist; live sidebar omitted `active_cycles` (unused `workspace-menu.tsx` still linked it) | **Restored** the existing destination in the live registry. Default: unpinned (appears under More); pin via customize navigation. Admin/Member only. |
| Power K pages without `project_ids` linked `/:workspaceSlug/wiki/:id`                                                | **Removed** the wiki fallback. Empty path does not navigate. Project Pages remain the destination when a project id exists.                          |
| `apps/web/.../settings/(workspace)/integrations/page.tsx` exists but is **not** in `core.ts` or `WORKSPACE_SETTINGS` | **Leave hidden.** Client calls missing `/api/integrations/` URLs (P7C). Do not restore.                                                              |
| Unused `SidebarUserMenu` lists `/dashboards/` and `/pi-chat/`                                                        | **Leave.** Components are unmounted; no live nav entry. Dashboards / Pi Chat remain source-absent.                                                   |
| Project Settings → Automations                                                                                       | **Keep.** Page is auto-archive / auto-close, not generic automation.                                                                                 |
| `/:workspaceSlug/settings/api-tokens`                                                                                | **Keep redirect** to `/settings/profile/api-tokens`.                                                                                                 |
| `/:workspaceSlug/analytics`                                                                                          | **Keep redirect** to `/analytics/overview`.                                                                                                          |
| `/:workspaceSlug/projects/:id/inbox`                                                                                 | **Keep redirect** to intake.                                                                                                                         |
| `/:workspaceSlug/projects/:id/settings/*`                                                                            | **Keep redirect** to workspace-scoped project settings.                                                                                              |
| `extended.ts` is empty                                                                                               | **Leave.**                                                                                                                                           |
| Orphan marketing: `WorkspaceActiveCyclesUpgrade`, `BulkOperationsUpgradeBanner`                                      | **Leave unused.** Not mounted.                                                                                                                       |
| `use-workspace-paths.ts` `isWikiPath` / `isAiPath`                                                                   | **Leave.** Path detection only; no wiki/pi-chat routes added.                                                                                        |

## Commercial-copy audit

| Hit                                                                                                 | Classification                                                                                                             |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `PaidPlanUpgradeModal`, checkout/Talk-to-Sales cards, `plans.tsx` `buttonCTA` Upgrade/Talk to Sales | Hosted-only legitimate. Self-hosted edition badge goes to billing; plan CTAs disabled when `hasCommercialGating` is false. |
| `UpgradeBadge` on sidebar / Active Cycles                                                           | Hosted-only; gated with `hasCommercialGating`. Self-hosted: hidden.                                                        |
| Project `features-list.tsx` `isPro: false`                                                          | Dead scaffolding; badge never renders. Leave.                                                                              |
| TIME `is_ee: true` in `packages/constants/src/estimates.ts`                                         | Hosted TIME gate. Self-hosted already enabled in P6. Leave hosted behavior.                                                |
| Billing comparison marketing (Templates, Initiatives, Wiki, Teamspaces, customers)                  | Missing-feature marketing. Do not convert to fake functionality. Informational comparison remains.                         |
| SLA “can be requested” link to plane.so                                                             | Hosted comparison copy inside billing table. Leave.                                                                        |
| `navigation.json` `sidebar.pro` / `sidebar.upgrade`                                                 | Strings for hosted badges. Leave.                                                                                          |
| Unused `BulkOperationsUpgradeBanner` / `WorkspaceActiveCyclesUpgrade`                               | Unused/dead. Leave.                                                                                                        |
| Reachable stale “50 requests per month”                                                             | Already removed in P8A. Not present.                                                                                       |

`upgrade_required` / `enterprise_required` / `plan_limit` / `subscription_required` / `feature_not_available` / `isEnterprise`: no Python/TS action gates on audited existing features.

## Self-hosted policy consistency

`GET /api/instances/` `capabilities.policy` remains the source of truth (`apps/api/plane/license/utils/capabilities.py`):

- `self_hosted: true` (from `IS_SELF_MANAGED`)
- `commercial_gating: false`
- `feature_tier: unlimited`
- `seat_limit` / `member_limit` / `project_limit`: `null`

Frontend: `useSelfHostedPolicy()` in `apps/web/core/hooks/store/use-self-hosted-policy.ts`. P8B wired billing comparison CTAs through that hook (`!hasCommercialGating`) instead of a hardcoded boolean.

## Import Hub

- Registry still has five providers (`packages/constants/src/importer.ts`).
- Jira Cloud: `launch: "route"` → `/settings/imports/jira`.
- Jira Server/DC, Linear, Asana, ClickUp: `launch: "unavailable"` → honest modal, no Upgrade CTA.
- History is provider-neutral; cancel remains for queued/processing.
- Jira preview remains POST (token not in URL). No importer backends added.

## Worklogs / Time

Existing CRUD, workspace download page, project toggle, TIME estimates, and worklog export are unchanged and unrestricted commercially. No redesign.

## AI / configuration-dependent features

Readiness still matches P8A: AI/SMTP/storage/OAuth unconfigured surfaces are configuration-required. Login OAuth buttons use capability `ready`. Credentials are not returned on public instance/capability APIs. Automated tests mock third-party calls.

## Security regression

Unlimited means commercial limits removed, not security controls. Touched tests still cover:

- Invite RBAC (member cannot invite admin; guest denied; unauthenticated 401; email match; cross-workspace 404)
- Bulk archive guest 403, tenant isolation, batch 100
- Worklogs unauthorized / private project / cross-workspace
- Jira host validation, token redaction, guest 403
- Active Cycles membership / `cycle_view` / pagination
- API token ownership
- Deploy-board project scope
- Capability responses without secrets

Webhook SSRF, OAuth `state`, signed URL expiry, upload limits, and auth throttles were not relaxed.

## Tests

Backend (Docker):

```bash
docker compose -f docker-compose-test.yml run --rm api-tests pytest \
  plane/tests/contract/app/test_self_hosted_unlimited.py \
  plane/tests/contract/app/test_bulk_issue_archive_app.py \
  plane/tests/contract/app/test_issue_worklogs_app.py \
  plane/tests/unit/utils/test_worklog_export.py \
  plane/tests/contract/app/test_jira_importer_app.py \
  plane/tests/unit/license/test_capabilities.py \
  plane/tests/contract/license/test_instance_capabilities.py \
  plane/tests/contract/app/test_config_dependent_activation.py \
  plane/tests/contract/app/test_workspace_active_cycles_app.py \
  plane/tests/contract/app/test_api_token.py \
  plane/tests/contract/app/test_deploy_board_project_scope_app.py -q
```

First run: **108 passed, 9 errors** in 663.00s. All 9 errors were `IntegrityError` on `users_username_key` (`username=''`) in seat-unlimited fixtures.

After unique `username` on `_create_user`:

```bash
docker compose -f docker-compose-test.yml run --rm api-tests pytest \
  plane/tests/contract/app/test_self_hosted_unlimited.py -q
# 13 passed in 296.82s
```

Modules that already passed in the first run (unchanged by the fixture fix): bulk archive, worklogs, worklog export, Jira importer, capabilities unit, instance capabilities, config-dependent activation, Active Cycles, API tokens, deploy-board project scope.

No live OpenAI, SMTP, S3, OAuth, or Jira network calls.

Frontend:

- `oxfmt --check` on changed TS: pass
- `oxlint ... --deny-warnings` on changed TS: 0 warnings / 0 errors
- `@plane/constants` `check:types`: pass
- `@plane/i18n` `sync:check`: all locales 100% (no new keys)
- `web check:format`: pass
- `web check:types`: pass

Admin/Space were not modified.

### Manual UI (browser automation unavailable)

1. Pin Active Cycles from More / customize navigation; page lists running cycles; no PRO badge.
2. Settings → Imports: five cards; Jira form; other providers unavailable modal; no Upgrade.
3. Members: invite past 12 seats.
4. Work items: select + Archive selected (Admin/Member).
5. Estimates: TIME system available.
6. Settings → Worklogs, Exports, Webhooks; profile API tokens.
7. Admin Readiness: AI/SMTP/storage/OAuth status without secrets.
8. Login: OAuth buttons only when provider `ready`.
9. Power K page search never navigates to `/wiki/...`.

## Files changed

- `packages/constants/src/workspace.ts` — register Active Cycles in live sidebar
- `apps/web/core/components/power-k/ui/modal/search-results-map.tsx` — drop wiki fallback
- `apps/web/core/components/power-k/ui/modal/search-results.tsx` — skip empty search paths
- `apps/web/core/components/workspace/billing/comparison/root.tsx` — billing CTAs from policy
- `apps/api/plane/tests/contract/app/test_self_hosted_unlimited.py` — unique usernames in fixtures
- `docs/implementations/p8b-self-hosted-regression.md` — this report

## Remaining source-absent features

Not implemented (navigation does not expose working product surfaces except billing marketing copy):

- Templates (work-item / project)
- Initiatives
- Teamspaces as an entity (Active Cycles is not a Teamspace)
- Standalone Wiki (`/wiki`)
- Customers
- Connections product
- Custom dashboards
- Pi Chat as a workspace app
- GitHub/Slack integration management APIs (orphan page stays unregistered)
- Jira Server/DC, Linear, Asana, ClickUp importer backends
- SAML/OIDC/LDAP/SCIM
- Backup/restore
- Generic automation beyond project auto-archive/auto-close
