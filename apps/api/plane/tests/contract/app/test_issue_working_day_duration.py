# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import Mock

import pytest
from rest_framework import status

from plane.db.models import Issue
from plane.tests.factories import (
    IssueFactory,
    ProjectFactory,
    ProjectMemberFactory,
    StateFactory,
)

pytestmark = [pytest.mark.contract, pytest.mark.django_db]


def _issue_collection_url(workspace_slug, project_id):
    return f"/api/workspaces/{workspace_slug}/projects/{project_id}/issues/"


def _issue_detail_url(workspace_slug, project_id, issue_id):
    return f"/api/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/"


@pytest.fixture
def project_with_member(workspace, create_user):
    project = ProjectFactory.create(workspace=workspace, created_by=create_user)
    ProjectMemberFactory.create(project=project, member=create_user, role=20)
    state = StateFactory.create(project=project, default=True)
    return project, state


@pytest.fixture(autouse=True)
def _mute_issue_side_effect_tasks(monkeypatch):
    monkeypatch.setattr("plane.app.views.issue.base.issue_activity.delay", Mock())
    monkeypatch.setattr("plane.app.views.issue.base.model_activity.delay", Mock())
    monkeypatch.setattr(
        "plane.app.views.issue.base.issue_description_version_task.delay",
        Mock(),
    )


