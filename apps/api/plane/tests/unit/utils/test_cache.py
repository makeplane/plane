# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from django.test import RequestFactory, override_settings
from rest_framework.response import Response

from plane.utils.cache import cache_response, invalidate_cache

CACHE_PATH = "/api/tests/invalidate-cache/"


def _view_that_races_a_read(status_code):
    """A write handler during which a concurrent read caches the pre-write data."""

    def view(instance, request):
        cache.set(f"{CACHE_PATH}:some-user", {"data": "stale", "status": 200})
        return Response(status=status_code)

    return view


@pytest.fixture
def request_obj():
    request = RequestFactory().post(CACHE_PATH)
    request.user = AnonymousUser()
    return request


@pytest.fixture(autouse=True)
def _clear_cache():
    cache.delete_pattern(f"*{CACHE_PATH}*")
    yield
    cache.delete_pattern(f"*{CACHE_PATH}*")


@pytest.fixture
def get_request():
    request = RequestFactory().get(CACHE_PATH)
    request.user = AnonymousUser()
    return request


@pytest.mark.unit
class TestInvalidateCacheAfterWrite:
    def test_clears_entry_cached_during_successful_write(self, request_obj):
        view = invalidate_cache(path=CACHE_PATH, user=False, multiple=True, after_write=True)(
            _view_that_races_a_read(200)
        )
        view(None, request_obj)
        assert cache.get(f"{CACHE_PATH}:some-user") is None

    def test_keeps_entry_when_write_fails(self, request_obj):
        view = invalidate_cache(path=CACHE_PATH, user=False, multiple=True, after_write=True)(
            _view_that_races_a_read(400)
        )
        view(None, request_obj)
        assert cache.get(f"{CACHE_PATH}:some-user") is not None

    def test_without_after_write_only_invalidates_before_the_view(self, request_obj):
        view = invalidate_cache(path=CACHE_PATH, user=False, multiple=True)(_view_that_races_a_read(200))
        view(None, request_obj)
        assert cache.get(f"{CACHE_PATH}:some-user") is not None


@pytest.mark.unit
class TestInFlightReadDuringWrite:
    @override_settings(DEBUG=False)
    def test_read_paused_across_write_does_not_cache_stale_data(self, request_obj, get_request):
        db = {"labels": "old"}

        def write(instance, request):
            db["labels"] = "new"
            return Response(status=200)

        write_view = invalidate_cache(path=CACHE_PATH, user=False, multiple=True, after_write=True)(write)

        def read(instance, request):
            data = db["labels"]
            if data == "old":
                # The read has loaded the old data; the write and both invalidations
                # finish before it reaches the cache.set in cache_response
                write_view(None, request_obj)
            return Response(data, status=200)

        read_view = cache_response(user=False)(read)

        assert read_view(None, get_request).data == "old"
        assert read_view(None, get_request).data == "new"
