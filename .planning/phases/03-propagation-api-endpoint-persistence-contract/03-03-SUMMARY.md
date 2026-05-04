---
phase: 03-propagation-api-endpoint-persistence-contract
plan: 03
subsystem: backend-django-drf
tags:
  - django
  - transaction.on_commit
  - celery
  - audit
  - webhook
  - contract
requirements:
  - API-12
nyquist_compliant: true
dependency_graph:
  requires:
    - 03-01 (routing scaffold + factories)
    - 03-02 (TimelinePropagationView body + bulk_update + pre_update_snapshot
      seam + 23 GREEN contract tests)
  provides:
    - "Audit + webhook fan-out for TimelinePropagationView via
      transaction.on_commit registration of issue_activity.delay (per
      moved field per issue) and model_activity.delay (per moved issue)"
    - "First-of-its-kind transaction.on_commit pattern in apps/api/plane
      — backlog reference for migrating IssueBulkUpdateDateEndpoint
      (Pitfall 7) off its pre-commit .delay shape"
  affects: []
tech-stack:
  added: []
  patterns:
    - "transaction.on_commit(lambda inst=inst, pre=pre: task.delay(...))
      — register Celery task fan-out so it fires ONLY on successful
      commit; default-arg capture avoids late-binding-loop-variable
      bug (RESEARCH Pitfall 4)"
    - "Per-field audit logging mirrors existing
      views/issue/base.py:1141-1166 (start_date and target_date as
      SEPARATE issue_activity events) but adds a conditional
      ``if inst.X != pre.X`` guard so a field that did not actually
      change does NOT emit a 'moved by 0' audit row"
    - "Per-issue webhook fan-out mirrors views/module/base.py:708-716
      (one model_activity event per propagated issue with combined
      start+target payload). actor_id is the UUID (not str) per the
      existing module endpoint signature — model_activity and
      issue_activity have different actor_id type expectations"
    - "json.dumps(..., cls=DjangoJSONEncoder) for requested_data /
      current_instance per RESEARCH Common Operation 2 — handles
      date/datetime/UUID/Decimal types the audit task receives"
key-files:
  created: []
  modified:
    - apps/api/plane/app/views/issue/timeline_propagation.py (269 → 379 lines)
    - apps/api/plane/tests/contract/app/test_timeline_propagation.py (880 → 1072 lines)
decisions:
  - "Conditional skip on unchanged fields: the per-pair issue_activity
    block uses ``if inst.start_date != pre.start_date:`` (and same for
    target_date) so propagated issues that only shift one field log
    only that one event. The dragged item (which always moves both
    fields by the requested delta) typically logs both. Phase 2's
    propagate_move always moves the dragged item by the requested
    delta, so for the test fixtures used in this plan all 3 issues in
    the chain do shift both fields — the test asserts call_count == 6
    (2 fields × 3 issues)."
  - "actor_id type asymmetry: issue_activity.delay receives
    actor_id_str = str(request.user.id); model_activity.delay receives
    actor_id = request.user.id (UUID). Both match the existing endpoint
    patterns at views/issue/base.py:1147 and views/module/base.py:713
    respectively. The two task signatures differ — verified at the
    bgtasks/issue_activities_task.py:1503-1516 and
    bgtasks/webhook_task.py:464 import sites."
  - "Patch path for the on_commit tests: we patch the LOCAL
    binding ``plane.app.views.issue.timeline_propagation.transaction.on_commit``
    rather than ``django.db.transaction.on_commit``. Patching the
    Django module would NOT intercept the rebound name in the view
    module after ``from django.db import transaction`` — the view's
    ``transaction`` attribute already references the module object, so
    we patch ``transaction.on_commit`` ON the view module to redirect
    the lookup. RESEARCH Pitfall 9."
metrics:
  duration_seconds: ~720
  completed_at: 2026-05-04
  tasks_completed: 1/1
  tests_added: 3 (all GREEN — TestTimelinePropagationActivityFanOut class)
  tests_green: 26/26 (3 new + 23 prior in this file)
  files_created: 0
  files_modified: 2
---

# Phase 3 Plan 03: transaction.on_commit fan-out — issue_activity + model_activity Summary

Wave 3 of Phase 3 (final plan) — layered the audit + webhook fan-out
on top of Plan 03-02's working bulk_update success path. Closes API-12
and locks the audit-on-commit pattern that subsequent endpoints can
adopt without repeating the existing IssueBulkUpdateDateEndpoint
pre-commit-`.delay` bug (RESEARCH Pitfall 7).

