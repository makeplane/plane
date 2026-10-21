# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework.exceptions import ValidationError

from plane.db.models import Issue, StateGroup
from plane.utils.filters.filterset import IssueFilterSet
from plane.utils.issue_filters import issue_filters


@pytest.mark.unit
@pytest.mark.parametrize("group", StateGroup.values)
@pytest.mark.parametrize("method", ["GET", "POST"])
def test_valid_state_groups(group, method):
    value = group if method == "GET" else [group]

    assert issue_filters({"state_group": value}, method) == {
        "state__group__in": [group],
    }


@pytest.mark.unit
@pytest.mark.parametrize(
    "method,value",
    [
        ("GET", "hello"),
        ("GET", "started,hello"),
        ("GET", "started,"),
        ("POST", ["hello"]),
        ("POST", ["started", "hello"]),
        ("POST", "started"),
    ],
)
def test_invalid_state_groups(method, value):
    with pytest.raises(ValidationError) as exc:
        issue_filters({"state_group": value}, method)

    assert exc.value.status_code == 400
    assert "state_group" in exc.value.detail


@pytest.mark.unit
@pytest.mark.parametrize(
    "method,value",
    [
        ("GET", ""),
        ("GET", "null"),
        ("POST", []),
        ("POST", None),
        ("POST", "null"),
    ],
)
def test_empty_state_groups(method, value):
    assert issue_filters({"state_group": value}, method) == {}


@pytest.mark.unit
def test_null_sentinel_preserves_valid_groups():
    assert issue_filters(
        {"state_group": "started,null,completed"},
        "GET",
    ) == {
        "state__group__in": ["started", "completed"],
    }


@pytest.mark.unit
@pytest.mark.parametrize(
    "field",
    ["state_group", "state_group__exact", "state_group__in"],
)
def test_rich_filters_reject_invalid_groups(field):
    filters = IssueFilterSet(
        data={field: "hello"},
        queryset=Issue.objects.none(),
    )

    assert not filters.is_valid()
    assert field in filters.errors


@pytest.mark.unit
def test_rich_filter_accepts_multiple_valid_groups():
    filters = IssueFilterSet(
        data={"state_group__in": "started,completed"},
        queryset=Issue.objects.none(),
    )

    assert filters.is_valid(), filters.errors
    assert filters.build_combined_q().children == [
        ("state__group__in", ["started", "completed"])
    ]


@pytest.mark.unit
def test_rich_filter_rejects_mixed_groups():
    filters = IssueFilterSet(
        data={"state_group__in": "started,hello"},
        queryset=Issue.objects.none(),
    )

    assert not filters.is_valid()
    assert "state_group__in" in filters.errors