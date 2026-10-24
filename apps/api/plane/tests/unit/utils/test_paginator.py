# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.test import RequestFactory
from rest_framework.exceptions import ParseError
from rest_framework.request import Request

from plane.db.models import Issue, Project, State
from plane.utils.paginator import (
    BasePaginator,
    Cursor,
    CursorResult,
    GroupedOffsetPaginator,
    SubGroupedOffsetPaginator,
)


class _StubGroupedPaginator:
    """Stand-in for GroupedOffsetPaginator/SubGroupedOffsetPaginator that
    records its constructor kwargs without touching the DB/ORM. The security
    property under test lives entirely in BasePaginator.paginate() — by the
    time a real paginator class would run a query, the field name has
    already been validated (or rejected)."""

    def __init__(self, **kwargs):
        self.kwargs = kwargs

    def get_result(self, limit, cursor):
        return CursorResult(
            results=[],
            next=Cursor(limit, 1, False, False),
            prev=Cursor(limit, -1, True, False),
            hits=0,
            max_hits=0,
        )

    def process_results(self, results):
        return results


def _make_request(**params):
    django_request = RequestFactory().get("/fake-url/", data=params)
    return Request(django_request)


@pytest.mark.unit
class TestPaginateGroupByValidation:
    """Regression tests for GHSA-wwgj-929g-42cm.

    BasePaginator.paginate() is the single chokepoint all group_by/sub_group_by
    call sites (public Spaces endpoint + 5 authenticated issue/cycle/module/
    workspace endpoints) funnel through. It must reject any field name outside
    ISSUE_GROUP_BY_ALLOWLIST with a 400 (ParseError), before the value ever
    reaches a real paginator's F()/.values()/.order_by()/Window partition_by.
    """

    def test_invalid_group_by_raises_parse_error(self):
        request = _make_request(group_by="created_by__password")
        with pytest.raises(ParseError):
            BasePaginator().paginate(
                request=request,
                queryset=None,
                paginator_cls=_StubGroupedPaginator,
                group_by_field_name="created_by__password",
                group_by_fields=[],
                count_filter=None,
            )

    def test_invalid_sub_group_by_raises_parse_error(self):
        # A valid group_by paired with an invalid sub_group_by must still be
        # rejected — the PoC in the advisory used exactly this combination
        # (group_by=state_id&sub_group_by=created_by__password).
        request = _make_request(group_by="priority", sub_group_by="workspace__secret_key")
        with pytest.raises(ParseError):
            BasePaginator().paginate(
                request=request,
                queryset=None,
                paginator_cls=_StubGroupedPaginator,
                group_by_field_name="priority",
                group_by_fields=[],
                sub_group_by_field_name="workspace__secret_key",
                sub_group_by_fields=[],
                count_filter=None,
            )

    def test_unrecognised_field_never_reaches_paginator_constructor(self):
        # Belt-and-braces: assert the stub paginator is never even
        # instantiated for a rejected field name.
        request = _make_request(group_by="not_a_field")

        class _ExplodingPaginator:
            def __init__(self, **kwargs):
                raise AssertionError("paginator_cls must not be constructed for an invalid group_by field")

        with pytest.raises(ParseError):
            BasePaginator().paginate(
                request=request,
                queryset=None,
                paginator_cls=_ExplodingPaginator,
                group_by_field_name="not_a_field",
                group_by_fields=[],
                count_filter=None,
            )

    def test_valid_group_by_and_sub_group_by_pass_through(self):
        request = _make_request(group_by="priority", sub_group_by="state_id")
        response = BasePaginator().paginate(
            request=request,
            queryset=None,
            paginator_cls=_StubGroupedPaginator,
            group_by_field_name="priority",
            group_by_fields=[],
            sub_group_by_field_name="state_id",
            sub_group_by_fields=[],
            count_filter=None,
        )
        assert response.data["grouped_by"] == "priority"
        assert response.data["sub_grouped_by"] == "state_id"

    def test_no_group_by_is_unaffected(self):
        # Plain (non-grouped) pagination must not be touched by this fix.
        request = _make_request()
        response = BasePaginator().paginate(
            request=request,
            queryset=None,
            paginator_cls=_StubGroupedPaginator,
        )
        assert response.data["grouped_by"] is None


