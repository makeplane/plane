# Feature & Edition Gap Analysis

## 1. Executive Summary

This analysis uses `docs/architecture.md` as its baseline and traces capabilities across React routes/navigation, browser API clients, Django URL registration, views, permissions, models, jobs, configuration, and tests. The checked-out source is the Community deployment (`Instance.edition` defaults to `PLANE_COMMUNITY` in `apps/api/plane/license/models/instance.py`). It contains no general entitlement evaluator, billing provider, license-key validator, or paid-plan authorization path.

The main finding is that the product has a substantial, usable self-hosted core: workspace/project/member management, issues and relations, cycles, modules, saved views, intake, pages with collaborative editing, analytics, exports, webhooks, public project publishing, API tokens, and instance administration. Several cloud-plan labels are present only as UI/marketing material.

There are three materially different gaps:

- **Real configuration flags:** a project admin can enable/disable cycles, modules, views, pages, and intake. These are persisted project booleans and affect navigation; they are not plan checks.
- **Hidden/source-missing product promises:** the workspace Active Cycles route is an upgrade CTA with no corresponding aggregate backend API; generic multi-property bulk editing similarly renders a CTA despite limited bulk API endpoints. Dashboard client code has no matching dashboard route/model implementation in this checkout.
- **External/provider dependencies:** AI calls an OpenAI-compatible SDK using administrator-supplied credentials; OAuth, SMTP, Unsplash, object storage, telemetry and external integrations require configured external systems.

No paid/proprietary source package or separately distributed enterprise module is included. References to SAML/OIDC/LDAP, custom reports, project templates, and automation appear in plan/marketing data, while matching implementation was not found; they are source-absent here, not safely “unlockable.”

## 2. Scope and Methodology

Read first: `docs/architecture.md`. The review then inspected:

- `apps/web/app/routes/{core,extended}.ts`, workspace/project/sidebar components, settings routes, upgrade components and browser services;
- `apps/admin/app/routes.ts`, navigation hooks and instance configuration forms;
- all Django app/API/space URL modules, primary views, permissions and database models;
- `apps/api/plane/tests`, environment templates, deployment files and package manifests;
- terms for editions, plans, flags, automation, custom fields, dashboards, identity, imports and vendor domains.

Classification means the dominant state in this checkout. “Source absent” means searches covered alternate terminology, routes, models, clients, tests and relevant UI—not that a separately licensed product cannot provide the feature.

## 3. Phase 1 Architecture Baseline

The application is a Django/DRF shared-schema modular monolith with React Router `web`, `admin`, and `space` applications; PostgreSQL; Celery/RabbitMQ; Valkey/Redis; S3-compatible storage/MinIO; Caddy; and a separate Hocuspocus/Yjs document service. Workspace UUID/slug and membership form the tenant boundary. Browser authentication is database-backed sessions; Admin/Member/Guest permissions are enforced server-side (`apps/api/plane/app/permissions/`). See `docs/architecture.md` for deployment, data-flow and security detail.

## 4. Edition / Deployment Model

`Instance.edition` is a persisted label whose only current enum value is `PLANE_COMMUNITY` (`apps/api/plane/license/models/instance.py`). Migration `0005_rename_product_instance_edition_and_more.py` removed historical `license_key` and `user_count` fields. The license app implements instance setup, administration, configuration encryption and telemetry, not commercial feature authorization.

The frontend has static Free/One/Pro/Business/Enterprise pricing/features and redirects self-hosted upgrade CTAs to `plane.so`/`app.plane.so` (`packages/constants/src/{subscription,payment}.ts`, `apps/web/core/components/license/modal/upgrade-modal.tsx`). No matching subscription model, payment webhook, entitlement service or backend consumer was found. Therefore UI plan language is not evidence that a feature implementation is hidden in this source.

## 5. Feature Gating Mechanisms

