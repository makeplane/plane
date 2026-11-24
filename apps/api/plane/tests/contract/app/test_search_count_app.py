# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""GET /api/workspaces/<slug>/entity-search/ with a bad ``count``.

``count`` went through ``int()`` and then into the result slices, so a value
that isn't a whole number raised ValueError and a negative one failed on the
slice (HTTP 500) instead of a 400.
"""

import pytest
from rest_framework import status


def url(workspace):
    return f"/api/workspaces/{workspace.slug}/entity-search/"


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("count", ["abc", "-1", "0", ""])
def test_invalid_count_is_400(session_client, workspace, count):
    response = session_client.get(url(workspace), {"query": "a", "query_type": "user_mention", "count": count})

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
@pytest.mark.django_db
def test_valid_or_missing_count_still_works(session_client, workspace):
    for params in ({"query": "a", "query_type": "user_mention", "count": "3"}, {"query": "a"}):
        response = session_client.get(url(workspace), params)

        assert response.status_code == status.HTTP_200_OK
