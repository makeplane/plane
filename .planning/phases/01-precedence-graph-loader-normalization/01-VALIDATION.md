---
phase: 1
slug: precedence-graph-loader-normalization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-03
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from `01-RESEARCH.md` §"Validation Architecture".

---

## Test Infrastructure

| Property               | Value                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | pytest 9.0.3 + pytest-django 4.5.2 (declared in `apps/api/requirements/test.txt`)                                                  |
| **Config file**        | `apps/api/pytest.ini` (`DJANGO_SETTINGS_MODULE=plane.settings.test`, defaults `--strict-markers --reuse-db --nomigrations -vs`)    |
| **Quick run command**  | `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_graph.py -x` |
| **Full suite command** | `cd apps/api && python run_tests.py -u` (runs all `@pytest.mark.unit` tests)                                                       |
| **Estimated runtime**  | ~1–3 s for the new file with `--reuse-db --nomigrations`; ~30–60 s for the full unit suite                                         |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_graph.py -x`
- **After every plan wave:** Run `cd apps/api && python run_tests.py -u` (full unit suite, keeps Phase 1 integrated with the rest of `tests/unit/`)
- **Before `/gsd-verify-work`:** Full suite must be green. Optional: `cd apps/api && python run_tests.py --coverage` enforces `--fail-under=90`.
- **Max feedback latency:** 60 s (full unit suite). Quick run < 5 s.

---

## Per-Task Verification Map

| Task ID      | Plan | Wave | Requirement            | Threat Ref | Secure Behavior                                                                                                                                                                                | Test Type | Automated Command                                                                                           | File Exists | Status     |
| ------------ | ---- | ---- | ---------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 01-XX-DIR    | 01   | 1    | PROP-01 / D-04         | —          | Direction translation: `(issue=X, related=Y, blocked_by)` → `predecessor=Y → successor=X` for every loaded edge                                                                                | unit      | `pytest plane/tests/unit/services/timeline_propagation/test_graph.py::TestLoadPrecedenceGraphDirection -x`  | ❌ W0       | ⬜ pending |
| 01-XX-FILTER | 01   | 1    | PROP-02                | —          | `relates_to` and `duplicate` rows excluded from adjacency; only `relation_type='blocked_by'` produces edges                                                                                    | unit      | `pytest …::TestLoadPrecedenceGraphFilters -x`                                                               | ❌ W0       | ⬜ pending |
| 01-XX-MIRROR | 01   | 1    | PROP-01 (alias) / D-04 | —          | Both API directions (`blocking` and `blocked_by` from frontend) collapse into one stored `blocked_by` row → one normalized edge                                                                | unit      | `pytest …::TestLoadPrecedenceGraphFilters::test_blocking_via_get_actual_relation_normalizes_to_one_edge -x` | ❌ W0       | ⬜ pending |
| 01-XX-CYCLE  | 01   | 1    | PROP-15 / TEST-11      | —          | Three-node cycle on the precedence subgraph surfaces in `LoadResult.cycle` as a closed path; algorithm never throws across the module boundary                                                 | unit      | `pytest …::TestLoadPrecedenceGraphCycle::test_three_node_cycle_is_detected -x`                              | ❌ W0       | ⬜ pending |
| 01-XX-XPROJ  | 01   | 1    | PROP-16                | —          | Cross-project successor goes to `cross_project_edges`, not `successors`; no foreign-issue dereference                                                                                          | unit      | `pytest …::TestLoadPrecedenceGraphCrossProject -x`                                                          | ❌ W0       | ⬜ pending |
| 01-XX-EMPTY  | 01   | 1    | (default)              | —          | Empty input → empty `Adjacency`, `cycle=None` (regression guard)                                                                                                                               | unit      | `pytest …::TestLoadPrecedenceGraphEmpty -x`                                                                 | ❌ W0       | ⬜ pending |
| 01-XX-SELF   | 01   | 1    | PROP-15 / D-05         | —          | Self-edge (`issue == related_issue`) classified as one-node cycle `(a, a)`                                                                                                                     | unit      | `pytest …::TestLoadPrecedenceGraphCycle::test_self_edge_is_one_node_cycle -x`                               | ❌ W0       | ⬜ pending |
| 01-XX-ADJ    | 01   | 1    | D-06                   | —          | Two transitive chains, split, and merge — adjacency contents and `successors_of`/`predecessors_of` outputs match expected values                                                               | unit      | `pytest …::TestLoadPrecedenceGraphAdjacencyShape -x`                                                        | ❌ W0       | ⬜ pending |
| 01-XX-PURE   | 01   | 1    | D-08 / PROP-18         | —          | `apps/api/plane/app/services/timeline_propagation/*.py` imports nothing from `rest_framework`, `django.http`, `plane.app.views`, `plane.app.serializers` (lint/grep test inside test_graph.py) | unit      | `pytest …::test_no_drf_or_http_imports_in_module -x`                                                        | ❌ W0       | ⬜ pending |
| 01-XX-CONV   | 01   | 1    | D-06 (convenience)     | —          | `successors_of(unknown_id)` and `predecessors_of(unknown_id)` return empty `frozenset()`, never raise `KeyError`                                                                               | unit      | `pytest …::TestAdjacencyConvenienceMethods -x`                                                              | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_
_Task IDs are placeholders — gsd-planner assigns final IDs per plan wave._

---

## Wave 0 Requirements

- [ ] `apps/api/plane/app/services/__init__.py` — empty marker file (NEW services umbrella package, never existed before)
- [ ] `apps/api/plane/app/services/timeline_propagation/__init__.py` — re-exports the public surface (`load_precedence_graph`, `Adjacency`, `Edge`, `WorkItemNode`, `LoadResult`)
- [ ] `apps/api/plane/app/services/timeline_propagation/types.py` — `WorkItemNode`, `Edge`, `Adjacency`, `LoadResult` (frozen dataclasses, `slots=True`)
- [ ] `apps/api/plane/app/services/timeline_propagation/graph.py` — `load_precedence_graph(...)` + iterative three-color DFS cycle detection
- [ ] `apps/api/plane/tests/unit/services/__init__.py` — empty marker file (parent package for the test sub-tree)
- [ ] `apps/api/plane/tests/unit/services/timeline_propagation/__init__.py` — empty marker file
- [ ] `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py` — full test module covering rows above
- [ ] No framework install needed — `pytest`, `pytest-django`, `factory-boy` already pinned in `apps/api/requirements/test.txt`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual                                                                         | Test Instructions |
| -------- | ----------- | ---------------------------------------------------------------------------------- | ----------------- |
| (none)   | —           | All Phase 1 behaviors are pure-Python and have automated unit tests covering them. | —                 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags (pytest invocation is one-shot, not `--looponfail`)
- [ ] Feedback latency < 60 s (full suite); < 5 s (quick run)
- [ ] `nyquist_compliant: true` set in frontmatter once gsd-planner finalizes task IDs

**Approval:** pending
