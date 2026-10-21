# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""v1 work item link and relation creates bind the URL ``issue_id`` to the URL
workspace + project: 404 and nothing written otherwise."""

from unittest import mock
from uuid import uuid4

import pytest
from django.db.models import Q
from rest_framework import status

from plane.db.models import Issue, IssueLink, IssueRelation, Project, ProjectMember, User, Workspace, WorkspaceMember


@pytest.fixture(autouse=True)
def _no_side_effects(db):
    with (
        mock.patch("plane.api.views.issue.issue_activity"),
        mock.patch("plane.api.views.issue.crawl_work_item_link_title"),
        mock.patch("plane.api.views.issue.base_host", return_value="http://testserver"),
    ):
        yield


def _project(workspace, owner, identifier):
    project = Project.objects.create(name=identifier, identifier=identifier, workspace=workspace, created_by=owner)
    ProjectMember.objects.create(project=project, member=owner, workspace=workspace, role=20)
    return project


@pytest.fixture
def own_project(workspace, create_user):
    return _project(workspace, create_user, "OWN")


@pytest.fixture
def own_issue(own_project):
    return Issue.objects.create(name="Own", project=own_project, workspace=own_project.workspace)


@pytest.fixture
def related_issue(own_project):
    return Issue.objects.create(name="Related", project=own_project, workspace=own_project.workspace)


@pytest.fixture
def sibling_issue(workspace):
    """Same workspace, a project the caller is not a member of."""
    colleague = User.objects.create(email=f"c-{uuid4().hex[:8]}@plane.so", username=uuid4().hex[:8])
    WorkspaceMember.objects.create(workspace=workspace, member=colleague, role=20)
    project = _project(workspace, colleague, "SIB")
    return Issue.objects.create(name="Sibling", project=project, workspace=workspace)


@pytest.fixture
def other_tenant_issue(db):
    owner = User.objects.create(email=f"o-{uuid4().hex[:8]}@plane.so", username=uuid4().hex[:8])
    workspace = Workspace.objects.create(name="Other", owner=owner, slug=f"other-{uuid4().hex[:8]}")
    project = _project(workspace, owner, "OTH")
    return Issue.objects.create(name="Other", project=project, workspace=workspace)


def _post(client, endpoint, workspace, project, issue, related_issue):
    base = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-items/{issue.id}"
    if endpoint == "link":
        return client.post(f"{base}/links/", {"url": "https://example.com"}, format="json")
    payload = {"relation_type": "blocked_by", "issues": [str(related_issue.id)]}
    return client.post(f"{base}/relations/", payload, format="json")


def _rows(endpoint, issue):
    if endpoint == "link":
        return IssueLink.objects.filter(issue=issue).count()
    return IssueRelation.objects.filter(Q(issue=issue) | Q(related_issue=issue)).count()


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("endpoint", ["link", "relation"])
@pytest.mark.parametrize("target", ["sibling_issue", "other_tenant_issue"])
def test_issue_outside_url_project_is_404_and_writes_nothing(
    request, api_key_client, workspace, own_project, related_issue, endpoint, target
):
    issue = request.getfixturevalue(target)

    response = _post(api_key_client, endpoint, workspace, own_project, issue, related_issue)

    assert response.status_code == status.HTTP_404_NOT_FOUND, response.content
    assert _rows(endpoint, issue) == 0


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("endpoint", ["link", "relation"])
def test_issue_in_url_project_is_created(api_key_client, workspace, own_project, own_issue, related_issue, endpoint):
    response = _post(api_key_client, endpoint, workspace, own_project, own_issue, related_issue)

    assert response.status_code == status.HTTP_201_CREATED, response.content
    assert _rows(endpoint, own_issue) == 1