| Mechanism                | Verified behavior                                                                                                                          | Evidence                                                                                                                                            | Classification impact                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Project feature booleans | `cycle_view`, `module_view`, `issue_views_view`, `page_view`, and `intake_view` control project navigation; project settings updates them. | `db/models/project.py`; `app/views/project/base.py`; `web/core/components/navigation/use-navigation-items.ts`; `project/settings/features-list.tsx` | C — feature-flagged/configured.                    |
| Workspace creation       | `DISABLE_WORKSPACE_CREATION=1` rejects creation. Value is read through instance configuration/environment lookup.                          | `app/views/workspace/base.py`; `license/utils/instance_value.py`                                                                                    | C — instance operator policy.                      |
| Role checks              | UI hides actions and backend decorators/classes reject unauthorized requests.                                                              | `app/permissions/{base,workspace,project}.py`; route pages using `useUserPermissions`                                                               | Security boundary, not edition gating.             |
| Upgrade CTA              | Static modal or link opens external pricing/upgrade pages.                                                                                 | `license/modal/upgrade-modal.tsx`; `workspace-active-cycles-upgrade.tsx`; `bulk-operations/upgrade-banner.tsx`                                      | Presentation only unless an endpoint/model exists. |
| Admin configuration      | Database/environment values configure OAuth, SMTP, LLM, Unsplash and workspace creation.                                                   | `utils/instance_config_variables/core.py`; `license/api/views/configuration.py`                                                                     | C/D depending on capability.                       |

No remote flag SDK, per-plan backend capability map, build-time Community/Enterprise switch, or database feature-flag table/evaluator was found.

## 6. Feature Flag Architecture

| Flag / configuration                            | Purpose                         | Default                 | Scope       | Source / consumer                                             | Self-hosted effect                                                                  |
| ----------------------------------------------- | ------------------------------- | ----------------------- | ----------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `cycle_view`, `module_view`, `issue_views_view` | Enable project features         | `False`                 | Project row | `db/models/project.py`; `use-navigation-items.ts`             | Hides project tabs; route/API security still requires normal project authorization. |
| `page_view`                                     | Enable project pages tab        | `True`                  | Project row | same                                                          | Project-level visibility control.                                                   |
| `intake_view` (`inbox_view` API alias)          | Enable project intake           | model default in source | Project row | `db/models/project.py`; `app/serializers/project.py`          | Project-level visibility/control.                                                   |
| `guest_view_all_features`                       | Guest capability policy field   | `False`                 | Project row | `db/models/project.py`; project serializers/views             | A real permission/configuration input; exact all-feature matrix varies by endpoint. |
| `DISABLE_WORKSPACE_CREATION`                    | Disable user workspace creation | `0`                     | Instance    | `app/views/workspace/base.py`; instance configuration         | Administrative gate, not a paid limit.                                              |
| `LLM_API_KEY`, `LLM_PROVIDER`, `LLM_MODEL`      | Enable/configure AI requests    | no key / `openai`       | Instance    | `app/views/external/base.py`; admin AI form                   | AI requests return 400 without valid configuration.                                 |
| OAuth/SMTP/Unsplash configuration keys          | Configure external providers    | provider-specific/unset | Instance    | `utils/instance_config_variables/core.py`; admin routes/forms | Features remain unavailable or empty until configured.                              |

## 7. Upgrade / Plan UI Analysis

The billing page and plan comparison are routed in `apps/web/app/routes/core.ts`; `PaidPlanUpgradeModal` hard-codes `isSelfHosted = true` and opens external redirects. The workspace Active Cycles route is also registered, but its page always renders `WorkspaceActiveCyclesUpgrade`, a marketing CTA (`apps/web/app/(all)/[workspaceSlug]/(projects)/active-cycles/page.tsx`; `core/components/active-cycles/workspace-active-cycles-upgrade.tsx`). Searches found no workspace-active-cycle DRF endpoint/view/model corresponding to its claimed aggregate analysis.

`IssueBulkOperationsRoot` always renders `BulkOperationsUpgradeBanner` in list, Gantt and spreadsheet layouts, but the backend does have narrow bulk delete/archive/label/date endpoints (`apps/web/core/components/issues/bulk-operations/root.tsx`; `apps/api/plane/app/urls/issue.py`; `app/views/issue/{base,archive,label}.py`). This is the closest identified implemented-but-hidden capability; its UI would still need explicit server-side operation coverage and authorization review before exposure.

## 8. Complete Product Feature Inventory

### 8.1 Workspaces

Workspace create/delete/settings, branding/logo/assets, multiple workspaces per user, member management, exports, webhooks, recent visits/favorites and workspace analytics are implemented (A). Evidence: `app/views/workspace/`, `db/models/workspace.py`, `app/urls/workspace.py`, `web/app/routes/core.ts`. Workspace creation can be operator-disabled (C). Workspace transfer, workspace templates and application-level backup/restore are source-absent (F).

