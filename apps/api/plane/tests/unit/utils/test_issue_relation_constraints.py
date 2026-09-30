# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date

import pytest
from plane.utils.issue_relation_constraints import (
    RELATION_DATE_CONFLICT,
    date_violation_error,
    is_blocked_by_satisfied,
    is_finish_after_satisfied,
    is_finish_before_satisfied,
    is_start_after_satisfied,
    is_start_before_satisfied,
    is_status_transition_allowed,
    is_timeline_relation_satisfied,
)


@pytest.mark.unit
class TestIssueRelationConstraints:
    def test_starts_before_allows_equal_and_earlier(self):
        assert is_start_before_satisfied(date(2026, 1, 1), date(2026, 1, 1)) is True
        assert is_start_before_satisfied(date(2026, 1, 1), date(2026, 1, 2)) is True
        assert is_start_before_satisfied(date(2026, 1, 3), date(2026, 1, 2)) is False

    def test_starts_after_requires_related_to_have_begun(self):
        assert is_start_after_satisfied(date(2026, 1, 2), date(2026, 1, 1)) is True
        assert is_start_after_satisfied(date(2026, 1, 1), date(2026, 1, 1)) is True
        assert is_start_after_satisfied(date(2026, 1, 1), date(2026, 1, 2)) is False

    def test_finishes_before_allows_equal_and_earlier(self):
        assert is_finish_before_satisfied(date(2026, 2, 1), date(2026, 2, 1)) is True
        assert is_finish_before_satisfied(date(2026, 2, 1), date(2026, 2, 2)) is True
        assert is_finish_before_satisfied(date(2026, 2, 3), date(2026, 2, 2)) is False

    def test_finishes_after_requires_related_to_be_done(self):
        assert is_finish_after_satisfied(date(2026, 2, 2), date(2026, 2, 1)) is True
        assert is_finish_after_satisfied(date(2026, 2, 1), date(2026, 2, 1)) is True
        assert is_finish_after_satisfied(date(2026, 2, 1), date(2026, 2, 2)) is False

    def test_blocked_by_requires_a_gap_of_at_least_one_day(self):
        assert is_blocked_by_satisfied(date(2026, 1, 6), date(2026, 1, 5)) is True
        assert is_blocked_by_satisfied(date(2026, 1, 5), date(2026, 1, 5)) is False
        assert is_blocked_by_satisfied(date(2026, 1, 4), date(2026, 1, 5)) is False

    def test_missing_dates_are_unconstrained(self):
        assert is_start_before_satisfied(None, date(2026, 1, 1)) is True
        assert is_start_before_satisfied(date(2026, 1, 1), None) is True
        assert is_finish_after_satisfied(None, None) is True
        assert is_blocked_by_satisfied(None, date(2026, 1, 5)) is True
        assert is_blocked_by_satisfied(date(2026, 1, 5), None) is True

    def test_timeline_relation_dispatcher(self):
        issue = {"start_date": "2026-01-01", "target_date": "2026-01-10"}
        related = {"start_date": "2026-01-02", "target_date": "2026-01-12"}

        assert is_timeline_relation_satisfied("start_before", issue, related) is True
        assert is_timeline_relation_satisfied("start_after", issue, related) is False
        assert is_timeline_relation_satisfied("finish_before", issue, related) is True
        assert is_timeline_relation_satisfied("finish_after", issue, related) is False

    def test_timeline_relation_dispatcher_handles_blocking_pair(self):
        issue = {"start_date": "2026-01-06", "target_date": "2026-01-10"}
        related = {"start_date": "2026-01-01", "target_date": "2026-01-05"}

        assert is_timeline_relation_satisfied("blocked_by", issue, related) is True
        assert is_timeline_relation_satisfied("blocking", issue, related) is False
        assert is_timeline_relation_satisfied("blocked_by", related, issue) is False
        assert is_timeline_relation_satisfied("blocking", related, issue) is True

    def test_status_start_after_blocks_until_related_started(self):
        assert is_status_transition_allowed("start_after", "started", "unstarted") is False
        assert is_status_transition_allowed("start_after", "completed", "backlog") is False
        assert is_status_transition_allowed("start_after", "started", "started") is True
        assert is_status_transition_allowed("start_after", "unstarted", "backlog") is True

    def test_status_finish_after_blocks_completion(self):
        assert is_status_transition_allowed("finish_after", "completed", "started") is False
        assert is_status_transition_allowed("finish_after", "completed", "completed") is True
        assert is_status_transition_allowed("finish_after", "started", "unstarted") is True

    def test_cancelled_bypasses_status_rules(self):
        assert is_status_transition_allowed("start_after", "cancelled", "unstarted") is True
        assert is_status_transition_allowed("finish_after", "completed", "cancelled") is True

    def test_unsupported_relation_type_raises(self):
        with pytest.raises(ValueError):
            is_timeline_relation_satisfied("relates_to", {}, {})

    def test_date_violation_error_carries_a_message_and_its_parts(self):
        payload = date_violation_error("blocked_by", "PROJ-12", "PROJ-15")

        assert payload["error_code"] == RELATION_DATE_CONFLICT
        assert payload["relation_type"] == "blocked_by"
        assert payload["issue_ref"] == "PROJ-12"
        assert payload["related_ref"] == "PROJ-15"
        assert "PROJ-12" in payload["error"] and "PROJ-15" in payload["error"]
