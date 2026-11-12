# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Regression tests for the OAuth callback views that read the host back out of
the session.

Assigning ``base_host = request.session.get("host")`` inside the callback
shadowed the imported ``base_host()`` helper, so every later
``base_host(request=...)`` call in the same method raised
``TypeError: 'str' object is not callable`` and no OAuth login on the affected
views could complete.

See: https://github.com/makeplane/plane/issues/9159
See: https://github.com/makeplane/plane/issues/9164
"""

import pytest
from django.http import HttpResponseRedirect
from django.test import RequestFactory, override_settings

from plane.authentication.views.space.github import GitHubCallbackSpaceEndpoint
from plane.authentication.views.space.gitlab import GitLabCallbackSpaceEndpoint
from plane.authentication.views.space.google import GoogleCallbackSpaceEndpoint

CALLBACK_VIEWS = [
    GitHubCallbackSpaceEndpoint,
    GitLabCallbackSpaceEndpoint,
    GoogleCallbackSpaceEndpoint,
]


@pytest.mark.unit
@pytest.mark.parametrize("view_class", CALLBACK_VIEWS, ids=lambda c: c.__name__)
@override_settings(WEB_URL="http://localhost", SPACE_BASE_URL=None)
def test_state_mismatch_redirects_with_error(view_class):
    """A bad state must redirect back to the app with an error, not crash."""
    request = RequestFactory().get("/auth/callback/", {"code": "abc", "state": "wrong"})
    request.session = {"state": "expected", "host": "http://localhost", "next_path": ""}

    response = view_class().get(request)

    assert isinstance(response, HttpResponseRedirect)
    assert response.url.startswith("http://localhost/spaces/")
    assert "error_code" in response.url
