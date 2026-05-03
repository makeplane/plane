---
phase: 03-propagation-api-endpoint-persistence-contract
plan: 02
subsystem: backend-django-drf
tags:
  - django
  - drf
  - transaction
  - select_for_update
  - bulk_update
  - propagation
  - serializer
  - contract
requirements:
  - API-02
  - API-03
  - API-04
  - API-05
  - API-06
  - API-07
  - API-08
  - API-10
  - PROP-16
  - TEST-10
  - TEST-13
  - TEST-15
  - TEST-16
  - TEST-17
  - TEST-18
nyquist_compliant: true
dependency_graph:
  requires:
    - 03-01 (routing scaffold + StateFactory/IssueFactory/IssueRelationFactory)
    - phase 02 public surface (load_precedence_graph, propagate_move,
      MoveIntent, ScheduledWorkItem, PropagationErrorCode)
  provides:
    - TimelinePropagationView.post — full body (atomic + select_for_update
      + algorithm + bulk_update + 7 typed envelopes + single-now invariant)
    - TimelinePropagationRequestSerializer (8 fields, structural-only D-04)
    - TimelinePropagationResponseSerializer + TimelinePropagationWorkItemSerializer
    - TimelinePropagationErrorSerializer (drf-spectacular schema only)
    - STATUS_BY_CODE dict (single source of truth — D-03 wire mapping)
    - _error helper (single envelope shape)
    - _assert_no_db_writes / _snapshot test helpers (all-or-nothing pin)
  affects:
    - apps/api/plane/app/serializers/__init__.py (added
      TimelinePropagationWorkItemSerializer to barrel)
tech-stack:
  added: []
  patterns:
    - "transaction.atomic() + select_for_update(of=('self',)) on the dragged
      Issue row before any algorithm call (race-safe stale check)"
    - "Issue.objects.bulk_update(instances, ['start_date','target_date','updated_at'])
      — explicit updated_at field because auto_now is bypassed by bulk_update
      (RESEARCH Pitfall 1)"
    - "Single now = timezone.now() captured at top of post; reused for every
      Issue.updated_at and every work_items[].updated_at (D-05a / D-05f)"
    - "Inline ProjectMember check via ProjectMember.objects.filter(...).exists()
      mirroring the @allow_permission decorator shape but returning the
      {code, message} envelope rather than {error: ...} (D-02)"
    - "STATUS_BY_CODE dict[PropagationErrorCode, int] as single source of
      truth for the wire HTTP status mapping (D-03); no inline status=403/409/422
      literals at call sites"
key-files:
  created: []
  modified:
    - apps/api/plane/app/serializers/timeline_propagation.py (29 → 88 lines)
    - apps/api/plane/app/views/issue/timeline_propagation.py (52 → 269 lines)
    - apps/api/plane/tests/contract/app/test_timeline_propagation.py (190 → 880 lines)
    - apps/api/plane/app/serializers/__init__.py (added
      TimelinePropagationWorkItemSerializer to barrel re-export)
decisions:
  - "Permission check FIRST (before serializer parse) per CONTEXT D-02 +
    Open Question 1 — mirrors @allow_permission's behavior so an unauthorized
    caller never sees a 400 (less info-leak)."
  - "select_for_update(of=('self',)) locks only the Issue row, not the
    JOIN-side workspace/project/state rows that IssueManager pulls in via
    .exclude(state__group=TRIAGE) etc. — Open Question 3 recommendation."
  - "_unique_project test helper added because Project's unique_together on
    (identifier, workspace, deleted_at) collides when ProjectFactory uses its
    default empty identifier across multiple projects in one workspace.
    Tests that need >1 project under one workspace MUST set identifier
    explicitly; ProjectFactory's django_get_or_create=('name','workspace')
    is also defensive against name collisions."
  - "IssueRelation row in test_cross_project_path_returns_422_envelope is
    created via IssueRelation.objects.create directly (not via
    IssueRelationFactory) because IssueRelationFactory's SubFactory wires
    related_issue.project to issue.project — same-project. The contract
    test needs an explicit cross-project edge to exercise the
    PROJECT_BOUNDARY_EXCEEDED path."
metrics:
  duration_seconds: ~1100
  completed_at: 2026-05-04
  tasks_completed: 2/2
  tests_added: 17 (5 serializer-level + 12 view-level — 1 inline merge of
    test_chain_propagation and test_success_payload_uses_single_now)
  tests_green: 23/23
  files_created: 0
  files_modified: 4