class _ExplodingPaginator:
    """Fails if constructed: the cursor check runs before any paginator is built."""

    def __init__(self, **kwargs):
        raise AssertionError("paginator_cls must not be constructed for an invalid cursor")


@pytest.mark.unit
class TestCursorBounds:
    """paginate() accepts a cursor value in [0, max_per_page] and a non-negative offset."""

    @pytest.mark.parametrize("cursor", ["-1:0:0", "1001:0:0", "20:-1:0"])
    def test_out_of_bounds_cursor_rejected_before_paginator(self, cursor):
        request = _make_request(cursor=cursor)
        with pytest.raises(ParseError):
            BasePaginator().paginate(
                request=request,
                queryset=None,
                paginator_cls=_ExplodingPaginator,
                default_per_page=20,
                max_per_page=1000,
            )

    def test_valid_cursor_passes_the_guard(self):
        request = _make_request(cursor="20:0:0")
        response = BasePaginator().paginate(
            request=request,
            queryset=None,
            paginator_cls=_StubGroupedPaginator,
            default_per_page=20,
            max_per_page=1000,
        )
        assert response.data["results"] == []

    def test_cursor_value_at_max_is_allowed(self):
        request = _make_request(cursor="1000:0:0")
        response = BasePaginator().paginate(
            request=request,
            queryset=None,
            paginator_cls=_StubGroupedPaginator,
            default_per_page=20,
            max_per_page=1000,
        )
        assert response.data["results"] == []


@pytest.mark.unit
class TestGetPerPageNonPositiveRejected:
    """per_page must be a positive integer."""

    @pytest.mark.parametrize("per_page", [-1, -50, -1000, 0])
    def test_non_positive_per_page_rejected_by_get_per_page(self, per_page):
        request = _make_request(per_page=str(per_page))
        with pytest.raises(ParseError):
            BasePaginator().get_per_page(request, default_per_page=20, max_per_page=1000)

    @pytest.mark.parametrize("per_page", ["-1", "0"])
    def test_non_positive_per_page_rejected_before_paginator_runs(self, per_page):
        request = _make_request(per_page=per_page)
        with pytest.raises(ParseError):
            BasePaginator().paginate(
                request=request,
                queryset=None,
                paginator_cls=_ExplodingPaginator,
                default_per_page=20,
                max_per_page=1000,
            )


@pytest.mark.unit
@pytest.mark.django_db
class TestGroupedPageSize:
    """Grouped paginators size each group's page by per_page, whatever the cursor value."""

    @pytest.fixture
    def issues(self, workspace):
        project = Project.objects.create(name="Paginate", identifier="PAGE", workspace=workspace)
        state = State.objects.create(name="Todo", project=project, workspace=workspace)
        for i in range(3):
            for priority in ("high", "low"):
                Issue.objects.create(
                    name=f"{priority}-{i}", priority=priority, state=state, project=project, workspace=workspace
                )
        return Issue.issue_objects.filter(project=project)

    @pytest.mark.parametrize(
        "paginator_cls,extra",
        [
            (GroupedOffsetPaginator, {}),
            (SubGroupedOffsetPaginator, {"sub_group_by_field_name": "state_id", "sub_group_by_fields": []}),
        ],
    )
    def test_cursor_value_does_not_change_page_size(self, issues, paginator_cls, extra):
        paginator = paginator_cls(
            queryset=issues,
            order_by="-created_at",
            group_by_field_name="priority",
            group_by_fields=["high", "low"],
            count_filter=None,
            **extra,
        )
        seen = []
        for page in range(3):
            result = paginator.get_result(limit=1, cursor=Cursor(1000, page, False))
            rows = list(result.results.values("id", "priority"))
            assert sorted(r["priority"] for r in rows) == ["high", "low"]
            assert str(result.next) == f"1:{page + 1}:0"
            seen += [r["id"] for r in rows]
        assert len(set(seen)) == 6
        assert not result.next.has_results
