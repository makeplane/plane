# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests: external-API write paths are capped to the caller's role (WEB-9425).

* Comment PATCH/DELETE require the comment's creator or a project admin.
* Attachment DELETE requires the attachment's creator or a project admin.
* Project-member role assignment cannot exceed the target's workspace role.
"""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import (
    APIToken,
    FileAsset,
    Issue,
    IssueComment,
    Project,
    ProjectMember,
    State,
    User,
    WorkspaceMember,
)

ADMIN, MEMBER, GUEST = 20, 15, 5


def _make_user(workspace, project, ws_role, project_role):
    uid = uuid4().hex[:8]
    user = User.objects.create(email=f"u-{uid}@plane.so", username=f"u_{uid}")
    user.set_password("test-password")
    user.save()
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=ws_role)
    if project_role is not None:
        ProjectMember.objects.create(
            project=project, member=user, workspace=workspace, role=project_role, is_active=True
        )
    return user


def _client_for(api_client_factory, user):
    token = APIToken.objects.create(user=user, label="t")
    client = api_client_factory()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


@pytest.fixture
def client_for():
    from rest_framework.test import APIClient

    return lambda user: _client_for(APIClient, user)


@pytest.fixture
def project(db, workspace, create_user):
    # guest_view_all_features=True isolates the role checks from guest read-scoping
    project = Project.objects.create(
        name="Write Roles",
        identifier="WR9425",
        workspace=workspace,
        created_by=create_user,
        guest_view_all_features=True,
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=ADMIN, is_active=True)
    return project


@pytest.fixture
def state(db, workspace, project):
    return State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)


@pytest.fixture
def issue(db, workspace, project, state, create_user):
    issue = Issue(name="Issue", workspace=workspace, project=project, state=state)
    issue.save(created_by_id=create_user.id)
    return issue


@pytest.fixture
def member_user(db, workspace, project):
    return _make_user(workspace, project, MEMBER, MEMBER)


@pytest.fixture
def other_member_user(db, workspace, project):
    return _make_user(workspace, project, MEMBER, MEMBER)


@pytest.fixture
def guest_user(db, workspace, project):
    return _make_user(workspace, project, GUEST, GUEST)


def _comment(workspace, project, issue, author):
    comment = IssueComment(workspace=workspace, project=project, issue=issue, comment_html="<p>hi</p>", actor=author)
    comment.save(created_by_id=author.id)
    return comment


def _comment_url(ws, project, issue, comment):
    return f"/api/v1/workspaces/{ws.slug}/projects/{project.id}/work-items/{issue.id}/comments/{comment.id}/"


@pytest.mark.contract
@pytest.mark.django_db
class TestCommentEditDelete:
    def test_creator_can_edit_and_delete_own_comment(self, client_for, workspace, project, issue, guest_user):
        client = client_for(guest_user)
        comment = _comment(workspace, project, issue, guest_user)
        url = _comment_url(workspace, project, issue, comment)
        with mock.patch("plane.api.views.issue.issue_activity"), mock.patch("plane.api.views.issue.model_activity"):
            resp = client.patch(url, {"comment_html": "<p>edited</p>"}, format="json")
            assert resp.status_code == status.HTTP_200_OK
            assert client.delete(url).status_code == status.HTTP_204_NO_CONTENT

    @pytest.mark.parametrize("fixture_name", ["member_user", "guest_user"])
    def test_non_creator_non_admin_denied(
        self, request, client_for, workspace, project, issue, create_user, fixture_name
    ):
        user = request.getfixturevalue(fixture_name)
        comment = _comment(workspace, project, issue, create_user)
        url = _comment_url(workspace, project, issue, comment)
        client = client_for(user)
        resp = client.patch(url, {"comment_html": "<p>x</p>"}, format="json")
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        assert "error" in resp.data
        assert client.delete(url).status_code == status.HTTP_403_FORBIDDEN
        assert IssueComment.objects.filter(pk=comment.pk).exists()

    def test_non_creator_member_denied_on_peer_comment(
        self, client_for, workspace, project, issue, member_user, other_member_user
    ):
        comment = _comment(workspace, project, issue, other_member_user)
        url = _comment_url(workspace, project, issue, comment)
        client = client_for(member_user)
        assert client.patch(url, {"comment_html": "<p>x</p>"}, format="json").status_code == 403
        assert client.delete(url).status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_edit_and_delete_any_comment(self, api_key_client, workspace, project, issue, member_user):
        comment = _comment(workspace, project, issue, member_user)
        url = _comment_url(workspace, project, issue, comment)
        with mock.patch("plane.api.views.issue.issue_activity"), mock.patch("plane.api.views.issue.model_activity"):
            resp = api_key_client.patch(url, {"comment_html": "<p>mod</p>"}, format="json")
            assert resp.status_code == status.HTTP_200_OK
            assert api_key_client.delete(url).status_code == status.HTTP_204_NO_CONTENT


def _attachment(workspace, project, issue, author):
    asset = FileAsset(
        workspace=workspace,
        project=project,
        issue=issue,
        entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
        asset="uploads/x.txt",
        attributes={"name": "x.txt", "size": 1},
        is_uploaded=True,
    )
    asset.save(created_by_id=author.id)
    return asset


def _attachment_url(ws, project, issue, asset):
    return f"/api/v1/workspaces/{ws.slug}/projects/{project.id}/work-items/{issue.id}/attachments/{asset.id}/"


@pytest.mark.contract
@pytest.mark.django_db
class TestAttachmentDelete:
    @pytest.mark.parametrize("fixture_name", ["member_user", "guest_user"])
    def test_non_creator_non_admin_denied(
        self, request, client_for, workspace, project, issue, create_user, fixture_name
    ):
        user = request.getfixturevalue(fixture_name)
        asset = _attachment(workspace, project, issue, create_user)
        resp = client_for(user).delete(_attachment_url(workspace, project, issue, asset))
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        asset.refresh_from_db()
        assert asset.is_deleted is False

    @pytest.mark.parametrize("fixture_name", ["member_user", "guest_user"])
    def test_attachment_creator_can_delete(self, request, client_for, workspace, project, issue, fixture_name):
        user = request.getfixturevalue(fixture_name)
        asset = _attachment(workspace, project, issue, user)
        with mock.patch("plane.api.views.issue.issue_activity"):
            resp = client_for(user).delete(_attachment_url(workspace, project, issue, asset))
        assert resp.status_code == status.HTTP_204_NO_CONTENT

    def test_admin_can_delete_any_attachment(self, api_key_client, workspace, project, issue, member_user):
        asset = _attachment(workspace, project, issue, member_user)
        with mock.patch("plane.api.views.issue.issue_activity"):
            resp = api_key_client.delete(_attachment_url(workspace, project, issue, asset))
        assert resp.status_code == status.HTTP_204_NO_CONTENT


def _members_url(ws, project):
    return f"/api/v1/workspaces/{ws.slug}/projects/{project.id}/members/"


@pytest.mark.contract
@pytest.mark.django_db
class TestProjectMemberRoleCap:
    @pytest.mark.parametrize("role", [ADMIN, MEMBER])
    def test_cannot_add_workspace_guest_above_guest(self, api_key_client, workspace, project, role):
        target = _make_user(workspace, project, GUEST, None)
        resp = api_key_client.post(
            _members_url(workspace, project), {"member": str(target.id), "role": role}, format="json"
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert not ProjectMember.objects.filter(project=project, member=target).exists()

    def test_can_add_workspace_guest_as_guest(self, api_key_client, workspace, project):
        target = _make_user(workspace, project, GUEST, None)
        resp = api_key_client.post(
            _members_url(workspace, project), {"member": str(target.id), "role": GUEST}, format="json"
        )
        assert resp.status_code == status.HTTP_201_CREATED

    @pytest.mark.parametrize("role", [ADMIN, MEMBER])
    def test_cannot_promote_workspace_guest_via_patch(self, api_key_client, workspace, project, guest_user, role):
        pm = ProjectMember.objects.get(project=project, member=guest_user)
        resp = api_key_client.patch(f"{_members_url(workspace, project)}{pm.id}/", {"role": role}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        pm.refresh_from_db()
        assert pm.role == GUEST

    def test_can_promote_workspace_member_to_admin(self, api_key_client, workspace, project, member_user):
        pm = ProjectMember.objects.get(project=project, member=member_user)
        resp = api_key_client.patch(f"{_members_url(workspace, project)}{pm.id}/", {"role": ADMIN}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        pm.refresh_from_db()
        assert pm.role == ADMIN

    def test_non_admin_cannot_call_endpoint(self, client_for, workspace, project, member_user, guest_user):
        pm = ProjectMember.objects.get(project=project, member=guest_user)
        resp = client_for(member_user).patch(
            f"{_members_url(workspace, project)}{pm.id}/", {"role": MEMBER}, format="json"
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN
