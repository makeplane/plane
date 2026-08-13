# P4B Workspace Active Cycles

## Summary

P4B implements Workspace Active Cycles as a real workspace-level aggregate over existing `Cycle` records. It adds a bounded, workspace-scoped API, connects the existing Active Cycles route to real data, removes the Active Cycles-specific Upgrade presentation for self-hosted behavior, and keeps RBAC, project visibility, project cycle preferences, tenant isolation, and pagination safeguards in place.

## Scope

Included:

- Workspace Active Cycles aggregate endpoint.
- Existing cycle/project model reuse with no schema migration.
- Project membership and workspace membership authorization checks.
- Project `cycle_view` preference enforcement.
- Cursor pagination with a default page size of 20 and maximum page size of 100.
- Frontend Active Cycles page with loading, empty, error, list, and load-more states.
- Additive `active_cycles` capability state in the sanitized instance capabilities response.
- Backend contract tests for active-cycle behavior, security, pagination, and Community/self-hosted non-plan access.

Excluded:

- Recurring cycles.
- Cycle templates.
- Cross-workspace portfolio planning.
- Generic analytics/dashboard work.
- Per-cycle burndown comparison in the workspace aggregate.
- New cycle storage or duplicate workspace-cycle records.
- Any subscription, billing, license, seat, invoice, or entitlement state.

## Discovery Findings

- The workspace Active Cycles route already existed at `/:workspaceSlug/active-cycles/`.
- The page rendered only `WorkspaceActiveCyclesUpgrade` and did not fetch active cycle data.
- The Active Cycles header rendered `UpgradeBadge`.
- Frontend services already expected `GET /api/workspaces/:workspaceSlug/active-cycles/`, but no matching backend route was registered.
- Existing `WorkspaceCyclesEndpoint` returned all visible cycles at `GET /api/workspaces/:slug/cycles/` without active filtering or pagination.
- Project cycle routes already define the authoritative current-cycle filter through `cycle_view=current`.
- No backend commercial plan, subscription, license, billing, entitlement, or seat gate existed for Active Cycles; the functionality was missing.

## Existing Active Cycles UI

Existing UI before P4B:

- Route: `apps/web/app/routes/core.ts` registers `:workspaceSlug/active-cycles`.
- Layout/header: `apps/web/app/(all)/[workspaceSlug]/(projects)/active-cycles/layout.tsx` and `header.tsx`.
- Page: `apps/web/app/(all)/[workspaceSlug]/(projects)/active-cycles/page.tsx`.
- Upgrade CTA: `apps/web/core/components/active-cycles/workspace-active-cycles-upgrade.tsx`.
- Sidebar entry: `apps/web/core/components/workspace/sidebar/workspace-menu.tsx` links to Active Cycles for Admin/Member roles.

P4B reuses the existing route and layout, replaces the page content with a real aggregate list, and removes the Active Cycles-specific header upgrade badge.

## Existing Cycle Architecture

- Cycle persistence uses `apps/api/plane/db/models/cycle.py` with `Cycle` scoped by workspace and project through `ProjectBaseModel`.
- Project cycle APIs are registered in `apps/api/plane/app/urls/cycle.py` and implemented in `apps/api/plane/app/views/cycle/base.py`.
- `CycleSerializer` is the existing read serializer used by project and workspace cycle views.
- Project feature preference for cycles is `Project.cycle_view` in `apps/api/plane/db/models/project.py`.
- Project cycle list access uses project membership through `allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])`.
- Workspace aggregate access uses `WorkspaceViewerPermission` plus explicit filtering to active project memberships.

## Active Cycle Definition

P4B reuses the repository's project cycle semantics from `CycleViewSet.list` for `cycle_view=current`:

```text
start_date <= current_time_in_utc <= end_date
```

The existing project implementation computes the current time with `timezone.now()`, converts it through the project timezone, then compares the resulting UTC timestamp to stored UTC cycle dates. The workspace aggregate uses the same UTC comparison against stored `start_date` and `end_date` and annotates returned records with `status = CURRENT`.

Draft cycles with missing dates, future cycles, completed cycles, archived cycles, and cycles in archived projects are excluded.

## Backend Aggregate Design

P4B adds `WorkspaceActiveCyclesEndpoint` in `apps/api/plane/app/views/workspace/cycle.py` and registers it at `GET /api/workspaces/:slug/active-cycles/` in `apps/api/plane/app/urls/workspace.py`.

The endpoint reuses a shared visible-cycle queryset that:

- filters by `workspace__slug`;
- filters by active `ProjectMember` rows for the requesting user;
- excludes archived projects;
- excludes archived cycles;
- uses `select_related("project", "workspace", "owned_by")`;
- annotates lightweight issue counts with filtered `Count(..., distinct=True)` expressions.

