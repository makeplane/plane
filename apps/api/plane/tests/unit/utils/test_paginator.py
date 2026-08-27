# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.test import RequestFactory
from rest_framework.exceptions import ParseError
from rest_framework.request import Request

from plane.utils.paginator import BasePaginator, Cursor, CursorResult


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
    """Fails if constructed — proves the cursor guard rejects BEFORE any paginator runs."""

    def __init__(self, **kwargs):
        raise AssertionError("paginator_cls must not be constructed for an invalid cursor")


@pytest.mark.unit
class TestCursorBounds:
    """paginate() must reject an out-of-bounds client cursor before it drives slicing.

    The grouped paginators use cursor.value as the per-group page size
    (stop = offset + (cursor.value or limit) + 1). A negative value slices the queryset
    with a negative stop -> ValueError('Negative indexing is not supported') -> HTTP 500;
    a huge value fetches far more than max_per_page rows per group (cap bypass / DoS).
    cursor.offset must be non-negative."""

    @pytest.mark.parametrize("cursor", ["-1:0:0", "1000000:0:0", "20:-1:0"])
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
class TestGetPerPageNegativeRejected:
    """A negative per_page must be rejected, not just a too-large one.

    OffsetPaginator.get_result() slices the queryset with
    queryset[offset : offset + limit]; get_per_page() previously only checked
    per_page against max_per_page (an upper bound), so a negative per_page sailed
    through untouched, reached the slice as a negative stop, and raised Django's
    unhandled "Negative indexing is not supported" -> HTTP 500. This is the same
    crash class TestCursorBounds closes for the cursor-driven grouped paginators,
    reachable here on every non-grouped paginated endpoint via a plain query
    param."""

    @pytest.mark.parametrize("per_page", [-1, -50, -1000])
    def test_negative_per_page_rejected_by_get_per_page(self, per_page):
        request = _make_request(per_page=str(per_page))
        with pytest.raises(ParseError):
            BasePaginator().get_per_page(request, default_per_page=20, max_per_page=1000)

    def test_negative_per_page_rejected_before_paginator_runs(self):
        request = _make_request(per_page="-1")
        with pytest.raises(ParseError):
            BasePaginator().paginate(
                request=request,
                queryset=None,
                paginator_cls=_ExplodingPaginator,
                default_per_page=20,
                max_per_page=1000,
            )

    def test_zero_per_page_is_still_allowed(self):
        # 0 is a valid (if degenerate) page size, not a negative one — must not
        # be rejected by this guard.
        request = _make_request(per_page="0")
        assert BasePaginator().get_per_page(request, default_per_page=20, max_per_page=1000) == 0
