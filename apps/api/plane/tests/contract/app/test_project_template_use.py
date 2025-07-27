import pytest
import json
import uuid
from unittest.mock import patch, MagicMock
from rest_framework import status

from plane.db.models import (
    Project,
    ProjectMember,
    IssueUserProperty,
    State,
    WorkspaceMember,
    User,
    DeployBoard,
    Intake,
)
from plane.ee.models import (
    ProjectTemplate,
    Template,
    IntakeSetting,
    ProjectAttribute,
    ProjectState,
    ProjectFeature,
)
from plane.payment.flags.flag import FeatureFlag


@pytest.fixture
def project_template_data():
    """Return sample project template data"""
    return {
        "name": "Test Project Template",
        "description": "A test project template",
        "network": 2,
        "logo_props": {
            "in_use": "emoji",
            "emoji": {"value": "🚀", "unicode": "1f680"},
        },
        "module_view": True,
        "cycle_view": True,
        "issue_views_view": True,
        "page_view": True,
        "intake_view": False,
        "is_time_tracking_enabled": False,
        "is_issue_type_enabled": False,
        "guest_view_all_features": False,
        "is_project_updates_enabled": False,
        "is_epic_enabled": False,
        "is_workflow_enabled": False,
        "timezone": "UTC",
        "archive_in": 0,
        "close_in": 0,
        "states": [
            {
                "id": str(uuid.uuid4()),
                "name": "Backlog",
                "color": "#A3A3A3",
                "sequence": 15000,
                "group": "backlog",
                "default": True,
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Todo",
                "color": "#3A3A3A",
                "sequence": 25000,
                "group": "unstarted",
                "default": False,
            },
            {
                "id": str(uuid.uuid4()),
                "name": "In Progress",
                "color": "#F59E0B",
                "sequence": 35000,
                "group": "started",
                "default": False,
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Done",
                "color": "#10B981",
                "sequence": 45000,
                "group": "completed",
                "default": False,
            },
        ],
        "priority": "none",
        "project_state": {},
        "default_assignee": {},
        "project_lead": {},
        "members": [],
        "labels": [],
        "workflows": [],
        "estimates": [],
        "workitem_types": [],
        "epics": {},
        "intake_settings": {
            "is_in_app_enabled": False,
            "is_email_enabled": False,
            "is_form_enabled": False,
        },
    }


@pytest.fixture
def template_base(workspace):
    """Create a base template"""
    return Template.objects.create(
        name="Base Template",
        workspace=workspace,
        template_type=Template.TemplateType.PROJECT,
        description={"content": "Base template description"},
        is_published=True,
    )


@pytest.fixture
def project_template(workspace, template_base, project_template_data):
    """Create a project template"""
    return ProjectTemplate.objects.create(
        workspace=workspace,
        template=template_base,
        **project_template_data,
    )


@pytest.fixture
def project_template_with_intake(workspace, template_base, project_template_data):
    """Create a project template with intake enabled"""
    data = project_template_data.copy()
    data.update(
        {
            "intake_view": True,
            "intake_settings": {
                "is_in_app_enabled": True,
                "is_email_enabled": True,
                "is_form_enabled": True,
            },
        }
    )
    return ProjectTemplate.objects.create(
        workspace=workspace,
        template=template_base,
        **data,
    )


@pytest.fixture
def project_state_for_grouping(workspace):
    """Create a project state for project grouping"""
    return ProjectState.objects.create(
        workspace=workspace,
        name="Active",
        color="#10B981",
        group="active",
        default=True,
    )


@pytest.fixture
def project_template_with_grouping(
    workspace, template_base, project_template_data, project_state_for_grouping
):
    """Create a project template with project grouping enabled"""
    data = project_template_data.copy()
    data.update(
        {
            "priority": "high",
            "project_state": {
                "id": str(project_state_for_grouping.id),
                "name": project_state_for_grouping.name,
                "color": project_state_for_grouping.color,
                "group": project_state_for_grouping.group,
            },
        }
    )
    return ProjectTemplate.objects.create(
        workspace=workspace,
        template=template_base,
        **data,
    )


