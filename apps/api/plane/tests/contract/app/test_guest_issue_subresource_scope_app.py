# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for guest visibility on issue sub-resources.

On a project with
``guest_view_all_features=False`` the issue-detail endpoint correctly 403s a
GUEST for issues they did not create, but the issue *sub-resource* endpoints did
not replicate that restriction:

* ``IssueAttachmentEndpoint.get``   (v1 ``.../issue-attachments/``)
* ``IssueAttachmentV2Endpoint.get`` (v2 ``/assets/v2/.../attachments/``)
* ``IssueActivityEndpoint.get``     (``.../history/``)
* ``IssueCommentViewSet.list``/``.retrieve`` (``.../comments/``)
* ``CommentReactionViewSet.create``/``.destroy`` (``.../comments/<id>/reactions/``)

Each is decorated ``@allow_permission([ADMIN, MEMBER, GUEST])`` and queried by
``issue_id`` only, so a restricted guest who is a legitimate project member could
list attachment metadata / download URLs and read activity + comments of issues
they are not allowed to view.

The fix routes each through ``issue_hidden_from_guest`` and returns 403 for a
restricted guest on an issue they did not author — mirroring the issue-detail
rule — while leaving admins, members, unrestricted guests, and the guest's own
issues unaffected.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    FileAsset,
    Issue,
    IssueComment,
    Project,
    ProjectMember,
    User,
    WorkspaceMember,
)

V1_ATTACH_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/issue-attachments/"
V2_ATTACH_URL = "/api/assets/v2/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/attachments/"
HISTORY_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/history/"
COMMENT_LIST_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/comments/"
COMMENT_DETAIL_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/comments/{pk}/"
REACTION_URL = "/api/workspaces/{slug}/projects/{project_id}/comments/{comment_id}/reactions/"
REACTION_DETAIL_URL = "/api/workspaces/{slug}/projects/{project_id}/comments/{comment_id}/reactions/{reaction_code}/"


def _make_issue(name, project, workspace, author):
    """Create an issue with a deterministic ``created_by`` (BaseModel.save
    otherwise nulls it under tests)."""
    issue = Issue(name=name, project=project, workspace=workspace)
    issue.save(created_by_id=author.id)
    return issue


def _make_comment(issue, project, workspace, actor):
    return IssueComment.objects.create(
        issue=issue, project=project, actor=actor, comment_html="<p>secret comment</p>"
    )


def _make_attachment(issue, project, workspace):
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


@pytest.fixture
def project(db, workspace, create_user):
    """A project with guest_view_all_features defaulting to False; the owner
    (``create_user``) is an active project ADMIN (role 20)."""
    project = Project.objects.create(
        name="Scoped Project", identifier="SP", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def guest(db, workspace, project):
    """An active project GUEST (role 5)."""
    user = User.objects.create(
        email=f"guest-{uuid4().hex[:8]}@plane.so",
        username=f"guest_{uuid4().hex[:8]}",
        first_name="Guest",
    )
    user.set_password("test-password")
    user.save()
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=5)
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=5)
    return user


@pytest.fixture
def guest_client(guest):
    client = APIClient()
    client.force_authenticate(user=guest)
    return client


@pytest.fixture
def own_issue(db, workspace, project, guest):
    """An issue authored by the guest, with an attachment."""
    issue = _make_issue("Guest's own issue", project, workspace, guest)
    _make_attachment(issue, project, workspace)
    return issue


@pytest.fixture
def foreign_issue(db, workspace, project, create_user):
    """An issue authored by someone other than the guest, with an attachment."""
    issue = _make_issue("Someone else's issue", project, workspace, create_user)
    _make_attachment(issue, project, workspace)
    return issue


@pytest.fixture
def own_issue_comment(db, workspace, project, own_issue, guest):
    """A comment on the guest's own issue."""
    return _make_comment(own_issue, project, workspace, guest)


@pytest.fixture
def foreign_issue_comment(db, workspace, project, foreign_issue, create_user):
    """A comment on an issue authored by someone other than the guest."""
    return _make_comment(foreign_issue, project, workspace, create_user)


