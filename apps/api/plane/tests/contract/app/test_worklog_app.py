# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status
from uuid import uuid4

from plane.db.models import (
    Intake,
    IntakeIssue,
    Issue,
    IssueWorkLog,
    Project,
    ProjectMember,
    User,
    Workspace,
    WorkspaceMember,
)
from plane.db.models.intake import IntakeIssueStatus


def make_user(email=None, role_ws=None, workspace=None, project=None, role_project=15):
    """Create a user with a guaranteed-unique username to avoid collisions."""
    user = User.objects.create_user(
        email=email or f"{uuid4().hex[:12]}@example.com",
        username=f"u-{uuid4().hex[:12]}",
    )
    if workspace is not None:
        WorkspaceMember.objects.create(
            workspace=workspace, member=user, role=role_ws if role_ws is not None else 15, is_active=True
        )
    if project is not None:
        ProjectMember.objects.create(project=project, member=user, role=role_project, is_active=True)
    return user


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
        is_time_tracking_enabled=True,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def issue(db, project):
    return Issue.objects.create(name="Test Issue", project=project, workspace=project.workspace)


def list_url(slug, project_id, issue_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/worklogs/"


def detail_url(slug, project_id, issue_id, pk):
    return f"/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/worklogs/{pk}/"


def total_url(slug, project_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/total-worklogs/"


@pytest.mark.contract
class TestWorklogAppCreate:
    @pytest.mark.django_db
    def test_create_success(self, session_client, workspace, project, issue, create_user):
        url = list_url(workspace.slug, project.id, issue.id)
        response = session_client.post(url, {"duration": 90, "description": "work"}, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        body = response.json()
        assert body["duration"] == 90
        assert body["logged_by"] == str(create_user.id)
        worklog = IssueWorkLog.objects.get(pk=body["id"])
        assert worklog.logged_by_id == create_user.id
        assert worklog.issue_id == issue.id
        assert worklog.workspace_id == workspace.id

    @pytest.mark.django_db
    def test_create_rejected_when_time_tracking_disabled(self, session_client, workspace, project, issue):
        project.is_time_tracking_enabled = False
        project.save()
        url = list_url(workspace.slug, project.id, issue.id)
        response = session_client.post(url, {"duration": 30}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["error"] == "Time tracking is disabled for this project."
        assert IssueWorkLog.objects.count() == 0

    @pytest.mark.django_db
    def test_create_forbidden_for_guest(self, session_client, workspace, project, issue):
        guest = make_user(workspace=workspace, role_ws=5, project=project, role_project=5)
        session_client.force_authenticate(user=guest)
        url = list_url(workspace.slug, project.id, issue.id)
        response = session_client.post(url, {"duration": 15}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert IssueWorkLog.objects.count() == 0

    @pytest.mark.django_db
    def test_create_unauthenticated(self, client, workspace, project, issue):
        url = list_url(workspace.slug, project.id, issue.id)
        response = client.post(url, {"duration": 15}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.contract
class TestWorklogAppList:
    @pytest.mark.django_db
    def test_list_returns_worklogs(self, session_client, workspace, project, issue, create_user):
        IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=create_user, duration=10
        )
        IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=create_user, duration=20
        )
        url = list_url(workspace.slug, project.id, issue.id)
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 2

    @pytest.mark.django_db
    def test_list_isolated_by_issue(self, session_client, workspace, project, issue, create_user):
        other_issue = Issue.objects.create(name="Other", project=project, workspace=workspace)
        IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=other_issue, logged_by=create_user, duration=10
        )
        url = list_url(workspace.slug, project.id, issue.id)
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []


@pytest.mark.contract
class TestWorklogAppUpdate:
    @pytest.mark.django_db
    def test_update_by_author(self, session_client, workspace, project, issue, create_user):
        worklog = IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=create_user, duration=10
        )
        url = detail_url(workspace.slug, project.id, issue.id, worklog.id)
        response = session_client.patch(url, {"duration": 45}, format="json")
        assert response.status_code == status.HTTP_200_OK
        worklog.refresh_from_db()
        assert worklog.duration == 45

    @pytest.mark.django_db
    def test_update_by_admin_of_other_member_worklog(self, session_client, workspace, project, issue):
        member = make_user(workspace=workspace, role_ws=15, project=project, role_project=15)
        worklog = IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=member, duration=10
        )
        # session_client stays authenticated as create_user (project admin)
        url = detail_url(workspace.slug, project.id, issue.id, worklog.id)
        response = session_client.patch(url, {"duration": 99}, format="json")
        assert response.status_code == status.HTTP_200_OK
        worklog.refresh_from_db()
        assert worklog.duration == 99

    @pytest.mark.django_db
    def test_update_forbidden_for_other_member(self, session_client, workspace, project, issue, create_user):
        worklog = IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=create_user, duration=10
        )
        other = make_user(workspace=workspace, role_ws=15, project=project, role_project=15)
        session_client.force_authenticate(user=other)
        url = detail_url(workspace.slug, project.id, issue.id, worklog.id)
        response = session_client.patch(url, {"duration": 5}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        worklog.refresh_from_db()
        assert worklog.duration == 10

    @pytest.mark.django_db
    def test_update_rejected_when_time_tracking_disabled(self, session_client, workspace, project, issue, create_user):
        worklog = IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=create_user, duration=10
        )
        project.is_time_tracking_enabled = False
        project.save()
        url = detail_url(workspace.slug, project.id, issue.id, worklog.id)
        response = session_client.patch(url, {"duration": 45}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["error"] == "Time tracking is disabled for this project."


@pytest.mark.contract
class TestWorklogAppDelete:
    @pytest.mark.django_db
    def test_delete_by_author(self, session_client, workspace, project, issue, create_user):
        worklog = IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=create_user, duration=10
        )
        url = detail_url(workspace.slug, project.id, issue.id, worklog.id)
        response = session_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert IssueWorkLog.objects.filter(pk=worklog.id).count() == 0

    @pytest.mark.django_db
    def test_delete_forbidden_for_other_member(self, session_client, workspace, project, issue, create_user):
        worklog = IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=create_user, duration=10
        )
        other = make_user(workspace=workspace, role_ws=15, project=project, role_project=15)
        session_client.force_authenticate(user=other)
        url = detail_url(workspace.slug, project.id, issue.id, worklog.id)
        response = session_client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert IssueWorkLog.objects.filter(pk=worklog.id).count() == 1


