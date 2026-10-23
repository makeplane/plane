# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for role rules on asset confirm/update/delete/restore.

The generic asset routes follow the rule of the entity an asset belongs to: the
workspace logo is workspace-admin-only, a project cover is project-admin-only, an
issue attachment may be changed by a project admin or its uploader, and any other
project asset by a member, an admin or its uploader. The uploader must still be an
active member of the asset's project. The legacy routes keyed by asset path follow
the same rules.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import FileAsset, ProjectMember
from plane.tests.factories import ProjectFactory, ProjectMemberFactory, UserFactory, WorkspaceMemberFactory

ADMIN, MEMBER, GUEST = 20, 15, 5


def _user(workspace, project=None, *, workspace_role, project_role=None):
    user = UserFactory()
    WorkspaceMemberFactory(workspace=workspace, member=user, role=workspace_role)
    if project is not None:
        ProjectMemberFactory(project=project, member=user, role=project_role or workspace_role)
    return user


def _client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _asset(workspace, created_by, entity_type, project=None, is_uploaded=True):
    asset = FileAsset(
        attributes={"name": "file.png", "type": "image/png", "size": 256},
        asset=f"{workspace.id}/{uuid4().hex}-file.png",
        size=256,
        workspace=workspace,
        project=project,
        entity_type=entity_type,
        is_uploaded=is_uploaded,
        storage_metadata={"size": 256},
    )
    # Outside a request BaseModel.save() clears created_by unless it is passed here
    asset.save(created_by_id=created_by.id)
    return asset


def _project_url(workspace, project, asset):
    return f"/api/assets/v2/workspaces/{workspace.slug}/projects/{project.id}/{asset.id}/"


def _workspace_url(workspace, asset):
    return f"/api/assets/v2/workspaces/{workspace.slug}/{asset.id}/"


def _legacy_url(workspace, asset):
    return f"/api/workspaces/file-assets/{workspace.id}/{asset.asset.name.split('/', 1)[1]}/"


def _restore_url(workspace, asset):
    return f"/api/assets/v2/workspaces/{workspace.slug}/restore/{asset.id}/"


def _bulk_url(workspace, project):
    return f"/api/assets/v2/workspaces/{workspace.slug}/projects/{project.id}/{project.id}/bulk/"


@pytest.fixture
def project(db, workspace, create_user):
    project = ProjectFactory(workspace=workspace, identifier="AR")
    ProjectMemberFactory(project=project, member=create_user, role=ADMIN)
    return project


@pytest.fixture
def attachment(workspace, project, create_user):
    return _asset(workspace, create_user, FileAsset.EntityTypeContext.ISSUE_ATTACHMENT, project)


