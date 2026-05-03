---
phase: 3
slug: propagation-api-endpoint-persistence-contract
status: draft
nyquist_compliant: true
wave_0_complete: false  # Wave 0 fixture work executes inside Plan 03-01 Task 1
created: 2026-05-04
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `03-RESEARCH.md` § "Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 9.0.3 + pytest-django 4.5.2 + pytest-mock 3.11.1 + factory-boy 3.3.0 |
| **Config file** | `apps/api/pytest.ini` (defaults: `--reuse-db --nomigrations -vs`; markers: `unit/contract/smoke/slow`; settings: `plane.settings.test`) |
| **Quick run command** | `cd apps/api && python run_tests.py -c` |
| **Full suite command** | `cd apps/api && python run_tests.py` |
| **Coverage gate command** | `cd apps/api && python run_tests.py -c -o` (enforces `--fail-under=90`) |
| **Single-file run** | `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/contract/app/test_timeline_propagation.py -v` |
| **Estimated runtime** | ~6–15s for the new contract file (with `--reuse-db`); full suite ~60–90s |

---

## Sampling Rate

- **After every task commit:** `cd apps/api && python run_tests.py -c` — runs all `@pytest.mark.contract` tests including the new file.
- **After every plan wave:** `cd apps/api && python run_tests.py` — full unit + contract + smoke; verifies Phase 1+2's 64/64 GREEN unit tests still pass and Phase 3's contract additions are GREEN.
- **Before `/gsd-verify-work`:** Full suite + coverage (`python run_tests.py -o`); must show ≥90% project-wide coverage and zero new failures (the 5 pre-existing failures noted in Phase 1's `deferred-items.md` remain out of scope).
- **Max feedback latency:** ≤30 seconds for the per-task signal.

---

## Per-Task Verification Map

> The planner fills this table from `03-RESEARCH.md` § "Phase Requirements → Test Map".
> Each task in each PLAN.md MUST cite the test command that verifies it.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-T1 | 03-01 | 1 | (helper) | T-03-01-05 | `IssueFactory` / `IssueRelationFactory` / `StateFactory` extension to `apps/api/plane/tests/factories.py` (Wave-0 fixture base used by every Phase 3 test) | shared util | `pytest plane/tests/contract/app/test_timeline_propagation.py -k "factory" -v` | ❌ W0 | ⬜ pending |
| 03-01-T2 | 03-01 | 1 | API-01 | T-03-01-02 | URL routes to view; `reverse("project-timeline-propagation")` resolves to canonical path | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::TestTimelinePropagation::test_url_reverses -v` | ❌ W0 | ⬜ pending |
| 03-01-T2 | 03-01 | 1 | API-09 / TEST-18 (partial) | T-03-01-01 | Unauthenticated POST returns DRF 401 (NOT envelope) | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::TestTimelinePropagation::test_unauthenticated_request_returns_401 -v` | ❌ W0 | ⬜ pending |
| 03-01-T2 | 03-01 | 1 | API-11 | T-03-01-04 | Existing `IssueBulkUpdateDateEndpoint` regression (structural smoke; one POST + assertEqual on shape) | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::TestTimelinePropagation::test_existing_bulk_update_endpoint_unchanged -v` | ❌ W0 | ⬜ pending |
| 03-02-T1 | 03-02 | 2 | API-02 | T-03-02-02 | Serializer accepts documented body; `validate_data` carries UUID/date/datetime/int types | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py -k "serializer" -v` | ❌ W0 | ⬜ pending |
| 03-02-T1 | 03-02 | 2 | API-02 / API-10 | T-03-02-02 | DRF default 400 (NOT envelope) for missing field, malformed UUID/date, `operation="resize"` | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::TestTimelinePropagation::test_serializer_rejects_resize_operation -v` | ❌ W0 | ⬜ pending |
| 03-02-T2 | 03-02 | 2 | API-09 / TEST-18 | T-03-02-10 | Permission rejection envelope (non-member → 403, GUEST → 403, dragged-issue-not-in-project → 403) | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py -k "permission_denied" -v` | ❌ W0 | ⬜ pending |
| 03-02-T2 | 03-02 | 2 | API-03 / API-04 / TEST-16 | T-03-02-04 | Success payload shape; `total_updated_count` matches `len(work_items)`; chain propagation A→B→C returns 3 updates with single shared `updated_at` | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::TestTimelinePropagation::test_chain_propagation_returns_200_with_full_payload -v` | ❌ W0 | ⬜ pending |
| 03-02-T2 | 03-02 | 2 | API-03 / API-04 / TEST-16 | T-03-02-04 | Single-`now` invariant: all `updated_at` values across success payload are identical | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::TestTimelinePropagation::test_success_payload_uses_single_now_for_updated_at -v` | ❌ W0 | ⬜ pending |
| 03-02-T2 | 03-02 | 2 | API-05 / API-06 / TEST-17 | T-03-02-05 | `{code, message}` envelope for DEPENDENCY_CYCLE → 422 | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::TestTimelinePropagation::test_dependency_cycle_returns_422_envelope -v` | ❌ W0 | ⬜ pending |
| 03-02-T2 | 03-02 | 2 | API-05 / API-06 / TEST-17 / TEST-10 / PROP-16 | T-03-02-05 | `{code, message}` envelope for PROJECT_BOUNDARY_EXCEEDED → 422 | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::TestTimelinePropagation::test_cross_project_path_returns_422_envelope -v` | ❌ W0 | ⬜ pending |
| 03-02-T2 | 03-02 | 2 | API-05 / API-06 / TEST-17 | T-03-02-05 | `{code, message}` envelope for INCOMPLETE_SCHEDULE → 422 | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::TestTimelinePropagation::test_incomplete_schedule_descendant_returns_422_envelope -v` | ❌ W0 | ⬜ pending |
| 03-02-T2 | 03-02 | 2 | API-05 / API-06 / TEST-17 | T-03-02-08 | `{code, message}` envelope for PROPAGATION_LIMIT_EXCEEDED → 422 (101-issue chain) | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::TestTimelinePropagation::test_propagation_limit_at_101_returns_422_envelope -v` | ❌ W0 | ⬜ pending |
| 03-02-T2 | 03-02 | 2 | API-05 / API-06 / TEST-17 / API-10 | T-03-02-05 | `{code, message}` envelope for INVALID_DATE_RANGE → 422 (algorithm-level, not serializer-level) | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::TestTimelinePropagation::test_invalid_date_range_returns_422_envelope -v` | ❌ W0 | ⬜ pending |
| 03-02-T2 | 03-02 | 2 | API-07 / TEST-13 | T-03-02-04 | Stale `expected_updated_at` → SCHEDULE_CHANGED 409 + envelope; no DB writes | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::TestTimelinePropagation::test_stale_updated_at_returns_409_envelope -v` | ❌ W0 | ⬜ pending |
| 03-02-T2 | 03-02 | 2 | API-08 / TEST-15 | T-03-02-05 | All-or-nothing pinned by `_assert_no_db_writes(snapshot)` helper across all 6 failure tests | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py -k "envelope" -v` (helper invoked in each) | ❌ W0 | ⬜ pending |
| 03-03-T1 | 03-03 | 3 | API-12 | T-03-03-01 / T-03-03-02 | `issue_activity.delay` and `model_activity.delay` register per-issue per-pair on commit only (mocker-patched on_commit + .delay) | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::TestTimelinePropagation::test_activity_tasks_register_per_updated_issue -v` | ❌ W0 | ⬜ pending |
| 03-03-T1 | 03-03 | 3 | API-12 | T-03-03-01 | `.delay()` invocations are zero when `transaction.on_commit` swallows registrations (simulates rollback) | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::TestTimelinePropagation::test_activity_tasks_only_fire_on_commit -v` | ❌ W0 | ⬜ pending |
| 03-03-T1 | 03-03 | 3 | API-12 / API-08 | T-03-03-01 | `.delay()` invocations are zero on domain-failure path (cycle) — proves on_commit registration block sits AFTER `if result.failure is not None: return _error(...)` | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::TestTimelinePropagation::test_activity_tasks_not_invoked_on_failure -v` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/plane/tests/contract/app/test_timeline_propagation.py` — new contract file covering TEST-10, TEST-13, TEST-15, TEST-16, TEST-17, TEST-18 + auxiliary HTTP-status-mapping cases (one per of the 7 error codes per CONTEXT D-14).
- [ ] `apps/api/plane/tests/factories.py` — extend with `IssueFactory`, `IssueRelationFactory`, `StateFactory` (the `Issue.save()` fallback at `db/models/issue.py:178-203` requires at least one project default `State` row; `ProjectFactory` doesn't seed states).
- [ ] `apps/api/plane/tests/conftest.py` — reuse existing `session_client`, `workspace`, `create_user` fixtures; add a `project` and `project_member` fixture if the planner decides they're worth sharing across tests (otherwise inline factory calls per test).
- [ ] No framework install required — pytest, pytest-django, pytest-mock, factory-boy already in `apps/api/requirements/test.txt`.
- [ ] No Django migration — Phase 3 explicitly adds no model fields (per CONTEXT.md `<domain>` "Out of scope" and ROADMAP "Optional NEW model field … out of scope").

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| End-to-end Celery delivery of `issue_activity` and `model_activity` events to webhook subscribers | API-12 | Requires running Redis + Celery worker + a registered webhook endpoint; out of scope for `--reuse-db --nomigrations` contract suite. | After Phase 5 ships, run `docker compose -f docker-compose-local.yml up`, perform a propagation drag, and tail `apps/api` logs for `model_activity` task delivery and Webhook fan-out. Phase 3 only verifies the `.delay(...)` call is **registered** under `transaction.on_commit`; actual delivery is verified at the integration boundary. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies.
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify.
- [ ] Wave 0 covers all MISSING references (`test_timeline_propagation.py` + factory extensions).
- [ ] No watch-mode flags (every command is one-shot).
- [ ] Feedback latency < 30 seconds for per-task signal.
- [ ] `nyquist_compliant: true` set in frontmatter when planner finishes filling the Per-Task Verification Map.

**Approval:** planned (3 plans, 25 GREEN tests target)
