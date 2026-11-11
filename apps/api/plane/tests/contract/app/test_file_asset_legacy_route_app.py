# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""The legacy ``file-assets/<workspace_id>/<asset_key>/`` route only serves GET/DELETE.

``FileAssetEndpoint.post`` takes ``slug``, so a POST on this route used to raise
``TypeError`` (500). It must now be rejected with 405.
"""

import pytest
from rest_framework import status


@pytest.mark.contract
def test_post_on_workspace_id_route_is_405(session_client, workspace):
    response = session_client.post(f"/api/workspaces/file-assets/{workspace.id}/image.png/")
    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED


@pytest.mark.contract
def test_options_on_workspace_id_route_is_not_405(session_client, workspace):
    response = session_client.options(f"/api/workspaces/file-assets/{workspace.id}/image.png/")
    assert response.status_code != status.HTTP_405_METHOD_NOT_ALLOWED
