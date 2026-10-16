# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Asset URLs are served inline only for allow-listed image types, with the response
Content-Type pinned to that type. Any other type, or a missing type, is served as an
attachment with no Content-Type override."""

from unittest import mock

import pytest
from rest_framework.test import APIClient

from plane.db.models import FileAsset


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize(
    "claimed_type, expected_disposition, expected_type",
    [
        ("image/png", "inline", "image/png"),
        ("image/svg+xml", "attachment", None),
        ("text/html", "attachment", None),
        (None, "attachment", None),
    ],
)
def test_static_asset_disposition_follows_allow_list(
    workspace, create_user, claimed_type, expected_disposition, expected_type
):
    attributes = {"name": "a.png", "size": 10}
    if claimed_type:
        attributes["type"] = claimed_type
    asset = FileAsset.objects.create(
        attributes=attributes,
        asset=f"{workspace.id}/avatar",
        size=10,
        workspace=workspace,
        user=create_user,
        created_by=create_user,
        entity_type=FileAsset.EntityTypeContext.USER_AVATAR,
        is_uploaded=True,
    )

    with mock.patch("plane.settings.storage.boto3") as mock_boto3:
        s3_client = mock_boto3.client.return_value
        s3_client.generate_presigned_url.return_value = "https://signed.example/avatar"
        response = APIClient().get(f"/api/assets/v2/static/{asset.id}/")

    assert response.status_code == 302
    params = s3_client.generate_presigned_url.call_args.kwargs["Params"]
    assert params["ResponseContentDisposition"].split(";")[0] == expected_disposition
    assert params.get("ResponseContentType") == expected_type
