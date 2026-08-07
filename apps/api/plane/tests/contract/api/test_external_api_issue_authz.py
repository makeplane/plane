# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for external-API issue comment + attachment authorization.

Regression coverage for:

* comment tamper — ``IssueCommentDetailAPIEndpoint`` (``ProjectLitePermission``,
  any active member) edited/deleted comments by id with no author/admin check, so
  a Guest could tamper with anyone's comments.
* attachment leak — ``IssueAttachmentListCreateAPIEndpoint.get`` had no
  ``permission_classes`` (bare ``IsAuthenticated``) and no membership check, so any
  API-token holder could list any issue's attachment metadata cross-tenant.

The fixes: comment patch/delete require the comment author or a project admin;
the attachment GET enforces project membership on the issue (mirroring ``post``).
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    APIToken,
    FileAsset,
    Issue,
    IssueComment,
    Project,
    ProjectMember,
    User,
    WorkspaceMember,
)

COMMENT_URL = "/api/v1/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/comments/{pk}/"
ATTACH_URL = "/api/v1/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/issue-attachments/"


def _user(prefix):
    unique = uuid4().hex[:8]
    user = User.objects.create(email=f"{prefix}-{unique}@plane.so", username=f"{prefix}_{unique}")
    user.set_password("test-password")
    user.save()
    return user


def _token_client(user):
    token = APIToken.objects.create(user=user, label=f"tok-{uuid4().hex[:6]}", token=f"tok-{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Ext API Project", identifier="EA", workspace=workspace, created_by=create_user
    )
    # create_user is the project ADMIN
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20, is_active=True)
    return project


def _project_member(workspace, project, *, role):
    user = _user(f"role{role}")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role, is_active=True)
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=role, is_active=True)
    return user


@pytest.fixture
def issue(db, workspace, project, create_user):
    issue = Issue(name="Issue", project=project, workspace=workspace)
    issue.save(created_by_id=create_user.id)
    return issue


# --- h4p4: comment tamper -----------------------------------------------------


@pytest.fixture
def author(db, workspace, project):
    return _project_member(workspace, project, role=15)


@pytest.fixture
def comment(db, workspace, project, issue, author):
    c = IssueComment(
        workspace=workspace, project=project, issue=issue, comment_html="<p>original</p>", actor=author
    )
    c.save(created_by_id=author.id)
    return c


@pytest.mark.contract
@pytest.mark.django_db
class TestExternalApiCommentAuthz:
    """A Guest / non-author must not edit or delete another user's comment."""

    def test_guest_cannot_patch_comment(self, workspace, project, issue, comment):
        guest = _project_member(workspace, project, role=5)
        response = _token_client(guest).patch(
            COMMENT_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id, pk=comment.id),
            {"comment_html": "<p>tampered</p>"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        comment.refresh_from_db()
        assert comment.comment_html == "<p>original</p>"

    def test_guest_cannot_delete_comment(self, workspace, project, issue, comment):
        guest = _project_member(workspace, project, role=5)
        response = _token_client(guest).delete(
            COMMENT_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id, pk=comment.id)
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert IssueComment.objects.filter(pk=comment.id).exists()

    def test_author_can_patch_own_comment(self, workspace, project, issue, comment, author):
        response = _token_client(author).patch(
            COMMENT_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id, pk=comment.id),
            {"comment_html": "<p>edited by author</p>"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    def test_admin_can_delete_comment(self, workspace, project, issue, comment, create_user):
        """Positive control: a project admin may delete another user's comment."""
        response = _token_client(create_user).delete(
            COMMENT_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id, pk=comment.id)
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )


# --- xvc5: attachment metadata disclosure -------------------------------------


@pytest.fixture
def attachment(db, workspace, project, issue):
    return FileAsset.objects.create(
        attributes={"name": "secret.pdf", "type": "application/pdf", "size": 100},
        asset=f"{workspace.id}/{uuid4().hex}-secret.pdf",
        size=100,
        workspace=workspace,
        project=project,
        issue_id=issue.id,
        entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
        is_uploaded=True,
    )


@pytest.mark.contract
@pytest.mark.django_db
class TestExternalApiAttachmentAuthz:
    """A token holder with no project membership must not read attachment metadata."""

    def test_outsider_cannot_list_attachments(self, workspace, project, issue, attachment):
        outsider = _user("outsider")  # valid token, NO membership anywhere
        response = _token_client(outsider).get(
            ATTACH_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id)
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    def test_project_member_can_list_attachments(self, workspace, project, issue, attachment):
        member = _project_member(workspace, project, role=15)
        response = _token_client(member).get(
            ATTACH_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id)
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert len(response.data) == 1
