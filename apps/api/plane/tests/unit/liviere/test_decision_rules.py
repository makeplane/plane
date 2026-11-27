# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Pure rules of the decision register (plane/liviere/decisions/rules.py).

from datetime import date

import pytest

from plane.liviere.decisions.rules import (
    TRANSITIONS,
    DecisionError,
    check_transition,
    content_fields,
    find_cycle,
    parse_decision_ref,
    queues_of,
)

TODAY = date(2026, 11, 27)


@pytest.mark.unit
class TestDecisionRules:
    def test_decision_refs(self):
        assert [parse_decision_ref(v) for v in (12, "12", "D12", "d12", "DEMO-D12", " DEMO-d12 ")] == [12] * 6
        for bad in (0, -1, "DEMO-12", "D", True, None, "D0"):
            with pytest.raises(DecisionError):
                parse_decision_ref(bad)

    def test_transition_table(self):
        allowed = {
            operation: [s for s in ("proposed", "active", "deferred", "done", "superseded", "revoked") if s in states]
            for operation, states in TRANSITIONS.items()
        }
        assert allowed == {
            "accept": ["proposed"],
            "confirm": ["active", "deferred", "done"],
            "defer": ["active"],
            "resume": ["deferred"],
            "done": ["active", "deferred"],
            "revoke": ["proposed", "active", "deferred"],
            "supersede": ["active", "deferred", "done"],
            "review": ["active", "deferred"],
        }
        with pytest.raises(DecisionError) as raised:
            check_transition("defer", "superseded", "DEMO-D4")
        assert raised.value.code == "already_superseded"
        assert str(raised.value).startswith("Cannot defer DEMO-D4: it is superseded")
        with pytest.raises(DecisionError) as raised:
            check_transition("accept", "active", "DEMO-D4")
        assert raised.value.code == "invalid_transition"

    def test_queues(self):
        def queues(status="active", by="user", confirmed=True, review_on=None, rollout=False, needs_review=False):
            return queues_of(status, by, confirmed, review_on, rollout, needs_review, TODAY)

        assert queues() == []
        assert queues(by="agent", confirmed=False) == ["confirm"]
        assert queues(by="unknown", confirmed=False, needs_review=True) == ["confirm", "imported"]
        assert queues(status="deferred", by="agent", confirmed=False) == []
        assert queues(review_on=date(2026, 12, 11)) == ["review"]  # in 14 days
        assert queues(review_on=date(2026, 12, 12)) == []  # in 15 days
        assert queues(review_on=date(2026, 1, 1)) == ["review"]
        assert queues(status="done", review_on=TODAY) == []
        assert queues(rollout=True) == ["rollout"]
        assert queues(status="superseded", rollout=True) == []
        assert queues(status="proposed", by="agent", confirmed=False) == ["proposed"]

    def test_cycles(self):
        assert find_cycle({2: 1, 3: 2}) is None
        assert find_cycle({1: 2, 2: 1}) in (1, 2)
        assert find_cycle({4: 3, 3: 5, 5: 4, 6: 4}) in (3, 4, 5)
        assert find_cycle({}) is None

    def test_content_fields(self):
        fields = content_fields(
            {
                "title": "  Zwrot przyjmujemy do 30 dni  ",
                "area": "zamowienia",
                "kind": "product",
                "issues": ["demo-3", "DEMO-3"],
                "sources": ["a", "a", "b"],
                "related": [2, 2, 3],
            },
            partial=False,
        )
        assert fields["title"] == "Zwrot przyjmujemy do 30 dni"
        assert (fields["issues"], fields["sources"], fields["related"]) == (["DEMO-3"], ["a", "b"], [2, 3])
        for bad, field in (
            ({"area": "zamowienia", "kind": "product"}, "title"),
            ({"title": "x", "area": "Zamówienia", "kind": "product"}, "area"),
            ({"title": "x", "area": "a", "area2": "a", "kind": "product"}, "area2"),
            ({"title": "x", "area": "a", "kind": "product", "review_on": "jutro"}, "review_on"),
            ({"title": "x", "area": "a", "kind": "product", "issues": ["DEMO"]}, "issues"),
            ({"title": "x", "area": "a", "kind": "product", "related": [True]}, "related"),
        ):
            with pytest.raises(DecisionError) as raised:
                content_fields(bad, partial=False)
            assert raised.value.field == field
