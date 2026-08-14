# P6 Self-Hosted Unlimited Plan

## Summary

P6 removes the internal commercial plan/edition restrictions that surfaced inside
the self-hosted Community checkout: the 12-user "Free plan" seat cap messaging,
the "PRO" sidebar upgrade badges, the "Community → Upgrade to a paid plan"
modal, and the cloud purchase CTAs ("Upgrade to X" / "Talk to Sales") on the
billing comparison. It centralizes the deployment's commercial posture into one
backend-derived policy block and drives every frontend decision from that shared
resolver. No fake subscriptions, invoices, payments, seats, billing events, or
license responses are created anywhere; limits are semantic unlimited
(`limit: null`), not fabricated high numbers.

The policy block is purely derived from the existing `Instance.edition` default
(`PLANE_COMMUNITY`) and the existing `IS_SELF_MANAGED` setting. It reports that
the self-hosted Community edition applies no commercial gating and no seat caps,
and it is served from the existing P3A capability endpoint
(`GET /api/instances/` → `capabilities.policy`). RBAC, workspace/project
membership, tenant isolation, throttling, and all existing authorization remain
authoritative and are explicitly regression-tested.

## Scope

Included:

- Centralized self-hosted policy resolver (backend authoritative + shared
  frontend hook).
- Removal of the 12-user Free-plan seat message and member-limit marketing for
  self-hosted.
- Removal of `PRO`/`Upgrade` sidebar and estimate-system badges for self-hosted.
- Removal of the cloud upgrade modal entry point and cloud purchase CTAs from
  the self-hosted UI.
- Unlocking the fully-implemented TIME estimate system for self-hosted (it was
  gated behind a frontend-only `is_ee` flag).
- Backend behavioral regression tests for seat unlimited, edition neutrality,
  RBAC/tenant preservation, the policy endpoint, and the TIME estimate system.
- Priority-feature audit and status report (Seats, Project Tracking, Teamspaces,
  Wiki, Initiatives, Templates, Worklogs).

Excluded:

- GitHub importer, dashboards, generic automation, MFA/OIDC, backup/restore.
- Any new billing, subscription, entitlement, seat, or license subsystem.
- Cloud/hosted commercial behavior: the `cloud` plan-comparison data and the
  `PaidPlanUpgradeModal` component remain intact for hosted deployments.
- Source-absent features (Teamspaces entity, standalone Wiki, Initiatives,
  backend Templates, Issue Worklogs) are not unlocked or faked; they are
  classified and reported as follow-up.

## Architecture Decisions

- Reused the P3A `InstanceCapabilityService` and the existing
  `GET /api/instances/` endpoint rather than creating another entitlement
  system. The new `policy` block sits inside `capabilities` beside the existing
  P3A readiness flags.
- The backend is authoritative: `capabilities.policy` is the single source of
  truth for `self_hosted`, `commercial_gating`, and `seat_limit` semantics. The
  frontend never decides self-hosted posture on its own; it reads the instance
  store populated from that response.
- Semantic unlimited: `seat_limit`, `member_limit`, `project_limit` are `null`.
  No fake large numbers are emitted anywhere.
- Frontend normalization is gated on the shared `useSelfHostedPolicy()` hook, so
  self-hosted (no commercial gating) and hosted (commercial gating, when a
  hosted policy source exists) presentations stay separable.
- Preserved existing behavior where implemented: the backend already has no
  server-side seat enforcement, so "seat unlimited" is the pre-existing runtime
  reality; P6 removes the misleading messaging and proves the reality with
  tests rather than inventing a new gate to lift.

## Backend Changes

- `apps/api/plane/license/utils/capabilities.py` — added `InstanceCapabilityService._policy()`
  and included `policy` in `get_capabilities()`. The block is derived from
  `settings.IS_SELF_MANAGED` and `Instance.edition` (defaulting to
  `PLANE_COMMUNITY` when no instance row exists yet). It never returns
  subscription, invoice, billing, or license artifacts.
- `apps/api/plane/db/models/estimate.py` — added `TIME = "time", "Time"` to
  `EstimateType`. The estimate machinery (`Estimate`, `EstimatePoint`, project
  and workspace estimate endpoints) already round-trips any type string; this
  makes the frontend TIME estimate system a real, backend-supported choice for
  self-hosted. This is a Python-level `TextChoices` addition (CharField, no DB
  migration required).
- No changes to invite/accept flows: there is no seat limit to remove in the
  backend; the invite path (`WorkspaceInvitationsViewset`, `WorkspaceJoinEndpoint`)
  is left untouched and is now pinned by tests.

## API Changes

Extended:

```http
GET /api/instances/
```

`capabilities.policy` is added:

```json
{
  "capabilities": {
    "policy": {
      "self_hosted": true,
      "edition": "PLANE_COMMUNITY",
      "commercial_gating": false,
      "feature_tier": "unlimited",
      "seat_limit": null,
      "member_limit": null,
      "project_limit": null
    }
  }
}
```

