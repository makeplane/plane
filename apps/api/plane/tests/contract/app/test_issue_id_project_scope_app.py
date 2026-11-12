# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Issue sub-resource creates bind the URL ``issue_id`` / ``comment_id`` to the URL
workspace + project.

Link, attachment (legacy + V2), reaction, subscriber and comment reaction creates
404 and write nothing when the URL issue or comment belongs to another project or
workspace. Adding a subscriber also requires the subscriber to be an active member
of the URL project.
"""

from unittest import mock
from uuid import uuid4

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    CommentReaction,
    FileAsset,
    Issue,
    IssueComment,
    IssueLink,
    IssueReaction,
    IssueSubscriber,
    Project,
    ProjectMember,
    User,
    Workspace,
    WorkspaceMember,
)

ENDPOINTS = ["link", "attachment", "attachment_v2", "reaction", "subscribe", "subscriber", "comment_reaction"]


@pytest.fixture(autouse=True)
def _no_side_effects(db):
    """Stub broker-backed tasks, base_host and S3 storage so success paths run."""
    storage = mock.MagicMock()
    storage.generate_filename.side_effect = lambda name: name
    storage.save.side_effect = lambda name, *args, **kwargs: name
    storage.url.return_value = "http://testserver/a.txt"
    with (
        mock.patch.object(FileAsset._meta.get_field("asset"), "storage", storage),
        mock.patch("plane.app.views.issue.link.issue_activity"),
        mock.patch("plane.app.views.issue.link.crawl_work_item_link_title"),
        mock.patch("plane.app.views.issue.link.base_host", return_value="http://testserver"),
        mock.patch("plane.app.views.issue.attachment.issue_activity"),
        mock.patch("plane.app.views.issue.attachment.base_host", return_value="http://testserver"),
        mock.patch("plane.app.views.issue.attachment.S3Storage") as s3,
        mock.patch("plane.app.views.issue.reaction.issue_activity"),
        mock.patch("plane.app.views.issue.reaction.base_host", return_value="http://testserver"),
        mock.patch("plane.app.views.issue.comment.issue_activity"),
        mock.patch("plane.app.views.issue.comment.base_host", return_value="http://testserver"),
    ):
        s3.return_value.generate_presigned_post.return_value = {}
        yield


def _user(prefix):
    uid = uuid4().hex[:8]
    return User.objects.create(email=f"{prefix}-{uid}@plane.so", username=f"{prefix}_{uid}")


def _issue(workspace, owner, identifier):
    project = Project.objects.create(name=identifier, identifier=identifier, workspace=workspace, created_by=owner)
    ProjectMember.objects.create(project=project, member=owner, workspace=workspace, role=20)
    issue = Issue.objects.create(name=f"{identifier} issue", project=project, workspace=workspace)
    IssueComment.objects.create(issue=issue, project=project, workspace=workspace, comment_html="<p>c</p>")
    return issue


@pytest.fixture
def member(db):
    return _user("member")


@pytest.fixture
def own_workspace(member):
    workspace = Workspace.objects.create(name="Own", owner=member, slug=f"own-{uuid4().hex[:8]}")
    WorkspaceMember.objects.create(workspace=workspace, member=member, role=20)
    return workspace


@pytest.fixture
def own_issue(own_workspace, member):
    return _issue(own_workspace, member, "OWN")


@pytest.fixture
def sibling_issue(own_workspace):
    """Same workspace, a project the caller is not a member of."""
    colleague = _user("colleague")
    WorkspaceMember.objects.create(workspace=own_workspace, member=colleague, role=20)
    return _issue(own_workspace, colleague, "SIB")


@pytest.fixture
def other_tenant_issue(db):
    owner = _user("other")
    workspace = Workspace.objects.create(name="Other", owner=owner, slug=f"other-{uuid4().hex[:8]}")
    WorkspaceMember.objects.create(workspace=workspace, member=owner, role=20)
    return _issue(workspace, owner, "OTH")


@pytest.fixture
def member_client(member):
    client = APIClient()
    client.force_authenticate(user=member)
    return client


def _post(client, endpoint, slug, project_id, issue, user):
    base = f"/api/workspaces/{slug}/projects/{project_id}"
    if endpoint == "link":
        return client.post(f"{base}/issues/{issue.id}/issue-links/", {"url": "https://example.com"}, format="json")
    if endpoint == "attachment":
        upload = SimpleUploadedFile("a.txt", b"x", content_type="text/plain")
        return client.post(f"{base}/issues/{issue.id}/issue-attachments/", {"asset": upload}, format="multipart")
    if endpoint == "attachment_v2":
        url = f"/api/assets/v2/workspaces/{slug}/projects/{project_id}/issues/{issue.id}/attachments/"
        return client.post(url, {"name": "a.png", "type": "image/png", "size": 1}, format="json")
    if endpoint == "reaction":
        return client.post(f"{base}/issues/{issue.id}/reactions/", {"reaction": "128077"}, format="json")
    if endpoint == "subscribe":
        return client.post(f"{base}/issues/{issue.id}/subscribe/", format="json")
    if endpoint == "subscriber":
        return client.post(f"{base}/issues/{issue.id}/issue-subscribers/", {"subscriber": str(user.id)}, format="json")
    comment = IssueComment.objects.get(issue=issue)
    return client.post(f"{base}/comments/{comment.id}/reactions/", {"reaction": "128077"}, format="json")


def _rows(endpoint, issue):
    if endpoint == "link":
        return IssueLink.objects.filter(issue=issue).count()
    if endpoint in ("attachment", "attachment_v2"):
        return FileAsset.objects.filter(issue=issue).count()
    if endpoint == "reaction":
        return IssueReaction.objects.filter(issue=issue).count()
    if endpoint in ("subscribe", "subscriber"):
        return IssueSubscriber.objects.filter(issue=issue).count()
    return CommentReaction.objects.filter(comment__issue=issue).count()


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("endpoint", ENDPOINTS)
@pytest.mark.parametrize("target", ["sibling_issue", "other_tenant_issue"])
def test_issue_outside_url_project_is_404_and_writes_nothing(
    request, member_client, member, own_workspace, own_issue, endpoint, target
):
    issue = request.getfixturevalue(target)

    response = _post(member_client, endpoint, own_workspace.slug, own_issue.project_id, issue, member)

    assert response.status_code == status.HTTP_404_NOT_FOUND, response.content
    assert _rows(endpoint, issue) == 0


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("endpoint", ENDPOINTS)
def test_issue_in_url_project_is_created(member_client, member, own_workspace, own_issue, endpoint):
    response = _post(member_client, endpoint, own_workspace.slug, own_issue.project_id, own_issue, member)

    assert response.status_code in (status.HTTP_200_OK, status.HTTP_201_CREATED), response.content
    assert _rows(endpoint, own_issue) == 1


@pytest.mark.contract
@pytest.mark.django_db
def test_subscriber_must_be_project_member(member_client, own_workspace, own_issue):
    base = f"/api/workspaces/{own_workspace.slug}/projects/{own_issue.project_id}"
    url = f"{base}/issues/{own_issue.id}/issue-subscribers/"
    outsider = _user("outsider")
    WorkspaceMember.objects.create(workspace=own_workspace, member=outsider, role=20)

    response = member_client.post(url, {"subscriber": str(outsider.id)}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.content
    assert not IssueSubscriber.objects.filter(issue=own_issue, subscriber=outsider).exists()

    colleague = _user("colleague")
    WorkspaceMember.objects.create(workspace=own_workspace, member=colleague, role=20)
    ProjectMember.objects.create(project=own_issue.project, member=colleague, workspace=own_workspace, role=15)

    response = member_client.post(url, {"subscriber": str(colleague.id)}, format="json")

    assert response.status_code == status.HTTP_201_CREATED, response.content
    assert IssueSubscriber.objects.filter(issue=own_issue, subscriber=colleague).exists()