This is the **first-of-its-kind** `transaction.on_commit` usage anywhere
in `apps/api/plane`. Verified via:

```text
$ grep -rn "transaction\.on_commit" apps/api/plane --include="*.py" \
    | grep -v "test_timeline_propagation\|/timeline_propagation\.py"
(no output)
```

## What shipped

### View modification (`apps/api/plane/app/views/issue/timeline_propagation.py`, 269 → 379 lines)

**Imports added** (alphabetical placement):

- `import json` (Python stdlib)
- `from django.core.serializers.json import DjangoJSONEncoder`
- `from plane.bgtasks.issue_activities_task import issue_activity`
- `from plane.bgtasks.webhook_task import model_activity`
- `from plane.utils.host import base_host`

**Module docstring** — updated step 4 of "Order of operations inside
post" to include step 4f covering the on_commit registrations, plus a
new top-level paragraph citing Pitfall 4 / Pitfall 7 and the API-11
backlog item (migrate IssueBulkUpdateDateEndpoint to on_commit and
add `updated_at` to its bulk_update field list).

**Marker comment replaced** — the seam left by Plan 03-02
(`# Plan 03-03: transaction.on_commit registrations go here` between
`bulk_update` and the success `Response`) is replaced with the actual
fan-out block:

```python
epoch = int(now.timestamp())                       # CONTEXT D-05a — same now
origin = base_host(request=request, is_app=True)   # CONTEXT D-08
actor_id_str = str(request.user.id)                # issue_activity expects str
project_id_str = str(project_id)

# Per-pair issue_activity.delay (mirror views/issue/base.py:1141-1166)
for inst in instances:
    pre = pre_update_snapshot[inst.id]
    if inst.start_date != pre.start_date:
        transaction.on_commit(
            lambda inst=inst, pre=pre: issue_activity.delay(
                type="issue.activity.updated",
                requested_data=json.dumps(
                    {"start_date": str(inst.start_date)}, cls=DjangoJSONEncoder),
                current_instance=json.dumps(
                    {"start_date": str(pre.start_date)}, cls=DjangoJSONEncoder),
                issue_id=str(inst.id),
                actor_id=actor_id_str,
                project_id=project_id_str,
                epoch=epoch,
            )
        )
    if inst.target_date != pre.target_date:
        transaction.on_commit(
            lambda inst=inst, pre=pre: issue_activity.delay(
                ... target_date variant ...
            )
        )

# Per-issue model_activity.delay (mirror views/module/base.py:708-716)
for inst in instances:
    pre = pre_update_snapshot[inst.id]
    transaction.on_commit(
        lambda inst=inst, pre=pre: model_activity.delay(
            model_name="issue",
            model_id=str(inst.id),
            requested_data=json.dumps(
                {"start_date": str(inst.start_date),
                 "target_date": str(inst.target_date)},
                cls=DjangoJSONEncoder),
            current_instance=json.dumps(
                {"start_date": str(pre.start_date),
                 "target_date": str(pre.target_date)},
                cls=DjangoJSONEncoder),
            actor_id=request.user.id,                  # UUID, not str (D-08)
            slug=slug,
            origin=origin,
        )
    )
```

The `_ = pre_update_snapshot` discard placeholder from Plan 03-02 is
removed — `pre_update_snapshot` is now consumed inside both loops.

### Tests (`apps/api/plane/tests/contract/app/test_timeline_propagation.py`, 880 → 1072 lines)

Added a new `TestTimelinePropagationActivityFanOut` class with 3 tests
(all GREEN):