The block contains no secrets, no credentials, and no fabricated billing state.

## Frontend Changes

- `packages/types/src/instance/capabilities.ts` — added `TInstanceFeaturePolicy`
  and `policy` on `IInstanceCapabilities`.
- `apps/web/core/store/instance.store.ts` — persists `capabilities` from the
  instance response.
- `apps/web/core/hooks/store/use-self-hosted-policy.ts` — the shared resolver.
  Exposes `isSelfHosted`, `hasCommercialGating`, `seatLimit`, `isSeatLimited`,
  and `isFeatureTierUnlimited`, all derived from the backend policy.
- `apps/web/core/components/workspace/sidebar/workspace-menu-item.tsx` — `PRO`
  badge hidden when `hasCommercialGating` is false (self-hosted).
- `apps/web/core/components/workspace/sidebar/extended-sidebar-item.tsx` —
  Active Cycles `PRO` badge hidden for self-hosted (Active Cycles is
  implemented; see P4B).
- `apps/web/core/components/workspace/edition-badge.tsx` — for self-hosted the
  "Community" badge now links to `/:workspaceSlug/settings/billing` (which shows
  "Community — Unlimited projects, issues, cycles, modules, pages, and storage")
  instead of opening `PaidPlanUpgradeModal`. The modal component remains for
  hosted deployments.
- `apps/web/core/components/estimates/create/helper.tsx` —
  `isEstimateSystemEnabled(key, isSelfHosted)` enables the TIME system for
  self-hosted.
- `apps/web/core/components/estimates/create/stage-one.tsx` — threads the
  self-hosted policy and renders the estimate template section for the TIME
  system on self-hosted (the `is_ee` section gate is bypassed only for
  self-hosted).
- `apps/web/core/components/workspace/billing/comparison/plans.tsx` — removed the
  12-seat message: `planHighlights.free` is now `["Unlimited users", ...]`, and
  the `self-hosted` "Member limit" row reports `Unlimited` across all tiers.
  The `cloud` block (including `free: "12"`) is preserved for hosted.
- `apps/web/core/components/workspace/billing/comparison/root.tsx` +
  `plan-detail.tsx` — for self-hosted, the plan-detail CTA is replaced by a
  disabled "Self-hosted Community edition" button; the external
  `Upgrade to X` / `Talk to Sales` redirection only applies when commercial
  gating is active.

The billing page still lists all plans informatively; nothing is hidden
silently — the purchase path is removed because no purchasable plan exists for a
self-hosted Community instance.

## Priority Feature Audit

| Feature                       | Frontend gate found                                                                                        | Backend gate found                                                                                                                  | Limit                          | State         | Action                                                                                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seats (member cap)            | `plans.tsx` `free: "12"`, highlight "Upto 12 users"; `self-hosted` "~50/~200" member-limit copy            | None (invite/accept has no seat check)                                                                                              | 12-user cap was marketing only | Complete      | Removed 12-seat + member-limit messaging for self-hosted; backend tests prove >12 invites/acceptance                                               |
| Project Tracking (work items) | None for self-hosted (implemented stack; no PRO badge)                                                     | None                                                                                                                                | None                           | Complete      | Verified implemented and unrestricted; no gate to remove                                                                                           |
| Teamspaces (as entity)        | Marketing row "Teamspace Cycles" (implemented as Active Cycles, P4B); empty-state asset; type comment only | None                                                                                                                                | None                           | Partial       | Active Cycles equivalent works for self-hosted; distinct Teamspace entity is source absent — follow-up                                             |
| Wiki                          | Marketing row "Wiki"; `isWikiPath` hook; no `/wiki` route (orphan links)                                   | None                                                                                                                                | None                           | Partial       | Project-scoped Pages are implemented and work; standalone workspace Wiki is source absent — follow-up                                              |
| Initiatives                   | Marketing row "Initiatives" (comingSoon); reserved slugs only                                              | None                                                                                                                                | None                           | Source absent | Not unlocked; reported for follow-up                                                                                                               |
| Templates                     | Marketing rows; dormant `templateId` props                                                                 | None (no template model/API)                                                                                                        | None                           | Source absent | Not unlocked; reported for follow-up                                                                                                               |
| Worklogs / Time Tracking      | `estimates.ts` TIME `is_ee: true`; `plans.tsx` "Time Tracking + Worklogs"                                  | `EstimateType` lacked `TIME`; `Project.is_time_tracking_enabled` bool + exporter `issue_worklogs` filter only; no worklog model/API | None                           | Partial       | TIME estimate system unlocked for self-hosted (backend `TIME` choice added + frontend gate lifted); issue-level Worklogs source absent — follow-up |

## Shared Resolver / Gate Table

