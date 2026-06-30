---
phase: 02-transactional-project-creation
plan: 02-01
subsystem: api
tags: [django, drf, transactions, on-commit, project-creation, template-id, tdd]

# Dependency graph
requires:
  - phase: 01-template-catalog-foundation
    provides: ProjectTemplate payload schema and reference keys used by Phase 02 contract tests
provides:
  - Shared transactional Project creation service used by app and v1 create routes
  - Optional write-only template_id input on ProjectSerializer (app) and ProjectCreateSerializer (v1)
  - Contract coverage proving no-template parity, rollback isolation, and post-commit activity robustness
affects:
  - 02-02 transactional project creation plan (template apply branch)
  - 02-03 transactional project creation plan (starter issue fan-out)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Shared service-layer transaction.atomic boundary across app and v1 create routes
    - transaction.on_commit(..., robust=True) for post-commit Celery dispatch
    - write_only UUID serializer field with allow_null=True for optional resource references
    - explicit-fields serializer lists must mirror new write_only fields

key-files:
  created:
    - apps/api/plane/app/services/__init__.py
    - apps/api/plane/app/services/project_creation.py
  modified:
    - apps/api/plane/app/serializers/project.py
    - apps/api/plane/api/serializers/project.py
    - apps/api/plane/app/views/project/base.py
    - apps/api/plane/api/views/project.py
    - apps/api/plane/tests/contract/app/test_project_app.py
    - apps/api/plane/tests/contract/api/test_projects.py

key-decisions:
  - "Single transaction.atomic boundary in create_project_with_optional_template; both routes delegate to it"
  - "App route creates ProjectIdentifier inside the atomic block; v1 route preserves its existing omission (is_app_origin flag controls divergence)"
  - "template_id declared as write_only UUIDField so it never reaches the Project model row or response payload"
  - "Blank template_id rejected at the field layer via UUIDField default allow_blank=False (D-03)"
  - "validate_template_id provided as pass-through hook for follow-up phases that need stricter constraints"
  - "Activity dispatch uses a closure (not functools.partial) so Django's robust on_commit logging reads func.__qualname__ cleanly"

patterns-established:
  - "Pattern: D-03 input parity — omitted/null template_id flows through the no-template path; blank string is a serializer-level 400"
  - "Pattern: D-06 isolation — patch the shared service's create_default_project_states to prove no partial rows after rollback"
  - "Pattern: D-08 robustness — patch the shared service's model_activity symbol to prove post-commit dispatch failure does not flip 201 to 500"

requirements-completed: [CAT-02, CREATE-01, CREATE-02, CREATE-06, VER-01]

coverage:
  - id: D1
    description: "Optional template_id input accepted by app and v1 create serializers without breaking no-template parity"
    requirement: "CAT-02"
    verification:
      - kind: integration
        ref: "apps/api/plane/tests/contract/app/test_project_app.py#TestProjectAPIPost::test_create_project_template_id_none_matches_no_template"
        status: pass
      - kind: integration
        ref: "apps/api/plane/tests/contract/app/test_project_app.py#TestProjectAPIPost::test_create_project_template_id_blank_returns_400_no_project"
        status: pass
      - kind: integration
        ref: "apps/api/plane/tests/contract/api/test_projects.py#TestProjectListCreateAPIEndpoint::test_create_project_template_id_none_matches_no_template"
        status: pass
      - kind: integration
        ref: "apps/api/plane/tests/contract/api/test_projects.py#TestProjectListCreateAPIEndpoint::test_create_project_template_id_blank_returns_400_no_project"
        status: pass
    human_judgment: false
  - id: D2
    description: "No-template Project creation runs inside transaction.atomic and rolls back core writes on failure"
    requirement: "CREATE-02"
    verification:
      - kind: integration
        ref: "apps/api/plane/tests/contract/app/test_project_app.py#TestProjectAPIPost::test_create_project_rolls_back_core_writes_when_default_state_creation_fails"
        status: pass
      - kind: integration
        ref: "apps/api/plane/tests/contract/api/test_projects.py#TestProjectListCreateAPIEndpoint::test_model_activity_not_called_on_rollback"
        status: pass
    human_judgment: false
  - id: D3
    description: "model_activity.delay failure after commit does not change a successful 201 response"
    requirement: "CREATE-02"
    verification:
      - kind: integration
        ref: "apps/api/plane/tests/contract/app/test_project_app.py#TestProjectAPIPost::test_create_project_response_stays_201_when_broker_dispatch_fails"
        status: pass
      - kind: integration
        ref: "apps/api/plane/tests/contract/api/test_projects.py#TestProjectListCreateAPIEndpoint::test_response_still_201_when_broker_dispatch_fails"
        status: pass
    human_judgment: false
  - id: D4
    description: "Existing v1 no-template parity and rollback coverage continues to hold after refactor"
    requirement: "CREATE-01"
    verification:
      - kind: integration
        ref: "apps/api/plane/tests/contract/api/test_projects.py#TestProjectListCreateAPIEndpoint::test_create_project_with_lead_as_creator"
        status: pass
      - kind: integration
        ref: "apps/api/plane/tests/contract/api/test_projects.py#TestProjectListCreateAPIEndpoint::test_create_project_with_lead_as_other_user"
        status: pass
      - kind: integration
        ref: "apps/api/plane/tests/contract/api/test_projects.py#TestProjectListCreateAPIEndpoint::test_create_project_without_lead"
        status: pass
      - kind: integration
        ref: "apps/api/plane/tests/contract/api/test_projects.py#TestProjectListCreateAPIEndpoint::test_create_project_with_lead_not_in_workspace_returns_400"
        status: pass
    human_judgment: false
  - id: D5
    description: "App-side create response preserves project_lead admin membership and ProjectUserProperty creation"
    requirement: "CREATE-06"
    verification:
      - kind: integration
        ref: "apps/api/plane/tests/contract/app/test_project_app.py#TestProjectAPIPost::test_create_project_with_project_lead"
        status: pass
      - kind: integration
        ref: "apps/api/plane/tests/contract/app/test_project_app.py#TestProjectAPIPost::test_create_project_with_all_optional_fields"
        status: pass
    human_judgment: false

