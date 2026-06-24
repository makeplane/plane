# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.db.models import (
    Project,
    ProjectMember,
    ProjectMemberInvite,
    User,
    Workspace,
    WorkspaceMember,
)


@pytest.mark.contract
class TestProjectInvitationAPI:
    @pytest.mark.django_db
    def test_foreign_workspace_user_cannot_read_project_invitations(self, session_client, workspace, create_user):
        project = Project.objects.create(name="Invite Protected", identifier="IP", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        invitation = ProjectMemberInvite.objects.create(
            project=project,
            workspace=workspace,
            email="invitee@example.com",
            token="secret-project-invite-token",
            role=15,
            created_by=create_user,
        )

        foreign_user = User.objects.create_user(email="foreign@example.com", username="foreign")
        foreign_workspace = Workspace.objects.create(name="Foreign Workspace", slug="foreign-workspace", owner=foreign_user)
        WorkspaceMember.objects.create(workspace=foreign_workspace, member=foreign_user, role=15, is_active=True)

        session_client.force_authenticate(user=foreign_user)

        list_url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/invitations/"
        detail_url = f"{list_url}{invitation.id}/"

        list_response = session_client.get(list_url)
        detail_response = session_client.get(detail_url)

        assert list_response.status_code == status.HTTP_403_FORBIDDEN
        assert detail_response.status_code == status.HTTP_403_FORBIDDEN
        assert b"secret-project-invite-token" not in list_response.content
        assert b"secret-project-invite-token" not in detail_response.content
