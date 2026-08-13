# P4A Bulk Work-Item Operations

## Summary

P4A exposes a verified self-hosted bulk work-item operation: bulk archive for selected loaded work items. It replaces the bulk-operation Upgrade banner for this supported path with a real action, hardens the backend bulk archive endpoint, and documents the self-hosted highest-plan rule for future feature phases.

## Scope

Included:

- Backend-hardened project-scoped bulk archive endpoint.
- Frontend selected loaded-item bulk archive toolbar action.
- Sequential client chunking with a 100-work-item server batch limit.
- Backend behavioral tests for authorization, tenant isolation, target validation, batch bounds, duplicate IDs, and self-hosted non-plan behavior.
- Inclusion of the approved architecture/specification docs in the repository baseline.

Excluded:

- Generic bulk property editing.
- Bulk delete UI exposure.
- Bulk labels, dates, assignees, status, cycles, modules, or cross-project move.
- Query-based select-all across all filtered results.
- Any fake subscription, billing, license, seat, or entitlement records.

## Discovery Findings

- The frontend bulk root at `apps/web/core/components/issues/bulk-operations/root.tsx` rendered only `BulkOperationsUpgradeBanner` when selection was active.
- The Upgrade banner linked to `MARKETING_PLANE_ONE_PAGE_LINK` and described state/priority/multi-property editing that is not backed by a verified generic bulk endpoint in this checkout.
- Existing backend routes include narrow bulk endpoints in `apps/api/plane/app/urls/issue.py`:
  - `bulk-delete-issues/`
  - `bulk-archive-issues/`
  - `bulk-create-labels/`
  - `issue-dates/`
- Existing browser issue service/store already had methods for bulk delete, bulk archive, and date updates.
- No backend subscription, plan, license, billing, seat, or entitlement check was found on the bulk archive path.

## Existing Bulk APIs

| Operation          | Backend API                                                             | Frontend UI                                              | Permission Enforcement                                  | Scope Validation                         | Ready?                                                               |
| ------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------- |
| Archive issues     | `POST /api/workspaces/:slug/projects/:project_id/bulk-archive-issues/`  | Exposed in P4A toolbar                                   | `allow_permission([ADMIN, MEMBER])`                     | Workspace slug + project ID + issue IDs  | Yes, after P4A hardening                                             |
| Delete issues      | `DELETE /api/workspaces/:slug/projects/:project_id/bulk-delete-issues/` | Existing command modal, not selection toolbar            | `allow_permission([ADMIN])`                             | Workspace slug + project ID + issue IDs  | Deferred; high risk and activity semantics differ from single delete |
| Create labels      | `POST /api/workspaces/:slug/projects/:project_id/bulk-create-labels/`   | Import/migration-oriented endpoint, no selection toolbar | `allow_permission([ADMIN])`                             | Project ID -> workspace ID               | Deferred; not a selected-work-item mutation                          |
| Update issue dates | `POST /api/workspaces/:slug/projects/:project_id/issue-dates/`          | Service method only                                      | `allow_permission([ADMIN, MEMBER])`                     | Workspace slug + project ID + update IDs | Deferred; payload validation and failure reporting need hardening    |
| Generic properties | Browser service calls `bulk-operation-issues/`                          | Store method exists                                      | No registered backend route found in inspected app URLs | Not applicable                           | Deferred; incomplete contract                                        |

## Existing Commercial Gates

- Frontend-only Upgrade CTA: `BulkOperationsUpgradeBanner` linked selected bulk operations to Plane One marketing.
- Static plan/marketing constants exist in `packages/constants/src/payment.ts` and subscription helpers, but they are not consumed by the backend bulk archive endpoint.
- No backend commercial gate was found for bulk archive.

## Plan / Subscription / License Gate Audit

