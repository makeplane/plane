# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for the user-scoped pomodoro timer endpoints:

* ``GET  /api/users/me/pomodoro-timers/``
* ``POST /api/users/me/pomodoro-timers/``
* ``POST /api/users/me/pomodoro-timers/{pk}/pause/``
* ``POST /api/users/me/pomodoro-timers/{pk}/resume/``
* ``POST /api/users/me/pomodoro-timers/{pk}/complete/``
* ``POST /api/users/me/pomodoro-timers/{pk}/discard/``

A focus session is a backend-persisted, per-user timer. One active
(running/paused) timer is allowed per user. Completing a focus session
converts it into a ``TimeLog`` so it flows through the regular worklog
pipeline.
"""

from datetime import timedelta
from unittest.mock import patch

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Issue, PomodoroTimer, Project, ProjectMember, TimeLog, User


def _make_user(email: str) -> User:
    local_part = email.split("@")[0]
    user = User.objects.create(email=email, username=local_part, first_name=local_part)
    user.set_password("test-password")
    user.save()
    return user


def _add_project_member(project, user, *, role: int, is_active: bool = True) -> ProjectMember:
    return ProjectMember.objects.create(
        workspace=project.workspace, project=project, member=user, role=role, is_active=is_active
    )


def _make_issue(project, user, *, name: str) -> Issue:
    return Issue.objects.create(name=name, workspace=project.workspace, project=project, created_by=user)


def _pomodoro_url(pk=None, action=None):
    base = "/api/users/me/pomodoro-timers/"
    if pk is None and action is None:
        return base
    return f"{base}{pk}/{action}/" if action else f"{base}{pk}/"


@pytest.fixture
def project_with_issue(workspace, create_user):
    """A project with an admin member (create_user) and one work item."""
    project = Project.objects.create(
        name="Pomodoro Project", identifier="POMO", workspace=workspace, created_by=create_user
    )
    _add_project_member(project, create_user, role=20)
    project._issue = _make_issue(project, create_user, name="Focused work item")
    return project


@pytest.mark.contract
@pytest.mark.django_db
class TestPomodoroTimerStart:
    def test_member_starts_a_focus_session(self, workspace, project_with_issue, create_user):
        client = APIClient()
        client.force_authenticate(user=create_user)

        response = client.post(
            _pomodoro_url(),
            {"issue_id": str(project_with_issue._issue.id), "duration_minutes": 25},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["status"] == "running"
        assert response.data["issue"] == project_with_issue._issue.id
        assert response.data["duration_minutes"] == 25
        assert response.data["started_by"] == create_user.id
        assert response.data["issue_detail"]["id"] == project_with_issue._issue.id
        assert PomodoroTimer.objects.filter(id=response.data["id"]).exists()

    def test_duration_defaults_to_25_minutes(self, workspace, project_with_issue, create_user):
        client = APIClient()
        client.force_authenticate(user=create_user)

        response = client.post(
            _pomodoro_url(),
            {"issue_id": str(project_with_issue._issue.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["duration_minutes"] == 25

    def test_only_one_active_timer_per_user(self, workspace, project_with_issue, create_user):
        PomodoroTimer.objects.create(
            workspace=workspace,
            project=project_with_issue,
            issue=project_with_issue._issue,
            started_by=create_user,
            started_at=timezone.now(),
            duration_minutes=25,
        )

        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.post(
            _pomodoro_url(),
            {"issue_id": str(project_with_issue._issue.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_409_CONFLICT

    def test_non_member_cannot_start_on_an_issue(self, workspace, project_with_issue):
        outsider = User.objects.create(
            email="outsider@plane.so", username="outsider", first_name="outsider"
        )

        client = APIClient()
        client.force_authenticate(user=outsider)
        response = client.post(
            _pomodoro_url(),
            {"issue_id": str(project_with_issue._issue.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not PomodoroTimer.objects.exists()

    def test_missing_issue_is_rejected(self, workspace, project_with_issue, create_user):
        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.post(
            _pomodoro_url(),
            {"issue_id": "00000000-0000-0000-0000-000000000000"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_archived_issue_cannot_be_tracked(self, workspace, project_with_issue, create_user):
        archived_project = Project.objects.create(
            name="Archived Project", identifier="ARCH", workspace=workspace, created_by=create_user
        )
        _add_project_member(archived_project, create_user, role=20)
        archived_project.archived_at = timezone.now()
        archived_project.save()
        issue = _make_issue(archived_project, create_user, name="Archive issue")

        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.post(
            _pomodoro_url(),
            {"issue_id": str(issue.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
@pytest.mark.django_db
class TestPomodoroTimerPauseResume:
    def _start_timer(self, workspace, project_with_issue, create_user):
        return PomodoroTimer.objects.create(
            workspace=workspace,
            project=project_with_issue,
            issue=project_with_issue._issue,
            started_by=create_user,
            started_at=timezone.now() - timedelta(minutes=10),
            duration_minutes=25,
        )

    def test_pause_and_resume_preserves_elapsed_time(self, workspace, project_with_issue, create_user):
        timer = self._start_timer(workspace, project_with_issue, create_user)
        client = APIClient()
        client.force_authenticate(user=create_user)

        paused = client.post(_pomodoro_url(timer.id, "pause"))
        assert paused.status_code == status.HTTP_200_OK
        assert paused.data["status"] == "paused"
        assert paused.data["paused_seconds"] >= 10 * 60 - 5  # ~10 min elapsed before pausing

        resumed = client.post(_pomodoro_url(timer.id, "resume"))
        assert resumed.status_code == status.HTTP_200_OK
        assert resumed.data["status"] == "running"

        timer.refresh_from_db()
        assert timer.status == PomodoroTimer.Status.RUNNING

    def test_cannot_pause_a_paused_or_completed_timer(self, workspace, project_with_issue, create_user):
        timer = self._start_timer(workspace, project_with_issue, create_user)
        timer.status = PomodoroTimer.Status.PAUSED
        timer.save()

        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.post(_pomodoro_url(timer.id, "pause"))
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_resume_a_running_timer(self, workspace, project_with_issue, create_user):
        timer = self._start_timer(workspace, project_with_issue, create_user)

        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.post(_pomodoro_url(timer.id, "resume"))
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_users_cannot_act_on_someone_elses_timer(self, workspace, project_with_issue, create_user):
        timer = self._start_timer(workspace, project_with_issue, create_user)
        other = _make_user("other@plane.so")
        _add_project_member(project_with_issue, other, role=15)

        client = APIClient()
        client.force_authenticate(user=other)
        response = client.post(_pomodoro_url(timer.id, "pause"))
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.contract
@pytest.mark.django_db
class TestPomodoroTimerComplete:
    def _running_timer(self, workspace, project_with_issue, create_user, minutes_ago=20):
        return PomodoroTimer.objects.create(
            workspace=workspace,
            project=project_with_issue,
            issue=project_with_issue._issue,
            started_by=create_user,
            started_at=timezone.now() - timedelta(minutes=minutes_ago),
            duration_minutes=25,
        )

    @patch("plane.app.views.pomodoro.issue_activity")
    def test_completing_creates_a_time_log(self, mock_activity, workspace, project_with_issue, create_user):
        timer = self._running_timer(workspace, project_with_issue, create_user)
        client = APIClient()
        client.force_authenticate(user=create_user)

        response = client.post(_pomodoro_url(timer.id, "complete"))

        assert response.status_code == status.HTTP_200_OK
        time_log_data = response.data["time_log"]
        assert time_log_data["issue"] == project_with_issue._issue.id
        assert time_log_data["logged_by"] == create_user.id
        assert time_log_data["duration_minutes"] == 20
        assert time_log_data["description"] == "Pomodoro session"

        timer.refresh_from_db()
        assert timer.status == PomodoroTimer.Status.COMPLETED

        time_log = TimeLog.objects.get(issue=project_with_issue._issue)
        assert time_log.duration_minutes == 20
        assert time_log.logged_by == create_user

        mock_activity.delay.assert_called_once()
        assert mock_activity.delay.call_args.kwargs["type"] == "time_log.activity.created"

    @patch("plane.app.views.pomodoro.issue_activity")
    def test_completing_a_paused_timer_uses_frozen_elapsed(self, mock_activity, workspace, project_with_issue, create_user):
        timer = self._running_timer(workspace, project_with_issue, create_user)
        timer.paused_seconds = 15 * 60  # 15 minutes of focus time
        timer.status = PomodoroTimer.Status.PAUSED
        timer.save()

        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.post(_pomodoro_url(timer.id, "complete"))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["time_log"]["duration_minutes"] == 15

    def test_completing_twice_is_rejected(self, workspace, project_with_issue, create_user):
        timer = self._running_timer(workspace, project_with_issue, create_user)
        timer.status = PomodoroTimer.Status.COMPLETED
        timer.save()

        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.post(_pomodoro_url(timer.id, "complete"))

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not TimeLog.objects.filter(issue=project_with_issue._issue).exists()

    def test_complete_uses_the_timer_description(self, workspace, project_with_issue, create_user):
        timer = self._running_timer(workspace, project_with_issue, create_user, minutes_ago=5)
        timer.description = "Deep work on the spec"
        timer.save()

        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.post(_pomodoro_url(timer.id, "complete"))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["time_log"]["description"] == "Pomodoro: Deep work on the spec"
        assert response.data["time_log"]["duration_minutes"] == 5

    @patch("plane.app.views.pomodoro.issue_activity")
    def test_completing_without_time_log_creation(self, mock_activity, workspace, project_with_issue, create_user):
        timer = self._running_timer(workspace, project_with_issue, create_user)
        client = APIClient()
        client.force_authenticate(user=create_user)

        response = client.post(
            _pomodoro_url(timer.id, "complete"),
            {"create_time_log": False},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["time_log"] is None
        timer.refresh_from_db()
        assert timer.status == PomodoroTimer.Status.COMPLETED
        assert not TimeLog.objects.filter(issue=project_with_issue._issue).exists()
        mock_activity.delay.assert_not_called()


@pytest.mark.contract
@pytest.mark.django_db
class TestPomodoroTimerDiscard:
    def test_discarding_does_not_create_a_time_log(self, workspace, project_with_issue, create_user):
        timer = PomodoroTimer.objects.create(
            workspace=workspace,
            project=project_with_issue,
            issue=project_with_issue._issue,
            started_by=create_user,
            started_at=timezone.now() - timedelta(minutes=10),
            duration_minutes=25,
        )

        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.post(_pomodoro_url(timer.id, "discard"))

        assert response.status_code == status.HTTP_200_OK
        timer.refresh_from_db()
        assert timer.status == PomodoroTimer.Status.DISCARDED
        assert not TimeLog.objects.filter(issue=project_with_issue._issue).exists()

    def test_cannot_discard_a_completed_timer(self, workspace, project_with_issue, create_user):
        timer = PomodoroTimer.objects.create(
            workspace=workspace,
            project=project_with_issue,
            issue=project_with_issue._issue,
            started_by=create_user,
            started_at=timezone.now(),
            duration_minutes=25,
            status=PomodoroTimer.Status.COMPLETED,
        )

        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.post(_pomodoro_url(timer.id, "discard"))

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
@pytest.mark.django_db
class TestPomodoroTimerList:
    def test_list_returns_only_the_owners_timers(self, workspace, project_with_issue, create_user):
        PomodoroTimer.objects.create(
            workspace=workspace,
            project=project_with_issue,
            issue=project_with_issue._issue,
            started_by=create_user,
            started_at=timezone.now(),
            duration_minutes=25,
        )
        other = _make_user("other@plane.so")
        _add_project_member(project_with_issue, other, role=15)
        PomodoroTimer.objects.create(
            workspace=workspace,
            project=project_with_issue,
            issue=project_with_issue._issue,
            started_by=other,
            started_at=timezone.now(),
            duration_minutes=25,
        )

        client = APIClient()
        client.force_authenticate(user=create_user)
        response = client.get(_pomodoro_url())

        assert response.status_code == status.HTTP_200_OK
        timers = response.data
        assert len(timers) == 1
        assert timers[0]["started_by"] == create_user.id