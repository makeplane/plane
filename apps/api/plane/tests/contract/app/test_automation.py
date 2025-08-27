# Standard library imports
import json
import uuid
from unittest.mock import patch

# Third party imports
import pytest
from rest_framework import status
from django.urls import reverse

# Module imports
from plane.ee.models import Automation, AutomationScopeChoices
from plane.db.models import WorkspaceMember, BotTypeEnum, ProjectMember
from plane.app.permissions import ROLE


@pytest.fixture
def automation_data():
    """Return sample automation data for testing"""
    return {
        "name": "Test Automation",
        "description": "Test automation description",
        "scope": AutomationScopeChoices.WORKITEM,
        "status": "draft",
        "is_enabled": False,
    }


@pytest.fixture
def create_automation(db, workspace, project, create_user):
    """Create and return an automation instance"""
    automation = Automation.objects.create(
        name="Existing Automation",
        description="Existing automation description",
        scope=AutomationScopeChoices.WORKITEM,
        status="draft",
        is_enabled=False,
        workspace=workspace,
        project=project,
        created_by=create_user,
        updated_by=create_user,
    )
    return automation


@pytest.mark.contract
@pytest.mark.django_db
class TestAutomationEndpoint:
    """Test data validation and serializer functionality for AutomationEndpoint"""

    # Basic CRUD Tests (one test per operation to ensure endpoint works)
    def test_get_automations_list_basic(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation,
        create_project_member_admin,
    ):
        """Test basic GET list functionality"""
        mock_feature_flag.return_value = True

        url = reverse(
            "automations", kwargs={"slug": workspace.slug, "project_id": project.id}
        )
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["name"] == "Existing Automation"
        assert response.data[0]["scope"] == AutomationScopeChoices.WORKITEM
        assert "last_run_status" in response.data[0]
        assert "average_run_time" in response.data[0]

    def test_get_automation_detail_basic(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation,
        create_project_member_admin,
    ):
        """Test basic GET detail functionality"""
        mock_feature_flag.return_value = True

        url = reverse(
            "automations",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "pk": create_automation.id,
            },
        )
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(create_automation.id)
        assert response.data["name"] == "Existing Automation"
        assert "nodes" in response.data
        assert "edges" in response.data

    # Data Validation Tests for POST
    @patch("plane.ee.bgtasks.automation_activity_task.automation_activity.delay")
    def test_create_automation_valid_data(
        self,
        mock_automation_activity,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        automation_data,
        create_project_member_admin,
    ):
        """Test creating automation with valid data"""
        mock_feature_flag.return_value = True

        url = reverse(
            "automations", kwargs={"slug": workspace.slug, "project_id": project.id}
        )

        response = session_client.post(
            url, data=json.dumps(automation_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == automation_data["name"]
        assert response.data["scope"] == automation_data["scope"]
        assert response.data["status"] == automation_data["status"]
        assert response.data["is_enabled"] == automation_data["is_enabled"]

        # Verify automation was created in database
        automation = Automation.objects.get(id=response.data["id"])
        assert automation.name == automation_data["name"]
        assert automation.bot_user is not None
        assert automation.bot_user.is_bot is True
        assert automation.bot_user.bot_type == BotTypeEnum.AUTOMATION_BOT

    def test_create_automation_missing_required_fields(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_project_member_admin,
    ):
        """Test creating automation with missing required fields"""
        mock_feature_flag.return_value = True

        url = reverse(
            "automations", kwargs={"slug": workspace.slug, "project_id": project.id}
        )

        # Test missing name
        incomplete_data = {
            "description": "Test description",
            "scope": AutomationScopeChoices.WORKITEM,
            "status": "draft",
        }

        response = session_client.post(
            url, data=json.dumps(incomplete_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "name" in response.data

    def test_create_automation_invalid_scope(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_project_member_admin,
    ):
        """Test creating automation with invalid scope"""
        mock_feature_flag.return_value = True

        url = reverse(
            "automations", kwargs={"slug": workspace.slug, "project_id": project.id}
        )

        invalid_data = {
            "name": "Test Automation",
            "description": "Test description",
            "scope": "invalid_scope",  # Invalid scope
            "status": "draft",
            "is_enabled": False,
        }

        response = session_client.post(
            url, data=json.dumps(invalid_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid scope" in str(response.data)

    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    def test_create_automation_invalid_status(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_project_member_admin,
    ):
        """Test creating automation with invalid status"""
        mock_feature_flag.return_value = True

        url = reverse(
            "automations", kwargs={"slug": workspace.slug, "project_id": project.id}
        )

        invalid_data = {
            "name": "Test Automation",
            "description": "Test description",
            "scope": AutomationScopeChoices.WORKITEM,
            "status": "invalid_status",  # Invalid status
            "is_enabled": False,
        }

        response = session_client.post(
            url, data=json.dumps(invalid_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    def test_create_automation_valid_scope_values(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_project_member_admin,
    ):
        """Test creating automation with all valid scope values"""
        mock_feature_flag.return_value = True

        url = reverse(
            "automations", kwargs={"slug": workspace.slug, "project_id": project.id}
        )

        # Test valid scope: "workitem"
        valid_data = {
            "name": "Test Workitem Automation",
            "description": "Test description",
            "scope": AutomationScopeChoices.WORKITEM,  # Valid scope from AutomationScopeChoices
            "status": "draft",
            "is_enabled": False,
        }

        with patch(
            "plane.ee.bgtasks.automation_activity_task.automation_activity.delay"
        ):
            response = session_client.post(
                url, data=json.dumps(valid_data), content_type="application/json"
            )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["scope"] == AutomationScopeChoices.WORKITEM

    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    def test_create_automation_valid_status_values(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_project_member_admin,
    ):
        """Test creating automation with all valid status values"""
        mock_feature_flag.return_value = True

        url = reverse(
            "automations", kwargs={"slug": workspace.slug, "project_id": project.id}
        )

        valid_statuses = [
            "draft",
            "published",
            "disabled",
        ]  # From AutomationStatusChoices

        for i, status_value in enumerate(valid_statuses):
            valid_data = {
                "name": f"Test Automation {i}",
                "description": "Test description",
                "scope": "workitem",
                "status": status_value,
                "is_enabled": False,
            }

            with patch(
                "plane.ee.bgtasks.automation_activity_task.automation_activity.delay"
            ):
                response = session_client.post(
                    url, data=json.dumps(valid_data), content_type="application/json"
                )

            assert response.status_code == status.HTTP_201_CREATED
            assert response.data["status"] == status_value

    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    def test_create_automation_duplicate_name(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation,
        create_project_member_admin,
    ):
        """Test creating automation with duplicate name"""
        mock_feature_flag.return_value = True

        url = reverse(
            "automations", kwargs={"slug": workspace.slug, "project_id": project.id}
        )

        duplicate_data = {
            "name": "Existing Automation",  # Same name as fixture
            "description": "Different description",
            "scope": "workitem",
            "status": "draft",
            "is_enabled": False,
        }

        response = session_client.post(
            url, data=json.dumps(duplicate_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Automation with this name already exists" in response.data["error"]

    # Data Validation Tests for PATCH
    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    @patch("plane.ee.bgtasks.automation_activity_task.automation_activity.delay")
    def test_update_automation_valid_data(
        self,
        mock_automation_activity,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation,
        create_project_member_admin,
    ):
        """Test updating automation with valid data"""
        mock_feature_flag.return_value = True

        url = reverse(
            "automations",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "pk": create_automation.id,
            },
        )

        update_data = {
            "name": "Updated Automation Name",
            "description": "Updated description",
            "is_enabled": True,
            "status": "published",  # Valid status change
        }

        response = session_client.patch(
            url, data=json.dumps(update_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == update_data["name"]
        assert response.data["description"] == update_data["description"]
        assert response.data["is_enabled"] == update_data["is_enabled"]
        assert response.data["status"] == update_data["status"]

    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    def test_update_automation_invalid_scope(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation,
        create_project_member_admin,
    ):
        """Test updating automation with invalid scope"""
        mock_feature_flag.return_value = True

        url = reverse(
            "automations",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "pk": create_automation.id,
            },
        )

        update_data = {
            "scope": "invalid_scope",  # Invalid scope
        }

        response = session_client.patch(
            url, data=json.dumps(update_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid scope" in str(response.data)

    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    def test_update_automation_read_only_fields(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation,
        create_project_member_admin,
    ):
        """Test that read-only fields cannot be updated"""
        mock_feature_flag.return_value = True

        url = reverse(
            "automations",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "pk": create_automation.id,
            },
        )

        # Try to update read-only fields
        update_data = {
            "id": str(uuid.uuid4()),  # Read-only
            "run_count": 100,  # Read-only
            "workspace": str(uuid.uuid4()),  # Read-only
            "created_by": str(uuid.uuid4()),  # Read-only
            "name": "Updated Name",  # This should work
        }

        with patch(
            "plane.ee.bgtasks.automation_activity_task.automation_activity.delay"
        ):
            response = session_client.patch(
                url, data=json.dumps(update_data), content_type="application/json"
            )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated Name"
        # Verify read-only fields weren't changed
        assert str(response.data["id"]) == str(create_automation.id)
        assert response.data["run_count"] == 0  # Should remain original value

    # Edge Cases
    def test_create_automation_empty_json(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_project_member_admin,
    ):
        """Test creating automation with empty JSON"""
        mock_feature_flag.return_value = True

        url = reverse(
            "automations", kwargs={"slug": workspace.slug, "project_id": project.id}
        )

        response = session_client.post(
            url, data=json.dumps({}), content_type="application/json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_automation_malformed_json(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_project_member_admin,
    ):
        """Test creating automation with malformed JSON"""
        mock_feature_flag.return_value = True

        url = reverse(
            "automations", kwargs={"slug": workspace.slug, "project_id": project.id}
        )

        response = session_client.post(
            url, data="invalid json", content_type="application/json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_automation_wrong_data_types(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_project_member_admin,
    ):
        """Test creating automation with wrong data types"""
        mock_feature_flag.return_value = True

        url = reverse(
            "automations", kwargs={"slug": workspace.slug, "project_id": project.id}
        )

        invalid_data = {
            "name": 123,  # Should be string
            "description": True,  # Should be string
            "scope": "work-item",
            "status": "draft",
            "is_enabled": "not_boolean",  # Should be boolean
        }

        response = session_client.post(
            url, data=json.dumps(invalid_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    # Permission Tests (minimal)
    @patch("plane.payment.flags.flag_decorator.check_feature_flag")
    def test_unauthenticated_access(
        self, mock_feature_flag, api_client, workspace, project
    ):
        """Test that unauthenticated requests are rejected"""
        mock_feature_flag.return_value = True

        url = reverse(
            "automations", kwargs={"slug": workspace.slug, "project_id": project.id}
        )

        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
