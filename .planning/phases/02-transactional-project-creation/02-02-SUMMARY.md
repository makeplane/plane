---
phase: 02-transactional-project-creation
plan: 02-02
subsystem: api
tags: [django, drf, transactions, template-apply, project-creation, built-in-templates, tdd]

# Dependency graph
requires:
  - phase: 02-transactional-project-creation
    plan: 02-01
    provides: create_project_with_optional_template shared service with optional template_id input on both serializers
  - phase: 01-template-catalog-foundation
    provides: BUILT_IN_PROJECT_TEMPLATES, validate_project_template_payload, ProjectTemplate model
provides:
  - "Template apply service: resolve_available_project_template, apply_project_template, resolve_relative_template_dates"
  - "End-to-end built-in template Project creation on the app route with generated states, labels, modules, cycles, starter issues, and join rows in one transaction"
  - "App + v1 create routes forward template_id to the shared service for resolution"
affects:
  - "02-03 transactional project creation plan (custom-template branch + starter issue fan-out)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Q(...)|Q(...) single-query template availability resolver for active global built-ins and active workspace customs"
    - "bulk_create for State/Label/Module/Cycle to bypass auto-assignment save hooks so payload sequence/order/sort_order wins (D-09/D-10)"
    - "disable_auto_set_user=True kwarg to bypass BaseModel.save's get_current_user auto-derivation when service helpers run outside a view"
    - "Per-section private helpers (_create_template_states, _create_template_labels, _create_template_modules, _create_template_cycles, _create_template_starter_issues) for independent testability"
    - "Issue.objects.create(disable_auto_set_user=True) for starter issues so the BaseModel.save chain does not clear created_by when no request-user context is bound"

key-files:
  created:
    - "apps/api/plane/app/services/project_template_apply.py"
    - "apps/api/plane/tests/unit/services/test_project_template_apply.py"
    - "apps/api/plane/tests/contract/app/test_project_template_creation_app.py"
  modified:
    - "apps/api/plane/app/services/project_creation.py"
    - "apps/api/plane/app/views/project/base.py"
    - "apps/api/plane/api/views/project.py"

key-decisions:
  - "Single availability query: Q(is_system=True, is_active=True, workspace__isnull=True) | Q(is_system=False, is_active=True, workspace_id=workspace.id) — matches the existing catalog list query and treats missing/inactive/foreign templates as one indistinguishable 404 case (D-01/D-02)."
  - "Template branch skips DEFAULT_STATES entirely (D-07). The apply service only runs when a ProjectTemplate resolves, so DEFAULT_STATES is unreachable on the template path."
  - "bulk_create for State/Label/Module/Cycle — State.save() would auto-bump sequence from last_id+15000, Label.save() would auto-bump sort_order from last_id+10000, Module.save()/Cycle.save() would auto-decrement sort_order from smallest-sort-order-10000. bulk_create is the only path that keeps the payload-derived values intact (D-09/D-10)."
  - "Issue.objects.create(disable_auto_set_user=True) with created_by/updated_by pre-set on the instance — Issue.save() runs the project advisory lock + IssueSequence path and BaseModel.save() at the top of the MRO would otherwise clear created_by when get_current_user() returns None (D-16)."
  - "Cycle.start_date/end_date are stored as DateTimeField so the helper combines the resolved date with midnight via timezone.make_aware — prevents silent date coercion to naive UTC midnight at the model layer."
  - "ProjectTemplateApplicationError subclasses serializers.ValidationError so callers already handling DRF validation errors propagate the apply failure through the same response path (400 with the underlying message)."
  - "Module and Cycle sort_order fall back to 10000 + index * 10000 (zero-based payload array index) when the payload entry has no explicit order, giving stable initial ordering without relying on save-hook timing (D-10)."

patterns-established:
  - "Pattern: D-13 hard failure — starter issue reference resolution raises ProjectTemplateApplicationError instead of silently skipping the link, so the entire create transaction rolls back."
  - "Pattern: D-15 precedence — target_offset_days wins over duration_days for cycle/module date resolution, with duration_days as a fallback only when target_offset_days is absent."
  - "Pattern: D-04 re-validation — apply service runs validate_project_template_payload(template.payload) inside the create transaction before any writes, blocking stale or corrupted payloads from leaking into Project rows."

requirements-completed: [CREATE-03, CREATE-04, GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, GEN-06, GEN-07, VER-02]

