# Phase 1: Precedence Graph Loader & Normalization - Pattern Map

**Mapped:** 2026-05-03
**Files analyzed:** 7 (all NEW)
**Analogs found:** 7 / 7 (5 exact-or-strong, 2 role-match)

## File Classification

| New File                                                                | Role                           | Data Flow                                     | Closest Analog                                                                                                                                                                                       | Match Quality                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------- | ------------------------------ | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/plane/app/services/__init__.py`                               | package marker (umbrella)      | n/a (import-only)                             | `apps/api/plane/tests/unit/__init__.py`                                                                                                                                                              | exact (empty marker idiom)                                                                                                                                                                                                      |
| `apps/api/plane/app/services/timeline_propagation/__init__.py`          | sub-package re-export barrel   | n/a (import-only)                             | `apps/api/plane/utils/exporters/__init__.py` (also `utils/filters/__init__.py`, `utils/core/__init__.py`)                                                                                            | exact (re-export idiom)                                                                                                                                                                                                         |
| `apps/api/plane/app/services/timeline_propagation/types.py`             | service / value-type module    | transform (in-memory immutable values)        | `apps/api/plane/utils/exporters/schemas/base.py` (sole `@dataclass` user in `apps/api/plane/`)                                                                                                       | role-match (regular `@dataclass`; Phase 1 introduces `frozen=True, slots=True` deliberately)                                                                                                                                    |
| `apps/api/plane/app/services/timeline_propagation/graph.py`             | service / pure-function loader | transform (Iterable rows → adjacency + cycle) | `apps/api/plane/utils/issue_search.py` (single-purpose pure free function with QuerySet input); shape inspiration from `apps/api/plane/utils/issue_relation_mapper.py` (canonical-direction mapping) | role-match (no other "pure free function over IssueRelation rows" exists; Phase 1 establishes the convention)                                                                                                                   |
| `apps/api/plane/tests/unit/services/__init__.py`                        | test package marker            | n/a                                           | `apps/api/plane/tests/unit/utils/__init__.py`                                                                                                                                                        | exact                                                                                                                                                                                                                           |
| `apps/api/plane/tests/unit/services/timeline_propagation/__init__.py`   | test sub-package marker        | n/a                                           | `apps/api/plane/tests/unit/utils/__init__.py`                                                                                                                                                        | exact                                                                                                                                                                                                                           |
| `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py` | unit test (django_db)          | request-response (test → assert)              | `apps/api/plane/tests/unit/models/test_issue_comment_modal.py` (per-test fixture chain workspace→project→state→issue with `Model.objects.create`)                                                    | exact (canonical pattern for `@pytest.mark.unit` + `@pytest.mark.django_db` with real ORM rows). Secondary: `tests/unit/utils/test_uuid.py` for the _pure_ (non-`django_db`) class-based test shape used by the lint-grep test. |

## Pattern Assignments

### `apps/api/plane/app/services/__init__.py` — services umbrella package marker

**Analog:** `apps/api/plane/tests/unit/__init__.py`

**Full file content** (this is the canonical empty-marker idiom — copy verbatim, no exports):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/tests/unit/__init__.py — entire file
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

```

**Why this analog:** RESEARCH.md notes that `apps/api/plane/app/services/` does not yet exist and that the `services` umbrella should be left empty (no eager Django-model imports — see RESEARCH.md "Pitfall 5"). Every existing empty package marker in this repo follows the exact 4-line header above (license header + blank line). Verified across `tests/__init__.py`, `tests/unit/__init__.py`, `tests/unit/utils/__init__.py`, `tests/unit/models/__init__.py`, `plane/utils/__init__.py`.

**Apply pattern:** Copy the 4-line header verbatim. No `from … import …`, no `__all__`. Phase 1 leaves this file empty so future service sub-packages can be added without touching the umbrella.

---

### `apps/api/plane/app/services/timeline_propagation/__init__.py` — sub-package barrel

**Analog:** `apps/api/plane/utils/exporters/__init__.py` (lines 1–43)