---

# Phase 3 Plan 02: Serializers + view body + 16 contract tests Summary

Wave 2 of Phase 3 — replaced the Plan 03-01 501 stub with the full
parse → permission → load → propagate → bulk_update → envelope
plumbing. Locks the wire contract Phase 4-6 freeze against:

- 8-field request body
- success payload `{requested_work_item_id, total_updated_count,
  client_preview_count, work_items[]}` with single shared `updated_at`
- 7 failure envelopes mapped to fixed HTTP statuses (D-03)
- all-or-nothing DB rollback guarantee on every failure path

Activity / webhook fan-out via `transaction.on_commit` is intentionally
DEFERRED to Plan 03-03; the seam is the comment marker
`# Plan 03-03: transaction.on_commit registrations go here` between the
`bulk_update` call and the success `Response`.

## What shipped

### Serializers (`apps/api/plane/app/serializers/timeline_propagation.py`)

Replaced the Plan 03-01 placeholder bodies with real implementations
per CONTEXT D-04 (structural-only — no cross-field `validate(...)`):

- **`TimelinePropagationRequestSerializer`** — 8 fields:
  `work_item_id` (UUID), `original_start_date` / `original_target_date`
  / `requested_start_date` / `requested_target_date` (Date),
  `expected_updated_at` (DateTime — DRF default ISO 8601 with
  microseconds), `operation` (one-element ChoiceField pinning
  move-only at the parser layer per PROP-18), `client_preview_count`
  (optional int).
- **`TimelinePropagationWorkItemSerializer`** — single-row schema for
  `work_items[]`: `id`, `start_date`, `target_date`, `updated_at`.
- **`TimelinePropagationResponseSerializer`** —
  `requested_work_item_id`, `total_updated_count`,
  `client_preview_count`, `work_items` (many).
- **`TimelinePropagationErrorSerializer`** — drf-spectacular schema
  only; runtime crafts the dict via `_error`. `code` is a ChoiceField
  sourced from `PropagationErrorCode` so renaming a code in Phase 2
  fails at import time, not on the wire.
- Added `TimelinePropagationWorkItemSerializer` to the
  `apps/api/plane/app/serializers/__init__.py` barrel.

### View body (`apps/api/plane/app/views/issue/timeline_propagation.py`)

Replaced the 501 stub with the real `post(...)` body:

```python
def post(self, request, slug, project_id):
    now = timezone.now()                                    # D-05a
    if not is_member(...): return _error(PERMISSION_DENIED) # D-02
    serializer = TimelinePropagationRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)                # DRF default 400 D-04
    move_intent = MoveIntent(...)
    expected_versions = {move_intent.work_item_id: validated["expected_updated_at"]}

    with transaction.atomic():
        try:
            Issue.issue_objects.select_for_update(of=("self",)).get(...)
        except Issue.DoesNotExist:
            return _error(PERMISSION_DENIED, ...)            # D-05c info-leak guard
        relations = IssueRelation.objects.filter(...).annotate(...)
        graph = load_precedence_graph(relations, project_id=project_id)
        items = Issue.issue_objects.filter(..., archived_at__isnull=True, is_draft=False)
        work_items_by_id = {... ScheduledWorkItem(...) ...}
        result = propagate_move(graph, work_items_by_id, move_intent, expected_versions)
        if result.failure is not None:
            return _error(result.failure.code, result.failure.message)  # D-03 envelope

        instances = [Issue(id=upd.id, start_date=..., target_date=..., updated_at=now)
                     for upd in result.updates]
        Issue.objects.bulk_update(instances, ["start_date","target_date","updated_at"])
        # Plan 03-03: transaction.on_commit registrations go here
        return Response({...}, status=status.HTTP_200_OK)    # D-05f single now
```

Module-level `STATUS_BY_CODE` dict + `_error(code, message)` helper as the
sole sources of truth for the wire mapping (D-03).

### Tests (`apps/api/plane/tests/contract/app/test_timeline_propagation.py`)

Added 17 new tests (12 view + 5 serializer) on top of Plan 03-01's 6.
Total in this file: **23 GREEN**.

**TestTimelinePropagationRequestSerializer** (5 tests):
- `test_serializer_accepts_valid_payload` — types preserved through
  `validated_data` (UUID / date / tz-aware datetime / int / "move").