coverage:
  - id: D1
    description: "Built-in template Project creation writes generated content in one transaction"
    requirement: "CREATE-03"
    verification:
      - kind: integration
        ref: "apps/api/plane/tests/contract/app/test_project_template_creation_app.py::TestProjectTemplateCreationApp::test_create_project_with_software_template_persists_generated_content"
        status: pass
      - kind: integration
        ref: "apps/api/plane/tests/contract/app/test_project_template_creation_app.py::TestProjectTemplateCreationApp::test_create_project_with_marketing_template_creates_seven_day_cycle"
        status: pass
      - kind: integration
        ref: "apps/api/plane/tests/contract/app/test_project_template_creation_app.py::TestProjectTemplateCreationApp::test_create_project_with_operations_template_creates_thirty_day_cycle"
        status: pass
    human_judgment: false
  - id: D2
    description: "Apply service covers all three built-in templates (VER-02)"
    requirement: "VER-02"
    verification:
      - kind: unit
        ref: "apps/api/plane/tests/unit/services/test_project_template_apply.py::TestApplyProjectTemplateSoftwareProject"
        status: pass
      - kind: unit
        ref: "apps/api/plane/tests/unit/services/test_project_template_apply.py::TestApplyProjectTemplateMarketingCampaign"
        status: pass
      - kind: unit
        ref: "apps/api/plane/tests/unit/services/test_project_template_apply.py::TestApplyProjectTemplateOperationsProject"
        status: pass
    human_judgment: false
  - id: D3
    description: "Generated states preserve payload sequence and default; no DEFAULT_STATES duplication (D-07)"
    requirement: "GEN-01"
    verification:
      - kind: unit
        ref: "apps/api/plane/tests/unit/services/test_project_template_apply.py::TestApplyProjectTemplateSoftwareProject::test_apply_creates_states_for_software_project"
        status: pass
    human_judgment: false
  - id: D4
    description: "Generated labels/modules/cycles preserve payload order and sort metadata (D-10)"
    requirement: "GEN-02"
    verification:
      - kind: unit
        ref: "apps/api/plane/tests/unit/services/test_project_template_apply.py::TestApplyProjectTemplateSoftwareProject::test_apply_creates_labels_for_software_project"
        status: pass
      - kind: unit
        ref: "apps/api/plane/tests/unit/services/test_project_template_apply.py::TestApplyProjectTemplateSoftwareProject::test_apply_creates_module_with_no_dates_for_software_project"
        status: pass
    human_judgment: false
  - id: D5
    description: "Module and cycle dates resolve from creation_date with target_offset_days precedence (D-14/D-15)"
    requirement: "GEN-03"
    verification:
      - kind: unit
        ref: "apps/api/plane/tests/unit/services/test_project_template_apply.py::TestApplyProjectTemplateSoftwareProject::test_apply_creates_cycle_with_offset_dates"
        status: pass
      - kind: unit
        ref: "apps/api/plane/tests/unit/services/test_project_template_apply.py::TestApplyProjectTemplateMarketingCampaign::test_apply_creates_cycle_with_seven_day_target_offset"
        status: pass
      - kind: unit
        ref: "apps/api/plane/tests/unit/services/test_project_template_apply.py::TestApplyProjectTemplateOperationsProject::test_apply_creates_cycle_with_thirty_day_target_offset"
        status: pass
    human_judgment: false
  - id: D6
    description: "Starter issues resolve to explicit state and generated module/cycle/label links (D-11/D-12)"
    requirement: "GEN-05"
    verification:
      - kind: unit
        ref: "apps/api/plane/tests/unit/services/test_project_template_apply.py::TestApplyProjectTemplateSoftwareProject::test_apply_creates_starter_issue_with_state_and_links"
        status: pass
      - kind: unit
        ref: "apps/api/plane/tests/unit/services/test_project_template_apply.py::TestApplyProjectTemplateMarketingCampaign::test_apply_creates_starter_issue_with_label_links"
        status: pass
      - kind: unit
        ref: "apps/api/plane/tests/unit/services/test_project_template_apply.py::TestApplyProjectTemplateOperationsProject::test_apply_creates_starter_issue_with_module_and_cycle"
        status: pass
    human_judgment: false
  - id: D7
    description: "Starter issues have no assignees or subscribers; creator is the request user (D-16/D-17)"
    requirement: "GEN-07"
    verification:
      - kind: unit
        ref: "apps/api/plane/tests/unit/services/test_project_template_apply.py::TestApplyProjectTemplateSoftwareProject::test_apply_creates_starter_issue_with_state_and_links"
        status: pass
      - kind: unit
        ref: "apps/api/plane/tests/unit/services/test_project_template_apply.py::TestApplyProjectTemplateMarketingCampaign::test_apply_creates_starter_issue_with_label_links"
        status: pass
    human_judgment: false
  - id: D8
    description: "Apply service re-validates payload and rolls back on validation failure (D-04/D-05)"
    requirement: "CREATE-04"
    verification:
      - kind: unit
        ref: "apps/api/plane/tests/unit/services/test_project_template_apply.py::TestApplyProjectTemplateErrors::test_apply_revalidates_payload_before_writes"
        status: pass
      - kind: unit
        ref: "apps/api/plane/tests/unit/services/test_project_template_apply.py::TestApplyProjectTemplateErrors::test_apply_rolls_back_when_validation_fails"
        status: pass
    human_judgment: false
  - id: D9
    description: "Cycle owned_by is the request user (D-16)"
    requirement: "GEN-04"
    verification:
      - kind: unit
        ref: "apps/api/plane/tests/unit/services/test_project_template_apply.py::TestApplyProjectTemplateSoftwareProject::test_apply_creates_cycle_with_offset_dates"
        status: pass
      - kind: unit
        ref: "apps/api/plane/tests/unit/services/test_project_template_apply.py::TestApplyProjectTemplateMarketingCampaign::test_apply_creates_starter_issue_with_label_links"
        status: pass
    human_judgment: false
  - id: D10
    description: "Existing no-template parity, rollback isolation, and broker-failure contract coverage continue to hold"
    requirement: "CREATE-01"
    verification:
      - kind: integration
        ref: "apps/api/plane/tests/contract/app/test_project_app.py"
        status: pass
      - kind: integration
        ref: "apps/api/plane/tests/contract/api/test_projects.py"
        status: pass
    human_judgment: false