**Imports + module docstring + flat re-exports + `__all__` pattern** (lines 1–22):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/utils/exporters/__init__.py:1-22
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Export utilities for various data formats."""

from .exporter import Exporter
from .formatters import BaseFormatter, CSVFormatter, JSONFormatter, XLSXFormatter
from .schemas import (
    BooleanField,
    DateField,
    DateTimeField,
    ExportField,
    ExportSchema,
    IssueExportSchema,
    JSONField,
    ListField,
    NumberField,
    StringField,
)

__all__ = [
    # Core Exporter
    "Exporter",
    ...
```

**Why this analog:** Closest match in the entire `apps/api/plane/` tree for "sub-package with a small public surface re-exported flat from `__init__.py`." Same approach is used by `apps/api/plane/utils/filters/__init__.py:1-14` and `apps/api/plane/utils/core/__init__.py:1-25`. Per `apps/api/pyproject.toml:69-70`, `__init__.py` files have `F401` ignored, so re-export-only files are idiomatic and lint-clean.

**Apply pattern (target shape — recommended in RESEARCH.md §"Recommended Project Structure" lines 266-285):**

```python
# apps/api/plane/app/services/timeline_propagation/__init__.py
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Precedence graph loader & normalization for Timeline Dependency Schedule Propagation.

Pure-Python service module — no DRF / no HTTP / no transactions.
Consumed by `propagate_move` (Phase 2) and the Phase 3 DRF view.

Module scope (PROP-18): move-only. Resize is not a concept in this module.
"""

from .graph import load_precedence_graph
from .types import Adjacency, Edge, LoadResult, WorkItemNode

__all__ = [
    "Adjacency",
    "Edge",
    "LoadResult",
    "WorkItemNode",
    "load_precedence_graph",
]
```

---

### `apps/api/plane/app/services/timeline_propagation/types.py` — frozen value-type module

**Analog:** `apps/api/plane/utils/exporters/schemas/base.py` (lines 1–10) — the **only** file in `apps/api/plane/` using `@dataclass` (`grep @dataclass apps/api/plane` returned exactly this file).

**Imports pattern** (lines 1–8):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/utils/exporters/schemas/base.py:1-8
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from django.db.models import QuerySet
```

**Decorator + class shape pattern** (lines 11–17 and 46–55):

```python
# base.py:11-17 — the canonical existing dataclass shape in this repo
@dataclass
class ExportField:
    """Base export field class for generic fields."""

    source: Optional[str] = None
    default: Any = ""
    label: Optional[str] = None  # Display name for export headers
```

```python
# base.py:46-55 — subclass with default override
@dataclass
class StringField(ExportField):
    """Export field for string values."""

    default: str = ""

    def _format_value(self, raw: Any) -> str:
        if raw is None:
            return self.default
        return str(raw)
```

**Why this analog:** Sole `@dataclass` precedent in the backend. Establishes that:

- License header (4 lines) precedes module docstring/imports.
- `from dataclasses import dataclass, field` is the import line (NOT `import dataclasses`).
- Plain `@dataclass` (no `frozen=` / `slots=`) is the existing default; Phase 1 deliberately departs to `@dataclass(frozen=True, slots=True)` per CONTEXT.md D-06/D-07 and RESEARCH.md §"Pattern 1: Frozen value-type dataclasses" (lines 288–355). RESEARCH.md A8 confirms `frozen=True`/`slots=True` are zero-hit today; Phase 1 introduces the convention deliberately for value-type immutability.

**Modernization deltas Phase 1 must apply** (vs. this analog) — sourced from RESEARCH.md §"State of the Art" lines 891–897:

- Use PEP-585 native generics: `tuple[Edge, ...]`, `frozenset[UUID]`, `dict[UUID, ...]` — not `typing.Tuple` / `typing.FrozenSet`.
- Use PEP-604 unions: `tuple[UUID, ...] | None` — not `Optional[tuple[UUID, ...]]`.
- Import `Mapping` from `collections.abc`, not `typing` (the analog uses old `typing.Dict/List/Optional`; Phase 1 should NOT mirror that).
- Do NOT add `from __future__ import annotations` — RESEARCH.md A7 confirms zero hits in `apps/api/plane/`; introducing it would silently set a new convention.

