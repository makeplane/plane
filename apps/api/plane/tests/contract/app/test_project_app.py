# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid
from unittest import mock

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import (
    Project,
    ProjectIdentifier,
    ProjectMember,
    ProjectUserProperty,
    State,
    WorkspaceMember,
    User,
)


class TestProjectBase:
    def get_project_url(self, workspace_slug: str, pk: uuid.UUID = None, details: bool = False) -> str:
        """
        Constructs the project endpoint URL for the given workspace as reverse() is
        unreliable due to  duplicate 'name' values in URL patterns ('api' and 'app').

        Args:
            workspace_slug (str): The slug of the workspace.
            pk (uuid.UUID, optional): The primary key of a specific project.
            details (bool, optional): If True, constructs the URL for the
            project details endpoint. Defaults to False.
        """
        # Establish the common base URL for all project-related endpoints.
        base_url = f"/api/workspaces/{workspace_slug}/projects/"

        # Specific project instance URL.
        if pk:
            return f"{base_url}{pk}/"

        # Append 'details/' to the base URL.
        if details:
            return f"{base_url}details/"

        # Return the base project list URL.
        return base_url


@pytest.mark.contract
class TestProjectAPIPost(TestProjectBase):
    """Test project POST operations"""

    @pytest.mark.django_db
    def test_create_project_empty_data(self, session_client, workspace):
        """Test creating a project with empty data"""

        url = self.get_project_url(workspace.slug)

        # Test with empty data
        response = session_client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_project_valid_data(self, session_client, workspace, create_user):
        url = self.get_project_url(workspace.slug)

        project_data = {
            "name": "New Project Test",
            "identifier": "NPT",
        }

        user = create_user

        # Make the request
        response = session_client.post(url, project_data, format="json")

        # Check response status
        assert response.status_code == status.HTTP_201_CREATED

        # Verify project was created
        assert Project.objects.count() == 1
        project = Project.objects.get(name=project_data["name"])
        assert project.workspace == workspace

        # Check if the member is created with the correct role
        assert ProjectMember.objects.count() == 1
        project_member = ProjectMember.objects.filter(project=project, member=user).first()
        assert project_member.role == 20  # Administrator
        assert project_member.is_active is True

        # Verify ProjectUserProperty was created
        assert ProjectUserProperty.objects.filter(project=project, user=user).exists()

        # Verify default states were created
        states = State.objects.filter(project=project)
        assert states.count() == 5
        expected_states = ["Backlog", "Todo", "In Progress", "Done", "Cancelled"]
        state_names = list(states.values_list("name", flat=True))
        assert set(state_names) == set(expected_states)

    @pytest.mark.django_db
    def test_create_project_with_project_lead(self, session_client, workspace, create_user):
        """Test creating project with a different project lead"""
        # Create another user to be project lead
        project_lead = User.objects.create_user(email="lead@example.com", username="projectlead")

        # Add project lead to workspace
        WorkspaceMember.objects.create(workspace=workspace, member=project_lead, role=15)

        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Project with Lead",
            "identifier": "PWL",
            "project_lead": project_lead.id,
        }

        response = session_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED

        # Verify both creator and project lead are administrators
        project = Project.objects.get(name=project_data["name"])
        assert ProjectMember.objects.filter(project=project, role=20).count() == 2

        # Verify both have ProjectUserProperty
        assert ProjectUserProperty.objects.filter(project=project).count() == 2

    @pytest.mark.django_db
    def test_create_project_guest_forbidden(self, session_client, workspace):
        """Test that guests cannot create projects"""
        guest_user = User.objects.create_user(email="guest@example.com", username="guest")
        WorkspaceMember.objects.create(workspace=workspace, member=guest_user, role=5)

        session_client.force_authenticate(user=guest_user)

        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Guest Project",
            "identifier": "GP",
        }

        response = session_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Project.objects.count() == 0

    @pytest.mark.django_db
    def test_create_project_unauthenticated(self, client, workspace):
        """Test unauthenticated access"""
        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Unauth Project",
            "identifier": "UP",
        }

        response = client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_create_project_duplicate_name(self, session_client, workspace, create_user):
        """Test creating project with duplicate name"""
        # Create first project
        Project.objects.create(name="Duplicate Name", identifier="DN1", workspace=workspace)

        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Duplicate Name",
            "identifier": "DN2",
        }

        response = session_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_project_duplicate_identifier(self, session_client, workspace, create_user):
        """Test creating project with duplicate identifier"""
        Project.objects.create(name="First Project", identifier="DUP", workspace=workspace)

        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Second Project",
            "identifier": "DUP",
        }

        response = session_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_project_missing_required_fields(self, session_client, workspace, create_user):
        """Test validation with missing required fields"""
        url = self.get_project_url(workspace.slug)

        # Test missing name
        response = session_client.post(url, {"identifier": "MN"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Test missing identifier
        response = session_client.post(url, {"name": "Missing Identifier"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_project_with_all_optional_fields(self, session_client, workspace, create_user):
        """Test creating project with all optional fields"""
        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Full Project",
            "identifier": "FP",
            "description": "A comprehensive test project",
            "network": 2,
            "cycle_view": True,
            "issue_views_view": False,
            "module_view": True,
            "page_view": False,
            "inbox_view": True,
            "guest_view_all_features": True,
            "logo_props": {
                "in_use": "emoji",
                "emoji": {"value": "🚀", "unicode": "1f680"},
            },
        }

        response = session_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED

        response_data = response.json()
        assert response_data["description"] == project_data["description"]
        assert response_data["network"] == project_data["network"]

    # ---------------------------------------------------------------------
    # Phase 02-01 contract coverage: optional template_id input and
    # transactional no-template behavior on the app create route.
    #
    # These tests exercise D-03 (omitted/null = no-template, blank = 400),
    # D-06 (atomic rollback of core writes), and D-08 (post-commit activity
    # dispatch is robust against broker failures). The patch targets live
    # under plane.app.services.project_creation so the tests fail in the
    # RED phase (module not yet present) and validate the shared service in
    # the GREEN phase (Task 2 wires app and v1 through it).
    # ---------------------------------------------------------------------

    @pytest.mark.django_db
    def test_create_project_template_id_none_matches_no_template(
        self, session_client, workspace, create_user
    ):
        """D-03: explicit ``template_id=null`` produces the same no-template
        structure as the omitted case."""
        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Template Null Project",
            "identifier": "TNP",
            "template_id": None,
        }

        response = session_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED

        project = Project.objects.get(name=project_data["name"])
        # ProjectIdentifier must be created exactly once.
        assert ProjectIdentifier.objects.filter(project=project).count() == 1
        # Creator becomes the sole admin membership.
        assert ProjectMember.objects.filter(project=project, member=create_user, role=20).count() == 1
        # ProjectUserProperty row is created for the creator.
        assert ProjectUserProperty.objects.filter(project=project, user=create_user).exists()
        # Default states must be created exactly once and match the contract names.
        states = State.objects.filter(project=project)
        assert states.count() == 5
        assert set(states.values_list("name", flat=True)) == {
            "Backlog",
            "Todo",
            "In Progress",
            "Done",
            "Cancelled",
        }

    @pytest.mark.django_db
    def test_create_project_template_id_blank_returns_400_no_project(
        self, session_client, workspace, create_user
    ):
        """D-03: blank-string ``template_id`` is a validation error and
        must not create any project rows."""
        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Template Blank Project",
            "identifier": "TBP",
            "template_id": "",
        }

        response = session_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        # No partial Project / ProjectIdentifier / ProjectMember / State rows
        # may remain when blank template_id is rejected.
        assert Project.objects.count() == 0
        assert ProjectIdentifier.objects.count() == 0
        assert ProjectMember.objects.count() == 0
        assert State.objects.count() == 0

    @pytest.mark.django_db
    def test_create_project_rolls_back_core_writes_when_default_state_creation_fails(
        self, session_client, workspace, create_user
    ):
        """D-06: when default-state creation inside the shared service
        raises, the entire create transaction must roll back so no Project,
        ProjectIdentifier, ProjectMember, or State rows persist."""
        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Rollback Probe",
            "identifier": "RB",
        }

        forced_error = RuntimeError("forced failure for default state creation")

        with mock.patch(
            "plane.app.services.project_creation.create_default_project_states",
            side_effect=forced_error,
        ):
            response = session_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert Project.objects.count() == 0
        assert ProjectIdentifier.objects.count() == 0
        assert ProjectMember.objects.count() == 0
        assert State.objects.count() == 0

    @pytest.mark.django_db(transaction=True)
    def test_create_project_response_stays_201_when_broker_dispatch_fails(
        self, session_client, workspace, create_user
    ):
        """D-08: model_activity.delay failure after the create transaction
        commits must not roll back the persisted core rows or change the
        successful 201 response. Patches the activity task from the shared
        service module so it covers both app and v1 routes uniformly."""
        url = self.get_project_url(workspace.slug)
        project_data = {
            "name": "Broker Down",
            "identifier": "BD",
        }

        with mock.patch("plane.app.services.project_creation.model_activity") as mocked_activity:
            mocked_activity.delay.side_effect = RuntimeError("broker unavailable")
            response = session_client.post(url, project_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        project = Project.objects.get(id=response.data["id"])
        # ProjectIdentifier, admin ProjectMember, and DEFAULT_STATES must all
        # be persisted because the transaction committed before the on_commit
        # callback fired.
        assert ProjectIdentifier.objects.filter(project=project).count() == 1
        assert ProjectMember.objects.filter(project=project, role=20).count() == 1
        assert State.objects.filter(project=project).count() == 5
        mocked_activity.delay.assert_called_once()


@pytest.mark.contract
class TestProjectAPIGet(TestProjectBase):
    """Test project GET operations"""

    @pytest.mark.django_db
    def test_list_projects_authenticated_admin(self, session_client, workspace, create_user):
        """Test listing projects as workspace admin"""
        # Create a project
        project = Project.objects.create(name="Test Project", identifier="TP", workspace=workspace)

        # Add user as project member
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        url = self.get_project_url(workspace.slug)
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Test Project"
        assert data[0]["identifier"] == "TP"

    @pytest.mark.django_db
    def test_list_projects_authenticated_guest(self, session_client, workspace):
        """Test listing projects as workspace guest"""
        # Create a guest user
        guest_user = User.objects.create_user(email="guest@example.com", username="guest")
        WorkspaceMember.objects.create(workspace=workspace, member=guest_user, role=5, is_active=True)

        # Create projects
        project1 = Project.objects.create(name="Project 1", identifier="P1", workspace=workspace)

        Project.objects.create(name="Project 2", identifier="P2", workspace=workspace)

        # Add guest to only one project
        ProjectMember.objects.create(project=project1, member=guest_user, role=10, is_active=True)

        session_client.force_authenticate(user=guest_user)

        url = self.get_project_url(workspace.slug)
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Guest should only see projects they're members of
        assert len(data) == 1
        assert data[0]["name"] == "Project 1"

    @pytest.mark.django_db
    def test_list_projects_unauthenticated(self, client, workspace):
        """Test listing projects without authentication"""
        url = self.get_project_url(workspace.slug)
        response = client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_list_detail_projects(self, session_client, workspace, create_user):
        """Test listing projects with detailed information"""
        # Create a project
        project = Project.objects.create(
            name="Detailed Project",
            identifier="DP",
            workspace=workspace,
            description="A detailed test project",
        )

        # Add user as project member
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        url = self.get_project_url(workspace.slug, details=True)
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Detailed Project"
        assert data[0]["description"] == "A detailed test project"

    @pytest.mark.django_db
    def test_retrieve_project_success(self, session_client, workspace, create_user):
        """Test retrieving a specific project"""
        # Create a project
        project = Project.objects.create(
            name="Retrieve Test Project",
            identifier="RTP",
            workspace=workspace,
            description="Test project for retrieval",
        )

        # Add user as project member
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        url = self.get_project_url(workspace.slug, pk=project.id)
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Retrieve Test Project"
        assert data["identifier"] == "RTP"
        assert data["description"] == "Test project for retrieval"

    @pytest.mark.django_db
    def test_retrieve_project_not_found(self, session_client, workspace, create_user):
        """Test retrieving a non-existent project"""
        fake_uuid = uuid.uuid4()
        url = self.get_project_url(workspace.slug, pk=fake_uuid)
        response = session_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_retrieve_archived_project(self, session_client, workspace, create_user):
        """Test retrieving an archived project"""
        # Create an archived project
        project = Project.objects.create(
            name="Archived Project",
            identifier="AP",
            workspace=workspace,
            archived_at=timezone.now(),
        )

        # Add user as project member
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        url = self.get_project_url(workspace.slug, pk=project.id)
        response = session_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.contract
class TestProjectAPIPatchDelete(TestProjectBase):
    """Test project PATCH, and DELETE operations"""

    @pytest.mark.django_db
    def test_partial_update_project_success(self, session_client, workspace, create_user):
        """Test successful partial update of project"""
        # Create a project
        project = Project.objects.create(
            name="Original Project",
            identifier="OP",
            workspace=workspace,
            description="Original description",
        )

        # Add user as project administrator
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        url = self.get_project_url(workspace.slug, pk=project.id)
        update_data = {
            "name": "Updated Project",
            "description": "Updated description",
            "cycle_view": True,
            "module_view": False,
        }

        response = session_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK

        # Verify project was updated
        project.refresh_from_db()
        assert project.name == "Updated Project"
        assert project.description == "Updated description"
        assert project.cycle_view is True
        assert project.module_view is False

    @pytest.mark.django_db
    def test_partial_update_project_forbidden_non_admin(self, session_client, workspace):
        """Test that non-admin project members cannot update project"""
        # Create a project
        project = Project.objects.create(name="Protected Project", identifier="PP", workspace=workspace)

        # Create a member user (not admin)
        member_user = User.objects.create_user(email="member@example.com", username="member")
        WorkspaceMember.objects.create(workspace=workspace, member=member_user, role=15, is_active=True)
        ProjectMember.objects.create(project=project, member=member_user, role=15, is_active=True)

        session_client.force_authenticate(user=member_user)

        url = self.get_project_url(workspace.slug, pk=project.id)
        update_data = {"name": "Hacked Project"}

        response = session_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_partial_update_duplicate_name_conflict(self, session_client, workspace, create_user):
        """Test updating project with duplicate name returns conflict"""
        # Create two projects
        Project.objects.create(name="Project One", identifier="P1", workspace=workspace)
        project2 = Project.objects.create(name="Project Two", identifier="P2", workspace=workspace)

        ProjectMember.objects.create(project=project2, member=create_user, role=20, is_active=True)

        url = self.get_project_url(workspace.slug, pk=project2.id)
        update_data = {"name": "Project One"}  # Duplicate name

        response = session_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_partial_update_duplicate_identifier_conflict(self, session_client, workspace, create_user):
        """Test updating project with duplicate identifier returns conflict"""
        # Create two projects
        Project.objects.create(name="Project One", identifier="P1", workspace=workspace)
        project2 = Project.objects.create(name="Project Two", identifier="P2", workspace=workspace)

        ProjectMember.objects.create(project=project2, member=create_user, role=20, is_active=True)

        url = self.get_project_url(workspace.slug, pk=project2.id)
        update_data = {"identifier": "P1"}  # Duplicate identifier

        response = session_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_partial_update_invalid_data(self, session_client, workspace, create_user):
        """Test partial update with invalid data"""
        project = Project.objects.create(name="Valid Project", identifier="VP", workspace=workspace)

        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        url = self.get_project_url(workspace.slug, pk=project.id)
        update_data = {"name": ""}

        response = session_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_delete_project_success_project_admin(self, session_client, workspace, create_user):
        """Test successful project deletion by project admin"""
        project = Project.objects.create(name="Delete Me", identifier="DM", workspace=workspace)

        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        url = self.get_project_url(workspace.slug, pk=project.id)
        response = session_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Project.objects.filter(id=project.id).exists()

    @pytest.mark.django_db
    def test_delete_project_success_workspace_admin(self, session_client, workspace):
        """Test successful project deletion by workspace admin"""
        # Create workspace admin user
        workspace_admin = User.objects.create_user(email="admin@example.com", username="admin")
        WorkspaceMember.objects.create(workspace=workspace, member=workspace_admin, role=20, is_active=True)

        project = Project.objects.create(name="Delete Me", identifier="DM", workspace=workspace)

        session_client.force_authenticate(user=workspace_admin)

        url = self.get_project_url(workspace.slug, pk=project.id)
        response = session_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Project.objects.filter(id=project.id).exists()

    @pytest.mark.django_db
    def test_delete_project_forbidden_non_admin(self, session_client, workspace):
        """Test that non-admin users cannot delete projects"""
        # Create a member user (not admin)
        member_user = User.objects.create_user(email="member@example.com", username="member")
        WorkspaceMember.objects.create(workspace=workspace, member=member_user, role=15, is_active=True)

        project = Project.objects.create(name="Protected Project", identifier="PP", workspace=workspace)

        ProjectMember.objects.create(project=project, member=member_user, role=15, is_active=True)

        session_client.force_authenticate(user=member_user)

        url = self.get_project_url(workspace.slug, pk=project.id)
        response = session_client.delete(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Project.objects.filter(id=project.id).exists()

    @pytest.mark.django_db
    def test_delete_project_unauthenticated(self, client, workspace):
        """Test unauthenticated project deletion"""
        project = Project.objects.create(name="Protected Project", identifier="PP", workspace=workspace)

        url = self.get_project_url(workspace.slug, pk=project.id)
        response = client.delete(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert Project.objects.filter(id=project.id).exists()
