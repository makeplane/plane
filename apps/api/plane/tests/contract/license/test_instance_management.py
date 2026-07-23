# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import Project, ProjectMember, User, Workspace, WorkspaceMember
from plane.license.models import Instance, InstanceAdmin


@pytest.fixture
def managed_instance(db):
    return Instance.objects.create(
        instance_name="Managed instance",
        instance_id=uuid4().hex,
        current_version="1.0.0",
        last_checked_at=timezone.now(),
    )


def create_user(email):
    return User.objects.create(email=email, first_name=email.split("@")[0], last_name="User")


@pytest.mark.contract
class TestInstanceManagement:
    @pytest.mark.django_db
    def test_delegated_admin_gets_existing_workspace_and_project_access(self, api_client, managed_instance):
        super_admin = create_user("root@gizmo.so")
        delegated_admin = create_user("delegated@gizmo.so")
        owner = create_user("owner@gizmo.so")
        workspace = Workspace.objects.create(name="Workspace", slug="workspace", owner=owner)
        project = Project.objects.create(name="Project", identifier="PRJ", workspace=workspace, created_by=owner)
        InstanceAdmin.objects.create(instance=managed_instance, user=super_admin, role=20)
        api_client.force_authenticate(user=super_admin)

        response = api_client.post(
            "/api/instances/admins/",
            {"email": delegated_admin.email},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert WorkspaceMember.objects.filter(
            workspace=workspace,
            member=delegated_admin,
            role=20,
            is_active=True,
            is_instance_admin_access=True,
        ).exists()
        assert ProjectMember.objects.filter(
            project=project,
            member=delegated_admin,
            role=20,
            is_active=True,
            is_instance_admin_access=True,
        ).exists()

    @pytest.mark.django_db
    def test_new_workspaces_and_projects_include_existing_instance_admin(self, managed_instance):
        admin = create_user("admin@gizmo.so")
        owner = create_user("owner@gizmo.so")
        InstanceAdmin.objects.create(instance=managed_instance, user=admin, role=15)

        workspace = Workspace.objects.create(name="Future workspace", slug="future-workspace", owner=owner)
        project = Project.objects.create(name="Future project", identifier="FTR", workspace=workspace, created_by=owner)

        assert WorkspaceMember.objects.filter(
            workspace=workspace,
            member=admin,
            is_instance_admin_access=True,
            is_active=True,
        ).exists()
        assert ProjectMember.objects.filter(
            project=project,
            member=admin,
            is_instance_admin_access=True,
            is_active=True,
        ).exists()

    @pytest.mark.django_db
    def test_revoking_admin_restores_local_role_and_removes_project_projection(self, api_client, managed_instance):
        super_admin = create_user("root@gizmo.so")
        delegated_admin = create_user("delegated@gizmo.so")
        owner = create_user("owner@gizmo.so")
        workspace = Workspace.objects.create(name="Workspace", slug="workspace", owner=owner)
        WorkspaceMember.objects.create(workspace=workspace, member=delegated_admin, role=15)
        project = Project.objects.create(name="Project", identifier="PRJ", workspace=workspace, created_by=owner)
        InstanceAdmin.objects.create(instance=managed_instance, user=super_admin, role=20)
        api_client.force_authenticate(user=super_admin)
        create_response = api_client.post(
            "/api/instances/admins/",
            {"email": delegated_admin.email},
            format="json",
        )
        delegated_role_id = create_response.data["id"]

        response = api_client.delete(f"/api/instances/admins/{delegated_role_id}/")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        workspace_member = WorkspaceMember.objects.get(workspace=workspace, member=delegated_admin)
        assert workspace_member.role == 15
        assert workspace_member.is_active is True
        assert workspace_member.is_instance_admin_access is False
        project_member = ProjectMember.objects.get(project=project, member=delegated_admin)
        assert project_member.is_active is False
        assert project_member.is_instance_admin_access is False

    @pytest.mark.django_db
    def test_admin_can_manage_users_and_add_them_to_any_workspace(self, api_client, managed_instance):
        admin = create_user("admin@gizmo.so")
        user = create_user("member@gizmo.so")
        owner = create_user("owner@gizmo.so")
        workspace = Workspace.objects.create(name="Workspace", slug="workspace", owner=owner)
        InstanceAdmin.objects.create(instance=managed_instance, user=admin, role=15)
        api_client.force_authenticate(user=admin)

        users_response = api_client.get("/api/instances/users/")
        add_response = api_client.post(
            f"/api/instances/workspaces/{workspace.id}/members/",
            {"email": user.email, "role": 15},
            format="json",
        )
        deactivate_response = api_client.patch(
            f"/api/instances/users/{user.id}/",
            {"is_active": False},
            format="json",
        )

        assert users_response.status_code == status.HTTP_200_OK
        assert add_response.status_code == status.HTTP_201_CREATED
        assert WorkspaceMember.objects.filter(
            workspace=workspace,
            member=user,
            role=15,
            is_active=True,
            is_instance_admin_access=False,
        ).exists()
        assert deactivate_response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.is_active is False

    @pytest.mark.django_db
    def test_regular_user_cannot_use_instance_management_api(self, api_client, managed_instance):
        user = create_user("user@gizmo.so")
        api_client.force_authenticate(user=user)

        assert api_client.get("/api/instances/users/").status_code == status.HTTP_403_FORBIDDEN