| Gate                            | Layer                 | Source                                                                              | Existing Behavior                                           | Self-Hosted Change                                                       | Hosted Impact                                                                            | Security Preserved                                                       |
| ------------------------------- | --------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Bulk operations Upgrade banner  | Frontend              | `apps/web/core/components/issues/bulk-operations/root.tsx` and `upgrade-banner.tsx` | Selected work items showed only Upgrade CTA                 | Replaced with real bulk archive action for authorized Admin/Member users | This checkout has no hosted entitlement context; no backend hosted plan behavior changed | Frontend permission check mirrors backend; backend remains authoritative |
| Plane One marketing link        | Frontend constants    | `MARKETING_PLANE_ONE_PAGE_LINK` via `BulkOperationsUpgradeBanner`                   | Linked users to external pricing for selected bulk actions  | No longer used by P4A supported selection toolbar path                   | Unrelated pricing constants unchanged                                                    | No security control depended on link                                     |
| Backend bulk archive permission | Backend RBAC          | `BulkArchiveIssuesEndpoint.post`                                                    | Admin/Member allowed; no plan check                         | Preserved; no commercial gate added                                      | Hosted/backend plan behavior unchanged because none exists here                          | Server-side RBAC preserved                                               |
| Instance edition label          | Backend license model | `Instance.edition`                                                                  | `PLANE_COMMUNITY` persisted label, not an entitlement check | Regression test proves Community instance can bulk archive               | No hosted subscription state changed                                                     | No fake edition/subscription state created                               |

No backend plan, subscription, seat, billing, entitlement, or license rejection was found on the exposed bulk archive path.

## Self-Hosted Highest-Plan Behavior

For authorized self-hosted deployments, implemented functionality should be available independently of commercial subscription tier. P4A applies that rule narrowly to verified bulk archive behavior by removing the selected-work-item Upgrade-only UI and relying on backend RBAC, tenant scoping, target validation, and bounded batches.

Future feature phases must use this default rule: For authorized self-hosted deployments, implemented functionality should be available independently of commercial subscription tier. Each phase must audit frontend and backend plan/subscription/license gates for the feature being implemented and normalize those gates for self-hosted operation while preserving RBAC, tenant isolation, security, and operational safeguards.

## Operations Exposed

- Bulk archive selected loaded work items.

## Operations Deferred

- Bulk delete: deletion is high risk and the current bulk endpoint does not mirror single-delete per-issue activity behavior.
- Bulk date updates: existing endpoint needs stricter payload validation and structured failure semantics before UI exposure.
- Labels, state, priority, assignees, cycle, module: no verified complete selected-work-item bulk path was exposed in this phase.
- Move project: high-complexity project-specific validation problem.
- Select all filtered results: no server-side query-based selection contract was verified.

## Backend Architecture

P4A reuses `BulkArchiveIssuesEndpoint` rather than creating a generic bulk endpoint. The endpoint now validates list shape, UUID format, duplicate IDs, batch bounds, full scoped ID resolution, and archivable state groups before mutating any issue in the request.

## API Contracts

Request:

```http
POST /api/workspaces/:slug/projects/:project_id/bulk-archive-issues/
```

```json
{
  "issue_ids": ["uuid", "uuid"]
}
```

Success response:

```json
{
  "archived_at": "YYYY-MM-DD",
  "updated": 2,
  "failed": 0
}
```

Validation errors:

- `400` for empty list, malformed UUID, batch limit exceeded, or non-archivable state group.
- `404` for IDs not resolvable within the addressed workspace/project.
- `403` for unauthorized roles.

## Authorization

Backend authorization remains `allow_permission([ROLE.ADMIN, ROLE.MEMBER])`. Guests and non-authorized users cannot archive through the endpoint even if they manipulate the UI or call the API directly.

## Tenant Isolation

The endpoint resolves issues only with `workspace__slug=slug`, `project_id=project_id`, and `pk__in=issue_ids`. If any requested ID is outside that scope or missing, the endpoint rejects the request before mutating scoped issues.

## Batch Bounds

Server batch size is `100` issue IDs per request. The frontend chunks selected loaded IDs into sequential 100-item requests.

## Atomicity / Failure Semantics

The endpoint is atomic per request by validation order: it validates the entire chunk before mutating. If one ID is missing, out of scope, malformed, or in a non-archivable state group, no issue in that chunk is archived. Cross-chunk operations are not globally atomic; earlier successful chunks remain archived if a later chunk fails.

## Activity / Notifications / Realtime

Bulk archive preserves existing per-issue `issue_activity.delay(...)` calls before the bulk database update. This follows the prior archive endpoint behavior and records actor, issue ID, project ID, requested `archived_at`, current instance, epoch, notification flag, and origin. No broad issue WebSocket event bus was found in this checkout; the frontend updates local stores after each successful chunk and removes archived issues from the active list.