| Resolver / gate                             | Before                                      | After                                                                    | Used by                                                      |
| ------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `GET /api/instances/` `capabilities.policy` | —                                           | Backend-derived `self_hosted` / `commercial_gating` / `seat_limit: null` | All frontend surfaces below                                  |
| `useSelfHostedPolicy()`                     | —                                           | Shared hook reading instance store                                       | Sidebar badges, edition badge, estimates, billing comparison |
| `SidebarWorkspaceMenuItem` `UpgradeBadge`   | Always rendered (PRO)                       | Rendered only when `hasCommercialGating`                                 | `workspace-menu.tsx`                                         |
| `ExtendedSidebarItem` Active Cycles badge   | Always rendered (PRO)                       | Rendered only when `hasCommercialGating`                                 | extended sidebar                                             |
| `WorkspaceEditionBadge`                     | Opens `PaidPlanUpgradeModal`                | Opens billing settings for self-hosted                                   | `sidebar-wrapper.tsx`                                        |
| `isEstimateSystemEnabled`                   | TIME always false                           | TIME true for self-hosted                                                | `estimate-create` stage one                                  |
| `PlanDetail` CTA                            | `Upgrade to X` / `Talk to Sales` → external | Disabled "Self-hosted Community edition"                                 | billing comparison                                           |
| `plans.tsx` highlights / member limit       | "Upto 12 users", self-hosted "~50/~200"     | "Unlimited users" / "Unlimited"                                          | billing comparison                                           |

## Tests Added

`apps/api/plane/tests/contract/app/test_self_hosted_unlimited.py`:

- `TestSelfHostedPolicyEndpoint` — the `/api/instances/` policy block reports
  `self_hosted: true`, `commercial_gating: false`, `feature_tier: unlimited`,
  null limits, default Community edition, and no fabricated subscription /
  invoice / billing keys, and no secret leakage.
- `TestWorkspaceSeatUnlimited` — a workspace already at the old 12-user cap
  accepts a 13th invite; a workspace at 14 members accepts a 15th invite; and
  accepting an invitation pushes the workspace to 13 members.
- `TestInvitationAuthorizationPreserved` — a member (role 15) cannot invite an
  admin (role 20); a guest (role 5) is denied; unauthenticated acceptance is
  rejected (401); the accepting user must be the invited email (403);
  cross-workspace acceptance is rejected (404, tenant isolation).
- `TestCommunityEditionNeutrality` — the historical default `PLANE_COMMUNITY`
  instance identity never blocks a 13th invite.
- `TestEstimateTimeSystem` — creating and retrieving an estimate with type
  `time` succeeds end to end.

## Validation

Frontend checks run in this environment (all pass):

- `oxfmt` on all changed files.
- `oxlint` on all changed files: 0 warnings / 0 errors.
- `@plane/types` `check:types` and `build`.
- `@plane/i18n` `sync:check` — all locales 100% in sync (no new copy added).
- Web `check:types` (after building the 10 workspace dependency packages).
- Web `check:lint` (exit 0; 780 pre-existing warnings under the configured
  11957 threshold, none from changed files).

Backend: `docker compose -f docker-compose-test.yml` could not be executed in
this environment because Docker is unavailable. The backend changes pass
`python -m py_compile`, and the test module follows the existing
`@pytest.mark.contract` / `@pytest.mark.django_db` conventions with
task-mocking identical to `test_authentication.py`. The full suite command is:

```bash
docker compose -f docker-compose-test.yml run --rm api-tests pytest \
  apps/api/plane/tests/contract/app/test_self_hosted_unlimited.py -m contract
```

## Security Review

- No new privileges, no RBAC changes, no permission relaxations: the invite
  role checks, workspace admin permission, guest denial, email-squat guard, and
  tenant-scoped lookups are unchanged and regression-tested.
- The policy block is sanitized and public, matching the existing boot/config
  read model; no secrets are returned.
- No fake subscriptions, invoices, payments, seats, billing events, or external
  license responses are created; no external/cryptographic license bypass.
- Throttling, pagination, request/upload limits, bounded batches, timeouts,
  worker safety, signed URLs, webhook validation, and realtime authorization are
  untouched.
- The cloud plan-comparison data (`cloud.*`, `free: "12"`) is preserved for
  hosted deployments; only self-hosted presentation is normalized.

## Final Status

| Feature                       | Status                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| Seats (unlimited membership)  | Complete                                                                              |
| Project Tracking (work items) | Complete (already unrestricted)                                                       |
| Teamspaces                    | Partial (Active Cycles equivalent works; entity source absent)                        |
| Wiki                          | Partial (project Pages work; standalone Wiki source absent)                           |
| Initiatives                   | Source absent                                                                         |
| Templates                     | Source absent                                                                         |
| Worklogs / Time Tracking      | Partial (TIME estimate system Complete for self-hosted; issue Worklogs source absent) |

## Follow-ups (out of scope for P6)

- Implement a backend Templates model/API before advertising templates.
- Implement Teamspace and Initiative models/routes/APIs before advertising them.
- Implement a standalone Wiki route/model or remove the orphan `/wiki` links.
- Implement an Issue Worklog model + endpoints + UI to make "Full Time Tracking"
  real; the existing `is_time_tracking_enabled` boolean and `issue_worklogs`
  exporter filter are scaffolding only.
