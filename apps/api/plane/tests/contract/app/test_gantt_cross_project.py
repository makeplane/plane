# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contracts for the workspace-level (cross-project) Gantt schedule endpoint."""

from datetime import date
from unittest.mock import patch

import pytest
from rest_framework import status

from plane.db.models import Issue, IssueRelation, Project, ProjectMember, State


@pytest.fixture(autouse=True)
def activity_task():
    with patch("plane.app.views.issue.bih_schedule.issue_activity.delay") as activity:
        yield activity


def _project(workspace, user, identifier, role):
    project = Project.objects.create(name=identifier, identifier=identifier, workspace=workspace, created_by=user)
    if role is not None:
        ProjectMember.objects.create(project=project, workspace=workspace, member=user, role=role, is_active=True)
    State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)
    return project


def _issue(project, start, end):
    return Issue.objects.create(
        name=f"{project.identifier}-{start}",
        project=project,
        workspace=project.workspace,
        start_date=date(2026, 11, start),
        target_date=date(2026, 11, end),
    )


def _link(predecessor, successor):
    return IssueRelation.objects.create(
        issue=successor,
        related_issue=predecessor,
        relation_type="blocked_by",
        project=successor.project,
        workspace=successor.workspace,
    )


def _url(workspace):
    return f"/api/workspaces/{workspace.slug}/issue-schedule/"


def _change(issue, start="2026-11-01", end="2026-11-05"):
    return {"id": str(issue.id), "start_date": start, "target_date": end}


def _dates(*issues):
    result = []
    for issue in issues:
        issue.refresh_from_db()
        result.append((issue.start_date, issue.target_date))
    return result


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceSchedule:
    def test_moves_successor_in_other_project(
        self, session_client, workspace, create_user, activity_task, django_capture_on_commit_callbacks
    ):
        a, b = _project(workspace, create_user, "AAA", 15), _project(workspace, create_user, "BBB", 20)
        first, second = _issue(a, 1, 3), _issue(b, 4, 6)
        _link(first, second)

        with django_capture_on_commit_callbacks(execute=True):
            response = session_client.post(
                _url(workspace), {"change": _change(first), "include_successors": True}, format="json"
            )

        assert response.status_code == status.HTTP_200_OK
        assert [update["id"] for update in response.json()["updates"]] == [str(second.id)]
        assert _dates(second) == [(date(2026, 11, 6), date(2026, 11, 8))]
        assert {call.kwargs["project_id"] for call in activity_task.call_args_list} == {str(a.id), str(b.id)}

    def test_non_member_project_is_invisible_and_untouched(self, session_client, workspace, create_user):
        a, hidden = _project(workspace, create_user, "AAA", 15), _project(workspace, create_user, "HID", None)
        first, second = _issue(a, 1, 3), _issue(hidden, 4, 6)
        _link(first, second)

        response = session_client.post(
            _url(workspace), {"change": _change(first), "include_successors": True}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {"updates": [], "warnings": [], "issues": {}}
        assert _dates(second) == [(date(2026, 11, 4), date(2026, 11, 6))]

    def test_change_in_non_member_project_is_404(self, session_client, workspace, create_user):
        hidden = _project(workspace, create_user, "HID", None)
        issue = _issue(hidden, 1, 3)

        response = session_client.post(_url(workspace), {"change": _change(issue)}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert _dates(issue) == [(date(2026, 11, 1), date(2026, 11, 3))]

    def test_change_in_guest_project_is_403(self, session_client, workspace, create_user):
        guest = _project(workspace, create_user, "GST", 5)
        issue = _issue(guest, 1, 3)

        response = session_client.post(_url(workspace), {"change": _change(issue)}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert _dates(issue) == [(date(2026, 11, 1), date(2026, 11, 3))]

    def test_guest_successor_is_fixed_with_warning_and_blocks_propagation(
        self, session_client, workspace, create_user
    ):
        a, guest = _project(workspace, create_user, "AAA", 15), _project(workspace, create_user, "GST", 5)
        first, fixed, tail = _issue(a, 1, 3), _issue(guest, 4, 6), _issue(a, 7, 9)
        _link(first, fixed)
        _link(fixed, tail)

        response = session_client.post(
            _url(workspace), {"change": _change(first, end="2026-11-10"), "include_successors": True}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert (body["updates"], body["warnings"]) == ([], [{"id": str(fixed.id), "reason": "no_permission"}])
        assert body["issues"][str(fixed.id)]["project_identifier"] == "GST"
        assert _dates(fixed, tail) == [(date(2026, 11, 4), date(2026, 11, 6)), (date(2026, 11, 7), date(2026, 11, 9))]

    def test_guest_predecessor_still_constrains(self, session_client, workspace, create_user):
        a, guest = _project(workspace, create_user, "AAA", 15), _project(workspace, create_user, "GST", 5)
        first, guest_pred, successor = _issue(a, 1, 3), _issue(guest, 1, 20), _issue(a, 4, 6)
        _link(first, successor)
        _link(guest_pred, successor)

        response = session_client.post(
            _url(workspace), {"change": _change(first, end="2026-11-05"), "include_successors": True}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        assert [(u["new_start"], u["new_end"]) for u in response.json()["updates"]] == [("2026-11-21", "2026-11-23")]

    def test_cycle_across_projects_is_409(self, session_client, workspace, create_user):
        a, b = _project(workspace, create_user, "AAA", 15), _project(workspace, create_user, "BBB", 15)
        first, second = _issue(a, 1, 3), _issue(b, 4, 6)
        _link(first, second)
        _link(second, first)

        response = session_client.post(_url(workspace), {"change": _change(first)}, format="json")

        assert response.status_code == status.HTTP_409_CONFLICT
        assert response.json()["message"] == "Circular dependency"
        assert _dates(first, second) == [(date(2026, 11, 1), date(2026, 11, 3)), (date(2026, 11, 4), date(2026, 11, 6))]

    def test_expected_mismatch_is_409_and_writes_nothing(self, session_client, workspace, create_user):
        a, b = _project(workspace, create_user, "AAA", 15), _project(workspace, create_user, "BBB", 15)
        first, second = _issue(a, 1, 3), _issue(b, 4, 6)
        _link(first, second)
        stale = [{"id": str(second.id), "start_date": "2026-11-20", "target_date": "2026-11-22"}]

        response = session_client.post(
            _url(workspace),
            {"change": _change(first), "include_successors": True, "expected": stale},
            format="json",
        )

        assert response.status_code == status.HTTP_409_CONFLICT
        assert response.json()["message"] == "Schedule changed"
        assert _dates(first, second) == [(date(2026, 11, 1), date(2026, 11, 3)), (date(2026, 11, 4), date(2026, 11, 6))]

    def test_dry_run_writes_nothing(self, session_client, workspace, create_user):
        a, b = _project(workspace, create_user, "AAA", 15), _project(workspace, create_user, "BBB", 15)
        first, second = _issue(a, 1, 3), _issue(b, 4, 6)
        _link(first, second)

        response = session_client.post(
            _url(workspace), {"change": _change(first), "dry_run": True}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()["updates"]) == 1
        assert _dates(first, second) == [(date(2026, 11, 1), date(2026, 11, 3)), (date(2026, 11, 4), date(2026, 11, 6))]