# Metrics
duration: 25min
completed: 2026-06-30
status: complete
---

# Phase 2 Plan 2: Built-in Template Project Creation Summary

**Implemented the first complete template creation path: built-in templates (`software-project`, `marketing-campaign`, `operations-project`) now persist generated states, labels, modules, cycles, starter issues, and join rows inside the same transaction as the Project creation, with no DEFAULT_STATES duplication. Verified end-to-end via 17 new tests (14 unit + 3 contract) plus 37 prior tests still green.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-30T15:30:25Z
- **Completed:** 2026-06-30T15:55:00Z
- **Tasks:** 2 (both auto with TDD)
- **Files modified:** 5 created + 3 source modifications + 2 test files

## Accomplishments

- New `apps/api/plane/app/services/project_template_apply.py` exposes `resolve_available_project_template`, `apply_project_template`, and `resolve_relative_template_dates`. The apply service re-validates the saved payload (D-04), creates `State` / `Label` / `Module` / `Cycle` rows from the payload sections, builds generated object maps, and resolves starter issue references through those maps with hard failure on any missing key (D-13). Starter issues are created with explicit `state=state_by_key[...]` (D-11) and empty assignee/subscriber relations (D-17); module/cycle `owned_by` and `created_by` are stamped to the request user (D-16).
- `bulk_create` is used for `State`, `Label`, `Module`, and `Cycle` so the model `save` hooks (auto-sequence, auto-sort-order, smallest-sort-order-decrement) do not clobber the explicit payload values (D-09/D-10). Starter issues still go through `Issue.objects.create()` because the `Issue.save` advisory-lock + `IssueSequence` write path is required, with `disable_auto_set_user=True` so the `BaseModel.save` chain does not clear `created_by` when the service runs outside a view request context.
- `apps/api/plane/app/services/project_creation.py` was extended with a `template_id` keyword. When the resolved `ProjectTemplate` is not `None`, the apply service runs inside the existing `transaction.atomic()` block instead of `create_default_project_states`, so template-created Projects never contain duplicated default states (D-07) and any failure in the apply branch rolls back the entire create transaction (D-05).
- `apps/api/plane/app/views/project/base.py` and `apps/api/plane/api/views/project.py` now forward `template_id` from `serializer.validated_data.get("template_id")` into the shared service so both routes share the same resolution + apply path. The serializer-level `template_id` pop (added in 02-01) prevents the value from leaking into the `Project` row.
- `ProjectTemplateApplicationError` subclasses `serializers.ValidationError` so callers already handling DRF validation errors propagate the apply failure through the same 400 response path.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add RED built-in template apply tests** - `54fc2263f` (test)
2. **Task 2: Implement template availability and apply service** - `d7ab0d9e3` (feat)

