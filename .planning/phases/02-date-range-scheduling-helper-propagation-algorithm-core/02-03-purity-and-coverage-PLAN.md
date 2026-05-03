---
plan_id: 02-03
phase: 2
title: Lint-grep purity invariant + timedelta swap-seam check + coverage gate
wave: 3
depends_on: [02-01, 02-02]
files_modified:
  - apps/api/plane/tests/unit/services/timeline_propagation/test_purity.py
files_read_only:
  - apps/api/plane/app/services/timeline_propagation/errors.py
  - apps/api/plane/app/services/timeline_propagation/scheduling.py
  - apps/api/plane/app/services/timeline_propagation/propagation.py
  - apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py
autonomous: true
requirements:
  - PROP-11
  - PROP-14
---

# Plan 02-03: Lint-grep purity invariant + timedelta swap-seam check + coverage gate

## Objective

Lock the D-14 / D-03 invariants with sibling lint-grep tests in a NEW `test_purity.py`:

1. **Module purity (D-14):** Extend Phase 1's `test_no_drf_or_http_imports_in_module` forbidden-strings list to cover the new Phase 2 invariants — no `transaction.atomic`, no `model_activity.delay`, no `Issue.objects` writes, no `from django.db.models import` — across ALL files under `apps/api/plane/app/services/timeline_propagation/` (the existing `rglob("*.py")` walk in Phase 1 already enumerates `errors.py`, `scheduling.py`, `propagation.py`, but the forbidden tuple needs Phase 2 entries).
2. **`timedelta` swap-seam (D-03 / Pitfall 9):** Sibling test that asserts `propagation.py` does NOT import `timedelta` directly — only `scheduling.py` is allowed to do calendar-day arithmetic (the ADR 0002 swap seam).
3. **Coverage gate (CONTEXT.md "near-100% covered" target):** Validation that `cd apps/api && python run_tests.py -u --coverage` enforces `--fail-under=90` and that the timeline_propagation package itself is at ≥ 95% line coverage.

This plan covers Wave 12 from `02-RESEARCH.md` and the `test_purity.py::TestModulePurity` + `TestSchedulingSeam` entries in `02-VALIDATION.md`.

**Choice rationale (RESEARCH.md Open Question 6):** I chose to create a NEW `test_purity.py` (option b) rather than extend Phase 1's `test_graph.py` (option a). The lint-grep test now covers TWO concerns (Phase 1 D-08 + Phase 2 D-14 + Pitfall 9), each with multiple assertions; bundling them into a sibling file keeps `test_graph.py` focused on the loader and gives Phase 3 (and beyond) a single home to extend the purity invariant without re-touching Phase 1's test file. The PHASE 1 `test_no_drf_or_http_imports_in_module` test STAYS GREEN inside `test_graph.py` (we do NOT delete or modify it — it remains the Phase 1 regression guard); the new `test_purity.py` adds Phase 2's stricter checks on top.

## Truths (CONTEXT.md anchors)

- **D-03:** `scheduling.py` is the SINGLE date-arithmetic seam. `propagation.py` MUST NOT `import timedelta` directly. ADR 0002's Working Calendar swap replaces only `scheduling.py`.
- **D-14 (purity invariant carried from Phase 1 D-08):** `errors.py`, `scheduling.py`, `propagation.py` MUST NOT contain: `from rest_framework`, `from django.http`, `from django.db.models import`, `transaction.atomic`, `model_activity.delay`, `Issue.objects` (writes), `plane.app.views`, `plane.app.serializers`.
- **PROP-11 (calendar-day arithmetic):** Pinned indirectly by the lint-grep — `scheduling.py` IS the arithmetic; everything else routes through it.
- **PROP-14 (service module isolation, US-33):** Pinned by the purity test.
- **Phase 1 TestLoaderPurity invariant:** The existing `test_graph.py::test_no_drf_or_http_imports_in_module` walks `pkg_root.rglob("*.py")` and continues to enforce its 4 forbidden strings (`rest_framework`, `django.http`, `plane.app.views`, `plane.app.serializers`) on every Phase 2 file — this MUST remain GREEN.

