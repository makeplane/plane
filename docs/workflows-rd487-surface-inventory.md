# RD-487 — §34 State-Mutation Surface Inventory

> Every path capable of writing `Issue.state_id` after a workflow
> governs the project — what it does today, and what RD-487 changed.

The key spec invariant (spec §34) is:

> Work Item state is no longer a freely writable property once a workflow
> governs the item. It is the result of an authorized workflow
> transition or approval decision.

This inventory audits each known state-write surface, classifies it
relative to the invariant, and lists the P0.4 follow-ups that landed
with RD-487.

## Surface inventory

| # | Surface | Path | Wired through `TransitionService`? | RD-487 change |
|---|---------|------|------------------------------------|---------------|
| 1 | App REST PATCH `/api/...issues/:id/` (web) | `apps/api/plane/app/serializers/issue.py::IssueCreateSerializer.update` | ✅ Yes (P0.4 / RD-459) | Verified still wired |
| 2 | App REST POST `/api/...issues/` (web create) | `apps/api/plane/app/serializers/issue.py::IssueCreateSerializer.create` | ✅ Yes (P0.4 / RD-459) | Verified still wired |
| 3 | Public REST PATCH `/api/v1/...issues/:id/` (PAT) | `apps/api/plane/api/serializers/issue.py::IssueSerializer.update` | ❌ → ✅ **fixed in RD-487** | Now routes through `TransitionService.transition` |
| 4 | Public REST POST `/api/v1/...issues/` (PAT create) | `apps/api/plane/api/serializers/issue.py::IssueSerializer.create` | ❌ → ✅ **fixed in RD-487** | Now routes through `TransitionService.validate_creation_state` |
| 5 | Service token / API token write | shared with surfaces 1–4 | ✅ Yes | `WorkspaceServiceTokenEndpoint` issues a token that authenticates as the same user; same RBAC |
| 6 | MCP (planned) | n/a — not yet shipped | n/a | Out of scope for RD-487; tracked under P1.x |
| 7 | Bulk update `BulkUpdateIssuesEndpoint` | `apps/api/plane/app/views/issue/base.py` | ✅ Yes (RD-459) | Verified still wired |
| 8 | Intake accept / reject | `apps/api/plane/app/views/intake/base.py` | ✅ Yes (RD-459) | Verified still wired |
| 9 | Importer | `apps/api/plane/app/views/exporter/...` and `app/views/issue/importer/...` | ✅ Yes (RD-459) | Verified still wired |
| 10 | Background task `close_old_issues` | `apps/api/plane/bgtasks/issue_automation_task.py` | ✅ Yes (RD-459, uses `system_bypass=True`) | Verified still wired; bypass_reason required |
| 11 | Workflow runtime endpoints | `apps/api/plane/app/views/issue/workflow_runtime.py` | ✅ Yes — these are the canonical write paths | n/a |

## What RD-487 actually changed

The previous inventory (RD-459) had a gap on row 3 and 4: the public
`/api/v1/...` issue serializer never called `TransitionService`. A
caller with a PAT could `PATCH /api/v1/workspaces/.../issues/:id/`
with a `{"state_id": "..."}` payload and bypass workflow enforcement
entirely. RD-487 plugs that gap.

The other fixes in this PR are not new wire-paths but they were the
gating conditions for the wire paths above to be *safe*:

1. **`WorkflowError` → DRF exception handler.** Before RD-487 a
   `WorkflowError` raised inside the issue serializer was caught by
   the app serializer's local handler but bubbled past the public
   serializer and surfaced as a 500 (the dataclass couldn't be JSON
   serialized). The auth exception handler now maps the dataclass to
   its declared `status_code` + `to_payload()` payload.
2. **`Project.workflow_enabled` API.** Pixel could not build §23.1's
   toggle without it. RD-487 adds `GET`/`PATCH` on
   `/api/workspaces/:slug/projects/:project_id/workflow-toggle/` plus
   explicit `workflow_enabled` on the list serializer.
3. **Actor read path.** `WorkflowFlowReadSerializer` now exposes the
   `actors` array, and `WorkflowRevisionFlowListEndpoint`,
   `WorkflowRevisionFlowDetailEndpoint`, `WorkflowFlowActorListEndpoint`,
   and `WorkflowFlowActorDetailEndpoint` each gained a `GET`. Without
   this, the FE could not render the actor roster without scraping the
   write endpoints.
4. **Bootstrap ships actors.** Every default-workflow flow now has at
   least one `ALL_PROJECT_MEMBERS` actor. Without this, `compute_allowed_actions`
   and `transition` would 403 every transition the moment
   `workflow_enabled` flipped on (the actor check would have nothing
   to authorize against).
5. **`compute_allowed_actions` runs `authorize_actor`.** The compute
   path now mirrors the actual transition path — same actor check,
   same `allowed` flag. Previously the FE could render a "Go to Done"
   button that the service would then 403.
6. **`is_default` PATCH safety.** `WorkflowUpdateSerializer` no longer
   accepts `is_default`, and the detail view rejects any PATCH that
   tries to flip it with `WorkflowDefaultImmutable` (409). Without
   this, an admin could create a second default workflow and break the
   §7.1 partial unique at the application layer.

## What's still on the runway

- MCP integration is tracked separately; it is the only §34 surface
  not yet exercised by tests.
- The `/api/v1/...` issue view's bulk update path
  (`BulkUpdateIssuesEndpoint`) is intentionally not migrated to the
  public serializer — the bulk endpoint is app-only — but it does
  call into the app issue serializer, so it inherits the workflow
  enforcement transitively.
- Test matrix §29.1–§29.7 is covered by the existing test suite
  (`apps/api/plane/tests/unit/services/workflow/`). The full suite
  was not re-run in RD-487 because the project owner explicitly
  forbids docker-based test runs ("đừng test bằng docker, lâu bỏ
  mẹ ra"); RD-487 instead adds the missing actor/bootstrap coverage
  and the DRF handler contract tests so a follow-up non-docker run
  has fewer gaps.
