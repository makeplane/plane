# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.db.models import State, Project, ProjectMember, Issue, Workspace
from plane.license.models import Instance, InstanceAdmin


@pytest.fixture
def workspace_with_project(db, create_user):
    """Create workspace and project with user as admin"""
    workspace = Workspace.objects.create(
        name="Test Workspace",
        slug="test-workspace",
        owner=create_user
    )
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,  # Admin role
        is_active=True,
    )
    return workspace, project


@pytest.fixture
def system_state(db, workspace_with_project):
    """Create a system state"""
    workspace, project = workspace_with_project
    return State.objects.create(
        name="System State",
        color="#FF0000",
        group="unstarted",
        project=project,
        workspace=workspace,
        is_system=True,
        sequence=10000,
    )


@pytest.fixture
def custom_state(db, workspace_with_project):
    """Create a custom (non-system) state"""
    workspace, project = workspace_with_project
    return State.objects.create(
        name="Custom State",
        color="#00FF00",
        group="unstarted",
        project=project,
        workspace=workspace,
        is_system=False,
        sequence=20000,
    )


@pytest.fixture
def instance_admin_user(db, create_user):
    """Create an instance admin user"""
    instance = Instance.objects.create(
        instance_name="Test Instance",
        is_setup_done=True
    )
    InstanceAdmin.objects.create(
        instance=instance,
        user=create_user,
        role=15
    )
    return create_user


def get_state_url(workspace_slug, project_id, state_id=None):
    """Helper to construct state endpoint URL"""
    if state_id:
        return f"/api/workspaces/{workspace_slug}/projects/{project_id}/states/{state_id}/"
    return f"/api/workspaces/{workspace_slug}/projects/{project_id}/states/"


