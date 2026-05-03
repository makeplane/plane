---
plan_id: 02-01
phase: 2
title: Scaffold + errors.py + types.py additions + scheduling.py helpers
wave: 1
depends_on: []
files_modified:
  - apps/api/plane/app/services/timeline_propagation/errors.py
  - apps/api/plane/app/services/timeline_propagation/scheduling.py
  - apps/api/plane/app/services/timeline_propagation/propagation.py
  - apps/api/plane/app/services/timeline_propagation/types.py
  - apps/api/plane/app/services/timeline_propagation/__init__.py
  - apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py
  - apps/api/plane/tests/unit/services/timeline_propagation/test_scheduling.py
autonomous: true
requirements:
  - PROP-08
  - PROP-10
  - PROP-11
  - PROP-14
  - PROP-17
---

# Plan 02-01: Scaffold + errors + types + scheduling helpers

## Objective

Land the **typed contract** and the **date-math swap-seam** for Phase 2 in a single plan, before any algorithm logic is written. This produces:

- `errors.py` with `PropagationErrorCode` (StrEnum, 7 canonical codes per D-05) and `PropagationFailure` (frozen dataclass).
- `types.py` extended with the four new value types (`ScheduledWorkItem`, `MoveIntent`, `WorkItemUpdate`, `PropagationResult`) per D-04. Phase 1's existing types are NOT reshaped.
- `scheduling.py` with the six pure-function helpers per D-03 — the **only** date-arithmetic module in `timeline_propagation/`. Establishes the ADR 0002 swap seam.
- `propagation.py` STUB — module docstring + `def propagate_move(...) -> PropagationResult: raise NotImplementedError(...)` so `__init__.py` re-exports work without import errors. The actual algorithm lands in Plan 02-02.
- `__init__.py` re-exports the new public surface (per D-12 + Claude's Discretion: scheduling helpers re-exported so `test_scheduling.py` does not depth-import).
- `test_scheduling.py` with **GREEN** unit tests for all six scheduling helpers (Wave 3 from RESEARCH.md — 7 RED tests turn green within this plan).
- `test_propagation.py` scaffold containing **2 GREEN** tests (`TestErrorsModule` + `TestPublicSurface`) and a **RED placeholder** assertion for `propagate_move` that Plan 02-02 makes green (inter-plan RED handoff per Phase 1 precedent).

This plan covers Wave 0 + Wave 1 + Wave 2 + Wave 3 from `02-RESEARCH.md`.

## Truths (CONTEXT.md anchors)

- **D-03 (date math seam):** `scheduling.py` is the SINGLE seam. Six exact helper signatures: `range_duration`, `add_calendar_days`, `next_valid_start`, `previous_valid_target`, `is_valid_range`, `boundary_violation`.
- **D-04 (public types):** Four new frozen+slots dataclasses in `types.py`. Phase 1 types unchanged.
- **D-05 (error codes):** `PropagationErrorCode` is a Python 3.12 `StrEnum` with EXACTLY 7 members in canonical order: `DEPENDENCY_CYCLE`, `PROJECT_BOUNDARY_EXCEEDED`, `INCOMPLETE_SCHEDULE`, `PROPAGATION_LIMIT_EXCEEDED`, `SCHEDULE_CHANGED`, `PERMISSION_DENIED`, `INVALID_DATE_RANGE`. `PropagationFailure(code, message, work_item_id=None, cycle=None)`.
- **D-12 (public surface):** `__init__.py` re-exports `propagate_move`, `MoveIntent`, `ScheduledWorkItem`, `WorkItemUpdate`, `PropagationResult`, `PropagationFailure`, `PropagationErrorCode`, plus all six scheduling helpers (per Claude's Discretion bullet 4).
- **D-13 (test fixtures):** Pure in-memory; `@pytest.mark.unit` only; NO `@pytest.mark.django_db`.
- **D-14 (purity):** No `from rest_framework`, no `from django.http`, no `from django.db.models import`, no `transaction.atomic`, no `model_activity.delay`, no `Issue.objects` writes anywhere in the three new files. (Plan 02-03 enforces this with an extended lint-grep test.)
- **PROP-10 (binding for D-02 used by `boundary_violation`):** `succ.start == pred.target + 1` is the canonical adjacent case and is VALID — `boundary_violation` returns `False` here. Strict less-than only.
- **PROP-08 (binding for `range_duration` used by D-06 step 1 in Plan 02-02):** `range_duration(start, target) = target - start`; equal dates → `timedelta(0)`.

## Must-Haves

**Truths (observable behaviors after this plan ships):**

- `from plane.app.services.timeline_propagation import PropagationErrorCode, PropagationFailure, MoveIntent, ScheduledWorkItem, WorkItemUpdate, PropagationResult, propagate_move, range_duration, add_calendar_days, next_valid_start, previous_valid_target, is_valid_range, boundary_violation` succeeds (Phase 1 imports unchanged: `Adjacency`, `Edge`, `LoadResult`, `WorkItemNode`, `load_precedence_graph` still work).
- `propagate_move(...)` is callable but raises `NotImplementedError` (Plan 02-02 makes it green).
- All six `scheduling.py` helpers compute the documented arithmetic correctly — every helper test is GREEN.
- `PropagationErrorCode` enumeration order matches D-05 verbatim (test asserts `[c.value for c in PropagationErrorCode] == [...]`).
- Existing Phase 1 lint-grep test (`test_no_drf_or_http_imports_in_module`) still passes after the three new files land — proves D-14 is honored at the file level even before Plan 02-03 extends the forbidden tuple.

**Artifacts (files that must exist after this plan):**

- `apps/api/plane/app/services/timeline_propagation/errors.py` — ≥ 30 lines, contains `class PropagationErrorCode(StrEnum)` with 7 members + `@dataclass(frozen=True, slots=True) class PropagationFailure`.
- `apps/api/plane/app/services/timeline_propagation/scheduling.py` — ≥ 40 lines, contains 6 free functions matching D-03 signatures.
- `apps/api/plane/app/services/timeline_propagation/propagation.py` — ≥ 20 lines, contains `def propagate_move(graph, work_items_by_id, move_intent, expected_versions) -> PropagationResult: raise NotImplementedError(...)`.
- `apps/api/plane/app/services/timeline_propagation/types.py` — extended with 4 new frozen+slots dataclasses (Phase 1 dataclasses unchanged).
- `apps/api/plane/app/services/timeline_propagation/__init__.py` — `__all__` contains 18 entries (5 Phase 1 + 13 Phase 2).
- `apps/api/plane/tests/unit/services/timeline_propagation/test_scheduling.py` — ≥ 7 GREEN tests covering all six helpers + adjacency edge case.
- `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` — `TestErrorsModule` + `TestPublicSurface` GREEN; one `pytest.raises(NotImplementedError)` test on `propagate_move` (placeholder so the test class exists; Plan 02-02 replaces it with the real Wave 4 test).

**Key links:**

- `__init__.py` re-exports `propagation.propagate_move` → so when Plan 02-02 implements it, no `__init__.py` change is needed.
- `errors.py` is imported by `types.py` (`PropagationResult.failure: PropagationFailure | None`) — verify no circular import (errors.py imports only stdlib).
- `scheduling.py` is imported by `propagation.py` (Plan 02-02). `propagation.py` MUST NOT import `from datetime import timedelta` directly (D-03; Plan 02-03 enforces).

## Tasks

<task id="02-01-T1">
  <title>Task 1: Create errors.py + extend types.py with four new dataclasses</title>
  <read_first>
    - apps/api/plane/app/services/timeline_propagation/types.py (current Phase 1 file — see exact frozen+slots dataclass shape, PEP-585 generics, license header convention; do NOT reshape lines 29-92)
    - .planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-CONTEXT.md §D-04 and §D-05 (the EXACT dataclass field signatures)
    - .planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-PATTERNS.md §1 ("apps/api/plane/app/services/timeline_propagation/errors.py") and §4 ("types.py UPDATE — append four dataclasses") for header/docstring/import conventions
  </read_first>
  <action>
**Step 1.** Create `apps/api/plane/app/services/timeline_propagation/errors.py` with this exact content:

```python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Typed failure outcomes for Timeline Dependency Schedule Propagation.

Stable wire contract (US-22, US-37, API-06, CONTEXT.md D-05):
  PropagationErrorCode is the canonical 7-value StrEnum that downstream
  consumers (Phase 3 DRF view → frontend) read to map onto user-facing
  messages. Reordering or renaming members requires an explicit ADR
  amendment.

Module scope (PROP-18): move-only.
"""

# Python imports
from dataclasses import dataclass
from enum import StrEnum  # Python 3.12 stdlib — see CONTEXT.md D-05
from uuid import UUID


class PropagationErrorCode(StrEnum):
    """Canonical wire codes for `PropagationResult.failure` (D-05)."""

    DEPENDENCY_CYCLE = "DEPENDENCY_CYCLE"
    PROJECT_BOUNDARY_EXCEEDED = "PROJECT_BOUNDARY_EXCEEDED"
    INCOMPLETE_SCHEDULE = "INCOMPLETE_SCHEDULE"
    PROPAGATION_LIMIT_EXCEEDED = "PROPAGATION_LIMIT_EXCEEDED"
    SCHEDULE_CHANGED = "SCHEDULE_CHANGED"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    INVALID_DATE_RANGE = "INVALID_DATE_RANGE"


@dataclass(frozen=True, slots=True)
class PropagationFailure:
    """Diagnostic payload for a failed propagation (CONTEXT.md D-05).

    `work_item_id` carries the offending node when meaningful
    (`INCOMPLETE_SCHEDULE`, `INVALID_DATE_RANGE`, `SCHEDULE_CHANGED`).
    `cycle` carries the closed path from `LoadResult.cycle` for
    `DEPENDENCY_CYCLE`. `message` is human-readable diagnostic English;
    i18n happens in Phase 5's UI.
    """

    code: PropagationErrorCode
    message: str
    work_item_id: UUID | None = None
    cycle: tuple[UUID, ...] | None = None
```

The enum members MUST appear in EXACTLY this order (D-05 / D-06 step 1 / contract test in T3 below asserts the ordered tuple).

**Step 2.** Edit `apps/api/plane/app/services/timeline_propagation/types.py` — APPEND (do not reshape lines 1-93) the four new dataclasses per D-04. First, extend the existing imports block (line 23-26) to add date types and the relative import for `PropagationFailure`:

Replace existing lines 23-26 with:

```python
# Python imports
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import date, datetime
from uuid import UUID

# Module imports
from .errors import PropagationFailure
```

Then APPEND these four dataclasses to the END of `types.py` (after line 92's `LoadResult`). Use this exact content (matching Phase 1's frozen+slots+per-class docstring shape):

```python


@dataclass(frozen=True, slots=True)
class ScheduledWorkItem:
    """Schedule snapshot of a Work Item that the propagation algorithm reads (D-04).

    Mirrors `Issue` model fields the algorithm consumes (apps/api/plane/db/models/issue.py:145-146
    are `DateField(null=True)`; `updated_at` is `DateTimeField(auto_now=True)` from
    `TimeAuditModel`). `start_date` / `target_date` may be `None` to model PROP-17
    (incomplete schedule); `updated_at` is always present (Django guarantees).
    """

    id: UUID
    project_id: UUID
    start_date: date | None
    target_date: date | None
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class MoveIntent:
    """A user's drag intent for a single Work Item (D-04, US-35, API-02).

    All five fields required — by definition the dragged item must be a complete
    schedule. PROP-08 duration preservation is NOT enforced on construction;
    `propagate_move` rejects mismatched durations as `INVALID_DATE_RANGE` (D-06
    step 1) so the failure surfaces as a typed result, not an exception.
    """

    work_item_id: UUID
    original_start_date: date
    original_target_date: date
    requested_start_date: date
    requested_target_date: date


@dataclass(frozen=True, slots=True)
class WorkItemUpdate:
    """One entry in `PropagationResult.updates` (D-04).

    `updated_at` carries the INPUT value (Phase 3 sets the post-write value
    after `bulk_update`). This keeps Phase 2 free of clock dependence.
    """

    id: UUID
    start_date: date
    target_date: date
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class PropagationResult:
    """Public result of `propagate_move` (D-04, Result-pattern mirror of `LoadResult`).

    `failure is None` iff success. On success, `updates` ALWAYS includes the
    dragged item itself (PROP-03 / TEST-01 — even no-violation moves return
    one update). On failure, `updates == ()` (all-or-nothing — PROP-12).
    """

    requested_work_item_id: UUID
    failure: PropagationFailure | None
    updates: tuple[WorkItemUpdate, ...]
    total_updated_count: int

    @property
    def is_success(self) -> bool:
        """True iff `failure is None` (convenience accessor)."""
        return self.failure is None
```

Per D-04: dataclasses are frozen with slots; no `__post_init__` validators (PROP-08 enforced inside `propagate_move`).
</action>
<acceptance_criteria> - `apps/api/plane/app/services/timeline_propagation/errors.py` exists. - `grep -c "class PropagationErrorCode(StrEnum):" apps/api/plane/app/services/timeline_propagation/errors.py` returns 1. - `grep -c "class PropagationFailure:" apps/api/plane/app/services/timeline_propagation/errors.py` returns 1. - `grep -E "^    (DEPENDENCY_CYCLE|PROJECT_BOUNDARY_EXCEEDED|INCOMPLETE_SCHEDULE|PROPAGATION_LIMIT_EXCEEDED|SCHEDULE_CHANGED|PERMISSION_DENIED|INVALID_DATE_RANGE) = " apps/api/plane/app/services/timeline_propagation/errors.py | wc -l` returns 7. - `grep -c "@dataclass(frozen=True, slots=True)" apps/api/plane/app/services/timeline_propagation/types.py` returns 8 (Phase 1's 4 + Phase 2's 4). - `grep -c "^class ScheduledWorkItem:" apps/api/plane/app/services/timeline_propagation/types.py` returns 1; same for `MoveIntent`, `WorkItemUpdate`, `PropagationResult`. - `grep -nE "^    failure: PropagationFailure \| None$" apps/api/plane/app/services/timeline_propagation/types.py` returns at least 1 match (D-04 PropagationResult shape). - `grep -nE "^from .errors import PropagationFailure$" apps/api/plane/app/services/timeline_propagation/types.py` returns 1 match (relative import inside package, not circular). - `cd apps/api && python -c "from plane.app.services.timeline_propagation.errors import PropagationErrorCode, PropagationFailure; from plane.app.services.timeline_propagation.types import ScheduledWorkItem, MoveIntent, WorkItemUpdate, PropagationResult; assert len(list(PropagationErrorCode)) == 7"` exits 0. - Phase 1 dataclasses (`WorkItemNode`, `Edge`, `Adjacency`, `LoadResult`) still present and unmodified — verify by `git diff apps/api/plane/app/services/timeline_propagation/types.py | grep '^-' | grep -v '^--- ' | grep -E '(WorkItemNode|Edge|Adjacency|LoadResult)'` returns ZERO lines (no deletions of Phase 1 types).
</acceptance_criteria>
<automated>cd apps/api && python -c "from plane.app.services.timeline_propagation.errors import PropagationErrorCode, PropagationFailure; from plane.app.services.timeline_propagation.types import ScheduledWorkItem, MoveIntent, WorkItemUpdate, PropagationResult, Adjacency, Edge, LoadResult, WorkItemNode; assert [c.value for c in PropagationErrorCode] == ['DEPENDENCY_CYCLE', 'PROJECT_BOUNDARY_EXCEEDED', 'INCOMPLETE_SCHEDULE', 'PROPAGATION_LIMIT_EXCEEDED', 'SCHEDULE_CHANGED', 'PERMISSION_DENIED', 'INVALID_DATE_RANGE'], 'enum order mismatch'"</automated>
<requirements>PROP-14, PROP-17</requirements>
</task>

<task id="02-01-T2">
  <title>Task 2: Create scheduling.py + propagation.py STUB + extend __init__.py + test_scheduling.py (7 GREEN tests)</title>
  <read_first>
    - apps/api/plane/app/services/timeline_propagation/graph.py (lines 1-58 — header/docstring/section-divider conventions; lines 84-133 — public free-function pattern)
    - apps/api/plane/app/services/timeline_propagation/__init__.py (current 23-line file — extend the re-export barrel; alphabetic `__all__` discipline)
    - .planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-CONTEXT.md §D-03 (the SIX EXACT helper signatures), §D-12 (free-function `propagate_move` signature), §"Claude's Discretion" bullet 4 (re-export scheduling helpers from `__init__.py`)
    - .planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-RESEARCH.md §"Wave 3" (the 7 RED helper tests with exact names) and §"Algorithmic Pseudocode" lines 950-975 (expected `propagation.py` import list)
    - .planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-PATTERNS.md §2 ("scheduling.py NEW") and §5 ("__init__.py UPDATE") and §7 ("test_scheduling.py NEW")
  </read_first>
  <action>
**Step 1.** Create `apps/api/plane/app/services/timeline_propagation/scheduling.py` with this EXACT content (D-03 signatures verbatim; calendar-day arithmetic only):

```python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Date-range scheduling helpers for Timeline Dependency Schedule Propagation.

Pure-Python module — no DRF / no HTTP / no transactions / no ORM writes.

This module is the SINGLE seam for date arithmetic in `timeline_propagation/`
(CONTEXT.md D-03). `propagation.py` MUST NOT import `timedelta` directly;
every date computation routes through one of the six helpers below. ADR 0002's
Working Calendar follow-up replaces this one function module without touching
`propagation.py` (the deep-module-first directive: keep variability isolated
behind the small interface).

Calendar-day only (PROP-11). NO weekend/holiday logic in Phase 2.

Module scope (PROP-18): move-only.
"""

# Python imports
from datetime import date, timedelta


def range_duration(start: date, target: date) -> timedelta:
    """Return `target - start`. `start == target` → `timedelta(0)` (D-03)."""
    return target - start


def add_calendar_days(d: date, n: int) -> date:
    """Return `d + n` calendar days (n may be negative). Calendar-day only (D-03 / PROP-11)."""
    return d + timedelta(days=n)


def next_valid_start(after_target: date) -> date:
    """Return the earliest valid `start_date` for a successor whose predecessor ends on `after_target`.

    Per PRD line 82 / PROP-10 / D-02: `succ.start >= pred.target + 1 day`.
    """
    return after_target + timedelta(days=1)


def previous_valid_target(before_start: date) -> date:
    """Return the latest valid `target_date` for a predecessor whose successor starts on `before_start`.

    Mirror of `next_valid_start` for the backward (leftward) walk (D-02).
    """
    return before_start - timedelta(days=1)


def is_valid_range(start: date, target: date) -> bool:
    """Return True iff `target >= start` (zero-day duration is valid; D-03)."""
    return target >= start


def boundary_violation(predecessor_target: date, successor_start: date) -> bool:
    """Return True iff `successor_start < predecessor_target + 1 day` (D-02 / PROP-10).

    Strict less-than: `successor_start == predecessor_target + 1` is the canonical
    adjacent case and is VALID (returns False). `successor_start == predecessor_target`
    is a 1-day overlap and is a violation (returns True).
    """
    return successor_start < predecessor_target + timedelta(days=1)
```

**Step 2.** Create `apps/api/plane/app/services/timeline_propagation/propagation.py` STUB (Plan 02-02 fills this in):

```python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Date-range schedule propagation algorithm for Timeline Dependency.

Pure-Python module — no DRF / no HTTP / no transactions / no ORM writes.

STUB: the actual `propagate_move(...)` implementation lands in Plan 02-02.
This file exists in Plan 02-01 so `__init__.py` re-exports work without import
errors and the test scaffolding (`test_propagation.py::TestPublicSurface`)
can assert the function is importable.

Module scope (PROP-18): move-only.
"""

# Python imports
from collections.abc import Mapping
from datetime import datetime
from uuid import UUID

# Module imports
from .types import LoadResult, MoveIntent, PropagationResult, ScheduledWorkItem


def propagate_move(
    graph: LoadResult,
    work_items_by_id: Mapping[UUID, ScheduledWorkItem],
    move_intent: MoveIntent,
    expected_versions: Mapping[UUID, datetime],
) -> PropagationResult:
    """Compute the minimum schedule propagation for a single Work Item move.

    See CONTEXT.md D-01..D-12 for the algorithm contract. Plan 02-02 implements
    the BFS frontier walk; Plan 02-01 ships only this stub so the public
    surface (`__init__.py` re-export) and the test scaffolding compile.
    """
    raise NotImplementedError("propagate_move lands in Plan 02-02")
```

**Step 3.** Replace `apps/api/plane/app/services/timeline_propagation/__init__.py` ENTIRELY with this content (extends Phase 1 re-exports per D-12 + Claude's Discretion; alphabetic `__all__`):

```python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Timeline Dependency Schedule Propagation — pure-Python service module.

Pure-Python service module — no DRF / no HTTP / no transactions. Owns the
precedence graph loader (Phase 1) and the date-range propagation algorithm
(Phase 2). The Phase 3 DRF view consumes both via the public re-exports below.

Module scope (PROP-18): move-only. Resize is not a concept in this module.
"""

from .errors import PropagationErrorCode, PropagationFailure
from .graph import load_precedence_graph
from .propagation import propagate_move
from .scheduling import (
    add_calendar_days,
    boundary_violation,
    is_valid_range,
    next_valid_start,
    previous_valid_target,
    range_duration,
)
from .types import (
    Adjacency,
    Edge,
    LoadResult,
    MoveIntent,
    PropagationResult,
    ScheduledWorkItem,
    WorkItemNode,
    WorkItemUpdate,
)

__all__ = [
    "Adjacency",
    "Edge",
    "LoadResult",
    "MoveIntent",
    "PropagationErrorCode",
    "PropagationFailure",
    "PropagationResult",
    "ScheduledWorkItem",
    "WorkItemNode",
    "WorkItemUpdate",
    "add_calendar_days",
    "boundary_violation",
    "is_valid_range",
    "load_precedence_graph",
    "next_valid_start",
    "previous_valid_target",
    "propagate_move",
    "range_duration",
]
```

**Step 4.** Create `apps/api/plane/tests/unit/services/timeline_propagation/test_scheduling.py` with all 7 GREEN helper tests (Wave 3 RED list from RESEARCH.md, but they go GREEN immediately because Step 1 already implemented the helpers):

```python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for `plane.app.services.timeline_propagation.scheduling` helpers.

Pure-Python tests — NO `@pytest.mark.django_db` (CONTEXT.md D-13).
Imports go through the package barrel (CONTEXT.md "Claude's Discretion" bullet 4
re-exports the helpers from `__init__.py`), so this file does NOT depth-import.

Coverage map (CONTEXT.md D-03 / RESEARCH.md Wave 3):
  TestRangeDuration         → range_duration (PROP-08 setup for Plan 02-02)
  TestAddCalendarDays       → add_calendar_days (PROP-11)
  TestNextValidStart        → next_valid_start (D-02 forward shift)
  TestPreviousValidTarget   → previous_valid_target (D-02 backward shift)
  TestIsValidRange          → is_valid_range (D-06 step 1)
  TestBoundaryViolation     → boundary_violation (PROP-10 / TEST-08)
"""

# Python imports
from datetime import date, timedelta

import pytest

# Module imports
from plane.app.services.timeline_propagation import (
    add_calendar_days,
    boundary_violation,
    is_valid_range,
    next_valid_start,
    previous_valid_target,
    range_duration,
)


@pytest.mark.unit
class TestRangeDuration:
    """range_duration(start, target) returns target - start (D-03)."""

    def test_zero_duration_when_start_equals_target(self):
        d = date(2026, 5, 4)
        assert range_duration(d, d) == timedelta(0)

    def test_one_day_duration_when_target_one_day_after_start(self):
        start = date(2026, 5, 4)
        target = date(2026, 5, 5)
        assert range_duration(start, target) == timedelta(days=1)

    def test_negative_duration_when_target_before_start(self):
        start = date(2026, 5, 10)
        target = date(2026, 5, 5)
        assert range_duration(start, target) == timedelta(days=-5)


@pytest.mark.unit
class TestAddCalendarDays:
    """add_calendar_days advances calendar (PROP-11; ignores weekends/holidays)."""

    def test_advances_calendar_across_weekend(self):
        # 2026-05-04 is a Monday; +5 days = 2026-05-09 (Saturday) — no working-day skip
        assert add_calendar_days(date(2026, 5, 4), 5) == date(2026, 5, 9)

    def test_negative_n_walks_backward(self):
        assert add_calendar_days(date(2026, 5, 10), -3) == date(2026, 5, 7)

    def test_zero_n_returns_same_date(self):
        d = date(2026, 5, 4)
        assert add_calendar_days(d, 0) == d


@pytest.mark.unit
class TestNextValidStart:
    """next_valid_start(after_target) = after_target + 1 day (D-02 / PROP-10)."""

    def test_is_target_plus_one(self):
        assert next_valid_start(date(2026, 5, 4)) == date(2026, 5, 5)


@pytest.mark.unit
class TestPreviousValidTarget:
    """previous_valid_target(before_start) = before_start - 1 day (D-02 mirror)."""

    def test_is_start_minus_one(self):
        assert previous_valid_target(date(2026, 5, 5)) == date(2026, 5, 4)


@pytest.mark.unit
class TestIsValidRange:
    """is_valid_range = (target >= start); equal dates are valid 0-day duration (D-03)."""

    def test_target_equal_start_is_valid(self):
        d = date(2026, 5, 4)
        assert is_valid_range(d, d) is True

    def test_target_after_start_is_valid(self):
        assert is_valid_range(date(2026, 5, 4), date(2026, 5, 5)) is True

    def test_target_before_start_is_invalid(self):
        assert is_valid_range(date(2026, 5, 5), date(2026, 5, 4)) is False


@pytest.mark.unit
class TestBoundaryViolation:
    """boundary_violation = (succ_start < pred_target + 1 day) — strict less-than (D-02 / PROP-10 / TEST-08)."""

    def test_adjacent_succ_start_equals_pred_target_plus_one_is_valid(self):
        # PROP-10 canonical adjacency: NOT a violation
        pred_target = date(2026, 5, 4)
        succ_start = date(2026, 5, 5)
        assert boundary_violation(pred_target, succ_start) is False

    def test_one_day_overlap_is_violation(self):
        # succ.start == pred.target → 1-day overlap → violation
        d = date(2026, 5, 4)
        assert boundary_violation(d, d) is True

    def test_succ_well_after_pred_is_valid(self):
        assert boundary_violation(date(2026, 5, 4), date(2026, 5, 20)) is False
```

**Step 5.** Create `apps/api/plane/tests/unit/services/timeline_propagation/test_propagation.py` SCAFFOLD with two GREEN tests + one placeholder (Plan 02-02 grows this file with the algorithm tests):

```python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for `plane.app.services.timeline_propagation.propagate_move`.

Pure-Python tests — NO `@pytest.mark.django_db` (CONTEXT.md D-13). Hand-built
in-memory `Adjacency` / `LoadResult` / `ScheduledWorkItem` / `MoveIntent`
literals; no factory_boy.

Plan 02-01 lands the typed contract + STUB only. Plan 02-02 fills in:
  TestNoViolationMove          → TEST-01 (PROP-03)
  TestRightwardPropagation     → TEST-02 (PROP-04)
  TestLeftwardPropagation      → TEST-03 (PROP-05)
  TestTransitiveChain          → TEST-04 (PROP-06)
  TestSplitBranches            → TEST-05 (PROP-06)
  TestMergeBranches            → TEST-06 (PROP-06)
  TestGapPreservation          → TEST-07 (PROP-07)
  TestExactBoundaryAdjacency   → TEST-08 (PROP-10)
  TestIncompleteSchedule       → TEST-09 (PROP-17)
  TestPropagationLimit         → TEST-12 (PROP-13)
  TestInvalidDateRange         → TEST-14 (PROP-08)
  TestCycleFailFast            → D-07
  TestCrossProjectReachable    → D-10 (PROP-16 translated)
  TestStaleSchedule            → D-08 (API-07 algorithm-side)
  TestNoOpMove                 → D-01 delta=0
  TestValidationOrder          → D-06
"""

# Python imports
from collections.abc import Mapping
from datetime import datetime, timezone
from uuid import UUID, uuid4

import pytest

# Module imports
from plane.app.services.timeline_propagation import (
    Adjacency,
    LoadResult,
    MoveIntent,
    PropagationErrorCode,
    PropagationFailure,
    PropagationResult,
    ScheduledWorkItem,
    WorkItemUpdate,
    propagate_move,
)


@pytest.mark.unit
class TestErrorsModule:
    """PropagationErrorCode is a 7-value StrEnum in canonical order (D-05)."""

    def test_seven_str_enum_codes_present_in_canonical_order(self):
        """The 7 canonical wire codes appear in this exact order (D-05 / API-06)."""
        expected = [
            "DEPENDENCY_CYCLE",
            "PROJECT_BOUNDARY_EXCEEDED",
            "INCOMPLETE_SCHEDULE",
            "PROPAGATION_LIMIT_EXCEEDED",
            "SCHEDULE_CHANGED",
            "PERMISSION_DENIED",
            "INVALID_DATE_RANGE",
        ]
        assert [c.value for c in PropagationErrorCode] == expected
        # StrEnum: each member equals its string value (allows JSON serialization)
        for value in expected:
            assert PropagationErrorCode(value).value == value

    def test_propagation_failure_defaults_for_optional_fields(self):
        """PropagationFailure(code, message) leaves work_item_id and cycle as None (D-05)."""
        failure = PropagationFailure(
            code=PropagationErrorCode.DEPENDENCY_CYCLE,
            message="diagnostic",
        )
        assert failure.work_item_id is None
        assert failure.cycle is None


@pytest.mark.unit
class TestPublicSurface:
    """The Phase 2 public surface is importable through the package barrel (D-12)."""

    def test_init_exports_propagate_move_and_value_types(self):
        """`from plane.app.services.timeline_propagation import propagate_move, ...` works (D-12)."""
        # If the import at the top of this file failed, pytest would already be RED.
        # This test pins the public surface as an explicit assertion.
        assert callable(propagate_move)
        assert MoveIntent.__dataclass_params__.frozen is True
        assert ScheduledWorkItem.__dataclass_params__.frozen is True
        assert WorkItemUpdate.__dataclass_params__.frozen is True
        assert PropagationResult.__dataclass_params__.frozen is True

    def test_init_re_exports_scheduling_helpers(self):
        """All six scheduling helpers are re-exported from the package barrel (Claude's Discretion bullet 4)."""
        from plane.app.services import timeline_propagation as pkg

        for name in (
            "add_calendar_days",
            "boundary_violation",
            "is_valid_range",
            "next_valid_start",
            "previous_valid_target",
            "range_duration",
        ):
            assert hasattr(pkg, name), f"missing scheduling helper export: {name}"

    def test_propagate_move_stub_raises_not_implemented(self):
        """Plan 02-01 STUB raises; Plan 02-02 makes this test RED then GREEN with the algorithm."""
        # Build minimal valid inputs so we exercise the call path (not the validation).
        dragged_id = uuid4()
        project_id = uuid4()
        empty_adj = Adjacency(
            successors={},
            predecessors={},
            nodes=frozenset({dragged_id}),
            cross_project_edges=(),
        )
        graph = LoadResult(adjacency=empty_adj, cycle=None)
        now = datetime.now(tz=timezone.utc)
        items: Mapping[UUID, ScheduledWorkItem] = {
            dragged_id: ScheduledWorkItem(
                id=dragged_id,
                project_id=project_id,
                start_date=None,  # any value; STUB raises before reading
                target_date=None,
                updated_at=now,
            )
        }
        # Note: this STUB raise is REPLACED by Plan 02-02 with a TestNoViolationMove
        # test that asserts a successful PropagationResult (TEST-01).
        intent = MoveIntent(
            work_item_id=dragged_id,
            original_start_date=ScheduledWorkItem.__dataclass_fields__["start_date"].type and __import__("datetime").date(2026, 5, 4),
            original_target_date=__import__("datetime").date(2026, 5, 6),
            requested_start_date=__import__("datetime").date(2026, 5, 4),
            requested_target_date=__import__("datetime").date(2026, 5, 6),
        )
        with pytest.raises(NotImplementedError):
            propagate_move(graph, items, intent, {dragged_id: now})
```

NOTE on the placeholder test: it uses `__import__` to avoid adding a top-of-file `from datetime import date` only for one stub test. Plan 02-02 will REMOVE the `test_propagate_move_stub_raises_not_implemented` test, add `from datetime import date` to the imports block, and replace the body of `TestNoViolationMove` etc. with the real Wave 4-10 tests.

If preferred for cleanliness, the executor MAY add `from datetime import date` to the imports block now and use literal `date(2026, 5, 4)` calls — both styles satisfy the acceptance criteria; the `__import__` form is the minimum-blast-radius variant that avoids modifying the imports block twice.
</action>
<acceptance_criteria> - `apps/api/plane/app/services/timeline_propagation/scheduling.py` exists; `grep -cE "^def (range_duration|add_calendar_days|next_valid_start|previous_valid_target|is_valid_range|boundary_violation)\(" apps/api/plane/app/services/timeline_propagation/scheduling.py` returns 6. - `apps/api/plane/app/services/timeline_propagation/propagation.py` exists; `grep -c "raise NotImplementedError" apps/api/plane/app/services/timeline_propagation/propagation.py` returns 1. - `grep -c "def propagate_move(" apps/api/plane/app/services/timeline_propagation/propagation.py` returns 1. - `__init__.py` `__all__` contains exactly 18 entries — verified by `cd apps/api && python -c "import plane.app.services.timeline_propagation as p; assert len(p.__all__) == 18, f'expected 18 exports, got {len(p.__all__)}'"`. - `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_scheduling.py -q` exits 0 with at least 12 tests collected and passing. - `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_propagation.py::TestErrorsModule plane/tests/unit/services/timeline_propagation/test_propagation.py::TestPublicSurface -q` exits 0. - Phase 1's existing lint-grep test STILL passes — `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_graph.py::test_no_drf_or_http_imports_in_module -q` exits 0 (proves D-14 file-level purity is honored even before Plan 02-03 extends the forbidden tuple). - Phase 1 tests are unaffected — `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_graph.py -q` exits 0 with the same number of tests as before this plan started (re-run to confirm no regression). - `grep -c "from datetime import timedelta" apps/api/plane/app/services/timeline_propagation/propagation.py` returns 0 (Pitfall 9 / D-03 — propagation.py STUB MUST NOT import timedelta directly; Plan 02-03 enforces this with a lint-grep test).
</acceptance_criteria>
<automated>cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_scheduling.py plane/tests/unit/services/timeline_propagation/test_propagation.py::TestErrorsModule plane/tests/unit/services/timeline_propagation/test_propagation.py::TestPublicSurface plane/tests/unit/services/timeline_propagation/test_graph.py::test_no_drf_or_http_imports_in_module -q</automated>
<requirements>PROP-08, PROP-10, PROP-11, PROP-14, PROP-17</requirements>
</task>

## Verification

**Per-task verification** is pinned in each task's `<automated>` block.

**Plan-level smoke (after both tasks complete):**

```bash
cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/ -q
```

Expected: ALL Phase 1 tests still green + 12 new test_scheduling tests green + 4 new test_propagation tests green (`TestErrorsModule` × 2 + `TestPublicSurface` × ~3 + 1 STUB raise test). Total green test count ≥ Phase-1 baseline + 16.

**Public surface integrity check:**

```bash
cd apps/api && python -c "
from plane.app.services.timeline_propagation import (
    Adjacency, Edge, LoadResult, WorkItemNode,                                # Phase 1
    MoveIntent, ScheduledWorkItem, WorkItemUpdate, PropagationResult,         # Phase 2 D-04
    PropagationErrorCode, PropagationFailure,                                  # Phase 2 D-05
    propagate_move, load_precedence_graph,                                     # Phase 1+2 D-12
    range_duration, add_calendar_days, next_valid_start,                       # Phase 2 D-03
    previous_valid_target, is_valid_range, boundary_violation,                 #   (helpers)
)
print('Public surface intact: 18 exports')
"
```

## Success Criteria

- All acceptance criteria in T1 + T2 pass.
- Phase 1 baseline tests stay green (no regression).
- `propagate_move` is callable from the package barrel and raises `NotImplementedError` (Plan 02-02 makes the body real).
- The 12 scheduling helper tests + 2 errors-module tests + 3 public-surface tests + 1 STUB raise test all GREEN — a total of ~18 new GREEN tests in this plan.

## Output

After completion, create `.planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-01-SUMMARY.md` documenting:

- Files created/modified (list).
- Test counts (12 scheduling + 6 propagation-scaffold = 18 new green tests).
- Public surface enumerated (18 names).
- Open hand-off to Plan 02-02 (the algorithm implementation).

<threat_model>
**ASVS L1 surface:** none (pure-Python algorithm scaffolding; no auth boundary, no SQL, no network, no PII, no untrusted input).
**Indirect contributions:** the typed `PROPAGATION_LIMIT_EXCEEDED` value introduced in `errors.py` (D-11) is a denial-of-service control surface — Plan 02-02 implements the cap; Plan 02-01 only declares the typed code so the contract exists.
**Phase 3 hand-off:** authentication, authorization (`PERMISSION_DENIED` enum value lives here for symmetry but is RAISED only by Phase 3's viewset), CSRF, input validation at the HTTP boundary, and `transaction.atomic` rollback semantics are owned by the Phase 3 viewset, not Phase 2.
</threat_model>