## Files Created/Modified

- `apps/api/plane/app/services/project_template_apply.py` (new) - apply service with availability resolver, per-section row creation helpers, starter issue resolution, and relative date helper
- `apps/api/plane/app/services/project_creation.py` - `create_project_with_optional_template` accepts `template_id` and routes to `apply_project_template` when a template resolves for the workspace
- `apps/api/plane/app/views/project/base.py` - app POST forwards `template_id` from validated_data
- `apps/api/plane/api/views/project.py` - v1 POST forwards `template_id` from validated_data
- `apps/api/plane/tests/unit/services/test_project_template_apply.py` (new) - 14 unit tests covering all three built-ins, GEN-01..GEN-07, D-14/D-15, D-04/D-05/D-13, and `resolve_relative_template_dates` precedence
- `apps/api/plane/tests/contract/app/test_project_template_creation_app.py` (new) - 3 contract tests exercising the app POST route with `template_id` for each built-in

## Decisions Made

- **Single availability query.** `Q(is_system=True, is_active=True, workspace__isnull=True) | Q(is_system=False, is_active=True, workspace_id=workspace.id)` is the canonical lookup, matching the existing `WorkspaceProjectTemplateViewSet` list query shape. Missing, inactive, and foreign-workspace templates all collapse to `None` so the view layer can surface a generic 404 per D-02 without distinguishing the failure mode.
- **`bulk_create` for generated rows.** State, Label, Module, and Cycle each have a `save` hook that would overwrite explicit payload values (`State.sequence` → `last_id + 15000`, `Label.sort_order` → `last_id + 10000`, `Module.sort_order` and `Cycle.sort_order` → `smallest - 10000`). `bulk_create` bypasses the hooks so payload `sequence`/`order`/`sort_order` win (D-09/D-10).
- **`disable_auto_set_user=True` for starter issues.** `Issue.save` runs the advisory-lock + `IssueSequence` write path and ultimately invokes `BaseModel.save` which re-derives `created_by` from the request-user thread-local. When the apply service runs from a service helper (outside a view), `get_current_user()` returns None and `created_by` would be cleared. Setting `created_by`/`updated_by` on the instance before `save` and passing `disable_auto_set_user=True` keeps D-16 in force without bypassing any of the necessary write paths.
- **Cycle `start_date` / `end_date` as `DateTimeField`.** The model stores these as `DateTimeField`, so the helper combines the resolved `date` with midnight via `timezone.make_aware`. This prevents silent naive-UTC coercion at the model layer.
- **Per-section private helpers.** `_create_template_states`, `_create_template_labels`, `_create_template_modules`, `_create_template_cycles`, and `_create_template_starter_issues` are private so each generated section can be reasoned about (and unit-tested) independently without touching the full apply orchestration.
- **`ProjectTemplateApplicationError` subclasses `serializers.ValidationError`.** The apply service raises on D-04 re-validation failure or D-13 missing-reference. Subclassing `serializers.ValidationError` keeps a single error-handling path through the view layer.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `resolve_available_project_template` query was not SQL-executable**

- **Found during:** Task 2 (GREEN implementation), running the contract test that POSTs `template_id` for `software-project`
- **Issue:** My initial implementation used `ProjectTemplate.objects.filter(...).values("id") | ProjectTemplate.objects.filter(...).values("id")` to combine the two availability branches. Django's `Q(...) | Q(...)` operator accepts a `Q` or a plain conditional expression — passing a `ValuesQuerySet` produced `TypeError: Cannot filter against a non-conditional expression.` which surfaced as a 500 on the create route.
- **Fix:** Rewrote the resolver as a single `ProjectTemplate.objects.filter(Q(is_system=True, ...) | Q(is_system=False, ...))` using proper `Q` objects, matching the same shape used by `WorkspaceProjectTemplateViewSet`.
- **Files modified:** `apps/api/plane/app/services/project_template_apply.py`
- **Verification:** Re-ran `pytest plane/tests/contract/app/test_project_template_creation_app.py` — all 3 contract tests pass.
- **Committed in:** `d7ab0d9e3` (amended into Task 2 commit)

**2. [Rule 1 - Bug] Starter issue `created_by` was reset to `None` by `BaseModel.save`**

