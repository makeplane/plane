# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Count-only pagination must not require model iteration.

These tests cover the orchestration contract. The companion contract suite
executes actual Django querysets and checks SQL and model construction.
"""

from types import SimpleNamespace
from unittest import mock

import pytest
from django.db.models import QuerySet

from plane.utils.paginator import (
    BadPaginationError,
    BasePaginator,
    Cursor,
    CursorResult,
    OffsetPaginator,
)

pytestmark = pytest.mark.unit


class _CountSource:
    """A supplied count source must never be tested for truthiness."""

    def __init__(self, total):
        self.count = mock.Mock(return_value=total)

    def __bool__(self):
        raise AssertionError("Testing a count queryset for truthiness loads its rows")


class _PageQuery:
    """Lazy slicing/count protocol; deliberately not a Django ORM emulator."""

    def __init__(self, rows):
        self.rows = rows
        self.count = mock.Mock(return_value=len(rows))

    def __getitem__(self, key):
        return type(self)(self.rows[key])

    def values(self, *fields):
        return type(self)(self.rows)

    def __len__(self):
        raise AssertionError("The paginator must leave page evaluation to its consumer")


class _StaticPaginator:
    def __init__(self, result):
        self.result = result

    def get_result(self, limit, cursor):
        return self.result

    def process_results(self, results):
        return {"group": {"results": results}}


def _request(**params):
    return SimpleNamespace(GET={"per_page": "4", **params})


def _result(rows, cls=CursorResult):
    return cls(
        results=rows,
        next=Cursor(4, 1, False, False),
        prev=Cursor(4, -1, True, False),
        hits=4,
        max_hits=1,
    )


def _queryset(total=4):
    rows = mock.MagicMock(spec=QuerySet)
    rows.query = SimpleNamespace(select_for_update=False, is_sliced=True)
    rows.count.return_value = total
    rows.__len__.return_value = total
    return rows


@pytest.mark.parametrize("total", [0, 1, 4, 5, 100_000])
def test_supplied_count_source_is_not_boolean_tested(total):
    count_source = _CountSource(total)
    page = _PageQuery(range(5))
    result = OffsetPaginator(page, total_count_queryset=count_source).get_result(limit=4)
    assert result.hits == total
    count_source.count.assert_called_once_with()
    page.count.assert_not_called()


def test_missing_count_source_uses_the_page_queryset():
    page = _PageQuery(range(5))
    result = OffsetPaginator(page).get_result(limit=4)
    assert result.hits == 5
    page.count.assert_called_once_with()


@pytest.mark.parametrize("total", [0, 1, 4, 5, 8, 9, 21])
@pytest.mark.parametrize("page_number", [0, 1, 2, 7])
def test_page_boundaries_and_lazy_result_are_preserved(total, page_number):
    source = _PageQuery(range(total))
    result = OffsetPaginator(source).get_result(limit=4, cursor=Cursor(4, page_number, False))
    offset = page_number * 4
    assert list(result.results.rows) == list(range(total))[offset : offset + 4]
    assert result.hits == total
    assert result.max_hits == (total + 3) // 4
    assert result.next.has_results is (total > offset + 4)
    assert result.prev.has_results is (page_number > 0)
    assert str(result.next) == f"4:{page_number + 1}:0"
    assert str(result.prev) == f"4:{page_number - 1}:1"


def test_maximum_page_size_is_preserved():
    result = OffsetPaginator(_PageQuery(range(10)), max_limit=3).get_result(limit=20)
    assert list(result.results.rows) == [0, 1, 2]
    assert result.next.value == 3


@pytest.mark.parametrize("offset", [-1, 3])
def test_offset_limits_still_raise(offset):
    with pytest.raises(BadPaginationError):
        OffsetPaginator(_PageQuery(range(20)), max_offset=12).get_result(limit=4, cursor=Cursor(4, offset))


def test_previous_cursor_with_unchanged_page_size_is_preserved():
    result = OffsetPaginator(_PageQuery(range(12))).get_result(limit=4, cursor=Cursor(4, 1, True))
    assert list(result.results.rows) == [4, 5, 6, 7]
    assert result.prev.has_results is True


@pytest.mark.parametrize("transformed", [[], [{"id": 1}], {"items": []}, (), None])
def test_callback_output_cardinality_is_not_used_for_page_count(transformed):
    rows = _queryset()
    callback = mock.Mock(return_value=transformed)
    response = BasePaginator().paginate(_request(), paginator=_StaticPaginator(_result(rows)), on_results=callback)
    callback.assert_called_once_with(rows)
    assert response.data["results"] is transformed
    assert response.data["count"] == 4
    rows.count.assert_called_once_with()
    rows.__len__.assert_not_called()


def test_controller_output_does_not_change_source_count():
    rows = _queryset()
    response = BasePaginator().paginate(
        _request(),
        paginator=_StaticPaginator(_result(rows)),
        on_results=lambda _: [{"id": 1}],
        controller=lambda _: {"summary": "not a row list"},
    )
    assert response.data["count"] == 4
    assert response.data["results"] == {"summary": "not a row list"}
    rows.count.assert_called_once_with()
    rows.__len__.assert_not_called()


def test_group_container_count_is_not_confused_with_raw_row_count():
    rows = _queryset()
    response = BasePaginator().paginate(
        _request(),
        paginator=_StaticPaginator(_result(rows)),
        on_results=lambda _: [{"id": 1}],
        group_by_field_name="priority",
    )
    assert response.data["count"] == 4
    assert len(response.data["results"]) == 1
    rows.__len__.assert_not_called()


@pytest.mark.parametrize("callback", [None, lambda rows: rows])
def test_raw_queryset_response_keeps_the_single_evaluation_path(callback):
    rows = _queryset()
    response = BasePaginator().paginate(_request(), paginator=_StaticPaginator(_result(rows)), on_results=callback)
    assert response.data["results"] is rows
    assert response.data["count"] == 4
    rows.count.assert_not_called()
    rows.__len__.assert_called_once_with()


def test_controller_returning_original_queryset_preserves_cache_filling():
    rows = _queryset()
    response = BasePaginator().paginate(
        _request(),
        paginator=_StaticPaginator(_result(rows)),
        on_results=lambda _: [],
        controller=lambda _: rows,
    )
    assert response.data["results"] is rows
    rows.count.assert_not_called()
    rows.__len__.assert_called_once_with()


@pytest.mark.parametrize("rows", [[], [1, 2], (1, 2, 3), "abc"])
def test_non_queryset_result_keeps_sequence_length(rows):
    response = BasePaginator().paginate(
        _request(), paginator=_StaticPaginator(_result(rows)), on_results=lambda _: {"filtered": []}
    )
    assert response.data["count"] == len(rows)


def test_custom_cursor_result_length_contract_is_preserved():
    class CustomResult(CursorResult):
        def __len__(self):
            return 17

    rows = _queryset()
    response = BasePaginator().paginate(
        _request(), paginator=_StaticPaginator(_result(rows, cls=CustomResult)), on_results=lambda _: []
    )
    assert response.data["count"] == 17
    rows.count.assert_not_called()
    rows.__len__.assert_not_called()


def test_cursor_result_sequence_contract_itself_is_unchanged():
    result = _result([1, 2, 3])
    assert len(result) == 3
    assert list(result) == [1, 2, 3]
    assert result[1:] == [2, 3]
    assert repr(result) == "<CursorResult: results=3>"


def test_locking_queryset_keeps_its_evaluation_semantics():
    rows = _queryset()
    rows.query.select_for_update = True
    response = BasePaginator().paginate(_request(), paginator=_StaticPaginator(_result(rows)), on_results=lambda _: [])
    assert response.data["count"] == 4
    rows.count.assert_not_called()
    rows.__len__.assert_called_once_with()


def test_unsliced_queryset_keeps_ordering_sensitive_length_semantics():
    rows = _queryset()
    rows.query.is_sliced = False
    rows.count.return_value = 1
    response = BasePaginator().paginate(_request(), paginator=_StaticPaginator(_result(rows)), on_results=lambda _: [])
    assert response.data["count"] == 4
    rows.count.assert_not_called()
    rows.__len__.assert_called_once_with()


def test_controller_without_callback_keeps_existing_cache_behavior():
    rows = _queryset()
    response = BasePaginator().paginate(
        _request(),
        paginator=_StaticPaginator(_result(rows)),
        controller=lambda _: {"summary": "controller-only"},
    )
    assert response.data["count"] == 4
    assert response.data["results"] == {"summary": "controller-only"}
    rows.count.assert_not_called()
    rows.__len__.assert_called_once_with()
