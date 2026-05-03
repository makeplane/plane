---
phase: 3
slug: propagation-api-endpoint-persistence-contract
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 03-XX-XX | XX | 1 | API-01 | — | URL routes to view; `reverse("project-timeline-propagation")` resolves | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::test_url_reverses -v` | ❌ W0 | ⬜ pending |
| 03-XX-XX | XX | 1 | API-02 | T-V5 | Serializer accepts documented body; rejects malformed | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py -k "serializer" -v` | ❌ W0 | ⬜ pending |
| 03-XX-XX | XX | 2 | API-03 / API-04 / TEST-16 | — | Success payload shape & content; `total_updated_count` matches `len(work_items)`; `updated_at` consistent across array | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::test_chain_propagation_returns_200_with_full_payload -v` | ❌ W0 | ⬜ pending |
| 03-XX-XX | XX | 2 | API-05 / API-06 / TEST-17 | T-V7 | `{code, message}` envelope for each of 7 error codes | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py -k "envelope" -v` | ❌ W0 | ⬜ pending |
| 03-XX-XX | XX | 2 | API-07 / TEST-13 | T-V4 | `expected_updated_at` mismatch → 409 + envelope; no DB writes | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::test_stale_updated_at_returns_409_envelope -v` | ❌ W0 | ⬜ pending |
| 03-XX-XX | XX | 2 | API-08 / TEST-15 | T-V7 | All-or-nothing on every failure (snapshot-pre/post `updated_at` per id) | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py -k "no_db_writes" -v` | ❌ W0 | ⬜ pending |
| 03-XX-XX | XX | 1 | API-09 / TEST-18 | T-V4 | Permission rejection envelope (non-member → 403, GUEST → 403) | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py -k "permission" -v` | ❌ W0 | ⬜ pending |
| 03-XX-XX | XX | 2 | API-10 | — | Invalid date range → 422 envelope (algorithm-level, not serializer-level) | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::test_invalid_date_range_returns_422_envelope -v` | ❌ W0 | ⬜ pending |
| 03-XX-XX | XX | 2 | API-11 | — | Existing `IssueBulkUpdateDateEndpoint` regression (structural smoke) | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::test_existing_bulk_update_endpoint_unchanged -v` | ❌ W0 | ⬜ pending |
| 03-XX-XX | XX | 2 | API-12 | T-Repudiation | `issue_activity.delay` and `model_activity.delay` register on commit only (mocker-driven) | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py -k "activity" -v` | ❌ W0 | ⬜ pending |
| 03-XX-XX | XX | 2 | PROP-16 / TEST-10 | T-V4 | Cross-project path → `PROJECT_BOUNDARY_EXCEEDED` 422 envelope | contract | `pytest plane/tests/contract/app/test_timeline_propagation.py::test_cross_project_path_returns_422_envelope -v` | ❌ W0 | ⬜ pending |
| 03-XX-XX | W0 | 0 | (helper) | — | Snapshot-pre/post helper for "no DB writes on failure" assertion | shared util | (called from many tests) | ❌ W0 | ⬜ pending |
| 03-XX-XX | W0 | 0 | (helper) | — | `IssueFactory` / `IssueRelationFactory` / `StateFactory` extension to `apps/api/plane/tests/factories.py` | shared util | (used by every contract test) | ❌ W0 | ⬜ pending |

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

**Approval:** pending