**Target shape** (RESEARCH.md "Pattern 1" lines 295–355 reproduces full file; planner copies from there).

---

### `apps/api/plane/app/services/timeline_propagation/graph.py` — pure-function loader

**Analog (closest by role: "pure free function consuming a Django QuerySet/Iterable"):** `apps/api/plane/utils/issue_search.py` (entire file, 25 lines).

**Full file** (the entire shape Phase 1 should mirror at the top level — license header, single-line section dividers, free function with type hints):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/utils/issue_search.py:1-25
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import re

# Django imports
from django.db.models import Q

# Module imports


def search_issues(query, queryset):
    fields = ["name", "sequence_id", "project__identifier"]
    q = Q()
    for field in fields:
        if field == "sequence_id" and len(query) <= 20:
            sequences = re.findall(r"\b\d+\b", query)
            for sequence_id in sequences:
                q |= Q(**{"sequence_id": sequence_id})
        else:
            q |= Q(**{f"{field}__icontains": query})
    return queryset.filter(q).distinct()
```

**Why this analog:** Closest existing "pure free function takes a queryset, returns transformed result" in `apps/api/plane/`. Establishes the section-divider comment idiom (`# Python imports` / `# Django imports` / `# Module imports`) used across the backend.

**Secondary analog (canonical-direction mapping):** `apps/api/plane/utils/issue_relation_mapper.py` lines 19–32 — this is the function the loader's directionality must AGREE with.

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/utils/issue_relation_mapper.py:19-32
def get_actual_relation(relation_type):
    # This function is used to get the actual relation type which is stored in database
    actual_relation = {
        "start_after": "start_before",
        "finish_after": "finish_before",
        "blocking": "blocked_by",
        "blocked_by": "blocked_by",
        "start_before": "start_before",
        "finish_before": "finish_before",
        "implemented_by": "implemented_by",
        "implements": "implemented_by",
    }

    return actual_relation.get(relation_type, relation_type)
```

**Directionality cross-check 1 — web app viewset** (`apps/api/plane/app/views/issue/relation.py:220-237` — IssueRelation row construction):

```python
# apps/api/plane/app/views/issue/relation.py:220-237
issue_relation = IssueRelation.objects.bulk_create(
    [
        IssueRelation(
            issue_id=(issue if relation_type in ["blocking", "start_after", "finish_after"] else issue_id),
            related_issue_id=(
                issue_id if relation_type in ["blocking", "start_after", "finish_after"] else issue
            ),
            relation_type=(get_actual_relation(relation_type)),
            project_id=project_id,
            workspace_id=project.workspace_id,
            created_by=request.user,
            updated_by=request.user,
        )
        for issue in issues
    ],
    batch_size=10,
    ignore_conflicts=True,
)
```

**Directionality cross-check 2 — external API** (`apps/api/plane/api/views/issue.py:2424-2442` — same swap):

```python
# apps/api/plane/api/views/issue.py:2424-2442
actual_relation = get_actual_relation(relation_type)
is_reverse = relation_type in ["blocking", "start_after", "finish_after"]

IssueRelation.objects.bulk_create(
    [
        IssueRelation(
            issue_id=(issue if is_reverse else issue_id),
            related_issue_id=(issue_id if is_reverse else issue),
            relation_type=actual_relation,
            project_id=project_id,
            workspace_id=project.workspace_id,
            created_by=request.user,
            updated_by=request.user,
        )
        for issue in issues
    ],
    batch_size=10,
    ignore_conflicts=True,
)
```

**Both creation paths confirm:** when the user requests `"blocking"` from `source` to `target`, the row is stored as `IssueRelation(issue=target, related_issue=source, relation_type="blocked_by")`. So the loader's normalization rule is fixed:

> For each `IssueRelation` row `(issue=X, related_issue=Y, relation_type="blocked_by")` →
> emit `Edge(predecessor_id=Y (=row.related_issue_id), successor_id=X (=row.issue_id))`.

Add this comment verbatim above the edge construction in `graph.py` (per RESEARCH.md "Pitfall 1" line 506).

**`IssueRelation` schema** (`apps/api/plane/db/models/issue.py:287-308`) — confirms field names the loader inspects:

```python
# apps/api/plane/db/models/issue.py:287-308
class IssueRelation(ProjectBaseModel):
    issue = models.ForeignKey(Issue, related_name="issue_relation", on_delete=models.CASCADE)
    related_issue = models.ForeignKey(Issue, related_name="issue_related", on_delete=models.CASCADE)
    relation_type = models.CharField(
        max_length=20,
        verbose_name="Issue Relation Type",
        default=IssueRelationChoices.BLOCKED_BY,
    )

    class Meta:
        unique_together = ["issue", "related_issue", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "related_issue"],
                condition=Q(deleted_at__isnull=True),
                name="issue_relation_unique_issue_related_issue_when_deleted_at_null",
            )
        ]
        verbose_name = "Issue Relation"
        verbose_name_plural = "Issue Relations"
        db_table = "issue_relations"
        ordering = ("-created_at",)
