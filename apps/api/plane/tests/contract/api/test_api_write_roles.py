# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests: external-API write paths are capped to the caller's role (WEB-9425).

* Comment PATCH/DELETE require the comment's creator or an admin.
* Attachment DELETE requires the attachment's creator or an admin.
* An admin is a project admin, or a workspace admin who is an active project member.
  Admins skip the guest visibility gate on these paths.
* Project-member role assignment requires an active workspace membership and
  cannot exceed the target's workspace role.
"""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status

from plane.api.serializers import ProjectMemberSerializer
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
            resp = client.delete(url)
            assert resp.status_code == status.HTTP_204_NO_CONTENT

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
        resp = client.delete(url)
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        assert IssueComment.objects.filter(pk=comment.pk).exists()

    def test_non_creator_member_denied_on_peer_comment(
        self, client_for, workspace, project, issue, member_user, other_member_user
    ):
        comment = _comment(workspace, project, issue, other_member_user)
        url = _comment_url(workspace, project, issue, comment)
        client = client_for(member_user)
        resp = client.patch(url, {"comment_html": "<p>x</p>"}, format="json")
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        resp = client.delete(url)
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_edit_and_delete_any_comment(self, api_key_client, workspace, project, issue, member_user):
        comment = _comment(workspace, project, issue, member_user)
        url = _comment_url(workspace, project, issue, comment)
        with mock.patch("plane.api.views.issue.issue_activity"), mock.patch("plane.api.views.issue.model_activity"):
            resp = api_key_client.patch(url, {"comment_html": "<p>mod</p>"}, format="json")
            assert resp.status_code == status.HTTP_200_OK
            resp = api_key_client.delete(url)
            assert resp.status_code == status.HTTP_204_NO_CONTENT

    @pytest.mark.parametrize("project_role", [MEMBER, GUEST])
    def test_workspace_admin_can_edit_and_delete_any_comment(
        self, client_for, workspace, project, issue, create_user, project_role
    ):
        workspace_admin = _make_user(workspace, project, ADMIN, project_role)
        comment = _comment(workspace, project, issue, create_user)
        url = _comment_url(workspace, project, issue, comment)
        client = client_for(workspace_admin)
        with mock.patch("plane.api.views.issue.issue_activity"), mock.patch("plane.api.views.issue.model_activity"):
            resp = client.patch(url, {"comment_html": "<p>mod</p>"}, format="json")
            assert resp.status_code == status.HTTP_200_OK
            resp = client.delete(url)
            assert resp.status_code == status.HTTP_204_NO_CONTENT

    @pytest.mark.parametrize("ws_role, allowed", [(ADMIN, True), (MEMBER, False)])
    def test_project_guest_without_view_all_features(
        self, client_for, workspace, project, issue, create_user, ws_role, allowed
    ):
        """With guest_view_all_features off, a workspace admin holding the project
        GUEST role can still edit and delete another user's comment on another
        user's work item; other project guests get 404."""
        Project.objects.filter(pk=project.pk).update(guest_view_all_features=False)
        user = _make_user(workspace, project, ws_role, GUEST)
        comment = _comment(workspace, project, issue, create_user)
        url = _comment_url(workspace, project, issue, comment)
        client = client_for(user)
        with mock.patch("plane.api.views.issue.issue_activity"), mock.patch("plane.api.views.issue.model_activity"):
            resp = client.patch(url, {"comment_html": "<p>mod</p>"}, format="json")
            assert resp.status_code == (status.HTTP_200_OK if allowed else status.HTTP_404_NOT_FOUND)
            resp = client.delete(url)
            assert resp.status_code == (status.HTTP_204_NO_CONTENT if allowed else status.HTTP_404_NOT_FOUND)
        assert IssueComment.objects.filter(pk=comment.pk).exists() is not allowed

    @pytest.mark.parametrize("fixture_name", ["member_user", "guest_user"])
    def test_creator_with_revoked_membership_denied(self, request, client_for, workspace, project, issue, fixture_name):
        user = request.getfixturevalue(fixture_name)
        comment = _comment(workspace, project, issue, user)
        url = _comment_url(workspace, project, issue, comment)
        client = client_for(user)
        ProjectMember.objects.filter(project=project, member=user).update(is_active=False)
        resp = client.patch(url, {"comment_html": "<p>x</p>"}, format="json")
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        resp = client.delete(url)
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        assert IssueComment.objects.filter(pk=comment.pk).exists()


