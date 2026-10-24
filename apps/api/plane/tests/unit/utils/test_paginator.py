# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.test import RequestFactory
from rest_framework.exceptions import ParseError
from rest_framework.request import Request

from plane.utils.paginator import BasePaginator, Cursor, CursorResult, OffsetPaginator


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


class _FakeQuerySet:
    """Minimal queryset stand-in for OffsetPaginator.

    Tracks how many times count() is called and whether the paginator ever
    evaluated the result set, so both can be asserted without a database.
    """

    def __init__(self, rows, stats=None):
        self._rows = rows
        self.stats = stats if stats is not None else {"count_calls": 0, "evaluated": 0}

    def __getitem__(self, key):
        # Slicing stays lazy, mirroring QuerySet.__getitem__ on an unevaluated
        # queryset.
        return _FakeQuerySet(self._rows[key], self.stats)

    def count(self):
        self.stats["count_calls"] += 1
        return len(self._rows)

    def __iter__(self):
        self.stats["evaluated"] += 1
        return iter(self._rows)

    def __len__(self):
        self.stats["evaluated"] += 1
        return len(self._rows)


@pytest.mark.unit
class TestOffsetPaginatorNextPage:
    """The next-page flag is derived from total_count instead of a second
    COUNT over the page window. These pin the equivalence and the query count.
    """

    @pytest.mark.parametrize(
        ("total", "page", "expected"),
        [
            (25, 0, True),  # more rows follow
            (25, 1, True),
            (25, 2, False),  # final, partial page
            (0, 0, False),  # empty result set
            (10, 0, False),  # exactly one full page, nothing after it
            (11, 0, True),  # one row past the page boundary
            (20, 1, False),  # exact multiple: page 1 is the last
            (21, 1, True),
        ],
    )
    def test_next_page_flag_matches_row_count(self, total, page, expected):
        queryset = _FakeQuerySet(list(range(total)))
        result = OffsetPaginator(queryset).get_result(limit=10, cursor=Cursor(10, page, False))
        assert result.next.has_results is expected

    def test_page_costs_a_single_count_query(self):
        queryset = _FakeQuerySet(list(range(25)))
        OffsetPaginator(queryset).get_result(limit=10, cursor=Cursor(10, 0, False))
        assert queryset.stats["count_calls"] == 1

    def test_total_count_queryset_is_counted_instead_of_the_page_queryset(self):
        queryset = _FakeQuerySet(list(range(25)))
        total_count_queryset = _FakeQuerySet(list(range(25)))
        OffsetPaginator(queryset, total_count_queryset=total_count_queryset).get_result(
            limit=10, cursor=Cursor(10, 0, False)
        )
        assert total_count_queryset.stats["count_calls"] == 1
        assert queryset.stats["count_calls"] == 0

    def test_results_are_handed_back_unevaluated(self):
        # on_results callbacks call queryset methods on this — issue_on_results
        # does `issues.values(...)` (plane/utils/grouper.py). The paginator must
        # not collapse it into a list.
        queryset = _FakeQuerySet(list(range(25)))
        result = OffsetPaginator(queryset).get_result(limit=10, cursor=Cursor(10, 0, False))
        assert queryset.stats["evaluated"] == 0
        assert hasattr(result.results, "count")