```

The loader uses `row.issue_id`, `row.related_issue_id`, `row.relation_type`, `row.id`, `row.project_id` directly — no `.issue` / `.related_issue` traversal except for the cross-project classification fallback (RESEARCH.md "Code Examples" line 555).

**`IssueRelationChoices`** (`apps/api/plane/db/models/issue.py:263-284`) — the loader's filter `relation_type == "blocked_by"` should reference `IssueRelationChoices.BLOCKED_BY` (not a magic string), per RESEARCH.md §"Existing Code Insights — Reusable Assets":

```python
# apps/api/plane/db/models/issue.py:263-284
class IssueRelationChoices(models.TextChoices):
    DUPLICATE = "duplicate", "Duplicate"
    RELATES_TO = "relates_to", "Relates To"
    BLOCKED_BY = "blocked_by", "Blocked By"
    START_BEFORE = "start_before", "Start Before"
    FINISH_BEFORE = "finish_before", "Finish Before"
    IMPLEMENTED_BY = "implemented_by", "Implemented By"


# Bidirectional relation pairs: (forward, reverse)
# Defined after class to avoid enum metaclass conflicts
IssueRelationChoices._RELATION_PAIRS = (
    ("blocked_by", "blocking"),
    ("relates_to", "relates_to"),  # symmetric
    ("duplicate", "duplicate"),  # symmetric
    ("start_before", "start_after"),
    ("finish_before", "finish_after"),
    ("implemented_by", "implements"),
)
```

**Soft-delete defense (D-05)** — `apps/api/plane/db/mixins.py:48-67`:

```python
# apps/api/plane/db/mixins.py:48-67
class SoftDeletionQuerySet(models.QuerySet):
    def delete(self, soft=True):
        if soft:
            return self.update(deleted_at=timezone.now())
        else:
            return super().delete()


class SoftDeletionManager(models.Manager):
    def get_queryset(self):
        return SoftDeletionQuerySet(self.model, using=self._db).filter(deleted_at__isnull=True)


class SoftDeleteModel(models.Model):
    """To soft delete records"""

    deleted_at = models.DateTimeField(verbose_name="Deleted At", null=True, blank=True)

    objects = SoftDeletionManager()
    all_objects = models.Manager()
