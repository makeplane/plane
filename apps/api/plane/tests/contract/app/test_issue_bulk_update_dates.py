# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import Mock

import pytest
from django.urls import reverse
from rest_framework import status

from plane.tests.factories import IssueFactory, ProjectFactory, ProjectMemberFactory

pytestmark = [pytest.mark.contract, pytest.mark.django_db]


@pytest.fixture
def project_with_member(workspace, create_user):
    project = ProjectFactory.create(workspace=workspace, created_by=create_user)
    ProjectMemberFactory.create(project=project, member=create_user, role=20)
    return project


@pytest.fixture(autouse=True)
def _mute_issue_side_effect_tasks(monkeypatch):
    monkeypatch.setattr("plane.app.views.issue.base.issue_activity.delay", Mock())


def _dates_url(workspace_slug, project_id):
    return reverse("project-issue-dates", kwargs={"slug": workspace_slug, "project_id": project_id})


class TestIssueBulkUpdateDates:
    def test_start_only_update_preserves_duration_and_derives_target(
        self, session_client, workspace, project_with_member
    ):
        """Move semantics (Mutation Rule 2): start edit keeps the stored duration."""
        issue = IssueFactory.create(
            project=project_with_member,
            start_date="2026-05-04",
            target_date="2026-05-08",
            planned_duration_working_days=5,
        )

        response = session_client.post(
            _dates_url(workspace.slug, project_with_member.id),
            {"updates": [{"id": str(issue.id), "start_date": "2026-05-07"}]},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.start_date.isoformat() == "2026-05-07"
        assert issue.target_date.isoformat() == "2026-05-13"  # Thu + 5 working days = Wed
        assert issue.planned_duration_working_days == 5

    def test_both_dates_update_recalculates_duration(self, session_client, workspace, project_with_member):
        """Resize semantics (Mutation Rule 3): explicit range wins, duration follows."""
        issue = IssueFactory.create(
            project=project_with_member,
            start_date="2026-05-04",
            target_date="2026-05-08",
            planned_duration_working_days=5,
        )

        response = session_client.post(
            _dates_url(workspace.slug, project_with_member.id),
            {
                "updates": [
                    {"id": str(issue.id), "start_date": "2026-05-07", "target_date": "2026-05-11"}
                ]
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.planned_duration_working_days == 3  # Thu, Fri, Mon

    def test_weekend_landing_target_clears_duration(self, session_client, workspace, project_with_member):
        issue = IssueFactory.create(
            project=project_with_member,
            start_date="2026-05-04",
            target_date="2026-05-08",
            planned_duration_working_days=5,
        )

        response = session_client.post(
            _dates_url(workspace.slug, project_with_member.id),
            {
                "updates": [
                    {"id": str(issue.id), "start_date": "2026-05-05", "target_date": "2026-05-10"}
                ]
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.target_date.isoformat() == "2026-05-10"  # Sunday kept as-is
        assert issue.planned_duration_working_days is None

    def test_invalid_duration_returns_400(self, session_client, workspace, project_with_member):
        issue = IssueFactory.create(
            project=project_with_member,
            start_date="2026-05-04",
            target_date="2026-05-08",
        )

        response = session_client.post(
            _dates_url(workspace.slug, project_with_member.id),
            {"updates": [{"id": str(issue.id), "planned_duration_working_days": 0}]},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_response_carries_normalized_issue_rows(self, session_client, workspace, project_with_member):
        issue = IssueFactory.create(
            project=project_with_member,
            start_date="2026-05-04",
            target_date="2026-05-08",
            planned_duration_working_days=5,
        )

        response = session_client.post(
            _dates_url(workspace.slug, project_with_member.id),
            {"updates": [{"id": str(issue.id), "start_date": "2026-05-07"}]},
            format="json",
        )

        body = response.json()
        assert set(body.keys()) == {"message", "issues"}
        assert body["issues"] == [
            {
                "id": str(issue.id),
                "start_date": "2026-05-07",
                "target_date": "2026-05-13",
                "planned_duration_working_days": 5,
            }
        ]
