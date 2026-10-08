# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Both v1 base classes reject scalar write bodies and allow objects and arrays."""

from unittest.mock import patch

import pytest
from rest_framework.exceptions import ParseError
from rest_framework.parsers import JSONParser
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from plane.api.views.base import BaseAPIView, BaseViewSet

_VIEW_CLASSES = [BaseAPIView, BaseViewSet]


def _request(method, body):
    django_request = getattr(APIRequestFactory(), method)(
        "/api/test/",
        data=body,
        content_type="application/json",
    )
    return Request(django_request, parsers=[JSONParser()])


@pytest.mark.unit
@pytest.mark.parametrize("view_class", _VIEW_CLASSES, ids=lambda view_class: view_class.__name__)
@pytest.mark.parametrize("method", ["post", "put", "patch"])
@pytest.mark.parametrize("body", ['"hello"', "42", "true", "null"])
def test_scalar_write_body_is_rejected(view_class, method, body):
    view = view_class()
    request = _request(method, body)

    with (
        patch("plane.api.views.base.TimezoneMixin.initial"),
        pytest.raises(ParseError, match="JSON object or array"),
    ):
        view.initial(request)


@pytest.mark.unit
@pytest.mark.parametrize("view_class", _VIEW_CLASSES, ids=lambda view_class: view_class.__name__)
@pytest.mark.parametrize("method", ["post", "put", "patch"])
@pytest.mark.parametrize("body", ["{}", "[]", '{"name": "note"}', '[{"name": "note"}]'])
def test_object_and_array_bodies_pass(view_class, method, body):
    view = view_class()
    request = _request(method, body)

    with patch("plane.api.views.base.TimezoneMixin.initial"):
        view.initial(request)