The active endpoint then adds:

- `project__cycle_view=True`;
- `start_date__lte=current_time_in_utc`;
- `end_date__gte=current_time_in_utc`;
- deterministic ordering by `end_date`, project name, cycle name, and cycle ID.

No database migration was introduced.

## API Contract

Request:

```http
GET /api/workspaces/:workspace_slug/active-cycles/?per_page=20&cursor=20:0:0
```

Response follows the existing `BasePaginator` shape:

```json
{
  "count": 20,
  "total_results": 25,
  "total_pages": 2,
  "next_cursor": "20:1:0",
  "prev_cursor": "20:-1:1",
  "next_page_results": true,
  "prev_page_results": false,
  "extra_stats": null,
  "results": [
    {
      "id": "uuid",
      "workspace_id": "uuid",
      "project_id": "uuid",
      "project_detail": {
        "id": "uuid",
        "identifier": "PROJ",
        "name": "Project"
      },
      "name": "Cycle",
      "start_date": "datetime",
      "end_date": "datetime",
      "status": "CURRENT",
      "total_issues": 0,
      "completed_issues": 0,
      "cancelled_issues": 0,
      "started_issues": 0,
      "unstarted_issues": 0,
      "backlog_issues": 0
    }
  ]
}
```

The response includes the existing `CycleSerializer` fields plus `project_detail` for workspace-level display and navigation.

## Pagination / Filtering

- Pagination is required by the endpoint implementation through `BaseAPIView.paginate`.
- Default page size is 20.
- Maximum page size is 100.
- Cursor format follows the existing offset cursor format used by `BasePaginator`.
- No generic filter language was added.
- Sorting is deterministic: ending soonest, then project name, cycle name, and ID.

## Authorization

The endpoint uses `WorkspaceViewerPermission`, which requires active workspace membership. This only allows the request to start. The returned queryset still requires active project membership, so workspace membership alone does not expose private project cycle metadata.

## Tenant Isolation

Every returned cycle is filtered through `workspace__slug=slug`. Tests cover a workspace A/workspace B setup and verify workspace A requests do not expose workspace B cycles.

## Project Visibility

The aggregate only includes projects where `project__project_projectmember__member=request.user` and `project__project_projectmember__is_active=True`. A workspace member who is not a project member receives a successful empty aggregate for that private project data rather than leaked metadata.

Guests follow the same project-membership rule: they can see active cycles only for projects they belong to.

## Project Cycles Toggle

The aggregate respects the existing project preference `Project.cycle_view`. Active cycles from projects with cycles disabled are excluded.

## Query / Performance Review

- The endpoint is a single scoped queryset before pagination.
- Related project/workspace/owner data is loaded with `select_related`.
- Issue counts are annotated in the aggregate query with filtered distinct counts.
- No per-cycle project fetch is needed for the frontend because `project_detail` is serialized from the selected relation.
- No per-cycle progress or analytics endpoint calls are made by the workspace page.
- The response is bounded by `per_page` and `max_per_page`.

The repository does not contain existing query-count assertion patterns for this area, so P4B documents the query architecture rather than adding brittle exact query-count tests.

## Frontend Implementation

P4B updates `apps/web/app/(all)/[workspaceSlug]/(projects)/active-cycles/page.tsx` to fetch `CycleService.workspaceActiveCycles(...)` and render:

- loading skeleton rows;
- normal empty state when no active cycles are visible;
- API error state with retry;
- active cycle cards with cycle name, project identifier/name, date range, progress, and issue counts;
- `Load more` when `next_page_results` is true;
- navigation to the existing project cycle route `/:workspaceSlug/projects/:projectId/cycles/:cycleId`.

No raw `fetch()` calls were added; the existing `CycleService` abstraction is reused.

## Upgrade Gate Replacement

Changed Active Cycles-specific gates:

- `page.tsx` no longer renders `WorkspaceActiveCyclesUpgrade`.
- `header.tsx` no longer renders `UpgradeBadge` for Active Cycles.

Unchanged unrelated gates/copy:

- `WorkspaceActiveCyclesUpgrade` remains in the repository for historical/reference use but is no longer used by the implemented Active Cycles route.
- Billing/plan comparison copy in `packages/constants/src/subscription.ts` and workspace billing components is unchanged.
- Generic upgrade modal behavior is unchanged.

## Self-Hosted Highest-Plan Behavior

