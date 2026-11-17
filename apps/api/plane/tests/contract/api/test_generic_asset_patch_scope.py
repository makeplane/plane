# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for who may confirm an upload on the external-API ``GenericAssetEndpoint``.

``patch`` follows the web app's rule (``can_modify_asset``): the uploader, or an
admin of the entity the asset belongs to. It only marks the asset as uploaded.
"""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import FileAsset, Project, ProjectMember, WorkspaceMember
from plane.tests.factories import UserFactory


def asset_detail_url(slug, asset_id):
    return f"/api/v1/workspaces/{slug}/assets/{asset_id}/"


@pytest.fixture
def guest_project(db, workspace, create_user):
    """A project the token holder is a guest of, in a workspace they are a guest of."""
    WorkspaceMember.objects.filter(workspace=workspace, member=create_user).update(role=5)
    project = Project.objects.create(name="Guest Project", identifier="GST", workspace=workspace)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=5, is_active=True)
    return project


def _attachment(workspace, project, creator, is_uploaded):
    asset = FileAsset(
        attributes={"name": "file.pdf", "type": "application/pdf", "size": 1024},
        asset=f"{workspace.id}/{uuid4().hex}-file.pdf",
        size=1024,
        workspace=workspace,
        project=project,
        entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
        is_uploaded=is_uploaded,
        # Pre-populated so the handler does not enqueue the metadata task
        storage_metadata={"size": 1024},
    )
    # Outside a request BaseModel.save() clears created_by unless it is passed here
    asset.save(created_by_id=creator.id)
    return asset


@pytest.mark.contract
class TestGenericAssetPatchScope:
    @pytest.mark.django_db
    def test_patch_denied_for_asset_the_caller_cannot_modify(self, api_key_client, workspace, guest_project):
        asset = _attachment(workspace, guest_project, UserFactory(), is_uploaded=True)

        response = api_key_client.patch(
            asset_detail_url(workspace.slug, asset.id), {"is_uploaded": False}, format="json"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN, getattr(response, "data", None)
        asset.refresh_from_db()
        assert asset.is_uploaded is True

    @pytest.mark.django_db
    def test_uploader_can_confirm_own_upload(self, api_key_client, workspace, guest_project):
        """The upload-then-confirm flow keeps working for a caller who is only a guest."""
        payload = {"name": "upload.png", "type": "image/png", "size": 16, "project_id": str(guest_project.id)}
        with mock.patch("plane.api.views.asset.S3Storage", autospec=True) as mock_storage:
            mock_storage.return_value.generate_presigned_post.return_value = {"url": "https://x"}
            created = api_key_client.post(f"/api/v1/workspaces/{workspace.slug}/assets/", payload, format="json")
        assert created.status_code == status.HTTP_200_OK, getattr(created, "data", None)
        asset = FileAsset.objects.get(id=created.data["asset_id"])
        assert asset.is_uploaded is False

        with mock.patch("plane.api.views.asset.get_asset_object_metadata"):
            response = api_key_client.patch(
                asset_detail_url(workspace.slug, asset.id), {"is_uploaded": True}, format="json"
            )

        assert response.status_code == status.HTTP_204_NO_CONTENT, getattr(response, "data", None)
        asset.refresh_from_db()
        assert asset.is_uploaded is True

    @pytest.mark.django_db
    def test_patch_does_not_unset_is_uploaded(self, api_key_client, workspace, guest_project, create_user):
        asset = _attachment(workspace, guest_project, create_user, is_uploaded=True)

        response = api_key_client.patch(
            asset_detail_url(workspace.slug, asset.id), {"is_uploaded": False}, format="json"
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT, getattr(response, "data", None)
        asset.refresh_from_db()
        assert asset.is_uploaded is True