@pytest.mark.contract
class TestWorklogAppIsolation:
    @pytest.mark.django_db
    def test_worklog_of_other_project_not_accessible(self, session_client, workspace, project, issue, create_user):
        other_ws = Workspace.objects.create(name="Other WS", owner=create_user, slug="other-ws")
        WorkspaceMember.objects.create(workspace=other_ws, member=create_user, role=20, is_active=True)
        other_project = Project.objects.create(
            name="Other", identifier="OT", workspace=other_ws, is_time_tracking_enabled=True
        )
        ProjectMember.objects.create(project=other_project, member=create_user, role=20, is_active=True)
        other_issue = Issue.objects.create(name="OI", project=other_project, workspace=other_ws)
        worklog = IssueWorkLog.objects.create(
            workspace=other_ws, project=other_project, issue=other_issue, logged_by=create_user, duration=10
        )
        # Attempt to reach the foreign worklog through the current project's scope
        url = detail_url(workspace.slug, project.id, issue.id, worklog.id)
        response = session_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_create_rejected_for_issue_of_another_project(self, session_client, workspace, project, create_user):
        # A work item that lives in a different project of the same workspace.
        other_project = Project.objects.create(
            name="Other", identifier="OT", workspace=workspace, is_time_tracking_enabled=True
        )
        ProjectMember.objects.create(project=other_project, member=create_user, role=20, is_active=True)
        foreign_issue = Issue.objects.create(name="Foreign", project=other_project, workspace=workspace)
        # Log time against the foreign issue through THIS project's scope -> 404, no dangling row.
        url = list_url(workspace.slug, project.id, foreign_issue.id)
        response = session_client.post(url, {"duration": 30}, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert IssueWorkLog.objects.count() == 0

    @pytest.mark.django_db
    def test_create_rejected_for_nonexistent_issue(self, session_client, workspace, project):
        # A well-formed but non-existent work item id -> clean 404 (not a 500 FK error).
        url = list_url(workspace.slug, project.id, uuid4())
        response = session_client.post(url, {"duration": 30}, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert IssueWorkLog.objects.count() == 0


@pytest.mark.contract
class TestWorklogAppRollup:
    @pytest.mark.django_db
    def test_total_worklogs_aggregated_per_work_item(self, session_client, workspace, project, issue, create_user):
        member = make_user(workspace=workspace, role_ws=15, project=project, role_project=15)
        other_issue = Issue.objects.create(name="Other", project=project, workspace=workspace)
        IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=create_user, duration=30
        )
        IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=member, duration=20
        )
        IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=other_issue, logged_by=create_user, duration=15
        )
        url = total_url(workspace.slug, project.id)
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        totals = {row["issue_id"]: row["duration"] for row in response.json()}
        assert totals[str(issue.id)] == 50
        assert totals[str(other_issue.id)] == 15

    @pytest.mark.django_db
    def test_total_worklogs_excludes_soft_deleted(self, session_client, workspace, project, issue, create_user):
        keep = IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=create_user, duration=40
        )
        gone = IssueWorkLog.objects.create(
            workspace=workspace, project=project, issue=issue, logged_by=create_user, duration=999
        )
        gone.delete()  # soft delete
        url = total_url(workspace.slug, project.id)
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        totals = {row["issue_id"]: row["duration"] for row in response.json()}
        assert totals[str(issue.id)] == 40
        assert keep.id is not None


