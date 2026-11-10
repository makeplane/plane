# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Guests must only see ``id``/``member``/``role`` from the member endpoints (WEB-10019 / SEC-122).

The views pass ``fields=("id", "member", "role")`` to ``WorkSpaceMemberSerializer``
(``fields = "__all__"``); ``DynamicBaseSerializer`` used to ignore it.
"""

import pytest
from rest_framework.test import APIClient

from plane.db.models import Project, ProjectMember, WorkspaceMember
from plane.tests.factories import UserFactory

ALLOWED = {"id", "member", "role"}


@pytest.fixture
def guest_client(workspace, create_user):
    guest = UserFactory(username="guest-user")
    WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5, is_active=True)
    project = Project.objects.create(name="P", identifier="PRJ", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(workspace=workspace, project=project, member=guest, role=5, is_active=True)
    client = APIClient()
    client.force_authenticate(user=guest)
    client.project = project
    return client


@pytest.mark.contract
@pytest.mark.django_db
class TestGuestMemberFields:
    def test_workspace_member_list(self, guest_client, workspace):
        response = guest_client.get(f"/api/workspaces/{workspace.slug}/members/")

        assert response.status_code == 200
        assert response.data
        for row in response.data:
            assert set(row) == ALLOWED

    def test_workspace_member_retrieve(self, guest_client, workspace):
        member = WorkspaceMember.objects.filter(workspace=workspace, role=20).first()

        response = guest_client.get(f"/api/workspaces/{workspace.slug}/members/{member.id}/")

        assert response.status_code == 200
        assert set(response.data) == ALLOWED

    def test_project_member_list(self, guest_client, workspace):
        response = guest_client.get(f"/api/workspaces/{workspace.slug}/projects/{guest_client.project.id}/members/")

        assert response.status_code == 200
        assert response.data
        for row in response.data:
            assert set(row) == ALLOWED