- `test_serializer_rejects_missing_field` (live view) — drops
  `expected_updated_at`; DRF default 400, NOT envelope (D-13 / Pitfall 8).
- `test_serializer_rejects_resize_operation` (live view) —
  `operation="resize"`; DRF default 400, NOT envelope.
- `test_serializer_accepts_optional_client_preview_count` — both
  present (42) and absent cases preserve through `validated_data`.
- `test_serializer_does_not_check_cross_field_invariants` —
  `requested_target < requested_start` still passes `is_valid()`
  (the algorithm owns INVALID_DATE_RANGE per Phase 2 D-06 step 1).

**TestTimelinePropagationView** (12 tests):
- `test_non_member_returns_permission_denied_403` (TEST-18 piece 1) —
  user with no ProjectMember row → 403 + envelope.
- `test_guest_returns_permission_denied_403` (TEST-18 piece 2) —
  ROLE.GUEST.value=5 excluded from `[ADMIN, MEMBER]` filter.
- `test_dragged_issue_not_in_project_returns_permission_denied_403` —
  member of project A POSTs `work_item_id` of project B's issue → 403
  + envelope (D-05c info-leak prevention).
- `test_no_violation_move_returns_200_with_dragged_only` (TEST-16 p1) —
  single Issue, no relations; 200 + 1 update; `updated_at` advanced
  past pre-call value.
- `test_chain_propagation_returns_200_with_full_payload` (TEST-16 main) —
  A→B→C tight chain; 200 + 3 updates with `total_updated_count == 3`.
- `test_success_payload_uses_single_now_for_updated_at` (D-05a / D-05f) —
  `len({item['updated_at'] for item in body['work_items']}) == 1`.
- `test_dependency_cycle_returns_422_envelope` (TEST-15 / TEST-17) —
  cycle (a↔b) → 422 + DEPENDENCY_CYCLE + no DB writes.
- `test_cross_project_path_returns_422_envelope` (TEST-10) — relation
  registered to project_a with related_issue in project_b → 422 +
  PROJECT_BOUNDARY_EXCEEDED + no DB writes.
- `test_incomplete_schedule_descendant_returns_422_envelope` —
  successor with `start_date=target_date=None` → 422 +
  INCOMPLETE_SCHEDULE + no DB writes.
- `test_propagation_limit_at_101_returns_422_envelope` (TEST-12) —
  101-issue tight chain → 422 + PROPAGATION_LIMIT_EXCEEDED + no DB writes.
- `test_invalid_date_range_returns_422_envelope` —
  `requested_target < requested_start` → 422 + INVALID_DATE_RANGE +
  no DB writes.
- `test_stale_updated_at_returns_409_envelope` (TEST-13) —
  `expected_updated_at = a.updated_at - timedelta(hours=1)` → 409 +
  SCHEDULE_CHANGED + no DB writes.

Module-level helpers: `_snapshot(ids)` returns `{id: updated_at}` dict;
`_assert_no_db_writes(snapshot)` re-queries and asserts bit-equal
post-call values. Used by every domain-failure test to pin
all-or-nothing (API-08 / TEST-15 / TEST-17).

## Verification

```text
$ docker exec plane-api-1 sh -c "cd /code && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/contract/app/test_timeline_propagation.py -v"
============= 23 passed, 23 warnings in 3.28s =============
```

```text
$ docker exec plane-api-1 sh -c "cd /code && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/ -v"
============= 64 passed, 3 warnings in 1.23s =============
```

Full contract suite shows the same **13 pre-existing failures** as
HEAD~2 (cycles, magic-link auth, API token patch) — out of scope per
Plan 03-01 deferred-items rule and confirmed by the SCOPE BOUNDARY
check. **No new regressions.**

### 7 failure envelopes confirmed with their D-03 HTTP status

| Code | HTTP | Test pinning it |
|------|------|------------------|
| `PERMISSION_DENIED` | 403 | `test_non_member` / `test_guest` / `test_dragged_issue_not_in_project` |
| `SCHEDULE_CHANGED` | 409 | `test_stale_updated_at_returns_409_envelope` |
| `DEPENDENCY_CYCLE` | 422 | `test_dependency_cycle_returns_422_envelope` |
| `PROJECT_BOUNDARY_EXCEEDED` | 422 | `test_cross_project_path_returns_422_envelope` |
| `INCOMPLETE_SCHEDULE` | 422 | `test_incomplete_schedule_descendant_returns_422_envelope` |
| `PROPAGATION_LIMIT_EXCEEDED` | 422 | `test_propagation_limit_at_101_returns_422_envelope` |
| `INVALID_DATE_RANGE` | 422 | `test_invalid_date_range_returns_422_envelope` |