class TestIssueWorkingDayDuration:
    def test_create_derives_target_date_from_weekend_working_duration(
        self, session_client, workspace, project_with_member
    ):
        project, state = project_with_member
        payload = {
            "name": "Duration-managed issue",
            "state_id": str(state.id),
            "start_date": "2026-05-08",
            "planned_duration_working_days": 2,
        }

        response = session_client.post(_issue_collection_url(workspace.slug, project.id), payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        body = response.json()
        assert body["planned_duration_working_days"] == 2
        assert body["target_date"] == "2026-05-11"

        issue = Issue.objects.get(id=body["id"])
        assert issue.planned_duration_working_days == 2
        assert issue.target_date.isoformat() == "2026-05-11"

    def test_patch_duration_shrinks_target_date(self, session_client, workspace, project_with_member):
        project, _state = project_with_member
        issue = IssueFactory.create(
            project=project,
            start_date="2026-05-07",
            target_date="2026-05-11",
            planned_duration_working_days=3,
        )

        response = session_client.patch(
            _issue_detail_url(workspace.slug, project.id, issue.id),
            {"planned_duration_working_days": 1},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["planned_duration_working_days"] == 1
        assert body["target_date"] == "2026-05-07"

        issue.refresh_from_db()
        assert issue.planned_duration_working_days == 1
        assert issue.target_date.isoformat() == "2026-05-07"

    def test_patch_target_date_recalculates_working_duration(self, session_client, workspace, project_with_member):
        project, _state = project_with_member
        issue = IssueFactory.create(project=project, start_date="2026-05-08", target_date="2026-05-08")

        response = session_client.patch(
            _issue_detail_url(workspace.slug, project.id, issue.id),
            {"target_date": "2026-05-11"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["target_date"] == "2026-05-11"
        assert body["planned_duration_working_days"] == 2

        issue.refresh_from_db()
        assert issue.planned_duration_working_days == 2

    def test_patch_weekend_target_keeps_date_and_clears_duration(
        self, session_client, workspace, project_with_member
    ):
        project, _state = project_with_member
        issue = IssueFactory.create(
            project=project,
            start_date="2026-01-05",
            target_date="2026-01-09",
            planned_duration_working_days=5,
        )

        response = session_client.patch(
            _issue_detail_url(workspace.slug, project.id, issue.id),
            {"target_date": "2026-01-11"},  # Sunday
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.target_date.isoformat() == "2026-01-11"  # user's date untouched
        assert issue.planned_duration_working_days is None

    def test_patch_multi_year_target_clears_duration_instead_of_overflowing(
        self, session_client, workspace, project_with_member
    ):
        project, _state = project_with_member
        issue = IssueFactory.create(
            project=project,
            start_date="2026-01-05",
            target_date="2026-01-09",
            planned_duration_working_days=5,
        )

        response = session_client.patch(
            _issue_detail_url(workspace.slug, project.id, issue.id),
            {"target_date": "2027-06-01"},  # 367 working days
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.target_date.isoformat() == "2027-06-01"
        assert issue.planned_duration_working_days is None

    def test_clearing_duration_keeps_explicit_target_date_behavior(
        self, session_client, workspace, project_with_member
    ):
        project, _state = project_with_member
        issue = IssueFactory.create(
            project=project,
            start_date="2026-05-08",
            target_date="2026-05-11",
            planned_duration_working_days=2,
        )

        response = session_client.patch(
            _issue_detail_url(workspace.slug, project.id, issue.id),
            {"planned_duration_working_days": None, "target_date": "2026-05-12"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["planned_duration_working_days"] is None
        assert body["target_date"] == "2026-05-12"

        issue.refresh_from_db()
        assert issue.planned_duration_working_days is None
        assert issue.target_date.isoformat() == "2026-05-12"

    def test_duration_zero_is_rejected(self, session_client, workspace, project_with_member):
        project, state = project_with_member
        payload = {
            "name": "Invalid duration",
            "state_id": str(state.id),
            "start_date": "2026-05-08",
            "planned_duration_working_days": 0,
        }

        response = session_client.post(_issue_collection_url(workspace.slug, project.id), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_patch_non_schedule_field_returns_schedule_body(
        self, session_client, workspace, project_with_member
    ):
        """204→200 契約変更の回帰テスト: schedule 以外の PATCH でも同じ body 形状を返す。"""
        project, _state = project_with_member
        issue = IssueFactory.create(project=project)

        response = session_client.patch(
            _issue_detail_url(workspace.slug, project.id, issue.id),
            {"name": "Renamed issue"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert set(body.keys()) == {
            "id",
            "start_date",
            "target_date",
            "planned_duration_working_days",
            "updated_at",
        }
        assert body["id"] == str(issue.id)

    def test_patch_duration_and_target_together_duration_wins(
        self, session_client, workspace, project_with_member
    ):
        project, _state = project_with_member
        issue = IssueFactory.create(
            project=project,
            start_date="2026-05-04",
            target_date="2026-05-08",
            planned_duration_working_days=5,
        )

        response = session_client.patch(
            _issue_detail_url(workspace.slug, project.id, issue.id),
            {"target_date": "2026-05-06", "planned_duration_working_days": 2},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.target_date.isoformat() == "2026-05-05"  # derived from duration, not the sent target
        assert issue.planned_duration_working_days == 2

    def test_patch_start_date_rederives_target_from_stored_duration(
        self, session_client, workspace, project_with_member
    ):
        """Mutation Rule 2 の API 経路（部分更新）検証。"""
        project, _state = project_with_member
        issue = IssueFactory.create(
            project=project,
            start_date="2026-05-04",
            target_date="2026-05-08",
            planned_duration_working_days=5,
        )

        response = session_client.patch(
            _issue_detail_url(workspace.slug, project.id, issue.id),
            {"start_date": "2026-05-07"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.target_date.isoformat() == "2026-05-13"
        assert issue.planned_duration_working_days == 5

    def test_duration_validation_boundaries(self, session_client, workspace, project_with_member):
        project, state = project_with_member
        issue = IssueFactory.create(
            project=project,
            start_date="2026-05-04",
            target_date="2026-05-08",
        )
        url = _issue_detail_url(workspace.slug, project.id, issue.id)

        for bad in (367, -1, "abc"):
            response = session_client.patch(url, {"planned_duration_working_days": bad}, format="json")
            assert response.status_code == status.HTTP_400_BAD_REQUEST, bad

        # 仕様: "A duration without start_date is allowed but cannot derive target_date."
        response = session_client.post(
            _issue_collection_url(workspace.slug, project.id),
            {"name": "No-start duration", "state_id": str(state.id), "planned_duration_working_days": 3},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        body = response.json()
        assert body["planned_duration_working_days"] == 3
        assert body["target_date"] is None

    def test_all_weekend_range_stores_dates_without_duration(
        self, session_client, workspace, project_with_member
    ):
        project, _state = project_with_member
        issue = IssueFactory.create(project=project, start_date="2026-05-09")  # Saturday

        response = session_client.patch(
            _issue_detail_url(workspace.slug, project.id, issue.id),
            {"target_date": "2026-05-10"},  # Sunday — zero working days in range
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.target_date.isoformat() == "2026-05-10"
        assert issue.planned_duration_working_days is None
