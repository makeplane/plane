# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contracts for dependency integrity and atomic Gantt scheduling."""

from datetime import date
from threading import Event, Thread
from unittest.mock import patch
from uuid import uuid4

import pytest
from django.db import close_old_connections, connection, transaction
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Issue, IssueRelation, Project, ProjectMember, State, User, Workspace, WorkspaceMember


@pytest.fixture
def gantt_project(db, workspace, create_user):
    project = Project.objects.create(
        name="Gantt Project", identifier="GANTT", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(
        project=project, workspace=workspace, member=create_user, role=15, is_active=True
    )
    return project


@pytest.fixture
def gantt_issues(db, workspace, gantt_project):
    state = State.objects.create(
        name="Todo", project=gantt_project, workspace=workspace, group="backlog", default=True
    )
    return {
        name: Issue.objects.create(
            name=name,
            project=gantt_project,
            workspace=workspace,
            state=state,
            start_date=date(2026, 11, start),
            target_date=date(2026, 11, end),
        )
        for name, start, end in [("A", 1, 3), ("B", 4, 6), ("C", 7, 9)]
    }


@pytest.fixture(autouse=True)
def activity_task():
    # Both issue views import the same Celery task object.
    with patch("plane.app.views.issue.relation.issue_activity.delay") as activity:
        yield activity


def _project_url(project, path):
    return f"/api/workspaces/{project.workspace.slug}/projects/{project.id}/{path}/"


def _relation_url(issue, remove=False):
    action = "remove-relation" if remove else "issue-relation"
    return _project_url(issue.project, f"issues/{issue.id}/{action}")


def _link(predecessor, successor):
    return IssueRelation.objects.create(
        issue=successor,
        related_issue=predecessor,
        relation_type="blocked_by",
        project=successor.project,
        workspace=successor.workspace,
    )


def _chain(issues):
    _link(issues["A"], issues["B"])
    _link(issues["B"], issues["C"])


def _change(issue, **overrides):
    return {"id": str(issue.id), "start_date": "2026-11-01", "target_date": "2026-11-05", **overrides}


def _dates(issues):
    result = {}
    for name, issue in issues.items():
        issue.refresh_from_db()
        result[name] = (issue.start_date, issue.target_date)
    return result


def _expected(updates):
    return [
        {"id": item["id"], "start_date": item["new_start"], "target_date": item["new_end"]}
        for item in updates
    ]


@pytest.mark.contract
@pytest.mark.django_db
class TestGanttRelations:
    @pytest.mark.parametrize("relation_type", ["blocked_by", "blocking"])
    def test_self_link_rejected(self, session_client, gantt_issues, relation_type, activity_task):
        issue = gantt_issues["A"]
        response = session_client.post(
            _relation_url(issue), {"relation_type": relation_type, "issues": [str(issue.id)]}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data == {"message": "An issue cannot block itself"}
        assert not IssueRelation.objects.exists()
        activity_task.assert_not_called()

    @pytest.mark.parametrize("length", [2, 3])
    @pytest.mark.parametrize("relation_type", ["blocked_by", "blocking"])
    def test_cycle_rejected_without_partial_creation(
        self, session_client, gantt_issues, gantt_project, length, relation_type, activity_task
    ):
        a, b, c = (gantt_issues[name] for name in "ABC")
        _link(a, b)
        last = b
        if length == 3:
            _link(b, c)
            last = c
        extra = Issue.objects.create(name="Unrelated", project=gantt_project, workspace=gantt_project.workspace)
        source, target = (a, last) if relation_type == "blocked_by" else (last, a)
        before = IssueRelation.objects.count()

        response = session_client.post(
            _relation_url(source),
            {"relation_type": relation_type, "issues": [str(extra.id), str(target.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["message"] == "Circular dependency"
        assert response.data["cycle"][0] == response.data["cycle"][-1]
        assert set(response.data["cycle"]) == {str(gantt_issues[name].id) for name in "ABC"[:length]}
        assert IssueRelation.objects.count() == before
        activity_task.assert_not_called()

    def test_duplicate_still_succeeds(self, session_client, gantt_issues):
        a, b = gantt_issues["A"], gantt_issues["B"]
        body = {"relation_type": "blocked_by", "issues": [str(a.id)]}

        for _ in range(2):
            response = session_client.post(_relation_url(b), body, format="json")
            assert response.status_code == status.HTTP_201_CREATED
        assert IssueRelation.objects.filter(issue=b, related_issue=a).count() == 1

    def test_cycle_through_another_project_is_rejected(
        self, session_client, workspace, gantt_issues, activity_task
    ):
        other = Project.objects.create(name="Other", identifier="OTHER", workspace=workspace)
        foreign = Issue.objects.create(name="Foreign", project=other, workspace=workspace)
        a, b = gantt_issues["A"], gantt_issues["B"]
        _link(a, foreign)
        _link(foreign, b)

        response = session_client.post(
            _relation_url(a), {"relation_type": "blocked_by", "issues": [str(b.id)]}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["message"] == "Circular dependency"
        assert set(response.data["cycle"]) == {str(a.id), str(b.id), str(foreign.id)}
        assert IssueRelation.objects.count() == 2
        activity_task.assert_not_called()

    def test_remove_missing_returns_404(self, session_client, gantt_issues, activity_task):
        response = session_client.post(
            _relation_url(gantt_issues["A"], remove=True),
            {"related_issue": str(gantt_issues["B"].id)},
            format="json",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.data == {"message": "Relation not found"}
        activity_task.assert_not_called()


@pytest.mark.contract
@pytest.mark.django_db
class TestGanttSchedule:
    @pytest.mark.parametrize("dry_run", [True, False])
    def test_chain_dry_run_and_apply(
        self, session_client, gantt_project, gantt_issues, dry_run, activity_task, django_capture_on_commit_callbacks
    ):
        _chain(gantt_issues)
        before = _dates(gantt_issues)
        with django_capture_on_commit_callbacks(execute=True):
            response = session_client.post(
                _project_url(gantt_project, "issue-schedule"),
                {"change": _change(gantt_issues["A"]), "include_successors": True, "dry_run": dry_run},
                format="json",
            )
            activity_task.assert_not_called()

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {
            "updates": [
                {
                    "id": str(gantt_issues["B"].id),
                    "old_start": "2026-11-04", "old_end": "2026-11-06",
                    "new_start": "2026-11-06", "new_end": "2026-11-08",
                },
                {
                    "id": str(gantt_issues["C"].id),
                    "old_start": "2026-11-07", "old_end": "2026-11-09",
                    "new_start": "2026-11-09", "new_end": "2026-11-11",
                },
            ],
            "warnings": [],
        }
        if dry_run:
            assert _dates(gantt_issues) == before
            activity_task.assert_not_called()
        else:
            assert _dates(gantt_issues) == {
                "A": (date(2026, 11, 1), date(2026, 11, 5)),
                "B": (date(2026, 11, 6), date(2026, 11, 8)),
                "C": (date(2026, 11, 9), date(2026, 11, 11)),
            }
            assert activity_task.call_count == 5

    def test_matching_expected_applies(self, session_client, gantt_project, gantt_issues):
        _chain(gantt_issues)
        url = _project_url(gantt_project, "issue-schedule")
        body = {"change": _change(gantt_issues["A"]), "include_successors": True}
        preview = session_client.post(url, {**body, "dry_run": True}, format="json")
        assert preview.status_code == status.HTTP_200_OK

        response = session_client.post(url, {**body, "expected": _expected(preview.json()["updates"])}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert _dates(gantt_issues)["C"] == (date(2026, 11, 9), date(2026, 11, 11))

    def test_multiple_predecessors(self, session_client, gantt_project, gantt_issues):
        _chain(gantt_issues)
        predecessor = Issue.objects.create(
            name="P", project=gantt_project, workspace=gantt_project.workspace,
            start_date=date(2026, 11, 1), target_date=date(2026, 11, 10),
        )
        _link(predecessor, gantt_issues["B"])

        response = session_client.post(
            _project_url(gantt_project, "issue-schedule"),
            {"change": _change(gantt_issues["A"]), "include_successors": True},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        dates = _dates(gantt_issues)
        assert dates["B"] == (date(2026, 11, 11), date(2026, 11, 13))
        assert dates["C"] == (date(2026, 11, 14), date(2026, 11, 16))
        predecessor.refresh_from_db()
        assert predecessor.target_date == date(2026, 11, 10)

    @pytest.mark.parametrize("mismatch", ["ids", "dates"])
    def test_expected_mismatch_is_atomic(self, session_client, gantt_project, gantt_issues, activity_task, mismatch):
        _chain(gantt_issues)
        before = _dates(gantt_issues)
        expected = [] if mismatch == "ids" else [
            {"id": str(gantt_issues["B"].id), "start_date": "2026-11-07", "target_date": "2026-11-09"},
            {"id": str(gantt_issues["C"].id), "start_date": "2026-11-09", "target_date": "2026-11-11"},
        ]

        response = session_client.post(
            _project_url(gantt_project, "issue-schedule"),
            {"change": _change(gantt_issues["A"]), "include_successors": True, "expected": expected},
            format="json",
        )

        assert response.status_code == status.HTTP_409_CONFLICT
        assert response.data["message"] == "Schedule changed"
        assert len(response.data["updates"]) == 2
        assert response.data["warnings"] == []
        assert _dates(gantt_issues) == before
        activity_task.assert_not_called()

    def test_cycle_is_atomic(self, session_client, gantt_project, gantt_issues, activity_task):
        _chain(gantt_issues)
        _link(gantt_issues["C"], gantt_issues["A"])
        before = _dates(gantt_issues)

        response = session_client.post(
            _project_url(gantt_project, "issue-schedule"),
            {"change": _change(gantt_issues["A"]), "include_successors": True},
            format="json",
        )

        assert response.status_code == status.HTTP_409_CONFLICT
        assert response.data["message"] == "Circular dependency"
        assert response.data["cycle"][0] == response.data["cycle"][-1]
        assert _dates(gantt_issues) == before
        activity_task.assert_not_called()

    @pytest.mark.parametrize("role", [5, 10])
    def test_guest_and_viewer_denied(self, workspace, gantt_project, gantt_issues, role, activity_task):
        user = User.objects.create(email=f"gantt-{uuid4().hex}@plane.so", username=uuid4().hex, first_name="Read only")
        WorkspaceMember.objects.create(workspace=workspace, member=user, role=15, is_active=True)
        ProjectMember.objects.create(
            project=gantt_project, workspace=workspace, member=user, role=role, is_active=True
        )
        client = APIClient()
        client.force_authenticate(user=user)

        response = client.post(
            _project_url(gantt_project, "issue-schedule"),
            {"change": _change(gantt_issues["A"]), "include_successors": True},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        activity_task.assert_not_called()

    def test_non_member_denied(self, workspace, gantt_project, gantt_issues, activity_task):
        user = User.objects.create(email=f"outsider-{uuid4().hex}@plane.so", username=uuid4().hex, first_name="Outsider")
        WorkspaceMember.objects.create(workspace=workspace, member=user, role=15, is_active=True)
        client = APIClient()
        client.force_authenticate(user=user)

        response = client.post(
            _project_url(gantt_project, "issue-schedule"),
            {"change": _change(gantt_issues["A"]), "include_successors": True},
            format="json",
        )

        assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)
        activity_task.assert_not_called()

    def test_other_project_issue_not_found(self, session_client, workspace, gantt_project, activity_task):
        other = Project.objects.create(name="Other", identifier="OTHER", workspace=workspace)
        issue = Issue.objects.create(
            name="Foreign", project=other, workspace=workspace,
            start_date=date(2026, 11, 1), target_date=date(2026, 11, 3),
        )

        response = session_client.post(
            _project_url(gantt_project, "issue-schedule"),
            {"change": _change(issue), "include_successors": True},
            format="json",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        issue.refresh_from_db()
        assert issue.target_date == date(2026, 11, 3)
        activity_task.assert_not_called()

    def test_cross_project_predecessor_is_ignored(self, session_client, workspace, gantt_project, gantt_issues):
        _chain(gantt_issues)
        other = Project.objects.create(name="Other", identifier="OTHER", workspace=workspace)
        predecessor = Issue.objects.create(
            name="Foreign predecessor", project=other, workspace=workspace,
            start_date=date(2026, 11, 1), target_date=date(2026, 11, 20),
        )
        _link(predecessor, gantt_issues["B"])

        response = session_client.post(
            _project_url(gantt_project, "issue-schedule"),
            {"change": _change(gantt_issues["A"]), "include_successors": True},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert _dates(gantt_issues)["B"] == (date(2026, 11, 6), date(2026, 11, 8))
        predecessor.refresh_from_db()
        assert predecessor.target_date == date(2026, 11, 20)

    @pytest.mark.parametrize("overrides", [
        {"id": "not-a-uuid"}, {"start_date": "2026-02-30"},
        {"target_date": "20261105"}, {"start_date": "2026-11-06"},
    ])
    def test_invalid_change_is_atomic(
        self, session_client, gantt_project, gantt_issues, overrides, activity_task
    ):
        before = _dates(gantt_issues)
        response = session_client.post(
            _project_url(gantt_project, "issue-schedule"),
            {"change": _change(gantt_issues["A"], **overrides), "include_successors": True},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert _dates(gantt_issues) == before
        activity_task.assert_not_called()


    def test_change_only_leaves_successors_unchanged(self, session_client, gantt_project, gantt_issues):
        _chain(gantt_issues)
        before = _dates(gantt_issues)
        response = session_client.post(
            _project_url(gantt_project, "issue-schedule"),
            {"change": _change(gantt_issues["A"]), "include_successors": False},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        dates = _dates(gantt_issues)
        assert dates["A"] == (date(2026, 11, 1), date(2026, 11, 5))
        assert dates["B"] == before["B"]
        assert dates["C"] == before["C"]

    def test_partial_change_can_clear_date(
        self, session_client, gantt_project, gantt_issues, activity_task, django_capture_on_commit_callbacks
    ):
        _chain(gantt_issues)
        before = _dates(gantt_issues)
        with django_capture_on_commit_callbacks(execute=True):
            response = session_client.post(
                _project_url(gantt_project, "issue-schedule"),
                {"change": {"id": str(gantt_issues["A"].id), "target_date": None}, "include_successors": False},
                format="json",
            )

        assert response.status_code == status.HTTP_200_OK
        dates = _dates(gantt_issues)
        assert dates["A"] == (date(2026, 11, 1), None)
        assert dates["B"] == before["B"]
        assert dates["C"] == before["C"]
        assert activity_task.call_count == 1

    def test_partial_invalid_range_is_atomic(self, session_client, gantt_project, gantt_issues, activity_task):
        before = _dates(gantt_issues)
        response = session_client.post(
            _project_url(gantt_project, "issue-schedule"),
            {"change": {"id": str(gantt_issues["A"].id), "start_date": "2026-11-04"}},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert _dates(gantt_issues) == before
        activity_task.assert_not_called()

    @pytest.mark.parametrize("option", ["include_successors", "dry_run"])
    def test_boolean_options_are_validated(
        self, session_client, gantt_project, gantt_issues, activity_task, option
    ):
        before = _dates(gantt_issues)
        response = session_client.post(
            _project_url(gantt_project, "issue-schedule"),
            {"change": _change(gantt_issues["A"]), option: "false"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert _dates(gantt_issues) == before
        activity_task.assert_not_called()

    def test_more_than_2000_successors_is_atomic(
        self, session_client, gantt_project, gantt_issues, activity_task
    ):
        before = _dates(gantt_issues)
        successors = Issue.objects.bulk_create([
            Issue(
                name=f"Successor {index}", project=gantt_project, workspace=gantt_project.workspace,
                sequence_id=index + 100, start_date=date(2026, 11, 4), target_date=date(2026, 11, 6),
            )
            for index in range(2001)
        ])
        IssueRelation.objects.bulk_create([
            IssueRelation(
                issue=successor, related_issue=gantt_issues["A"], relation_type="blocked_by",
                project=gantt_project, workspace=gantt_project.workspace,
            )
            for successor in successors
        ])

        response = session_client.post(
            _project_url(gantt_project, "issue-schedule"),
            {"change": _change(gantt_issues["A"]), "include_successors": True},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert _dates(gantt_issues) == before
        assert Issue.objects.filter(id__in=[issue.id for issue in successors]).exclude(
            start_date=date(2026, 11, 4), target_date=date(2026, 11, 6)
        ).count() == 0
        activity_task.assert_not_called()

    def test_bulk_dates_invalid_update_has_no_writes_or_activity(
        self, session_client, gantt_project, gantt_issues, activity_task
    ):
        before = _dates(gantt_issues)
        response = session_client.post(
            _project_url(gantt_project, "issue-dates"),
            {"updates": [
                {"id": str(gantt_issues["A"].id), "target_date": "2026-11-05"},
                {"id": str(gantt_issues["B"].id), "start_date": "2026-11-10", "target_date": "2026-11-06"},
            ]},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert _dates(gantt_issues) == before
        activity_task.assert_not_called()


@pytest.mark.contract
@pytest.mark.django_db(transaction=True)
def test_schedule_reads_dependency_graph_after_workspace_lock(
    session_client, workspace, gantt_project, gantt_issues, create_user, activity_task
):
    if connection.vendor != "postgresql":
        pytest.skip("Requires PostgreSQL row locks and independent transactions")

    _chain(gantt_issues)
    extra = Issue.objects.create(
        name="New successor", project=gantt_project, workspace=workspace,
        start_date=date(2026, 11, 4), target_date=date(2026, 11, 6),
    )
    before = _dates({**gantt_issues, "D": extra})
    url = _project_url(gantt_project, "issue-schedule")
    body = {"change": _change(gantt_issues["A"]), "include_successors": True}
    preview = session_client.post(url, {**body, "dry_run": True}, format="json")
    assert preview.status_code == status.HTTP_200_OK
    body["expected"] = _expected(preview.json()["updates"])
    locking = Event()
    outcome = {}

    def signal_lock(execute, sql, params, many, context):
        if "FOR UPDATE" in sql.upper() and '"workspaces"' in sql.lower():
            locking.set()
        return execute(sql, params, many, context)

    def schedule():
        close_old_connections()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SET statement_timeout = 10000")
            client = APIClient()
            client.force_authenticate(user=create_user)
            with connection.execute_wrapper(signal_lock):
                outcome["response"] = client.post(url, body, format="json")
        except Exception as exc:
            outcome["error"] = exc
        finally:
            connection.close()

    worker = Thread(target=schedule, daemon=True)
    try:
        with transaction.atomic():
            Workspace.objects.select_for_update().get(pk=workspace.id)
            worker.start()
            assert locking.wait(timeout=10), f"Schedule never reached its workspace lock: {outcome!r}"
            # The graph changes while scheduling waits for the shared workspace lock.
            _link(gantt_issues["A"], extra)
    finally:
        if worker.ident is not None:
            worker.join(timeout=15)

    assert not worker.is_alive(), "Schedule worker did not finish after the workspace lock was released"
    assert "error" not in outcome, repr(outcome.get("error"))
    response = outcome["response"]
    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.data["message"] == "Schedule changed"
    assert {item["id"] for item in response.data["updates"]} == {
        str(gantt_issues["B"].id), str(gantt_issues["C"].id), str(extra.id),
    }
    assert _dates({**gantt_issues, "D": extra}) == before
    activity_task.assert_not_called()