### Acceptance grep checks

```text
$ grep -cnE '^STATUS_BY_CODE' apps/api/plane/app/views/issue/timeline_propagation.py
1                                                            ✓ single source

$ grep -nE 'status=status\.HTTP_(403|409|422)' \
    apps/api/plane/app/views/issue/timeline_propagation.py
                                                             ✓ no inline literals

$ grep -nE 'from plane\.app\.services\.timeline_propagation\.(scheduling|propagation|types|errors)' \
    apps/api/plane/app/views/issue/timeline_propagation.py
                                                             ✓ barrel-only D-12

$ grep -nE 'transaction\.on_commit|issue_activity\.delay|model_activity\.delay' \
    apps/api/plane/app/views/issue/timeline_propagation.py
                                                             ✓ no on_commit yet
                                                               (Plan 03-03 layers)

$ grep -nE 'def validate\b' apps/api/plane/app/serializers/timeline_propagation.py
                                                             ✓ no cross-field
                                                               validate (D-04)

$ grep -rE '"DEPENDENCY_CYCLE"|"PROJECT_BOUNDARY_EXCEEDED"|...' \
    apps/api/plane/app/views/issue/timeline_propagation.py \
    apps/api/plane/app/serializers/timeline_propagation.py
                                                             ✓ no string literals
                                                               for codes (D-12)

$ grep -A2 -nE 'Issue\.objects\.bulk_update' \
    apps/api/plane/app/views/issue/timeline_propagation.py
            Issue.objects.bulk_update(
                instances, ["start_date", "target_date", "updated_at"]
            )                                                ✓ updated_at in
                                                               field list
                                                               (Pitfall 1 / 6)
```

## Single-`now` invariant

Pinned three ways:
1. `now = timezone.now()` captured ONCE at the top of `post(...)`.
2. Every `Issue` instance in the `bulk_update` list has
   `inst.updated_at = now`.
3. Every `work_items[].updated_at` in the response payload is
   `now.isoformat()`.

The test `test_success_payload_uses_single_now_for_updated_at` asserts
`len({item["updated_at"] for item in body["work_items"]}) == 1` directly
against the wire response.

## All-or-nothing rollback

Pinned by the `_assert_no_db_writes(snapshot)` helper across the 6
domain-failure tests:
- `test_dependency_cycle_returns_422_envelope`
- `test_cross_project_path_returns_422_envelope`
- `test_incomplete_schedule_descendant_returns_422_envelope`
- `test_propagation_limit_at_101_returns_422_envelope`
- `test_invalid_date_range_returns_422_envelope`
- `test_stale_updated_at_returns_409_envelope`

Each test snapshots `Issue.objects.values_list("id", "updated_at")` BEFORE
the POST; after the POST, the helper re-queries and asserts bit-equal
datetime values. Since the failure path returns from inside
`with transaction.atomic():` BEFORE `bulk_update` runs, the (no-op)
transaction rolls back and the snapshot is preserved exactly.

## Deviations from Plan

### 1. [Rule 3 - Blocking] Project unique_together forces explicit `identifier=`

**Found during:** Task 2 first run of `test_dragged_issue_not_in_project_…`
and `test_cross_project_path_…`.

**Issue:** Both tests need TWO projects in the same workspace. The plan's
example used `ProjectFactory.create(workspace=workspace, ...)` for both,
but Project has a `unique_together` constraint on
`(identifier, workspace, deleted_at)` (with NULL deleted_at). The default
ProjectFactory has `identifier=''`, so the second factory call produced
`IntegrityError: duplicate key value violates unique constraint
"project_unique_identifier_workspace_when_deleted_at_null"`.

**Fix:** Added `_unique_project(workspace, create_user, label)` helper
that sets `name=f"Project {label} {hex}"` AND
`identifier=f"{label}{hex}"[:12]` so each project in the same test gets
distinct values for both unique constraints. Refactored `_build_member_project`
to call through it.

**Files modified:** `apps/api/plane/tests/contract/app/test_timeline_propagation.py`.

**Commit:** `a820e369d4` (rolled into Task 2's commit since the helper
was added before any test could pass).

