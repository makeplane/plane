# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Issue history and comment list only return rows for an issue in the URL project."""

from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import Issue, IssueActivity, IssueComment, Project, ProjectMember, User, Workspace

SECRET = "Confidential foreign issue"


def history_url(slug, project_id, issue_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/history/"


def comments_url(slug, project_id, issue_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/comments/"


@pytest.fixture
def own_project(workspace, create_user):
    project = Project.objects.create(name="Own", identifier="OWN", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


def _foreign_issue(workspace, same_workspace):
    owner = User.objects.create(email=f"o-{uuid4().hex[:8]}@plane.so", username=f"o_{uuid4().hex[:8]}")
    if not same_workspace:
        workspace = Workspace.objects.create(name="Other", owner=owner, slug=f"other-{uuid4().hex[:8]}")
    project = Project.objects.create(name="Other", identifier="OTH", workspace=workspace, created_by=owner)
    ProjectMember.objects.create(project=project, member=owner, workspace=workspace, role=20)
    return Issue.objects.create(name=SECRET, description_html=f"<p>{SECRET}</p>", project=project, workspace=workspace)


def _rows_in_project(issue, project, actor):
    """Activity and comment rows recorded under ``project`` but keyed to ``issue``."""
    IssueActivity.objects.create(
        issue=issue, project=project, workspace=project.workspace, actor=actor, verb="created", field="link"
    )
    IssueComment.objects.create(
        issue=issue, project=project, workspace=project.workspace, actor=actor, comment_html="<p>c</p>"
    )


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("same_workspace", [True, False])
def test_history_404_for_issue_outside_url_project(session_client, workspace, create_user, own_project, same_workspace):
    foreign = _foreign_issue(workspace, same_workspace)
    _rows_in_project(foreign, own_project, create_user)

    response = session_client.get(history_url(workspace.slug, own_project.id, foreign.id))

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert SECRET not in str(response.data)


@pytest.mark.contract
@pytest.mark.django_db
def test_history_allows_archived_issue_in_url_project(session_client, workspace, create_user, own_project):
    issue = Issue.objects.create(name="Archived", project=own_project, workspace=workspace, archived_at=timezone.now())
    _rows_in_project(issue, own_project, create_user)

    response = session_client.get(history_url(workspace.slug, own_project.id, issue.id))

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 2


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("same_workspace", [True, False])
def test_comment_list_only_returns_issue_in_url_project(
    session_client, workspace, create_user, own_project, same_workspace
):
    foreign = _foreign_issue(workspace, same_workspace)
    _rows_in_project(foreign, own_project, create_user)
    own_issue = Issue.objects.create(name="Own", project=own_project, workspace=workspace)
    _rows_in_project(own_issue, own_project, create_user)

    response = session_client.get(comments_url(workspace.slug, own_project.id, foreign.id))
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert SECRET not in str(response.data)

    response = session_client.get(comments_url(workspace.slug, own_project.id, own_issue.id))
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1

    # Update and delete are bound to the URL project too.
    foreign_comment = IssueComment.objects.get(issue=foreign)
    foreign_comment_url = f"{comments_url(workspace.slug, own_project.id, foreign.id)}{foreign_comment.id}/"
    response = session_client.patch(foreign_comment_url, {"comment_html": "<p>edited</p>"}, format="json")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert SECRET not in str(response.data)
    response = session_client.delete(foreign_comment_url)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert IssueComment.objects.filter(pk=foreign_comment.id).exists()

    own_comment = IssueComment.objects.get(issue=own_issue)
    response = session_client.patch(
        f"{comments_url(workspace.slug, own_project.id, own_issue.id)}{own_comment.id}/",
        {"comment_html": "<p>edited</p>"},
        format="json",
    )
    assert response.status_code == status.HTTP_200_OK
