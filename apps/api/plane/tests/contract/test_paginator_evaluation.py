# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Real-ORM regression coverage for count-only pagination.

Run with the repository's PostgreSQL test settings. No ORM/authentication is
mocked; from_db is wrapped solely to observe real model construction.
"""

from concurrent.futures import ThreadPoolExecutor
from contextlib import ExitStack, contextmanager
from types import SimpleNamespace
from unittest import mock
from uuid import uuid4

import pytest
from django.db import DatabaseError, connections, transaction
from django.db.models import Count, F, Window
from django.db.models.functions import RowNumber

from plane.db.models import User
from plane.utils.paginator import BasePaginator, Cursor, CursorResult, OffsetPaginator

pytestmark = [pytest.mark.contract, pytest.mark.django_db(databases="__all__")]


@contextmanager
def capture_statements():
    statements = []

    def record(execute, sql, params, many, context):
        statements.append({"alias": context["connection"].alias, "sql": sql})
        return execute(sql, params, many, context)

    with ExitStack() as stack:
        for alias in connections:
            stack.enter_context(connections[alias].execute_wrapper(record))
        yield statements


@pytest.fixture
def user_ids():
    token = uuid4().hex
    users = User.objects.bulk_create(
        [
            User(
                email=f"paginator-{token}-{index}@example.test",
                username=f"paginator-{token}-{index}",
                first_name=f"User {index:02}",
                is_active=True,
            )
            for index in range(9)
        ]
    )
    return [user.pk for user in users]


def fresh_users(user_ids):
    return User._base_manager.using("default").filter(pk__in=user_ids).order_by("id")


def request(page=0):
    return SimpleNamespace(GET={"per_page": "4", "cursor": f"4:{page}:0"})


class StaticPaginator:
    """Only replaces page selection when testing a callback's count contract."""

    def __init__(self, queryset):
        self.queryset = queryset

    def get_result(self, limit, cursor):
        return CursorResult(
            self.queryset,
            Cursor(limit, 1, False, False),
            Cursor(limit, -1, True, False),
            hits=9,
            max_hits=1,
        )


def test_total_count_does_not_fetch_models_or_populate_queryset_cache(user_ids):
    count_queryset = fresh_users(user_ids)
    page_queryset = fresh_users(user_ids)
    with capture_statements() as statements, mock.patch.object(User, "from_db", wraps=User.from_db) as hydrate:
        result = OffsetPaginator(page_queryset, total_count_queryset=count_queryset).get_result(limit=4)
    assert result.hits == 9
    assert count_queryset._result_cache is None
    assert result.results._result_cache is None
    hydrate.assert_not_called()
    assert statements
    assert all("COUNT(" in statement["sql"].upper() for statement in statements)
    assert {statement["alias"] for statement in statements} == {"default"}


@pytest.mark.parametrize("empty_kind", ["none", "filtered"])
def test_explicit_empty_count_queryset_is_authoritative(user_ids, empty_kind):
    count_queryset = fresh_users(user_ids)
    count_queryset = count_queryset.none() if empty_kind == "none" else count_queryset.filter(pk=uuid4())
    with mock.patch.object(User, "from_db", wraps=User.from_db) as hydrate:
        result = OffsetPaginator(fresh_users(user_ids), total_count_queryset=count_queryset).get_result(limit=4)
    assert result.hits == 0
    assert result.max_hits == 0
    assert count_queryset._result_cache is None
    hydrate.assert_not_called()
    # Deliberately inconsistent inputs test only the optional-count-source
    # contract. Normal callers must supply equivalently scoped querysets.


def test_omitted_count_queryset_still_counts_the_original_rows(user_ids):
    with mock.patch.object(User, "from_db", wraps=User.from_db) as hydrate:
        result = OffsetPaginator(fresh_users(user_ids)).get_result(limit=4)
    assert result.hits == 9
    hydrate.assert_not_called()


def test_existing_count_queryset_cache_is_reused(user_ids):
    count_queryset = fresh_users(user_ids)
    loaded = list(count_queryset)
    with capture_statements() as statements, mock.patch.object(User, "from_db", wraps=User.from_db) as hydrate:
        result = OffsetPaginator(fresh_users(user_ids), total_count_queryset=count_queryset).get_result(limit=4)
    assert result.hits == len(loaded)
    # Any remaining probe is count-only. Do not depend on #9948's separate
    # proposal to remove the existing next-page count query.
    assert all("COUNT(" in statement["sql"].upper() for statement in statements)
    hydrate.assert_not_called()


@pytest.mark.parametrize("page", [0, 1, 2, 3, 20])
def test_projected_page_count_does_not_rehydrate_original_page(user_ids, page):
    expected = list(fresh_users(user_ids).values("id", "first_name"))[page * 4 : page * 4 + 4]
    original_pages = []

    def project(rows):
        original_pages.append(rows)
        return list(rows.values("id", "first_name"))

    count_queryset = fresh_users(user_ids)
    with capture_statements() as statements, mock.patch.object(User, "from_db", wraps=User.from_db) as hydrate:
        response = BasePaginator().paginate(
            request(page), queryset=fresh_users(user_ids), total_count_queryset=count_queryset, on_results=project
        )
    assert response.data["results"] == expected
    assert response.data["count"] == len(expected)
    assert response.data["total_count"] == 9
    assert response.data["total_results"] == 9
    assert response.data["next_page_results"] is (9 > page * 4 + 4)
    assert count_queryset._result_cache is None
    assert original_pages[0]._result_cache is None
    hydrate.assert_not_called()
    row_queries = [statement for statement in statements if "COUNT(" not in statement["sql"].upper()]
    assert len(row_queries) == 1, statements
    assert '"first_name"' in row_queries[0]["sql"]


