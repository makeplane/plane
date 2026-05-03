# Phase 3: Propagation API Endpoint, Persistence & Contract - Research

**Researched:** 2026-05-04
**Domain:** Django 4.2 DRF endpoint, PostgreSQL transactional persistence, Celery task fan-out, pytest contract testing
**Confidence:** HIGH (every load-bearing claim is verified against the codebase or Django's official 4.2 docs)

## Summary

Phase 3 is **plumbing**. The deep module (`propagate_move`) and the graph loader (`load_precedence_graph`) are already shipped, tested, and locked (Phases 1+2 → 64 GREEN unit tests, package coverage 98%). Phase 3's job is to wrap them in a single DRF view that owns: (a) DRF serializer parsing, (b) inline `ProjectMember` permission check, (c) `transaction.atomic()` boundary with `select_for_update()` on the dragged row, (d) `Issue.objects.bulk_update(..., ["start_date", "target_date", "updated_at"])` with explicit `now = timezone.now()` set on every instance, (e) post-commit registration of `issue_activity.delay(...)` and `model_activity.delay(...)` via `transaction.on_commit(lambda: ...)`, and (f) the stable `{code, message}` failure envelope mapped to deterministic HTTP status codes (403/409/422 for the 7 domain codes, 400 for DRF parser errors).

Two findings deserve emphasis up front. **First**, `transaction.on_commit` has zero prior usage anywhere in `apps/api/plane` — Phase 3 is genuinely the first occurrence in this codebase. The CONTEXT.md D-09 claim is correct. **Second**, `Issue.issue_objects` (the model manager at `db/models/issue.py:92-101`) already excludes `archived_at__isnull=False`, `is_draft=True`, AND `state__group=StateGroup.TRIAGE.value` from the queryset by default. The CONTEXT.md D-10 explicit `archived_at__isnull=True, is_draft=False` filter is therefore **redundant but harmless** — and the planner should know it's defensive (belt-and-suspenders), not mandatory.

**Primary recommendation:** Build the view as one ~120-line module with a single `post(self, request, slug, project_id)` method. Delegate every domain decision to `propagate_move`. Set `now = timezone.now()` once at the top, reuse it for every instance's `updated_at` AND for the response payload (no SELECT-after-write). Register Celery `.delay()` calls inside `transaction.on_commit(...)` lambdas — that pattern is new for this codebase and is Phase 3's most leverage-y architectural improvement over `IssueBulkUpdateDateEndpoint`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| URL routing (path → view) | Django URLconf (`urls/issue.py`) | — | Same module owns IssueRelation, IssueBulkUpdateDateEndpoint, and IssueVersionEndpoint — narrative cohesion. |
| Request parsing & structural validation | DRF Serializer (`TimelinePropagationRequestSerializer`) | — | DRF's `serializer.is_valid(raise_exception=True)` returns 400 with DRF default body before the view body runs. Domain validation stays in `propagate_move`. |
| Authentication | `BaseSessionAuthentication` (inherited via `BaseAPIView`) | — | Existing convention; default `IsAuthenticated` permission class returns 401 for anonymous. |
| Authorization (project membership, role gating) | View body — inline `ProjectMember.objects.filter(...).exists()` | — | The shared `@allow_permission(...)` decorator returns `Response({"error": "..."}, ...)` which is incompatible with our `{code, message}` envelope (CONTEXT.md D-02 locks this). |
| Transaction boundary | View body — `with transaction.atomic():` | — | All-or-nothing persistence (API-08, TEST-15, TEST-17) — Django rolls back automatically on any exception inside the block. |
| Row locking (race-safe stale check) | View body — `select_for_update()` on dragged Issue | — | Phase 2 D-08 limits the stale check to the dragged item only; locking that one row is sufficient. PostgreSQL READ COMMITTED + row lock = race-safe. |
| Graph loading | Service module — `load_precedence_graph(...)` from Phase 1 | View body builds the queryset | Loader is pure; queryset construction (filter, annotate, select_related) is a view concern (Phase 1 D-01). |
| Schedule decision | Service module — `propagate_move(...)` from Phase 2 | — | Deep module is the truth. View NEVER duplicates a domain check. |
| Persistence | View body — `Issue.objects.bulk_update(instances, ["start_date", "target_date", "updated_at"])` | — | Single SQL UPDATE, atomic by construction, bypasses model `save()` and signals. |
| Audit trail (per-issue `issue_activity.delay`) | Celery task | View body registers via `transaction.on_commit(...)` | Audit must fire ONLY on commit; existing endpoints fire pre-commit (latent bug — see Pitfall 7). |
| Webhook fan-out (`model_activity.delay`) | Celery task | View body registers via `transaction.on_commit(...)` | Same as audit — webhook firing on rolled-back transactions corrupts downstream consumers. |
| Wire-format envelope (success / failure JSON) | View body — DRF `Response(data, status=...)` | DRF Serializers (`Response/Error` for OpenAPI schema only) | The error envelope dict is built directly via a private `_error(...)` helper; the `TimelinePropagationErrorSerializer` exists for `drf-spectacular` schema generation only. |
| Test layout | `apps/api/plane/tests/contract/app/test_timeline_propagation.py` (`@pytest.mark.contract`) | `apps/api/plane/tests/factories.py` (new `IssueFactory`, `IssueRelationFactory`) | Mirrors `test_project_app.py` precedent. Factories are reusable across suites. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Django | 4.2.30 | Web framework, ORM, transactions | [VERIFIED: apps/api/requirements/base.txt:4] Plane's pinned version. LTS-class release. |
| djangorestframework | 3.15.2 | View base (`APIView`), `Response`, serializers, authentication | [VERIFIED: apps/api/requirements/base.txt:6] Plane's pinned version. |
| Python | 3.12.10 | Language runtime | [VERIFIED: STACK.md] Allows `StrEnum` (already used in Phase 2 errors.py). |
| PostgreSQL | 15 (via docker-compose-local.yml) | Default DB; READ COMMITTED isolation | [VERIFIED: docker-compose-local.yml + Django default settings — no `OPTIONS={"isolation_level": ...}` override exists in `apps/api/plane/settings/`]. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pytest | 9.0.3 | Test runner | [VERIFIED: apps/api/requirements/test.txt:3] |
| pytest-django | 4.5.2 | `@pytest.mark.django_db`, fixtures | [VERIFIED: apps/api/requirements/test.txt:4] |
| pytest-mock | 3.11.1 | `mocker.patch` for `.delay()` mocking — needed for "tasks fire only on_commit" regression test | [VERIFIED: apps/api/requirements/test.txt:7] |
| factory-boy | 3.3.0 | `IssueFactory` / `IssueRelationFactory` (new in Phase 3) | [VERIFIED: apps/api/requirements/test.txt:8] |
| Celery | (existing) | `issue_activity.delay`, `model_activity.delay` | Existing tasks; Phase 3 invokes them only inside `transaction.on_commit(...)` lambdas. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline `ProjectMember` filter (D-02) | Wrapping the decorator and overriding the response shape | Decorator change would break dozens of existing endpoints. Inline check is local + reversible. |
| `transaction.on_commit` for tasks (D-09) | Synchronous `.delay(...)` before bulk_update | The existing endpoints do the latter; doing it correctly here sets the new pattern. Reverting would replicate a latent audit-leak bug. |
| `select_for_update()` (D-05) | Optimistic version column | PRD/ROADMAP explicitly out-of-scope (no new migration in Phase 3). Row lock + `updated_at` reuse is sufficient. |
| 422 for `INVALID_DATE_RANGE` (D-03) | 400 | 400 is DRF parser default; 422 keeps all 5 domain failures uniform and lets the `{code, message}` envelope ship on every domain failure. |

**Installation:** No new packages — every dependency Phase 3 needs is already in `apps/api/requirements/{base,test}.txt`. [VERIFIED: grep of requirements files; pytest-mock already present at version 3.11.1.]

**Version verification:** Versions above were read directly from `apps/api/requirements/base.txt` and `apps/api/requirements/test.txt` in the current branch. No `npm view` equivalent needed for Python deps; the requirements files are the lockfile.

## Architecture Patterns

### System Architecture Diagram

```
[HTTP POST /api/v1/workspaces/<slug>/projects/<uuid:project_id>/timeline-propagation/]
        |
        v
[BaseAPIView dispatch]
        |
        +-- BaseSessionAuthentication (401 if anonymous)
        |
        +-- IsAuthenticated (401 if anonymous)
        |
        v
[TimelinePropagationView.post(request, slug, project_id)]
        |
        +-- now = timezone.now()                                  # captured ONCE (D-05a)
        |
        +-- TimelinePropagationRequestSerializer(data=request.data)
        |       |
        |       +-- structural validation only (D-04)
        |       +-- on failure: DRF 400 + DRF default body (NOT envelope) -> EXIT
        |
        +-- ProjectMember.objects.filter(role__in=[ADMIN, MEMBER], is_active=True).exists()
        |       |
        |       +-- false: _error(PERMISSION_DENIED, 403) -> EXIT  (D-02)
        |
        v
[with transaction.atomic():]                                       # D-05
        |
        +-- Issue.issue_objects.select_for_update().get(id=..., slug=..., project_id=...)
        |       |
        |       +-- DoesNotExist: _error(PERMISSION_DENIED, 403) -> EXIT  (D-05c, info-leak prevention)
        |
        +-- IssueRelation.objects.filter(project_id=..., deleted_at__isnull=True)
        |       .annotate(issue_project_id=F("issue__project_id"),
        |                 related_project_id=F("related_issue__project_id"))
        |       .select_related("issue", "related_issue")          # D-11
        |       |
        |       v
        |   load_precedence_graph(relations, project_id=...)       # Phase 1 entry point
        |       |
        |       v
        |   LoadResult { adjacency, cycle }
        |
        +-- Issue.issue_objects.filter(workspace__slug=..., project_id=...,
        |       archived_at__isnull=True, is_draft=False).only(...)
        |       (filters are belt-and-suspenders — IssueManager already excludes them)
        |       |
        |       v
        |   work_items_by_id: dict[UUID, ScheduledWorkItem]
        |
        +-- MoveIntent(...) from validated request data
        |
        +-- expected_versions = {move_intent.work_item_id: validated["expected_updated_at"]}
        |
        v
    propagate_move(graph, work_items_by_id, move_intent, expected_versions)  # Phase 2 entry
        |
        +-- result.failure is not None?
        |       |
        |       +-- yes: _error(failure.code, failure.message, status=STATUS_BY_CODE[code])
        |       |        return -- transaction is rolled back automatically (no writes occurred)
        |       |        (D-03 status mapping: PERMISSION_DENIED=403, SCHEDULE_CHANGED=409, others=422)
        |       |
        +-- result.failure is None?
                |
                +-- assemble [Issue(id=u.id, start_date=u.start_date, target_date=u.target_date,
                |                   updated_at=now) for u in result.updates]
                |
                +-- Issue.objects.bulk_update(instances, ["start_date", "target_date", "updated_at"])
                |
                +-- transaction.on_commit(lambda: issue_activity.delay(...))  # per updated issue, per moved field
                |
                +-- transaction.on_commit(lambda: model_activity.delay(...))  # per updated issue
                |
                +-- return Response({
                        "requested_work_item_id": ...,
                        "total_updated_count": len(result.updates),
                        "client_preview_count": validated.get("client_preview_count"),
                        "work_items": [{id, start_date, target_date, updated_at=now.isoformat()}, ...],
                    }, status=200)
[end with: Django commits transaction; on_commit callbacks fire]
```

### Recommended Project Structure

```
apps/api/plane/app/
├── views/issue/
│   ├── timeline_propagation.py           # NEW — TimelinePropagationView(BaseAPIView)
│   └── base.py                           # READ-ONLY (line 1093-1170 IssueBulkUpdateDateEndpoint = analog)
├── serializers/
│   └── timeline_propagation.py           # NEW — Request/Response/Error serializers
├── urls/
│   └── issue.py                          # UPDATE — add path between issue-dates and issue-versions
├── views/__init__.py                     # UPDATE — re-export TimelinePropagationView
└── services/timeline_propagation/        # READ-ONLY (Phase 1+2 shipped)
    ├── __init__.py                       #   public surface — Phase 3 imports from here only (D-12)
    ├── errors.py                         #   PropagationErrorCode StrEnum (the 7 wire codes)
    ├── propagation.py                    #   propagate_move(...)
    ├── graph.py                          #   load_precedence_graph(...)
    └── types.py                          #   ScheduledWorkItem, MoveIntent, etc.

apps/api/plane/tests/
├── contract/app/
│   └── test_timeline_propagation.py      # NEW — @pytest.mark.contract suite
└── factories.py                          # UPDATE — add IssueFactory, IssueRelationFactory
```

### Pattern 1: Inline membership check (replaces decorator)

**What:** Mirror `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` as an inline filter so the failure response can use the `{code, message}` envelope.

**When to use:** Any view that needs role-based authorization AND a custom error response shape.

**Example:**
```python
# Source: apps/api/plane/app/permissions/base.py:53-59 (mirrored from existing decorator)
from plane.db.models import ProjectMember
from plane.app.permissions.base import ROLE

is_member = ProjectMember.objects.filter(
    member=request.user,
    workspace__slug=slug,
    project_id=project_id,
    role__in=[ROLE.ADMIN.value, ROLE.MEMBER.value],
    is_active=True,
).exists()
if not is_member:
    return _error(PropagationErrorCode.PERMISSION_DENIED,
                  "You don't have the required permissions.",
                  status=403)
```

**Confidence:** HIGH [VERIFIED: codebase grep matches the decorator's exact filter shape]

### Pattern 2: `transaction.on_commit` for side-effect fan-out

**What:** Register Celery `.delay(...)` calls so they fire only on successful commit; on rollback the registration is silently discarded.

**When to use:** Any side effect that must NOT fire if the DB write fails (audit logs, webhook events, email notifications).

**Example:**
```python
# Source: https://docs.djangoproject.com/en/4.2/topics/db/transactions/#performing-actions-after-commit [CITED]
# (No prior usage in apps/api/plane — Phase 3 is the first.)
from django.db import transaction

with transaction.atomic():
    Issue.objects.bulk_update(instances, ["start_date", "target_date", "updated_at"])

    for instance in instances:
        # Capture loop var by default arg to avoid late-binding (Pitfall 4 below).
        transaction.on_commit(
            lambda inst=instance, pre=pre_update_snapshot[inst.id]:
                issue_activity.delay(
                    type="issue.activity.updated",
                    requested_data=json.dumps(
                        {"start_date": str(inst.start_date), "target_date": str(inst.target_date)},
                        cls=DjangoJSONEncoder,
                    ),
                    current_instance=json.dumps(
                        {"start_date": str(pre.start_date), "target_date": str(pre.target_date)},
                        cls=DjangoJSONEncoder,
                    ),
                    issue_id=str(inst.id),
                    actor_id=str(request.user.id),
                    project_id=str(project_id),
                    epoch=int(now.timestamp()),
                )
        )
```

**Confidence:** HIGH [VERIFIED: Django 4.2 docs explicitly state callbacks "are discarded, and never called" on rollback; CITED text quoted in Pitfall 5 below]

### Pattern 3: `select_for_update()` race-safe stale check

**What:** Acquire a row-level `FOR UPDATE` lock on the dragged Issue inside the `atomic()` block; PostgreSQL holds the lock until commit/rollback.

**When to use:** Optimistic-concurrency guards where you need a freshly-read value (here `updated_at`) inside a transactional read-modify-write.

**Example:**
```python
# Source: https://docs.djangoproject.com/en/4.2/ref/models/querysets/#select-for-update [CITED]
with transaction.atomic():
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
        return _error(PropagationErrorCode.PERMISSION_DENIED,
                      "You don't have the required permissions.",
                      status=403)
    # ... use dragged.updated_at as the freshly-locked value for the algorithm's
    # expected_versions check (Phase 2 D-08).
```

Note: PostgreSQL READ COMMITTED + a row-level `FOR UPDATE` lock is sufficient — concurrent writers either commit before our lock acquires (we read fresh data) or wait until we release (they see our updates). [VERIFIED: PostgreSQL docs on row-level lock modes; default Django isolation level when settings have no `OPTIONS={"isolation_level": ...}` override; confirmed via grep in `apps/api/plane/settings/` — no override exists.]

**Confidence:** HIGH [VERIFIED]

### Pattern 4: Bulk update with explicit `updated_at`

**What:** Set `updated_at` explicitly on every instance before `bulk_update`, and include it in the field list — `auto_now=True` does NOT fire under `bulk_update`.

**When to use:** Any time you call `Model.objects.bulk_update(...)` on a model with `auto_now` fields and you want the timestamp to advance.

**Example:**
```python
# Source: Django 4.2 docs on bulk_update + how auto_now is implemented [CITED below]
from django.utils import timezone

now = timezone.now()
instances = []
for upd in result.updates:
    inst = Issue(id=upd.id)             # construct in-memory; we never SELECT these rows
    inst.start_date = upd.start_date
    inst.target_date = upd.target_date
    inst.updated_at = now                # MUST set explicitly — auto_now bypassed by bulk_update
    instances.append(inst)

Issue.objects.bulk_update(instances, ["start_date", "target_date", "updated_at"])
```

**Confidence:** HIGH [VERIFIED: Django docs on `pre_save()` mechanism + bulk_update bypasses `save()`; the existing IssueBulkUpdateDateEndpoint at `views/issue/base.py:1168` does NOT include `updated_at` in the field list — this is a latent inconsistency we don't propagate (see Pitfall 6).]

### Anti-Patterns to Avoid

- **Calling `.delay(...)` synchronously inside the atomic block.** If the bulk_update raises after the delay, the audit row is enqueued but the data write is rolled back → orphan audit entries. Always wrap in `transaction.on_commit(lambda: task.delay(...))`. The existing `IssueBulkUpdateDateEndpoint` (line 1142+) does this; Phase 3 explicitly does NOT replicate it.
- **Reading `dragged.updated_at` BEFORE the `select_for_update()`.** A read outside the lock could see a stale value, then the lock acquires, and another writer's commit slips between. The dragged row read MUST be the locked read.
- **Returning `Response({"error": "..."})` for the 7 domain codes.** Breaks the wire contract (API-05 / ERR-06). Use the `{code, message}` envelope via `_error(...)` for every domain failure.
- **Including `INVALID_DATE_RANGE` validation in the serializer's `validate()`.** The serializer would return DRF 400 default body — the algorithm's `INVALID_DATE_RANGE` envelope would never fire (D-04). Keep duration/date-range checks inside `propagate_move`.
- **Calling `Issue.objects.bulk_update(...)` without `updated_at` in the field list.** Stale `updated_at` breaks Phase 4's stale-check loop. Always include the field.
- **Building per-test `IssueRelation` rows with the wrong direction.** Per Phase 1 D-04, only `relation_type="blocked_by"` participates in the precedence graph. The factory default (`relation_type="blocked_by"`) is correct; tests that override to `relates_to` etc. should expect those rows to be ignored by the loader (TEST-relates_to-dropped from Phase 1's suite is the existing pin).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Optimistic concurrency / stale-check | A custom `version` column or hand-rolled mid-request re-read | Phase 2's `expected_versions` parameter + `select_for_update()` on the dragged Issue + Phase 2 D-08 dragged-only check | Already shipped, already tested. Adding a `version` column means a migration AND a model field bump that ROADMAP explicitly excludes. |
| HTTP status code mapping table | A bespoke `if/elif` ladder per error code | A module-level constant dict `STATUS_BY_CODE: Mapping[PropagationErrorCode, int]` and a single lookup | One source of truth, one assertion target in tests, easy to extend. |
| Cycle path / propagation-limit / cross-project edge detection | Repeating the algorithm at the view layer | `propagate_move(...)` already returns the right typed `PropagationFailure` | Phase 2 D-06 owns the validation order. Duplicating here violates deep-module discipline. |
| JSON serialization of `date` / `datetime` for `requested_data` / `current_instance` | `str(date_value)` ad-hoc | `json.dumps(payload, cls=DjangoJSONEncoder)` (existing pattern at `views/issue/base.py:1144`) | Handles timezone-aware `datetime`, `Decimal`, `UUID` correctly. |
| Permission decorator override for the `{code, message}` envelope | Forking `allow_permission` | Inline `ProjectMember.objects.filter(...).exists()` (D-02) | Decorator is shared across 50+ endpoints; forking it is high-blast-radius. Inline filter is 5 lines, local, reversible. |
| Looking up the URL via `reverse("project-timeline-propagation")` in tests | Hardcoded `f"/api/v1/workspaces/{slug}/projects/{project_id}/timeline-propagation/"` paths | `reverse(...)` (note: the URL name appears once in `urls/issue.py` and is unique unlike the duplicate `project-issue` names) | The duplicate-name caveat from `test_project_app.py` (line 22-44) does NOT apply here — `project-timeline-propagation` is a unique URL name. |
| Test fixtures for Issue + IssueRelation | Inline `Issue.objects.create(...)` per test (Phase 1's pattern) | `IssueFactory` + `IssueRelationFactory` (D-14) | Contract suite has many graph shapes (chain, split, merge, cross-project, cycle). Factories let tests describe the graph in three lines. |

**Key insight:** Phase 3 is the thinnest possible wrapper around the deep module. The pull toward "let me also validate X at the view layer" is exactly what creates duplicate failure surfaces and bypasses the wire contract — every domain check belongs in `propagate_move`.

## Runtime State Inventory

> Not applicable — Phase 3 is greenfield code (a new endpoint, new serializer, new tests, two new factories). No rename / refactor / migration / data backfill is in scope. The new code does not change any existing data shape, environment variable name, OS-registered task, or build artifact.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — verified by reading CONTEXT.md "Out of scope" (no `version` column, no new model fields, no migration). | None |
| Live service config | None — no n8n / Datadog / Tailscale references in this milestone. | None |
| OS-registered state | None — no Task Scheduler / launchd / systemd / pm2 changes. | None |
| Secrets / env vars | None — endpoint reuses existing session auth and project permission. No new env var. | None |
| Build artifacts | None — pure source addition. The Django app does not produce egg-info / dist artifacts in this milestone. | None |

## Common Pitfalls

### Pitfall 1: `bulk_update` does NOT trigger `auto_now=True`

**What goes wrong:** You call `Issue.objects.bulk_update(instances, ["start_date", "target_date"])` and assume `updated_at` advances because the field has `auto_now=True`. It doesn't. The `updated_at` column stays at whatever value the row had before the UPDATE, and the next stale-check from the frontend fails because the client-cached `updated_at` matches the server's unchanged value, but the dates have moved.

**Why it happens:** `auto_now=True` is implemented inside `DateTimeField.pre_save()`. `pre_save()` runs from `Model.save()`. `bulk_update` does NOT call `save()` per instance — it generates a single SQL UPDATE statement, which means no `save()`, no `pre_save()`, no signals. [CITED: Django docs — "If you do override this method, you must return the value of the attribute at the end. ... Django's DateTimeField uses this method to set the attribute correctly in the case of auto_now or auto_now_add."]

**How to avoid:** Set `instance.updated_at = now` explicitly on each instance AND include `"updated_at"` in the `fields` list passed to `bulk_update`. Capture `now = timezone.now()` once at the top of the request (D-05a), reuse it for every instance, and return `now.isoformat()` in the response payload — no SELECT-after-write is needed.

**Warning signs:** Test like `test_success_payload_uses_single_now_for_updated_at` (D-14) explicitly asserts that all returned `updated_at` values are equal across the array. If `auto_now` were firing per-row at SQL time, values would differ by µs.

### Pitfall 2: `transaction.on_commit` callbacks are discarded on rollback — but they ARE called if `atomic()` is not active

**What goes wrong (variant A — happy path with rollback):** You call `transaction.on_commit(lambda: issue_activity.delay(...))` inside an `atomic()` block, then the bulk_update raises an `IntegrityError`. Django rolls back, the callback is silently discarded, `issue_activity` is never enqueued — correct behavior. ✓

**What goes wrong (variant B — autocommit fall-through):** You call `transaction.on_commit(...)` from a code path that is NOT inside `atomic()`. Django executes the callback immediately and synchronously. [CITED: Django 4.2 docs — "If you call on_commit() while there isn't an open transaction, the callback will be executed immediately."] In our test environment, `pytest.mark.django_db` wraps each test in a transaction by default — but with `transactional_db=True` it does not. A regression test that uses the wrong fixture flag silently passes "callbacks fired" assertions even though in production they wouldn't have.

**Why it happens:** `on_commit` is a hook on the connection's transaction state, not a magic decorator. If autocommit is on (no `atomic()` open), there's nothing to wait for.

**How to avoid:**
1. Always wrap the entire happy-path persistence in `with transaction.atomic():` — the test for "callbacks discarded on rollback" relies on the atomic block being open at registration time.
2. For the regression test (D-14 `test_activity_tasks_only_fire_on_commit`), use `pytest-django`'s [`captureOnCommitCallbacks`](https://docs.djangoproject.com/en/4.2/topics/testing/tools/#django.test.TestCase.captureOnCommitCallbacks) helper or `mocker.patch` the `.delay` directly and inspect call counts. Inside `pytest.mark.django_db` (not `transactional_db`), test transactions are rolled back, and on_commit callbacks are NEVER called. [CITED: Django 4.2 docs — "Django's TestCase class wraps each test in a transaction and rolls back that transaction after each test ... your on_commit() callbacks will never be run."]
3. If the test needs to verify that callbacks ARE called on success, use `TestCase.captureOnCommitCallbacks(execute=True)` or run with `transactional_db=True`. Document the choice in the test file.

**Warning signs:** A "tasks only fire on_commit" test that passes regardless of the test's transactional behavior is a false positive.

### Pitfall 3: `Issue.issue_objects` already filters archive/draft/triage — explicit filters are redundant

**What goes wrong:** CONTEXT.md D-10 prescribes `Issue.issue_objects.filter(..., archived_at__isnull=True, is_draft=False)`. This is harmless but **double-filters**: `IssueManager.get_queryset()` (`apps/api/plane/db/models/issue.py:92-101`) already does:

```python
def get_queryset(self):
    return (
        super().get_queryset()
        .exclude(state__group=StateGroup.TRIAGE.value)
        .exclude(archived_at__isnull=False)
        .exclude(project__archived_at__isnull=False)
        .exclude(is_draft=True)
    )
```

So the explicit filter clause adds no rows-filtered effect, only a redundant SQL clause.

**Why it happens:** Phase 1 D-05 documented the assumption that the caller filters these — and the explicit filter is the cleanest expression of "I am respecting that contract." It's intent-documenting, not behavior-changing.

**How to avoid:** Two reasonable choices, **not** both:
1. **Keep the explicit filter** (CONTEXT.md D-10 default) — it documents the contract at the call site even if it's redundant. SQL planner will optimize away the duplicate clause. Recommended.
2. Drop the explicit filter and add a one-line comment `# Issue.issue_objects already excludes archived/draft/triage; see db/models/issue.py:92`. Saves SQL bytes. Slightly less readable.

The planner should pick one and stick with it. **Do not** mix (e.g., add `archived_at__isnull=True` but drop `is_draft=False`).

**Warning signs:** A test asserting "archived issues are not returned" passes whether the explicit filter is present or not — the manager catches it either way.

### Pitfall 4: Late-binding of loop variables in `transaction.on_commit` lambdas

**What goes wrong:**
```python
for instance in instances:
    transaction.on_commit(lambda: issue_activity.delay(issue_id=str(instance.id), ...))
```
Every callback fires with `instance` bound to the **last** instance from the loop, because Python lambdas close over the variable name, not the value at lambda creation. Ten updates → ten audit rows for the same (last) issue.

**Why it happens:** Standard Python closure semantics — same trap as `for fn in [lambda: i for i in range(3)]: print(fn())` printing `2 2 2`.

**How to avoid:** Capture per-iteration values via default arguments:
```python
for instance in instances:
    transaction.on_commit(
        lambda inst=instance, pre=pre_update_snapshot[instance.id]:
            issue_activity.delay(issue_id=str(inst.id), ..., current_instance=..., requested_data=...)
    )
```
Or use a helper function:
```python
def _enqueue_activity(inst, pre, ...):
    transaction.on_commit(lambda: issue_activity.delay(issue_id=str(inst.id), ...))
for instance in instances:
    _enqueue_activity(instance, pre_update_snapshot[instance.id], ...)
```

**Warning signs:** A regression test should construct >1 update and assert the audit task was called with each distinct issue_id. A test with only one update masks this bug entirely.

### Pitfall 5: `transaction.on_commit` callbacks fire BEFORE middleware response rendering

[CITED: Django 4.2 docs — "Note that only the execution of your view is enclosed in the transactions. Middleware runs outside of the transaction, and so does the rendering of template responses."]

**What goes wrong:** A test asserts the response status code is 200, then asserts `issue_activity.delay` was called. Order of events: view body completes → response object built → `with` block exits → transaction commits → `on_commit` callbacks fire → response is returned to client → middleware processes response → client receives response.

For most assertions this is fine. The trap is **assuming callbacks fire AFTER the client receives the response** (they don't — they fire after commit but before middleware/network). For an in-process test client, both happen in the same Python call stack.

**Why it matters here:** The contract suite asserts both response shape AND task-call counts. The order is irrelevant for our tests (we use the in-process Django test client), but if a future test introduces async response middleware, the assertion sequencing could change.

**How to avoid:** Document the order in the test file's module docstring. Avoid asserting "callback fired before response was returned" — assert independently.

### Pitfall 6: The existing `IssueBulkUpdateDateEndpoint` does NOT include `updated_at` in `bulk_update` field list

**What goes wrong:** `apps/api/plane/app/views/issue/base.py:1168` calls `Issue.objects.bulk_update(issues_to_update, ["start_date", "target_date"])`. There is no `"updated_at"` field, so dates change but `updated_at` stays stale — silent bug latent in production. Phase 4's frontend pulls `updated_at` for the stale-check; the stale value lets a subsequent drag race past the check.

**Why it happens:** The author probably assumed `auto_now=True` would handle it (Pitfall 1). It doesn't.

**How to avoid:** API-11 says "leave `IssueBulkUpdateDateEndpoint` alone for Phase 3." Do that. But add the regression test `test_existing_bulk_update_endpoint_unchanged` (D-14) to lock its current shape. Then file a backlog task: "audit: update IssueBulkUpdateDateEndpoint to set updated_at explicitly + register issue_activity.delay under on_commit."

**Warning signs:** Phase 4 frontend tests against the old endpoint observe stale `updated_at` values. Document this in the milestone backlog.

### Pitfall 7: Existing endpoints fire `.delay(...)` synchronously BEFORE bulk_update — Phase 3 must NOT replicate this

**What goes wrong:** `apps/api/plane/app/views/issue/base.py:1142-1166` enqueues `issue_activity.delay(...)` inside the per-update loop, BEFORE the final `bulk_update` runs. If `bulk_update` raises, the audit rows have already been queued (and Celery will likely succeed in inserting them) → orphan audit entries that describe a write that never happened.

**Why it happens:** When the existing code was written, `transaction.on_commit` was either not yet stable in the Django version in use or the author didn't think about rollback semantics.

**How to avoid:** Phase 3 wraps every `.delay(...)` in `transaction.on_commit(lambda: ...)`. The existing endpoint stays as-is per API-11 (out of scope). The contract test `test_activity_tasks_only_fire_on_commit` (D-14) pins the new pattern.

**Warning signs:** A Celery worker logs "issue.activity.updated for issue X" but the issue's row in the DB has unchanged dates → the bulk_update rolled back but the audit fired anyway.

### Pitfall 8: The DRF default exception handler can swallow `IntegrityError` and return a generic 400

**What goes wrong:** `BaseAPIView.handle_exception` (`apps/api/plane/app/views/base.py:167-204`) catches `IntegrityError` and returns `{"error": "The payload is not valid"}, status=400`. If a low-level DB error fires inside our `atomic()` block (e.g., a `bulk_update` SQL error), the response shape is the generic 400 envelope, NOT our `{code, message}` envelope.

**Why it matters:** This is intentional (D-13) — domain failures use the typed envelope; operational errors use the generic envelope. But test authors must be aware: an `IntegrityError` in a contract test does NOT show up as a `PropagationErrorCode` failure. It shows up as a 400 `{"error": "The payload is not valid"}`.

**How to avoid:** Document in `test_timeline_propagation.py`'s module docstring that the 7 typed codes are the only `{code, message}` envelopes; serializer 400s and DB-error 400s are NOT envelope-shaped. The status-mapping matrix in CONTEXT D-03 covers only the 7 codes plus DRF parser default.

### Pitfall 9: `pytest.mark.django_db` wraps tests in a transaction, so `on_commit` callbacks NEVER FIRE by default

**What goes wrong:** A naive contract test calls the view, asserts 200, then asserts `mocker.patch("plane.bgtasks.issue_activities_task.issue_activity.delay")` was called. It wasn't — because the test transaction never commits. False negative.

**Why it happens:** [CITED: Django docs — "no transaction is ever actually committed, thus your on_commit() callbacks will never be run."]

**How to avoid:**
- Use `pytest-django`'s `transactional_db=True` flag (or `TestCase.captureOnCommitCallbacks(execute=True)` if migrating to the unittest-style class).
- Or: set the tasks to fire via `from django.test import TestCase; with TestCase.captureOnCommitCallbacks(using=..., execute=True): ...`.
- Recommended for Phase 3: keep `@pytest.mark.django_db` (fast, no commit), and in the one test that needs to assert "callback registered for `delay`", use a **wrapper around `mocker.patch` on `transaction.on_commit`** rather than asserting the underlying `.delay`. That way the test asserts the registration without waiting for commit.

```python
# Source: pattern derived from Django 4.2 testing tools docs [CITED]
def test_activity_tasks_registered_on_commit(self, mocker, session_client, ...):
    on_commit_spy = mocker.patch("django.db.transaction.on_commit", side_effect=lambda fn: fn())
    delay_spy = mocker.patch(
        "plane.app.views.issue.timeline_propagation.issue_activity.delay"
    )
    response = session_client.post(url, valid_payload, format="json")
    assert response.status_code == 200
    assert on_commit_spy.call_count >= len(expected_updates)
    assert delay_spy.call_count >= len(expected_updates)
```

The `side_effect=lambda fn: fn()` makes the spy fire the registered lambda immediately, bypassing transaction-commit semantics. This is fine because the test isolation is already provided by `django_db`.

**Warning signs:** The test passes locally but `delay` is never called in production logs.

## Code Examples

Verified patterns from official sources and the existing codebase.

### Common Operation 1: Capture pre-update snapshot from `work_items_by_id`

```python
# Source: derived from Phase 2 D-04 ScheduledWorkItem contract +
# existing IssueBulkUpdateDateEndpoint pattern (apps/api/plane/app/views/issue/base.py:1144-1146)

# Before bulk_update, record what each instance USED to look like.
pre_update_snapshot: dict[UUID, ScheduledWorkItem] = {
    upd.id: work_items_by_id[upd.id]
    for upd in result.updates
}
```

### Common Operation 2: Per-pair audit logging (mirrors existing endpoint)

```python
# Source: apps/api/plane/app/views/issue/base.py:1141-1166 (mirrored shape;
# wrapped in transaction.on_commit per CONTEXT D-09)
import json
from django.core.serializers.json import DjangoJSONEncoder
from plane.bgtasks.issue_activities_task import issue_activity

epoch = int(now.timestamp())

for inst in instances:
    pre = pre_update_snapshot[inst.id]
    if inst.start_date != pre.start_date:
        transaction.on_commit(
            lambda inst=inst, pre=pre:
                issue_activity.delay(
                    type="issue.activity.updated",
                    requested_data=json.dumps(
                        {"start_date": str(inst.start_date)}, cls=DjangoJSONEncoder
                    ),
                    current_instance=json.dumps(
                        {"start_date": str(pre.start_date)}, cls=DjangoJSONEncoder
                    ),
                    issue_id=str(inst.id),
                    actor_id=str(request.user.id),
                    project_id=str(project_id),
                    epoch=epoch,
                )
        )
    if inst.target_date != pre.target_date:
        transaction.on_commit(
            lambda inst=inst, pre=pre:
                issue_activity.delay(
                    type="issue.activity.updated",
                    requested_data=json.dumps(
                        {"target_date": str(inst.target_date)}, cls=DjangoJSONEncoder
                    ),
                    current_instance=json.dumps(
                        {"target_date": str(pre.target_date)}, cls=DjangoJSONEncoder
                    ),
                    issue_id=str(inst.id),
                    actor_id=str(request.user.id),
                    project_id=str(project_id),
                    epoch=epoch,
                )
        )
```

### Common Operation 3: Webhook fan-out via `model_activity.delay`

```python
# Source: apps/api/plane/app/views/module/base.py:708-716 (existing pattern;
# wrapped in transaction.on_commit per CONTEXT D-09)
from plane.bgtasks.webhook_task import model_activity
from plane.utils.host import base_host

origin = base_host(request=request, is_app=True)

for inst in instances:
    pre = pre_update_snapshot[inst.id]
    transaction.on_commit(
        lambda inst=inst, pre=pre:
            model_activity.delay(
                model_name="issue",
                model_id=str(inst.id),
                requested_data=json.dumps(
                    {"start_date": str(inst.start_date), "target_date": str(inst.target_date)},
                    cls=DjangoJSONEncoder,
                ),
                current_instance=json.dumps(
                    {"start_date": str(pre.start_date), "target_date": str(pre.target_date)},
                    cls=DjangoJSONEncoder,
                ),
                actor_id=request.user.id,
                slug=slug,
                origin=origin,
            )
    )
```

### Common Operation 4: HTTP status mapping table (single source of truth)

```python
# Source: derived from CONTEXT.md D-03 + RFC 9110 / RFC 4918
from plane.app.services.timeline_propagation import PropagationErrorCode

STATUS_BY_CODE: dict[PropagationErrorCode, int] = {
    PropagationErrorCode.PERMISSION_DENIED: 403,           # RFC 9110 §15.5.4
    PropagationErrorCode.SCHEDULE_CHANGED: 409,            # RFC 9110 §15.5.10
    PropagationErrorCode.DEPENDENCY_CYCLE: 422,            # RFC 4918 (semantic)
    PropagationErrorCode.PROJECT_BOUNDARY_EXCEEDED: 422,
    PropagationErrorCode.INCOMPLETE_SCHEDULE: 422,
    PropagationErrorCode.PROPAGATION_LIMIT_EXCEEDED: 422,
    PropagationErrorCode.INVALID_DATE_RANGE: 422,
}
```

### Common Operation 5: `IssueFactory` and `IssueRelationFactory` skeleton

```python
# Source: derived from existing factories.py (UserFactory, ProjectFactory) pattern
import factory
from uuid import uuid4
from django.utils import timezone

from plane.db.models import Issue, IssueRelation, IssueRelationChoices, State

class StateFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = State
    id = factory.LazyFunction(uuid4)
    name = factory.Sequence(lambda n: f"State {n}")
    project = factory.SubFactory("plane.tests.factories.ProjectFactory")
    workspace = factory.SelfAttribute("project.workspace")
    group = "backlog"
    default = False

class IssueFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Issue

    id = factory.LazyFunction(uuid4)
    name = factory.Sequence(lambda n: f"Issue {n}")
    project = factory.SubFactory("plane.tests.factories.ProjectFactory")
    workspace = factory.SelfAttribute("project.workspace")
    state = factory.SubFactory(StateFactory,
                               project=factory.SelfAttribute("..project"))
    created_by = factory.SelfAttribute("project.created_by")
    updated_by = factory.SelfAttribute("project.updated_by")
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)

class IssueRelationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = IssueRelation

    id = factory.LazyFunction(uuid4)
    issue = factory.SubFactory(IssueFactory)
    related_issue = factory.SubFactory(IssueFactory,
                                       project=factory.SelfAttribute("..issue.project"))
    project = factory.SelfAttribute("issue.project")
    workspace = factory.SelfAttribute("issue.workspace")
    relation_type = IssueRelationChoices.BLOCKED_BY.value
    created_by = factory.SelfAttribute("issue.created_by")
    updated_by = factory.SelfAttribute("issue.updated_by")
```

[ASSUMED: the exact `State` requirement comes from `Issue.save()` at `apps/api/plane/db/models/issue.py:178-203` which falls back to the project's default state if `self.state is None`. A test can pass `state=None` and let `save()` resolve it, or pass an explicit `StateFactory`. Verified by reading the model `save()` method.]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Synchronous `task.delay(...)` inside transaction | `transaction.on_commit(lambda: task.delay(...))` | Django 1.9 introduced `on_commit`; Django 4.2 stable | Audit/webhook events fire ONLY on commit. Phase 3 introduces the pattern to this codebase. |
| `Issue.objects.bulk_update(items, ["start_date", "target_date"])` (existing endpoint) | `Issue.objects.bulk_update(items, ["start_date", "target_date", "updated_at"])` with explicit `now` | Phase 3 (this milestone) | `updated_at` advances correctly; frontend stale-check works. |
| `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` decorator | Inline `ProjectMember.objects.filter(...).exists()` inside view body (D-02) | Phase 3 (this milestone, scoped to this endpoint only) | Decorator's `Response({"error": ...})` body is incompatible with `{code, message}` envelope. |
| `Issue.objects` (raw queryset) | `Issue.issue_objects` (manager) | Already in use across the codebase | Manager auto-excludes archived/draft/triage. Phase 3 uses it; the explicit filter clauses in CONTEXT D-10 are belt-and-suspenders. |

**Deprecated/outdated:**
- **`apps/api/run_tests.sh`** — delegates to a missing `tests/run_tests.sh`. Do not use. Use `python run_tests.py` directly (or `pytest` directly with `DJANGO_SETTINGS_MODULE=plane.settings.test`).
- **422 in RFC 9110** — note that 422 (Unprocessable Content) is NOT defined in RFC 9110, only in RFC 4918 (WebDAV). DRF supports it (`status.HTTP_422_UNPROCESSABLE_ENTITY`) and it's industry-standard for "well-formed but semantically invalid" API requests, so the choice is fine — just don't claim "RFC 9110 mandates 422 for domain errors" in the implementation comments. CONTEXT.md D-03 lists "RFC 9110 §15.5.21" — that section number does not exist in RFC 9110; this is a CONTEXT.md inaccuracy worth noting (non-blocking, but a pedantic test reviewer might catch it). [VERIFIED: RFC 9110 §15.5 covers 4xx codes 15.5.1..15.5.20; 15.5.21 is not present.]

## Project Constraints (from CLAUDE.md)

The project's CLAUDE.md is canonical (it explicitly says "do not follow AGENTS.md when the two conflict"). Phase 3 must honor:

| Constraint | How Phase 3 honors it |
|------------|----------------------|
| Use `apps/api/run_tests.py` (NOT `run_tests.sh`) | Tests documented as `cd apps/api && python run_tests.py -c` (D-14). |
| Coverage `--fail-under=90` | New contract tests contribute to the 90% gate; no per-package higher gate added. |
| `apps/api` is excluded from pnpm workspace | All Django work stays inside `apps/api/`; no JS package edits. |
| Do not invent test harnesses | Reuse existing pytest+factory_boy+pytest-mock harness; no new framework. |
| Unit-test directory failures are pre-existing | The 5 failures noted in `01/deferred-items.md` (`bg_tasks/test_copy_s3_objects.py`, `bg_tasks/test_work_item_link_task.py`, `utils/test_url.py`) are unrelated to `timeline_propagation` and to `Issue` mutation paths. Phase 3 will not touch them. [VERIFIED: read `deferred-items.md`; none of those modules import `Issue.objects.bulk_update` or `timeline_propagation`.] |
| OxLint warning budgets are ratcheting | N/A — apps/api is Python; OxLint runs on JS/TS only. |
| `from __future__ import annotations` is NOT required (Python 3.12+) | Existing code uses inline `\| None` syntax; Phase 3 follows. |
| Domain language (Work Item, Precedence Dependency, Dependency Schedule Propagation, Precedence Boundary) | Use these in serializer field docstrings, error `message` strings, test class/function names, view docstring. Avoid "issue"/"relation" in user-facing prose. |

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **API-01** | Dedicated propagation endpoint for same-project scope | URL pattern locked in CONTEXT D-01 (`workspaces/<str:slug>/projects/<uuid:project_id>/timeline-propagation/`); registration target identified at `apps/api/plane/app/urls/issue.py` between line 255 (after `issue-dates`) and line 256 (before `issue-versions`). |
| **API-02** | Client sends move intent body `{ work_item_id, original_*, expected_updated_at, requested_*, operation: "move" }`; no precomputed update list | Serializer fields enumerated in CONTEXT D-04; request body parsed via `TimelinePropagationRequestSerializer`. |
| **API-03** | Success returns `id` / `start_date` / `target_date` / `updated_at` for every updated Work Item | Response shape locked in CONTEXT D-04; built from `result.updates` (Phase 2 `WorkItemUpdate` carries id+start+target; `updated_at` is set to the captured `now` in the view per Pattern 4). |
| **API-04** | Success includes `requested_work_item_id`, `total_updated_count`, optional `client_preview_count` | Field shape from CONTEXT D-04; `total_updated_count = len(result.updates)`; `client_preview_count` echoed from request if sent. |
| **API-05** | Failure returns `{ code, message }` | `_error(code, message, status=...)` helper crafts the dict directly via `Response({"code": code.value, "message": message}, status=status)`. |
| **API-06** | Initial 7 failure codes | Imported from Phase 2's `PropagationErrorCode` StrEnum (CONTEXT D-12); status mapping in Common Operation 4 above. |
| **API-07** | Stale `updated_at` → `SCHEDULE_CHANGED` | Phase 2 D-08 owns the algorithm-side check; Phase 3 builds `expected_versions = {move_intent.work_item_id: validated["expected_updated_at"]}` (single-entry dict) and passes it to `propagate_move`. The race-safety is provided by `select_for_update()` on the dragged row (Pattern 3). |
| **API-08** | All-or-nothing persistence on failure | Failure path returns from inside `with transaction.atomic():` BEFORE `bulk_update` is called → the rollback is trivial (no writes occurred). Confirmed by test `test_dependency_cycle_returns_422_envelope` etc. asserting post-call `updated_at` snapshot is unchanged. |
| **API-09** | Reuse existing project permission, unauthorized → `PERMISSION_DENIED` | Inline `ProjectMember` filter mirrors `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` (CONTEXT D-02). GUEST excluded explicitly. No workspace-admin bypass (D-02b). |
| **API-10** | Invalid date range → `INVALID_DATE_RANGE` | Phase 2 D-06 step 1 handles this in the algorithm; serializer does NOT pre-check (CONTEXT D-04). Maps to 422. |
| **API-11** | Existing bulk date update endpoint untouched | No edits to `apps/api/plane/app/views/issue/base.py:1093-1170`. Regression test `test_existing_bulk_update_endpoint_unchanged` (D-14) pins the existing shape. |
| **API-12** | Propagation updates follow existing `updated_at` audit rules | `bulk_update` field list includes `"updated_at"`; `issue_activity.delay(type="issue.activity.updated", ...)` fires per moved field per issue, registered via `transaction.on_commit(...)` (CONTEXT D-07, D-09). |
| **PROP-16** (endpoint-side) | Cross-project paths fail with `PROJECT_BOUNDARY_EXCEEDED` | Phase 1 D-03 + Phase 2 D-10 already classify and detect; the queryset annotation `related_project_id=F("related_issue__project_id")` (CONTEXT D-11) carries the data into the loader. Endpoint-level test `test_cross_project_path_returns_422_envelope` (D-14) covers TEST-10. |
| **TEST-10** | Cross-project dependency path → `PROJECT_BOUNDARY_EXCEEDED` (contract-level) | `test_cross_project_path_returns_422_envelope` builds two projects + a cross-project `IssueRelation` and asserts the 422 envelope + no row updated. |
| **TEST-13** | Stale schedule rejection → `SCHEDULE_CHANGED` (contract-level) | `test_stale_updated_at_returns_409_envelope` mismatches `expected_updated_at` and asserts 409 envelope + no DB change. |
| **TEST-15** | All-or-nothing on any failure | Snapshot-pre/post helper `_assert_no_db_writes(work_item_ids)` used by every failure-case test (cycle, cross-project, incomplete, limit, stale, invalid range). |
| **TEST-16** | Success payload includes updated dates + `updated_at` | `test_chain_propagation_returns_200_with_full_payload` asserts the array shape; `test_success_payload_uses_single_now_for_updated_at` asserts all `updated_at` values are identical (deterministic from D-05f). |
| **TEST-17** | Failure payload includes stable code and message | `test_*_returns_*_envelope` family asserts both `response.json()["code"]` matches the enum value and `response.json()["message"]` is a non-empty string. |
| **TEST-18** | Permission rejection at viewset layer → `PERMISSION_DENIED` | `test_non_member_returns_permission_denied_403`, `test_guest_returns_permission_denied_403`, `test_unauthenticated_request_returns_401`. |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest 9.0.3 + pytest-django 4.5.2 + pytest-mock 3.11.1 + factory-boy 3.3.0 [VERIFIED: apps/api/requirements/test.txt] |
| Config file | `apps/api/pytest.ini` (defaults: `--reuse-db --nomigrations -vs`, markers `unit/contract/smoke/slow`) |
| Quick run command | `cd apps/api && python run_tests.py -c` (contract marker) |
| Full suite command | `cd apps/api && python run_tests.py` (all markers) |
| Coverage gate | `cd apps/api && python run_tests.py -c -o` → enforces `--fail-under=90` via `coverage report --fail-under=90` ([VERIFIED: run_tests.py:60-65]) |
| Single-file run | `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/contract/app/test_timeline_propagation.py -v` |

The `-c` flag adds `-m contract` to the pytest command. New tests in `apps/api/plane/tests/contract/app/test_timeline_propagation.py` are picked up automatically (file name matches `python_files = test_*.py`, and the `@pytest.mark.contract` decorator filters them in). Coverage gate currently enforces ≥90% project-wide; Phase 3's additions naturally improve coverage (new view, new serializer, new tests).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-01 | URL routes to view; reverse name resolves | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::test_url_reverses -v` | ❌ Wave 0 |
| API-02 | Serializer accepts the documented body | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::test_serializer_accepts_valid_payload -v` | ❌ Wave 0 |
| API-03 / API-04 / TEST-16 | Success payload shape & content | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::test_chain_propagation_returns_200_with_full_payload -v` | ❌ Wave 0 |
| API-05 / API-06 / TEST-17 | Failure envelope `{code, message}` for each of 7 codes | contract (parametrized or 7 tests per CONTEXT D-14) | `pytest plane/tests/contract/app/test_timeline_propagation.py -k "envelope" -v` | ❌ Wave 0 |
| API-07 / TEST-13 | `expected_updated_at` mismatch → 409 envelope | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::test_stale_updated_at_returns_409_envelope -v` | ❌ Wave 0 |
| API-08 / TEST-15 | All-or-nothing on every failure | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py -k "no_db_writes" -v` (helper-driven) | ❌ Wave 0 |
| API-09 / TEST-18 | Permission rejection envelope | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py -k "permission" -v` | ❌ Wave 0 |
| API-10 | Invalid date range → 422 envelope | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::test_invalid_date_range_returns_422_envelope -v` | ❌ Wave 0 |
| API-11 | Existing IssueBulkUpdateDateEndpoint regression | contract (smoke) | `pytest plane/tests/contract/app/test_timeline_propagation.py::test_existing_bulk_update_endpoint_unchanged -v` | ❌ Wave 0 |
| API-12 | `issue_activity` and `model_activity` register on commit | contract (with mocker) | `pytest plane/tests/contract/app/test_timeline_propagation.py -k "activity" -v` | ❌ Wave 0 |
| PROP-16 / TEST-10 | Cross-project path → 422 envelope | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::test_cross_project_path_returns_422_envelope -v` | ❌ Wave 0 |
| (helper) | Snapshot-pre/post helper for "no DB writes on failure" | shared util | (called from many tests) | ❌ Wave 0 |
| (helper) | Activity-task on_commit registration mock | shared util | (called from API-12 test) | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `cd apps/api && python run_tests.py -c` (~6-15s for the new contract file, depending on DB reuse). Touches every contract test in the file.
- **Per wave merge:** `cd apps/api && python run_tests.py` (full unit + contract + smoke). Verifies Phase 1+2 still pass GREEN (64 unit tests) and Phase 3 contract tests are GREEN.
- **Phase gate:** `cd apps/api && python run_tests.py -o` (full suite + coverage). Must show no regression from Phase 2's 64/64 GREEN unit tests, all new Phase 3 contract tests GREEN, and total coverage ≥90%. The 5 pre-existing failures noted in `01/deferred-items.md` remain out of scope.

### Wave 0 Gaps

- [ ] `apps/api/plane/tests/contract/app/test_timeline_propagation.py` — covers TEST-10, TEST-13, TEST-15, TEST-16, TEST-17, TEST-18 + auxiliary HTTP-status-mapping cases per CONTEXT D-14.
- [ ] `apps/api/plane/tests/factories.py` extension — `IssueFactory`, `IssueRelationFactory`, optionally `StateFactory` (CONTEXT D-14). Verify the `State` requirement: `Issue.save()` falls back to project default state if `self.state is None`, so `StateFactory` may not be strictly required if a default state exists for the test's project — but contract tests build projects via `ProjectFactory` which doesn't seed states by default (verified at `factories.py:58-72`), so an explicit `StateFactory` is needed.
- [ ] `apps/api/plane/tests/contract/app/__init__.py` — already exists [VERIFIED: `ls` of contract/app/].
- [ ] No framework install — `pytest-mock` is already installed [VERIFIED: requirements/test.txt:7].
- [ ] No Django migration — Phase 3 adds no model fields.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python | Django runtime | ✓ | 3.12.10 | — |
| Django | Web framework | ✓ | 4.2.30 | — |
| djangorestframework | View, Serializer, Response | ✓ | 3.15.2 | — |
| pytest | Test runner | ✓ | 9.0.3 | — |
| pytest-django | DB fixtures | ✓ | 4.5.2 | — |
| pytest-mock | `mocker.patch` for `.delay()` | ✓ | 3.11.1 | — |
| factory-boy | Factories | ✓ | 3.3.0 | — |
| PostgreSQL | DB (READ COMMITTED, FOR UPDATE locks) | ✓ (via docker-compose-local.yml) | 15 | — |
| Redis (Valkey) | Celery broker | ✓ (via docker-compose-local.yml) | — | Mock `.delay()` in tests; production needs broker. |
| Celery | `issue_activity` / `model_activity` task framework | ✓ (existing in apps/api) | — | Tests mock `.delay()`; no Celery worker needed for unit/contract suite. |

**Missing dependencies with no fallback:** None — every dependency Phase 3 needs is installed.

**Missing dependencies with fallback:** None.

## Security Domain

> Security enforcement is enabled by default (no explicit `security_enforcement: false` in `.planning/config.json`).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `BaseSessionAuthentication` (existing); `IsAuthenticated` permission class returns 401 for anonymous. No new auth surface. |
| V3 Session Management | yes | Session via Django session framework (existing); no new session handling in Phase 3. |
| V4 Access Control | yes | Inline `ProjectMember.objects.filter(role__in=[ADMIN, MEMBER], is_active=True)` check; GUEST excluded explicitly. Workspace-admin-without-project-member bypass deliberately omitted (D-02b). |
| V5 Input Validation | yes | DRF serializer validates `UUIDField` / `DateField` / `DateTimeField` / `ChoiceField`. Domain validation (duration mismatch, target<start) lives in `propagate_move` per Phase 2 D-06. |
| V6 Cryptography | no | No new crypto surface. |
| V7 Error Handling & Logging | yes | `BaseAPIView.handle_exception` catches operational errors (IntegrityError, ValidationError, ObjectDoesNotExist, KeyError) and returns generic 4xx/500 (D-13). Domain failures use the typed `{code, message}` envelope. `log_exception(...)` is called for unhandled errors. |
| V13 API & Web Service | yes | RESTful POST endpoint with stable URL contract (D-01) and stable failure envelope (D-03). |

### Known Threat Patterns for Django + DRF + PostgreSQL

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection | Tampering | Django ORM parameterization (no raw SQL in this view). `bulk_update` uses parameterized SQL; `select_for_update().get()` uses parameterized lookup. |
| Cross-tenant data exposure (workspace/project boundary breach) | Information Disclosure | Queryset filters on both `workspace__slug` AND `project_id`; `Issue.DoesNotExist` on the dragged row maps to `PERMISSION_DENIED` (403), not 404, to prevent enumeration of work-item ids by non-members (D-05c). |
| Mass-assignment via serializer | Tampering | Serializer fields are explicit and minimal (D-04). No `Meta.fields = "__all__"`. |
| Race condition on stale-check | Tampering | `select_for_update()` on the dragged row inside `transaction.atomic()` makes the read-modify-write race-safe under PostgreSQL READ COMMITTED. |
| Audit-log forgery via rollback (orphan audit entries) | Repudiation | `transaction.on_commit(lambda: ...)` ensures audit/webhook events fire ONLY on successful commit. The existing endpoint's pre-commit `.delay()` is a known bug not propagated. |
| DoS via large propagation set | DoS | Phase 2 enforces 100-item limit (`PROPAGATION_LIMIT_EXCEEDED`); the algorithm fails fast on the 101st item. |
| Cycle/loop DoS | DoS | Phase 1 detects cycles via three-color iterative DFS; the algorithm refuses to propagate when `LoadResult.cycle is not None`. |
| Authorization bypass via missing decorator | Elevation of Privilege | Inline membership check at top of view body; no code path skips it. Pinned by `test_non_member_returns_permission_denied_403`, `test_guest_returns_permission_denied_403`, and `test_unauthenticated_request_returns_401`. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `State` model needs an explicit `StateFactory` because `ProjectFactory` does not seed default states. | Code Examples / Wave 0 | Tests fail at fixture-build time with `IntegrityError` or unintuitive null-state errors. Verifiable in plan-phase by reading `apps/api/plane/db/models/issue.py:178-203` (the `Issue.save()` falls back to project default state — but the project must already have at least one State row). | [ASSUMED] |
| A2 | `pytest-mock`'s `mocker.patch("django.db.transaction.on_commit", side_effect=lambda fn: fn())` will correctly intercept the on_commit registration in the view. | Pitfall 9 | Test pattern doesn't capture the registration; the regression test for "tasks fire only on_commit" returns false negatives. Mitigation: alternative is `TestCase.captureOnCommitCallbacks(execute=True)` which is documented in Django 4.2. | [ASSUMED — derived from generic Python mocking semantics] |
| A3 | The `epoch` argument to `issue_activity.delay` should be `int(now.timestamp())` (seconds since Unix epoch) to match the existing endpoint's `epoch = int(timezone.now().timestamp())` pattern at `views/issue/base.py:1118`. | Code Examples | Audit rows have wrong epoch values (off by µs). Verifiable in plan-phase by reading the `issue_activity` task implementation (it stores epoch as integer). | [VERIFIED via existing endpoint pattern] |
| A4 | `INVALID_DATE_RANGE` mapping to 422 (not 400) is correct for the wire contract. | Common Operation 4 | Frontend Phase 4 needs to distinguish "your input format is malformed" (DRF 400) from "your input is well-formed but the dates are bad" (422 envelope). CONTEXT D-04 locks 422; this research agrees. | [VERIFIED against CONTEXT.md D-04] |

The Assumptions Log is intentionally short — most claims in this research are tied to either Django 4.2 official docs or the existing codebase. The two `[ASSUMED]` items are the test-mocking pattern (A2) and the StateFactory necessity (A1); both are low-risk and easy to verify in plan-phase.

## Open Questions

1. **Should the inline membership check sit BEFORE or AFTER the serializer validation?**
   - What we know: CONTEXT.md D-02 + D-04 don't specify order. The existing `@allow_permission` decorator runs BEFORE the view body, so currently permission is checked before serializer parsing.
   - What's unclear: If serializer fails (DRF 400 default body) before permission check, an unauthenticated/non-member user sees 401 (auth) but a malformed-body authenticated non-member sees 400. If permission first, they see 403. Both are defensible.
   - Recommendation: **Permission check FIRST**, serializer SECOND. Matches existing decorator order; an unauthenticated user never sees a 400 (less info-leak). Pin in plan-phase.

2. **Should `test_status_code_per_error_code` be a parametrized matrix or 7 separate tests?**
   - What we know: CONTEXT D-14 lists 7 separate tests (one per code). Specifics §6 explicitly recommends keeping them separate for readable failure output.
   - What's unclear: Plan-phase may opt for a parametrize sweep + one focused test to assert the response BODY shape — saves lines but loses test-name clarity.
   - Recommendation: Keep 7 separate (per CONTEXT D-14); parametrize one auxiliary test for body-shape if helpful. Lock in plan-phase.

3. **`select_for_update(of=("self",))` vs `select_for_update()` (default = lock everything joined)?**
   - What we know: Django 4.2 supports `of=("self",)` to lock only the row in the queryset's main model (not joined `workspace`, `project`). Without it, a long-running concurrent transaction can deadlock on FK-side rows.
   - What's unclear: Whether the Plane test environment ever sees concurrent writers on `Workspace` or `Project` rows during a propagation. Almost certainly not (those tables are mostly read-mostly), but `of=("self",)` is the cheaper lock.
   - Recommendation: Use `select_for_update(of=("self",))` for the dragged Issue. Confirm via plan-phase that no model is blocked from joins. Falls back to default behavior cleanly.

4. **Should the response payload's `updated_at` be `now.isoformat()` or `now` itself (DRF's serializer formatting)?**
   - What we know: CONTEXT D-04 says "DRF default ISO 8601 with microseconds." If we pass `now` (a `datetime` object) into a dict-and-Response, DRF serializes via `JSONRenderer.encode` which uses `DjangoJSONEncoder` — which emits `isoformat()` automatically.
   - What's unclear: Whether the test asserts the literal isoformat string (microseconds, "Z" or "+00:00" suffix). Matter of test precision.
   - Recommendation: Pass `now` as a datetime; let DRF handle formatting. Tests assert via `datetime.fromisoformat(response.json()["work_items"][0]["updated_at"])` for round-trip safety. Lock in plan-phase.

5. **For the `test_existing_bulk_update_endpoint_unchanged` regression, what exactly is "unchanged"?**
   - What we know: API-11 says "leave it alone." The endpoint at `views/issue/base.py:1093-1170` should not be touched by Phase 3.
   - What's unclear: Should the regression test be a structural smoke (one POST, one assertEqual on response body shape) or also assert the bulk_update side-effect is correct?
   - Recommendation: Structural smoke only. The existing endpoint's correctness is not Phase 3's concern; we only assert it didn't break by accident. One POST + one `assertEqual(response.status_code, 200)` + one assert on the response body shape. Lock in plan-phase.

6. **Does the `IssueRelation` queryset need to filter `relation_type='blocked_by'` OR is the loader's filter sufficient?**
   - What we know: Phase 1 D-04 — the loader drops every `relation_type != "blocked_by"` row internally. So a queryset that includes ALL relation types would still produce the correct adjacency.
   - What's unclear: Whether to pre-filter at queryset level (cheaper SQL) or rely on the loader (cleaner separation).
   - Recommendation: Do not pre-filter at the view. Let the loader own the filter (Phase 1 D-04 is binding). The queryset just narrows by `project_id` + `deleted_at__isnull=True` + the two project_id annotations. Lock in plan-phase.

## Sources

### Primary (HIGH confidence)
- **Django 4.2 docs** [CITED]:
  - `transaction.on_commit` semantics (commit-only firing, rollback discard, autocommit fall-through, TestCase wrap-around): https://docs.djangoproject.com/en/4.2/topics/db/transactions/#performing-actions-after-commit
  - `select_for_update()` + transaction context required + `skip_locked`/`no_key` options: https://docs.djangoproject.com/en/4.2/ref/models/querysets/#select-for-update
  - `bulk_update` mechanism vs `auto_now` (via the `pre_save()` mechanism documented in https://docs.djangoproject.com/en/4.2/howto/custom-model-fields/#preprocessing-values-before-saving)
  - `TestCase.captureOnCommitCallbacks`: https://docs.djangoproject.com/en/4.2/topics/testing/tools/#django.test.TestCase.captureOnCommitCallbacks
- **Plane codebase (read-only)** [VERIFIED via Read/Grep]:
  - `apps/api/plane/app/views/issue/base.py:1093-1170` — `IssueBulkUpdateDateEndpoint` (existing analog, Pattern 4 + Pitfall 7 reference)
  - `apps/api/plane/app/views/base.py:149-237` — `BaseAPIView` (parent class; D-13 reference)
  - `apps/api/plane/app/permissions/base.py:13-89` — `ROLE` enum + `allow_permission` decorator (D-02 mirror source)
  - `apps/api/plane/db/models/issue.py:92-101, 145-146, 287-308` — `IssueManager`, `Issue.start_date/target_date`, `IssueRelation` model (D-10 redundancy finding, Phase 1 D-04 source)
  - `apps/api/plane/db/mixins.py:16-20` — `TimeAuditModel.updated_at = DateTimeField(auto_now=True)` (Pitfall 1)
  - `apps/api/plane/bgtasks/issue_activities_task.py:1503-1516` — `issue_activity.delay` task signature
  - `apps/api/plane/bgtasks/webhook_task.py:464` — `model_activity.delay` task signature
  - `apps/api/plane/utils/host.py:17-32` — `base_host` helper for `origin` arg
  - `apps/api/plane/app/views/module/base.py:708-716` — example of `model_activity.delay` invocation pattern
  - `apps/api/plane/tests/contract/app/test_project_app.py` — contract test pattern to mirror
  - `apps/api/plane/tests/conftest.py:67-71, 116-141` — `session_client`, `workspace`, `create_user` fixtures
  - `apps/api/plane/tests/factories.py` — base factories (extension target for D-14)
  - `apps/api/run_tests.py` — test runner contract (`-c`, `-o` flags)
  - `apps/api/pytest.ini` — `--reuse-db --nomigrations`, `markers = unit/contract/smoke/slow`
  - `apps/api/requirements/base.txt` — Django 4.2.30, DRF 3.15.2 versions
  - `apps/api/requirements/test.txt` — pytest 9.0.3, pytest-django 4.5.2, pytest-mock 3.11.1, factory-boy 3.3.0
  - `apps/api/plane/app/services/timeline_propagation/{__init__.py,types.py,errors.py}` — Phase 1+2 public surface (D-12 import target)
- **Phase 1 + Phase 2 CONTEXT.md** [VERIFIED via Read]: All upstream decisions D-01..D-14 (Phase 1) and D-01..D-14 (Phase 2).
- **Phase 1 deferred-items.md** [VERIFIED via Read]: 5 pre-existing failures unrelated to timeline_propagation/Issue mutation.

### Secondary (MEDIUM confidence)
- **Search result on `bulk_update` + `auto_now`**: WebSearch returned an authoritative explanation tied to Django's `pre_save()` mechanism. Cross-verified by reading the Django docs on custom model fields and confirming that `bulk_update` does not call `save()`. Confidence raised to HIGH after cross-verification.
- **RFC 9110 §15.5 for HTTP status codes**: WebFetch returned the correct text — 422 is from RFC 4918 (WebDAV), not 9110. The CONTEXT.md D-03 phrasing "RFC 9110 §15.5.21" is technically wrong (no such section); the substance (use 422 for semantic errors) is correct. Flagged in "State of the Art" → "Deprecated/outdated".

### Tertiary (LOW confidence)
- None — every load-bearing claim was verified against either the codebase or Django 4.2 docs. The two `[ASSUMED]` items in the Assumptions Log are noted explicitly.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions read directly from `requirements/{base,test}.txt`.
- Architecture: HIGH — patterns verified against Django 4.2 docs + existing codebase analogs (`IssueBulkUpdateDateEndpoint`, `module_activity.delay` pattern in `views/module/base.py`).
- Pitfalls: HIGH — every pitfall is either tied to a Django docs citation or a codebase grep result. Pitfall 7 (existing endpoint's latent audit-leak bug) was confirmed by reading line 1142+ of `base.py`.
- Test architecture: HIGH — `run_tests.py -c` flow, `pytest-mock` availability, `--fail-under=90` coverage gate all verified.
- Open questions: appropriate uncertainty acknowledged (six items, all resolvable in plan-phase).

**Research date:** 2026-05-04
**Valid until:** 2026-06-04 (30 days; Django 4.2.30 is LTS-class, DRF 3.15.2 is stable, no expected behavior change in dependency layer; revisit if Phase 4 reveals contract-level surprises).
