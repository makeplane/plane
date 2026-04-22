# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from types import SimpleNamespace

import pytest
from rest_framework.response import Response

from plane.permissions.view_mixin import (
    CONFIGURATION_ERROR_CODE,
    AuthorizedListingView,
)


class _Base:
    """Stand-in for BaseAPIView.finalize_response — returns the response."""

    def finalize_response(self, request, response, *args, **kwargs):
        return response


class _ListView(AuthorizedListingView, _Base):
    action = "list"


class _RetrieveView(AuthorizedListingView, _Base):
    action = "retrieve"


class _APIView(AuthorizedListingView, _Base):
    """No .action attribute — mixin falls back to request.method."""


@pytest.mark.unit
class TestAuthorizedListingView:
    def test_swaps_response_when_not_authorized_on_success(self):
        """Missing .authorized_for() on a successful listing response swaps
        the response for a structured 500 — does NOT raise. Raising would
        break Plane's outer dispatch wrapper (which doesn't re-finalize
        exception responses), so the mixin returns a finalized error
        instead.
        """
        request = SimpleNamespace(method="GET", _authorized_for_called=False)
        response = Response(status=200, data={"results": [{"id": 1}]})
        result = _ListView().finalize_response(request, response)
        assert result is not response
        assert result.status_code == 500
        assert result.data["code"] == CONFIGURATION_ERROR_CODE
        assert "authorized_for" in result.data["detail"]

    def test_passes_when_authorized(self):
        request = SimpleNamespace(method="GET", _authorized_for_called=True)
        response = Response(status=200, data={"results": []})
        result = _ListView().finalize_response(request, response)
        assert result is response
        assert result.status_code == 200

    def test_does_not_raise_on_4xx(self):
        """Bad query params return 400 before the queryset is built — the
        mixin must not overwrite that with a 500."""
        request = SimpleNamespace(method="GET", _authorized_for_called=False)
        response = Response(status=400, data={"detail": "bad params"})
        result = _ListView().finalize_response(request, response)
        assert result is response
        assert result.status_code == 400

    def test_does_not_raise_on_5xx_from_elsewhere(self):
        """A 500 originating elsewhere isn't overridden by a configuration 500."""
        request = SimpleNamespace(method="GET", _authorized_for_called=False)
        response = Response(status=500, data={"error": "something else"})
        result = _ListView().finalize_response(request, response)
        assert result is response

    def test_does_not_trigger_on_non_listing_action(self):
        request = SimpleNamespace(method="GET", _authorized_for_called=False)
        response = Response(status=200, data={"id": 1})
        result = _RetrieveView().finalize_response(request, response)
        assert result is response
        assert result.status_code == 200

    def test_baseapi_get_method_triggers_check(self):
        """For BaseAPIView (no .action), the HTTP method is used."""
        request = SimpleNamespace(method="GET", _authorized_for_called=False)
        response = Response(status=200, data={"results": []})
        result = _APIView().finalize_response(request, response)
        assert result.status_code == 500
        assert result.data["code"] == CONFIGURATION_ERROR_CODE

    def test_baseapi_post_method_does_not_trigger(self):
        """POST/PUT/DELETE aren't listing verbs — check shouldn't fire."""
        request = SimpleNamespace(method="POST", _authorized_for_called=False)
        response = Response(status=200, data={"id": 1})
        result = _APIView().finalize_response(request, response)
        assert result is response

    def test_missing_flag_treated_as_false(self):
        """getattr(..., False) default means a never-set attribute is False."""
        request = SimpleNamespace(method="GET")  # no _authorized_for_called
        response = Response(status=200, data={"results": []})
        result = _ListView().finalize_response(request, response)
        assert result.status_code == 500
        assert result.data["code"] == CONFIGURATION_ERROR_CODE


@pytest.mark.unit
@pytest.mark.django_db
class TestAuthorizedListingViewRendering:
    """Request-level render test: exercise the full DRF render pipeline to
    confirm the error Response can be serialized to JSON without errors.
    This is the guarantee the finalize-response-returns-Response strategy
    gives us that raise-from-finalize-response didn't.
    """

    def test_error_response_renders_through_json_renderer(self):
        """Full stack: the swapped error Response must render through the
        standard DRF JSONRenderer without AttributeError (missing renderer)
        or other rendering failures."""
        from rest_framework.test import APIRequestFactory
        from rest_framework.views import APIView

        class Buggy(AuthorizedListingView, APIView):
            """View that forgets to call .authorized_for()."""

            # Bypass default DRF auth/permission so the test exercises the
            # mixin path, not auth.
            authentication_classes = []
            permission_classes = []

            def get(self, request):
                return Response(status=200, data={"results": [{"id": 1}]})

        view = Buggy.as_view()
        factory = APIRequestFactory()
        request = factory.get("/whatever/", HTTP_ACCEPT="application/json")
        response = view(request)
        # Render the response — this is where unfinalized responses fail.
        response.render()
        assert response.status_code == 500
        import json
        body = json.loads(response.content.decode("utf-8"))
        assert body["code"] == CONFIGURATION_ERROR_CODE
        assert "authorized_for" in body["detail"]

    def test_success_response_renders_normally(self):
        """Successful listing (with .authorized_for() called) renders normally."""
        from rest_framework.test import APIRequestFactory
        from rest_framework.views import APIView

        class Happy(AuthorizedListingView, APIView):
            authentication_classes = []
            permission_classes = []

            def get(self, request):
                # Simulate .authorized_for() being called on the queryset.
                request._authorized_for_called = True
                return Response(status=200, data={"results": [{"id": 1}]})

        view = Happy.as_view()
        factory = APIRequestFactory()
        request = factory.get("/whatever/", HTTP_ACCEPT="application/json")
        response = view(request)
        response.render()
        assert response.status_code == 200
        import json
        body = json.loads(response.content.decode("utf-8"))
        assert body == {"results": [{"id": 1}]}
