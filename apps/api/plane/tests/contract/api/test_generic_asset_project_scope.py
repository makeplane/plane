# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for project scoping on the external-API ``GenericAssetEndpoint`` (INFRA-501).

``WorkspaceUserPermission`` covers workspace access. On top of that, a
project-bound asset requires active membership of its project for ``get`` and
``patch`` (``FileAsset.is_project_accessible_to``), and ``post`` requires a
``project_id`` in the URL workspace that the caller is an active member of.
The external-id dedup lookup is scoped to that project.

Workspace-level assets (``project_id=None``) stay readable by any workspace
member, and a member of the asset's project keeps full access.

The positive paths patch ``S3Storage`` with ``autospec=True`` so the
constructor call is checked against its real signature.
"""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import (
    FileAsset,
    Project,
    ProjectMember,
    User,
    Workspace,
    WorkspaceMember,
)

S3_STORAGE_PATH = "plane.api.views.asset.S3Storage"


def asset_detail_url(slug, asset_id):
    return f"/api/v1/workspaces/{slug}/assets/{asset_id}/"


def asset_list_url(slug):
    return f"/api/v1/workspaces/{slug}/assets/"


def _user(prefix):
    unique_id = uuid4().hex[:8]
    user = User.objects.create(
        email=f"{prefix}-{unique_id}@plane.so",
        username=f"{prefix}_{unique_id}",
        first_name=prefix.capitalize(),
        last_name="User",
    )
    user.set_password("test-password")
    user.save()
    return user


@pytest.fixture
def project_owner(db):
    return _user("owner")


@pytest.fixture
def foreign_project(db, workspace, project_owner):
    """A project in the caller's workspace that the caller is not a member of.

    ``create_user`` (who holds the API token) is a workspace ADMIN; workspace role
    does not substitute for project membership.
    """
    WorkspaceMember.objects.create(workspace=workspace, member=project_owner, role=20, is_active=True)
    project = Project.objects.create(
        name="Foreign Project", identifier="FGN", workspace=workspace, created_by=project_owner
    )
    ProjectMember.objects.create(project=project, member=project_owner, workspace=workspace, role=20, is_active=True)
    return project


@pytest.fixture
def joined_project(db, workspace, create_user):
    """A project the token holder is an active member of."""
    project = Project.objects.create(
        name="Joined Project", identifier="JND", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20, is_active=True)
    return project


def _asset(workspace, creator, project=None, name="secret.pdf"):
    return FileAsset.objects.create(
        attributes={"name": name, "type": "application/pdf", "size": 1024},
        asset=f"{workspace.id}/{uuid4().hex}-{name}",
        size=1024,
        workspace=workspace,
        project=project,
        created_by=creator,
        entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
        is_uploaded=True,
        storage_metadata={"size": 1024},
    )


@pytest.fixture
def foreign_asset(db, workspace, foreign_project, project_owner):
    return _asset(workspace, project_owner, foreign_project)


@pytest.fixture
def joined_asset(db, workspace, joined_project, create_user):
    return _asset(workspace, create_user, joined_project, name="mine.pdf")


@pytest.fixture
def workspace_level_asset(db, workspace, create_user):
    """project_id is NULL -- workspace-scoped by definition."""
    asset = _asset(workspace, create_user, None, name="logo.png")
    asset.entity_type = FileAsset.EntityTypeContext.WORKSPACE_LOGO
    asset.save(update_fields=["entity_type"])
    return asset


@pytest.fixture
def other_workspace_project(db):
    """A project in another workspace."""
    owner = _user("tenant")
    other = Workspace.objects.create(name="Other Workspace", owner=owner, slug=f"other-{uuid4().hex[:8]}")
    WorkspaceMember.objects.create(workspace=other, member=owner, role=20, is_active=True)
    project = Project.objects.create(name="Other Project", identifier="OTH", workspace=other, created_by=owner)
    ProjectMember.objects.create(project=project, member=owner, workspace=other, role=20, is_active=True)
    return project


@pytest.mark.contract
class TestGenericAssetGetProjectScope:
    @pytest.mark.django_db
    def test_get_denied_for_non_project_member(self, api_key_client, workspace, foreign_asset):
        with mock.patch(S3_STORAGE_PATH) as mock_storage:
            # A real string keeps the response serializable if the check fails.
            mock_storage.return_value.generate_presigned_url.return_value = "https://example.com/s"
            response = api_key_client.get(asset_detail_url(workspace.slug, foreign_asset.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        mock_storage.return_value.generate_presigned_url.assert_not_called()

    @pytest.mark.django_db
    def test_get_checks_access_before_upload_state(self, api_key_client, workspace, foreign_asset):
        """The project check runs before the upload-state check."""
        foreign_asset.is_uploaded = False
        foreign_asset.save(update_fields=["is_uploaded"])

        response = api_key_client.get(asset_detail_url(workspace.slug, foreign_asset.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_get_allowed_for_project_member(self, api_key_client, workspace, joined_asset):
        with mock.patch(S3_STORAGE_PATH, autospec=True) as mock_storage:
            mock_storage.return_value.generate_presigned_url.return_value = "https://example.com/s"
            response = api_key_client.get(asset_detail_url(workspace.slug, joined_asset.id))

        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert response.data["asset_url"] == "https://example.com/s"

    @pytest.mark.django_db
    def test_get_allowed_for_workspace_level_asset(self, api_key_client, workspace, workspace_level_asset):
        with mock.patch(S3_STORAGE_PATH, autospec=True) as mock_storage:
            mock_storage.return_value.generate_presigned_url.return_value = "https://example.com/s"
            response = api_key_client.get(asset_detail_url(workspace.slug, workspace_level_asset.id))

        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )


@pytest.mark.contract
class TestGenericAssetPatchProjectScope:
    @pytest.mark.django_db
    def test_patch_denied_for_non_project_member(self, api_key_client, workspace, foreign_asset):
        response = api_key_client.patch(
            asset_detail_url(workspace.slug, foreign_asset.id),
            {"is_uploaded": False},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        foreign_asset.refresh_from_db()
        assert foreign_asset.is_uploaded is True

    @pytest.mark.django_db
    def test_patch_allowed_for_project_member(self, api_key_client, workspace, joined_asset):
        response = api_key_client.patch(
            asset_detail_url(workspace.slug, joined_asset.id),
            {"is_uploaded": False},
            format="json",
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        joined_asset.refresh_from_db()
        assert joined_asset.is_uploaded is False


@pytest.mark.contract
class TestGenericAssetPostProjectScope:
    def _payload(self, project_id):
        return {
            "name": "upload.png",
            "type": "image/png",
            "size": 16,
            "project_id": str(project_id),
        }

    @pytest.mark.django_db
    def test_post_denied_for_project_in_another_workspace(self, api_key_client, workspace, other_workspace_project):
        before = FileAsset.objects.count()
        response = api_key_client.post(
            asset_list_url(workspace.slug),
            self._payload(other_workspace_project.id),
            format="json",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert FileAsset.objects.count() == before

    @pytest.mark.django_db
    def test_post_denied_for_project_not_joined(self, api_key_client, workspace, foreign_project):
        before = FileAsset.objects.count()
        response = api_key_client.post(asset_list_url(workspace.slug), self._payload(foreign_project.id), format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert FileAsset.objects.count() == before

    @pytest.mark.django_db
    def test_post_allowed_for_joined_project(self, api_key_client, workspace, joined_project):
        before = FileAsset.objects.count()
        with mock.patch(S3_STORAGE_PATH, autospec=True) as mock_storage:
            mock_storage.return_value.generate_presigned_post.return_value = {"url": "https://x"}
            response = api_key_client.post(
                asset_list_url(workspace.slug), self._payload(joined_project.id), format="json"
            )

        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert FileAsset.objects.count() == before + 1

    @pytest.mark.django_db
    def test_post_denied_when_project_id_omitted(self, api_key_client, workspace):
        """The endpoint creates ISSUE_ATTACHMENT rows, which need a project."""
        before = FileAsset.objects.count()
        payload = {"name": "upload.png", "type": "image/png", "size": 16}
        response = api_key_client.post(asset_list_url(workspace.slug), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert FileAsset.objects.count() == before


@pytest.mark.contract
class TestGenericAssetExternalIdDedup:
    """The external-id dedup lookup runs after project_id validation and is scoped to that project."""

    EXTERNAL = {"external_id": "EXT-1", "external_source": "jira"}

    def _tag(self, asset):
        asset.external_id = self.EXTERNAL["external_id"]
        asset.external_source = self.EXTERNAL["external_source"]
        asset.save(update_fields=["external_id", "external_source"])

    def _post(self, client, workspace, project_id=None):
        payload = {"name": "dedup.png", "type": "image/png", "size": 16, **self.EXTERNAL}
        if project_id is not None:
            payload["project_id"] = str(project_id)
        with mock.patch(S3_STORAGE_PATH, autospec=True) as mock_storage:
            mock_storage.return_value.generate_presigned_post.return_value = {"url": "https://x"}
            return client.post(asset_list_url(workspace.slug), payload, format="json")

    @pytest.mark.django_db
    def test_pair_in_another_project_does_not_match(self, api_key_client, workspace, foreign_asset, joined_project):
        """A pair held in another project is treated as unused: a new asset is created."""
        self._tag(foreign_asset)

        response = self._post(api_key_client, workspace, joined_project.id)

        assert response.status_code == status.HTTP_200_OK, response.data
        assert set(response.data) == {"upload_data", "asset_id", "asset_url"}
        assert response.data["asset_id"] != str(foreign_asset.id)
        assert FileAsset.objects.get(id=response.data["asset_id"]).project_id == joined_project.id

    @pytest.mark.django_db
    def test_pair_in_same_project_returns_conflict(self, api_key_client, workspace, joined_asset, joined_project):
        self._tag(joined_asset)

        response = self._post(api_key_client, workspace, joined_project.id)

        assert response.status_code == status.HTTP_409_CONFLICT, response.data
        assert response.data["asset_id"] == str(joined_asset.id)

    @pytest.mark.django_db
    def test_project_id_required_before_dedup(self, api_key_client, workspace, workspace_level_asset):
        self._tag(workspace_level_asset)

        response = self._post(api_key_client, workspace)

        assert response.status_code == status.HTTP_400_BAD_REQUEST, response.data
        assert "asset_id" not in response.data
