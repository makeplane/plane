# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for project scoping on the workspace-level asset routes (INFRA-501).

``WorkspaceFileAssetEndpoint`` already required an active ``ProjectMember`` of a
project-bound asset's project on get/patch/delete. Four sibling routes over the
same ``FileAsset`` model, behind the same ``level="WORKSPACE"`` authorization,
never received that check:

* ``WorkspaceAssetDownloadEndpoint.get``  -- issues a presigned URL, i.e. the file
* ``DuplicateAssetEndpoint.post``         -- copies the asset into a caller-named project
* ``AssetRestoreEndpoint.post``           -- reverses a deletion the owner performed
* ``AssetCheckEndpoint.get``              -- existence oracle

So a workspace member or GUEST who belonged to none of the asset's projects could
read, copy, undelete and probe another project's uploads. The rule now lives on
the model as ``FileAsset.is_project_accessible_to`` so a route added later cannot
silently omit it, which is how this gap arose in the first place.

Workspace-level assets (workspace logo, user avatar/cover) carry
``project_id=None``, are workspace-scoped by definition, and must stay reachable
by any workspace member -- covered below so the fix cannot over-reach.
"""

from unittest import mock
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import FileAsset, Project, ProjectMember, User, WorkspaceMember

S3_STORAGE_PATH = "plane.app.views.asset.v2.S3Storage"


def download_url(slug, asset_id):
    return f"/api/assets/v2/workspaces/{slug}/download/{asset_id}/"


def check_url(slug, asset_id):
    return f"/api/assets/v2/workspaces/{slug}/check/{asset_id}/"


def restore_url(slug, asset_id):
    return f"/api/assets/v2/workspaces/{slug}/restore/{asset_id}/"


def duplicate_url(slug, asset_id):
    return f"/api/assets/v2/workspaces/{slug}/duplicate-assets/{asset_id}/"


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
def project(db, workspace, create_user):
    """A project in the fixture workspace; ``create_user`` is an active ADMIN."""
    project = Project.objects.create(
        name="Owner Project", identifier="OWN", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(
        project=project, member=create_user, workspace=workspace, role=20, is_active=True
    )
    return project


@pytest.fixture
def outsider_user(db):
    return _user("outsider")


@pytest.fixture
def outsider_client(db, workspace, outsider_user):
    """A workspace GUEST who is a member of no project in the workspace."""
    WorkspaceMember.objects.create(
        workspace=workspace, member=outsider_user, role=5, is_active=True
    )
    client = APIClient()
    client.force_authenticate(user=outsider_user)
    return client


@pytest.fixture
def outsider_project(db, workspace, outsider_user):
    """A project the outsider *does* control -- a duplicate destination."""
    project = Project.objects.create(
        name="Outsider Project", identifier="OUT", workspace=workspace, created_by=outsider_user
    )
    ProjectMember.objects.create(
        project=project, member=outsider_user, workspace=workspace, role=20, is_active=True
    )
    return project


@pytest.fixture
def project_asset(db, workspace, project, create_user):
    """An uploaded issue attachment belonging to ``project``."""
    return FileAsset.objects.create(
        attributes={"name": "secret.pdf", "type": "application/pdf", "size": 1024},
        asset=f"{workspace.id}/secret.pdf",
        size=1024,
        workspace=workspace,
        project=project,
        created_by=create_user,
        entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
        is_uploaded=True,
        storage_metadata={"size": 1024},
    )


@pytest.fixture
def deleted_project_asset(db, project_asset):
    """``project_asset`` after its own project deleted it."""
    project_asset.is_deleted = True
    project_asset.deleted_at = timezone.now()
    project_asset.save(update_fields=["is_deleted", "deleted_at"])
    return project_asset


@pytest.fixture
def workspace_logo_asset(db, workspace, create_user):
    """A workspace-level asset -- ``project_id`` is NULL, so no project gate applies."""
    return FileAsset.objects.create(
        attributes={"name": "logo.png", "type": "image/png", "size": 256},
        asset=f"{workspace.id}/logo.png",
        size=256,
        workspace=workspace,
        created_by=create_user,
        entity_type=FileAsset.EntityTypeContext.WORKSPACE_LOGO,
        is_uploaded=True,
        storage_metadata={"size": 256},
    )


@pytest.mark.contract
class TestWorkspaceAssetDownloadProjectScope:
    @pytest.mark.django_db
    def test_download_denied_for_non_project_member(self, outsider_client, workspace, project_asset):
        """A non-member must not be handed a presigned URL for the file."""
        with mock.patch(S3_STORAGE_PATH) as mock_storage:
            # An explicit string, so a regression here fails the assertion rather
            # than feeding a MagicMock into response rendering.
            mock_storage.return_value.generate_presigned_url.return_value = "https://example.com/s"
            response = outsider_client.get(download_url(workspace.slug, project_asset.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        mock_storage.return_value.generate_presigned_url.assert_not_called()

    @pytest.mark.django_db
    def test_download_allowed_for_project_member(self, session_client, workspace, project_asset):
        with mock.patch(S3_STORAGE_PATH) as mock_storage:
            mock_storage.return_value.generate_presigned_url.return_value = "https://example.com/s"
            response = session_client.get(download_url(workspace.slug, project_asset.id))

        assert response.status_code == status.HTTP_302_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_download_workspace_level_asset_still_allowed(
        self, outsider_client, workspace, workspace_logo_asset
    ):
        """project_id is NULL, so workspace membership alone must remain sufficient."""
        with mock.patch(S3_STORAGE_PATH) as mock_storage:
            mock_storage.return_value.generate_presigned_url.return_value = "https://example.com/s"
            response = outsider_client.get(download_url(workspace.slug, workspace_logo_asset.id))

        assert response.status_code == status.HTTP_302_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )


@pytest.mark.contract
class TestAssetCheckProjectScope:
    @pytest.mark.django_db
    def test_check_does_not_disclose_existence_to_non_project_member(
        self, outsider_client, workspace, project_asset
    ):
        """The oracle must answer False rather than confirming a foreign asset."""
        response = outsider_client.get(check_url(workspace.slug, project_asset.id))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["exists"] is False, (
            "existence of another project's asset was disclosed to a non-member"
        )

    @pytest.mark.django_db
    def test_check_reports_existence_to_project_member(self, session_client, workspace, project_asset):
        response = session_client.get(check_url(workspace.slug, project_asset.id))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["exists"] is True


@pytest.mark.contract
class TestAssetRestoreProjectScope:
    @pytest.mark.django_db
    def test_restore_denied_for_non_project_member(
        self, outsider_client, workspace, deleted_project_asset
    ):
        """A non-member must not be able to reverse the owner's deletion."""
        response = outsider_client.post(restore_url(workspace.slug, deleted_project_asset.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        deleted_project_asset.refresh_from_db()
        assert deleted_project_asset.is_deleted is True
        assert deleted_project_asset.deleted_at is not None

    @pytest.mark.django_db
    def test_restore_allowed_for_project_member(
        self, session_client, workspace, deleted_project_asset
    ):
        response = session_client.post(restore_url(workspace.slug, deleted_project_asset.id))

        assert response.status_code == status.HTTP_204_NO_CONTENT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        deleted_project_asset.refresh_from_db()
        assert deleted_project_asset.is_deleted is False


@pytest.mark.contract
class TestDuplicateAssetProjectScope:
    @pytest.mark.django_db
    def test_duplicate_denied_when_source_not_accessible(
        self, outsider_client, workspace, project_asset, outsider_project
    ):
        """The worst of the four: a permanent copy into a project the caller owns."""
        before = FileAsset.objects.count()
        with mock.patch(S3_STORAGE_PATH) as mock_storage:
            response = outsider_client.post(
                duplicate_url(workspace.slug, project_asset.id),
                {
                    "entity_type": FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                    "project_id": str(outsider_project.id),
                },
                format="json",
            )

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        mock_storage.return_value.copy_object.assert_not_called()
        assert FileAsset.objects.count() == before, "a copy of a foreign asset was created"

    @pytest.mark.django_db
    def test_duplicate_denied_when_destination_project_not_joined(
        self, session_client, workspace, project_asset, outsider_project
    ):
        """Source is reachable, destination is not: the body project_id needs its own check."""
        before = FileAsset.objects.count()
        with mock.patch(S3_STORAGE_PATH) as mock_storage:
            response = session_client.post(
                duplicate_url(workspace.slug, project_asset.id),
                {
                    "entity_type": FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                    "project_id": str(outsider_project.id),
                },
                format="json",
            )

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        mock_storage.return_value.copy_object.assert_not_called()
        assert FileAsset.objects.count() == before

    @pytest.mark.django_db
    def test_duplicate_allowed_within_own_project(self, session_client, workspace, project, project_asset):
        before = FileAsset.objects.count()
        with mock.patch(S3_STORAGE_PATH):
            response = session_client.post(
                duplicate_url(workspace.slug, project_asset.id),
                {
                    "entity_type": FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                    "project_id": str(project.id),
                },
                format="json",
            )

        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert FileAsset.objects.count() == before + 1