### 8.2 Members / Guests and 8.3 Roles & Permissions

Invitations, batched invitations, acceptance, reactivation/deactivation, workspace/project membership and Admin/Member/Guest roles are implemented (A): `app/views/workspace/invite.py`, `app/views/project/member.py`, `db/models/{workspace,project}.py`. Guests are a role, not a separately billed seat type. Custom roles, permission builders, directory sync, groups/teams and SCIM are source-absent (F); no `Team` model exists.

### 8.4 Projects

Create/update/archive/delete, project membership, state/label/estimate settings, cover/logo, private network field, feature toggles and public publishing are implemented (A/C). `Project`, `ProjectMember`, and publishing data live in `db/models/project.py` and `deploy_board.py`; routes/views are under `app/urls/project.py`, `app/views/project/`, and `space/`. Project templates and full duplication/import workflow are absent/partial (F/E): an `Importer` model lists GitHub/Jira but no app URL/view implementation for it was found.

### 8.5 Issues / Work Items

Issues, drafts, sub-items/parent links, status/state groups, issue types, priorities, estimates, start/target dates, labels, multiple assignees, comments/reactions, attachments, mentions, subscribers, relations/blockers/duplicates, versions and activity are implemented (A). Evidence: `db/models/issue.py`, `issue_type.py`, `app/urls/issue.py`, `app/views/issue/`, `api/urls/work_item.py`. The work-item UI supports list, board, calendar, Gantt and spreadsheet layouts. Custom fields are source-absent (F): only a filter converter keyword was found, with no model/API/UI field-definition implementation.

### 8.6 Cycles / Sprints

Project cycles, issue assignment/transfer, archive, progress snapshots and cycle analytics/burndown UI are implemented (A): `db/models/cycle.py`, `app/urls/cycle.py`, `app/views/cycle/`, `web/core/components/cycles/`. Scheduled archive/close automation is implemented (A) by `bgtasks/issue_automation_task.py`. Recurring cycles, cycle templates and the advertised cross-project Active Cycles aggregate are source-absent (F).

### 8.7 Modules / Epics / Planning

Modules are implemented as the repository’s higher-level planning entity (A): `db/models/module.py`, `app/urls/module.py`, `app/views/module/`. They support issue membership, archives and analytics. Separate epics, initiatives, portfolio/program planning and cross-project roadmap source were not found (F); an `epic-modal` component name alone is insufficient evidence of a persisted Epic feature.

### 8.8 Views

Project/workspace saved views, rich filters, grouping/sorting and multiple layouts are implemented (A): `db/models/view.py`, `app/urls/views.py`, `app/views/view/base.py`, `web` view/layout components. Visibility is controlled by the project `issue_views_view` toggle (C). Public project publishing is separate from saved-view sharing.

### 8.9 Custom Fields

F — source absent. No custom-field definition/value model, migration, URL/view, settings UI, or importer/exporter support was located.

### 8.10 Dashboards / Analytics

Workspace/project analytics, saved analytic views, chart APIs and CSV email export are implemented (A): `db/models/analytic.py`, `app/urls/analytic.py`, `app/views/analytic/`, `web/.../analytics/`. The browser `DashboardService` and MobX dashboard store request dashboard endpoints, but the checked backend has only `UserWorkspaceDashboardEndpoint`, not the service’s `/api/workspaces/:slug/dashboard/` or `/api/dashboard/:id/` route/model implementation (`packages/services/src/dashboard/dashboard.service.ts`, `apps/api/plane/app/urls/user.py`). Custom dashboard CRUD/widgets are E — orphan frontend client/state with missing server implementation in this checkout. “Custom Reports” is only plan text (F).

### 8.11 Automation

E — the project settings route/UI configures only auto-close and auto-archive; the Celery task executes those configured policies (`web/core/components/automation/`, `bgtasks/issue_automation_task.py`). There is no discovered rule/trigger/action model, rule API or generic automation engine. Marketing references to workflows/approvals/automation flows are F.

### 8.12 Notifications

In-app notifications, preferences, subscriptions/watchers, mentions and batched email notifications are implemented (A): `db/models/notification.py`, `app/urls/notification.py`, `bgtasks/{notification_task,email_notification_task,issue_activities_task}.py`. Browser push, mobile push and configurable digest workflow were not confirmed (F).

### 8.13 Search

