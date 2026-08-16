# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Issue worklog API contract tests."""

import uuid
from unittest.mock import patch

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    ExporterHistory,
    Issue,
    IssueWorklog,
    Project,
    ProjectMember,
    State,
    User,
    Workspace,
    WorkspaceMember,
)
from django.utils import timezone

from plane.license.models import Instance, InstanceEdition
from plane.utils.worklog import WORKLOG_DURATION_MAX_SECONDS, validate_worklog_duration


def _unique(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def _create_user(email, first_name="Member", last_name="User"):
    user = User.objects.create(
        email=email,
        username=_unique("user"),
        first_name=first_name,
        last_name=last_name,
    )
    user.set_password("member@123")
    user.save()
    return user


def _create_workspace(slug, owner):
    workspace = Workspace.objects.create(name=f"Workspace {slug}", owner=owner, slug=slug)
    WorkspaceMember.objects.create(workspace=workspace, member=owner, role=20)
    return workspace


def _create_project(workspace, owner, identifier, name=None, **kwargs):
    project = Project.objects.create(
        name=name or f"Project {identifier}",
        identifier=identifier,
        workspace=workspace,
        created_by=owner,
        is_time_tracking_enabled=kwargs.pop("is_time_tracking_enabled", True),
        **kwargs,
    )
    ProjectMember.objects.create(project=project, member=owner, role=20, is_active=True)
    return project


def _create_issue(workspace, project, user, name="Test issue"):
    state = State.objects.filter(project=project, default=True).first()
    if state is None:
        state = State.objects.create(
            name="Todo",
            project=project,
            workspace=workspace,
            group="backlog",
            default=True,
        )
    return Issue.objects.create(
        name=name,
        workspace=workspace,
        project=project,
        state=state,
        created_by=user,
    )


def _worklog_url(slug, project_id, issue_id, pk=None):
    base = f"/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/worklogs/"
    if pk:
        return f"{base}{pk}/"
    return base


@pytest.fixture
def tracking_setup(db, create_user, workspace):
    project = _create_project(workspace, create_user, "WL", is_time_tracking_enabled=True)
    issue = _create_issue(workspace, project, create_user)
    return workspace, project, issue, create_user


@pytest.mark.unit
class TestWorklogDurationValidation:
    def test_valid_seconds(self):
        assert validate_worklog_duration(1800) == 1800

    def test_rejects_zero(self):
        with pytest.raises(ValueError):
            validate_worklog_duration(0)

    def test_rejects_negative(self):
        with pytest.raises(ValueError):
            validate_worklog_duration(-30)

    def test_rejects_human_string(self):
        with pytest.raises(ValueError):
            validate_worklog_duration("1h 30m")

    def test_rejects_overflow(self):
        with pytest.raises(ValueError):
            validate_worklog_duration(WORKLOG_DURATION_MAX_SECONDS + 1)

    def test_rejects_bool(self):
        with pytest.raises(ValueError):
            validate_worklog_duration(True)


@pytest.mark.contract
class TestIssueWorklogAPI:
    @pytest.mark.django_db
    @patch("plane.bgtasks.issue_activities_task.issue_activity.delay")
    def test_create_valid_worklog(self, mock_activity, session_client, tracking_setup):
        workspace, project, issue, user = tracking_setup
        url = _worklog_url(workspace.slug, project.id, issue.id)
        response = session_client.post(url, {"duration": 1800, "description": "Standup"}, format="json")
        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert response.data["duration"] == 1800
        assert response.data["description"] == "Standup"
        assert str(response.data["actor_detail"]["id"]) == str(user.id)
        assert IssueWorklog.objects.filter(issue=issue).count() == 1
        mock_activity.assert_called()

    @pytest.mark.django_db
    @patch("plane.bgtasks.issue_activities_task.issue_activity.delay")
    def test_list_worklogs_and_total(self, mock_activity, session_client, tracking_setup):
        workspace, project, issue, _user = tracking_setup
        url = _worklog_url(workspace.slug, project.id, issue.id)
        session_client.post(url, {"duration": 600}, format="json")
        session_client.post(url, {"duration": 1200}, format="json")
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["extra_stats"]["total_logged_time"] == 1800
        assert response.data["total_count"] == 2
        assert len(response.data["results"]) == 2

    @pytest.mark.django_db
    @patch("plane.bgtasks.issue_activities_task.issue_activity.delay")
    def test_update_authorized_worklog(self, mock_activity, session_client, tracking_setup):
        workspace, project, issue, _user = tracking_setup
        url = _worklog_url(workspace.slug, project.id, issue.id)
        created = session_client.post(url, {"duration": 600}, format="json")
        worklog_id = created.data["id"]
        response = session_client.patch(
            _worklog_url(workspace.slug, project.id, issue.id, worklog_id),
            {"duration": 900, "description": "Updated"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["duration"] == 900
        assert response.data["description"] == "Updated"

    @pytest.mark.django_db
    @patch("plane.bgtasks.issue_activities_task.issue_activity.delay")
    def test_delete_authorized_worklog(self, mock_activity, session_client, tracking_setup):
        workspace, project, issue, _user = tracking_setup
        url = _worklog_url(workspace.slug, project.id, issue.id)
        created = session_client.post(url, {"duration": 600}, format="json")
        worklog_id = created.data["id"]
        response = session_client.delete(_worklog_url(workspace.slug, project.id, issue.id, worklog_id))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not IssueWorklog.objects.filter(pk=worklog_id).exists()

    @pytest.mark.django_db
    @patch("plane.bgtasks.issue_activities_task.issue_activity.delay")
    def test_invalid_durations_rejected(self, mock_activity, session_client, tracking_setup):
        workspace, project, issue, _user = tracking_setup
        url = _worklog_url(workspace.slug, project.id, issue.id)
        for payload in (
            {"duration": 0},
            {"duration": -30},
            {"duration": "1h 30m"},
            {"duration": WORKLOG_DURATION_MAX_SECONDS + 1},
            {},
        ):
            response = session_client.post(url, payload, format="json")
            assert response.status_code == status.HTTP_400_BAD_REQUEST, payload

    @pytest.mark.django_db
    @patch("plane.bgtasks.issue_activities_task.issue_activity.delay")
    def test_total_logged_time_on_issue_detail(self, mock_activity, session_client, tracking_setup):
        workspace, project, issue, _user = tracking_setup
        url = _worklog_url(workspace.slug, project.id, issue.id)
        session_client.post(url, {"duration": 400}, format="json")
        session_client.post(url, {"duration": 500}, format="json")
        detail = session_client.get(f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/")
        assert detail.status_code == status.HTTP_200_OK
        assert detail.data["total_logged_time"] == 900

    @pytest.mark.django_db
    @patch("plane.bgtasks.issue_activities_task.issue_activity.delay")
    def test_disabled_time_tracking_rejects_mutation(self, mock_activity, session_client, tracking_setup):
        workspace, project, issue, _user = tracking_setup
        project.is_time_tracking_enabled = False
        project.save(update_fields=["is_time_tracking_enabled"])
        url = _worklog_url(workspace.slug, project.id, issue.id)
        response = session_client.post(url, {"duration": 600}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Time tracking is disabled" in response.data["error"]

    @pytest.mark.django_db
    @patch("plane.bgtasks.issue_activities_task.issue_activity.delay")
    def test_disabled_tracking_does_not_delete_history(self, mock_activity, session_client, tracking_setup):
        workspace, project, issue, _user = tracking_setup
        url = _worklog_url(workspace.slug, project.id, issue.id)
        created = session_client.post(url, {"duration": 600}, format="json")
        project.is_time_tracking_enabled = False
        project.save(update_fields=["is_time_tracking_enabled"])
        listed = session_client.get(url)
        assert listed.status_code == status.HTTP_200_OK
        assert listed.data["total_count"] == 1
        update = session_client.patch(
            _worklog_url(workspace.slug, project.id, issue.id, created.data["id"]),
            {"duration": 700},
            format="json",
        )
        assert update.status_code == status.HTTP_400_BAD_REQUEST
        assert IssueWorklog.objects.filter(pk=created.data["id"]).exists()

    @pytest.mark.django_db
    @patch("plane.bgtasks.issue_activities_task.issue_activity.delay")
    def test_issue_project_mismatch_rejected(self, mock_activity, session_client, tracking_setup):
        workspace, project, issue, user = tracking_setup
        other_project = _create_project(workspace, user, "OT", name="Other")
        url = _worklog_url(workspace.slug, other_project.id, issue.id)
        response = session_client.post(url, {"duration": 600}, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    @patch("plane.bgtasks.issue_activities_task.issue_activity.delay")
    def test_cross_workspace_access_rejected(self, mock_activity, session_client, tracking_setup):
        workspace, project, issue, _user = tracking_setup
        other_owner = _create_user(_unique("other") + "@plane.so", "Other", "Owner")
        other_workspace = _create_workspace(_unique("other-ws"), other_owner)
        created = session_client.post(
            _worklog_url(workspace.slug, project.id, issue.id),
            {"duration": 600},
            format="json",
        )
        worklog_id = created.data["id"]
        response = session_client.get(_worklog_url(other_workspace.slug, project.id, issue.id, worklog_id))
        assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)
        patch_response = session_client.patch(
            _worklog_url(other_workspace.slug, project.id, issue.id, worklog_id),
            {"duration": 700},
            format="json",
        )
        assert patch_response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    @pytest.mark.django_db
    @patch("plane.bgtasks.issue_activities_task.issue_activity.delay")
    def test_inaccessible_private_project_rejected(self, mock_activity, session_client, tracking_setup):
        workspace, _project, _issue, owner = tracking_setup
        outsider = _create_user(_unique("out") + "@plane.so")
        WorkspaceMember.objects.create(workspace=workspace, member=outsider, role=15)
        private_project = Project.objects.create(
            name="Secret",
            identifier="SEC",
            workspace=workspace,
            created_by=owner,
            network=0,
            is_time_tracking_enabled=True,
        )
        ProjectMember.objects.create(project=private_project, member=owner, role=20, is_active=True)
        private_issue = _create_issue(workspace, private_project, owner, name="Private issue")
        client = APIClient()
        client.force_authenticate(user=outsider)
        response = client.post(
            _worklog_url(workspace.slug, private_project.id, private_issue.id),
            {"duration": 600},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    @patch("plane.bgtasks.issue_activities_task.issue_activity.delay")
    def test_unauthorized_actor_rejected(self, mock_activity, session_client, tracking_setup):
        workspace, project, issue, _owner = tracking_setup
        stranger = _create_user(_unique("stranger") + "@plane.so")
        client = APIClient()
        client.force_authenticate(user=stranger)
        response = client.post(
            _worklog_url(workspace.slug, project.id, issue.id),
            {"duration": 600},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    @patch("plane.bgtasks.issue_activities_task.issue_activity.delay")
    def test_member_cannot_update_another_members_worklog(self, mock_activity, session_client, tracking_setup):
        workspace, project, issue, _owner = tracking_setup
        member = _create_user(_unique("mem") + "@plane.so")
        WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)
        ProjectMember.objects.create(project=project, member=member, role=15, is_active=True)
        created = session_client.post(
            _worklog_url(workspace.slug, project.id, issue.id),
            {"duration": 600},
            format="json",
        )
        client = APIClient()
        client.force_authenticate(user=member)
        response = client.patch(
            _worklog_url(workspace.slug, project.id, issue.id, created.data["id"]),
            {"duration": 900},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        member_created = client.post(
            _worklog_url(workspace.slug, project.id, issue.id),
            {"duration": 300},
            format="json",
        )
        assert member_created.status_code == status.HTTP_201_CREATED
        admin_update = session_client.patch(
            _worklog_url(workspace.slug, project.id, issue.id, member_created.data["id"]),
            {"duration": 450},
            format="json",
        )
        assert admin_update.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    @patch("plane.bgtasks.issue_activities_task.issue_activity.delay")
    def test_self_hosted_community_does_not_commercially_block(self, mock_activity, session_client, tracking_setup):
        workspace, project, issue, _user = tracking_setup
        instance_id = uuid.uuid4() if not Instance.objects.exists() else Instance.objects.first().id
        Instance.objects.update_or_create(
            id=instance_id,
            defaults={
                "instance_name": "Community Instance",
                "instance_id": str(uuid.uuid4()),
                "current_version": "1.0.0",
                "last_checked_at": timezone.now(),
                "edition": InstanceEdition.PLANE_COMMUNITY.value,
                "is_setup_done": True,
            },
        )
        for index in range(5):
            response = session_client.post(
                _worklog_url(workspace.slug, project.id, issue.id),
                {"duration": 60 * (index + 1)},
                format="json",
            )
            assert response.status_code == status.HTTP_201_CREATED, response.data
        listed = session_client.get(_worklog_url(workspace.slug, project.id, issue.id))
        assert listed.data["total_count"] == 5

    @pytest.mark.django_db
    @patch("plane.bgtasks.export_task.issue_worklog_export_task.delay")
    def test_exporter_creates_issue_worklogs_job(self, mock_export, session_client, tracking_setup):
        workspace, project, _issue, _user = tracking_setup
        url = f"/api/workspaces/{workspace.slug}/export-issues/"
        response = session_client.post(
            url,
            {"provider": "csv", "project": [str(project.id)], "type": "issue_worklogs"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        mock_export.assert_called_once()
        history = ExporterHistory.objects.get(workspace=workspace, type="issue_worklogs")
        assert history.provider == "csv"

    @pytest.mark.django_db
    @patch("plane.bgtasks.export_task.issue_export_task.delay")
    @patch("plane.bgtasks.export_task.issue_worklog_export_task.delay")
    def test_exporter_list_can_filter_worklog_jobs(
        self, mock_worklog_export, mock_issue_export, session_client, tracking_setup
    ):
        workspace, project, _issue, _user = tracking_setup
        url = f"/api/workspaces/{workspace.slug}/export-issues/"
        session_client.post(
            url,
            {"provider": "csv", "project": [str(project.id)], "type": "issue_exports"},
            format="json",
        )
        session_client.post(
            url,
            {"provider": "csv", "project": [str(project.id)], "type": "issue_worklogs"},
            format="json",
        )

        response = session_client.get(url, {"per_page": 10, "cursor": "10:0:0", "type": "issue_worklogs"})

        assert response.status_code == status.HTTP_200_OK, response.data
        types = {item["type"] for item in response.data["results"]}
        assert types == {"issue_worklogs"}
        mock_worklog_export.assert_called_once()
        mock_issue_export.assert_called_once()
