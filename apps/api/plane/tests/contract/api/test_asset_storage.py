# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for storage initialization in public asset endpoints."""

from unittest import mock

import pytest
from rest_framework import status

from plane.db.models import FileAsset


@pytest.mark.contract
class TestPublicAssetStorageInitialization:
    """Public asset endpoints must construct ``S3Storage`` with its supported API."""

    @pytest.mark.django_db
    def test_member_can_generate_generic_asset_download(self, api_key_client, workspace, create_user):
        """The generic download route returns a URL using the supported storage API."""
        asset = FileAsset.objects.create(
            attributes={"name": "screenshot.png", "type": "image/png", "size": 1024},
            asset=f"{workspace.id}/screenshot.png",
            size=1024,
            workspace=workspace,
            created_by=create_user,
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            is_uploaded=True,
            storage_metadata={"size": 1024},
        )
        url = f"/api/v1/workspaces/{workspace.slug}/assets/{asset.id}/"

        with mock.patch("plane.api.views.asset.S3Storage", autospec=True) as mock_storage:
            mock_storage.return_value.generate_presigned_url.return_value = "https://signed.example/download"
            response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        assert response.data["asset_url"] == "https://signed.example/download"
        mock_storage.assert_called_once_with(request=mock.ANY)

    @pytest.mark.django_db
    def test_member_can_generate_generic_asset_upload(self, api_key_client, workspace):
        """The generic upload route creates its asset using the supported storage API."""
        url = f"/api/v1/workspaces/{workspace.slug}/assets/"
        payload = {"name": "screenshot.png", "type": "image/png", "size": 1024}

        with mock.patch("plane.api.views.asset.S3Storage", autospec=True) as mock_storage:
            mock_storage.return_value.generate_presigned_post.return_value = {
                "url": "https://signed.example/upload",
                "fields": {},
            }
            response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        assert FileAsset.objects.filter(id=response.data["asset_id"], workspace=workspace).exists()
        mock_storage.assert_called_once_with(request=mock.ANY)

    @pytest.mark.django_db
    def test_user_can_generate_server_asset_upload(self, api_key_client, create_user):
        """The server upload route creates a user asset using the supported storage API."""
        url = "/api/v1/assets/user-assets/server/"
        payload = {
            "name": "avatar.png",
            "type": "image/png",
            "size": 1024,
            "entity_type": FileAsset.EntityTypeContext.USER_AVATAR,
        }

        with mock.patch("plane.api.views.asset.S3Storage", autospec=True) as mock_storage:
            mock_storage.return_value.generate_presigned_post.return_value = {
                "url": "https://signed.example/upload",
                "fields": {},
            }
            response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        assert FileAsset.objects.filter(id=response.data["asset_id"], user=create_user).exists()
        mock_storage.assert_called_once_with(request=mock.ANY)
