# Phase 3: Propagation API Endpoint, Persistence & Contract - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning
**Mode:** `--auto` (recommended options auto-selected; no user prompts)

<domain>
## Phase Boundary

Wrap Phase 1's `load_precedence_graph(...)` and Phase 2's `propagate_move(...)` behind a **single dedicated DRF endpoint** that owns: (a) request parsing & structural validation, (b) project queryset construction (Issue + IssueRelation, soft-delete / archive / draft filtered), (c) `transaction.atomic()` boundary with `select_for_update` on the dragged row for race-safe stale check, (d) `bulk_update` of `start_date` / `target_date` / `updated_at` in a single SQL statement, (e) post-commit fan-out of `issue_activity.delay(...)` and `model_activity.delay(...)` via `transaction.on_commit(...)`, (f) the **stable `{code, message}` failure envelope** with deterministic HTTP status codes per error code, and (g) success payload mirroring the algorithm's `WorkItemUpdate` tuple plus the post-write `updated_at` snapshot.

The endpoint is the **stable HTTP contract** that Phases 4-6 are pure clients of — once shipped, request body shape, response shape, error code names, and HTTP status mapping are frozen until ADR-amendment.

**In scope (Phase 3 only):**

- `apps/api/plane/app/views/issue/timeline_propagation.py` — `TimelinePropagationView(BaseAPIView)` with a single `post(self, request, slug, project_id)`.
- `apps/api/plane/app/serializers/timeline_propagation.py` — three serializers:
  - `TimelinePropagationRequestSerializer` (input validation; structural only — `INVALID_DATE_RANGE` semantic check stays in algorithm per Phase 2 D-06 step 1).
  - `TimelinePropagationResponseSerializer` (success payload — `requested_work_item_id`, `total_updated_count`, optional `client_preview_count`, `work_items: [{ id, start_date, target_date, updated_at }]`).
  - `TimelinePropagationErrorSerializer` (failure payload — `code`, `message`).
- URL registration in `apps/api/plane/app/urls/issue.py`: `workspaces/<str:slug>/projects/<uuid:project_id>/timeline-propagation/`.
- View export from `apps/api/plane/app/views/__init__.py`.
- Factory extension: `IssueFactory` and `IssueRelationFactory` added to `apps/api/plane/tests/factories.py` (currently absent — `factories.py` ends at `ProjectMemberFactory`). Reason: contract tests need to author dependency graphs in plain factory_boy declarative style, not inline `Issue.objects.create(...)` like Phase 1 used in unit tests.
- `apps/api/plane/tests/contract/app/test_timeline_propagation.py` — `@pytest.mark.contract` cases covering TEST-10, TEST-13, TEST-15, TEST-16, TEST-17, TEST-18 plus auxiliary cases for HTTP status mapping and `transaction.on_commit` registration.

**Out of scope (deferred to later phases):**

- Frontend types / `@plane/services` client / MobX preview store / drag handler / E2E → Phases 4-6.
- A `version` integer column on `Issue` — explicitly NOT added (per ROADMAP "Optional NEW model field … out of scope; reuse `updated_at` for stale check"). No new migrations in Phase 3.
- Working Calendar / working-day arithmetic → ADR 0002 follow-up milestone. Phase 3 imports `propagate_move` and never calls `scheduling.py` directly, so the ADR 0002 swap remains a Phase 2 internal change.
- Touching `IssueBulkUpdateDateEndpoint` (`apps/api/plane/app/views/issue/base.py:1093`) — left intact (API-11). Pre-existing behavior including its missing `transaction.on_commit` for `issue_activity.delay` is **NOT** in scope to fix here; document only as a known divergence so the new endpoint sets the better pattern.

</domain>

<decisions>
## Implementation Decisions

### URL & routing

- **D-01:** URL is **project-scoped**, single POST verb:
  ```
  POST /api/v1/workspaces/<str:slug>/projects/<uuid:project_id>/timeline-propagation/
  ```
  Mounted under the `apps/api/plane/app/urls/issue.py` urlpatterns list (the same module that owns IssueRelation, IssueBulkUpdateDateEndpoint, etc.) — added immediately after the `issue-dates/` entry (line 252-255) for narrative cohesion ("dates endpoint, propagation endpoint"). The drf urlconf is reached via `apps/api/plane/urls.py` → `path("api/v1/", include("plane.app.urls.issue"))` (existing prefix; verifiable in tests via `reverse("project-timeline-propagation")`).
- **Rejected:** `/projects/<project_id>/issues/<issue_id>/timeline-propagation/` (nesting under work item id). The dragged work-item id is part of the **intent** (the body), not the **resource** (the URL). Putting it in the URL would imply you can drag any issue from anywhere; the project scope is what bounds the same-project precedence graph (PROP-16). One project = one propagation surface.
- URL `name` for `reverse(...)`: `project-timeline-propagation`.

### Permission strategy & code envelope translation

- **D-02:** The view does **not** stack `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` directly. Reason: the existing decorator returns `Response({"error": "..."}, status=403)` (`apps/api/plane/app/permissions/base.py:81-84`) which is **incompatible** with our stable `{code, message}` contract (API-05, API-06, ERR-06). We do not modify the shared decorator (would break dozens of other endpoints).
- Instead, the view performs an **inline membership check** that mirrors the decorator's logic:
  ```python
  is_member = ProjectMember.objects.filter(
      member=request.user,
      workspace__slug=slug,
      project_id=project_id,
      role__in=[ROLE.ADMIN.value, ROLE.MEMBER.value],
      is_active=True,
  ).exists()
  if not is_member:
      return _error(PropagationErrorCode.PERMISSION_DENIED, "You don't have the required permissions.", status=403)
  ```
  GUEST role is **excluded** explicitly — propagation modifies dates, which is a member-or-above operation per existing `IssueBulkUpdateDateEndpoint` precedent (`apps/api/plane/app/views/issue/base.py:1113`). No workspace-admin override (see D-02b for why).