```

Loader's defensive filter `if getattr(row, "deleted_at", None) is not None: skip` protects against callers that use `IssueRelation.all_objects` or hand-built dataclass rows that bypass `objects`.

**Iterative three-color DFS pattern (D-02):** No existing code in `apps/api/plane/` implements DFS or cycle detection (`grep` returned 0 hits — Phase 1 introduces the algorithm). RESEARCH.md "Pattern 3" lines 419–478 supplies the canonical pseudocode the planner copies into `graph.py`. Key invariants the planner must preserve:

- iterate `for root in sorted(adj.nodes)` and `iter(sorted(adj.successors_of(child)))` — RESEARCH.md "Pitfall 4" deterministic-iteration discipline.
- self-edge guard before any color check (`if child == node: return (node, node)`) — RESEARCH.md line 451.
- return `tuple[UUID, ...]` (closed path) on first back-edge; never raise.

**Anti-patterns to avoid in `graph.py`** (RESEARCH.md lines 480–487, lifted to PATTERNS so the planner sees them inline):

- No `from rest_framework`, `django.http`, `plane.app.views`, `plane.app.serializers` imports anywhere (D-08).
- No `IssueRelation.objects.filter(...)` calls inside the loader (D-01: `Iterable` is the seam).
- No `sys.setrecursionlimit` (D-02: iterative only).
- No mutation of `Adjacency` after construction (frozen by intent).
- No use of `row.project_id` for cross-project classification — use `row.related_issue.project_id` / `getattr(row, "related_project_id", None)`.

---

### `apps/api/plane/tests/unit/services/__init__.py` and `apps/api/plane/tests/unit/services/timeline_propagation/__init__.py` — test package markers

**Analog:** `apps/api/plane/tests/unit/utils/__init__.py` (entire file, 4 lines) — also `tests/unit/__init__.py`, `tests/unit/models/__init__.py`, `tests/unit/serializers/__init__.py` all share the same content.

**Full file content** (copy verbatim — license header + trailing blank line, nothing else):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/tests/unit/utils/__init__.py — entire file
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

```

**Why this analog:** Every existing `tests/unit/<subdir>/__init__.py` follows this exact 4-line shape. Pytest discovers test packages without needing exports; per `apps/api/pyproject.toml:69-70`, test files have `F401`/`F811` ignored, so adding stray imports here would only invite drift.

---

### `apps/api/plane/tests/unit/services/timeline_propagation/test_graph.py` — full test module

**Primary analog (per-test ORM fixture chain):** `apps/api/plane/tests/unit/models/test_issue_comment_modal.py`.

**Imports pattern** (lines 1–8):

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/tests/unit/models/test_issue_comment_modal.py:1-8
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.db.models import IssueComment, Description, Project, Issue, Workspace, State
```

**Workspace → project → state → issue fixture chain pattern** (lines 10–51) — Phase 1's `test_graph.py` should reuse this exact shape (rename `issue` to per-test helpers; keep `workspace`, `project`, `state` as `@pytest.fixture` definitions):

```python
# test_issue_comment_modal.py:10-51
@pytest.fixture
def workspace(create_user):
    """Create a test workspace"""
    return Workspace.objects.create(
        name="Test Workspace",
        slug="test-workspace",
        owner=create_user,
    )


@pytest.fixture
def project(workspace, create_user):
    """Create a test project"""
    return Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def state(project):
    """Create a test state"""
    return State.objects.create(
        name="Todo",
        project=project,
        group="backlog",
        default=True,
    )


@pytest.fixture
def issue(workspace, project, state, create_user):
    """Create a test issue"""
    return Issue.objects.create(
        name="Test Issue",
        workspace=workspace,
        project=project,
        state=state,
        created_by=create_user,
    )
```

**Critical detail (RESEARCH.md "Pitfall 3" lines 515–519):** the `state` fixture **must exist before any `Issue` is created** because `Issue.save()` (`apps/api/plane/db/models/issue.py:178-234`) auto-resolves `state` from `State.objects.filter(project=..., default=True)`. The `default=True` flag on the state fixture is load-bearing.

**Class-based test pattern with `@pytest.mark.unit` + per-method `@pytest.mark.django_db`** (lines 54–89):

```python
# test_issue_comment_modal.py:54-89
@pytest.mark.unit
class TestIssueCommentModel:
    """Test the IssueComment model"""

    @pytest.mark.django_db
    def test_issue_comment_creation_creates_description(self, workspace, project, issue, create_user):
        """Test that creating a comment automatically creates a description"""
        # Arrange
        comment_html = "<p>This is a test comment</p>"
        comment_json = {"type": "doc", "content": [{"type": "paragraph", "text": "This is a test comment"}]}

        # Act
        issue_comment = IssueComment.objects.create(
            workspace=workspace,
            project=project,
            issue=issue,
            comment_html=comment_html,
            comment_json=comment_json,
            created_by=create_user,
            updated_by=create_user,
        )

        # Assert
        assert issue_comment.id is not None
        ...
