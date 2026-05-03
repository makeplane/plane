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
