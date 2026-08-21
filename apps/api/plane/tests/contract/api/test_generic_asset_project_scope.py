# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for project scoping on the external-API ``GenericAssetEndpoint`` (INFRA-501).

The endpoint authorizes with ``WorkspaceUserPermission`` -- any active member of
the URL workspace, any role, including a GUEST who belongs to no project -- and
then resolves the asset on the workspace alone. The app surface enforces an
active ``ProjectMember`` of the asset's project for the same model; this surface
never did, so:

* ``get``   discloses a project-bound asset's existence and upload state, and
            (once the presigned stage is reachable) its contents
* ``patch`` flips ``is_uploaded``, which gates every download path, so an
            attachment can be made to vanish for the project that owns it
* ``post``  stored a body-supplied ``project_id`` unvalidated, so a row could be
            created in one workspace pointing at a project in another

Both surfaces now share one rule, ``FileAsset.is_project_accessible_to``.

Workspace-level assets (``project_id=None``) must stay reachable by any
workspace member, and a member of the asset's project must keep full access --
both covered here so the fix cannot over-reach.

The ``get``/``post`` positive paths patch ``S3Storage`` with ``autospec=True``
deliberately: these call sites passed a keyword the constructor does not accept,
which raised ``TypeError`` and turned the routes into an unconditional 500 for
every caller. An autospec'd mock validates the call signature, so it fails if
that regresses; a plain mock would swallow it.
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
    """A project in the caller's workspace that the caller is NOT a member of.

    ``create_user`` (who holds the API token) is a workspace ADMIN here, which is
    the point: workspace role does not substitute for project membership, exactly
    as the app surface already behaves.
    """
    WorkspaceMember.objects.create(
        workspace=workspace, member=project_owner, role=20, is_active=True
    )
    project = Project.objects.create(
        name="Foreign Project", identifier="FGN", workspace=workspace, created_by=project_owner
    )
    ProjectMember.objects.create(
        project=project, member=project_owner, workspace=workspace, role=20, is_active=True
    )
    return project