@pytest.mark.contract
@pytest.mark.django_db
class TestGuestIssueSubresourceScope:
    """A restricted guest must not read sub-resources of issues they can't view."""

    # ---- restricted guest is blocked on a foreign issue ----------------------

    def test_guest_blocked_v1_attachments(self, guest_client, workspace, project, foreign_issue):
        response = guest_client.get(
            V1_ATTACH_URL.format(slug=workspace.slug, project_id=project.id, issue_id=foreign_issue.id)
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    def test_guest_blocked_v2_attachments(self, guest_client, workspace, project, foreign_issue):
        base = V2_ATTACH_URL.format(slug=workspace.slug, project_id=project.id, issue_id=foreign_issue.id)
        # Collection endpoint.
        response = guest_client.get(base)
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        # Single-attachment endpoint — the highest-risk path (returns a presigned
        # download redirect); must also be blocked.
        asset = FileAsset.objects.filter(
            issue_id=foreign_issue.id,
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
        ).first()
        response_pk = guest_client.get(f"{base}{asset.id}/")
        assert response_pk.status_code == status.HTTP_403_FORBIDDEN, (
            f"Single-attachment leak: {response_pk.status_code} {getattr(response_pk, 'data', None)!r}"
        )

    def test_guest_cannot_post_attachment_to_foreign_issue(self, guest_client, workspace, project, foreign_issue):
        """The visibility rule covers writes too: a restricted guest cannot add an
        attachment to an issue they are not allowed to view."""
        response = guest_client.post(
            V2_ATTACH_URL.format(slug=workspace.slug, project_id=project.id, issue_id=foreign_issue.id),
            {"name": "evil.pdf", "type": "application/pdf", "size": 100},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    def test_guest_blocked_activity(self, guest_client, workspace, project, foreign_issue):
        response = guest_client.get(
            HISTORY_URL.format(slug=workspace.slug, project_id=project.id, issue_id=foreign_issue.id)
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    def test_guest_blocked_comments_list(self, guest_client, workspace, project, foreign_issue, foreign_issue_comment):
        response = guest_client.get(
            COMMENT_LIST_URL.format(slug=workspace.slug, project_id=project.id, issue_id=foreign_issue.id)
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    def test_guest_blocked_comment_retrieve(
        self, guest_client, workspace, project, foreign_issue, foreign_issue_comment
    ):
        response = guest_client.get(
            COMMENT_DETAIL_URL.format(
                slug=workspace.slug,
                project_id=project.id,
                issue_id=foreign_issue.id,
                pk=foreign_issue_comment.id,
            )
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    def test_guest_blocked_comment_reaction_create(
        self, guest_client, workspace, project, foreign_issue, foreign_issue_comment
    ):
        response = guest_client.post(
            REACTION_URL.format(slug=workspace.slug, project_id=project.id, comment_id=foreign_issue_comment.id),
            {"reaction": "like"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    def test_guest_blocked_comment_reaction_destroy(
        self, guest_client, workspace, project, foreign_issue, foreign_issue_comment
    ):
        response = guest_client.delete(
            REACTION_DETAIL_URL.format(
                slug=workspace.slug,
                project_id=project.id,
                comment_id=foreign_issue_comment.id,
                reaction_code="like",
            )
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    # ---- the guest still sees their OWN issue's sub-resources ----------------

    def test_guest_allowed_own_issue_attachments(self, guest_client, workspace, project, own_issue):
        response = guest_client.get(
            V2_ATTACH_URL.format(slug=workspace.slug, project_id=project.id, issue_id=own_issue.id)
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert len(response.data) == 1, f"Guest should see their own attachment: {response.data!r}"

    def test_guest_allowed_own_issue_comments_list(
        self, guest_client, workspace, project, own_issue, own_issue_comment
    ):
        response = guest_client.get(
            COMMENT_LIST_URL.format(slug=workspace.slug, project_id=project.id, issue_id=own_issue.id)
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert len(response.data) == 1, f"Guest should see their own comment: {response.data!r}"

    def test_guest_allowed_own_issue_comment_retrieve(
        self, guest_client, workspace, project, own_issue, own_issue_comment
    ):
        response = guest_client.get(
            COMMENT_DETAIL_URL.format(
                slug=workspace.slug, project_id=project.id, issue_id=own_issue.id, pk=own_issue_comment.id
            )
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    def test_guest_allowed_own_issue_comment_reaction_create(
        self, guest_client, workspace, project, own_issue, own_issue_comment
    ):
        response = guest_client.post(
            REACTION_URL.format(slug=workspace.slug, project_id=project.id, comment_id=own_issue_comment.id),
            {"reaction": "like"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    # ---- positive controls: members and unrestricted guests unaffected -------

    def test_member_reads_foreign_issue_comments(
        self, session_client, workspace, project, foreign_issue, foreign_issue_comment
    ):
        """A full project member still reads any issue's comments."""
        response = session_client.get(
            COMMENT_LIST_URL.format(slug=workspace.slug, project_id=project.id, issue_id=foreign_issue.id)
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_unrestricted_guest_reads_foreign_issue_comments(
        self, guest_client, workspace, project, foreign_issue, foreign_issue_comment
    ):
        """When guest_view_all_features is enabled, the guest sees all comments."""
        project.guest_view_all_features = True
        project.save(update_fields=["guest_view_all_features"])

        response = guest_client.get(
            COMMENT_LIST_URL.format(slug=workspace.slug, project_id=project.id, issue_id=foreign_issue.id)
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_member_reads_foreign_issue_attachments(self, session_client, workspace, project, foreign_issue):
        """A full project member still reads any issue's attachments."""
        response = session_client.get(
            V2_ATTACH_URL.format(slug=workspace.slug, project_id=project.id, issue_id=foreign_issue.id)
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_unrestricted_guest_reads_foreign_issue_attachments(
        self, guest_client, workspace, project, foreign_issue
    ):
        """When guest_view_all_features is enabled, the guest sees all attachments."""
        project.guest_view_all_features = True
        project.save(update_fields=["guest_view_all_features"])

        response = guest_client.get(
            V2_ATTACH_URL.format(slug=workspace.slug, project_id=project.id, issue_id=foreign_issue.id)
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