Global/workspace/project issue/entity search and rich filters are implemented using PostgreSQL/querysets (A): `app/urls/search.py`, `app/views/search/`, `utils/issue_search.py`. No external search engine or plan gate was found. Results are intentionally bounded operationally.

### 8.14 Pages / Documents

Pages support nesting, workspace/project association, labels, public/private access field, locks, versions, page logs, rich text and asset duplication (A): `db/models/page.py`, `app/urls/page.py`, `app/views/page/`, `web` page routes/components. Hocuspocus/Yjs collaboration is implemented (A/D) through `apps/live`. Page templates and page-specific public publishing/export were not confirmed (F/E); project public publishing is the verified public surface.

### 8.15 API

REST APIs, session auth, API tokens (including service flag), OpenAPI schema, API logs and server-side throttles are implemented (A): `api/urls/schema.py`, `db/models/api.py`, `api/middleware/api_authentication.py`, `api/rate_limit.py`. OAuth application authorization/scopes and managed service-account administration beyond API-token fields are source-absent/partial (F/E). No edition API gate was found.

### 8.16 Webhooks

Workspace webhook CRUD, secret regeneration, logs, asynchronous delivery and SSRF target validation are implemented (A): `db/models/webhook.py`, `app/urls/webhook.py`, `app/views/webhook/base.py`, `bgtasks/webhook_task.py`, `settings/common.py`. Retry behavior exists in task code but operators should test its policy before depending on it; no plan gate was found.

### 8.17 Integrations

OAuth sign-in for Google/GitHub/GitLab/Gitea is implemented but provider-dependent (D). GitHub repository/issue/comment sync and Slack project sync models exist (D/E), but no complete user-facing integration-management route was confirmed in the inspected web routes. Jira/GitHub importer models/types/clients exist, but no matching app importer endpoint implementation was found (E). Bitbucket, Teams, Discord, calendar, Linear, Trello, Asana and full Jira importer source are absent (F).

### 8.18 Import / Export

Issue/worklog exports in CSV/JSON/XLSX are implemented asynchronously to object storage (A/D): `db/models/exporter.py`, `app/urls/exporter.py`, `app/views/exporter/base.py`, `bgtasks/export_task.py`. Export requires configured storage/email for delivery. Import is E: `Importer` data model and browser client/types exist, but implementation endpoints/jobs were not located.

### 8.19 Authentication / SSO

Email/password, magic links, password reset, and Google/GitHub/GitLab/Gitea OAuth are implemented (A/D): `authentication/urls.py` and provider/view modules. OAuth requires operator-provided provider credentials. SAML, OIDC, LDAP, SCIM, MFA, enforced SSO and domain-directory controls are F; their names occur in plan copy only.

### 8.20 Audit Logs

E — audit fields/mixins, issue activities, page logs, API logs and webhook logs exist (`db/mixins.py`, `db/models/page.py`, `db/models/webhook.py`, `bgtasks/logger_task.py`). A unified workspace/admin audit-log model, UI, query API and export were not found.

### 8.21 Admin

Instance setup and admin sessions, workspace listing/creation, general settings, email/SMTP, OAuth provider credentials, AI configuration, image/Unsplash configuration, telemetry and workspace-creation policy are implemented (A/C): `apps/admin/app/routes.ts`, `license/api/views/{admin,configuration,instance,workspace}.py`, `utils/instance_config_variables/core.py`. No admin UI for queue control, backup/restore, feature-rollout rules or general user directory was found (F).

### 8.22 AI

D — project/workspace assistant endpoints and editor UI are implemented (`app/urls/external.py`, `app/views/external/base.py`, `web/core/services/ai.service.ts`). Requests require instance LLM configuration and call the OpenAI SDK. The provider list claims OpenAI/Anthropic/Gemini, but the implementation constructs `OpenAI(api_key=...)` for all; OpenAI-compatible configuration is the verified path. A self-hosted OpenAI-compatible endpoint may be feasible only after deliberately adding/configuring a base URL; this source does not currently expose one in `get_llm_response`.

### 8.23 Templates

F — no project/issue/page template model, route, task or settings implementation was found. Seed/default workspace creation is not a reusable template feature.

### 8.24 Public Sharing

