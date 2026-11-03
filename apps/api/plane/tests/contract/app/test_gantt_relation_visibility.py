# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""A related issue the requester cannot read must never leak its name, code or state."""

from unittest.mock import patch

import pytest
from rest_framework import status

from plane.db.models import Issue, IssueRelation, Project, ProjectMember, State, User

SPARSE = {"id", "project_id", "relation_type"}


@pytest.fixture(autouse=True)
def no_recent_visit_task():
    with patch("plane.app.views.issue.base.recent_visited_task.delay"):
        yield


def _project(workspace, user, identifier, role, guest_view_all=False):
    project = Project.objects.create(
        name=identifier, identifier=identifier, workspace=workspace, created_by=user, guest_view_all_features=guest_view_all
    )
    if role is not None:
        ProjectMember.objects.create(project=project, workspace=workspace, member=user, role=role, is_active=True)
    State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)
    return project


def _issue(project, name, creator=None):
    issue = Issue.objects.create(name=name, project=project, workspace=project.workspace)
    # BaseModel.save resets created_by without a request user, so set it directly.
    Issue.objects.filter(id=issue.id).update(created_by=creator)
    issue.refresh_from_db()
    return issue


def _link(predecessor, successor):
    return IssueRelation.objects.create(
        issue=successor,
        related_issue=predecessor,
        relation_type="blocked_by",
        project=successor.project,
        workspace=successor.workspace,
    )


def _base(project):
    return f"/api/workspaces/{project.workspace.slug}/projects/{project.id}"


def _rows(response):
    data = response.json()
    return data["results"] if isinstance(data, dict) and "results" in data else data


def _list(session_client, project, issue):
    response = session_client.get(f"{_base(project)}/issues/list/", {"issues": str(issue.id), "expand": "issue_relation,issue_related"})
    assert response.status_code == status.HTTP_200_OK
    return next(row for row in _rows(response) if row["id"] == str(issue.id))


@pytest.fixture
def other_user(db):
    return User.objects.create(email="other@plane.so", username="other_user")


@pytest.mark.contract
@pytest.mark.django_db
class TestRelationVisibility:
    def test_list_expand_is_sparse_in_both_directions(self, session_client, workspace, create_user):
        a = _project(workspace, create_user, "AAA", 15)
        hidden = _project(workspace, create_user, "HID", None)
        mine, before, after = _issue(a, "mine"), _issue(hidden, "SECRET-BEFORE"), _issue(hidden, "SECRET-AFTER")
        _link(before, mine)
        _link(mine, after)

        row = _list(session_client, a, mine)

        assert [set(item) for item in row["issue_relation"]] == [SPARSE]
        assert [set(item) for item in row["issue_related"]] == [SPARSE]
        assert "SECRET" not in str(row)

    def test_list_expand_keeps_member_project_details(self, session_client, workspace, create_user):
        a, b = _project(workspace, create_user, "AAA", 15), _project(workspace, create_user, "BBB", 15)
        mine, other = _issue(a, "mine"), _issue(b, "visible-name")
        _link(other, mine)

        row = _list(session_client, a, mine)

        assert row["issue_relation"][0]["name"] == "visible-name"

    def test_deleted_project_is_hidden(self, session_client, workspace, create_user):
        a, gone = _project(workspace, create_user, "AAA", 15), _project(workspace, create_user, "GON", 15)
        mine, other = _issue(a, "mine"), _issue(gone, "SECRET-GONE")
        _link(other, mine)
        Project.objects.filter(id=gone.id).update(deleted_at="2026-11-01T00:00:00Z")

        row = _list(session_client, a, mine)

        assert "SECRET" not in str(row)

    def test_restricted_guest_only_sees_own_issues(self, session_client, workspace, create_user, other_user):
        a = _project(workspace, create_user, "AAA", 5)
        mine, theirs, own = _issue(a, "mine", create_user), _issue(a, "SECRET-THEIRS", other_user), _issue(a, "own-name", create_user)
        _link(theirs, mine)
        _link(own, mine)

        row = _list(session_client, a, mine)

        by_id = {item["id"]: item for item in row["issue_relation"]}
        assert set(by_id[str(theirs.id)]) == SPARSE
        assert by_id[str(own.id)]["name"] == "own-name"

    def test_relation_endpoint_leaves_out_unreadable_issues(self, session_client, workspace, create_user):
        a = _project(workspace, create_user, "AAA", 15)
        hidden = _project(workspace, create_user, "HID", None)
        mine, secret = _issue(a, "mine"), _issue(hidden, "SECRET-REL")
        _link(secret, mine)

        response = session_client.get(f"{_base(a)}/issues/{mine.id}/issue-relation/")

        assert response.status_code == status.HTTP_200_OK
        assert "SECRET" not in str(response.json())
        assert response.json()["blocked_by"] == []