## Must-Haves

**Truths:**

- `apps/api/plane/tests/unit/services/timeline_propagation/test_purity.py` exists with at least two test functions (or test classes): one for the global forbidden list (D-14) covering Phase 2's new entries, and one for the file-scoped `timedelta` ban on `propagation.py` (Pitfall 9).
- The Phase 1 `test_graph.py::test_no_drf_or_http_imports_in_module` test STAYS GREEN (no edits to that test).
- `propagation.py` is verifiably free of `from datetime import timedelta` (or `import datetime.timedelta`) — `grep -nE "from datetime import.*timedelta|import datetime\.timedelta|from datetime import timedelta" apps/api/plane/app/services/timeline_propagation/propagation.py` returns ZERO matches.
- `errors.py`, `scheduling.py`, `propagation.py` collectively contain ZERO matches for: `transaction.atomic`, `model_activity.delay`, `Issue.objects`, `from django.db.models import`, `from rest_framework`, `from django.http`, `plane.app.views`, `plane.app.serializers`.
- `cd apps/api && python run_tests.py -u --coverage` exits 0 (the `--fail-under=90` gate passes); the timeline_propagation package contribution is ≥ 95% line coverage.

**Artifacts:**

- `apps/api/plane/tests/unit/services/timeline_propagation/test_purity.py` — NEW file, ≥ 60 lines, ≥ 2 GREEN test functions/classes.

**Key links:**