A — projects can be published to the `space` application using `DeployBoard` anchor records; the public API verifies the anchor and supports public project, issue, comments/reactions/votes, intake, assets, cycles/modules/states/labels/members according to the published project surface (`db/models/deploy_board.py`, `space/urls/`, `space/views/`, `web/core/components/project/publish-project/modal.tsx`). This is an intentional public boundary; do not expose private data by merely adding links.

### 8.25 Branding and 8.26 Backup / Restore

Branding is partial (E): user/workspace/project images and cover/logo asset fields exist (`db/models/{user,workspace,project,asset}.py`), while white-label/custom-domain/email-branding source was not found. Backup/restore is F at application level; deployment scripts document installation/restore operations, but no in-product backup service/API exists.

## 9. Master Feature Matrix

| Feature                            | UI                  | Backend / DB                 | Gate/dependency                   | Classification | Evidence                                       | Recommendation                                     |
| ---------------------------------- | ------------------- | ---------------------------- | --------------------------------- | -------------- | ---------------------------------------------- | -------------------------------------------------- |
| Workspace/member/project lifecycle | Yes                 | Yes                          | roles; creation config            | A/C            | `app/views/workspace/`, `api/views/project.py` | Retain RBAC; treat creation switch as policy.      |
| Roles/guests                       | Yes                 | Yes                          | backend RBAC                      | A              | permissions + membership models                | No commercial work indicated.                      |
| Custom roles/groups/teams          | No verified         | No                           | —                                 | F              | no model/API after terminology search          | Independent design if needed.                      |
| Work items/sub-items/relations     | Yes                 | Yes                          | project roles                     | A              | issue model/views/routes                       | Already available.                                 |
| Custom fields                      | No                  | No                           | —                                 | F              | no model/API/settings UI                       | New cross-layer feature.                           |
| Cycles / modules                   | Yes                 | Yes                          | project feature booleans          | C              | project model + cycle/module routes            | Expose by project config, not plan.                |
| Active Cycles aggregate            | CTA only            | No matching API              | pricing link                      | F              | active-cycles page/component                   | Independent aggregate implementation.              |
| Saved views/layouts                | Yes                 | Yes                          | `issue_views_view`                | C              | view model/routes; navigation hook             | Existing configurable feature.                     |
| Intake                             | Yes                 | Yes                          | `intake_view`                     | C              | intake model/routes                            | Existing configurable feature.                     |
| Analytics/saved analytic views     | Yes                 | Yes                          | roles                             | A              | analytic model/URLs/views                      | Already available.                                 |
| Custom dashboards                  | client/store only   | backend routes missing       | —                                 | E              | dashboard service vs URLs                      | Complete server contract first.                    |
| Bulk work-item operations          | CTA for general UI  | narrow bulk APIs             | upgrade banner                    | B/E            | bulk root; issue URLs/views                    | Validate/security-test before any UI work.         |
| Generic automation                 | limited settings UI | scheduled close/archive only | —                                 | E              | automation components/task                     | Requires rule engine.                              |
| Pages/collaboration                | Yes                 | Yes                          | project page toggle; live service | A/D            | page model/routes; `apps/live`                 | Keep authorization/live scaling.                   |
| Public projects                    | Yes                 | Yes                          | explicit publish anchor           | A              | DeployBoard/space app                          | Preserve public-boundary checks.                   |
| Webhooks                           | Yes                 | Yes                          | workspace admin; external target  | A/D            | webhook views/task                             | Already available; keep SSRF controls.             |
| Export                             | Yes                 | Yes                          | object storage/email              | D              | exporter model/task                            | Configure self-hosted storage/SMTP.                |
| Import (Jira/GitHub)               | types/client        | model only; handlers absent  | external APIs                     | E              | importer model/client search                   | Complete endpoint/job flow.                        |
| OAuth login                        | Yes                 | Yes                          | provider credentials              | D              | authentication providers/admin config          | Operator-provided credentials.                     |
| SAML/OIDC/LDAP/SCIM/MFA            | marketing only      | absent                       | proprietary/absent source         | F/G            | subscription constants/search                  | Clean implementation or authorized source.         |
| AI assistant                       | Yes                 | Yes                          | LLM credentials/provider          | D              | external endpoints/admin form                  | Self-host-compatible adapter is future work.       |
| Unsplash picker                    | Yes                 | Yes                          | Unsplash key/API                  | D              | `UnsplashEndpoint`                             | Optional; replace only with separate asset source. |
| Unified audit log                  | no verified UI      | fragmented logs              | —                                 | E              | audit mixin/log models                         | Design a secure aggregate audit stream.            |
| Templates                          | no verified         | absent                       | —                                 | F              | no model/API                                   | New feature.                                       |
| Backup/restore UI                  | no                  | absent                       | infrastructure only               | F              | deployments/scripts only                       | Keep as infra responsibility or add service.       |

