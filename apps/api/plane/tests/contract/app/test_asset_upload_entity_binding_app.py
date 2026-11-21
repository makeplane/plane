# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the entity an asset is bound to at upload, bulk-bind and duplicate time.

An asset always belongs to the URL workspace. The issue, comment or page it is
bound to must belong to that workspace and to the URL project (or, on the
workspace route, to a project the caller is an active member of), and a user
asset can only be bound to the caller. An empty identifier leaves the asset
unbound, which is how uploads made before the entity exists work.
"""

from unittest.mock import patch
from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import FileAsset, Issue, ProjectMember, Workspace
from plane.tests.factories import ProjectFactory, UserFactory

ENTITY = FileAsset.EntityTypeContext


@pytest.fixture
def project(db, workspace, create_user):
    project = ProjectFactory(workspace=workspace, identifier="OWN")
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def issue(project):
    return Issue.objects.create(name="Own issue", project=project, workspace=project.workspace)


@pytest.fixture
def other_project_issue(workspace):
    """An issue of the same workspace, in a project ``create_user`` is not a member of."""
    project = ProjectFactory(workspace=workspace, identifier="OTH")
    return Issue.objects.create(name="Other project issue", project=project, workspace=workspace)


@pytest.fixture
def foreign_issue(db):
    """An issue of another workspace."""
    other_workspace = Workspace.objects.create(name="Other", slug="other-ws", owner=UserFactory())
    project = ProjectFactory(workspace=other_workspace, identifier="FOR")
    return Issue.objects.create(name="Foreign issue", project=project, workspace=other_workspace)


def _urls(workspace, project):
    return {
        "workspace": f"/api/assets/v2/workspaces/{workspace.slug}/",
        "project": f"/api/assets/v2/workspaces/{workspace.slug}/projects/{project.id}/",
    }


def _upload(client, url, entity_type, entity_identifier):
    payload = {
        "name": "image.png",
        "type": "image/png",
        "size": 100,
        "entity_type": entity_type,
        "entity_identifier": str(entity_identifier),
    }
    with patch("plane.app.views.asset.v2.S3Storage") as storage:
        storage.return_value.generate_presigned_post.return_value = {}
        return client.post(url, payload, format="json")


def _own_asset(workspace, user, entity_type, is_uploaded=False):
    asset = FileAsset(
        attributes={"name": "image.png", "type": "image/png", "size": 100},
        asset=f"{workspace.id}/{uuid4().hex}-image.png",
        size=100,
        workspace=workspace,
        entity_type=entity_type,
        is_uploaded=is_uploaded,
    )
    # Outside a request BaseModel.save() clears created_by unless it is passed here
    asset.save(created_by_id=user.id)
    return asset


@pytest.mark.contract
@pytest.mark.django_db
class TestAssetUploadEntityBinding:
    @pytest.mark.parametrize("route", ["workspace", "project"])
    @pytest.mark.parametrize("issue_fixture", ["foreign_issue", "other_project_issue"])
    def test_upload_rejects_issue_outside_the_callers_scope(
        self, request, session_client, workspace, project, route, issue_fixture
    ):
        out_of_scope_issue = request.getfixturevalue(issue_fixture)

        response = _upload(
            session_client, _urls(workspace, project)[route], ENTITY.ISSUE_ATTACHMENT, out_of_scope_issue.id
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST, response.data
        assert not FileAsset.objects.exists()

    @pytest.mark.parametrize("route", ["workspace", "project"])
    def test_workspace_logo_upload_stays_in_url_workspace(
        self, session_client, workspace, project, foreign_issue, route
    ):
        response = _upload(
            session_client, _urls(workspace, project)[route], ENTITY.WORKSPACE_LOGO, foreign_issue.workspace_id
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        assert FileAsset.objects.get(id=response.data["asset_id"]).workspace_id == workspace.id

    def test_upload_rejects_another_users_id(self, session_client, workspace, project):
        response = _upload(session_client, _urls(workspace, project)["workspace"], ENTITY.USER_AVATAR, UserFactory().id)

        assert response.status_code == status.HTTP_400_BAD_REQUEST, response.data
        assert not FileAsset.objects.exists()

    @pytest.mark.parametrize("route", ["workspace", "project"])
    def test_upload_binds_to_issue_of_own_project(self, session_client, workspace, project, issue, route):
        response = _upload(session_client, _urls(workspace, project)[route], ENTITY.ISSUE_DESCRIPTION, issue.id)

        assert response.status_code == status.HTTP_200_OK, response.data
        assert FileAsset.objects.get(id=response.data["asset_id"]).issue_id == issue.id

    def test_upload_without_identifier_stays_unbound(self, session_client, workspace, project):
        response = _upload(session_client, _urls(workspace, project)["project"], ENTITY.ISSUE_DESCRIPTION, "")

        assert response.status_code == status.HTTP_200_OK, response.data
        assert FileAsset.objects.get(id=response.data["asset_id"]).issue_id is None

    def test_bulk_bind_only_binds_to_issue_of_url_project(
        self, session_client, workspace, project, create_user, issue, other_project_issue
    ):
        asset = _own_asset(workspace, create_user, ENTITY.ISSUE_DESCRIPTION)
        url = f"/api/assets/v2/workspaces/{workspace.slug}/projects/{project.id}/{{}}/bulk/"
        payload = {"asset_ids": [str(asset.id)]}

        response = session_client.post(url.format(other_project_issue.id), payload, format="json")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        asset.refresh_from_db()
        assert asset.issue_id is None

        response = session_client.post(url.format(issue.id), payload, format="json")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        asset.refresh_from_db()
        assert asset.issue_id == issue.id

    def test_duplicate_only_binds_to_issue_of_destination_project(
        self, session_client, workspace, project, create_user, issue, other_project_issue
    ):
        source = _own_asset(workspace, create_user, ENTITY.ISSUE_DESCRIPTION, is_uploaded=True)
        url = f"/api/assets/v2/workspaces/{workspace.slug}/duplicate-assets/{source.id}/"

        def duplicate(entity_id):
            payload = {
                "entity_type": ENTITY.ISSUE_DESCRIPTION,
                "entity_id": str(entity_id),
                "project_id": str(project.id),
            }
            with patch("plane.app.views.asset.v2.S3Storage"):
                return session_client.post(url, payload, format="json")

        response = duplicate(other_project_issue.id)
        assert response.status_code == status.HTTP_400_BAD_REQUEST, response.data
        assert FileAsset.objects.count() == 1

        response = duplicate(issue.id)
        assert response.status_code == status.HTTP_200_OK, response.data
        assert FileAsset.objects.get(id=response.data["asset_id"]).issue_id == issue.id