In authorized self-hosted deployments, implemented functionality is available independently of commercial subscription tier. P4B applies that policy to Workspace Active Cycles by implementing the missing backend/UI path and removing the Active Cycles-specific Upgrade requirement. It does not create or modify subscriptions, invoices, purchases, billing state, seats, license purchases, or fake Enterprise state.

The permanent rule remains: In authorized self-hosted deployments, implemented functionality is available independently of commercial subscription tier. Missing functionality must be implemented rather than faked through plan state. Security, tenancy, authorization, and operational safeguards remain enforced.

## Plan / Subscription / License Gate Audit

| Gate                       | Layer                  | File                                                                                          | Previous Behavior                                                          | Self-Hosted Change                                                                       | Hosted Impact                                                                             | Security Preserved                                                                                                   |
| -------------------------- | ---------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Active Cycles route page   | Frontend page          | `apps/web/app/(all)/[workspaceSlug]/(projects)/active-cycles/page.tsx`                        | Always rendered the Upgrade CTA component                                  | Replaced with real data-fetching Active Cycles page                                      | No hosted entitlement backend exists in this checkout; no hosted backend behavior changed | Backend remains authoritative for workspace/project visibility                                                       |
| Active Cycles header badge | Frontend header        | `apps/web/app/(all)/[workspaceSlug]/(projects)/active-cycles/header.tsx`                      | Rendered `UpgradeBadge` beside Active Cycles breadcrumb                    | Removed the Active Cycles-specific upgrade badge                                         | Unrelated upgrade badges/components unchanged                                             | No security control depended on the badge                                                                            |
| Active Cycles Upgrade CTA  | Frontend component     | `apps/web/core/components/active-cycles/workspace-active-cycles-upgrade.tsx`                  | Linked to `MARKETING_PRICING_PAGE_LINK` and rendered `upgrade` copy        | Component left untouched but no longer used by implemented route                         | Pricing/marketing component remains available for unrelated usage                         | No security control depended on the CTA                                                                              |
| Workspace sidebar entry    | Frontend navigation    | `apps/web/core/components/workspace/sidebar/workspace-menu.tsx`                               | Linked Admin/Member users to an Upgrade-only page                          | No code change needed; the existing link now reaches real functionality                  | Hosted navigation behavior is otherwise unchanged                                         | Existing role visibility remains Admin/Member                                                                        |
| Frontend service stub      | Frontend service       | `apps/web/core/services/cycle.service.ts` and `packages/services/src/cycle/cycle.service.ts`  | Expected `/api/workspaces/:slug/active-cycles/`, but route was missing     | Existing API client now has a matching backend route                                     | No hosted commercial logic changed                                                        | API still enforces permissions server-side                                                                           |
| Backend active cycles gate | Backend API            | `apps/api/plane/app/urls/workspace.py`; `apps/api/plane/app/views/workspace/cycle.py`         | No active-cycles endpoint existed; no backend commercial gate existed      | Added endpoint with workspace/project permissions and no plan gate                       | No hosted commercial gate removed because none existed in this checkout                   | `WorkspaceViewerPermission`, project membership, workspace slug scoping, project toggle, archive filters, pagination |
| Instance capabilities      | Backend/frontend types | `apps/api/plane/license/utils/capabilities.py`; `packages/types/src/instance/capabilities.ts` | P3A capabilities did not list Active Cycles because it was not implemented | Added `active_cycles: { available: true, enabled: true }` without required plan metadata | Additive sanitized capability field only                                                  | Capability state does not grant action permissions                                                                   |
| Instance edition label     | Backend license model  | `apps/api/plane/license/models/instance.py`                                                   | `PLANE_COMMUNITY` is a persisted label, not an entitlement evaluator       | Regression test proves Community instance can access Active Cycles when authorized       | No subscription/license state changed                                                     | No fake plan or billing data created                                                                                 |

No backend plan, subscription, seat, billing, entitlement, or license rejection was found on the new Active Cycles path.

## Tests Added

- `apps/api/plane/tests/contract/app/test_workspace_active_cycles_app.py`

Coverage includes:

- one accessible project with one active cycle;
- multiple accessible projects aggregated together;
- future cycles excluded;
- completed cycles excluded;
- project cycles disabled excluded;
- private project cycles hidden from workspace members without project membership;
- guest users see only project cycles they belong to;
- cross-workspace data leakage prevention;
- unauthorized workspace request rejection;
- bounded stable pagination;
- archived cycles and archived projects excluded;
- inclusive active date boundaries;
- Community/self-hosted non-plan availability for authorized members.

Updated existing capability tests:

- `apps/api/plane/tests/unit/license/test_capabilities.py`
- `apps/api/plane/tests/contract/license/test_instance_capabilities.py`

