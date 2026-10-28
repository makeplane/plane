# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for project work item types endpoints and IssueSerializer.type_id project scoping."""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import APIToken, Issue, IssueType, Project, ProjectMember, State, User, Workspace, WorkspaceMember
from plane.db.models.issue_type import ProjectIssueType

ADMIN, MEMBER, GUEST = 20, 15, 5

WORK_ITEM_TYPE_KEYS = {
    "id",
    "name",
    "description",
    "logo_props",
    "is_epic",
    "is_default",
    "is_active",
    "level",
    "project_ids",
    "external_source",
    "external_id",
    "workspace",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    "deleted_at",
}


@pytest.fixture(autouse=True)
def _no_side_effects(db):
    with (
        mock.patch("plane.api.views.issue.issue_activity"),
        mock.patch("plane.api.views.issue.model_activity"),
        mock.patch("plane.api.views.issue.base_host", return_value="http://testserver"),
    ):
        yield


def _make_user(workspace, project, ws_role, project_role=None):
    uid = uuid4().hex[:8]
    user = User.objects.create(email=f"u-{uid}@plane.so", username=f"u_{uid}")
    user.set_password("test-password")
    user.save()
    if ws_role is not None:
        WorkspaceMember.objects.create(workspace=workspace, member=user, role=ws_role, is_active=True)
    if project_role is not None and project is not None:
        ProjectMember.objects.create(
            project=project,
            member=user,
            workspace=workspace,
            role=project_role,
            is_active=True,
        )
    return user