## 10. Hidden / Disabled Feature Matrix

| Feature                                   | Existing backend                                  | Existing UI    | Blocking mechanism                                      | Complexity to expose | Security note                                                            |
| ----------------------------------------- | ------------------------------------------------- | -------------- | ------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------ |
| General bulk work-item operations         | Partial: bulk delete/archive/label/date endpoints | UI root is CTA | `IssueBulkOperationsRoot` always renders upgrade banner | Medium               | Need an operation-by-operation server permission and transaction review. |
| Project cycles/modules/views/pages/intake | Yes                                               | Yes            | persisted project feature switches                      | Low                  | Treat as admin-controlled project configuration; do not bypass roles.    |
| Workspace creation                        | Yes                                               | Yes            | `DISABLE_WORKSPACE_CREATION`                            | Very Low             | Instance policy; retain administrator control.                           |

No other meaningful B classification was verified. Active Cycles, templates, SSO and custom reports are not included here because no corresponding feature implementation was found.

## 11. Feature-Flagged Capabilities

The flag inventory in section 6 is complete for discovered capability gates. The important architectural conclusion is that feature switches are product configuration/permission controls at the project or instance layer, not a plan-entitlement system. Project route access should still be checked on both frontend and backend before changing navigation behavior.

## 12. External-Service Dependencies

| Feature                         | External service                      | Dependency type           | Required for core operation?           | Self-hosted replacement possibility                                             |
| ------------------------------- | ------------------------------------- | ------------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| Object attachments/exports      | S3 API / MinIO                        | Object storage            | Yes for files/exports                  | MinIO is already supplied by Compose.                                           |
| Email/magic/reset/notifications | SMTP provider                         | Delivery                  | No for local core, yes for email flows | Administrator-managed SMTP.                                                     |
| OAuth sign-in                   | Google/GitHub/GitLab/Gitea            | OAuth provider            | No; password/magic remain              | Self-hosted identity provider needs new OIDC/SAML implementation.               |
| AI assistant                    | OpenAI-compatible remote API          | LLM inference             | No                                     | Future adapter/base URL support could target a self-hosted compatible endpoint. |
| Unsplash image picker           | `api.unsplash.com`                    | Media search              | No                                     | Disable or independently integrate another source.                              |
| Telemetry/observability         | configured OTLP, Scout APM, PostHog   | telemetry/APM             | No                                     | Self-hosted collector or disable telemetry.                                     |
| Public project sharing          | `space` app deployment                | companion application     | No                                     | Already self-hosted in Compose.                                                 |
| Webhooks/GitHub/Slack           | customer-selected endpoints/SaaS APIs | integration delivery/sync | No                                     | Depends on desired endpoints; no generic local substitute.                      |

## 13. Partially Implemented Capabilities

- **Automation:** settings and scheduled auto-close/archive exist, but no generic triggers/actions/rules persistence exists.
- **Dashboards:** browser client and store exist; matching dashboard APIs/models were not found after checking URL registrations and source models.
- **Importers:** `Importer` model and Jira/GitHub browser clients/types exist; no handler/URL/job implementation was located in this checkout.
- **Audit logging:** individual activity/page/API/webhook logs exist but no unified auditable administration feature.
- **Branding:** image assets are configurable but white-label/custom-domain/email branding is not implemented.

## 14. Missing / Source-Absent Capabilities

| Feature                               | Product reference evidence | Missing components                                       | Suggested independent implementation                                     |
| ------------------------------------- | -------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| Active Cycles aggregate               | route/CTA and plan copy    | aggregate API/query/model/UI data flow                   | workspace-scoped cycle aggregate with project membership filtering.      |
| Custom fields                         | terminology/filter residue | definition/value models, APIs, UI, filters/import/export | typed definitions + value table + role/scoping rules.                    |
| SAML/OIDC/LDAP/SCIM/MFA               | plan copy                  | protocol handlers, configuration, identity mapping       | standards-based identity module.                                         |
| Project/issue/page templates          | plan copy/i18n words       | model, clone/apply APIs, settings UI                     | versioned template entities and transactional application.               |
| Generic workflow/approvals/automation | plan copy                  | rules, triggers, action runner/audit                     | event-driven rule engine with strict authorization.                      |
| Portfolio/epics/initiatives           | terminology/UI naming only | domain models/routes/queries                             | define hierarchy independently.                                          |
| Full custom reports                   | plan copy                  | report definition/execution/rendering                    | analytic-view extension, export permissions and query safety.            |
| Backup/restore product UI             | deployment language        | service/API/job/UI                                       | keep infra first; add controlled administrative workflow only if needed. |

