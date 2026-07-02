# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework.test import APIRequestFactory

from plane.utils.paginator import BasePaginator, Cursor, CursorResult


class OffsetEchoPaginator:
    def get_result(self, limit=1000, cursor=None):
        return CursorResult(
            results=[{"page_offset": cursor.offset}],
            next=Cursor(limit, cursor.offset + 1, False, False),
            prev=Cursor(limit, cursor.offset - 1, True, cursor.offset > 0),
            hits=2,
            max_hits=2,
        )


@pytest.mark.unit
class TestBasePaginatorPageSupport:
    def setup_method(self):
        self.base_paginator = BasePaginator()
        self.factory = APIRequestFactory()

    @pytest.mark.parametrize(
        ("page", "expected_offset"),
        [
            ("1", 0),
            ("2", 1),
        ],
    )
    def test_paginate_honors_explicit_page_parameter(self, page, expected_offset):
        request = self.factory.get("/", {"page": page, "per_page": "10"})

        response = self.base_paginator.paginate(request=request, paginator=OffsetEchoPaginator())

        assert response.data["results"][0]["page_offset"] == expected_offset

    def test_paginate_returns_no_next_cursor_on_last_page(self):
        request = self.factory.get("/", {"page": "2", "per_page": "10"})

        response = self.base_paginator.paginate(request=request, paginator=OffsetEchoPaginator())

        assert response.data["next_page_results"] is False
        assert response.data["next_cursor"] is None

    def test_following_next_cursor_metadata_terminates(self):
        class TwoPagePaginator:
            def get_result(self, limit=1000, cursor=None):
                has_next = cursor.offset == 0
                return CursorResult(
                    results=[{"page_offset": cursor.offset}],
                    next=Cursor(limit, cursor.offset + 1, False, has_next),
                    prev=Cursor(limit, cursor.offset - 1, True, cursor.offset > 0),
                    hits=3,
                    max_hits=2,
                )

        seen_offsets = []
        next_cursor = None
        paginator = TwoPagePaginator()

        for _ in range(5):
            params = {"per_page": "2"}
            if next_cursor:
                params["cursor"] = next_cursor

            request = self.factory.get("/", params)
            response = self.base_paginator.paginate(request=request, paginator=paginator)

            seen_offsets.append(response.data["results"][0]["page_offset"])
            next_cursor = response.data["next_cursor"]
            if not next_cursor:
                break

        assert seen_offsets == [0, 1]
        assert next_cursor is None