### 2. [Rule 3 - Blocking] UserFactory does not set `username`

**Found during:** Task 2 first run of `test_non_member_returns_permission_denied_403`.

**Issue:** The `User` model has `username = models.CharField(unique=True)`
but `UserFactory` doesn't set it (matches the conftest's `create_user`
fixture, which also omits username). When the test creates an "outsider"
user via `UserFactory.create()`, the empty-string username collides with
the existing `create_user`'s empty-string username → `IntegrityError:
duplicate key value violates unique constraint "users_username_key"`.

**Fix:** The outsider call passes both
`email=f"outsider-{hex}@plane.so"` and `username=f"outsider_{hex}"`
explicitly. Did NOT modify `UserFactory` itself (would break other tests'
expectations and is out of scope per Plan 03-02).

**Files modified:** `apps/api/plane/tests/contract/app/test_timeline_propagation.py`.

**Commit:** `a820e369d4`.

### 3. [Rule 3 - Blocking] IssueRelationFactory pins same-project related_issue

**Found during:** Task 2 first run of `test_cross_project_path_returns_422_envelope`.

**Issue:** `IssueRelationFactory` declares
`related_issue = factory.SubFactory(IssueFactory, project=factory.SelfAttribute("..issue.project"))`
to pin the related_issue's project to the issue's project (correct
default for same-project chains). But the cross-project test needs a
relation owned by `project_a` whose `related_issue` lives in
`project_b` — which the factory's pinning explicitly prevents.

**Fix:** The cross-project test bypasses the factory and calls
`IssueRelation.objects.create(...)` directly with `project=project_a`
and `related_issue=b` (where `b.project_id == project_b.id`). This is
the only test that needs this shape; all other relation creations stay
on the factory.

**Files modified:** `apps/api/plane/tests/contract/app/test_timeline_propagation.py`.

**Commit:** `a820e369d4`.

### 4. [Spec drift] Test count mismatch with the plan's 16 — actual is 17

**Found during:** Task 1 acceptance review.

**Issue:** The plan's `<acceptance_criteria>` for Task 1 says "5 new
serializer tests" + Task 2 "11 new contract tests + 1 helper module-level
+ 5 from Task 1 = 16 new tests". My implementation has 5 serializer +
12 view = 17. The extra view test is `test_chain_propagation_returns_200_with_full_payload`
PLUS `test_success_payload_uses_single_now_for_updated_at` as separate
top-level tests (per CONTEXT D-14 "don't over-parameterize the contract").
The plan's `<behavior>` block lists both as Tests 2 and 3, then later
says "may share a fixture" — I kept them as two distinct test functions
so a regression in either invariant produces an actionable test name.

**Impact:** None on coverage or contract; one extra GREEN test relative
to the plan's count. Total this file = 23 GREEN (6 from 03-01 + 17 new),
not 22.

**Files modified:** none (intentional decomposition).

## Auth gates encountered

None. Plan was fully autonomous; no `human-action` checkpoints.

## TDD compliance

This plan's tasks were marked `tdd="true"`. Per task:

- **Task 1 (serializers):** Mixed — three pure-serializer tests
  (`test_serializer_accepts_valid_payload`,
  `test_serializer_accepts_optional_client_preview_count`,
  `test_serializer_does_not_check_cross_field_invariants`) passed
  immediately on commit because they only assert structural truths
  the serializer instantly enforces. The two live-view tests
  (`test_serializer_rejects_missing_field`,
  `test_serializer_rejects_resize_operation`) failed RED on Task 1 commit
  (501 vs 400) and turned GREEN on Task 2 commit when the view was
  rewritten — true RED→GREEN per task.
- **Task 2 (view body):** Strict TDD violated by necessity — the test
  fixtures (project unique-identifier, outsider username, cross-project
  IssueRelation) needed iteration alongside the implementation. After
  the first integrated run revealed all three fixture issues at once,
  the fixes landed in the same commit as the implementation. Per the
  TDD-gate flexibility for plans where the seam between test infra and
  the system-under-test is being established for the first time
  (`@$HOME/.claude/get-shit-done/references/thinking-models-execution.md`),
  this matches the "scaffold + sanity tests in the same commit" pattern
  Plan 03-01 set.

The 6 domain-failure tests + the stale check + the success path tests
all assert behaviors that directly exercise the Phase 1+2 algorithm
through the new view body — the fact that they all GREEN on first run
of the rewritten view confirms the algorithm's wire contract is unchanged
under the HTTP transport.

## Known stubs (intentional, deferred to Plan 03-03)

- The view's success path has a comment marker
  `# Plan 03-03: transaction.on_commit registrations go here` between
  the `bulk_update` call and the success Response. The
  `pre_update_snapshot` dict is also captured (with a discard
  assignment to silence unused-variable warnings) so Plan 03-03 has
  the pre-update values for the `current_instance` kwargs of
  `issue_activity.delay` and `model_activity.delay` without
  re-querying.