def _attachment(workspace, project, issue, author, is_uploaded=True):
    asset = FileAsset(
        workspace=workspace,
        project=project,
        issue=issue,
        entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
        asset="uploads/x.txt",
        attributes={"name": "x.txt", "size": 1},
        is_uploaded=is_uploaded,
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

    @pytest.mark.parametrize("project_role", [MEMBER, GUEST])
    def test_workspace_admin_can_delete_any_attachment(
        self, client_for, workspace, project, issue, create_user, project_role
    ):
        workspace_admin = _make_user(workspace, project, ADMIN, project_role)
        asset = _attachment(workspace, project, issue, create_user)
        with mock.patch("plane.api.views.issue.issue_activity"):
            resp = client_for(workspace_admin).delete(_attachment_url(workspace, project, issue, asset))
        assert resp.status_code == status.HTTP_204_NO_CONTENT

    @pytest.mark.parametrize("ws_role, allowed", [(ADMIN, True), (MEMBER, False)])
    def test_project_guest_without_view_all_features(
        self, client_for, workspace, project, issue, create_user, ws_role, allowed
    ):
        """With guest_view_all_features off, a workspace admin holding the project
        GUEST role can still delete another user's attachment on another user's
        work item; other project guests get 404."""
        Project.objects.filter(pk=project.pk).update(guest_view_all_features=False)
        user = _make_user(workspace, project, ws_role, GUEST)
        asset = _attachment(workspace, project, issue, create_user)
        with mock.patch("plane.api.views.issue.issue_activity"):
            resp = client_for(user).delete(_attachment_url(workspace, project, issue, asset))
        assert resp.status_code == (status.HTTP_204_NO_CONTENT if allowed else status.HTTP_404_NOT_FOUND)
        asset.refresh_from_db()
        assert asset.is_deleted is allowed

    def test_workspace_admin_without_project_membership_denied(
        self, client_for, workspace, project, issue, create_user
    ):
        workspace_admin = _make_user(workspace, project, ADMIN, MEMBER)
        ProjectMember.objects.filter(project=project, member=workspace_admin).update(is_active=False)
        asset = _attachment(workspace, project, issue, create_user)
        resp = client_for(workspace_admin).delete(_attachment_url(workspace, project, issue, asset))
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        asset.refresh_from_db()
        assert asset.is_deleted is False

    @pytest.mark.parametrize("fixture_name", ["member_user", "guest_user"])
    def test_creator_with_revoked_membership_denied(self, request, client_for, workspace, project, issue, fixture_name):
        user = request.getfixturevalue(fixture_name)
        asset = _attachment(workspace, project, issue, user)
        client = client_for(user)
        ProjectMember.objects.filter(project=project, member=user).update(is_active=False)
        resp = client.delete(_attachment_url(workspace, project, issue, asset))
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        asset.refresh_from_db()
        assert asset.is_deleted is False

    def test_upload_confirm_keeps_original_creator(
        self, client_for, workspace, project, issue, create_user, member_user
    ):
        asset = _attachment(workspace, project, issue, create_user, is_uploaded=False)
        url = _attachment_url(workspace, project, issue, asset)
        client = client_for(member_user)
        with (
            mock.patch("plane.api.views.issue.issue_activity"),
            mock.patch("plane.api.views.issue.get_asset_object_metadata"),
        ):
            resp = client.patch(url, {"is_uploaded": True}, format="json")
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        asset.refresh_from_db()
        assert asset.is_uploaded is True
        assert asset.created_by_id == create_user.id
        resp = client.delete(url)
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        asset.refresh_from_db()
        assert asset.is_deleted is False


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

    @pytest.mark.parametrize("role", [ADMIN, MEMBER])
    def test_cannot_reassign_elevated_row_to_workspace_guest_without_role(
        self, api_key_client, workspace, project, role
    ):
        holder = _make_user(workspace, project, ADMIN, role)
        guest = _make_user(workspace, project, GUEST, None)
        pm = ProjectMember.objects.get(project=project, member=holder)
        resp = api_key_client.patch(
            f"{_members_url(workspace, project)}{pm.id}/", {"member": str(guest.id)}, format="json"
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        pm.refresh_from_db()
        assert pm.role == role
        assert pm.member_id == holder.id

    def test_cannot_add_inactive_workspace_member(self, api_key_client, workspace, project):
        target = _make_user(workspace, project, MEMBER, None)
        WorkspaceMember.objects.filter(workspace=workspace, member=target).update(is_active=False)
        resp = api_key_client.post(
            _members_url(workspace, project), {"member": str(target.id), "role": MEMBER}, format="json"
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert not ProjectMember.objects.filter(project=project, member=target).exists()

    def test_cannot_change_role_of_inactive_workspace_member(self, api_key_client, workspace, project, member_user):
        WorkspaceMember.objects.filter(workspace=workspace, member=member_user).update(is_active=False)
        pm = ProjectMember.objects.get(project=project, member=member_user)
        resp = api_key_client.patch(f"{_members_url(workspace, project)}{pm.id}/", {"role": ADMIN}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        pm.refresh_from_db()
        assert pm.role == MEMBER

    def test_role_validation_requires_active_workspace_membership(self, workspace, project, member_user):
        WorkspaceMember.objects.filter(workspace=workspace, member=member_user).update(is_active=False)
        pm = ProjectMember.objects.get(project=project, member=member_user)
        serializer = ProjectMemberSerializer(pm, data={"role": ADMIN}, partial=True, context={"slug": workspace.slug})
        assert not serializer.is_valid()
        assert "member" in serializer.errors

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