# Metrics
duration: 45min
completed: 2026-06-30
status: complete
---

# Phase 2 Plan 1: Shared Transactional Project Creation Service Summary

**Introduced a shared `create_project_with_optional_template` service that owns the only `transaction.atomic` boundary for app and v1 project creation, added write-only optional `template_id` to both request serializers, and proved no-template parity plus D-06 rollback isolation plus D-08 post-commit activity robustness via RED-then-GREEN contract tests.**

## Performance

- **Duration:** 45 min
- **Started:** 2026-06-30T14:57:37Z
- **Completed:** 2026-06-30T15:42:00Z
- **Tasks:** 2 (both auto with TDD)
- **Files modified:** 8 (2 new service files, 4 source modifications, 2 test extensions)

## Accomplishments

- New `apps/api/plane/app/services/project_creation.py` exposes `create_project_with_optional_template`, `create_default_project_states`, and `enqueue_project_activity_on_commit`. The service is the only place in the codebase that wraps `Project` + `ProjectIdentifier` (app path only) + admin `ProjectMember` rows + `DEFAULT_STATES` inside one `transaction.atomic` block; the activity dispatch is registered via `transaction.on_commit(..., robust=True)` so broker failures no longer flip a successful commit to a 500.
- `ProjectSerializer` (app) and `ProjectCreateSerializer` (v1) now accept an optional, write-only `template_id` UUID field. Omitted or null `template_id` flows through the no-template path; blank strings are rejected by the field-layer validator and produce a 400 with zero persisted rows.
- `ProjectViewSet.create` and `ProjectListCreateAPIEndpoint.post` now delegate to the shared service, keeping their existing response serializers (`ProjectListSerializer` and `ProjectSerializer` respectively) so client-facing shapes do not change.
- Two TDD commits landed: a `test(02-01)` commit that adds the failing contract cases (template_id None / blank, rollback probe, broker-failure probe on both routes), and a `feat(02-01)` commit that introduces the service and rewires both views plus both serializers. Both routes' contract test files (`apps/api/plane/tests/contract/app/test_project_app.py` and `apps/api/plane/tests/contract/api/test_projects.py`) pass with 37/37 green.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add RED no-template and template_id contract coverage** - `c4bc54eee` (test)
2. **Task 2: Implement shared no-template transaction service** - `d702b2cdf` (feat)

## Files Created/Modified

- `apps/api/plane/app/services/__init__.py` (new) - side-effect-free package init
- `apps/api/plane/app/services/project_creation.py` (new) - shared transactional service
- `apps/api/plane/app/serializers/project.py` - added `template_id` field + `validate_template_id`, `ProjectIdentifier` creation moved into service
- `apps/api/plane/api/serializers/project.py` - added `template_id` field + `validate_template_id`, included `template_id` in explicit `fields` list, pop in `create()`
- `apps/api/plane/app/views/project/base.py` - `create()` delegates to `create_project_with_optional_template`
- `apps/api/plane/api/views/project.py` - `post()` delegates to `create_project_with_optional_template`; dropped unused `transaction` import
- `apps/api/plane/tests/contract/app/test_project_app.py` - 4 new tests for D-03 / D-06 / D-08 on the app route
- `apps/api/plane/tests/contract/api/test_projects.py` - 2 new tests for D-03 on the v1 route; existing rollback / broker-failure tests re-targeted to the new service module