@pytest.mark.contract
class TestProjectTemplateUseEndpoint:
    """Test project template use endpoint"""

    def get_url(self, workspace_slug):
        """Get the endpoint URL"""
        return f"/api/workspaces/{workspace_slug}/projects/use-template/"

    @patch("plane.ee.views.app.project.template.create_project_from_template.delay")
    @patch("plane.ee.views.app.project.template.model_activity.delay")
    @patch("plane.ee.views.app.project.template.project_activity.delay")
    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    @pytest.mark.django_db
    def test_create_project_from_template_success(
        self,
        mock_check_feature_flag,
        mock_project_activity,
        mock_model_activity,
        mock_create_project_task,
        session_client,
        workspace,
        project_template,
        create_user,
    ):
        """Test successful project creation from template"""
        # Arrange
        mock_check_feature_flag.return_value = True

        url = self.get_url(workspace.slug)
        project_data = {
            "template_id": str(project_template.template.id),
            "name": "New Project from Template",
            "identifier": "NPFT",
            "description": "A project created from template",
        }

        # Act
        response = session_client.post(url, project_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        response_data = response.json()

        # Verify project was created
        assert Project.objects.count() == 1
        project = Project.objects.get(name=project_data["name"])
        assert project.workspace == workspace
        assert project.name == project_data["name"]
        assert project.identifier == project_data["identifier"]
        assert project.description == project_data["description"]

        # Verify template settings were applied
        assert project.module_view == project_template.module_view
        assert project.cycle_view == project_template.cycle_view
        assert project.issue_views_view == project_template.issue_views_view
        assert project.page_view == project_template.page_view
        assert project.intake_view == project_template.intake_view
        assert (
            project.is_time_tracking_enabled
            == project_template.is_time_tracking_enabled
        )
        assert project.is_issue_type_enabled == project_template.is_issue_type_enabled
        assert (
            project.guest_view_all_features == project_template.guest_view_all_features
        )

        # Verify project member was created
        assert ProjectMember.objects.count() == 1
        project_member = ProjectMember.objects.get(project=project, member=create_user)
        assert project_member.role == 20  # Administrator
        assert project_member.is_active is True

        # Verify IssueUserProperty was created
        assert IssueUserProperty.objects.filter(
            project=project, user=create_user
        ).exists()

        # Verify states were created from template
        states = State.objects.filter(project=project)
        assert states.count() == len(project_template.states)

        # Verify template states were created correctly
        state_names = list(states.values_list("name", flat=True))
        expected_state_names = [state["name"] for state in project_template.states]
        assert set(state_names) == set(expected_state_names)

        # Verify default state
        default_state = states.filter(default=True).first()
        assert default_state is not None
        assert default_state.name == "Backlog"

        # Verify ProjectFeature was created
        project_feature = ProjectFeature.objects.get(project=project)
        assert (
            project_feature.is_project_updates_enabled
            == project_template.is_project_updates_enabled
        )
        assert project_feature.is_epic_enabled == project_template.is_epic_enabled
        assert (
            project_feature.is_workflow_enabled == project_template.is_workflow_enabled
        )

        # Verify background tasks were called
        mock_create_project_task.assert_called_once()
        mock_model_activity.assert_called_once()
        mock_project_activity.assert_called_once()

    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    @pytest.mark.django_db
    def test_create_project_missing_template_id(
        self,
        mock_check_feature_flag,
        session_client,
        workspace,
        create_user,
    ):
        """Test creating project without template_id"""
        # Arrange
        mock_check_feature_flag.return_value = True

        url = self.get_url(workspace.slug)
        project_data = {
            "name": "Project Without Template",
            "identifier": "PWOT",
        }

        # Act
        response = session_client.post(url, project_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Template ID is required" in response.json()["error"]
        assert Project.objects.count() == 0

    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    @pytest.mark.django_db
    def test_create_project_invalid_template_id(
        self,
        mock_check_feature_flag,
        session_client,
        workspace,
        create_user,
    ):
        """Test creating project with invalid template_id"""
        # Arrange
        mock_check_feature_flag.return_value = True

        url = self.get_url(workspace.slug)
        project_data = {
            "template_id": str(uuid.uuid4()),  # Non-existent template ID
            "name": "Project With Invalid Template",
            "identifier": "PWIT",
        }

        # Act
        with pytest.raises(ProjectTemplate.DoesNotExist):
            session_client.post(url, project_data, format="json")

    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    @pytest.mark.django_db
    def test_create_project_invalid_project_data(
        self,
        mock_check_feature_flag,
        session_client,
        workspace,
        project_template,
        create_user,
    ):
        """Test creating project with invalid project data"""
        # Arrange
        mock_check_feature_flag.return_value = True

        url = self.get_url(workspace.slug)
        project_data = {
            "template_id": str(project_template.template.id),
            "name": "",  # Empty name - should be invalid
            "identifier": "IPWD",
        }

        # Act
        response = session_client.post(url, project_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Project.objects.count() == 0

    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    @pytest.mark.django_db
    def test_create_project_duplicate_name(
        self,
        mock_check_feature_flag,
        session_client,
        workspace,
        project_template,
        create_user,
    ):
        """Test creating project with duplicate name"""
        # Arrange
        mock_check_feature_flag.return_value = True

        # Create existing project
        Project.objects.create(
            name="Duplicate Project",
            identifier="DP1",
            workspace=workspace,
        )

        url = self.get_url(workspace.slug)
        project_data = {
            "template_id": str(project_template.template.id),
            "name": "Duplicate Project",
            "identifier": "DP2",
        }

        # Act
        response = session_client.post(url, project_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_409_CONFLICT
        assert "already taken" in response.json()["name"]

    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    @pytest.mark.django_db
    def test_create_project_duplicate_identifier(
        self,
        mock_check_feature_flag,
        session_client,
        workspace,
        project_template,
        create_user,
    ):
        """Test creating project with duplicate identifier"""
        # Arrange
        mock_check_feature_flag.return_value = True

        # Create existing project
        Project.objects.create(
            name="First Project",
            identifier="DUP",
            workspace=workspace,
        )

        url = self.get_url(workspace.slug)
        project_data = {
            "template_id": str(project_template.template.id),
            "name": "Second Project",
            "identifier": "DUP",
        }

        # Act
        response = session_client.post(url, project_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_409_CONFLICT
        assert "already taken" in response.json()["identifier"]

    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    @pytest.mark.django_db
    def test_create_project_guest_forbidden(
        self,
        mock_check_feature_flag,
        session_client,
        workspace,
        project_template,
    ):
        """Test that guests cannot create projects from templates"""
        # Arrange
        mock_check_feature_flag.return_value = True

        guest_user = User.objects.create_user(
            email="guest@example.com",
            username="guest",
        )
        WorkspaceMember.objects.create(
            workspace=workspace,
            member=guest_user,
            role=5,  # Guest role
        )

        session_client.force_authenticate(user=guest_user)

        url = self.get_url(workspace.slug)
        project_data = {
            "template_id": str(project_template.template.id),
            "name": "Guest Project",
            "identifier": "GP",
        }

        # Act
        response = session_client.post(url, project_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Project.objects.count() == 0

    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    @pytest.mark.django_db
    def test_create_project_unauthenticated(
        self,
        mock_check_feature_flag,
        client,
        workspace,
        project_template,
    ):
        """Test unauthenticated access"""
        # Arrange
        mock_check_feature_flag.return_value = True

        url = self.get_url(workspace.slug)
        project_data = {
            "template_id": str(project_template.template.id),
            "name": "Unauth Project",
            "identifier": "UP",
        }

        # Act
        response = client.post(url, project_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    @pytest.mark.django_db
    def test_create_project_feature_flag_disabled(
        self,
        mock_check_feature_flag,
        session_client,
        workspace,
        project_template,
        create_user,
    ):
        """Test creating project when feature flag is disabled"""
        # Arrange
        mock_check_feature_flag.return_value = False

        url = self.get_url(workspace.slug)
        project_data = {
            "template_id": str(project_template.template.id),
            "name": "Feature Disabled Project",
            "identifier": "FDP",
        }

        # Act
        response = session_client.post(url, project_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Project.objects.count() == 0

    @patch("plane.ee.views.app.project.template.create_project_from_template.delay")
    @patch("plane.ee.views.app.project.template.model_activity.delay")
    @patch("plane.ee.views.app.project.template.project_activity.delay")
    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    @pytest.mark.django_db
    def test_create_project_with_project_lead(
        self,
        mock_check_feature_flag,
        mock_project_activity,
        mock_model_activity,
        mock_create_project_task,
        session_client,
        workspace,
        project_template,
        create_user,
    ):
        """Test creating project with different project lead"""
        # Arrange
        mock_check_feature_flag.return_value = True

        # Create project lead user
        project_lead = User.objects.create_user(
            email="lead@example.com",
            username="projectlead",
        )
        WorkspaceMember.objects.create(
            workspace=workspace,
            member=project_lead,
            role=15,  # Member role
        )

        url = self.get_url(workspace.slug)
        project_data = {
            "template_id": str(project_template.template.id),
            "name": "Project with Lead",
            "identifier": "PWL",
            "project_lead": project_lead.id,
        }

        # Act
        response = session_client.post(url, project_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_201_CREATED

        # Verify both creator and project lead are project members
        project = Project.objects.get(name=project_data["name"])
        assert ProjectMember.objects.filter(project=project, role=20).count() == 2

        # Verify both have IssueUserProperty
        assert IssueUserProperty.objects.filter(project=project).count() == 2
        assert IssueUserProperty.objects.filter(
            project=project, user=create_user
        ).exists()
        assert IssueUserProperty.objects.filter(
            project=project, user=project_lead
        ).exists()

    @patch("plane.ee.views.app.project.template.create_project_from_template.delay")
    @patch("plane.ee.views.app.project.template.model_activity.delay")
    @patch("plane.ee.views.app.project.template.project_activity.delay")
    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    @pytest.mark.django_db
    def test_create_project_with_intake_settings(
        self,
        mock_check_feature_flag,
        mock_project_activity,
        mock_model_activity,
        mock_create_project_task,
        session_client,
        workspace,
        project_template_with_intake,
        create_user,
    ):
        """Test creating project with intake settings enabled"""
        # Arrange
        mock_check_feature_flag.return_value = True

        url = self.get_url(workspace.slug)
        project_data = {
            "template_id": str(project_template_with_intake.template.id),
            "name": "Project with Intake",
            "identifier": "PWI",
        }

        # Act
        response = session_client.post(url, project_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_201_CREATED

        # Verify project was created with intake enabled
        project = Project.objects.get(name=project_data["name"])
        assert project.intake_view is True

        # Verify intake was created
        intake = Intake.objects.filter(project=project).first()
        assert intake is not None
        assert intake.is_default is True

        # Verify intake settings were created
        intake_setting = IntakeSetting.objects.filter(intake=intake).first()
        assert intake_setting is not None
        assert intake_setting.is_in_app_enabled is True
        assert intake_setting.is_email_enabled is True
        assert intake_setting.is_form_enabled is True

        # Verify deploy boards were created for form and email
        form_deploy_board = DeployBoard.objects.filter(
            entity_identifier=intake.id,
            entity_name="intake",
        ).first()
        assert form_deploy_board is not None

        email_deploy_board = DeployBoard.objects.filter(
            entity_identifier=intake.id,
            entity_name="intake_email",
        ).first()
        assert email_deploy_board is not None

    @patch("plane.ee.views.app.project.template.create_project_from_template.delay")
    @patch("plane.ee.views.app.project.template.model_activity.delay")
    @patch("plane.ee.views.app.project.template.project_activity.delay")
    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    @patch("plane.payment.flags.flag_decorator.check_workspace_feature_flag")
    @patch("plane.ee.utils.workspace_feature.check_workspace_feature")
    @pytest.mark.django_db
    def test_create_project_with_project_grouping(
        self,
        mock_check_workspace_feature,
        mock_check_workspace_feature_flag,
        mock_check_feature_flag,
        mock_project_activity,
        mock_model_activity,
        mock_create_project_task,
        session_client,
        workspace,
        project_template_with_grouping,
        project_state_for_grouping,
        create_user,
    ):
        """Test creating project with project grouping enabled"""
        # Arrange
        mock_check_feature_flag.return_value = True
        mock_check_workspace_feature_flag.return_value = True
        mock_check_workspace_feature.return_value = True

        url = self.get_url(workspace.slug)
        project_data = {
            "template_id": str(project_template_with_grouping.template.id),
            "name": "Project with Grouping",
            "identifier": "PWG",
            "state_id": project_state_for_grouping.id,
            "priority": "high",
        }

        # Act
        response = session_client.post(url, project_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_201_CREATED

        # Verify project attributes were created
        project = Project.objects.get(name=project_data["name"])
        project_attribute = ProjectAttribute.objects.filter(project=project).first()
        assert project_attribute is not None
        assert project_attribute.state == project_state_for_grouping
        assert project_attribute.priority == "high"

    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    @pytest.mark.django_db
    def test_create_project_nonexistent_workspace(
        self,
        mock_check_feature_flag,
        session_client,
        project_template,
        create_user,
    ):
        """Test creating project with non-existent workspace"""
        # Arrange
        mock_check_feature_flag.return_value = True

        url = self.get_url("nonexistent-workspace")
        project_data = {
            "template_id": str(project_template.template.id),
            "name": "Project in Nonexistent Workspace",
            "identifier": "PINW",
        }

        # Act
        response = session_client.post(url, project_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "Workspace does not exist" in response.json()["error"]