```

**Why this analog:** `test_issue_comment_modal.py` is a near-perfect template (per RESEARCH.md confidence note line 998: "test_issue_comment_modal.py is a near-perfect template"). It establishes:

- `@pytest.mark.unit` at the **class** level (test class scope).
- `@pytest.mark.django_db` at the **method** level (one-off opt-in for ORM access).
- Per-test fixtures via `@pytest.fixture` defined at module top.
- Direct `Model.objects.create(...)` instead of factory_boy.
- `create_user` from the global `tests/conftest.py:37-46` is the entry point of the fixture chain.
- Arrange / Act / Assert comments inside test bodies.

**Secondary analog (pure unit test without `@pytest.mark.django_db`):** `apps/api/plane/tests/unit/utils/test_uuid.py` lines 10–27 — used as the shape for the `test_no_drf_or_http_imports_in_module` lint-grep test (RESEARCH.md "Code Examples" lines 770–788), which scans the new module's source and asserts no forbidden imports appear:

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/tests/unit/utils/test_uuid.py:10-27
@pytest.mark.unit
class TestUUIDUtils:
    """Test the UUID utilities"""

    def test_is_valid_uuid_with_valid_uuid(self):
        """Test is_valid_uuid with a valid UUID"""
        # Generate a valid UUID
        valid_uuid = str(uuid.uuid4())
        assert is_valid_uuid(valid_uuid) is True
```

**Tertiary analog (label serializer test — alternative use of `db` + global `workspace` fixture from conftest):** `apps/api/plane/tests/unit/serializers/test_label.py` lines 10–30 — useful only if Phase 1 elects to use the global `workspace` fixture from `tests/conftest.py:126-140` instead of redefining it locally. RESEARCH.md primary recommendation is to redefine locally (consistent with `test_issue_comment_modal.py`).

**Decision (locked by D-10 / RESEARCH.md "Test stack" recommendation):** Do **NOT** add `IssueFactory` / `IssueRelationFactory` to `apps/api/plane/tests/factories.py` in Phase 1. Use the per-test `Model.objects.create(...)` pattern. The existing `factories.py` (full file content shown below for reference) stops at `ProjectMemberFactory`:

```python
# /Users/hosoi/github/karashizuke/plane/apps/api/plane/tests/factories.py:1-86 (entire file)
# Existing factories: UserFactory, WorkspaceFactory, WorkspaceMemberFactory,
# ProjectFactory, ProjectMemberFactory.
# NO IssueFactory, NO IssueRelationFactory.
# Phase 1 does NOT extend this file. Phase 2/3 may revisit if duplication appears.
```

**Test cases the planner must include** (RESEARCH.md §"Validation Architecture" rows 859–868):

| Test class                              | Method                                                         | Purpose                                                                                                    | Marker                                              |
| --------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `TestLoadPrecedenceGraphFilters`        | `test_relates_to_is_dropped`                                   | PROP-02: only `blocked_by` retained                                                                        | `@pytest.mark.unit` + `@pytest.mark.django_db`      |
| `TestLoadPrecedenceGraphFilters`        | `test_duplicate_is_dropped`                                    | PROP-02                                                                                                    | same                                                |
| `TestLoadPrecedenceGraphFilters`        | `test_blocking_via_get_actual_relation_normalizes_to_one_edge` | PROP-01 alias: `blocking` from API → one canonical `blocked_by` edge                                       | same                                                |
| `TestLoadPrecedenceGraphDirection`      | `test_predecessor_is_related_issue_successor_is_issue`         | D-04 directionality                                                                                        | same                                                |
| `TestLoadPrecedenceGraphCycle`          | `test_three_node_cycle_is_detected`                            | TEST-11 / PROP-15                                                                                          | same                                                |
| `TestLoadPrecedenceGraphCycle`          | `test_self_edge_is_one_node_cycle`                             | D-05 self-edge → 1-node cycle                                                                              | same                                                |
| `TestLoadPrecedenceGraphCrossProject`   | `test_cross_project_successor_marked`                          | PROP-16                                                                                                    | same                                                |
| `TestLoadPrecedenceGraphEmpty`          | `test_empty_input_yields_empty_adjacency_no_cycle`             | regression guard for default construction                                                                  | `@pytest.mark.unit` (no DB needed if input is `[]`) |
| `TestLoadPrecedenceGraphAdjacencyShape` | `test_chain_split_merge_adjacency_contents`                    | D-06 successors+predecessors symmetry                                                                      | `@pytest.mark.unit` + `@pytest.mark.django_db`      |
| `TestAdjacencyConvenienceMethods`       | `test_successors_of_unknown_id_returns_empty_frozenset`        | D-06 no-`KeyError` invariant                                                                               | `@pytest.mark.unit` (pure, no DB)                   |
| (module-level)                          | `test_no_drf_or_http_imports_in_module`                        | D-08 / PROP-18 — scan `apps/api/plane/app/services/timeline_propagation/*.py` for forbidden module strings | `@pytest.mark.unit` (pure file I/O, no DB)          |