## Decisions Made

- **Single atomic boundary location.** All create-route core writes (Project, ProjectIdentifier on the app path, admin ProjectMember rows, DEFAULT_STATES) go through `create_project_with_optional_template`. Both views become thin shells around the shared call. Future template-application logic lives in a sibling service (`project_template_apply.py`) that this plan deliberately does not introduce — its scope is locked to the no-template path.
- **App-vs-v1 ProjectIdentifier divergence preserved via `is_app_origin`.** The legacy app route always created a `ProjectIdentifier` alongside the Project; the legacy v1 route never did. Rather than silently changing the v1 contract, the service takes an `is_app_origin` flag and only writes the ProjectIdentifier when the app route calls in. This keeps existing v1 client behavior byte-identical and makes the divergence explicit at the call site.
- **`template_id` declared as a write-only `UUIDField` with `allow_null=True`.** This rejects blank strings at the field layer (default `allow_blank=False`), accepts both omitted and explicit null, and never serializes back into responses (the field is not on the Project model). No model migration is required.
- **`validate_template_id` is a pass-through.** The field-level validator handles D-03 already, but the explicit hook exists so follow-up phases can resolve the template here (e.g., surface missing-template as a 404) without touching the view layer.
- **Activity dispatch uses a closure, not `functools.partial`.** Django's robust on_commit logging reads `func.__qualname__` to format the error message; partials don't carry that dunder cleanly when the wrapped callable is a mock.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added `template_id` to the v1 serializer's explicit `fields` list**

- **Found during:** Task 2 (GREEN implementation), running the v1 contract suite
- **Issue:** `ProjectCreateSerializer` uses an explicit `fields = [...]` whitelist (not `fields = "__all__"`). After declaring `template_id = serializers.UUIDField(...)`, DRF raised `AssertionError: The field 'template_id' was declared on serializer ProjectCreateSerializer, but has not been included in the 'fields' option.` The first v1 contract test failed at serializer instantiation.
- **Fix:** Added `"template_id"` to the end of the `ProjectCreateSerializer.Meta.fields` list (matching the app-side `ProjectSerializer` which uses `fields = "__all__"` and so did not need an edit). The app-side serializer needed no change because it opts into `__all__`.
- **Files modified:** `apps/api/plane/api/serializers/project.py`
- **Verification:** Re-ran `pytest plane/tests/contract/api/test_projects.py` — all 8 v1 tests pass.
- **Committed in:** `d702b2cdf` (amended into Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Cosmetic correction forced by an explicit-fields serializer; no scope creep, no behavior change beyond making the new field reachable.

## Issues Encountered

- The Docker test harness required an `apps/api/.env` file in the worktree; symlinked the main repo's `.env` into the worktree (untracked, gitignored). This is expected when a worktree is created from a different branch than where the env was generated.
- Eight pre-existing failures in `plane/tests/contract/app/test_authentication.py` (magic-link tests hitting 429 rate limits when run as a batch) are unrelated to this plan. Confirmed by running one of them in isolation on the parent commit — it passes. Not in scope for Phase 02-01.

## User Setup Required

None - no external service configuration required. The test stack (`docker-compose-test.yml`) was already running.

## Next Phase Readiness

- The shared service is ready for the template-application branch in plan 02-02. The `create_project_with_optional_template` signature already accepts `is_app_origin`; template resolution and application belong in a new `apps/api/plane/app/services/project_template_apply.py` module that wraps the no-template service call when `template_id` is present.
- The `validate_template_id` pass-through hook is the planned seam for downstream template resolution (e.g., 404 for missing / inactive / foreign-workspace templates per D-02).
- The existing rollback and broker-failure tests now patch the shared service module — follow-up plans can extend the same probe pattern for the template path without adding new patch targets.

---

_Phase: 02-transactional-project-creation_
_Completed: 2026-06-30_

## Self-Check: PASSED

- `.planning/phases/02-transactional-project-creation/02-01-SUMMARY.md` present
- `c4bc54eee` (Task 1 test commit) present in `git log`
- `d702b2cdf` (Task 2 feat commit) present in `git log`
- All 37 contract tests green (`pytest plane/tests/contract/app/test_project_app.py plane/tests/contract/api/test_projects.py`)
