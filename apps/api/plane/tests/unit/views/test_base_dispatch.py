# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Regression tests for the ``dispatch()`` exception handling on the shared
``BaseAPIView`` / ``BaseViewSet`` classes.

When ``super().dispatch()`` raises an unhandled exception, ``dispatch()`` must
return the HTTP ``Response`` produced by ``handle_exception()`` -- not the raw
exception object. Returning the exception causes Django's response pipeline to
fail with ``TypeError: 'Exception' object is not a valid HTTP response``.

See: https://github.com/makeplane/plane/issues/9157
"""

import pytest
from unittest.mock import patch

from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory

from plane.api.views.base import BaseAPIView as ApiBaseAPIView, BaseViewSet as ApiBaseViewSet
from plane.app.views.base import BaseAPIView as AppBaseAPIView, BaseViewSet as AppBaseViewSet
from plane.license.api.views.base import BaseAPIView as LicenseBaseAPIView
from plane.space.views.base import BaseAPIView as SpaceBaseAPIView, BaseViewSet as SpaceBaseViewSet


# Every shared base view that wraps ``super().dispatch()`` in a try/except.
VIEW_CLASSES = [
    ApiBaseAPIView,
    ApiBaseViewSet,
    AppBaseAPIView,
    AppBaseViewSet,
    LicenseBaseAPIView,
    SpaceBaseAPIView,
    SpaceBaseViewSet,
]


@pytest.mark.unit
@pytest.mark.parametrize(
    "view_class",
    VIEW_CLASSES,
    ids=lambda c: f"{c.__module__}.{c.__name__}",
)
def test_dispatch_returns_response_when_super_dispatch_raises(view_class):
    """dispatch() must return handle_exception()'s Response, not the exception."""
    request = APIRequestFactory().get("/api/test/")
    view = view_class()

    sentinel = Response(
        {"error": "Something went wrong please try again later"},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )

    with (
        patch("rest_framework.views.APIView.dispatch", side_effect=RuntimeError("boom")),
        patch.object(view_class, "handle_exception", return_value=sentinel) as mock_handle,
    ):
        result = view.dispatch(request)

    mock_handle.assert_called_once()
    assert isinstance(result, Response), (
        f"{view_class.__module__}.{view_class.__name__}.dispatch() returned "
        f"{type(result).__name__} instead of an HTTP Response"
    )
    assert result is sentinel
