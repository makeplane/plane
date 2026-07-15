# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import APIToken, Issue, IssueTimeLog, Project, ProjectMember, User, WorkspaceMember


@pytest.mark.contract
class TestIssueTimeLogPermissions:
    """Contract coverage for ownership and administrator access to worklogs."""

    @pytest.fixture
    def time_log_context(self, workspace, create_user):
        project = Project.objects.create(name="Time log project", identifier="TLP", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20)

        member = User.objects.create_user(email="member@plane.so", username="time_log_member")
        WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)
        ProjectMember.objects.create(project=project, member=member, role=15)

        issue = Issue.objects.create(name="Time log issue", project=project, workspace=workspace)
        now = timezone.now()
        member_log = IssueTimeLog.objects.create(
            issue=issue,
            project=project,
            workspace=workspace,
            user=member,
            date=now.date(),
            started_at=now - timedelta(hours=1),
            stopped_at=now,
            duration_seconds=3600,
            created_by=member,
        )
        admin_log = IssueTimeLog.objects.create(
            issue=issue,
            project=project,
            workspace=workspace,
            user=create_user,
            date=now.date(),
            started_at=now - timedelta(minutes=30),
            stopped_at=now,
            duration_seconds=1800,
            created_by=create_user,
        )

        return {
            "project": project,
            "issue": issue,
            "member": member,
            "member_log": member_log,
            "admin_log": admin_log,
        }

    @staticmethod
    def get_url(workspace_slug, project_id, issue_id, time_log_id=None):
        base_url = f"/api/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/time-logs/"
        return f"{base_url}{time_log_id}/" if time_log_id else base_url

    @pytest.mark.django_db
    def test_member_can_update_their_own_time_log(self, session_client, workspace, time_log_context):
        context = time_log_context
        session_client.force_authenticate(user=context["member"])

        response = session_client.patch(
            self.get_url(workspace.slug, context["project"].id, context["issue"].id, context["member_log"].id),
            {"duration_seconds": 5400},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        context["member_log"].refresh_from_db()
        assert context["member_log"].duration_seconds == 5400

    @pytest.mark.django_db
    def test_member_cannot_update_or_delete_another_users_time_log(self, session_client, workspace, time_log_context):
        context = time_log_context
        session_client.force_authenticate(user=context["member"])
        url = self.get_url(workspace.slug, context["project"].id, context["issue"].id, context["admin_log"].id)

        update_response = session_client.patch(url, {"duration_seconds": 5400}, format="json")
        delete_response = session_client.delete(url)

        assert update_response.status_code == status.HTTP_403_FORBIDDEN
        assert delete_response.status_code == status.HTTP_403_FORBIDDEN
        context["admin_log"].refresh_from_db()
        assert context["admin_log"].duration_seconds == 1800

    @pytest.mark.django_db
    def test_member_cannot_record_or_reassign_time_for_another_member(
        self, session_client, workspace, time_log_context
    ):
        context = time_log_context
        session_client.force_authenticate(user=context["member"])

        create_response = session_client.post(
            self.get_url(workspace.slug, context["project"].id, context["issue"].id),
            {
                "date": timezone.now().date().isoformat(),
                "duration_seconds": 900,
                "user_id": str(context["admin_log"].user_id),
            },
            format="json",
        )
        update_response = session_client.patch(
            self.get_url(workspace.slug, context["project"].id, context["issue"].id, context["member_log"].id),
            {"duration_seconds": 5400, "user_id": str(context["admin_log"].user_id)},
            format="json",
        )

        assert create_response.status_code == status.HTTP_403_FORBIDDEN
        assert update_response.status_code == status.HTTP_403_FORBIDDEN
        context["member_log"].refresh_from_db()
        assert context["member_log"].user_id == context["member"].id

    @pytest.mark.django_db
    def test_admin_can_update_and_reassign_any_time_log(self, session_client, create_user, workspace, time_log_context):
        context = time_log_context
        session_client.force_authenticate(user=create_user)

        response = session_client.patch(
            self.get_url(workspace.slug, context["project"].id, context["issue"].id, context["member_log"].id),
            {"duration_seconds": 7200, "user_id": str(create_user.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        context["member_log"].refresh_from_db()
        assert context["member_log"].duration_seconds == 7200
        assert context["member_log"].user_id == create_user.id

    @pytest.mark.django_db
    def test_v1_member_cannot_update_another_users_time_log(self, api_key_client, workspace, time_log_context):
        context = time_log_context
        api_token = APIToken.objects.create(user=context["member"])
        api_key_client.credentials(HTTP_X_API_KEY=api_token.token)
        url = (
            f"/api/v1/workspaces/{workspace.slug}/projects/{context['project'].id}/"
            f"issues/{context['issue'].id}/time-logs/{context['admin_log'].id}/"
        )

        response = api_key_client.patch(url, {"duration_seconds": 5400}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        context["admin_log"].refresh_from_db()
        assert context["admin_log"].duration_seconds == 1800