@pytest.mark.contract
@pytest.mark.django_db
class TestProjectAssetRoleScope:
    @pytest.mark.parametrize("role", [GUEST, MEMBER])
    def test_attachment_delete_requires_admin_or_uploader(self, workspace, project, attachment, role):
        client = _client(_user(workspace, project, workspace_role=role))
        for url in (_project_url(workspace, project, attachment), _workspace_url(workspace, attachment)):
            response = client.delete(url)
            assert response.status_code == status.HTTP_403_FORBIDDEN
        attachment.refresh_from_db()
        assert attachment.is_deleted is False

    def test_attachment_update_requires_admin_or_uploader(self, workspace, project, attachment):
        client = _client(_user(workspace, project, workspace_role=GUEST))
        response = client.patch(
            _project_url(workspace, project, attachment), {"attributes": {"name": "x.png"}}, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        attachment.refresh_from_db()
        assert attachment.attributes["name"] == "file.png"

    def test_project_admin_can_delete_any_attachment(self, workspace, project):
        uploader = _user(workspace, project, workspace_role=MEMBER)
        attachment = _asset(workspace, uploader, FileAsset.EntityTypeContext.ISSUE_ATTACHMENT, project)
        admin = _user(workspace, project, workspace_role=MEMBER, project_role=ADMIN)
        response = _client(admin).delete(_project_url(workspace, project, attachment))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not FileAsset.objects.filter(id=attachment.id).exists()

    def test_attachment_restore_requires_admin_or_uploader(self, session_client, workspace, project):
        uploader = _user(workspace, project, workspace_role=GUEST)
        attachment = _asset(workspace, uploader, FileAsset.EntityTypeContext.ISSUE_ATTACHMENT, project)
        restore_url = f"/api/assets/v2/workspaces/{workspace.slug}/restore/{attachment.id}/"
        response = session_client.delete(_project_url(workspace, project, attachment))
        assert response.status_code == status.HTTP_204_NO_CONTENT

        response = _client(_user(workspace, project, workspace_role=GUEST)).post(restore_url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert FileAsset.all_objects.get(id=attachment.id).is_deleted is True

        response = _client(uploader).post(restore_url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert FileAsset.all_objects.get(id=attachment.id).is_deleted is False

    @pytest.mark.parametrize("entity_type", ["ISSUE_ATTACHMENT", "ISSUE_DESCRIPTION"])
    def test_guest_uploader_can_confirm_and_delete_own_asset(self, workspace, project, entity_type):
        guest = _user(workspace, project, workspace_role=GUEST)
        asset = _asset(workspace, guest, entity_type, project, is_uploaded=False)
        client = _client(guest)
        url = _project_url(workspace, project, asset)
        response = client.patch(url, {"attributes": {"name": "own.png"}}, format="json")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        asset.refresh_from_db()
        assert asset.is_uploaded is True
        response = client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT

    @pytest.mark.parametrize("role,expected", [(GUEST, 403), (MEMBER, 204)])
    def test_description_image_delete_requires_member(self, workspace, project, create_user, role, expected):
        image = _asset(workspace, create_user, FileAsset.EntityTypeContext.ISSUE_DESCRIPTION, project)
        client = _client(_user(workspace, project, workspace_role=role))
        response = client.delete(_project_url(workspace, project, image))
        assert response.status_code == expected


@pytest.mark.contract
@pytest.mark.django_db
class TestAssetUploaderAndLegacyRouteScope:
    def test_legacy_delete_and_restore_require_admin_or_uploader(self, workspace, project):
        uploader = _user(workspace, project, workspace_role=MEMBER)
        attachment = _asset(workspace, uploader, FileAsset.EntityTypeContext.ISSUE_ATTACHMENT, project)
        other = _client(_user(workspace, project, workspace_role=MEMBER))
        url = _legacy_url(workspace, attachment)

        assert other.delete(url).status_code == status.HTTP_403_FORBIDDEN
        attachment.refresh_from_db()
        assert attachment.is_deleted is False
        assert _client(uploader).delete(url).status_code == status.HTTP_204_NO_CONTENT

        assert other.post(f"{url}restore/").status_code == status.HTTP_403_FORBIDDEN
        attachment.refresh_from_db()
        assert attachment.is_deleted is True
        assert _client(uploader).post(f"{url}restore/").status_code == status.HTTP_204_NO_CONTENT
        attachment.refresh_from_db()
        assert attachment.is_deleted is False

    def test_uploader_needs_active_project_membership(self, session_client, workspace, project):
        uploader = _user(workspace, project, workspace_role=MEMBER)
        attachment = _asset(workspace, uploader, FileAsset.EntityTypeContext.ISSUE_ATTACHMENT, project)
        ProjectMember.objects.filter(project=project, member=uploader).update(is_active=False)
        client = _client(uploader)
        legacy_url = _legacy_url(workspace, attachment)

        for url in (legacy_url, _workspace_url(workspace, attachment)):
            assert client.delete(url).status_code == status.HTTP_403_FORBIDDEN
        attachment.refresh_from_db()
        assert attachment.is_deleted is False

        assert session_client.delete(legacy_url).status_code == status.HTTP_204_NO_CONTENT
        for url in (f"{legacy_url}restore/", _restore_url(workspace, attachment)):
            assert client.post(url).status_code == status.HTTP_403_FORBIDDEN
        attachment.refresh_from_db()
        assert attachment.is_deleted is True


@pytest.mark.contract
@pytest.mark.django_db
class TestBrandingAssetRoleScope:
    @pytest.mark.parametrize("role", [GUEST, MEMBER])
    def test_workspace_logo_change_requires_workspace_admin(self, workspace, create_user, role):
        current = _asset(workspace, create_user, FileAsset.EntityTypeContext.WORKSPACE_LOGO)
        workspace.logo_asset_id = current.id
        workspace.save()
        user = _user(workspace, workspace_role=role)
        replacement = _asset(workspace, user, FileAsset.EntityTypeContext.WORKSPACE_LOGO)
        client = _client(user)

        response = client.patch(_workspace_url(workspace, replacement))

        assert response.status_code == status.HTTP_403_FORBIDDEN
        response = client.delete(_workspace_url(workspace, current))
        assert response.status_code == status.HTTP_403_FORBIDDEN
        workspace.refresh_from_db()
        assert workspace.logo_asset_id == current.id

    def test_workspace_admin_can_set_workspace_logo(self, session_client, workspace, create_user):
        logo = _asset(workspace, create_user, FileAsset.EntityTypeContext.WORKSPACE_LOGO)
        response = session_client.patch(_workspace_url(workspace, logo))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        workspace.refresh_from_db()
        assert workspace.logo_asset_id == logo.id

    @pytest.mark.parametrize("role", [GUEST, MEMBER])
    def test_project_cover_change_requires_project_admin(self, workspace, project, role):
        user = _user(workspace, project, workspace_role=role)
        cover = _asset(workspace, user, FileAsset.EntityTypeContext.PROJECT_COVER, project)
        unassigned = _asset(workspace, user, FileAsset.EntityTypeContext.PROJECT_COVER)
        client = _client(user)

        response = client.patch(_workspace_url(workspace, cover))

        assert response.status_code == status.HTTP_403_FORBIDDEN
        response = client.post(_bulk_url(workspace, project), {"asset_ids": [str(unassigned.id)]}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        project.refresh_from_db()
        assert project.cover_image_asset_id is None

    def test_project_admin_can_set_project_cover(self, session_client, workspace, project, create_user):
        cover = _asset(workspace, create_user, FileAsset.EntityTypeContext.PROJECT_COVER, project)
        response = session_client.patch(_workspace_url(workspace, cover))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        project.refresh_from_db()
        assert project.cover_image_asset_id == cover.id

        unassigned = _asset(workspace, create_user, FileAsset.EntityTypeContext.PROJECT_COVER)
        response = session_client.post(
            _bulk_url(workspace, project), {"asset_ids": [str(unassigned.id)]}, format="json"
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        project.refresh_from_db()
        assert project.cover_image_asset_id == unassigned.id

    def test_member_can_confirm_unassigned_cover_upload(self, workspace):
        """A cover uploaded before its project exists is confirmed by its uploader."""
        user = _user(workspace, workspace_role=MEMBER)
        cover = _asset(workspace, user, FileAsset.EntityTypeContext.PROJECT_COVER, is_uploaded=False)
        response = _client(user).patch(_workspace_url(workspace, cover))
        assert response.status_code == status.HTTP_204_NO_CONTENT