def _client_for(user):
    token = APIToken.objects.create(user=user, label="t", token=f"tok-{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


@pytest.fixture
def project(db, workspace, create_user):
    proj = Project.objects.create(
        name="Types Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
        is_issue_type_enabled=True,
    )
    ProjectMember.objects.create(project=proj, member=create_user, workspace=workspace, role=ADMIN, is_active=True)
    State.objects.create(name="Todo", color="#000000", group="backlog", default=True, project=proj, workspace=workspace)
    return proj


@pytest.fixture
def sibling_project(db, workspace, create_user):
    proj = Project.objects.create(
        name="Sibling Project",
        identifier="SIB",
        workspace=workspace,
        created_by=create_user,
        is_issue_type_enabled=True,
    )
    ProjectMember.objects.create(project=proj, member=create_user, workspace=workspace, role=ADMIN, is_active=True)
    return proj


@pytest.fixture
def other_tenant_type(db):
    uid = uuid4().hex[:8]
    owner = User.objects.create(email=f"o-{uid}@plane.so", username=f"o_{uid}")
    other_ws = Workspace.objects.create(name="Other", owner=owner, slug=f"other-{uid}")
    WorkspaceMember.objects.create(workspace=other_ws, member=owner, role=ADMIN, is_active=True)
    proj = Project.objects.create(
        name="OtherProj",
        identifier="OTP",
        workspace=other_ws,
        created_by=owner,
        is_issue_type_enabled=True,
    )
    ProjectMember.objects.create(project=proj, member=owner, workspace=other_ws, role=ADMIN, is_active=True)
    it = IssueType.objects.create(workspace=other_ws, name="OtherType", level=0)
    ProjectIssueType.objects.create(project=proj, workspace=other_ws, issue_type=it, level=0)
    return it


def _types_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/work-item-types/"


@pytest.mark.contract
@pytest.mark.django_db
def test_create_requires_issue_type_enabled(api_key_client, workspace, project):
    Project.objects.filter(pk=project.pk).update(is_issue_type_enabled=False)

    response = api_key_client.post(_types_url(workspace.slug, project.id), {"name": "Bug"}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.content
    assert response.data == {"error": "Work item types are not enabled for this project"}
    assert IssueType.objects.count() == 0


@pytest.mark.contract
@pytest.mark.django_db
def test_create_list_retrieve_update_and_sdk_shape(api_key_client, workspace, project, sibling_project):
    url = _types_url(workspace.slug, project.id)
    create_resp = api_key_client.post(
        url,
        {
            "name": "Bug",
            "description": "Defect",
            "logo_props": {"icon": "bug"},
            "is_epic": False,
            "is_active": True,
            "level": 2,
            "project_ids": [str(sibling_project.id)],
            "external_source": "jira",
            "external_id": "10001",
        },
        format="json",
    )

    assert create_resp.status_code == status.HTTP_201_CREATED, create_resp.content
    assert set(create_resp.data.keys()) == WORK_ITEM_TYPE_KEYS
    assert create_resp.data["name"] == "Bug"
    assert isinstance(create_resp.data["level"], int)
    assert create_resp.data["level"] == 2
    # Body project_ids other than the URL project are ignored on create.
    assert create_resp.data["project_ids"] == [str(project.id)]
    type_id = str(create_resp.data["id"])

    # Also link to sibling_project and verify list returns a bare array with both project_ids.
    ProjectIssueType.objects.create(
        project=sibling_project,
        workspace=workspace,
        issue_type_id=type_id,
        level=2,
    )
    list_resp = api_key_client.get(url)
    assert list_resp.status_code == status.HTTP_200_OK, list_resp.content
    assert isinstance(list_resp.data, list)
    assert len(list_resp.data) == 1
    assert set(list_resp.data[0].keys()) == WORK_ITEM_TYPE_KEYS
    assert set(list_resp.data[0]["project_ids"]) == {str(project.id), str(sibling_project.id)}

    # Retrieve and update
    detail_url = f"{url}{type_id}/"
    get_resp = api_key_client.get(detail_url)
    assert get_resp.status_code == status.HTTP_200_OK
    assert set(get_resp.data.keys()) == WORK_ITEM_TYPE_KEYS

    patch_resp = api_key_client.patch(
        detail_url,
        {"name": "Defect", "level": 3, "is_active": False, "is_epic": True},
        format="json",
    )
    assert patch_resp.status_code == status.HTTP_200_OK, patch_resp.content
    assert patch_resp.data["name"] == "Defect"
    assert patch_resp.data["level"] == 3
    assert patch_resp.data["is_active"] is False
    # is_epic is not updatable
    assert patch_resp.data["is_epic"] is False
    assert ProjectIssueType.objects.get(project=project, issue_type_id=type_id).level == 3


@pytest.mark.contract
@pytest.mark.django_db
def test_delete_refuses_default_and_soft_deletes_non_default_clearing_issues(
    api_key_client, workspace, project, create_user
):
    default_type = IssueType.objects.create(workspace=workspace, name="Task", is_default=True)
    ProjectIssueType.objects.create(project=project, workspace=workspace, issue_type=default_type, is_default=True)

    custom_type = IssueType.objects.create(workspace=workspace, name="Spike", is_default=False)
    ProjectIssueType.objects.create(project=project, workspace=workspace, issue_type=custom_type, is_default=False)
    issue = Issue.objects.create(
        name="Typed Issue",
        project=project,
        workspace=workspace,
        type=custom_type,
        created_by=create_user,
    )

    url = _types_url(workspace.slug, project.id)
    refuse_resp = api_key_client.delete(f"{url}{default_type.id}/")
    assert refuse_resp.status_code == status.HTTP_400_BAD_REQUEST, refuse_resp.content
    assert IssueType.objects.filter(pk=default_type.id).exists()

    del_resp = api_key_client.delete(f"{url}{custom_type.id}/")
    assert del_resp.status_code == status.HTTP_204_NO_CONTENT, del_resp.content
    assert not ProjectIssueType.objects.filter(project=project, issue_type=custom_type).exists()
    assert not IssueType.objects.filter(pk=custom_type.id).exists()
    issue.refresh_from_db()
    assert issue.type_id is None


@pytest.mark.contract
@pytest.mark.django_db
def test_issue_serializer_accepts_only_project_linked_type_id(
    api_key_client, workspace, project, sibling_project, other_tenant_type
):
    own_type = IssueType.objects.create(workspace=workspace, name="Story")
    ProjectIssueType.objects.create(project=project, workspace=workspace, issue_type=own_type)

    sibling_type = IssueType.objects.create(workspace=workspace, name="SiblingType")
    ProjectIssueType.objects.create(project=sibling_project, workspace=workspace, issue_type=sibling_type)

    wi_url = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-items/"

    # Linked type succeeds
    ok_resp = api_key_client.post(wi_url, {"name": "Valid WI", "type_id": str(own_type.id)}, format="json")
    assert ok_resp.status_code == status.HTTP_201_CREATED, ok_resp.content
    assert str(ok_resp.data["type_id"]) == str(own_type.id)

    # Sibling project type and cross-workspace type are rejected with 400
    for bad_type in (sibling_type, other_tenant_type):
        bad_resp = api_key_client.post(wi_url, {"name": "Bad WI", "type_id": str(bad_type.id)}, format="json")
        assert bad_resp.status_code == status.HTTP_400_BAD_REQUEST, bad_resp.content


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize(
    "ws_role,proj_role,expected_read,expected_write",
    [
        (ADMIN, ADMIN, status.HTTP_200_OK, status.HTTP_201_CREATED),
        (ADMIN, MEMBER, status.HTTP_200_OK, status.HTTP_201_CREATED),
        (MEMBER, MEMBER, status.HTTP_200_OK, status.HTTP_403_FORBIDDEN),
        (GUEST, GUEST, status.HTTP_200_OK, status.HTTP_403_FORBIDDEN),
        (MEMBER, None, status.HTTP_403_FORBIDDEN, status.HTTP_403_FORBIDDEN),
        (None, None, status.HTTP_403_FORBIDDEN, status.HTTP_403_FORBIDDEN),
    ],
)
def test_work_item_types_permission_matrix(workspace, project, ws_role, proj_role, expected_read, expected_write):
    user = _make_user(workspace, project, ws_role, proj_role)
    client = _client_for(user)
    url = _types_url(workspace.slug, project.id)

    assert client.get(url).status_code == expected_read
    assert client.post(url, {"name": f"T-{uuid4().hex[:6]}"}, format="json").status_code == expected_write


@pytest.mark.contract
@pytest.mark.django_db
def test_cross_project_and_cross_workspace_type_ids_return_404(
    api_key_client, workspace, project, sibling_project, other_tenant_type
):
    sibling_type = IssueType.objects.create(workspace=workspace, name="SibOnly")
    ProjectIssueType.objects.create(project=sibling_project, workspace=workspace, issue_type=sibling_type)

    base = _types_url(workspace.slug, project.id)
    for foreign in (sibling_type, other_tenant_type):
        detail = f"{base}{foreign.id}/"
        assert api_key_client.get(detail).status_code == status.HTTP_404_NOT_FOUND
        assert api_key_client.patch(detail, {"name": "Hacked"}, format="json").status_code == status.HTTP_404_NOT_FOUND
        assert api_key_client.delete(detail).status_code == status.HTTP_404_NOT_FOUND
        foreign.refresh_from_db()
        assert foreign.name != "Hacked"
        assert foreign.deleted_at is None


@pytest.mark.contract
@pytest.mark.django_db
def test_invalid_payloads_return_400(api_key_client, workspace, project):
    url = _types_url(workspace.slug, project.id)
    assert api_key_client.post(url, {}, format="json").status_code == status.HTTP_400_BAD_REQUEST
    assert api_key_client.post(url, {"name": "BadLevel", "level": -1}, format="json").status_code == (
        status.HTTP_400_BAD_REQUEST
    )
    assert api_key_client.post(url, {"name": "BadIds", "project_ids": "not-a-list"}, format="json").status_code == (
        status.HTTP_400_BAD_REQUEST
    )