- `test_purity.py` reads `apps/api/plane/app/services/timeline_propagation/*.py` via `pathlib.Path(__file__).resolve().parents[4] / "app" / "services" / "timeline_propagation"` (mirror Phase 1's `test_graph.py:417-420`).
- Coverage is run via `python run_tests.py -u --coverage` (see `apps/api/run_tests.py`); the script enforces `--fail-under=90` per `apps/api/pytest.ini` defaults documented in CONTEXT.md.

## Tasks

<task id="02-03-T1">
  <title>Task 1: Create test_purity.py with TestModulePurity (D-14) + TestSchedulingSeam (Pitfall 9)</title>
  <read_first>
    - apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py (lines 411-435 — the Phase 1 lint-grep pattern Phase 2 sibling-mirrors; do NOT edit that test, just copy the path-walk shape)
    - apps/api/plane/app/services/timeline_propagation/propagation.py (Plan 02-02 implementation — verify it does NOT import `timedelta` before writing the test that asserts so)
    - apps/api/plane/app/services/timeline_propagation/scheduling.py (Plan 02-01 — IS allowed to import `timedelta`; the file-scoped check exempts this file)
    - apps/api/plane/app/services/timeline_propagation/errors.py (Plan 02-01 — verify NO Django/DRF imports)
    - .planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-CONTEXT.md §D-14 (the full list of forbidden imports)
    - .planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-RESEARCH.md §"Pitfall 9" (the exact `propagation.py` exclusion semantics — `timedelta` allowed in `scheduling.py`, forbidden in `propagation.py`)
    - .planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-PATTERNS.md §8 ("test_purity.py NEW — OR extend in-place in test_graph.py") for the SCOPED_FORBIDDEN sketch
  </read_first>
  <action>
Create `apps/api/plane/tests/unit/services/timeline_propagation/test_purity.py` with this EXACT content:

```python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Lint-grep purity tests for `plane.app.services.timeline_propagation`.

Sibling to Phase 1's `test_graph.py::test_no_drf_or_http_imports_in_module` —
that test stays GREEN and continues to enforce Phase 1's 4 forbidden imports.
This file extends the invariant with Phase 2's stricter checks per CONTEXT.md
D-14 and D-03 (Pitfall 9 from RESEARCH.md):

  TestModulePurity        → D-14 (no transaction.atomic / model_activity.delay /
                                  Issue.objects / from django.db.models import
                                  in any timeline_propagation/*.py file)
  TestSchedulingSeam      → D-03 / Pitfall 9 (no `timedelta` import in
                                              propagation.py — only scheduling.py
                                              owns calendar-day arithmetic)

Verifiable by static grep over the package source tree. Pure file I/O — no DB,
no DRF, no Django settings beyond what `pytest.ini` provides.
"""

# Python imports
import pathlib
import re

import pytest


def _package_root() -> pathlib.Path:
    """Return the absolute path to apps/api/plane/app/services/timeline_propagation/.

    Mirror Phase 1's path-walk shape (test_graph.py:417-420). The
    `parents[4]` index walks: test_purity.py → timeline_propagation/ →
    services/ → unit/ → tests/ → plane/, then descends into app/services/.
    """
    return (
        pathlib.Path(__file__).resolve().parents[4]
        / "app"
        / "services"
        / "timeline_propagation"
    )


@pytest.mark.unit
class TestModulePurity:
    """D-14: timeline_propagation/*.py forbids HTTP / ORM-write / signal imports.

    Phase 1 (D-08) already pinned: rest_framework, django.http, plane.app.views,
    plane.app.serializers. This test ADDS Phase 2 (D-14) entries: transaction.atomic,
    model_activity.delay, Issue.objects, from django.db.models import. Both layers
    are checked here so a single failure points to the offending file and string.
    """

    GLOBAL_FORBIDDEN = (
        # Phase 1 D-08 — re-asserted here for one-stop diagnostic clarity
        "rest_framework",
        "django.http",
        "plane.app.views",
        "plane.app.serializers",
        # Phase 2 D-14 — new
        "transaction.atomic",
        "model_activity.delay",
        "Issue.objects",
        "from django.db.models import",
    )

    def test_no_forbidden_imports_in_any_module(self):
        pkg_root = _package_root()
        py_files = list(pkg_root.rglob("*.py"))
        assert py_files, f"no .py files found under {pkg_root}"

        violations: list[str] = []
        for py in py_files:
            text = py.read_text(encoding="utf-8")
            for needle in self.GLOBAL_FORBIDDEN:
                # Strip Python comments so docstrings/comments mentioning the
                # needle (e.g., "no transaction.atomic") don't self-invalidate
                # this gate. Match against code lines only.
                for line in text.splitlines():
                    stripped = line.split("#", 1)[0]  # remove inline comments
                    if needle in stripped:
                        # Allow docstring mentions: docstring lines start
                        # with whitespace + a quote or are inside triple-quotes.
                        # Simplest robust filter: skip lines that LOOK like
                        # docstrings/comments (begin with `"""`, `'''`, or are
                        # inside a triple-quoted block). Use a conservative
                        # heuristic — substring outside docstrings.
                        if _is_docstring_or_comment_line(line, text, needle):
                            continue
                        violations.append(f"{py.name}:{needle!r} in line: {line.strip()!r}")

        assert not violations, "D-14 / Phase 1 D-08 violation:\n  " + "\n  ".join(violations)


@pytest.mark.unit
class TestSchedulingSeam:
    """D-03 / Pitfall 9: only scheduling.py may import `timedelta` directly."""

    SCOPED_FORBIDDEN: dict[str, tuple[str, ...]] = {
        # propagation.py MUST NOT import timedelta — date math goes through scheduling.py.
        # Allowed: from datetime import date, datetime (type annotations only).
        "propagation.py": (
            "from datetime import timedelta",
            "import datetime.timedelta",
        ),
        # errors.py has no date math at all — forbid timedelta entirely for symmetry.
        "errors.py": (
            "from datetime import timedelta",
            "import datetime.timedelta",
        ),
    }

    def test_propagation_does_not_import_timedelta_directly(self):
        """Pitfall 9 / D-03: propagation.py routes ALL date math through scheduling.py."""
        pkg_root = _package_root()
        violations: list[str] = []
        for py_name, forbidden_imports in self.SCOPED_FORBIDDEN.items():
            py_path = pkg_root / py_name
            assert py_path.exists(), f"expected file does not exist: {py_path}"
            text = py_path.read_text(encoding="utf-8")
            for needle in forbidden_imports:
                # Same comment-stripping as TestModulePurity.
                for line in text.splitlines():
                    stripped = line.split("#", 1)[0]
                    if needle in stripped:
                        if _is_docstring_or_comment_line(line, text, needle):
                            continue
                        violations.append(f"{py_name}: forbidden {needle!r} in line: {line.strip()!r}")

        assert not violations, "D-03 / Pitfall 9 violation:\n  " + "\n  ".join(violations)

    def test_scheduling_is_the_only_module_that_imports_timedelta(self):
        """Positive assertion: scheduling.py DOES import timedelta (the seam exists)."""
        pkg_root = _package_root()
        scheduling_text = (pkg_root / "scheduling.py").read_text(encoding="utf-8")
        assert "from datetime import" in scheduling_text and "timedelta" in scheduling_text, (
            "scheduling.py must own the timedelta seam (D-03)"
        )


def _is_docstring_or_comment_line(line: str, full_text: str, needle: str) -> bool:
    """Best-effort filter: is `needle` inside a docstring or comment, not an import?

    Heuristics (lightweight; not a full Python parser):
      * Line starts with `#` → comment (after lstrip).
      * Line contains a triple-quote opener/closer → likely docstring boundary.
      * `needle` appears INSIDE a triple-quoted block — find the enclosing
        block by counting `\"\"\"` occurrences before the line.

    Conservative bias: when in doubt, treat as docstring/comment so the test
    does not produce false positives that block CI for prose-mentions of the
    forbidden string.
    """
    stripped_left = line.lstrip()
    if stripped_left.startswith("#"):
        return True
    if needle not in stripped_left:
        # `needle` was inside a comment that was stripped earlier; treat as comment.
        return True

    # Locate the line's character offset in full_text.
    try:
        char_offset = full_text.index(line)
    except ValueError:
        return False

    # Count triple-quote markers (both kinds) BEFORE this line. An odd count
    # means we are inside a docstring.
    prefix = full_text[:char_offset]
    triple_double = prefix.count('"""')
    triple_single = prefix.count("'''")
    if triple_double % 2 == 1 or triple_single % 2 == 1:
        return True

    return False
```

**Critical implementation notes for the executor:**

1. **DO NOT delete or modify** `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py::test_no_drf_or_http_imports_in_module` — that Phase 1 test stays GREEN as a regression guard. This new `test_purity.py` is a SIBLING, not a replacement.
2. **Comment-stripping is essential** — the lint-grep tests count `grep`-style matches against forbidden strings. If we did not strip comments, a docstring saying "no `transaction.atomic` here" would self-invalidate the test (the very-prose-that-documents-the-rule trips the rule). The `_is_docstring_or_comment_line` helper filters those out using a lightweight heuristic.
3. **Substring match, not regex** — Phase 1's pattern uses plain `in` checks; we keep the same convention for false-positive tolerance and minimum maintenance.
4. The positive assertion (`test_scheduling_is_the_only_module_that_imports_timedelta`) ensures Plan 02-01 actually established the seam — if `scheduling.py` somehow lost its `timedelta` import, this test would catch it, complementing the negative `propagation.py` assertion.
   </action>
   <acceptance_criteria> - `apps/api/plane/tests/unit/services/timeline_propagation/test_purity.py` exists; at least 60 lines. - `grep -cE "^class TestModulePurity:|^class TestSchedulingSeam:" apps/api/plane/tests/unit/services/timeline_propagation/test_purity.py` returns 2. - Phase 1 lint-grep test STILL exists in `test_graph.py` — `grep -c "def test_no_drf_or_http_imports_in_module" apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py` returns 1 (NOT 0; we did not delete it). - Phase 1 lint-grep test STILL passes — `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_graph.py::test_no_drf_or_http_imports_in_module -q` exits 0. - The new test_purity.py tests are GREEN — `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_purity.py -q` exits 0 with at least 3 tests collected (1 in TestModulePurity + 2 in TestSchedulingSeam). - `propagation.py` is verified clean — `grep -nE "^[^#]*from datetime import.*timedelta|^[^#]*import datetime\.timedelta" apps/api/plane/app/services/timeline_propagation/propagation.py | grep -v '^\s*#' | grep -v '^\s*"' | wc -l` returns 0 (no non-comment, non-docstring `timedelta` import). - `scheduling.py` IS verifiably the seam — `grep -cE "from datetime import" apps/api/plane/app/services/timeline_propagation/scheduling.py` returns 1 and `grep -c "timedelta" apps/api/plane/app/services/timeline_propagation/scheduling.py` returns at least 1. - All Phase 2 timeline_propagation tests still GREEN end-to-end — `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/ -q` exits 0.
   </acceptance_criteria>
   <automated>cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_purity.py plane/tests/unit/services/timeline_propagation/test_graph.py::test_no_drf_or_http_imports_in_module -q</automated>
   <requirements>PROP-11, PROP-14</requirements>
   </task>

<task id="02-03-T2">
  <title>Task 2: Coverage gate validation — ≥95% on timeline_propagation package</title>
  <read_first>
    - apps/api/run_tests.py (the `--coverage` flag wires `--fail-under=90` per CONTEXT.md "Coverage" line; verify the script's invocation)
    - apps/api/pytest.ini (markers + defaults; coverage settings if present)
    - .planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-VALIDATION.md §"Sampling Rate" (≥ 95% line+branch coverage target on the timeline_propagation package per CONTEXT.md)
  </read_first>
  <action>
This task is a VERIFICATION-ONLY task — no production or test code changes. The acceptance is that the coverage gate passes when run end-to-end.

**Step 1.** Run the full unit-suite coverage gate:

```bash
cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test python run_tests.py -u --coverage
```

Expected output:

- The pytest run completes without collection errors.
- The coverage report is produced; the `--fail-under=90` gate passes (overall coverage ≥ 90%).
- The timeline_propagation package contribution to coverage is ≥ 95% (verifiable by `htmlcov/index.html` if generated, or by parsing the terminal coverage report).

**Step 2.** Inspect the coverage report for the timeline_propagation package specifically. The expectation is that:

- `errors.py` is at or near 100% (only enum + dataclass, no branches).
- `scheduling.py` is at 100% (every helper has a direct test in `test_scheduling.py`).
- `propagation.py` is ≥ 95% (every D-06 step + every walk branch + every Pitfall guard exercised by `test_propagation.py`).
- `types.py` Phase 2 additions are at 100% (constructed in tests + the `is_success` property exercised by `TestNoViolationMove`).

**Step 3.** If coverage on `propagation.py` is below 95%, identify the un-covered lines and add a targeted test in `test_propagation.py` for each gap. Common likely gaps (all already covered by Plan 02-02's auxiliary suite — verify no additions needed):

- `_walk_backward` cross-project reachability branch (covered by `TestCrossProjectReachable` if a leftward variant is added; otherwise add one).
- `_walk_forward` defensive `if succ is None` branch (covered by `TestIncompleteSchedule`).
- `delta == 0` no-op (covered by `TestNoOpMove`).
- The `else` re-enqueue branch on already-visited nodes (covered by `TestMergeBranches` indirectly; add `test_merge_re_enqueues_with_larger_shift` if line-coverage shows this is missed).

**Step 4.** Document the result. If coverage ≥ 95% on the timeline_propagation package: this task is complete. If a gap was found and a test was added: update the test file, re-run coverage, confirm the gap closes.
</action>
<acceptance_criteria> - `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test python run_tests.py -u --coverage` exits 0 (the `--fail-under=90` gate passes). - The timeline_propagation package coverage is ≥ 95% (verify by inspecting the coverage report; the executor MAY parse `coverage report --include='plane/app/services/timeline_propagation/*'` output to confirm). - If gaps were found, the necessary tests were added to `test_propagation.py` (NOT `test_purity.py`) and the file is still GREEN. - Pre-existing unit-suite failures (out-of-scope per `.planning/phases/01-precedence-graph-loader-normalization/deferred-items.md`) have NOT increased — verify the failure count for `bg_tasks/test_copy_s3_objects.py`, `bg_tasks/test_work_item_link_task.py`, `utils/test_url.py` is the same as before.
</acceptance_criteria>
<automated>cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test python -m pytest plane/tests/unit/services/timeline_propagation/ --cov=plane/app/services/timeline_propagation --cov-report=term-missing --cov-fail-under=95 -q</automated>
<requirements>PROP-14</requirements>
</task>

## Verification

**Per-task verification** is pinned in each task's `<automated>` block.

**Plan-level verification (after both tasks complete):**

```bash
# Full timeline_propagation suite — all Phase 2 tests green
cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/ -q

# Package coverage ≥ 95%
cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test python -m pytest plane/tests/unit/services/timeline_propagation/ --cov=plane/app/services/timeline_propagation --cov-report=term-missing --cov-fail-under=95 -q

# Full unit-suite coverage gate
cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test python run_tests.py -u --coverage
```

Expected:

- All ~45 timeline_propagation tests GREEN (Phase 1: ~13 + Plan 02-01: 18 + Plan 02-02: ~27 + Plan 02-03: ~3).
- Package coverage ≥ 95%.
- Full unit-suite `--fail-under=90` passes.

## Success Criteria

- `test_purity.py` exists and is GREEN.
- Phase 1 `test_no_drf_or_http_imports_in_module` is unchanged and GREEN.
- `propagation.py` provably contains no direct `timedelta` import (D-03 / Pitfall 9 enforced).
- All D-14 forbidden imports verified absent from `errors.py`, `scheduling.py`, `propagation.py`.
- Coverage gate passes: timeline_propagation package ≥ 95%, full unit suite ≥ 90%.

## Output

After completion, create `.planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-03-SUMMARY.md` documenting:

- Files created (test_purity.py).
- Test counts (3 new GREEN purity tests; total Phase 2 = 48 GREEN tests across 4 test files).
- Coverage numbers reported.
- Phase 2 closure: all 24 requirements addressed, all 11 PRD-pinned tests GREEN, lint-grep purity locked, coverage ≥ 95%.
- Hand-off to Phase 3: contract is locked. Phase 3 plan-phase MUST address (a) `bulk_update` + `auto_now` interaction (RESEARCH.md Pitfall 10), (b) HTTP status code mapping per `PropagationErrorCode` (e.g., 409 for SCHEDULE_CHANGED, 422 for the rest, 403 for PERMISSION_DENIED), and (c) `expected_updated_at` ISO precision in the request serializer.

<threat_model>
**ASVS L1 surface:** none (lint-grep verification only; pure file I/O, no runtime behavior change, no new attack surface).
**Indirect contributions:** This plan LOCKS the deep-module-isolation invariant (D-14) that prevents future drift toward HTTP/DB coupling — a structural defense-in-depth: keeping `transaction.atomic`, `Issue.objects`, and DRF imports OUT of the algorithm package means the algorithm cannot accidentally bypass Phase 3's authorization and stale-check controls. The `timedelta` swap-seam check (D-03 / Pitfall 9) preserves the ADR 0002 working-day swap so security-relevant date arithmetic (e.g., per-tenant business calendars) can be added in one place without touching the propagation algorithm.
**Phase 3 hand-off:** authentication, authorization (`PERMISSION_DENIED`), CSRF, input validation at the HTTP boundary, and `transaction.atomic` rollback semantics are owned by the Phase 3 viewset, not Phase 2.
</threat_model>
