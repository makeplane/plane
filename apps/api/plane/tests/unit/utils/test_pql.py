# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""
Comprehensive tests for the PQL (Plane Query Language) parser and transformer.

Covers: grammar parsing, field aliases, operator mappings, logical combinators,
value types, function calls, predicate functions, comma-separated serialization,
PQLResult merging, single/double quoted strings, and error cases.
"""

from __future__ import annotations

from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from rest_framework.exceptions import ValidationError

from plane.utils.pql import pql_parse
from plane.utils.pql.transformer import PQLResult


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _ctx(user_id=None):
    """Build a minimal PQL context with a mocked request."""
    request = MagicMock()
    request.user.id = user_id or uuid4()
    return {"request": request, "workspace_slug": "test-workspace"}


def _parse(pql: str, ctx=None) -> PQLResult:
    """Shortcut: parse a PQL string and return the PQLResult."""
    return pql_parse(pql, ctx or _ctx())


def _rf(pql: str, ctx=None) -> dict | None:
    """Shortcut: parse and return the rich_filter dict."""
    return _parse(pql, ctx).rich_filter


# =========================================================================
# 1. PQLResult dataclass
# =========================================================================


@pytest.mark.unit
class TestPQLResult:
    """Tests for the PQLResult dataclass and its merge behaviour."""

    def test_empty_result(self):
        r = PQLResult()
        assert r.rich_filter is None

    def test_merge_both_present(self):
        left = PQLResult(rich_filter={"priority": "high"})
        right = PQLResult(rich_filter={"state_id": "abc"})
        merged = left.merge(right, "and")
        assert merged.rich_filter == {"and": [{"priority": "high"}, {"state_id": "abc"}]}

    def test_merge_or(self):
        left = PQLResult(rich_filter={"priority": "high"})
        right = PQLResult(rich_filter={"priority": "urgent"})
        merged = left.merge(right, "or")
        assert merged.rich_filter == {"or": [{"priority": "high"}, {"priority": "urgent"}]}

    def test_merge_left_none(self):
        left = PQLResult()
        right = PQLResult(rich_filter={"priority": "high"})
        merged = left.merge(right, "and")
        assert merged.rich_filter == {"priority": "high"}

    def test_merge_right_none(self):
        left = PQLResult(rich_filter={"priority": "high"})
        right = PQLResult()
        merged = left.merge(right, "and")
        assert merged.rich_filter == {"priority": "high"}

    def test_merge_both_none(self):
        merged = PQLResult().merge(PQLResult(), "and")
        assert merged.rich_filter is None


# =========================================================================
# 2. Parser — empty / whitespace / invalid input
# =========================================================================


@pytest.mark.unit
class TestParserEdgeCases:
    def test_empty_string_returns_empty_result(self):
        r = _parse("")
        assert r.rich_filter is None

    def test_whitespace_only_returns_empty_result(self):
        r = _parse("   ")
        assert r.rich_filter is None

    def test_invalid_syntax_raises_validation_error(self):
        with pytest.raises(ValidationError):
            _parse("??? broken")

    def test_unclosed_paren_raises(self):
        with pytest.raises(ValidationError):
            _parse('priority IN ("high", "urgent"')

    def test_missing_operator_raises(self):
        with pytest.raises(ValidationError):
            _parse('"high"')

    def test_unknown_function_as_value_raises(self):
        with pytest.raises(ValidationError):
            _parse("priority = unknownFunc()")

    def test_predicate_used_as_value_raises(self):
        with pytest.raises(ValidationError):
            _parse("priority = isOverdue()")


# =========================================================================
# 3. String values — double-quoted and single-quoted
# =========================================================================


@pytest.mark.unit
class TestStringQuoting:
    def test_double_quoted_string(self):
        rf = _rf('priority = "high"')
        assert rf == {"priority": "high"}

    def test_single_quoted_string(self):
        rf = _rf("priority = 'high'")
        assert rf == {"priority": "high"}

    def test_mixed_quotes_in_list(self):
        rf = _rf("""priority IN ("high", 'urgent')""")
        assert rf == {"priority__in": "high,urgent"}

    def test_all_single_quotes_in_list(self):
        rf = _rf("stateGroup IN ('backlog', 'started')")
        assert rf == {"state_group__in": "backlog,started"}

    def test_single_quoted_contains(self):
        rf = _rf("name ~ 'login'")
        assert rf == {"name__icontains": "login"}


# =========================================================================
# 4. Value types — numbers, booleans, null
# =========================================================================


@pytest.mark.unit
class TestValueTypes:
    def test_integer_value(self):
        rf = _rf("priority = 3")
        assert rf == {"priority": 3}

    def test_float_value(self):
        rf = _rf("priority = 3.5")
        assert rf == {"priority": 3.5}

    def test_negative_number(self):
        rf = _rf("priority = -1")
        assert rf == {"priority": -1}

    def test_true_value(self):
        rf = _rf("isDraft = true")
        assert rf == {"is_draft": True}

    def test_false_value(self):
        rf = _rf("isDraft = false")
        assert rf == {"is_draft": False}

    def test_null_value(self):
        rf = _rf("priority = null")
        assert rf == {"priority": None}

    def test_case_insensitive_true(self):
        rf = _rf("isDraft = TRUE")
        assert rf == {"is_draft": True}

    def test_case_insensitive_false(self):
        rf = _rf("isDraft = False")
        assert rf == {"is_draft": False}


# =========================================================================
# 5. Comparison operators
# =========================================================================


@pytest.mark.unit
class TestComparisonOperators:
    def test_eq(self):
        rf = _rf('priority = "high"')
        assert rf == {"priority": "high"}

    def test_neq(self):
        rf = _rf('priority != "high"')
        assert rf == {"not": {"priority": "high"}}

    def test_gt(self):
        rf = _rf('createdAt > "2025-01-01"')
        assert rf == {"created_at__gt": "2025-01-01"}

    def test_gte(self):
        rf = _rf('createdAt >= "2025-01-01"')
        assert rf == {"created_at__gte": "2025-01-01"}

    def test_lt(self):
        rf = _rf('targetDate < "2025-12-31"')
        assert rf == {"target_date__lt": "2025-12-31"}

    def test_lte(self):
        rf = _rf('targetDate <= "2025-12-31"')
        assert rf == {"target_date__lte": "2025-12-31"}

    def test_contains(self):
        rf = _rf('name ~ "login"')
        assert rf == {"name__icontains": "login"}


# =========================================================================
# 6. IN / NOT IN — comma-separated string serialization
# =========================================================================


@pytest.mark.unit
class TestInOperators:
    def test_in_two_values(self):
        rf = _rf('stateGroup IN ("started", "completed")')
        assert rf == {"state_group__in": "started,completed"}

    def test_in_three_values(self):
        rf = _rf('priority IN ("high", "urgent", "medium")')
        assert rf == {"priority__in": "high,urgent,medium"}

    def test_in_single_value(self):
        rf = _rf('priority IN ("high")')
        assert rf == {"priority__in": "high"}

    def test_not_in_two_values(self):
        rf = _rf('stateGroup NOT IN ("completed", "cancelled")')
        assert rf == {"not": {"state_group__in": "completed,cancelled"}}

    def test_not_in_three_values(self):
        rf = _rf('priority NOT IN ("none", "low", "medium")')
        assert rf == {"not": {"priority__in": "none,low,medium"}}

    def test_in_values_are_strings_not_lists(self):
        """The core bug fix: __in values must be comma-separated strings,
        not Python lists, so BaseCSVWidget can parse them correctly."""
        rf = _rf('stateGroup IN ("completed", "cancelled")')
        assert isinstance(rf["state_group__in"], str)
        assert rf["state_group__in"] == "completed,cancelled"

    def test_not_in_values_are_strings_not_lists(self):
        rf = _rf('stateGroup NOT IN ("completed", "cancelled")')
        inner = rf["not"]
        assert isinstance(inner["state_group__in"], str)

    def test_in_with_single_quotes(self):
        rf = _rf("stateGroup IN ('backlog', 'started')")
        assert rf == {"state_group__in": "backlog,started"}

    def test_not_in_with_single_quotes(self):
        rf = _rf("priority NOT IN ('none', 'low')")
        assert rf == {"not": {"priority__in": "none,low"}}

    def test_in_mixed_quotes(self):
        rf = _rf("""priority IN ("high", 'urgent')""")
        assert rf == {"priority__in": "high,urgent"}


# =========================================================================
# 7. IS NULL / IS NOT NULL / IS EMPTY / IS NOT EMPTY
# =========================================================================


@pytest.mark.unit
class TestNullEmptyOperators:
    def test_is_null(self):
        rf = _rf("startDate IS NULL")
        assert rf == {"start_date__isnull": True}

    def test_is_not_null(self):
        rf = _rf("targetDate IS NOT NULL")
        assert rf == {"target_date__isnull": False}

    def test_is_empty(self):
        rf = _rf("assignee IS EMPTY")
        assert rf == {"assignee_id__isnull": True}

    def test_is_not_empty(self):
        rf = _rf("label IS NOT EMPTY")
        assert rf == {"label_id__isnull": False}

    def test_case_insensitive_is_null(self):
        rf = _rf("startDate is null")
        assert rf == {"start_date__isnull": True}

    def test_case_insensitive_is_not_empty(self):
        rf = _rf("assignee is not empty")
        assert rf == {"assignee_id__isnull": False}


# =========================================================================
# 8. BETWEEN — comma-separated range serialization
# =========================================================================


@pytest.mark.unit
class TestBetweenOperator:
    def test_between_dates(self):
        rf = _rf('startDate BETWEEN "2025-01-01" AND "2025-12-31"')
        assert rf == {"start_date__range": "2025-01-01,2025-12-31"}

    def test_between_produces_string_not_list(self):
        """Range values must be comma-separated strings for BaseCSVWidget."""
        rf = _rf('createdAt BETWEEN "2025-06-01" AND "2025-06-30"')
        assert isinstance(rf["created_at__range"], str)
        assert rf["created_at__range"] == "2025-06-01,2025-06-30"

    def test_between_case_insensitive(self):
        rf = _rf('startDate between "2025-01-01" and "2025-12-31"')
        assert rf == {"start_date__range": "2025-01-01,2025-12-31"}

    def test_between_with_single_quotes(self):
        rf = _rf("targetDate BETWEEN '2025-03-01' AND '2025-03-31'")
        assert rf == {"target_date__range": "2025-03-01,2025-03-31"}

    def test_between_numbers(self):
        rf = _rf("priority BETWEEN 1 AND 4")
        assert rf == {"priority__range": "1,4"}


# =========================================================================
# 9. Field aliases
# =========================================================================


@pytest.mark.unit
class TestFieldAliases:
    def test_priority_no_alias(self):
        rf = _rf('priority = "high"')
        assert "priority" in rf

    def test_state_aliased_to_state_id(self):
        rf = _rf('state = "abc"')
        assert rf == {"state_id": "abc"}

    def test_assignee_aliased_to_assignee_id(self):
        rf = _rf('assignee = "abc"')
        assert rf == {"assignee_id": "abc"}

    def test_label_aliased_to_label_id(self):
        rf = _rf('label = "abc"')
        assert rf == {"label_id": "abc"}

    def test_cycle_aliased_to_cycle_id(self):
        rf = _rf('cycle = "abc"')
        assert rf == {"cycle_id": "abc"}

    def test_module_aliased_to_module_id(self):
        rf = _rf('module = "abc"')
        assert rf == {"module_id": "abc"}

    def test_subscriber_aliased_to_subscriber_id(self):
        rf = _rf('subscriber = "abc"')
        assert rf == {"subscriber_id": "abc"}

    def test_project_aliased_to_project_id(self):
        rf = _rf('project = "abc"')
        assert rf == {"project_id": "abc"}

    def test_createdBy_aliased_to_created_by_id(self):
        rf = _rf('createdBy = "abc"')
        assert rf == {"created_by_id": "abc"}

    def test_stateGroup_aliased_to_state_group(self):
        rf = _rf('stateGroup = "started"')
        assert rf == {"state_group": "started"}

    def test_startDate_aliased_to_start_date(self):
        rf = _rf('startDate = "2025-01-01"')
        assert rf == {"start_date": "2025-01-01"}

    def test_targetDate_aliased_to_target_date(self):
        rf = _rf('targetDate = "2025-01-01"')
        assert rf == {"target_date": "2025-01-01"}

    def test_createdAt_aliased_to_created_at(self):
        rf = _rf('createdAt = "2025-01-01"')
        assert rf == {"created_at": "2025-01-01"}

    def test_updatedAt_aliased_to_updated_at(self):
        rf = _rf('updatedAt = "2025-01-01"')
        assert rf == {"updated_at": "2025-01-01"}

    def test_isDraft_aliased_to_is_draft(self):
        rf = _rf("isDraft = true")
        assert rf == {"is_draft": True}

    def test_isArchived_aliased_to_is_archived(self):
        rf = _rf("isArchived = true")
        assert rf == {"is_archived": True}

    def test_type_aliased_to_type_id(self):
        rf = _rf('type = "abc"')
        assert rf == {"type_id": "abc"}

    def test_milestone_aliased_to_milestone_id(self):
        rf = _rf('milestone = "abc"')
        assert rf == {"milestone_id": "abc"}

    def test_mention_aliased_to_mention_id(self):
        rf = _rf('mention = "abc"')
        assert rf == {"mention_id": "abc"}

    def test_unknown_field_passes_through(self):
        """Fields not in FIELD_ALIASES pass through as-is."""
        rf = _rf('somefield = "val"')
        assert rf == {"somefield": "val"}


# =========================================================================
# 10. Logical operators — AND, OR, NOT
# =========================================================================


@pytest.mark.unit
class TestLogicalOperators:
    def test_and(self):
        rf = _rf('priority = "high" AND stateGroup = "started"')
        assert rf == {"and": [{"priority": "high"}, {"state_group": "started"}]}

    def test_or(self):
        rf = _rf('priority = "high" OR priority = "urgent"')
        assert rf == {"or": [{"priority": "high"}, {"priority": "urgent"}]}

    def test_not(self):
        rf = _rf('NOT priority = "low"')
        assert rf == {"not": {"priority": "low"}}

    def test_not_with_in(self):
        """NOT wrapping an IN expression."""
        rf = _rf('NOT stateGroup IN ("completed", "cancelled")')
        assert rf == {"not": {"state_group__in": "completed,cancelled"}}

    def test_not_in_operator(self):
        """The NOT IN shorthand operator (different from NOT wrapping IN)."""
        rf = _rf('stateGroup NOT IN ("completed", "cancelled")')
        assert rf == {"not": {"state_group__in": "completed,cancelled"}}

    def test_case_insensitive_and(self):
        rf = _rf('priority = "high" and stateGroup = "started"')
        assert rf == {"and": [{"priority": "high"}, {"state_group": "started"}]}

    def test_case_insensitive_or(self):
        rf = _rf('priority = "high" or priority = "urgent"')
        assert rf == {"or": [{"priority": "high"}, {"priority": "urgent"}]}

    def test_case_insensitive_not(self):
        rf = _rf('not priority = "low"')
        assert rf == {"not": {"priority": "low"}}

    def test_parenthesised_expression(self):
        rf = _rf('(priority = "high" OR priority = "urgent") AND stateGroup = "started"')
        assert rf == {
            "and": [
                {"or": [{"priority": "high"}, {"priority": "urgent"}]},
                {"state_group": "started"},
            ]
        }

    def test_nested_not(self):
        rf = _rf('NOT (priority = "low" OR priority = "none")')
        assert rf == {"not": {"or": [{"priority": "low"}, {"priority": "none"}]}}

    def test_chained_and(self):
        """AND is left-associative: A AND B AND C → and(and(A,B), C)."""
        rf = _rf('priority = "high" AND stateGroup = "started" AND isDraft = false')
        assert rf == {
            "and": [
                {"and": [{"priority": "high"}, {"state_group": "started"}]},
                {"is_draft": False},
            ]
        }

    def test_chained_or(self):
        rf = _rf('priority = "high" OR priority = "urgent" OR priority = "medium"')
        assert rf == {
            "or": [
                {"or": [{"priority": "high"}, {"priority": "urgent"}]},
                {"priority": "medium"},
            ]
        }

    def test_and_has_higher_precedence_than_or(self):
        """A OR B AND C  →  or(A, and(B, C))  because AND binds tighter."""
        rf = _rf('priority = "low" OR priority = "high" AND stateGroup = "started"')
        assert rf == {
            "or": [
                {"priority": "low"},
                {"and": [{"priority": "high"}, {"state_group": "started"}]},
            ]
        }


# =========================================================================
# 11. Text pseudo-field
# =========================================================================


@pytest.mark.unit
class TestTextPseudoField:
    def test_text_eq_generates_or(self):
        rf = _rf('text = "login"')
        assert rf == {
            "or": [
                {"name__icontains": "login"},
                {"description_stripped__icontains": "login"},
            ]
        }

    def test_text_contains_generates_or(self):
        rf = _rf('text ~ "search term"')
        assert rf == {
            "or": [
                {"name__icontains": "search term"},
                {"description_stripped__icontains": "search term"},
            ]
        }


# =========================================================================
# 12. Value functions (produce simple values)
# =========================================================================


@pytest.mark.unit
class TestValueFunctions:
    def test_currentUser(self):
        uid = uuid4()
        ctx = _ctx(user_id=uid)
        rf = _rf("assignee = currentUser()", ctx)
        assert rf == {"assignee_id": str(uid)}

    def test_openStates(self):
        rf = _rf("stateGroup IN openStates()")
        assert rf == {"state_group__in": "backlog,unstarted,started"}

    def test_closedStates(self):
        rf = _rf("stateGroup IN closedStates()")
        assert rf == {"state_group__in": "completed,cancelled"}

    def test_activeStates(self):
        rf = _rf("stateGroup IN activeStates()")
        assert rf == {"state_group__in": "unstarted,started"}

    def test_not_in_closedStates(self):
        rf = _rf("stateGroup NOT IN closedStates()")
        assert rf == {"not": {"state_group__in": "completed,cancelled"}}

    def test_today(self):
        from datetime import date

        rf = _rf("targetDate < today()")
        assert rf == {"target_date__lt": str(date.today())}

    def test_daysAgo(self):
        from datetime import date, timedelta

        rf = _rf("createdAt >= daysAgo(7)")
        expected = str(date.today() - timedelta(days=7))
        assert rf == {"created_at__gte": expected}

    def test_daysFromNow(self):
        from datetime import date, timedelta

        rf = _rf("targetDate <= daysFromNow(30)")
        expected = str(date.today() + timedelta(days=30))
        assert rf == {"target_date__lte": expected}

    def test_startOfWeek(self):
        from datetime import date, timedelta

        rf = _rf("startDate >= startOfWeek()")
        expected = str(date.today() - timedelta(days=date.today().weekday()))
        assert rf == {"start_date__gte": expected}

    def test_endOfWeek(self):
        from datetime import date, timedelta

        rf = _rf("startDate <= endOfWeek()")
        expected = str(date.today() - timedelta(days=date.today().weekday()) + timedelta(days=6))
        assert rf == {"start_date__lte": expected}

    def test_startOfMonth(self):
        from datetime import date

        rf = _rf("startDate >= startOfMonth()")
        expected = str(date.today().replace(day=1))
        assert rf == {"start_date__gte": expected}

    def test_endOfMonth(self):
        import calendar
        from datetime import date

        rf = _rf("startDate <= endOfMonth()")
        last_day = calendar.monthrange(date.today().year, date.today().month)[1]
        expected = str(date.today().replace(day=last_day))
        assert rf == {"start_date__lte": expected}

    def test_startOfYear(self):
        from datetime import date

        rf = _rf("startDate >= startOfYear()")
        expected = str(date.today().replace(month=1, day=1))
        assert rf == {"start_date__gte": expected}

    def test_endOfYear(self):
        from datetime import date

        rf = _rf("startDate <= endOfYear()")
        expected = str(date.today().replace(month=12, day=31))
        assert rf == {"start_date__lte": expected}

    def test_weeksAgo(self):
        from datetime import date, timedelta

        rf = _rf("createdAt >= weeksAgo(2)")
        expected = str(date.today() - timedelta(weeks=2))
        assert rf == {"created_at__gte": expected}

    def test_weeksFromNow(self):
        from datetime import date, timedelta

        rf = _rf("targetDate <= weeksFromNow(4)")
        expected = str(date.today() + timedelta(weeks=4))
        assert rf == {"target_date__lte": expected}

    def test_monthsAgo(self):
        from datetime import date, timedelta

        rf = _rf("updatedAt >= monthsAgo(3)")
        expected = str(date.today() - timedelta(days=3 * 30))
        assert rf == {"updated_at__gte": expected}

    def test_monthsFromNow(self):
        from datetime import date, timedelta

        rf = _rf("targetDate <= monthsFromNow(6)")
        expected = str(date.today() + timedelta(days=6 * 30))
        assert rf == {"target_date__lte": expected}

    def test_between_with_date_functions(self):
        from datetime import date

        rf = _rf("startDate BETWEEN startOfMonth() AND endOfMonth()")
        start = str(date.today().replace(day=1))
        assert rf["start_date__range"].startswith(start)


# =========================================================================
# 13. Predicate functions (standalone conditions → fn nodes)
# =========================================================================


@pytest.mark.unit
class TestPredicateFunctions:
    def test_isOverdue(self):
        rf = _rf("isOverdue()")
        assert rf == {"fn": {"is_overdue": True}}

    def test_isDraft(self):
        rf = _rf("isDraft()")
        assert rf == {"fn": {"is_draft": True}}

    def test_isArchived(self):
        rf = _rf("isArchived()")
        assert rf == {"fn": {"is_archived": True}}

    def test_isSubIssue(self):
        rf = _rf("isSubIssue()")
        assert rf == {"fn": {"is_sub_workitem": True}}

    def test_isTopLevel(self):
        rf = _rf("isTopLevel()")
        assert rf == {"fn": {"is_top_level": True}}

    def test_hasChildren(self):
        rf = _rf("hasChildren()")
        assert rf == {"fn": {"has_children": True}}

    def test_hasNoAssignee(self):
        rf = _rf("hasNoAssignee()")
        assert rf == {"fn": {"has_no_assignee": True}}

    def test_hasNoLabel(self):
        rf = _rf("hasNoLabel()")
        assert rf == {"fn": {"has_no_label": True}}

    def test_isEpic(self):
        rf = _rf("isEpic()")
        assert rf == {"fn": {"is_epic": True}}

    def test_isIntake(self):
        rf = _rf("isIntake()")
        assert rf == {"fn": {"is_intake": True}}

    def test_hasStartAndTarget(self):
        rf = _rf("hasStartAndTarget()")
        assert rf == {"fn": {"has_start_and_target": True}}

    def test_predicate_with_and(self):
        rf = _rf('isOverdue() AND priority = "high"')
        assert rf == {
            "and": [
                {"fn": {"is_overdue": True}},
                {"priority": "high"},
            ]
        }

    def test_not_predicate(self):
        rf = _rf("NOT isDraft()")
        assert rf == {"not": {"fn": {"is_draft": True}}}


# =========================================================================
# 14. Relation functions (fn nodes with arguments)
# =========================================================================


@pytest.mark.unit
class TestRelationFunctions:
    def test_linkedTo(self):
        uid = str(uuid4())
        rf = _rf(f'linkedTo("{uid}")')
        assert rf == {"fn": {"linked_to": uid}}

    def test_blockedBy(self):
        uid = str(uuid4())
        rf = _rf(f'blockedBy("{uid}")')
        assert rf == {"fn": {"blocked_by": uid}}

    def test_blocks(self):
        uid = str(uuid4())
        rf = _rf(f'blocks("{uid}")')
        assert rf == {"fn": {"blocks": uid}}

    def test_childOf(self):
        uid = str(uuid4())
        rf = _rf(f'childOf("{uid}")')
        assert rf == {"fn": {"child_of": uid}}

    def test_parentOf(self):
        uid = str(uuid4())
        rf = _rf(f'parentOf("{uid}")')
        assert rf == {"fn": {"parent_of": uid}}

    def test_duplicateOf(self):
        uid = str(uuid4())
        rf = _rf(f'duplicateOf("{uid}")')
        assert rf == {"fn": {"duplicate_of": uid}}


# =========================================================================
# 15. History functions (fn nodes)
# =========================================================================


@pytest.mark.unit
class TestHistoryFunctions:
    def test_wasEver(self):
        rf = _rf('wasEver("state", "done")')
        assert rf == {"fn": {"was_ever": ["state", "done"]}}

    def test_was(self):
        rf = _rf('was("priority", "high")')
        assert rf == {"fn": {"was": ["priority", "high"]}}

    def test_changedFrom(self):
        rf = _rf('changedFrom("state", "todo")')
        assert rf == {"fn": {"changed_from": ["state", "todo"]}}

    def test_changedTo(self):
        rf = _rf('changedTo("state", "done")')
        assert rf == {"fn": {"changed_to": ["state", "done"]}}

    def test_changed(self):
        rf = _rf('changed("state")')
        assert rf == {"fn": {"changed": "state"}}

    def test_updatedBy(self):
        uid = str(uuid4())
        rf = _rf(f'updatedBy("{uid}")')
        assert rf == {"fn": {"updated_by": uid}}

    def test_commentedBy(self):
        uid = str(uuid4())
        rf = _rf(f'commentedBy("{uid}")')
        assert rf == {"fn": {"commented_by": uid}}

    def test_fieldChangedBy(self):
        uid = str(uuid4())
        rf = _rf(f'fieldChangedBy("state", "{uid}")')
        assert rf == {"fn": {"field_changed_by": ["state", uid]}}

    def test_wasAssignedTo(self):
        uid = str(uuid4())
        rf = _rf(f'wasAssignedTo("{uid}")')
        assert rf == {"fn": {"was_assigned_to": uid}}

    def test_changedAfter(self):
        rf = _rf('changedAfter("2025-01-01")')
        assert rf == {"fn": {"changed_after": "2025-01-01"}}

    def test_changedBefore(self):
        rf = _rf('changedBefore("2025-12-31")')
        assert rf == {"fn": {"changed_before": "2025-12-31"}}

    def test_fieldChangedAfter(self):
        rf = _rf('fieldChangedAfter("state", "2025-01-01")')
        assert rf == {"fn": {"field_changed_after": ["state", "2025-01-01"]}}

    def test_fieldChangedBefore(self):
        rf = _rf('fieldChangedBefore("state", "2025-12-31")')
        assert rf == {"fn": {"field_changed_before": ["state", "2025-12-31"]}}

    def test_changedToAfter(self):
        rf = _rf('changedToAfter("state", "done", "2025-01-01")')
        assert rf == {"fn": {"changed_to_after": ["state", "done", "2025-01-01"]}}

    def test_changedToBefore(self):
        rf = _rf('changedToBefore("state", "done", "2025-12-31")')
        assert rf == {"fn": {"changed_to_before": ["state", "done", "2025-12-31"]}}

    def test_fieldChangedBetween(self):
        rf = _rf('fieldChangedBetween("state", "2025-01-01", "2025-12-31")')
        assert rf == {"fn": {"field_changed_between": ["state", "2025-01-01", "2025-12-31"]}}


# =========================================================================
# 16. Complex compound queries
# =========================================================================


@pytest.mark.unit
class TestComplexQueries:
    def test_overdue_and_high_priority(self):
        rf = _rf('isOverdue() AND priority IN ("high", "urgent")')
        assert rf == {
            "and": [
                {"fn": {"is_overdue": True}},
                {"priority__in": "high,urgent"},
            ]
        }

    def test_not_draft_and_not_closed(self):
        rf = _rf('NOT isDraft() AND stateGroup NOT IN ("completed", "cancelled")')
        assert rf == {
            "and": [
                {"not": {"fn": {"is_draft": True}}},
                {"not": {"state_group__in": "completed,cancelled"}},
            ]
        }

    def test_or_priority_and_active_states(self):
        rf = _rf('(priority = "urgent" OR isOverdue()) AND stateGroup IN activeStates()')
        assert rf == {
            "and": [
                {"or": [{"priority": "urgent"}, {"fn": {"is_overdue": True}}]},
                {"state_group__in": "unstarted,started"},
            ]
        }

    def test_multiple_conditions(self):
        rf = _rf('assignee IS EMPTY AND priority IN ("high", "urgent") AND stateGroup IN ("started", "unstarted")')
        assert rf == {
            "and": [
                {
                    "and": [
                        {"assignee_id__isnull": True},
                        {"priority__in": "high,urgent"},
                    ]
                },
                {"state_group__in": "started,unstarted"},
            ]
        }

    def test_date_range_with_functions(self):
        from datetime import date, timedelta

        rf = _rf("createdAt >= daysAgo(7) AND targetDate <= daysFromNow(30)")
        expected_start = str(date.today() - timedelta(days=7))
        expected_end = str(date.today() + timedelta(days=30))
        assert rf == {
            "and": [
                {"created_at__gte": expected_start},
                {"target_date__lte": expected_end},
            ]
        }

    def test_deeply_nested_parens(self):
        rf = _rf('((priority = "high"))')
        assert rf == {"priority": "high"}

    def test_not_or_group(self):
        rf = _rf('NOT (stateGroup = "completed" OR stateGroup = "cancelled")')
        assert rf == {
            "not": {
                "or": [
                    {"state_group": "completed"},
                    {"state_group": "cancelled"},
                ]
            }
        }

    def test_mixed_not_in_and_in(self):
        rf = _rf('stateGroup NOT IN ("completed", "cancelled") AND priority IN ("high", "urgent")')
        assert rf == {
            "and": [
                {"not": {"state_group__in": "completed,cancelled"}},
                {"priority__in": "high,urgent"},
            ]
        }

    def test_predicate_or_with_field_condition(self):
        rf = _rf("hasNoAssignee() OR assignee = currentUser()")
        ctx = _ctx()
        uid = str(ctx["request"].user.id)
        rf = _rf("hasNoAssignee() OR assignee = currentUser()", ctx)
        assert rf == {
            "or": [
                {"fn": {"has_no_assignee": True}},
                {"assignee_id": uid},
            ]
        }

    def test_between_and_in_combined(self):
        rf = _rf('startDate BETWEEN "2025-01-01" AND "2025-06-30" AND priority IN ("high", "urgent")')
        assert rf == {
            "and": [
                {"start_date__range": "2025-01-01,2025-06-30"},
                {"priority__in": "high,urgent"},
            ]
        }


# =========================================================================
# 17. IN with function calls returning lists
# =========================================================================


@pytest.mark.unit
class TestInWithFunctionValues:
    def test_in_openStates(self):
        rf = _rf("stateGroup IN openStates()")
        assert rf == {"state_group__in": "backlog,unstarted,started"}

    def test_in_closedStates(self):
        rf = _rf("stateGroup IN closedStates()")
        assert rf == {"state_group__in": "completed,cancelled"}

    def test_in_activeStates(self):
        rf = _rf("stateGroup IN activeStates()")
        assert rf == {"state_group__in": "unstarted,started"}

    def test_not_in_openStates(self):
        rf = _rf("stateGroup NOT IN openStates()")
        assert rf == {"not": {"state_group__in": "backlog,unstarted,started"}}

    def test_not_in_activeStates(self):
        rf = _rf("stateGroup NOT IN activeStates()")
        assert rf == {"not": {"state_group__in": "unstarted,started"}}


# =========================================================================
# 18. Custom property fields — cf["<uuid>"]
# =========================================================================

# Reusable test UUIDs
_CF_UUID1 = "550e8400-e29b-41d4-a716-446655440000"
_CF_UUID2 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"


@pytest.mark.unit
class TestCustomPropertyPQL:
    """Tests for custom property field syntax: cf["<uuid>"]."""

    # -- Comparison operators --

    def test_eq(self):
        rf = _rf(f'cf["{_CF_UUID1}"] = "red"')
        assert rf == {f"customproperty_{_CF_UUID1}__exact": "red"}

    def test_neq(self):
        rf = _rf(f'cf["{_CF_UUID1}"] != "red"')
        assert rf == {"not": {f"customproperty_{_CF_UUID1}__exact": "red"}}

    def test_gt(self):
        rf = _rf(f'cf["{_CF_UUID1}"] > 100')
        assert rf == {f"customproperty_{_CF_UUID1}__gt": 100}

    def test_gte(self):
        rf = _rf(f'cf["{_CF_UUID1}"] >= 100')
        assert rf == {f"customproperty_{_CF_UUID1}__gte": 100}

    def test_lt(self):
        rf = _rf(f'cf["{_CF_UUID1}"] < 100')
        assert rf == {f"customproperty_{_CF_UUID1}__lt": 100}

    def test_lte(self):
        rf = _rf(f'cf["{_CF_UUID1}"] <= 100')
        assert rf == {f"customproperty_{_CF_UUID1}__lte": 100}

    def test_contains(self):
        rf = _rf(f'cf["{_CF_UUID1}"] ~ "search term"')
        assert rf == {f"customproperty_{_CF_UUID1}__icontains": "search term"}

    # -- IN / NOT IN --

    def test_in(self):
        rf = _rf(f'cf["{_CF_UUID1}"] IN ("opt1", "opt2")')
        assert rf == {f"customproperty_{_CF_UUID1}__in": "opt1,opt2"}

    def test_not_in(self):
        rf = _rf(f'cf["{_CF_UUID1}"] NOT IN ("opt1", "opt2")')
        assert rf == {"not": {f"customproperty_{_CF_UUID1}__in": "opt1,opt2"}}

    # -- IS NULL / IS NOT NULL / IS EMPTY / IS NOT EMPTY --

    def test_is_null(self):
        rf = _rf(f'cf["{_CF_UUID1}"] IS NULL')
        assert rf == {f"customproperty_{_CF_UUID1}__isnull": True}

    def test_is_not_null(self):
        rf = _rf(f'cf["{_CF_UUID1}"] IS NOT NULL')
        assert rf == {f"customproperty_{_CF_UUID1}__isnull": False}

    def test_is_empty(self):
        rf = _rf(f'cf["{_CF_UUID1}"] IS EMPTY')
        assert rf == {f"customproperty_{_CF_UUID1}__isnull": True}

    def test_is_not_empty(self):
        rf = _rf(f'cf["{_CF_UUID1}"] IS NOT EMPTY')
        assert rf == {f"customproperty_{_CF_UUID1}__isnull": False}

    # -- BETWEEN --

    def test_between(self):
        rf = _rf(f'cf["{_CF_UUID1}"] BETWEEN "2024-01-01" AND "2024-12-31"')
        assert rf == {f"customproperty_{_CF_UUID1}__range": "2024-01-01,2024-12-31"}

    def test_between_numbers(self):
        rf = _rf(f'cf["{_CF_UUID1}"] BETWEEN 1 AND 100')
        assert rf == {f"customproperty_{_CF_UUID1}__range": "1,100"}

    # -- Logical operators --

    def test_cf_and_regular_field(self):
        rf = _rf(f'priority = "high" AND cf["{_CF_UUID1}"] = "red"')
        assert rf == {
            "and": [
                {"priority": "high"},
                {f"customproperty_{_CF_UUID1}__exact": "red"},
            ]
        }

    def test_cf_or_cf(self):
        rf = _rf(f'cf["{_CF_UUID1}"] = "a" OR cf["{_CF_UUID2}"] = "b"')
        assert rf == {
            "or": [
                {f"customproperty_{_CF_UUID1}__exact": "a"},
                {f"customproperty_{_CF_UUID2}__exact": "b"},
            ]
        }

    def test_not_cf(self):
        rf = _rf(f'NOT cf["{_CF_UUID1}"] = "red"')
        assert rf == {"not": {f"customproperty_{_CF_UUID1}__exact": "red"}}

    def test_parenthesised_cf(self):
        rf = _rf(f'(cf["{_CF_UUID1}"] = "a" OR cf["{_CF_UUID2}"] = "b") AND priority = "high"')
        assert rf == {
            "and": [
                {
                    "or": [
                        {f"customproperty_{_CF_UUID1}__exact": "a"},
                        {f"customproperty_{_CF_UUID2}__exact": "b"},
                    ]
                },
                {"priority": "high"},
            ]
        }

    # -- Case insensitivity --

    def test_cf_case_insensitive(self):
        rf = _rf(f'CF["{_CF_UUID1}"] = "red"')
        assert rf == {f"customproperty_{_CF_UUID1}__exact": "red"}

    def test_cf_mixed_case(self):
        rf = _rf(f'Cf["{_CF_UUID1}"] = "red"')
        assert rf == {f"customproperty_{_CF_UUID1}__exact": "red"}

    # -- Value types --

    def test_number_value(self):
        rf = _rf(f'cf["{_CF_UUID1}"] = 42')
        assert rf == {f"customproperty_{_CF_UUID1}__exact": 42}

    def test_boolean_value(self):
        rf = _rf(f'cf["{_CF_UUID1}"] = true')
        assert rf == {f"customproperty_{_CF_UUID1}__exact": True}

    # -- Error cases --

    def test_invalid_uuid_raises(self):
        with pytest.raises(ValidationError):
            _rf('cf["not-a-valid-uuid"] = "value"')

    def test_invalid_uuid_too_short_raises(self):
        with pytest.raises(ValidationError):
            _rf('cf["12345"] = "value"')


# =========================================================================
# 19. Custom property history functions — cf["uuid"] in function args
# =========================================================================


@pytest.mark.unit
class TestCustomPropertyHistoryPQL:
    """Tests for using cf["<uuid>"] as a field argument in history functions.

    These verify that the PQL transformer serializes cf field refs as
    "cf:<uuid>" marker strings in fn args, preserving the same function
    names used for regular fields.
    """

    # -- History (5) --

    def test_wasEver_cf(self):
        rf = _rf(f'wasEver(cf["{_CF_UUID1}"], "done")')
        assert rf == {"fn": {"was_ever": [f"cf:{_CF_UUID1}", "done"]}}

    def test_was_cf(self):
        rf = _rf(f'was(cf["{_CF_UUID1}"], "open")')
        assert rf == {"fn": {"was": [f"cf:{_CF_UUID1}", "open"]}}

    def test_changedFrom_cf(self):
        rf = _rf(f'changedFrom(cf["{_CF_UUID1}"], "old")')
        assert rf == {"fn": {"changed_from": [f"cf:{_CF_UUID1}", "old"]}}

    def test_changedTo_cf(self):
        rf = _rf(f'changedTo(cf["{_CF_UUID1}"], "new")')
        assert rf == {"fn": {"changed_to": [f"cf:{_CF_UUID1}", "new"]}}

    def test_changed_cf(self):
        rf = _rf(f'changed(cf["{_CF_UUID1}"])')
        assert rf == {"fn": {"changed": f"cf:{_CF_UUID1}"}}

    # -- History actor (1 field-accepting) --

    def test_fieldChangedBy_cf(self):
        uid = str(uuid4())
        rf = _rf(f'fieldChangedBy(cf["{_CF_UUID1}"], "{uid}")')
        assert rf == {"fn": {"field_changed_by": [f"cf:{_CF_UUID1}", uid]}}

    # -- History time (5 field-accepting) --

    def test_fieldChangedAfter_cf(self):
        rf = _rf(f'fieldChangedAfter(cf["{_CF_UUID1}"], "2025-01-01")')
        assert rf == {"fn": {"field_changed_after": [f"cf:{_CF_UUID1}", "2025-01-01"]}}

    def test_fieldChangedBefore_cf(self):
        rf = _rf(f'fieldChangedBefore(cf["{_CF_UUID1}"], "2025-12-31")')
        assert rf == {"fn": {"field_changed_before": [f"cf:{_CF_UUID1}", "2025-12-31"]}}

    def test_changedToAfter_cf(self):
        rf = _rf(f'changedToAfter(cf["{_CF_UUID1}"], "done", "2025-01-01")')
        assert rf == {"fn": {"changed_to_after": [f"cf:{_CF_UUID1}", "done", "2025-01-01"]}}

    def test_changedToBefore_cf(self):
        rf = _rf(f'changedToBefore(cf["{_CF_UUID1}"], "done", "2025-12-31")')
        assert rf == {"fn": {"changed_to_before": [f"cf:{_CF_UUID1}", "done", "2025-12-31"]}}

    def test_fieldChangedBetween_cf(self):
        rf = _rf(f'fieldChangedBetween(cf["{_CF_UUID1}"], "2025-01-01", "2025-12-31")')
        assert rf == {"fn": {"field_changed_between": [f"cf:{_CF_UUID1}", "2025-01-01", "2025-12-31"]}}

    # -- Combined with regular fields and conditions --

    def test_cf_history_and_regular_history(self):
        rf = _rf(f'wasEver("state", "done") AND wasEver(cf["{_CF_UUID1}"], "val")')
        assert rf == {
            "and": [
                {"fn": {"was_ever": ["state", "done"]}},
                {"fn": {"was_ever": [f"cf:{_CF_UUID1}", "val"]}},
            ]
        }

    def test_cf_condition_and_cf_history(self):
        rf = _rf(f'cf["{_CF_UUID1}"] = "red" AND changed(cf["{_CF_UUID1}"])')
        assert rf == {
            "and": [
                {f"customproperty_{_CF_UUID1}__exact": "red"},
                {"fn": {"changed": f"cf:{_CF_UUID1}"}},
            ]
        }

    def test_not_cf_history(self):
        rf = _rf(f'NOT changed(cf["{_CF_UUID1}"])')
        assert rf == {"not": {"fn": {"changed": f"cf:{_CF_UUID1}"}}}


# =========================================================================
# 20. Work item identifier pseudo-field
# =========================================================================


@pytest.mark.unit
class TestWorkItemIdentifier:
    """Tests for id pseudo-field: WEB-11, APP-5, etc."""

    def test_single_eq(self):
        rf = _rf('id = "WEB-11"')
        assert rf == {"fn": {"work_item_identifier": ["eq", "WEB-11"]}}

    def test_single_neq(self):
        rf = _rf('id != "WEB-11"')
        assert rf == {"not": {"fn": {"work_item_identifier": ["neq", "WEB-11"]}}}

    def test_in_multiple(self):
        rf = _rf('id IN ("WEB-11", "WEB-12", "APP-5")')
        assert rf == {"fn": {"work_item_identifier": ["in_op", ["WEB-11", "WEB-12", "APP-5"]]}}

    def test_not_in_multiple(self):
        rf = _rf('id NOT IN ("WEB-11", "WEB-12")')
        assert rf == {"not": {"fn": {"work_item_identifier": ["not_in", ["WEB-11", "WEB-12"]]}}}

    def test_contains(self):
        rf = _rf('id ~ "WEB-1"')
        assert rf == {"fn": {"work_item_identifier": ["contains", "WEB-1"]}}

    def test_combined_with_other_conditions(self):
        rf = _rf('id = "WEB-11" AND priority = "high"')
        assert rf == {
            "and": [
                {"fn": {"work_item_identifier": ["eq", "WEB-11"]}},
                {"priority": "high"},
            ]
        }


# =========================================================================
# ORDER BY and LIMIT
# =========================================================================


@pytest.mark.unit
class TestOrderBy:
    """Tests for the ORDER BY clause."""

    def test_order_by_single_field_desc(self):
        r = _parse('ORDER BY createdAt DESC')
        assert r.rich_filter is None
        assert r.order_by == [("created_at", "DESC")]
        assert r.limit is None

    def test_order_by_single_field_asc(self):
        r = _parse('ORDER BY createdAt ASC')
        assert r.order_by == [("created_at", "ASC")]

    def test_order_by_default_asc(self):
        r = _parse('ORDER BY createdAt')
        assert r.order_by == [("created_at", "ASC")]

    def test_order_by_multiple_fields(self):
        r = _parse('ORDER BY dueDate DESC, priority ASC')
        assert r.order_by == [("target_date", "DESC"), ("priority", "ASC")]

    def test_order_by_case_insensitive(self):
        r = _parse('order by createdAt desc')
        assert r.order_by == [("created_at", "DESC")]

    def test_order_by_with_filter(self):
        r = _parse('priority = "high" ORDER BY createdAt DESC')
        assert r.rich_filter == {"priority": "high"}
        assert r.order_by == [("created_at", "DESC")]

    def test_order_by_field_aliases(self):
        """ORDER BY aliases map to the correct Django ORM fields."""
        cases = {
            "priority": "priority",
            "state": "state__group",
            "stateGroup": "state__group",
            "dueDate": "target_date",
            "startDate": "start_date",
            "title": "name",
            "assignee": "assignees__first_name",
            "label": "labels__name",
            "module": "issue_module__module__name",
            "createdBy": "created_by__first_name",
            "sequenceId": "sequence_id",
            "sortOrder": "sort_order",
            "type": "type__name",
        }
        for pql_field, django_field in cases.items():
            r = _parse(f"ORDER BY {pql_field}")
            assert r.order_by == [(django_field, "ASC")], f"Failed for field: {pql_field}"

    def test_order_by_unknown_field_raises(self):
        with pytest.raises(ValidationError):
            _parse('ORDER BY unknownField')

    def test_order_by_cf_field_raises(self):
        uid = str(uuid4())
        with pytest.raises(ValidationError):
            _parse(f'ORDER BY cf["{uid}"]')


@pytest.mark.unit
class TestLimit:
    """Tests for the LIMIT clause."""

    def test_limit_only(self):
        r = _parse('LIMIT 50')
        assert r.rich_filter is None
        assert r.order_by is None
        assert r.limit == 50

    def test_limit_with_filter(self):
        r = _parse('priority = "high" LIMIT 10')
        assert r.rich_filter == {"priority": "high"}
        assert r.limit == 10

    def test_limit_case_insensitive(self):
        r = _parse('limit 25')
        assert r.limit == 25

    def test_limit_exceeds_max_raises(self):
        with pytest.raises(ValidationError):
            _parse('LIMIT 5000')

    def test_limit_zero_raises(self):
        """LIMIT 0 is rejected by the POSITIVE_INT grammar rule."""
        with pytest.raises(ValidationError):
            _parse('LIMIT 0')

    def test_limit_negative_raises(self):
        with pytest.raises(ValidationError):
            _parse('LIMIT -5')


@pytest.mark.unit
class TestOrderByAndLimit:
    """Tests for ORDER BY and LIMIT used together."""

    def test_filter_order_limit(self):
        r = _parse('priority = "high" ORDER BY createdAt DESC LIMIT 10')
        assert r.rich_filter == {"priority": "high"}
        assert r.order_by == [("created_at", "DESC")]
        assert r.limit == 10

    def test_order_and_limit_no_filter(self):
        r = _parse('ORDER BY dueDate ASC LIMIT 25')
        assert r.rich_filter is None
        assert r.order_by == [("target_date", "ASC")]
        assert r.limit == 25

    def test_limit_before_order_by(self):
        """LIMIT can come before ORDER BY."""
        r = _parse('LIMIT 10 ORDER BY createdAt')
        assert r.limit == 10
        assert r.order_by == [("created_at", "ASC")]

    def test_existing_filters_still_work(self):
        """Existing filter-only queries still parse correctly."""
        r = _parse('priority = "high" AND state IN openStates()')
        assert r.rich_filter is not None
        assert r.order_by is None
        assert r.limit is None

    def test_merge_does_not_propagate_order_limit(self):
        """merge() only combines rich_filter, not order_by/limit."""
        left = PQLResult(rich_filter={"priority": "high"}, order_by=[("created_at", "DESC")], limit=10)
        right = PQLResult(rich_filter={"state_id": "abc"}, order_by=[("name", "ASC")], limit=5)
        merged = left.merge(right, "and")
        assert merged.rich_filter == {"and": [{"priority": "high"}, {"state_id": "abc"}]}
        assert merged.order_by is None
        assert merged.limit is None
