# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from django.test import RequestFactory
from rest_framework.response import Response

from plane.utils.cache import invalidate_cache

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