@pytest.mark.contract
class TestWorklogAppValidationAndGates:
    @pytest.mark.django_db
    @pytest.mark.parametrize("duration", [0, -5, 525601, "abc"])
    def test_create_invalid_duration_rejected(self, session_client, workspace, project, issue, duration):
        url = list_url(workspace.slug, project.id, issue.id)
        response = session_client.post(url, {"duration": duration}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert IssueWorkLog.objects.count() == 0

    @pytest.mark.django_db
    def test_create_description_too_long_rejected(self, session_client, workspace, project, issue):
        url = list_url(workspace.slug, project.id, issue.id)
        response = session_client.post(url, {"duration": 10, "description": "x" * 5001}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert IssueWorkLog.objects.count() == 0

    @pytest.mark.django_db
    def test_create_forged_logged_by_ignored(self, session_client, workspace, project, issue, create_user):
        other = make_user(workspace=workspace, project=project)
        url = list_url(workspace.slug, project.id, issue.id)
        response = session_client.post(
            url,
            {"duration": 10, "logged_by": str(other.id), "created_by": str(other.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert IssueWorkLog.objects.get(pk=response.json()["id"]).logged_by_id == create_user.id

    @pytest.mark.django_db
    def test_create_rejected_on_unaccepted_intake_work_item(self, session_client, workspace, project, issue):
        intake = Intake.objects.create(name="Intake", project=project, workspace=workspace)
        IntakeIssue.objects.create(
            intake=intake, issue=issue, project=project, workspace=workspace, status=IntakeIssueStatus.PENDING
        )
        url = list_url(workspace.slug, project.id, issue.id)
        response = session_client.post(url, {"duration": 10}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert IssueWorkLog.objects.count() == 0

    @pytest.mark.django_db
    def test_create_allowed_on_accepted_intake_work_item(self, session_client, workspace, project, issue):
        intake = Intake.objects.create(name="Intake", project=project, workspace=workspace)
        IntakeIssue.objects.create(
            intake=intake, issue=issue, project=project, workspace=workspace, status=IntakeIssueStatus.ACCEPTED
        )
        url = list_url(workspace.slug, project.id, issue.id)
        response = session_client.post(url, {"duration": 10}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
