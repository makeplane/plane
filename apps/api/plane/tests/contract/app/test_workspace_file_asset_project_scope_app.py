# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for ``WorkspaceFileAssetEndpoint`` project-scoping.

Regression coverage for GHSA-h7mc-p9mm-2r4w / GHSA-cjph-cgm5-8pw8 (WEB-8066),
an incomplete fix of the GHSA-qw87 asset-IDOR cluster.

The endpoint is authorized at the WORKSPACE level, so any workspace member or
guest previously reached ``get``/``patch``/``delete`` for a project-bound asset
(issue attachment / description, comment description, page description) even
when they were not a member of that asset's project. The fix requires an active
``ProjectMember`` of ``asset.project_id`` for project-bound assets, while
leaving workspace-level assets (WORKSPACE_LOGO, USER_AVATAR, USER_COVER, whose
``project_id`` is NULL) accessible to any workspace member.
"""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    FileAsset,
    Project,
    ProjectMember,
    User,
    WorkspaceMember,
)

S3_STORAGE_PATH = "plane.app.views.asset.v2.S3Storage"


@pytest.fixture
def project(db, workspace, create_user):
    """A project in the fixture workspace; ``create_user`` is an active member."""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project, member=create_user, workspace=workspace, role=20
    )
    return project


@pytest.fixture
def outsider_user(db):
    """A user who is a workspace member but NOT a member of ``project``."""
    unique_id = uuid4().hex[:8]
    user = User.objects.create(
        email=f"outsider-{unique_id}@plane.so",
        username=f"outsider_{unique_id}",
        first_name="Outsider",
        last_name="User",
    )
    user.set_password("test-password")
    user.save()
    return user


@pytest.fixture
def outsider_client(db, workspace, outsider_user):
    """Session client for a workspace member who is not in ``project``."""
    WorkspaceMember.objects.create(
        workspace=workspace, member=outsider_user, role=15
    )
    client = APIClient()
    client.force_authenticate(user=outsider_user)
    return client


@pytest.fixture
def project_asset(db, workspace, project, create_user):
    """An uploaded issue attachment that belongs to ``project``."""
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
def workspace_logo_asset(db, workspace, create_user):
    """A workspace-level asset (project_id is NULL) — exempt from project scope."""
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


def detail_url(slug, asset_id):
    return f"/api/assets/v2/workspaces/{slug}/{asset_id}/"


@pytest.mark.contract
class TestWorkspaceFileAssetProjectScope:
    """A workspace member who is not in the asset's project must be blocked."""

    @pytest.mark.django_db
    def test_get_project_asset_denied_for_non_project_member(
        self, outsider_client, workspace, project_asset
    ):
        """GET on a project asset by a non-project-member must 403, not mint a
        presigned download URL."""
        url = detail_url(workspace.slug, project_asset.id)

        with mock.patch(S3_STORAGE_PATH) as mock_storage:
            mock_storage.return_value.generate_presigned_url.return_value = (
                "https://signed.example/download"
            )
            response = outsider_client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        mock_storage.return_value.generate_presigned_url.assert_not_called()

    @pytest.mark.django_db
    def test_patch_project_asset_denied_for_non_project_member(
        self, outsider_client, workspace, project_asset
    ):
        """PATCH on a project asset by a non-project-member must 403 and leave
        the asset untouched."""
        url = detail_url(workspace.slug, project_asset.id)
        project_asset.is_uploaded = False
        project_asset.save(update_fields=["is_uploaded"])

        response = outsider_client.patch(
            url, {"attributes": {"name": "hacked.pdf"}}, format="json"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        project_asset.refresh_from_db()
        assert project_asset.is_uploaded is False
        assert project_asset.attributes.get("name") == "secret.pdf"

    @pytest.mark.django_db
    def test_delete_project_asset_denied_for_non_project_member(
        self, outsider_client, workspace, project_asset
    ):
        """DELETE on a project asset by a non-project-member must 403 and must
        not soft-delete the asset."""
        url = detail_url(workspace.slug, project_asset.id)

        response = outsider_client.delete(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        project_asset.refresh_from_db()
        assert project_asset.is_deleted is False

    @pytest.mark.django_db
    def test_get_project_asset_allowed_for_project_member(
        self, session_client, workspace, project_asset
    ):
        """Positive control: an active project member can still download the
        asset, so the fix does not over-block legitimate callers."""
        url = detail_url(workspace.slug, project_asset.id)

        with mock.patch(S3_STORAGE_PATH) as mock_storage:
            mock_storage.return_value.generate_presigned_url.return_value = (
                "https://signed.example/download"
            )
            response = session_client.get(url)

        assert response.status_code == status.HTTP_302_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        mock_storage.return_value.generate_presigned_url.assert_called_once()

    @pytest.mark.django_db
    def test_get_workspace_level_asset_allowed_for_non_project_member(
        self, outsider_client, workspace, workspace_logo_asset
    ):
        """Exemption control: a workspace-level asset (project_id NULL) stays
        accessible to any workspace member."""
        url = detail_url(workspace.slug, workspace_logo_asset.id)

        with mock.patch(S3_STORAGE_PATH) as mock_storage:
            mock_storage.return_value.generate_presigned_url.return_value = (
                "https://signed.example/download"
            )
            response = outsider_client.get(url)

        assert response.status_code == status.HTTP_302_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        mock_storage.return_value.generate_presigned_url.assert_called_once()
