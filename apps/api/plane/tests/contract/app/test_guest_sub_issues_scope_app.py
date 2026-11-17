# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for guest visibility on the sub-issues list.

On a project with ``guest_view_all_features=False`` a GUEST may only see issues
they created. The sub-issues list follows the same rule as the other issue
sub-resources (403 for a parent the guest cannot see) and as the issue list
(only the sub-issues the guest created are returned).
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Issue, Project, ProjectMember, User, WorkspaceMember

SUB_ISSUES_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/sub-issues/"
LINKS_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/issue-links/"


def _make_issue(name, project, author, parent=None):
    """Create an issue with a deterministic ``created_by`` (BaseModel.save
    otherwise nulls it under tests)."""
    issue = Issue(name=name, project=project, workspace=project.workspace, parent=parent)
    issue.save(created_by_id=author.id)
    return issue


@pytest.fixture
def project(db, workspace, create_user):
    """A project with guest_view_all_features defaulting to False."""
    project = Project.objects.create(name="Scoped Project", identifier="SP", workspace=workspace)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def guest(db, workspace, project):
    unique_id = uuid4().hex[:8]
    user = User.objects.create(email=f"guest-{unique_id}@plane.so", username=f"guest_{unique_id}")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=5)
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=5)
    return user


@pytest.fixture
def guest_client(guest):
    client = APIClient()
    client.force_authenticate(user=guest)
    return client


@pytest.mark.contract
@pytest.mark.django_db
class TestGuestSubIssuesScope:
    def test_hidden_parent_is_denied_like_other_sub_resources(self, guest_client, workspace, project, create_user):
        parent = _make_issue("Member's parent", project, create_user)
        _make_issue("Member's child", project, create_user, parent=parent)
        url_kwargs = {"slug": workspace.slug, "project_id": project.id, "issue_id": parent.id}

        sibling = guest_client.get(LINKS_URL.format(**url_kwargs))
        response = guest_client.get(SUB_ISSUES_URL.format(**url_kwargs))

        assert sibling.status_code == status.HTTP_403_FORBIDDEN
        assert response.status_code == sibling.status_code, response.data

    def test_own_parent_lists_only_sub_issues_the_guest_created(
        self, guest_client, session_client, workspace, project, create_user, guest
    ):
        parent = _make_issue("Guest's parent", project, guest)
        own_child = _make_issue("Guest's child", project, guest, parent=parent)
        other_child = _make_issue("Member's child", project, create_user, parent=parent)
        url = SUB_ISSUES_URL.format(slug=workspace.slug, project_id=project.id, issue_id=parent.id)

        response = guest_client.get(url)
        assert response.status_code == status.HTTP_200_OK, response.data
        assert [sub_issue["id"] for sub_issue in response.data["sub_issues"]] == [own_child.id]
        assert sum(response.data["state_distribution"].values(), []) == [str(own_child.id)]

        # Members still see every sub-issue.
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK, response.data
        assert {sub_issue["id"] for sub_issue in response.data["sub_issues"]} == {own_child.id, other_child.id}

    def test_unrestricted_guest_sees_every_sub_issue(self, guest_client, workspace, project, create_user):
        Project.objects.filter(pk=project.id).update(guest_view_all_features=True)
        parent = _make_issue("Member's parent", project, create_user)
        child = _make_issue("Member's child", project, create_user, parent=parent)

        response = guest_client.get(
            SUB_ISSUES_URL.format(slug=workspace.slug, project_id=project.id, issue_id=parent.id)
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        assert [sub_issue["id"] for sub_issue in response.data["sub_issues"]] == [child.id]