1. **`test_activity_tasks_register_per_updated_issue`** — chain A→B→C
   with all three issues moving both `start_date` and `target_date`.
   Patches `transaction.on_commit` with `side_effect=lambda fn: fn()`
   (RESEARCH Pitfall 9 — `pytest.mark.django_db` rolls back rather
   than commits) to make registrations execute. Asserts:
   - `issue_activity.delay.call_count == 6` (3 issues × 2 fields).
   - `model_activity.delay.call_count == 3` (3 issues × 1 event).
   - `len({call.kwargs["issue_id"] for call in issue_activity_spy.call_args_list}) == 3`
     — distinct ids across registrations prove RESEARCH Pitfall 4
     default-arg capture is in effect (without it, all 6 callbacks
     would carry the LAST loop iteration's id).
   - `len({call.kwargs["model_id"] ...}) == 3` — same proof for model_activity.
   - `transaction.on_commit.call_count == 9` (6 issue_activity + 3 model_activity).

2. **`test_activity_tasks_only_fire_on_commit`** — patches
   `transaction.on_commit` with `side_effect=lambda fn: None`
   (swallows the callback). Submits a successful single-issue move.
   Asserts:
   - `response.status_code == 200`.
   - `transaction.on_commit.call_count >= 2` (registrations were made).
   - `issue_activity.delay.call_count == 0` AND
     `model_activity.delay.call_count == 0` — the .delay calls were
     wrapped in callbacks, never invoked synchronously.
   - This is the **Pitfall 7 regression guard** against
     `IssueBulkUpdateDateEndpoint`'s pre-commit `.delay` shape.

3. **`test_activity_tasks_not_invoked_on_failure`** — sets up a
   dependency cycle (a↔b). Even with `transaction.on_commit` firing
   immediately, the response returns 422 `DEPENDENCY_CYCLE` and:
   - `issue_activity.delay.call_count == 0`.
   - `model_activity.delay.call_count == 0`.
   - This proves the registration block sits AFTER the
     `if result.failure is not None: return _error(...)` early return
     left by Plan 03-02.

## Verification

```text
$ docker exec plane-api-1 sh -c "cd /code && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/contract/app/test_timeline_propagation.py -v"
...
plane/tests/contract/app/test_timeline_propagation.py::TestTimelinePropagationActivityFanOut::test_activity_tasks_register_per_updated_issue PASSED
plane/tests/contract/app/test_timeline_propagation.py::TestTimelinePropagationActivityFanOut::test_activity_tasks_only_fire_on_commit PASSED
plane/tests/contract/app/test_timeline_propagation.py::TestTimelinePropagationActivityFanOut::test_activity_tasks_not_invoked_on_failure PASSED

============== 26 passed, 26 warnings in 3.58s ==============
```

```text
$ docker exec plane-api-1 sh -c "cd /code && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/"
============== 64 passed, 3 warnings in 1.22s ==============
```

### 26 GREEN tests in `test_timeline_propagation.py`

| Wave | Source plan | Test class | Count |
|------|------------|-----------|-------|
| 0 | 03-01 | `TestFactorySmoke` | 3 |
| 1 | 03-01 | `TestTimelinePropagation` (routing/auth/API-11) | 3 |
| 2 | 03-02 | `TestTimelinePropagationRequestSerializer` | 5 |
| 2 | 03-02 | `TestTimelinePropagationView` | 12 |
| 3 | **03-03** | `TestTimelinePropagationActivityFanOut` | **3** |
| | | **Total** | **26** |

### Acceptance grep checks

```text
$ grep -nE "transaction\.on_commit\(" apps/api/plane/app/views/issue/timeline_propagation.py
287:                    transaction.on_commit(
305:                    transaction.on_commit(
329:                transaction.on_commit(
                                                             ✓ 3 matches
                                                               (≥3 required)

$ grep -nE "lambda inst=inst, pre=pre" apps/api/plane/app/views/issue/timeline_propagation.py
51: (docstring reference)
261: (comment reference)
288:                        lambda inst=inst, pre=pre: issue_activity.delay(
306:                        lambda inst=inst, pre=pre: issue_activity.delay(
330:                    lambda inst=inst, pre=pre: model_activity.delay(
                                                             ✓ 3 code-site matches
                                                               (Pitfall 4 capture
                                                                ≥3 required)

$ grep -nE "issue_activity\.delay\(" apps/api/plane/app/views/issue/timeline_propagation.py
288:                        lambda inst=inst, pre=pre: issue_activity.delay(
306:                        lambda inst=inst, pre=pre: issue_activity.delay(
                                                             ✓ exactly 2 matches
                                                               (start + target)

$ grep -nE "model_activity\.delay\(" apps/api/plane/app/views/issue/timeline_propagation.py
330:                    lambda inst=inst, pre=pre: model_activity.delay(
                                                             ✓ exactly 1 match
                                                               (one per issue, looped)

$ grep -nE "DjangoJSONEncoder" apps/api/plane/app/views/issue/timeline_propagation.py
69:from django.core.serializers.json import DjangoJSONEncoder
292:                                cls=DjangoJSONEncoder,
296:                                cls=DjangoJSONEncoder,
310:                                cls=DjangoJSONEncoder,
314:                                cls=DjangoJSONEncoder,
338:                            cls=DjangoJSONEncoder,
345:                            cls=DjangoJSONEncoder,
                                                             ✓ ≥1 match (used at
                                                               every json.dumps
                                                               call site)

$ grep -nE "transaction\.on_commit" apps/api/plane/app/views/issue/base.py
                                                             ✓ no matches —
                                                               existing endpoint
                                                               unchanged (API-11)

$ grep -rn "transaction\.on_commit" apps/api/plane --include="*.py" \
    | grep -v "test_timeline_propagation\|/timeline_propagation\.py"
                                                             ✓ no matches —
                                                               first-of-its-kind
                                                               in apps/api/plane
```

## Pitfalls confirmed and pinned

### RESEARCH Pitfall 4 — Default-arg lambda capture

The view registers per-iteration callbacks via
`lambda inst=inst, pre=pre: ...`. Without the default-arg capture,
Python's late-binding closure semantics would cause every callback to
fire with the LAST loop iteration's `inst` and `pre` — three updates
would produce three audit rows for the SAME (last) issue.

Pinned by `test_activity_tasks_register_per_updated_issue` asserting
`len(seen_issue_ids) == 3` and `len(seen_model_ids) == 3` across the
patched `.delay` `call_args_list`. If the default-arg capture were
removed, both sets would shrink to 1 (the last iteration's id) and the
test would fail.

### RESEARCH Pitfall 7 — Pre-commit `.delay` bug

The existing `IssueBulkUpdateDateEndpoint`
(`apps/api/plane/app/views/issue/base.py:1141-1166`) calls
`issue_activity.delay(...)` synchronously BEFORE `bulk_update`. If the
`bulk_update` later raises (e.g. `IntegrityError`), the audit row has
already been queued — orphan audit entry for a non-existent change.

The new view deliberately does NOT replicate this. Every `.delay` is
wrapped in `transaction.on_commit` so it fires only on successful
commit. Pinned by `test_activity_tasks_only_fire_on_commit` (on_commit
swallows callbacks → `.delay.call_count == 0` despite a 200 response).

### RESEARCH Pitfall 9 — pytest.mark.django_db never commits

`@pytest.mark.django_db` wraps each test in a transaction that's
rolled back at test end. Without intervention, callbacks registered
via `transaction.on_commit` would NEVER fire under the test runner.

The 3 new tests work around this by patching the LOCAL view-module
binding `plane.app.views.issue.timeline_propagation.transaction.on_commit`
with `side_effect=lambda fn: fn()` (or `lambda fn: None` for the
swallow case). Patching `django.db.transaction.on_commit` directly
would NOT intercept the rebound name (after
`from django.db import transaction`, the view's `transaction.on_commit`
attribute resolves through the module object, not through Django's
import path).

## Backlog

- **`IssueBulkUpdateDateEndpoint` cleanup** (`apps/api/plane/app/views/issue/base.py:1093-1170`):
  - Migrate the per-pair `issue_activity.delay(...)` calls to
    `transaction.on_commit(lambda ...: issue_activity.delay(...))` to
    close the latent pre-commit-`.delay` bug (RESEARCH Pitfall 7).
  - Add `updated_at` to the `bulk_update` field list — currently the
    endpoint runs `Issue.objects.bulk_update(issues_to_update,
    ["start_date", "target_date"])` and does NOT update `updated_at`,
    so consumer caches see stale `updated_at` after a bulk move
    (RESEARCH Pitfall 6).

  These are out of scope for Phase 3 per CONTEXT API-11 (the existing
  endpoint stays untouched). Tracked as a doc-only reference in the
  view module docstring.

## Deviations from plan

### 1. [Spec drift] Test stub used `workspace.owner` — actual fixture is `create_user`

**Found during:** Task 1, before running RED.

**Issue:** The plan's behavior section showed
`ProjectMemberFactory(project=project, member=workspace.owner, role=20)`
but the `workspace` fixture in `apps/api/plane/tests/conftest.py:126-140`
is owned by `create_user`, and `Workspace.owner` is a foreign key —
direct attribute reads work, but the existing tests in this file all
use `create_user` (e.g. `_build_member_project(workspace, create_user)`)
rather than `workspace.owner` to ensure the requesting user matches
the project member.

**Fix:** Used `_build_member_project(workspace, create_user)` and
added `create_user` to each test method's signature, mirroring the
established `TestTimelinePropagationView` style. No behavior change
relative to the plan's intent — the same user authenticates and
becomes a project member.

**Files modified:** `apps/api/plane/tests/contract/app/test_timeline_propagation.py`.

**Commit:** `6d91d88cac`.

## Auth gates encountered

None. Plan was fully autonomous; no `human-action` checkpoints.

## TDD compliance

This plan's task was marked `tdd="true"`. The cycle was clean:

- **RED commit (`6d91d88cac`):** added 3 failing tests; pytest output
  was `AttributeError: module 'plane.app.views.issue.timeline_propagation'
  has no attribute 'issue_activity'` — exactly the expected failure
  for tests that patch a name that doesn't exist yet in the view
  module.
- **GREEN commit (`37bb69ed96`):** added 3 imports + 3 on_commit
  registration blocks (2 `issue_activity.delay` + 1 `model_activity.delay`)
  + updated the docstring; all 26 contract tests + 64 unit tests
  GREEN.
- **REFACTOR:** none needed — the implementation is the minimal shape
  the tests pin.

## Threat Flags

None. Every file modified in this plan is already in the threat model
(`apps/api/plane/app/views/issue/timeline_propagation.py`,
`apps/api/plane/tests/contract/app/test_timeline_propagation.py`); the
threat register's mitigate dispositions are all met:

- T-03-03-01 (audit-log forgery via rollback) → every `.delay` wrapped
  in `transaction.on_commit`; pinned by
  `test_activity_tasks_only_fire_on_commit` and
  `test_activity_tasks_not_invoked_on_failure`.
- T-03-03-02 (late-binding loop variable) → every lambda uses
  `inst=inst, pre=pre` default-arg capture; pinned by
  `test_activity_tasks_register_per_updated_issue` asserting distinct
  `issue_id`/`model_id` values across the patched call_args_list.
- T-03-03-03 (PII in audit payloads) → only `start_date` /
  `target_date` strings + UUIDs + epoch — same disclosure profile as
  `views/issue/base.py:1141-1166`. Accepted.
- T-03-03-04 (webhook signature `origin` mismatch) →
  `base_host(request=request, is_app=True)` matches
  `views/module/base.py:715` exactly. Accepted.
- T-03-03-05 (Celery task flooding) → algorithm `LIMIT=100` (Phase 2)
  caps the propagation set; max ~300 task registrations per request.

## Self-Check: PASSED

**Files exist:**

- ✅ `apps/api/plane/app/views/issue/timeline_propagation.py` (FOUND, 379 lines)
- ✅ `apps/api/plane/tests/contract/app/test_timeline_propagation.py` (FOUND, 1072 lines)

**Modified files contain expected additions:**

- ✅ View module imports `json`, `DjangoJSONEncoder`, `issue_activity`,
  `model_activity`, `base_host`.
- ✅ View module: 3 `transaction.on_commit(` matches, 3 code-site
  `lambda inst=inst, pre=pre` matches, 2 `issue_activity.delay(`
  matches (start + target), 1 `model_activity.delay(` match (looped).
- ✅ View module marker comment `# Plan 03-03: transaction.on_commit
  registrations go here` is REPLACED (no longer present in file).
- ✅ View module docstring updated with step 4f + Pitfall 4 / 7
  paragraph + API-11 backlog reference.
- ✅ `apps/api/plane/app/views/issue/base.py` UNCHANGED (no
  `transaction.on_commit` matches — API-11 honored).
- ✅ `transaction.on_commit` is the FIRST occurrence anywhere in
  `apps/api/plane` outside the new view + the test patches.

**Commits exist:**

- ✅ `6d91d88cac` test(03-03): add 3 RED contract tests for transaction.on_commit fan-out
- ✅ `37bb69ed96` feat(03-03): wire transaction.on_commit fan-out for issue/model_activity

**Tests GREEN:**

- ✅ 26/26 in `plane/tests/contract/app/test_timeline_propagation.py`
  (3 new + 23 prior).
- ✅ 64/64 in `plane/tests/unit/services/timeline_propagation/`
  (Phase 1+2 unchanged).
- ✅ `views/issue/base.py` unchanged → API-11 unbroken.