## 15. License-Controlled / Proprietary Capabilities

The source does not contain a paid license validator or proprietary package. Plan descriptions advertise SSO/LDAP, templates, workflows, custom reports, databases/formulas and enterprise services (`packages/constants/src/subscription.ts`), but those claims do not ship their corresponding implementations here. Classify them as F by source evidence and G by product/license context: do not bypass external paid offerings. Build independent implementations through the open architecture only where authorized.

## 16. Cloud-Only Assumptions

| External domain/service                    | Purpose                               | Required?                               | Source                                                   |
| ------------------------------------------ | ------------------------------------- | --------------------------------------- | -------------------------------------------------------- |
| `plane.so`, `app.plane.so`                 | pricing, upgrade, sales/contact links | No                                      | `packages/constants/src/payment.ts`; upgrade components. |
| `platform.openai.com` / configured LLM API | AI configuration/inference            | No                                      | admin AI form; `app/views/external/base.py`.             |
| `api.unsplash.com`                         | optional image search                 | No                                      | `UnsplashEndpoint`.                                      |
| Google/GitHub/GitLab/Gitea                 | OAuth and integration services        | No                                      | authentication providers/admin config.                   |
| Scout, PostHog, OTLP collector             | observability/telemetry               | No                                      | `settings/production.py`, telemetry task.                |
| S3-compatible endpoint                     | files/export delivery                 | Required for attachment/export features | `settings/storage.py`; MinIO alternative in Compose.     |

## 17. Dead / Hidden Frontend Routes

`extendedRoutes` is deliberately empty (`apps/web/app/routes/extended.ts`), so no separate extended-source bundle is mounted. All major web routes are registered in `routes/core.ts`. The principal noteworthy route is `/[workspaceSlug]/active-cycles`, which is reachable from workspace navigation but renders only the upgrade component. Project feature routes remain registered even if the matching tab is hidden; they have frontend role checks and mutate the persisted project flags. The automations route is similarly registered and exposes only auto-close/archive configuration.

## 18. Orphan Backend APIs and Frontend Clients

Confirmed backend APIs with limited/no obvious full navigation include project feature settings, analytics exports, bulk archive/delete/label operations, and public `space` APIs; each has models/views and should not be treated as dead merely because it is not prominent.

The strongest orphan candidate is the dashboard browser service/store: it calls dashboard endpoints absent from `app/urls/`, `api/urls/`, `space/urls/` and current models. Importer clients/types are another candidate: they refer to Jira/GitHub import endpoints that were not found among registered Django routes. These are partial/unusable contracts until their server side is supplied.

## 19. Security Considerations

Hidden UI is never a security mechanism. Keep workspace/project membership checks, CSRF, throttles, upload limits, signed URLs, invitation email matching, webhook SSRF validation and Hocuspocus/API session checks intact. Before exposing bulk operations, project configuration pages or public sharing behavior, verify object-level workspace/project scoping and all role paths. The public `space` APIs intentionally allow a different interaction model behind a publish anchor; they must not become a shortcut around private-project authorization.

## 20. Unlimited Self-Hosted Target Model

### Tier 1 — Already Available

Core work management, memberships/guests, projects, cycles/modules, saved views, intake, pages, analytics, exports, webhooks, public projects, API tokens and instance administration.

### Tier 2 — Existing but Hidden / Feature-Flagged

Project feature configuration, workspace creation policy, and—after a dedicated security/UX review—limited bulk work-item operations.

### Tier 3 — External Dependency

SMTP, S3/MinIO, OAuth providers, LLM inference, Unsplash, telemetry and external integration endpoints. Prefer operator-provided credentials and self-hostable infrastructure where the current adapters support it.

### Tier 4 — Partial