## Security Review

- Workspace membership is required by `WorkspaceViewerPermission`.
- Project membership is required by the queryset before serialization.
- Workspace slug scoping is applied before pagination.
- Archived projects and archived cycles are excluded.
- Project `cycle_view` is respected.
- Guests do not bypass project membership.
- No object ID query parameter exists that can widen scope.
- No commercial tier can block authorized self-hosted access.

## Hosted Compatibility

This checkout contains no hosted billing, subscription, license, or entitlement backend for Active Cycles. P4B does not remove any backend hosted commercial behavior because none exists here. Unrelated pricing constants, billing pages, upgrade modal components, and plan comparison copy remain unchanged.

## Validation Results

- Passed: `python3 -m py_compile apps/api/plane/app/views/workspace/cycle.py apps/api/plane/app/serializers/cycle.py apps/api/plane/license/utils/capabilities.py apps/api/plane/tests/contract/app/test_workspace_active_cycles_app.py apps/api/plane/tests/unit/license/test_capabilities.py apps/api/plane/tests/contract/license/test_instance_capabilities.py`.
- Passed: `pnpm exec oxfmt --check "apps/web/app/(all)/[workspaceSlug]/(projects)/active-cycles/page.tsx" "apps/web/app/(all)/[workspaceSlug]/(projects)/active-cycles/header.tsx" apps/api/plane/app/views/workspace/cycle.py apps/api/plane/app/serializers/cycle.py apps/api/plane/license/utils/capabilities.py packages/types/src/cycle/cycle.ts packages/types/src/instance/capabilities.ts apps/api/plane/tests/contract/app/test_workspace_active_cycles_app.py apps/api/plane/tests/unit/license/test_capabilities.py apps/api/plane/tests/contract/license/test_instance_capabilities.py` after formatting supported frontend/docs targets; Python files are not matched by `oxfmt`.
- Passed: `pnpm exec oxlint "apps/web/app/(all)/[workspaceSlug]/(projects)/active-cycles/page.tsx" "apps/web/app/(all)/[workspaceSlug]/(projects)/active-cycles/header.tsx" packages/types/src/cycle/cycle.ts packages/types/src/instance/capabilities.ts --deny-warnings`.
- Passed: `pnpm --filter=@plane/types build`.
- Passed: `pnpm --filter=@plane/types check:types`.
- Passed: `docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/tests/contract/app/test_workspace_active_cycles_app.py plane/tests/unit/license/test_capabilities.py plane/tests/contract/license/test_instance_capabilities.py -vv` with 28 passed.
- Blocked by existing repository issues on first run: `pnpm --filter=web check:types` failed on pre-existing `@plane/editor` module/type resolution and implicit-any errors outside P4B after P4B page issues were identified.
- Blocked by timeout on second run: `pnpm --filter=web check:types` exceeded 300 seconds after `@plane/types` was rebuilt and emitted no P4B errors before timeout.
- Blocked by existing repository issue: `pnpm --filter=web build` failed because Vite/PostCSS cannot resolve `@import "@plane/editor/styles"` from `apps/web/styles/globals.css`.
- Blocked by external package resolution: `npx react-doctor@latest --verbose --diff` failed because npm reports no matching version for `@oxc-project/types@^0.142.0`.

## Files Changed

- `apps/api/plane/app/serializers/cycle.py`
- `apps/api/plane/app/urls/workspace.py`
- `apps/api/plane/app/views/__init__.py`
- `apps/api/plane/app/views/workspace/cycle.py`
- `apps/api/plane/license/utils/capabilities.py`
- `apps/api/plane/tests/contract/app/test_workspace_active_cycles_app.py`
- `apps/api/plane/tests/contract/license/test_instance_capabilities.py`
- `apps/api/plane/tests/unit/license/test_capabilities.py`
- `apps/web/app/(all)/[workspaceSlug]/(projects)/active-cycles/header.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(projects)/active-cycles/page.tsx`
- `packages/types/src/cycle/cycle.ts`
- `packages/types/src/instance/capabilities.ts`
- `docs/implementations/p4b-workspace-active-cycles.md`

## Deferred Work

- Workspace Active Cycles per-cycle burndown comparison.
- Workspace Active Cycles filters beyond the default active aggregate.
- Realtime invalidation for cycle date/archive/project-toggle mutations if a broader realtime issue/cycle bus is later introduced.
- Frontend component tests if/when this checkout has a configured web component test runner.
- Query-count assertions if the repository adds a stable pattern for endpoint query-count testing.
- Importers, dashboards, automation, templates, custom fields, MFA/OIDC, portfolio planning, and custom reporting remain untouched.