@pytest.mark.parametrize("kind", ["filter", "mapping", "deduplicated_projection"])
def test_transformed_cardinality_does_not_replace_raw_page_count(user_ids, kind):
    raw = fresh_users(user_ids)[:9]

    def transform(rows):
        if kind == "deduplicated_projection":
            return [{"is_active": value} for value in {row["is_active"] for row in rows.values("is_active")}]
        projected = list(rows.values("id"))
        return projected[:1] if kind == "filter" else {"items": projected}

    with mock.patch.object(User, "from_db", wraps=User.from_db) as hydrate:
        response = BasePaginator().paginate(request(), paginator=StaticPaginator(raw), on_results=transform)
    assert response.data["count"] == 9
    assert len(response.data["results"]) == 1
    assert raw._result_cache is None
    hydrate.assert_not_called()


@pytest.mark.parametrize("callback_kind", ["none", "passthrough", "serialize"])
def test_raw_or_serialized_page_is_fetched_only_once(user_ids, callback_kind):
    page = fresh_users(user_ids)[:4]

    def passthrough(rows):
        return rows

    def serialize(rows):
        return [{"id": user.id} for user in rows]

    callback = {"none": None, "passthrough": passthrough, "serialize": serialize}[callback_kind]
    with capture_statements() as statements, mock.patch.object(User, "from_db", wraps=User.from_db) as hydrate:
        response = BasePaginator().paginate(request(), paginator=StaticPaginator(page), on_results=callback)
        list(response.data["results"])
    assert response.data["count"] == 4
    assert hydrate.call_count == 4
    assert len(statements) == 1, statements
    assert "COUNT(" not in statements[0]["sql"].upper()


def test_grouped_annotation_count_keeps_raw_queryset_cardinality(user_ids):
    raw = fresh_users(user_ids).order_by().values("is_active").annotate(user_count=Count("pk"))
    with capture_statements() as statements, mock.patch.object(User, "from_db", wraps=User.from_db) as hydrate:
        response = BasePaginator().paginate(
            request(), paginator=StaticPaginator(raw), on_results=lambda rows: list(rows.values("user_count"))
        )
    assert response.data["count"] == 1
    assert response.data["results"] == [{"user_count": 9}]
    # Unsliced custom paginator results deliberately retain legacy evaluation.
    assert raw._result_cache is not None
    hydrate.assert_not_called()
    assert statements


def test_window_filtered_page_is_counted_without_hydration(user_ids):
    raw = (
        fresh_users(user_ids).annotate(position=Window(RowNumber(), order_by=F("id").asc())).filter(position__lte=2)[:2]
    )
    with mock.patch.object(User, "from_db", wraps=User.from_db) as hydrate:
        response = BasePaginator().paginate(
            request(), paginator=StaticPaginator(raw), on_results=lambda rows: list(rows.values("id", "position"))
        )
    assert response.data["count"] == 2
    assert len(response.data["results"]) == 2
    assert raw._result_cache is None
    hydrate.assert_not_called()


def test_values_queryset_input_remains_supported(user_ids):
    raw = fresh_users(user_ids).values("id", "first_name")[:4]
    with capture_statements() as statements:
        response = BasePaginator().paginate(request(), paginator=StaticPaginator(raw), on_results=list)
    assert response.data["count"] == 4
    assert len(response.data["results"]) == 4
    assert len(statements) == 1


@pytest.mark.django_db(transaction=True, databases="__all__")
def test_locking_page_still_acquires_and_releases_row_locks(user_ids):
    if connections["default"].vendor != "postgresql":
        pytest.skip("The lock-conflict assertion requires PostgreSQL")

    def try_lock():
        try:
            with transaction.atomic(using="default"):
                User._base_manager.using("default").select_for_update(nowait=True).get(pk=user_ids[0])
            return "acquired"
        except DatabaseError as exc:
            assert getattr(exc.__cause__, "sqlstate", None) == "55P03", repr(exc)
            return "locked"
        finally:
            connections["default"].close()

    # Ignoring the page in the callback makes the metadata evaluation the only
    # lock acquisition. A blind replacement with .count() loses these locks.
    with ThreadPoolExecutor(max_workers=1) as executor:
        with transaction.atomic(using="default"):
            raw = fresh_users(user_ids).select_for_update()[:9]
            response = BasePaginator().paginate(request(), paginator=StaticPaginator(raw), on_results=lambda _: [])
            assert response.data["count"] == 9
            assert executor.submit(try_lock).result(timeout=10) == "locked"
        assert executor.submit(try_lock).result(timeout=10) == "acquired"


def test_unsliced_ordering_sensitive_distinct_preserves_original_length(user_ids):
    # DISTINCT also selects the id needed by order_by(), so iteration yields
    # nine rows even though all nine visible is_active values are identical.
    # An unsliced COUNT can drop that ordering column and see only one row.
    raw = fresh_users(user_ids).values("is_active").distinct()
    expected = list(raw.all())
    assert len(expected) == 9
    response = BasePaginator().paginate(
        request(), paginator=StaticPaginator(raw), on_results=lambda rows: list(rows.values("is_active"))
    )
    assert response.data["results"] == expected
    assert response.data["count"] == len(expected)


def test_sliced_ordering_sensitive_distinct_keeps_the_page_boundary(user_ids):
    raw = fresh_users(user_ids).values("is_active").distinct()[:4]
    expected = list(raw.all())
    assert len(expected) == 4
    with capture_statements() as statements:
        response = BasePaginator().paginate(
            request(), paginator=StaticPaginator(raw), on_results=lambda rows: list(rows.values("is_active"))
        )
    assert response.data["results"] == expected
    assert response.data["count"] == 4
    assert raw._result_cache is None
    assert any("COUNT(" in item["sql"].upper() for item in statements)
