# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from plane.utils.issue_relation_mapper import get_actual_relation, get_inverse_relation


@pytest.mark.unit
class TestIssueRelationMapper:
    def test_inverse_timeline_relations(self):
        assert get_inverse_relation("start_before") == "start_after"
        assert get_inverse_relation("start_after") == "start_before"
        assert get_inverse_relation("finish_before") == "finish_after"
        assert get_inverse_relation("finish_after") == "finish_before"

    def test_inverse_blocking_relations(self):
        assert get_inverse_relation("blocked_by") == "blocking"
        assert get_inverse_relation("blocking") == "blocked_by"

    def test_inverse_symmetric_relations(self):
        assert get_inverse_relation("relates_to") == "relates_to"
        assert get_inverse_relation("duplicate") == "duplicate"

    def test_actual_relation_stores_canonical_forward(self):
        assert get_actual_relation("start_before") == "start_before"
        assert get_actual_relation("start_after") == "start_before"
        assert get_actual_relation("finish_before") == "finish_before"
        assert get_actual_relation("finish_after") == "finish_before"
        assert get_actual_relation("blocking") == "blocked_by"
        assert get_actual_relation("blocked_by") == "blocked_by"

    def test_unknown_relation_passthrough(self):
        assert get_inverse_relation("unknown") == "unknown"
        assert get_actual_relation("unknown") == "unknown"