The exact test bodies for cases (a) (filter), (d) (cycle), (e) (cross-project), and the lint-grep test are reproduced verbatim in RESEARCH.md §"Code Examples" lines 537–788 — the planner copies them with minimal edits.

---

## Shared Patterns

### License header (every Python file)

**Source:** Universal across `apps/api/plane/` — verified in every file read above.

**Apply to:** All 7 new files (4 lines + blank line before any other content).

```python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

```

### Section-divider comments (production modules)

**Source:** `apps/api/plane/utils/issue_search.py:5-12`, `apps/api/plane/db/models/issue.py:5-26` — three-section split is the codebase idiom.

**Apply to:** `graph.py` (`# Python imports` / `# Module imports`). For `types.py` it's optional since there are no Django imports; recommended to omit per the simpler `apps/api/plane/utils/exporters/schemas/base.py` style.

```python
# Python imports
import ...

# Django imports
from django.db.models import ...

# Module imports
from plane.db.models import ...
from .types import ...
```

### Defensive soft-delete filter

**Source:** `apps/api/plane/db/mixins.py:48-67` — `SoftDeletionManager` already filters `deleted_at__isnull=True` for `IssueRelation.objects`, but `IssueRelation.all_objects` returns the unfiltered manager.

**Apply to:** `graph.py` — defensively re-apply `if getattr(row, "deleted_at", None) is not None: continue` per CONTEXT.md D-05. Document the assumption in the function docstring.

### Reuse `IssueRelationChoices` constants instead of magic strings

**Source:** `apps/api/plane/db/models/issue.py:263-269` — exposes `IssueRelationChoices.BLOCKED_BY` etc. as `models.TextChoices`.

**Apply to:** `graph.py` filter uses `IssueRelationChoices.BLOCKED_BY` (or its `.value`, `"blocked_by"`) — referenced via `from plane.db.models import IssueRelationChoices`. Avoids "magic string" `"blocked_by"` drift.

### `ruff` line-length & quote style

**Source:** `apps/api/pyproject.toml:34-39`.

**Apply to:** All new files — line-length **120**, double quotes (`quote-style = "double"`). Verified by running `cd apps/api && ruff check plane/app/services/timeline_propagation` before commit (matches CI: `.github/workflows/pull-request-build-lint-api.yml`).

### Test marker discipline

**Source:** `apps/api/pytest.ini:7-11` declares `unit`, `contract`, `smoke`, `slow`. `--strict-markers` is set, so undeclared markers fail the run.

**Apply to:** `test_graph.py` — every test class has `@pytest.mark.unit`. Methods that hit the ORM additionally have `@pytest.mark.django_db`. Pure tests (`test_no_drf_or_http_imports_in_module`, `TestAdjacencyConvenienceMethods`, `TestLoadPrecedenceGraphEmpty` with `[]` input) skip the django_db marker for speed.

### `--reuse-db --nomigrations` test DB

**Source:** `apps/api/pytest.ini:13-17`. Test runs reuse a single DB across invocations; first run after model changes needs `--create-db`. Phase 1 introduces zero model changes, so this never matters in practice.

