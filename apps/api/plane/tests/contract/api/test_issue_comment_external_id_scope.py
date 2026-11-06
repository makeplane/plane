# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests: comment ``external_source``/``external_id`` is unique per work item.

The external API rejects a comment whose ``external_source``/``external_id`` pair
is already used on the same work item (409). The same pair on a different work
item in the project is allowed, matching how work item attachments are scoped.
"""

from unittest import mock

import pytest
from rest_framework import status

from plane.db.models import Issue, IssueComment, Project, ProjectMember, State


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Comment Scope Project",
        identifier="CSP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20, is_active=True)
    return project


@pytest.fixture
def state(db, workspace, project):
    return State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)


def _make_issue(workspace, project, state, user, name):
    issue = Issue(name=name, workspace=workspace, project=project, state=state)
    issue.save(created_by_id=user.id)
    return issue


@pytest.fixture
def issue_a(db, workspace, project, state, create_user):
    return _make_issue(workspace, project, state, create_user, "Work item A")


@pytest.fixture
def issue_b(db, workspace, project, state, create_user):
    return _make_issue(workspace, project, state, create_user, "Work item B")


@pytest.fixture(autouse=True)
def _mock_activity_tasks():
    with mock.patch("plane.api.views.issue.issue_activity"), mock.patch("plane.api.views.issue.model_activity"):
        yield


def _comments_url(workspace, project, issue):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-items/{issue.id}/comments/"


def _comment_url(workspace, project, issue, comment_id):
    return f"{_comments_url(workspace, project, issue)}{comment_id}/"


def _payload(external_id, external_source="probe", html="<p>probe</p>"):
    return {"comment_html": html, "external_source": external_source, "external_id": external_id}


@pytest.mark.contract
class TestIssueCommentExternalIdCreate:
    @pytest.mark.django_db
    def test_same_pair_on_two_work_items_is_allowed(self, api_key_client, workspace, project, issue_a, issue_b):
        response_a = api_key_client.post(_comments_url(workspace, project, issue_a), _payload("scope-1"), format="json")
        response_b = api_key_client.post(_comments_url(workspace, project, issue_b), _payload("scope-1"), format="json")

        assert response_a.status_code == status.HTTP_201_CREATED
        assert response_b.status_code == status.HTTP_201_CREATED
        assert str(response_b.data["issue"]) == str(issue_b.id)
        assert IssueComment.objects.filter(external_source="probe", external_id="scope-1").count() == 2

    @pytest.mark.django_db
    def test_repeat_on_same_work_item_conflicts(self, api_key_client, workspace, project, issue_a):
        url = _comments_url(workspace, project, issue_a)
        first = api_key_client.post(url, _payload("scope-1"), format="json")
        repeat = api_key_client.post(url, _payload("scope-1"), format="json")

        assert first.status_code == status.HTTP_201_CREATED
        assert repeat.status_code == status.HTTP_409_CONFLICT
        assert repeat.data["id"] == str(first.data["id"])
        assert IssueComment.objects.filter(issue=issue_a, external_id="scope-1").count() == 1

    @pytest.mark.django_db
    def test_conflict_returns_comment_on_the_same_work_item(
        self, api_key_client, workspace, project, issue_a, issue_b, create_user
    ):
        """The 409 ``id`` must point at this work item's comment, not a newer one elsewhere."""
        on_a = api_key_client.post(_comments_url(workspace, project, issue_a), _payload("scope-1"), format="json")
        # A newer comment with the same pair on another work item (comments are ordered newest first).
        IssueComment.objects.create(
            issue=issue_b,
            project=project,
            workspace=workspace,
            actor=create_user,
            comment_html="<p>probe</p>",
            external_source="probe",
            external_id="scope-1",
        )

        repeat = api_key_client.post(_comments_url(workspace, project, issue_a), _payload("scope-1"), format="json")

        assert repeat.status_code == status.HTTP_409_CONFLICT
        assert repeat.data["id"] == str(on_a.data["id"])

    @pytest.mark.django_db
    def test_same_id_with_different_source_is_allowed(self, api_key_client, workspace, project, issue_a):
        url = _comments_url(workspace, project, issue_a)
        first = api_key_client.post(url, _payload("scope-1", external_source="github"), format="json")
        second = api_key_client.post(url, _payload("scope-1", external_source="gitlab"), format="json")

        assert first.status_code == status.HTTP_201_CREATED
        assert second.status_code == status.HTTP_201_CREATED


@pytest.mark.contract
class TestIssueCommentExternalIdUpdate:
    @pytest.mark.django_db
    def test_update_to_pair_used_on_another_work_item_is_allowed(
        self, api_key_client, workspace, project, issue_a, issue_b
    ):
        api_key_client.post(_comments_url(workspace, project, issue_a), _payload("scope-1"), format="json")
        on_b = api_key_client.post(_comments_url(workspace, project, issue_b), _payload("scope-2"), format="json")

        response = api_key_client.patch(
            _comment_url(workspace, project, issue_b, on_b.data["id"]),
            {"external_source": "probe", "external_id": "scope-1"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["external_id"] == "scope-1"

    @pytest.mark.django_db
    def test_update_to_pair_used_on_same_work_item_conflicts(self, api_key_client, workspace, project, issue_a):
        url = _comments_url(workspace, project, issue_a)
        existing = api_key_client.post(url, _payload("scope-1"), format="json")
        other = api_key_client.post(url, _payload("scope-2"), format="json")

        response = api_key_client.patch(
            _comment_url(workspace, project, issue_a, other.data["id"]),
            {"external_source": "probe", "external_id": "scope-1"},
            format="json",
        )

        assert response.status_code == status.HTTP_409_CONFLICT
        # Like create, the 409 points at the comment that already holds the pair.
        assert response.data["id"] == str(existing.data["id"])
        assert IssueComment.objects.get(pk=other.data["id"]).external_id == "scope-2"

    @pytest.mark.django_db
    def test_update_only_source_to_pair_used_on_same_work_item_conflicts(
        self, api_key_client, workspace, project, issue_a
    ):
        url = _comments_url(workspace, project, issue_a)
        existing = api_key_client.post(url, _payload("scope-1", external_source="github"), format="json")
        other = api_key_client.post(url, _payload("scope-1", external_source="gitlab"), format="json")

        response = api_key_client.patch(
            _comment_url(workspace, project, issue_a, other.data["id"]),
            {"external_source": "github"},
            format="json",
        )

        assert response.status_code == status.HTTP_409_CONFLICT
        assert response.data["id"] == str(existing.data["id"])
        assert IssueComment.objects.get(pk=other.data["id"]).external_source == "gitlab"

    @pytest.mark.django_db
    def test_update_resending_own_pair_is_allowed(self, api_key_client, workspace, project, issue_a):
        created = api_key_client.post(_comments_url(workspace, project, issue_a), _payload("scope-1"), format="json")

        response = api_key_client.patch(
            _comment_url(workspace, project, issue_a, created.data["id"]),
            {"comment_html": "<p>edited</p>", "external_source": "probe", "external_id": "scope-1"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["comment_html"] == "<p>edited</p>"