- `TimelinePropagationErrorSerializer` is not invoked at runtime; it
  exists for drf-spectacular OpenAPI generation. The runtime view
  crafts the failure dict directly via `_error(code, message)`.

These stubs are tracked in the docstring of
`apps/api/plane/app/views/issue/timeline_propagation.py` and in the
per-task verification map (`03-VALIDATION.md` `03-02-T2` row).

## Threat Flags

None. Every file modified in this plan is already in the threat model
(`apps/api/plane/app/views/issue/timeline_propagation.py`,
`apps/api/plane/app/serializers/timeline_propagation.py`,
`apps/api/plane/tests/contract/app/test_timeline_propagation.py`); the
threat register's mitigate dispositions are all met:

- T-03-02-01 (anonymous spoofing) → `BaseAPIView.permission_classes =
  [IsAuthenticated]`; pinned by Plan 03-01's
  `test_unauthenticated_request_returns_401` (still GREEN).
- T-03-02-02 (mass-assignment) → 8 explicit fields; no `Meta.fields`;
  pinned by `test_serializer_rejects_resize_operation`.
- T-03-02-03 (SQL injection) → ORM only, parameterized.
- T-03-02-04 (race condition) → `select_for_update(of=("self",))`
  inside `transaction.atomic()`; pinned by
  `test_stale_updated_at_returns_409_envelope`.
- T-03-02-05 (rollback) → 6 domain-failure tests + stale test all call
  `_assert_no_db_writes(snapshot)`.
- T-03-02-06 (cross-tenant ID enumeration) → `Issue.DoesNotExist` →
  `PERMISSION_DENIED` (NOT 404); pinned by
  `test_dragged_issue_not_in_project_returns_permission_denied_403`.
- T-03-02-08 (DoS unbounded propagation) → algorithm `LIMIT=100`;
  pinned by `test_propagation_limit_at_101_returns_422_envelope`.
- T-03-02-10 (missing role check) → inline `ProjectMember` filter
  `role__in=[ADMIN, MEMBER]`; pinned by
  `test_non_member` + `test_guest`.
- T-03-02-11 (operational error leakage) → `BaseAPIView.handle_exception`
  unchanged; the 7 typed codes do NOT swallow `IntegrityError`.

## Self-Check: PASSED

**Files exist:**
- ✅ `apps/api/plane/app/serializers/timeline_propagation.py` (FOUND, 88 lines, 4 serializers)
- ✅ `apps/api/plane/app/views/issue/timeline_propagation.py` (FOUND, 269 lines, full body)
- ✅ `apps/api/plane/tests/contract/app/test_timeline_propagation.py` (FOUND, 880 lines, 23 GREEN tests)

**Modified files contain expected additions:**
- ✅ `apps/api/plane/app/serializers/__init__.py` — `TimelinePropagationWorkItemSerializer` (1 match)
- ✅ Serializer module — 4 concrete classes; zero `def validate` matches (D-04 structural-only)
- ✅ View module — 1 STATUS_BY_CODE; 0 inline status= literals; 0 string-literal codes; 0 submodule-direct imports; 0 `transaction.on_commit` / `.delay` calls; 1 `bulk_update(["start_date", "target_date", "updated_at"])`; 1 `select_for_update(of=("self",))`

**Commits exist:**
- ✅ `a6877c8c28` feat(03-02): implement TimelinePropagation serializers + 5 structural tests
- ✅ `a820e369d4` feat(03-02): implement TimelinePropagationView body + 11 contract tests

**Tests GREEN:**
- ✅ 23/23 contract tests in `test_timeline_propagation.py` (6 from 03-01 + 17 new this plan)
- ✅ 64/64 Phase 1+2 unit tests in `services/timeline_propagation/` (no regression)
- ✅ 13 pre-existing contract failures unchanged from HEAD~2 (auth/SMTP/API token patch — out of scope per Plan 03-01 deferred items)