- **Found during:** Task 2 (GREEN implementation), running the software-project starter-issue test
- **Issue:** `Issue.objects.create(created_by=actor)` passes `created_by` as a constructor kwarg → instance attribute. But `Issue.save()` calls `super(Issue, self).save(*args, **kwargs)` → `ProjectBaseModel.save()` → `BaseModel.save()`, which re-derives `created_by` from `get_current_user()`. When the apply service runs outside a view (the unit tests have no request-user thread-local), `get_current_user()` returns `None` and the explicit `created_by` is clobbered.
- **Fix:** Pass `disable_auto_set_user=True` as a save kwarg on `Issue` instances so `BaseModel.save`'s auto-derivation block is skipped while keeping `created_by` / `updated_by` set on the instance before save. The kwargs propagate through `Issue.save()` → `ProjectBaseModel.save()` → `BaseModel.save()` because the latter is the canonical consumer.
- **Files modified:** `apps/api/plane/app/services/project_template_apply.py`
- **Verification:** Re-ran `pytest plane/tests/unit/services/test_project_template_apply.py` — all 14 unit tests pass.
- **Committed in:** `d7ab0d9e3` (amended into Task 2 commit)

**3. [Rule 1 - Bug] Test used `Issue.subscribers` instead of `Issue.issue_subscribers`**

- **Found during:** Task 1 RED run, first unit-test assertion
- **Issue:** The test referenced `starter.subscribers.count()` but the `Issue` model exposes subscribers through the reverse relation `issue_subscribers` (the `IssueSubscriber` model's `related_name` is `issue_subscribers`, not `subscribers`). DRF's reverse-relation naming is `IssueSubscriber.issue.issue_subscribers`, not `Issue.subscribers`.
- **Fix:** Updated the two assertions to use `starter.issue_subscribers.count() == 0`.
- **Files modified:** `apps/api/plane/tests/unit/services/test_project_template_apply.py`
- **Verification:** All 14 unit tests pass after the rename.
- **Committed in:** `54fc2263f` (amended into Task 1 commit)

---

**Total deviations:** 3 auto-fixed (3 bugs)
**Impact on plan:** Cosmetic / behavior-preserving fixes forced by the existing model `save` chain and Django Q-object semantics. No scope creep, no behavior change beyond making the new apply path land the values that D-16 mandates.

## Issues Encountered

- The worktree was branched from upstream `preview` (commit `90ae8457d`) instead of from `dev` (`b6333d22c`) on first dispatch, so the phase 1/2 dependencies were missing on initial state. Resolved by fast-forward merging the `dev` branch into the worktree branch before any task commit. All subsequent task commits land on top of `b6333d22c` and depend on the prior phase work being present.
- The Docker test harness required an `apps/api/.env` file in the worktree; mirrored the parent repo's `.env` into the worktree (untracked, gitignored).
- The parent's docker-compose test stack was already running on the shared `resources_test_env` network. The worktree's docker-compose creates its own isolated `agent-a69e13d3297609505_test_env` network so it doesn't contend with the parent's test database.

## User Setup Required

None - no external service configuration required. The test stack (`docker-compose-test.yml`) is already running in the parent repo.

## Next Phase Readiness

- The shared service now runs the full template-apply path inside one `transaction.atomic()` block. Phase 02-03 will extend the contract coverage to the v1 route and wire the custom-template branch (and the `WorkspaceMember`-gated permission check that follows from CREATE-03).
- The `validate_template_id` pass-through hook on both serializers remains the planned seam for downstream resolution (e.g., generic 404 for missing/inactive/foreign templates per D-02) without touching the create views.
- The apply service's per-section helpers are reusable as the patch targets for future rollback / probe tests covering the template path, following the same pattern `02-01` established for the no-template path.

---

_Phase: 02-transactional-project-creation_
_Completed: 2026-06-30_

## Self-Check: PASSED

- `.planning/phases/02-transactional-project-creation/02-02-SUMMARY.md` present
- `54fc2263f` (Task 1 test commit) present in `git log`
- `d7ab0d9e3` (Task 2 feat commit) present in `git log`
- All 14 unit tests pass (`pytest plane/tests/unit/services/test_project_template_apply.py`)
- All 3 contract tests pass (`pytest plane/tests/contract/app/test_project_template_creation_app.py`)
- All 29 prior app route tests still green (`pytest plane/tests/contract/app/test_project_app.py`)
- All 8 prior v1 route tests still green (`pytest plane/tests/contract/api/test_projects.py`)
