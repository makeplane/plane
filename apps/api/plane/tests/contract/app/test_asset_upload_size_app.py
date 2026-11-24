# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Asset upload endpoints reject a ``size`` that isn't a positive whole number.

The upload endpoints read ``int(request.data.get("size", ...))`` directly, so a
size like ``"abc"`` or ``null`` raised ValueError/TypeError (HTTP 500), and a
negative size went on to the presigned upload. The work item attachment endpoint
of the public API already answers these with a 400.
"""

from unittest import mock

import pytest
from rest_framework import status

BAD_SIZES = ["abc", None, -5, 0, 1.5, True]


@pytest.fixture(autouse=True)
def storage():
    with mock.patch("plane.app.views.asset.v2.S3Storage") as s3:
        s3.return_value.generate_presigned_post.return_value = {"url": "https://s3.test/", "fields": {}}
        yield s3


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("size", BAD_SIZES)
def test_user_asset_bad_size_is_400(session_client, size):
    response = session_client.post(
        "/api/assets/v2/user-assets/",
        {"name": "a.png", "type": "image/png", "size": size, "entity_type": "USER_AVATAR"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("size", BAD_SIZES)
def test_workspace_asset_bad_size_is_400(session_client, workspace, size):
    response = session_client.post(
        f"/api/assets/v2/workspaces/{workspace.slug}/",
        {"name": "a.png", "type": "image/png", "size": size, "entity_type": "WORKSPACE_LOGO"},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("size", [1024, "2048", None])
def test_user_asset_good_or_missing_size_still_works(session_client, size):
    data = {"name": "a.png", "type": "image/png", "entity_type": "USER_AVATAR"}
    if size is not None:
        data["size"] = size

    response = session_client.post("/api/assets/v2/user-assets/", data, format="json")

    assert response.status_code == status.HTTP_200_OK
