# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for issue sub-resource scoping on comment + relation create.

Regression coverage for GHSA-hvx3-58mp-5fpx (SECUR-243).

``ProjectEntityPermission`` / ``allow_permission`` validate only that the caller is
an active member of the URL's ``project_id``. Neither validates that the sibling
``issue_id`` path parameter belongs to that project or workspace, and two write
handlers then used ``issue_id`` unscoped:

* ``IssueCommentViewSet.create`` — ``Issue.objects.get(pk=issue_id)``. The 201
  response serializes the foreign issue's full ``issue_detail`` (name, description,
  priority, dates, ``sequence_id``) back to the caller, so this is a cross-tenant
  *read* as well as a write.
* ``IssueRelationViewSet.create`` — the request-body ``issues`` were workspace-scoped
  but the URL ``issue_id`` used as the other side of the relation was not.

Both fixes bind the lookup to ``workspace__slug`` + ``project_id`` and 404 otherwise.
"""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Issue,
    IssueComment,
    IssueRelation,
    Project,
    ProjectMember,
    User,
    Workspace,
    WorkspaceMember,
)


def comments_url(slug, project_id, issue_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/comments/"


def relation_url(slug, project_id, issue_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/issue-relation/"


@pytest.fixture(autouse=True)
def _no_activity(db):
    """Stub the deferred activity tasks (broker) and base_host (needs APP_BASE_URL /
    WEB_URL, unset in the test env) so the success paths run cleanly."""
    with (
        mock.patch("plane.app.views.issue.comment.issue_activity"),
        mock.patch("plane.app.views.issue.comment.model_activity"),
        mock.patch("plane.app.views.issue.comment.base_host", return_value="http://testserver"),
        mock.patch("plane.app.views.issue.relation.issue_activity"),
        mock.patch("plane.app.views.issue.relation.base_host", return_value="http://testserver"),
    ):
        yield


def _make_user(prefix):
    unique_id = uuid4().hex[:8]
    user = User.objects.create(
        email=f"{prefix}-{unique_id}@plane.so",
        username=f"{prefix}_{unique_id}",
        first_name=prefix.title(),
        last_name="User",
    )
    user.set_password("test-password")
    user.save()
    return user


def _make_project(name, identifier, workspace, owner, members=()):
    project = Project.objects.create(name=name, identifier=identifier, workspace=workspace, created_by=owner)
    for member in members:
        ProjectMember.objects.create(project=project, member=member, workspace=workspace, role=20)
    return project


@pytest.fixture
def attacker(db):
    """A user with a workspace and project of their very own."""
    return _make_user("attacker")


@pytest.fixture
def attacker_workspace(db, attacker):
    workspace = Workspace.objects.create(
        name="Attacker Workspace", owner=attacker, slug=f"attacker-ws-{uuid4().hex[:8]}"
    )
    WorkspaceMember.objects.create(workspace=workspace, member=attacker, role=20)
    return workspace


@pytest.fixture
def attacker_project(db, attacker_workspace, attacker):
    return _make_project("Attacker Project", "ATK", attacker_workspace, attacker, [attacker])


@pytest.fixture
def attacker_issue(db, attacker_workspace, attacker_project):
    return Issue.objects.create(name="Attacker's own issue", project=attacker_project, workspace=attacker_workspace)


@pytest.fixture
def victim_workspace(db):
    """A completely separate tenant. The attacker is not a member."""
    owner = _make_user("victim")
    workspace = Workspace.objects.create(name="Victim Workspace", owner=owner, slug=f"victim-ws-{uuid4().hex[:8]}")
    WorkspaceMember.objects.create(workspace=workspace, member=owner, role=20)
    workspace.owner_user = owner
    return workspace


@pytest.fixture
def victim_issue(db, victim_workspace):
    project = _make_project(
        "Victim Project",
        "VIC",
        victim_workspace,
        victim_workspace.owner_user,
        [victim_workspace.owner_user],
    )
    return Issue.objects.create(
        name="Confidential victim issue",
        description_html="<p>Secret roadmap detail</p>",
        priority="urgent",
        project=project,
        workspace=victim_workspace,
    )


@pytest.fixture
def sibling_project_issue(db, attacker_workspace, attacker):
    """An issue in a *different project of the attacker's own workspace* that the
    attacker is not a member of — the intra-workspace case."""
    other_owner = _make_user("colleague")
    WorkspaceMember.objects.create(workspace=attacker_workspace, member=other_owner, role=20)
    project = _make_project("Sibling Project", "SIB", attacker_workspace, other_owner, [other_owner])
    return Issue.objects.create(name="Sibling project issue", project=project, workspace=attacker_workspace)


@pytest.fixture
def attacker_client(attacker):
    client = APIClient()
    client.force_authenticate(user=attacker)
    return client


@pytest.mark.contract
class TestIssueCommentCreateScope:
    """``issue_id`` must belong to the URL project, or the request 404s."""

    @pytest.mark.django_db
    def test_rejects_cross_workspace_issue(self, attacker_client, attacker_workspace, attacker_project, victim_issue):
        url = comments_url(attacker_workspace.slug, attacker_project.id, victim_issue.id)
        response = attacker_client.post(url, {"comment_html": "<p>hi</p>"}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        # No comment may be planted on the foreign issue...
        assert not IssueComment.objects.filter(issue_id=victim_issue.id).exists()
        # ...and none of its private detail may leak back in the response.
        assert "Confidential victim issue" not in str(getattr(response, "data", ""))
        assert "Secret roadmap detail" not in str(getattr(response, "data", ""))

    @pytest.mark.django_db
    def test_rejects_same_workspace_other_project_issue(
        self, attacker_client, attacker_workspace, attacker_project, sibling_project_issue
    ):
        url = comments_url(attacker_workspace.slug, attacker_project.id, sibling_project_issue.id)
        response = attacker_client.post(url, {"comment_html": "<p>hi</p>"}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert not IssueComment.objects.filter(issue_id=sibling_project_issue.id).exists()

    @pytest.mark.django_db
    def test_allows_own_project_issue(self, attacker_client, attacker_workspace, attacker_project, attacker_issue):
        """Positive control: commenting on an issue in the URL project still works."""
        url = comments_url(attacker_workspace.slug, attacker_project.id, attacker_issue.id)
        response = attacker_client.post(url, {"comment_html": "<p>hi</p>"}, format="json")

        assert response.status_code == status.HTTP_201_CREATED, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert IssueComment.objects.filter(issue_id=attacker_issue.id).exists()


@pytest.mark.contract
class TestIssueRelationCreateScope:
    """The URL side of the relation must belong to the URL project too."""

    @pytest.mark.django_db
    def test_rejects_cross_workspace_url_issue(
        self, attacker_client, attacker_workspace, attacker_project, attacker_issue, victim_issue
    ):
        url = relation_url(attacker_workspace.slug, attacker_project.id, victim_issue.id)
        response = attacker_client.post(
            url, {"relation_type": "blocking", "issues": [str(attacker_issue.id)]}, format="json"
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert not IssueRelation.objects.filter(related_issue_id=victim_issue.id).exists()
        assert not IssueRelation.objects.filter(issue_id=victim_issue.id).exists()

    @pytest.mark.django_db
    def test_rejects_same_workspace_other_project_url_issue(
        self,
        attacker_client,
        attacker_workspace,
        attacker_project,
        attacker_issue,
        sibling_project_issue,
    ):
        url = relation_url(attacker_workspace.slug, attacker_project.id, sibling_project_issue.id)
        response = attacker_client.post(
            url, {"relation_type": "blocking", "issues": [str(attacker_issue.id)]}, format="json"
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert not IssueRelation.objects.filter(related_issue_id=sibling_project_issue.id).exists()

    @pytest.mark.django_db
    def test_allows_relation_within_project(
        self, attacker_client, attacker_workspace, attacker_project, attacker_issue
    ):
        """Positive control: relating two issues inside the URL project still works."""
        other = Issue.objects.create(name="Second own issue", project=attacker_project, workspace=attacker_workspace)
        url = relation_url(attacker_workspace.slug, attacker_project.id, attacker_issue.id)
        response = attacker_client.post(url, {"relation_type": "blocking", "issues": [str(other.id)]}, format="json")

        assert response.status_code == status.HTTP_201_CREATED, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert IssueRelation.objects.filter(issue_id=other.id, related_issue_id=attacker_issue.id).exists()