Automation, dashboards, importers, unified audit logs and branding.

### Tier 5 — Missing

Custom fields, templates, cross-project Active Cycles, generic workflow/approval automation, portfolio planning, standards-based enterprise identity, custom reports and application-level backup/restore.

### Tier 6 — Proprietary / License-Controlled

Any separately distributed paid edition/source or hosted entitlement service. Do not modify without authorization; clean independent implementation is the appropriate path for absent capabilities.

## 21. Recommended Future Implementation Order

1. **3A — Configuration/capability normalization:** document and centralize project/instance switches; preserve server-side permissions.
2. **3B — Verify/expose mature hidden paths:** decide whether authorized self-hosted UX should expose limited bulk operations; add endpoint-level tests first.
3. **3C — External dependency choice:** make SMTP/S3/MinIO/telemetry and LLM provider configuration observable; consider an explicitly supported OpenAI-compatible self-hosted inference adapter.
4. **3D — Complete partial capabilities:** finish one vertical slice at a time (importer or dashboard/automation), including model, API, job, UI and authorization.
5. **3E — New independent features:** prioritize custom fields/templates only after data model and filter/query implications are designed.
6. **3F — Scalability/security hardening:** queue policies, pagination/search, public-space and live-document authorization tests.
7. **3G — Administrator documentation and controls:** configuration reference, backup/restore runbooks and operational observability.

## 22. Prioritized Opportunity Matrix

| Opportunity                                         | User value | Complexity | Risk   | Dependency level | Rationale                                                                         |
| --------------------------------------------------- | ---------- | ---------- | ------ | ---------------- | --------------------------------------------------------------------------------- |
| Normalize project/instance capability configuration | High       | Low        | Low    | Independent      | Existing booleans/config are scattered but functional.                            |
| Self-hosted SMTP/S3/MinIO administrator guidance    | High       | Low        | Low    | Moderate         | Existing adapters and admin configuration exist.                                  |
| Limited bulk operations review/exposure             | High       | Medium     | Medium | Independent      | Backend partial; UI currently CTA-only.                                           |
| Self-hosted OpenAI-compatible LLM adapter           | Medium     | Medium     | Medium | Moderate         | Existing AI endpoints/config; provider implementation needs precision.            |
| Unified audit log                                   | High       | High       | High   | Heavy            | Multiple existing event streams but tenant/security requirements are substantial. |
| Dashboard completion                                | Medium     | High       | Medium | Heavy            | Browser contract exists; backend data contract is absent.                         |
| Generic automation                                  | High       | High       | High   | Heavy            | Needs durable rule/event execution and auditability.                              |
| Custom fields                                       | High       | Very High  | High   | Heavy            | Cross-cuts model, filters, views, imports/exports and analytics.                  |
| Templates                                           | Medium     | High       | Medium | Heavy            | Requires cloning/versioning semantics across domain entities.                     |

## 23. Important Source References

- Architecture baseline: `docs/architecture.md`
- Routes/navigation: `apps/web/app/routes/{core,extended}.ts`, `web/core/components/navigation/use-navigation-items.ts`, `web/core/components/workspace/sidebar/`
- Upgrade surfaces: `web/core/components/{license,active-cycles,issues/bulk-operations}/`
- Backend capability routes: `apps/api/plane/app/urls/`, `api/urls/`, `space/urls/`
- Domain models: `apps/api/plane/db/models/{project,issue,cycle,module,page,view,analytic,importer,exporter,deploy_board}.py`
- Admin/configuration: `apps/admin/app/routes.ts`, `apps/api/plane/license/api/views/`, `utils/instance_config_variables/core.py`
- External features: `app/views/external/base.py`, `authentication/`, `settings/storage.py`, `bgtasks/`
- Public sharing: `apps/api/plane/space/`, `web/core/components/project/publish-project/modal.tsx`

## 24. Unknowns / Items Requiring Further Investigation

- The repository does not include separately licensed Enterprise source, hosted billing/entitlement services, or a complete Kubernetes chart; do not infer their behavior.
- A code-path audit of every public `space` mutation and live document authorization was outside this feature inventory; retain and extend contract testing.
- Some browser clients may be retained for a future or removed backend. The dashboard/importer classification reflects only the current checked URL/model implementations.
- The AI provider labels require integration tests: the verified call path uses the OpenAI SDK and does not demonstrate working Anthropic/Gemini adapters.