**Apply to:** Test execution command — `cd apps/api && DJANGO_SETTINGS_MODULE=plane.settings.test pytest plane/tests/unit/services/timeline_propagation/test_graph.py -x` (per RESEARCH.md §"Test Framework" line 850).

---

## No Analog Found

| Concern                                   | Reason                                                                                  | Where the planner gets the pattern instead                                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `@dataclass(frozen=True, slots=True)`     | RESEARCH.md A8: zero hits in `apps/api/plane/`. Phase 1 introduces the convention.      | RESEARCH.md "Pattern 1" lines 288–355 (full target code) + stdlib `dataclasses` docs.                                      |
| Iterative three-color DFS                 | RESEARCH.md: zero existing cycle-detection code in the backend.                         | RESEARCH.md "Pattern 3" lines 419–478 (full pseudocode).                                                                   |
| `Protocol` / structural-typed row input   | `grep "from typing import Protocol"` returns 0 hits in `apps/api/plane/`.               | RESEARCH.md "Pattern 2" lines 357–417 (full `RelationLike` Protocol skeleton).                                             |
| Cross-project edge classification         | First time `related_issue.project_id != project_id` is evaluated outside an ORM filter. | RESEARCH.md "Code Examples" lines 537–565 (`_make_edge` helper) + "Pitfall 2" lines 509–513 (do NOT use `row.project_id`). |
| Lint-grep test that asserts module purity | No existing "scan source for forbidden imports" pattern in the test suite.              | RESEARCH.md "Code Examples" lines 770–788 (`test_no_drf_or_http_imports_in_module` full body).                             |

For all five "no analog" patterns, the planner's job is to copy the verbatim skeleton from RESEARCH.md (cited line ranges above) and adapt it to the file paths in this PATTERNS.md.

---

## Metadata

**Analog search scope:**

- `apps/api/plane/app/` (sub-package layout idiom — empty per CONTEXT.md, will become first sub-package)
- `apps/api/plane/utils/` (closest "service utility" precedent — `issue_search.py`, `issue_relation_mapper.py`, `uuid.py`)
- `apps/api/plane/utils/exporters/` and `apps/api/plane/utils/exporters/schemas/base.py` (`@dataclass` + flat-re-export `__init__.py` precedents)
- `apps/api/plane/utils/filters/`, `apps/api/plane/utils/core/` (additional flat-re-export `__init__.py` precedents)
- `apps/api/plane/db/models/issue.py` (`IssueRelation`, `IssueRelationChoices`, `Issue` schema)
- `apps/api/plane/db/mixins.py` (`SoftDeletionManager`, `SoftDeleteModel`)
- `apps/api/plane/app/views/issue/relation.py` and `apps/api/plane/api/views/issue.py` (directionality verification)
- `apps/api/plane/tests/factories.py` (existing factory_boy registry — no extension needed)
- `apps/api/plane/tests/conftest.py` (global `create_user`, `workspace` fixtures)
- `apps/api/plane/tests/unit/{models,utils,serializers,bg_tasks}/` (test-pattern analogs)
- `apps/api/pytest.ini` and `apps/api/pyproject.toml` (test runner + lint config)

**Files scanned (for analog search):** ~25 (Read), plus 2 Glob and 2 Grep calls to confirm zero-hit invariants from RESEARCH.md (`@dataclass` count, `tests/unit/services/` absence).

**Pattern extraction date:** 2026-05-03

**Key invariants verified during this pass:**

- `apps/api/plane/app/services/` does NOT exist — confirmed by `ls apps/api/plane/app/` (only `__init__.py`, `apps.py`, `middleware`, `permissions`, `serializers`, `urls`, `views`).
- `apps/api/plane/tests/unit/services/` does NOT exist — confirmed by `ls apps/api/plane/tests/unit/` (only `bg_tasks`, `middleware`, `models`, `serializers`, `settings`, `utils`).
- `@dataclass` is used in exactly **one** file (`apps/api/plane/utils/exporters/schemas/base.py`) — confirmed by `Grep "@dataclass" apps/api/plane`.
- All existing `tests/unit/<subdir>/__init__.py` files are byte-identical 4-line license headers (verified by reading 3 of them).