- **D-02b:** Workspace-admin-without-project-member fallback (decorator's else-branch at `permissions/base.py:64-78`) is **NOT** mirrored. Reason: that fallback was introduced to let workspace admins bypass project membership for read-heavy operations; allowing it for a write that touches up to 100 work items in another team's project violates least-privilege. If product later disagrees, the fallback can be added in a follow-up — the failure code stays `PERMISSION_DENIED`, so adding the bypass would be backwards-compatible.
- Helper `_error(code, message, *, status)` lives module-private inside `views/issue/timeline_propagation.py`; emits `Response({"code": code.value, "message": message}, status=status)`. Used by every failure path including PERMISSION_DENIED for one consistent envelope.

### HTTP status code mapping (the wire contract)

- **D-03:** Each of the 7 `PropagationErrorCode` values maps to **exactly one** HTTP status code. The mapping is the wire contract Phase 4 freezes against. Tests assert it explicitly per failure case.

  | Error code                    | HTTP status | Reason                                                                                                                                                                                |
  | ----------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `PERMISSION_DENIED`           | 403         | RFC 9110 §15.5.4 — authenticated but unauthorized.                                                                                                                                    |
  | `SCHEDULE_CHANGED`            | 409         | RFC 9110 §15.5.10 — Conflict; canonical for "your view of the resource is stale". Lets clients distinguish "retry after refresh" (409) from "fix your input" (422).                   |
  | `DEPENDENCY_CYCLE`            | 422         | RFC 9110 §15.5.21 — well-formed request that violates a domain invariant.                                                                                                             |
  | `PROJECT_BOUNDARY_EXCEEDED`   | 422         | Domain invariant.                                                                                                                                                                     |
  | `INCOMPLETE_SCHEDULE`         | 422         | Domain invariant.                                                                                                                                                                     |
  | `PROPAGATION_LIMIT_EXCEEDED`  | 422         | Domain invariant.                                                                                                                                                                     |
  | `INVALID_DATE_RANGE`          | 422         | Domain invariant — `target < start`, or `requested_duration != original_duration`. Note: shape errors (e.g., `"2024-13-99"`) hit DRF 400 before the algorithm runs (see D-04).        |

  Plain DRF parser/serializer failures (missing field, malformed UUID, malformed date) return DRF default `400` with the DRF default error body — **not** wrapped in `{code, message}` (different layer, different audience). API-05 / API-06 / ERR-01..ERR-07 only cover the 7 codes; serializer-rejected requests are bugs in the client, not domain failures.
- 200 OK on success (not 201) — `bulk_update` is an update of existing rows, no resource creation.

### Serializer responsibilities (structural vs semantic)

- **D-04:** Serializer enforces only **structural** validity. Semantic checks stay in `propagate_move(...)` (D-06 from Phase 2 owns the rule order; duplicating in the serializer would create two failure surfaces and violate the deep-module discipline). Specifically:
  - `TimelinePropagationRequestSerializer` fields:
    - `work_item_id: UUIDField(required=True)`
    - `original_start_date: DateField(required=True)` (`%Y-%m-%d`)
    - `original_target_date: DateField(required=True)`
    - `expected_updated_at: DateTimeField(required=True)` — DRF default ISO 8601 with microseconds (matches Django `DateTimeField(auto_now=True)` from `TimeAuditModel`; Phase 2 D-04 wire contract).
    - `requested_start_date: DateField(required=True)`
    - `requested_target_date: DateField(required=True)`
    - `operation: ChoiceField(choices=[("move", "move")], required=True)` — `move`-only enum (PROP-18 / FE-09); `resize` is a 422 at this layer because it doesn't parse, not a 422 from the algorithm.
    - `client_preview_count: IntegerField(required=False, min_value=0)` — optional metadata for UX (FE-06 hidden-update notification can be computed without it, but if the client sends it, we echo it back in the response).
  - **No** cross-field `validate(...)` on the serializer. `requested_target < requested_start`, `original_target < original_start`, and duration mismatch are all caught by the algorithm's `INVALID_DATE_RANGE` (Phase 2 D-06 step 1). If we duplicated the check at the serializer, we'd return DRF's `400` shape and never exercise the documented `{"code": "INVALID_DATE_RANGE", "message": ...}` envelope — making the wire contract untestable from the outside.
  - `TimelinePropagationResponseSerializer` (success):
    ```json
    {
      "requested_work_item_id": "<UUID>",
      "total_updated_count": <int>,
      "client_preview_count": <int|null>,    // echoed only if request sent it
      "work_items": [
        { "id": "<UUID>", "start_date": "YYYY-MM-DD", "target_date": "YYYY-MM-DD", "updated_at": "<ISO 8601>" },
        ...
      ]
    }
    ```
  - `TimelinePropagationErrorSerializer` (failure):
    ```json
    { "code": "<one of 7 enum values>", "message": "<human-readable English>" }
    ```
  - `TimelinePropagationErrorSerializer` is **not actually invoked** at runtime (we craft the dict directly via `_error(...)`). It exists for `drf-spectacular` schema generation so the OpenAPI doc lists the failure shape.

### Transaction boundary, locking, and bulk_update mechanics

- **D-05:** The view's persisted execution path is:
  1. **Outside** the transaction: serializer parse, permission check, build `MoveIntent` from validated data, build `expected_versions = {work_item_id: validated["expected_updated_at"]}`.
  2. `with transaction.atomic():` opens. **Inside** the transaction:
     a. **Lock the dragged row first** (race-safe stale check):
       ```python
       try:
           dragged = (
               Issue.issue_objects
               .select_for_update()
               .get(
                   id=move_intent.work_item_id,
                   workspace__slug=slug,
                   project_id=project_id,
               )
           )
       except Issue.DoesNotExist:
           return _error(PERMISSION_DENIED, ..., status=403)  # or 404; see D-05c
       ```
       Locking only the dragged item (not the whole graph) is sufficient because: Phase 2 D-08 limits the stale check to the dragged item; the `bulk_update` itself is a single SQL statement that doesn't need row-level locking to be atomic; a concurrent writer to a downstream item between our query and our `bulk_update` would land in our `select_related` snapshot, but the writer's commit would either land before our `select_for_update` (we read fresh data, no race) or after we commit (we win, they conflict next time).
     b. Build the IssueRelation queryset for Phase 1:
       ```python
       relations = (
           IssueRelation.objects
           .filter(project_id=project_id, deleted_at__isnull=True)
           .annotate(
               issue_project_id=F("issue__project_id"),
               related_project_id=F("related_issue__project_id"),
           )
           .select_related("issue", "related_issue")
       )
       graph = load_precedence_graph(relations, project_id=project_id)
       ```
       The `annotate(...)` exposes both endpoints' `project_id` so the loader honors Phase 1 D-03 (cross-project classification reads BOTH endpoints, `_make_edge` already prefers the annotated names).
     c. Build the work-items map from a single Issue queryset filtered to candidate scheduled rows:
       ```python
       items = (
           Issue.issue_objects
           .filter(
               workspace__slug=slug,
               project_id=project_id,
               archived_at__isnull=True,
               is_draft=False,
           )
           .only("id", "project_id", "start_date", "target_date", "updated_at")
       )
       work_items_by_id = {
           i.id: ScheduledWorkItem(
               id=i.id,
               project_id=i.project_id,
               start_date=i.start_date,
               target_date=i.target_date,
               updated_at=i.updated_at,
           )
           for i in items
       }
       ```
       Phase 1 D-05 explicitly assumes the caller filters `archived_at`, `is_draft`, `deleted_at`. `Issue.issue_objects` (the manager defined at `db/models/issue.py:170`) already filters `deleted_at`; `archived_at` and `is_draft` are added explicitly here.
     d. `result = propagate_move(graph, work_items_by_id, move_intent, expected_versions)`.
     e. **If `result.failure is not None`:** craft the `_error(...)` response with the D-03 status and `return` from inside the `with` block. Django automatically rolls the (no-op) transaction back. **No `bulk_update` was called**, so all-or-nothing is satisfied trivially (API-08, TEST-15, TEST-17).
     f. **If success:** assemble Issue instances from `result.updates`, set `start_date`, `target_date`, and `updated_at = now` (where `now = timezone.now()` was captured once at the top of the request), then:
       ```python
       Issue.objects.bulk_update(issue_instances, ["start_date", "target_date", "updated_at"])
       ```
       Django's `bulk_update` bypasses model `save()` and `auto_now`; we set `updated_at` explicitly so all updated rows share **one** consistent `updated_at` value (deterministic, easy to assert in TEST-16 and FE-04 reconciliation). The `now` value is what we return in the response payload — no SELECT-after-write needed.
     g. Register post-commit side effects via `transaction.on_commit(lambda: ...)`:
       - Per-updated-issue `issue_activity.delay(type="issue.activity.updated", ...)` with `requested_data` = `{"start_date": ..., "target_date": ...}` and `current_instance` = the **pre-update** snapshot pulled from `work_items_by_id[id]`. Mirrors `IssueBulkUpdateDateEndpoint` line 1142 patterns but **inside `on_commit`** (the existing endpoint's lack of `on_commit` is a latent bug we don't replicate; logged as a follow-up note in `<deferred>`).
       - One `model_activity.delay(model_name="issue", model_id=str(item.id), ...)` per updated issue. Schedule under `on_commit` for the same reason.
     h. Return the success Response. Django commits the transaction at the `with` exit; `on_commit` callbacks fire automatically.
- **D-05a (timezone.now placement):** Capture `now = timezone.now()` ONCE at the top of `post(...)` (before `transaction.atomic()`). Reused for every Issue instance's `updated_at` assignment. One value, one assertion target in tests.
- **D-05b (conflict between SELECT FOR UPDATE and the existing endpoint):** `IssueBulkUpdateDateEndpoint.post` (`base.py:1113-1170`) does NOT lock — it can interleave with our endpoint. Outcome: a concurrent bulk-update on a row we're about to propagate against either lands first (our `select_for_update` waits, sees fresh data, runs against committed state) or lands after our commit (it sees our updates, no inconsistency). PostgreSQL READ COMMITTED + row lock is sufficient. This is documented for plan-phase (no code change in Phase 3 — just an explicit note that the endpoints coexist safely).
- **D-05c (Issue not found):** `Issue.DoesNotExist` on the dragged item maps to `PERMISSION_DENIED` (403), not 404. Reason: a non-member should not be able to learn whether a work item exists or not (info-leak). Same semantic as the inline membership check — both yield "you don't have the required permissions." Test pinned by an unauthenticated/unaffiliated user POST.

### `INCOMPLETE_SCHEDULE` for the dragged item — caught by algorithm (Phase 2 D-06 step 3)

- **D-06:** The view does **not** pre-check whether the dragged Issue has both `start_date` and `target_date`. Even if the request body provides `original_start_date` and `original_target_date`, the database row could have `NULL` dates (e.g., the user's drag-start snapshot was stale and another writer cleared the dates). Phase 2's D-06 step 3 already catches this and returns `INCOMPLETE_SCHEDULE`. We trust the algorithm. The `ScheduledWorkItem(start_date=None, target_date=None, ...)` constructed in step c of D-05 carries the truth.

### Audit trail — `issue_activity.delay` signature

- **D-07:** Per-issue activity uses the existing `issue_activity.delay(...)` task (`apps/api/plane/bgtasks/issue_activities_task.py`). Field-pair pattern (start_date, target_date) is logged in **two** events per propagated issue (one for `start_date`, one for `target_date`) when both move, mirroring `IssueBulkUpdateDateEndpoint`'s loop at `base.py:1142-1166`. If only `start_date` actually changed, log only the `start_date` event (no spam; activity log readers don't want false "target_date moved by 0" rows).
- `current_instance` is the **pre-update** value snapshot from `work_items_by_id`; `requested_data` is the new value. Both serialized with `json.dumps(..., cls=DjangoJSONEncoder)` (the existing pattern for `date`).
- All `.delay(...)` calls registered via `transaction.on_commit(...)`, which differs from the `IssueBulkUpdateDateEndpoint`'s pattern. Documented in **D-09**.

### Webhook fan-out — `model_activity.delay`

- **D-08:** One `model_activity.delay(model_name="issue", model_id=str(item.id), requested_data=..., current_instance=..., actor_id=request.user.id, slug=slug, origin=base_host(request=request, is_app=True))` per updated issue. Same on-commit registration. This is the source of webhook events; if the transaction rolls back, no webhook fires (correct semantics).

### Activity & webhook firing under `transaction.on_commit`

- **D-09:** `issue_activity.delay(...)` and `model_activity.delay(...)` are registered via `transaction.on_commit(callable)` so they fire **only on successful commit**. If `bulk_update` raises (e.g., DB error, integrity violation, lock timeout) and the transaction rolls back, no Celery task is enqueued.
- The existing `IssueBulkUpdateDateEndpoint` calls `.delay(...)` synchronously **before** the `bulk_update` (`base.py:1142-1166`), which can leak audit events even when the bulk update itself fails. We do **not** propagate that bug into the new endpoint; we set the better pattern. We do **not** retroactively fix `IssueBulkUpdateDateEndpoint` in Phase 3 (out of scope per ROADMAP API-11). Logged as a deferred follow-up.

### Soft-delete / archive / draft filtering on input querysets

- **D-10:** Both querysets filter at view level (Phase 1 D-05 explicitly assumes this):
  - `IssueRelation.objects.filter(project_id=..., deleted_at__isnull=True)`.
  - `Issue.issue_objects.filter(..., archived_at__isnull=True, is_draft=False)` (`Issue.issue_objects` already filters `deleted_at`; verifiable in `db/models/issue.py:170` `IssueManager`).
  - The serializer does NOT have to filter; the queryset is the boundary.
  - If the dragged Issue is archived/draft/deleted, the `select_for_update().get(...)` raises `DoesNotExist` and we map to `PERMISSION_DENIED` (D-05c).

### Cross-project queryset annotation

- **D-11:** `IssueRelation` queryset adds two annotations Phase 1's `_make_edge` reads:
  ```python
  .annotate(
      issue_project_id=F("issue__project_id"),
      related_project_id=F("related_issue__project_id"),
  )
  ```
  These annotations are picked up in preference to dereferencing `row.issue.project_id` / `row.related_issue.project_id` inside the loader (Phase 1 Pitfall 2 — reading those would force two extra N+1 reads per relation). With `.select_related("issue", "related_issue")` already in place, the foreign rows are loaded once via JOIN; the annotations make the project_id lookups single-column reads. Phase 1 D-03 / `_make_edge` (`graph.py:136`) already supports both code paths — the annotation is just the cheap one.

### Stable error code source — single import from Phase 2

- **D-12:** The view imports from Phase 2's public surface only:
  ```python
  from plane.app.services.timeline_propagation import (
      load_precedence_graph,
      propagate_move,
      MoveIntent,
      ScheduledWorkItem,
      PropagationErrorCode,
      PropagationFailure,
      PropagationResult,
  )
  ```
  The wire `code` strings are `code.value` — no string literals in the view. If Phase 2 ever renames a code, the view fails to import (build-time signal), not the wire (runtime signal). This is the **only** way the 7 codes leak into the HTTP layer.
- The view does NOT import from `plane.app.services.timeline_propagation.scheduling` or `.propagation` directly — only the package's `__init__.py` re-exports. ADR 0002's Working Calendar swap can change `scheduling.py` internals freely.

### Handling unrelated DB exceptions

- **D-13:** Any exception from the algorithm or `bulk_update` that isn't a typed `PropagationFailure` (e.g., `IntegrityError`, `OperationalError`, `Issue.DoesNotExist`-after-stale-check, etc.) is **not** caught at the view level. `BaseAPIView.handle_exception` (`apps/api/plane/app/views/base.py:167-...`) takes over and returns the existing generic 4xx/500 envelope. We don't bury those errors under `PropagationErrorCode`. Reason: the 7 codes are domain failures the client can act on; an `OperationalError` is operations' problem and should surface as 500 to feed monitoring.

### Test layout & fixtures

- **D-14:** Tests live at `apps/api/plane/tests/contract/app/test_timeline_propagation.py`, marked `@pytest.mark.contract` + `@pytest.mark.django_db`, using `session_client`. **No** `live_server` (no Hocuspocus / channels involvement).
- Required fixture additions to `apps/api/plane/tests/factories.py`:
  - `IssueFactory(factory.django.DjangoModelFactory)` with `class Meta: model = Issue`, `project` SubFactory, `name`, `created_by`, `updated_by`, `state` defaults; expose convenience SubFactories so tests can chain `IssueFactory(project=p, start_date=..., target_date=...)`.
  - `IssueRelationFactory(factory.django.DjangoModelFactory)` with `class Meta: model = IssueRelation`, `issue`, `related_issue`, `relation_type="blocked_by"` default, `project` resolved from the `issue`'s project.
  - Both factories use `factory.LazyFunction(uuid4)` for `id` (consistent with existing factories).
- Run command: `cd apps/api && python run_tests.py -c` (contract marker) or direct `pytest plane/tests/contract/app/test_timeline_propagation.py -v`.
- Required test cases (every one of these is a top-level `def test_*` mapped to a single TEST-NN id where applicable):
  - `test_unauthenticated_request_returns_401` — no `session_client.force_authenticate`; DRF returns 401 (not the {code, message} shape — DRF authentication layer).
  - `test_non_member_returns_permission_denied_403` — authenticated user with no ProjectMember row; expect 403, body `{"code": "PERMISSION_DENIED", "message": ...}` (TEST-18).
  - `test_guest_returns_permission_denied_403` — ProjectMember with `role=ROLE.GUEST.value`; expect 403 + envelope.
  - `test_no_violation_move_returns_200_with_dragged_only` — single-row updates list, `total_updated_count=1` (TEST-16 piece 1).
  - `test_chain_propagation_returns_200_with_full_payload` — three issues A→B→C, drag A right; expect `total_updated_count=3`, all `updated_at` equal, `start_date`/`target_date` reflect minimum shifts (TEST-16 main).
  - `test_dependency_cycle_returns_422_envelope` — graph with cycle; assert no row in DB has changed `updated_at` (snapshot diff) (TEST-15 / TEST-17).
  - `test_cross_project_path_returns_422_envelope` — cross-project edge in propagation walk; same all-or-nothing assertion (TEST-10).
  - `test_incomplete_schedule_descendant_returns_422_envelope` — successor with `target_date=None`; algorithm walks into it; same assertion.
  - `test_propagation_limit_at_101_returns_422_envelope` — graph with 101 affected items; expect `PROPAGATION_LIMIT_EXCEEDED`.
  - `test_invalid_date_range_returns_422_envelope` — request body with `requested_target_date < requested_start_date`; algorithm returns `INVALID_DATE_RANGE`.
  - `test_stale_updated_at_returns_409_envelope` — request with `expected_updated_at` older than the dragged Issue's current `updated_at`; expect `SCHEDULE_CHANGED` 409 (TEST-13). Also assert the post-call snapshot of the row is unchanged.
  - `test_success_payload_uses_single_now_for_updated_at` — assert all returned `updated_at` values are equal across the array (deterministic from D-05f).
  - `test_serializer_rejects_resize_operation` — `operation="resize"`; expect DRF 400 (NOT 422, NOT envelope) — pinning the structural-vs-domain split (D-04).
  - `test_serializer_rejects_missing_field` — drop `expected_updated_at`; expect DRF 400.
  - `test_existing_bulk_update_endpoint_unchanged` — re-run a smoke test against `IssueBulkUpdateDateEndpoint` proving it still returns 200 + its existing body shape (API-11). Lightweight regression: one POST, one assertEqual on response body.
  - `test_activity_tasks_only_fire_on_commit` — use `pytest-django`'s `transactional_db` flag or mock `issue_activity.delay` and `model_activity.delay`; force a failure case after `bulk_update` would have run (e.g., monkeypatch `bulk_update` to raise) and assert neither `.delay` was called. Falls under D-09's regression guard.

### Lint-grep purity invariant — extension scope

- **D-15:** Phase 2's D-14 lint-grep test in `apps/api/plane/tests/unit/services/timeline_propagation/test_purity.py` walks the `services/timeline_propagation` package. Phase 3 introduces `views/issue/timeline_propagation.py` and `serializers/timeline_propagation.py` which **must** import DRF (`rest_framework.views.APIView`, `serializers.Serializer`, etc.). The Phase 2 purity test stays scoped to the services package and does NOT extend to the new view/serializer (extending it would falsely flag the legitimate DRF imports). No purity-test changes in Phase 3.

### Claude's Discretion

The auto-mode chose recommended options for every gray area above. Specific call-outs the user may want to revisit during plan-phase:

- **HTTP status for `INVALID_DATE_RANGE`** — chose 422 to keep all 5 domain failures uniform. Alternative is 400 (treating it as a structural error). Locked at 422 because the algorithm validates it (Phase 2 D-06 step 1 owns this), not the serializer; the wire body is the `{code, message}` envelope, which DRF default 400 doesn't produce.
- **Whether to lock the dragged Issue with `select_for_update(skip_locked=True)`** — chose blocking lock (default `select_for_update()`). Reason: a concurrent drag racing on the same item is a rare edge case; making the second drag wait briefly for the first to commit yields more predictable client UX than failing it instantly. If product wants instant-fail, swap to `skip_locked=True` and map "row already locked" to a synthetic `SCHEDULE_CHANGED` — defer until needed.
- **Whether `client_preview_count` is required** — chose optional (default `None`). The frontend in Phase 4 will likely always send it (the drag handler knows the loaded-graph count), but allowing the server to handle an absent field keeps tests for non-browser callers (e.g., direct API users) simpler.
- **Whether to include the cycle path in the failure envelope** — Phase 2's `PropagationFailure.cycle: tuple[UUID, ...] | None` carries it. We do **not** expose it in the wire envelope today. Reason: leaking issue ids in error messages is fine inside the team (closed system), but standardizing the envelope at `{code, message}` (per ROADMAP API-05) keeps Phase 4's typing minimal. If ERR-01 wants to highlight the cycle in UI, add a `metadata: {cycle: [...]}` extension field in Phase 4 and update the envelope spec then.
- **Whether to coerce `now` per-row using `auto_now`** — chose explicit `now = timezone.now()` set once. Alternative would be skipping `updated_at` from `bulk_update` and relying on a post-write `Issue.objects.filter(id__in=ids).update(updated_at=Now())` second statement. Rejected: two writes vs one.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### Project-level direction

- `.planning/ROADMAP.md` §"Phase 3: Propagation API Endpoint, Persistence & Contract" — phase goal, success criteria, modules-to-change list, first-minimum-task. **Risks/open questions locked here:** URL shape (D-01), `expected_updated_at` precision (D-04 → ISO with microseconds), HTTP status mapping (D-03), `transaction.atomic` ↔ `auto_now` ↔ `model_activity.delay` interaction (D-05f / D-08 / D-09).
- `.planning/REQUIREMENTS.md` — owns API-01..API-12, PROP-16 (endpoint-side enforcement), TEST-10, TEST-13, TEST-15, TEST-16, TEST-17, TEST-18.
- `.planning/PROJECT.md` — Core value, deep-module-first directive, in-scope/out-of-scope contract, ce/core boundary (irrelevant for this phase — pure backend).
- `.planning/STATE.md` — Phase 2 verified PHASE COMPLETE; Phase 3 unblocked. Carries forward: Vitest decision deferred to Phase 4; `expected_updated_at` shape now locked here (D-04); HTTP status mapping locked here (D-03).

### Prior phase context (do not re-litigate)

- `.planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-CONTEXT.md` — **Phase 2 decisions D-01..D-14.** Most relevant carry-overs:
  - **D-04 / D-05:** Public types `MoveIntent`, `ScheduledWorkItem`, `WorkItemUpdate`, `PropagationResult`, `PropagationFailure`, `PropagationErrorCode` — Phase 3 imports these verbatim (D-12 above).
  - **D-06:** Validation order — algorithm catches `INVALID_DATE_RANGE` / `DEPENDENCY_CYCLE` / `INCOMPLETE_SCHEDULE` / `SCHEDULE_CHANGED` before traversal; Phase 3 trusts this and does not duplicate (D-04 above).
  - **D-08:** Stale check granularity — only the dragged item's `updated_at` is in `expected_versions`; Phase 3 builds a single-entry mapping (D-05a in this file).
  - **D-12:** Single free function `propagate_move(graph, work_items_by_id, move_intent, expected_versions) -> PropagationResult` is the entire algorithm contract.
  - **D-14:** Lint-grep purity invariant — locked to `services/timeline_propagation/`; **does NOT** extend to `views/issue/timeline_propagation.py` (D-15 above).
- `.planning/phases/01-precedence-graph-loader-normalization/01-CONTEXT.md` — Phase 1 D-01..D-10. Most relevant:
  - **D-01:** Loader takes `Iterable[IssueRelation]` and a `project_id`; Phase 3 owns the queryset construction (D-05b in this file).
  - **D-03:** Cross-project edges classified at load time via `related_project_id` annotation; Phase 3 supplies it (D-11 above).
  - **D-05:** Loader assumes the caller filtered `deleted_at`, `archived_at`, `is_draft` — Phase 3 honors this (D-10 above).
- `.planning/phases/02-.../02-VERIFICATION.md` — pin Phase 2's GREEN test count (64) so any Phase 3 test run still shows them GREEN; regression-detection.

### Domain & PRD

- `CONTEXT.md` (repo root) — Ubiquitous Language. Use **Work Item / Precedence Dependency / Dependency Schedule Propagation / Precedence Boundary** in: serializer field docstrings, error `message` strings, test class/function names, view docstring. Avoid "issue" / "relation" in user-facing prose.
- `docs/prd/timeline-dependency-date-range-propagation.md` — PRD with 40 user stories. Phase 3 covers US-21 (all-or-nothing), US-22 (clear failure messages), US-27 (stale schedule), US-30 (no confirmation dialog — irrelevant at API layer but informs absence of confirmation flag), US-31 (permissions), US-32 (audit-traceable), US-35 (move intent body), US-36 (success returns updated dates), US-37 (stable error codes). **Lines 96-115 ("Implementation Decisions") are binding** for the contract shape: `code`+`message` failure object, dedicated endpoint, no precomputed update list from client, success returns id+start_date+target_date+updated_at, propagation metadata (`requested_work_item_id`, `total_updated_count`, optional `client_preview_count`).
- `docs/adr/0001-server-authoritative-dependency-schedule-propagation.md` — server authority lock. Phase 3 is the HTTP gate that enforces server-side resolution.

### Existing code (read-only inputs)

- `apps/api/plane/app/services/timeline_propagation/__init__.py` — Phase 2 public surface; Phase 3 imports from here only (D-12).
- `apps/api/plane/app/services/timeline_propagation/types.py` — `MoveIntent`, `ScheduledWorkItem`, `WorkItemUpdate`, `PropagationResult` shapes; Phase 3 builds `MoveIntent` from validated request data and turns `result.updates` into the JSON response.
- `apps/api/plane/app/services/timeline_propagation/errors.py` — `PropagationErrorCode` (StrEnum) values are the wire codes (D-03).
- `apps/api/plane/app/views/issue/base.py:1093-1170` — `IssueBulkUpdateDateEndpoint`. Read-only reference for: existing `allow_permission([ROLE.ADMIN, ROLE.MEMBER])` pattern, the per-pair `issue_activity.delay` audit shape (lines 1142-1166) Phase 3 mirrors inside `on_commit`, and the latent bug Phase 3 does NOT replicate (no `transaction.on_commit`).
- `apps/api/plane/app/views/base.py:149-...` — `BaseAPIView` parent class; provides `handle_exception`, `authentication_classes = [BaseSessionAuthentication]`, `permission_classes = [IsAuthenticated]`. Phase 3 inherits without override.
- `apps/api/plane/app/permissions/base.py:13-89` — `ROLE` enum (ADMIN=20, MEMBER=15, GUEST=5) and `allow_permission` decorator. Phase 3 reads the values, mirrors the membership query inline (D-02), and does **not** decorate the view.
- `apps/api/plane/app/urls/issue.py` — URL registration target. Insert between line 255 and 256 (just after `IssueBulkUpdateDateEndpoint`), before `IssueVersionEndpoint`.
- `apps/api/plane/app/views/__init__.py` — must add `TimelinePropagationView` to the package re-exports so `urls/issue.py` can `from plane.app.views import TimelinePropagationView`.
- `apps/api/plane/db/models/issue.py:121-176` — `Issue` model. Confirms `start_date` / `target_date` are `DateField(null=True, blank=True)` (line 145-146); `updated_at` comes from `TimeAuditModel` mixin (`db/mixins.py:16-20`, `auto_now=True`). `Issue.issue_objects` (line 170) is a manager that already filters `deleted_at`.
- `apps/api/plane/db/models/issue.py:287-308` — `IssueRelation` model + Meta constraints. The `unique_together = ["issue", "related_issue", "deleted_at"]` rule is what Phase 3's queryset relies on for `deleted_at__isnull=True` filtering.
- `apps/api/plane/db/models/issue.py:263-284` — `IssueRelationChoices` and `_RELATION_PAIRS`. **Binding constraint:** every precedence row is canonically stored as `blocked_by`; the loader's filter of `relation_type = "blocked_by"` is correct and complete (Phase 1 D-04). Phase 3 must not "also include `blocking`" in the queryset.
- `apps/api/plane/bgtasks/issue_activities_task.py:1504+` — `issue_activity` Celery task signature `(type, requested_data, current_instance, issue_id, actor_id, project_id, epoch)`. Phase 3 calls with `type="issue.activity.updated"`.
- `apps/api/plane/bgtasks/webhook_task.py` — `model_activity` task. Used by other endpoints with `(model_name, model_id, requested_data, current_instance, actor_id, slug, origin)`.
- `apps/api/plane/utils/host.py` — `base_host` helper for the `origin` arg of `model_activity.delay`.
- `apps/api/plane/tests/conftest.py:67-71, 116-141` — `session_client`, `workspace`, `create_user` fixtures; Phase 3 contract tests use them. New fixtures (project, project_member, issue, issue_relation) extend `factories.py` (D-14) rather than conftest (factories are reusable across unit + contract suites).
- `apps/api/plane/tests/factories.py` — current factories stop at `ProjectMemberFactory`. Phase 3 adds `IssueFactory` and `IssueRelationFactory` (D-14).
- `apps/api/run_tests.py` — preferred runner; `-c` for contract marker. **Do NOT** use `apps/api/run_tests.sh`.

### Codebase maps (already-read context)

- `.planning/codebase/STACK.md` — Python 3.12.10 + Django 4.2.30 + DRF 3.15.2; pytest + pytest-django + factory_boy 3.3.0; coverage `--fail-under=90` enforced when `--coverage` flag passed. Default DRF auth = `BaseSessionAuthentication`; default permission = `IsAuthenticated`.
- `.planning/codebase/TESTING.md` — markers `unit` / `contract` / `smoke` / `slow`. Phase 3 stays inside `contract`; the unit-mark suite is Phase 1+2's domain and remains GREEN.
- `.planning/codebase/ARCHITECTURE.md` — thin view → service module → ORM. Phase 3 is the thin-view layer; service module is Phase 2.
- `.planning/codebase/CONCERNS.md` — "do not invent test harnesses without asking" — Phase 3 reuses the existing pytest+factory_boy harness; no new harness.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`load_precedence_graph(...)` and `propagate_move(...)`** (Phase 1+2 deep module) — the entire algorithmic contract. Phase 3's job is plumbing.
- **`BaseAPIView`** (`views/base.py:149`) — provides `BaseSessionAuthentication`, `IsAuthenticated`, generic `handle_exception` for unhandled DB errors. `TimelinePropagationView` extends it with no overrides.
- **`Issue.issue_objects`** manager (`db/models/issue.py:170`) — already filters `deleted_at__isnull=True`. Saves us a clause; we still add `archived_at__isnull=True, is_draft=False` (D-10).
- **`ROLE` enum** (`permissions/base.py:13-16`) — Phase 3 reads `ROLE.ADMIN.value` and `ROLE.MEMBER.value` for the inline membership filter (D-02).
- **`issue_activity.delay` and `model_activity.delay`** (`bgtasks/issue_activities_task.py`, `bgtasks/webhook_task.py`) — existing audit + webhook fan-out tasks. Phase 3 invokes them inside `transaction.on_commit(...)` (new pattern in this codebase; lock here).
- **`session_client` fixture** (`tests/conftest.py:67-71`) — Phase 3 uses this for every contract test.
- **`ProjectFactory`, `WorkspaceFactory`, `WorkspaceMemberFactory`, `ProjectMemberFactory`** (`tests/factories.py`) — Phase 3 extends with `IssueFactory` and `IssueRelationFactory`.

### Established Patterns

- **One file per top-level domain in `views/issue/`** — `archive.py`, `attachment.py`, `comment.py`, `link.py`, `relation.py`, etc. Phase 3 follows: new file `views/issue/timeline_propagation.py`.
- **`@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` decorator** is the standard idiom (`views/issue/base.py:1113`). Phase 3 deliberately deviates (D-02) because the decorator's `{"error": "..."}` body is incompatible with the wire contract; this is the only ce/core view in the milestone that won't use the decorator. Document in module docstring.
- **`Issue.objects.bulk_update(instances, fields)`** is the established pattern for date updates (`views/issue/base.py:1168`, `views/issue/archive.py:341`). Phase 3 follows but adds `updated_at` to the field list (existing endpoints don't, which is a latent inconsistency — see D-05f).
- **Activity & webhook fan-out via `.delay()` immediately** — existing code does NOT use `transaction.on_commit`. Phase 3 introduces the pattern. Verifiable: `grep -rn "transaction.on_commit" apps/api/plane/app/views/` returns no hits today.
- **Per-pair `issue_activity.delay` for date changes** — start_date and target_date logged separately when both move (`views/issue/base.py:1142-1166`). Phase 3 mirrors this loop shape.
- **Contract test layout** — `apps/api/plane/tests/contract/app/test_*.py` with `@pytest.mark.contract`, `@pytest.mark.django_db`, and `session_client`. New file: `test_timeline_propagation.py`.
- **Inline `Issue.objects.create(...)` in unit tests** (Phase 1's `test_graph.py`) is acceptable but ad-hoc. Phase 3 raises the bar by adding factory_boy factories — the contract suite will need many more issues per test than Phase 1 did.

### Integration Points

- **Phase 2's algorithm** is consumed via the `__init__.py` barrel only (D-12). Phase 3 never imports from `scheduling.py` or `propagation.py` directly. ADR 0002's swap remains a Phase 2 internal concern.
- **Phase 4's `@plane/services/issue/timeline-propagation.service.ts`** consumes:
  - URL: `POST /api/v1/workspaces/{slug}/projects/{projectId}/timeline-propagation/`
  - Request body: `{ work_item_id, original_start_date, original_target_date, expected_updated_at, requested_start_date, requested_target_date, operation: "move", client_preview_count? }`
  - Success body: `{ requested_work_item_id, total_updated_count, client_preview_count: number | null, work_items: [...] }`
  - Failure body (4xx): `{ code: "<one of 7>", message: "<English>" }`
  - HTTP status semantics: 200 / 400 (DRF parser) / 403 (permission) / 409 (stale) / 422 (domain) / 500 (DB error fallthrough).
- **Phase 5's drag handler** depends on Phase 4's service shape, transitively pinned by this CONTEXT.md.
- **Existing `IssueBulkUpdateDateEndpoint`** is left untouched. Phase 3 adds a regression contract test (`test_existing_bulk_update_endpoint_unchanged`) to enforce API-11.

</code_context>

<specifics>
## Specific Ideas

- The deep-module-first discipline mandates that **the algorithm is the truth**. Phase 3's view is dumb plumbing: parse → permission → load → propagate → persist → respond. Plan-phase should write the view as ~120 lines including imports and resist any temptation to "validate before calling the algorithm" — the only validation outside `propagate_move` is structural (DRF serializer) and authn/authz.
- **First minimum task** (anchor for plan-phase): scaffold `views/issue/timeline_propagation.py` with the empty `TimelinePropagationView(BaseAPIView)` class returning a fake 401, register the URL in `urls/issue.py`, export from `views/__init__.py`, and add `apps/api/plane/tests/contract/app/test_timeline_propagation.py::test_unauthenticated_request_returns_401`. This locks routing without exercising the algorithm. Then grow into D-02 / D-05 / D-09 in subsequent plans.
- The 6 PRD-pinned contract test cases (TEST-10, TEST-13, TEST-15, TEST-16, TEST-17, TEST-18) are the **acceptance contract** for this phase. Plan-phase should map each TEST-NN to a single test function and a single graph fixture. A shared helper `_assert_no_db_writes(work_item_ids)` (snapshot pre/post `updated_at` per id) implements TEST-15 + TEST-17 cleanly.
- **The activity-task on_commit regression** (D-09) is testable with `pytest-mock`: `mocker.patch("plane.bgtasks.issue_activities_task.issue_activity.delay")` and `mocker.patch("plane.bgtasks.webhook_task.model_activity.delay")`, then run a flow that fails post-`bulk_update` (e.g., monkeypatch `Issue.objects.bulk_update` to raise `IntegrityError`) and assert neither mock was called. Captures the regression risk explicitly.
- **The HTTP status code mapping (D-03) is testable as a parameterized matrix**: one `@pytest.mark.parametrize("error_code,expected_status", [...])` decorating a single `test_status_code_per_error_code` would compress 6 tests into one but also makes test names less actionable. Recommendation: keep one test per code (clearer failure messages, easier to skim test output) — already in D-14's list. Don't over-parametrize the contract.
- **The serializer's `expected_updated_at` field formatting** is implicit from DRF: `DateTimeField` uses `DATETIME_FORMAT` which defaults to ISO 8601 with microseconds (e.g., `2026-05-04T12:34:56.789012Z`). The frontend (`@plane/services` Phase 4) will receive `updated_at` in this same format from the success payload and echo it back on the next drag. **No custom format=** kwarg.
- **Where the `now` value goes in `bulk_update`**: `instance.updated_at = now; Issue.objects.bulk_update([instance, ...], ["start_date", "target_date", "updated_at"])`. After `bulk_update`, the in-memory instance's `updated_at` is the value we just set. We then return `now.isoformat()` in the response payload — no second SELECT. Asserted by `test_success_payload_uses_single_now_for_updated_at`.

</specifics>

<deferred>
## Deferred Ideas

- **Retroactively fixing `IssueBulkUpdateDateEndpoint` to use `transaction.on_commit`** for its activity tasks — it currently fires `.delay(...)` synchronously before `bulk_update`, which can leak audit events when the bulk update fails. Out of Phase 3 scope (API-11 says "leave it alone"). File a follow-up task for the milestone backlog: "audit-side cleanup: move `issue_activity.delay` calls under `transaction.on_commit` across all date-write endpoints."
- **Workspace-admin-without-project-member fallback** for the propagation endpoint — D-02b deliberately omits it. Defer until a product signal asks for it; if added, it is backwards-compatible.
- **Cycle path / project-boundary edge in the failure envelope** — Phase 2's `PropagationFailure` carries diagnostic data (cycle path UUIDs, offending edge ids) that we currently discard. Defer to a `metadata: { cycle?: [...], boundary_edge?: [...] }` extension in Phase 4-5 if ERR-01 / ERR-02 want richer UI. Wire contract change is additive (downstream clients ignoring `metadata` keep working).
- **`select_for_update(skip_locked=True)`** — chose blocking lock; revisit only if a concurrent-drag scenario produces user-visible UX problems.
- **`drf-spectacular` schema annotation on the new view** — out of scope for Phase 3 unless `ENABLE_DRF_SPECTACULAR=1` is part of the contract suite. The serializers exist, so the schema generation will pick them up automatically when enabled.
- **Coverage gate** — Phase 3's contract test additions feed into the existing `--coverage --fail-under=90` gate. We don't add a per-package higher gate; existing 90% suffices.
- **Optimistic concurrency via a dedicated `version` integer column on `Issue`** — explicitly OUT of scope per ROADMAP. Stale check is `updated_at`-only.
- **Audit logging the propagation outcome itself** (e.g., a `PropagationLog` row capturing the request body + response) — would require a new model + migration. Defer until ops needs forensic trace beyond the per-issue `IssueActivity` rows.

</deferred>

---

*Phase: 03-Propagation API Endpoint, Persistence & Contract*
*Context gathered: 2026-05-04*