## Frontend UX

When loaded work items are selected in list, Gantt, or spreadsheet layouts, authorized Admin/Member users now see an `Archive selected` action instead of the bulk Upgrade CTA. The copy explicitly says selection is for loaded work items and that requests run in bounded batches of 100.

## Tests Added

- `apps/api/plane/tests/contract/app/test_bulk_issue_archive_app.py`

Coverage includes successful mutation, empty selection, malformed ID, duplicate IDs, not found, unauthorized guest role, cross-workspace ID, cross-project ID, mixed-workspace IDs, invalid state group, batch limit exceeded, unrelated items unchanged, and Community-edition/self-hosted non-plan behavior.

## Commercial-Gate Regression Tests

- `test_member_can_archive_without_plan_gate` sets the instance edition to `PLANE_COMMUNITY` and verifies a project Member can bulk archive through backend RBAC without any subscription record.

## Performance Review

- Server batch limit is fixed at 100 IDs per request.
- Client chunking is sequential to avoid request storms.
- Querying is project/workspace scoped before mutation.
- Activity fan-out remains per issue, matching existing behavior.

## Security Review

- Server-side Admin/Member RBAC preserved.
- Guest denial tested.
- Cross-workspace and cross-project IDs are rejected without mutation.
- Malformed UUIDs and oversized payloads are rejected.
- No fake subscriptions, billing records, license responses, or entitlement data were introduced.
- Operational batch bounds are preserved; unlimited self-hosted access does not mean unbounded payloads.

## Compatibility Review

- Existing bulk archive route path is unchanged.
- Existing active list store update path is reused.
- Existing Upgrade component remains in the repository but is no longer used for the supported selected bulk archive path.
- No database migration is required.
- Generated local `.env` files are test setup artifacts and must not be committed.

## Files Changed

- `apps/api/plane/app/views/issue/archive.py`
- `apps/api/plane/tests/contract/app/test_bulk_issue_archive_app.py`
- `apps/web/core/components/issues/bulk-operations/root.tsx`
- `apps/web/core/services/issue/issue.service.ts`
- `docs/architecture.md`
- `docs/feature-gap-analysis.md`
- `docs/unlimited-self-hosted-spec.md`
- `docs/implementations/p4a-bulk-work-item-operations.md`

## Validation Results

- Passed: `pnpm exec oxfmt --check apps/web/core/components/issues/bulk-operations/root.tsx apps/web/core/services/issue/issue.service.ts apps/api/plane/app/views/issue/archive.py docs/architecture.md docs/feature-gap-analysis.md docs/unlimited-self-hosted-spec.md docs/implementations/p4a-bulk-work-item-operations.md`.
- Passed: `pnpm exec oxlint apps/web/core/components/issues/bulk-operations/root.tsx apps/web/core/services/issue/issue.service.ts --deny-warnings`.
- Passed: `python3 -m py_compile apps/api/plane/app/views/issue/archive.py apps/api/plane/tests/contract/app/test_bulk_issue_archive_app.py`.
- Passed: `docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/tests/contract/app/test_bulk_issue_archive_app.py -vv` with 12 passed.
- Blocked by existing repository issues: `pnpm --filter=web check:types` fails on pre-existing `@plane/editor` module/type resolution and implicit-any errors outside the P4A diff. The only P4A type error from the first run was corrected by using the existing `archiveBulkIssues` store alias.
- Blocked by existing repository issues: `pnpm --filter=web build` fails because Vite/PostCSS cannot resolve `@import "@plane/editor/styles"` from `apps/web/styles/globals.css`.
- Blocked by external package resolution: `npx react-doctor@latest --verbose --diff` fails because npm reports no matching version for `@oxc-project/types@^0.142.0`.

## Deferred Work

- Harden and possibly expose bulk delete only after deletion activity/notification semantics are made equivalent to single delete.
- Harden date, labels, state, priority, assignee, cycle, and module operations operation-by-operation.
- Add frontend component tests if/when this checkout has a configured web test script/framework for these components.
- Add query-based all-filtered-results bulk selection only with a backend selection contract.
- Continue feature-specific plan/subscription/license audits in future phases.