@pytest.fixture
def joined_project(db, workspace, create_user):
    """A project the token holder is an active member of."""
    project = Project.objects.create(
        name="Joined Project", identifier="JND", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(
        project=project, member=create_user, workspace=workspace, role=20, is_active=True
    )
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
    """A project in an unrelated workspace, for the cross-tenant create case."""
    owner = _user("tenant")
    other = Workspace.objects.create(
        name="Other Workspace", owner=owner, slug=f"other-{uuid4().hex[:8]}"
    )
    WorkspaceMember.objects.create(workspace=other, member=owner, role=20, is_active=True)
    project = Project.objects.create(
        name="Other Project", identifier="OTH", workspace=other, created_by=owner
    )
    ProjectMember.objects.create(
        project=project, member=owner, workspace=other, role=20, is_active=True
    )
    return project


@pytest.mark.contract
class TestGenericAssetGetProjectScope:
    @pytest.mark.django_db
    def test_get_denied_for_non_project_member(self, api_key_client, workspace, foreign_asset):
        with mock.patch(S3_STORAGE_PATH) as mock_storage:
            # Return a real string, not the default MagicMock: if this guard ever
            # regresses, the handler puts this value into a DRF Response, and JSON
            # -encoding a MagicMock recurses until the process is OOM-killed. A
            # regression must fail this assertion, not take the test runner down.
            mock_storage.return_value.generate_presigned_url.return_value = "https://example.com/s"
            response = api_key_client.get(asset_detail_url(workspace.slug, foreign_asset.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        mock_storage.return_value.generate_presigned_url.assert_not_called()

    @pytest.mark.django_db
    def test_get_does_not_leak_upload_state_of_foreign_asset(
        self, api_key_client, workspace, foreign_asset
    ):
        """A not-yet-uploaded foreign asset must 403, not answer 400 'not uploaded'."""
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
    def test_get_allowed_for_workspace_level_asset(
        self, api_key_client, workspace, workspace_level_asset
    ):
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
        """is_uploaded gates every download path, so this is a takedown primitive."""
        response = api_key_client.patch(
            asset_detail_url(workspace.slug, foreign_asset.id),
            {"is_uploaded": False},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        foreign_asset.refresh_from_db()
        assert foreign_asset.is_uploaded is True, "a foreign project's attachment was taken down"

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
            "name": "planted.png",
            "type": "image/png",
            "size": 16,
            "project_id": str(project_id),
        }

    @pytest.mark.django_db
    def test_post_denied_for_project_in_another_workspace(
        self, api_key_client, workspace, other_workspace_project
    ):
        """The cross-tenant case: a row in workspace A pointing at a project of B."""
        before = FileAsset.objects.count()
        response = api_key_client.post(
            asset_list_url(workspace.slug),
            self._payload(other_workspace_project.id),
            format="json",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert FileAsset.objects.count() == before, "a cross-workspace asset row was created"

    @pytest.mark.django_db
    def test_post_denied_for_project_not_joined(self, api_key_client, workspace, foreign_project):
        before = FileAsset.objects.count()
        response = api_key_client.post(
            asset_list_url(workspace.slug), self._payload(foreign_project.id), format="json"
        )

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


@pytest.mark.contract
class TestGenericAssetExternalIdDedupDisclosure:
    """The 409 dedup echo must not hand out a foreign project's asset identifiers.

    The dedup lookup matches on workspace + external_source + external_id, with no
    project scoping, and the 409 body carries ``asset_id`` and ``asset_url``. That
    url embeds the owning project and issue ids for an attachment. Since knowing
    the asset UUID is the precondition for every asset-scoped attack on this
    surface, echoing a match the caller cannot access supplies exactly what the
    other guards in this module exist to make useless.
    """

    EXTERNAL = {"external_id": "EXT-1", "external_source": "jira"}

    def _payload(self, project_id=None):
        payload = {"name": "dedup.png", "type": "image/png", "size": 16, **self.EXTERNAL}
        if project_id is not None:
            payload["project_id"] = str(project_id)
        return payload

    @pytest.mark.django_db
    def test_dedup_does_not_disclose_foreign_asset_identifiers(
        self, api_key_client, workspace, foreign_asset, joined_project
    ):
        """404, not 403: a 403 would still confirm the external id pair is taken."""
        foreign_asset.external_id = self.EXTERNAL["external_id"]
        foreign_asset.external_source = self.EXTERNAL["external_source"]
        foreign_asset.save(update_fields=["external_id", "external_source"])

        response = api_key_client.post(
            asset_list_url(workspace.slug), self._payload(joined_project.id), format="json"
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        body = str(getattr(response, "data", ""))
        assert str(foreign_asset.id) not in body, "the foreign asset id was disclosed"
        assert str(foreign_asset.project_id) not in body, "the foreign project id was disclosed"

    @pytest.mark.django_db
    def test_dedup_does_not_disclose_when_project_id_is_omitted(
        self, api_key_client, workspace, foreign_asset
    ):
        """Omitting project_id skips the create-path validation, so this branch is the only gate."""
        foreign_asset.external_id = self.EXTERNAL["external_id"]
        foreign_asset.external_source = self.EXTERNAL["external_source"]
        foreign_asset.save(update_fields=["external_id", "external_source"])

        response = api_key_client.post(asset_list_url(workspace.slug), self._payload(), format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert str(foreign_asset.id) not in str(getattr(response, "data", ""))

    @pytest.mark.django_db
    def test_dedup_still_echoes_an_accessible_asset(
        self, api_key_client, workspace, joined_asset, joined_project
    ):
        """Dedup must keep working for a caller who is a member of the match's project."""
        joined_asset.external_id = self.EXTERNAL["external_id"]
        joined_asset.external_source = self.EXTERNAL["external_source"]
        joined_asset.save(update_fields=["external_id", "external_source"])

        response = api_key_client.post(
            asset_list_url(workspace.slug), self._payload(joined_project.id), format="json"
        )

        assert response.status_code == status.HTTP_409_CONFLICT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert response.data["asset_id"] == str(joined_asset.id)

    @pytest.mark.django_db
    def test_dedup_still_echoes_a_workspace_level_asset(
        self, api_key_client, workspace, workspace_level_asset
    ):
        """project_id is NULL, so there is no project dimension to gate on."""
        workspace_level_asset.external_id = self.EXTERNAL["external_id"]
        workspace_level_asset.external_source = self.EXTERNAL["external_source"]
        workspace_level_asset.save(update_fields=["external_id", "external_source"])

        response = api_key_client.post(asset_list_url(workspace.slug), self._payload(), format="json")

        assert response.status_code == status.HTTP_409_CONFLICT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert response.data["asset_id"] == str(workspace_level_asset.id)
