# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Entity search with project_id must only list members to active project members."""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Project, ProjectMember, User, WorkspaceMember

URL = "/api/workspaces/{slug}/entity-search/"


def _user(workspace, role=15):
    unique = uuid4().hex[:8]
    user = User.objects.create(email=f"es-{unique}@plane.so", username=f"es_{unique}")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role, is_active=True)
    return user


def _search(user, workspace, project, query_type="user_mention"):
    client = APIClient()
    client.force_authenticate(user=user)
    return client.get(
        URL.format(slug=workspace.slug),
        {"query_type": query_type, "project_id": str(project.id)},
    )


@pytest.fixture
def secret_project(db, workspace, create_user):
    project = Project.objects.create(
        name="Secret", identifier="SEC", workspace=workspace, created_by=create_user, network=0
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20, is_active=True)
    return project


@pytest.mark.contract
@pytest.mark.django_db
class TestEntitySearchProjectMembers:
    def test_project_member_sees_members(self, workspace, secret_project, create_user):
        response = _search(create_user, workspace, secret_project)
        assert response.status_code == status.HTTP_200_OK
        ids = [m["member__id"] for m in response.data["user_mention"]]
        assert str(create_user.id) in [str(i) for i in ids]

    def test_non_member_gets_nothing(self, workspace, secret_project):
        outsider = _user(workspace)
        response = _search(outsider, workspace, secret_project)
        assert response.status_code == status.HTTP_200_OK
        assert response.data == {"user_mention": []}

    def test_non_member_gets_empty_for_every_query_type(self, workspace, secret_project):
        outsider = _user(workspace)
        response = _search(outsider, workspace, secret_project, "user_mention,project,issue")
        assert response.status_code == status.HTTP_200_OK
        assert response.data == {"user_mention": [], "project": [], "issue": []}

    def test_member_of_other_project_gets_nothing(self, workspace, secret_project):
        user = _user(workspace)
        other = Project.objects.create(name="Other", identifier="OTH", workspace=workspace, created_by=user, network=2)
        ProjectMember.objects.create(project=other, member=user, workspace=workspace, role=15, is_active=True)
        response = _search(user, workspace, secret_project, "user_mention,project")
        assert response.status_code == status.HTTP_200_OK
        assert response.data == {"user_mention": [], "project": []}

    def test_inactive_member_gets_nothing(self, workspace, secret_project):
        former = _user(workspace)
        ProjectMember.objects.create(
            project=secret_project, member=former, workspace=workspace, role=15, is_active=False
        )
        response = _search(former, workspace, secret_project, "user_mention,project")
        assert response.status_code == status.HTTP_200_OK
        assert response.data == {"user_mention": [], "project": []}