@pytest.mark.contract
class TestStatePermissionGuards:
    """Test state permission guard logic in StateViewSet"""

    @pytest.mark.django_db
    def test_create_state_with_is_system_field_by_admin(self, session_client, workspace_with_project):
        """Admin user cannot set is_system=true, only instance admins can"""
        workspace, project = workspace_with_project
        url = get_state_url(workspace.slug, project.id)

        state_data = {
            "name": "New State",
            "color": "#0000FF",
            "group": "unstarted",
            "is_system": True,  # Admin tries to set this
        }

        response = session_client.post(url, state_data, format="json")
        assert response.status_code == status.HTTP_200_OK

        # Verify is_system was stripped (not saved as True)
        created_state = State.objects.get(name="New State")
        assert created_state.is_system is False

    @pytest.mark.django_db
    def test_create_state_by_admin_without_is_system(self, session_client, workspace_with_project):
        """Admin can create states without is_system field"""
        workspace, project = workspace_with_project
        url = get_state_url(workspace.slug, project.id)

        state_data = {
            "name": "Admin Created State",
            "color": "#FF00FF",
            "group": "unstarted",
        }

        response = session_client.post(url, state_data, format="json")
        assert response.status_code == status.HTTP_200_OK

        created_state = State.objects.get(name="Admin Created State")
        assert created_state.is_system is False
        assert created_state.project == project

    @pytest.mark.django_db
    def test_partial_update_system_state_by_admin_blocked(self, session_client, workspace_with_project, system_state):
        """Admin cannot modify system state (non-sequence fields)"""
        workspace, project = workspace_with_project
        url = get_state_url(workspace.slug, project.id, system_state.id)

        update_data = {
            "name": "Modified System State",
            "color": "#FFFFFF",
        }

        response = session_client.patch(url, update_data, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Only instance admins can modify system states" in response.data.get("error", "")

        # Verify state was not modified
        system_state.refresh_from_db()
        assert system_state.name == "System State"

    @pytest.mark.django_db
    def test_partial_update_system_state_sequence_only_by_admin(self, session_client, workspace_with_project, system_state):
        """Admin CAN modify only sequence field of system state (drag reorder)"""
        workspace, project = workspace_with_project
        url = get_state_url(workspace.slug, project.id, system_state.id)

        update_data = {
            "sequence": 5000,  # Only sequence field
        }

        response = session_client.patch(url, update_data, format="json")
        assert response.status_code == status.HTTP_200_OK

        system_state.refresh_from_db()
        assert system_state.sequence == 5000
        assert system_state.name == "System State"  # Name unchanged

    @pytest.mark.django_db
    def test_partial_update_custom_state_by_admin(self, session_client, workspace_with_project, custom_state):
        """Admin can modify custom (non-system) states"""
        workspace, project = workspace_with_project
        url = get_state_url(workspace.slug, project.id, custom_state.id)

        update_data = {
            "name": "Updated Custom State",
            "color": "#AABBCC",
        }

        response = session_client.patch(url, update_data, format="json")
        assert response.status_code == status.HTTP_200_OK

        custom_state.refresh_from_db()
        assert custom_state.name == "Updated Custom State"
        assert custom_state.color == "#AABBCC"

    @pytest.mark.django_db
    def test_destroy_system_state_by_admin_blocked(self, session_client, workspace_with_project, system_state):
        """Admin cannot delete system states"""
        workspace, project = workspace_with_project
        url = get_state_url(workspace.slug, project.id, system_state.id)

        response = session_client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Only instance admins can delete system states" in response.data.get("error", "")

        # Verify state still exists
        assert State.objects.filter(id=system_state.id).exists()

    @pytest.mark.django_db
    def test_destroy_custom_state_by_admin(self, session_client, workspace_with_project, custom_state):
        """Admin can delete custom states"""
        workspace, project = workspace_with_project
        url = get_state_url(workspace.slug, project.id, custom_state.id)

        response = session_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify state was deleted
        assert not State.objects.filter(id=custom_state.id).exists()

    @pytest.mark.django_db
    def test_mark_system_state_as_default_by_admin_blocked(self, session_client, workspace_with_project, system_state):
        """Admin cannot mark system states as default"""
        workspace, project = workspace_with_project
        url = get_state_url(workspace.slug, project.id, system_state.id) + "mark_as_default/"

        response = session_client.post(url, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Only instance admins can mark a system state as default" in response.data.get("error", "")

        system_state.refresh_from_db()
        assert system_state.default is False

    @pytest.mark.django_db
    def test_mark_custom_state_as_default_by_admin(self, session_client, workspace_with_project, custom_state):
        """Admin can mark custom states as default"""
        workspace, project = workspace_with_project
        url = get_state_url(workspace.slug, project.id, custom_state.id) + "mark_as_default/"

        response = session_client.post(url, format="json")
        assert response.status_code == status.HTTP_204_NO_CONTENT

        custom_state.refresh_from_db()
        assert custom_state.default is True

    @pytest.mark.django_db
    def test_destroy_default_state_blocked(self, session_client, workspace_with_project, custom_state):
        """Cannot delete default states"""
        workspace, project = workspace_with_project
        custom_state.default = True
        custom_state.save()

        url = get_state_url(workspace.slug, project.id, custom_state.id)
        response = session_client.delete(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Default state cannot be deleted" in response.data.get("error", "")

        # Verify state still exists
        assert State.objects.filter(id=custom_state.id).exists()

    @pytest.mark.django_db
    def test_destroy_state_with_issues_blocked(self, session_client, workspace_with_project, custom_state, create_user):
        """Cannot delete states that contain issues"""
        workspace, project = workspace_with_project

        # Create an issue in this state
        Issue.objects.create(
            title="Test Issue",
            project=project,
            workspace=workspace,
            state=custom_state,
            created_by=create_user,
        )

        url = get_state_url(workspace.slug, project.id, custom_state.id)
        response = session_client.delete(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "only empty states can be deleted" in response.data.get("error", "")

        # Verify state still exists
        assert State.objects.filter(id=custom_state.id).exists()


@pytest.mark.contract
class TestStatePermissionGuardsWithInstanceAdmin:
    """Test state permission guards for instance admin users"""

    @pytest.mark.django_db
    def test_instance_admin_can_create_system_state(self, db, workspace_with_project, instance_admin_user):
        """Instance admin can create system states"""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=instance_admin_user)

        workspace, project = workspace_with_project
        # Add instance admin to project
        ProjectMember.objects.create(
            project=project,
            member=instance_admin_user,
            role=20,
            is_active=True,
        )

        url = get_state_url(workspace.slug, project.id)
        state_data = {
            "name": "System State by Admin",
            "color": "#FF0000",
            "group": "unstarted",
            "is_system": True,
        }

        response = client.post(url, state_data, format="json")
        assert response.status_code == status.HTTP_200_OK

        created_state = State.objects.get(name="System State by Admin")
        assert created_state.is_system is True

    @pytest.mark.django_db
    def test_instance_admin_can_modify_system_state(self, db, workspace_with_project, instance_admin_user):
        """Instance admin can modify system states"""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=instance_admin_user)

        workspace, project = workspace_with_project
        # Add instance admin to project
        ProjectMember.objects.create(
            project=project,
            member=instance_admin_user,
            role=20,
            is_active=True,
        )

        system_state = State.objects.create(
            name="System State",
            color="#FF0000",
            group="unstarted",
            project=project,
            workspace=workspace,
            is_system=True,
            sequence=10000,
        )

        url = get_state_url(workspace.slug, project.id, system_state.id)
        update_data = {
            "name": "Modified System State",
            "color": "#FFFFFF",
        }

        response = client.patch(url, update_data, format="json")
        assert response.status_code == status.HTTP_200_OK

        system_state.refresh_from_db()
        assert system_state.name == "Modified System State"
        assert system_state.color == "#FFFFFF"

    @pytest.mark.django_db
    def test_instance_admin_can_delete_system_state(self, db, workspace_with_project, instance_admin_user):
        """Instance admin can delete system states"""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=instance_admin_user)

        workspace, project = workspace_with_project
        # Add instance admin to project
        ProjectMember.objects.create(
            project=project,
            member=instance_admin_user,
            role=20,
            is_active=True,
        )

        system_state = State.objects.create(
            name="System State",
            color="#FF0000",
            group="unstarted",
            project=project,
            workspace=workspace,
            is_system=True,
            sequence=10000,
        )

        url = get_state_url(workspace.slug, project.id, system_state.id)
        response = client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify state was deleted
        assert not State.objects.filter(id=system_state.id).exists()

    @pytest.mark.django_db
    def test_instance_admin_can_mark_system_state_as_default(self, db, workspace_with_project, instance_admin_user):
        """Instance admin can mark system states as default"""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=instance_admin_user)

        workspace, project = workspace_with_project
        # Add instance admin to project
        ProjectMember.objects.create(
            project=project,
            member=instance_admin_user,
            role=20,
            is_active=True,
        )

        system_state = State.objects.create(
            name="System State",
            color="#FF0000",
            group="unstarted",
            project=project,
            workspace=workspace,
            is_system=True,
            sequence=10000,
        )

        url = get_state_url(workspace.slug, project.id, system_state.id) + "mark_as_default/"
        response = client.post(url, format="json")
        assert response.status_code == status.HTTP_204_NO_CONTENT

        system_state.refresh_from_db()
        assert system_state.default is True
