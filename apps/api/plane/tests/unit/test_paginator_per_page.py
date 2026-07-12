# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework.exceptions import ParseError
from rest_framework.test import APIRequestFactory

from plane.utils.paginator import BasePaginator


def request_with(per_page):
    factory = APIRequestFactory()
    return factory.get("/", {"per_page": per_page} if per_page is not None else {})


@pytest.mark.contract
class TestGetPerPageBounds:
    def test_zero_rejected_with_400(self):
        with pytest.raises(ParseError):
            BasePaginator().get_per_page(request_with("0"))

    def test_negative_rejected_with_400(self):
        with pytest.raises(ParseError):
            BasePaginator().get_per_page(request_with("-5"))

    def test_non_numeric_rejected_with_400(self):
        with pytest.raises(ParseError):
            BasePaginator().get_per_page(request_with("abc"))

    def test_above_max_rejected_with_400(self):
        with pytest.raises(ParseError):
            BasePaginator().get_per_page(request_with("1001"))

    def test_valid_values_pass_through(self):
        assert BasePaginator().get_per_page(request_with("1")) == 1
        assert BasePaginator().get_per_page(request_with("100")) == 100
        assert BasePaginator().get_per_page(request_with(None)) == 1000
