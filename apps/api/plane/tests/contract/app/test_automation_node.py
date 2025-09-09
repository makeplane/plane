# Standard library imports
import json
import uuid
from unittest.mock import patch

# Third party imports
import pytest
from rest_framework import status
from django.urls import reverse

# Module imports
from plane.ee.models import Automation, AutomationNode, AutomationVersion, AutomationScopeChoices
from plane.db.models import ProjectMember
from plane.app.permissions import ROLE


@pytest.fixture
def automation_node_data():
    """Return sample automation node data for testing"""
    return {
        "name": "Test Node",
        "node_type": "trigger",
        "handler_name": "record_created",
        "config": {"field": "status", "value": "done"},
        "is_enabled": True,
    }


@pytest.fixture
def create_automation_version(db, workspace, project, create_user):
    """Create and return an automation with version"""
    automation = Automation.objects.create(
        name="Test Automation",
        description="Test automation description",
        scope=AutomationScopeChoices.WORKITEM,
        status="draft",
        is_enabled=False,
        workspace=workspace,
        project=project,
        created_by=create_user,
        updated_by=create_user,
    )

    version = AutomationVersion.objects.create(
        automation=automation,
        version_number=1,
        configuration={},
        is_published=False,
        workspace=workspace,
        project=project,
        created_by=create_user,
        updated_by=create_user,
    )

    # Set current version
    automation.current_version = version
    automation.save()

    return automation, version


@pytest.fixture
def create_automation_node(
    db, create_automation_version, workspace, project, create_user
):
    """Create and return an automation node instance"""
    automation, version = create_automation_version

    node = AutomationNode.objects.create(
        name="Existing Node",
        node_type="trigger",
        handler_name="record_created",
        config={"field": "status", "value": "in_progress"},
        is_enabled=True,
        version=version,
        workspace=workspace,
        project=project,
        created_by=create_user,
        updated_by=create_user,
    )
    return node, automation, version


@pytest.fixture
def create_project_member_admin(db, workspace, project, create_user):
    """Create and return a project member with admin role"""
    project_member = ProjectMember.objects.create(
        workspace=workspace,
        project=project,
        member=create_user,
        role=ROLE.ADMIN.value,
        is_active=True,
    )
    return project_member


@pytest.fixture
def create_project_member_member(db, workspace, project, create_user):
    """Create and return a project member with member role"""
    project_member = ProjectMember.objects.create(
        workspace=workspace,
        project=project,
        member=create_user,
        role=ROLE.MEMBER.value,
        is_active=True,
    )
    return project_member


@pytest.mark.contract
@pytest.mark.django_db
class TestAutomationNodeEndpoint:
    """Test data validation and functionality for AutomationNodeEndpoint"""

    # Basic CRUD Tests
    def test_get_automation_nodes_list_basic(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_node,
        create_project_member_admin,
    ):
        """Test basic GET list functionality for automation nodes"""
        mock_feature_flag.return_value = True

        node, automation, version = create_automation_node

        url = reverse(
            "automation-nodes",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["name"] == "Existing Node"
        assert response.data[0]["node_type"] == "trigger"
        assert response.data[0]["handler_name"] == "record_created"

    def test_get_automation_node_detail_basic(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_node,
        create_project_member_admin,
    ):
        """Test basic GET detail functionality for automation node"""
        mock_feature_flag.return_value = True

        node, automation, version = create_automation_node

        url = reverse(
            "automation-nodes",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
                "pk": node.id,
            },
        )
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(node.id)
        assert response.data["name"] == "Existing Node"
        assert response.data["node_type"] == "trigger"
        assert response.data["handler_name"] == "record_created"

    def test_get_automation_nodes_member_permission(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_node,
        create_project_member_member,  # Member role should also work for GET
    ):
        """Test that members can access GET endpoints"""
        mock_feature_flag.return_value = True

        node, automation, version = create_automation_node

        url = reverse(
            "automation-nodes",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    # Data Validation Tests for POST
    @patch("plane.ee.bgtasks.automation_activity_task.automation_activity.delay")
    def test_create_automation_node_valid_data(
        self,
        mock_automation_activity,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_version,
        automation_node_data,
        create_project_member_admin,
    ):
        """Test creating automation node with valid data"""
        mock_feature_flag.return_value = True

        automation, version = create_automation_version

        url = reverse(
            "automation-nodes",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        response = session_client.post(
            url, data=json.dumps(automation_node_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == automation_node_data["name"]
        assert response.data["node_type"] == automation_node_data["node_type"]
        assert response.data["handler_name"] == automation_node_data["handler_name"]
        assert response.data["config"] == automation_node_data["config"]
        assert response.data["is_enabled"] == automation_node_data["is_enabled"]

        # Verify node was created in database
        node = AutomationNode.objects.get(id=response.data["id"])
        assert node.name == automation_node_data["name"]
        assert node.version == version

    def test_create_automation_node_missing_required_fields(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_version,
        create_project_member_admin,
    ):
        """Test creating automation node with missing required fields"""
        mock_feature_flag.return_value = True

        automation, version = create_automation_version

        url = reverse(
            "automation-nodes",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        # Test missing name
        incomplete_data = {
            "node_type": "trigger",
            "handler_name": "record_created",
            "config": {},
        }

        response = session_client.post(
            url, data=json.dumps(incomplete_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "name" in response.data

    def test_create_automation_node_invalid_node_type(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_version,
        create_project_member_admin,
    ):
        """Test creating automation node with invalid node_type"""
        mock_feature_flag.return_value = True

        automation, version = create_automation_version

        url = reverse(
            "automation-nodes",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        invalid_data = {
            "name": "Test Node",
            "node_type": "invalid_type",  # Invalid node type
            "handler_name": "record_created",
            "config": {},
            "is_enabled": True,
        }

        response = session_client.post(
            url, data=json.dumps(invalid_data), content_type="application/json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_automation_node_valid_node_types(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_version,
        create_project_member_admin,
    ):
        """Test creating automation nodes with all valid node types"""
        mock_feature_flag.return_value = True

        automation, version = create_automation_version

        url = reverse(
            "automation-nodes",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        valid_node_types = ["trigger", "action", "condition"]  # From NodeTypeChoices

        for i, node_type in enumerate(valid_node_types):
            valid_data = {
                "name": f"Test {node_type.title()} Node {i}",
                "node_type": node_type,
                "handler_name": f"test_handler_{i}",
                "config": {"test": f"value_{i}"},
                "is_enabled": True,
            }

            with patch(
                "plane.ee.bgtasks.automation_activity_task.automation_activity.delay"
            ):
                response = session_client.post(
                    url, data=json.dumps(valid_data), content_type="application/json"
                )

            assert response.status_code == status.HTTP_201_CREATED
            assert response.data["node_type"] == node_type

    def test_create_automation_node_config_validation(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_version,
        create_project_member_admin,
    ):
        """Test creating automation node with various config data types"""
        mock_feature_flag.return_value = True

        automation, version = create_automation_version

        url = reverse(
            "automation-nodes",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        # Test with complex config
        complex_config_data = {
            "name": "Complex Config Node",
            "node_type": "action",
            "handler_name": "send_notification",
            "config": {
                "notification_type": "email",
                "recipients": ["user1@example.com", "user2@example.com"],
                "template_id": 123,
                "variables": {
                    "project_name": "{{project.name}}",
                    "issue_title": "{{issue.title}}",
                },
                "enabled": True,
            },
            "is_enabled": True,
        }

        with patch(
            "plane.ee.bgtasks.automation_activity_task.automation_activity.delay"
        ):
            response = session_client.post(
                url,
                data=json.dumps(complex_config_data),
                content_type="application/json",
            )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["config"] == complex_config_data["config"]

    # Data Validation Tests for PATCH
    @patch("plane.ee.bgtasks.automation_activity_task.automation_activity.delay")
    def test_update_automation_node_valid_data(
        self,
        mock_automation_activity,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_node,
        create_project_member_admin,
    ):
        """Test updating automation node with valid data"""
        mock_feature_flag.return_value = True

        node, automation, version = create_automation_node

        url = reverse(
            "automation-nodes",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
                "pk": node.id,
            },
        )

        update_data = {
            "name": "Updated Node Name",
            "handler_name": "updated_handler",
            "config": {"updated": "config"},
            "is_enabled": False,
        }

        response = session_client.patch(
            url, data=json.dumps(update_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == update_data["name"]
        assert response.data["handler_name"] == update_data["handler_name"]
        assert response.data["config"] == update_data["config"]
        assert response.data["is_enabled"] == update_data["is_enabled"]

    def test_update_automation_node_invalid_node_type(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_node,
        create_project_member_admin,
    ):
        """Test updating automation node with invalid node_type"""
        mock_feature_flag.return_value = True

        node, automation, version = create_automation_node

        url = reverse(
            "automation-nodes",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
                "pk": node.id,
            },
        )

        update_data = {
            "node_type": "invalid_type",  # Invalid node type
        }

        response = session_client.patch(
            url, data=json.dumps(update_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_update_automation_node_read_only_fields(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_node,
        create_project_member_admin,
    ):
        """Test that read-only fields cannot be updated"""
        mock_feature_flag.return_value = True

        node, automation, version = create_automation_node

        url = reverse(
            "automation-nodes",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
                "pk": node.id,
            },
        )

        # Try to update read-only fields
        update_data = {
            "id": str(uuid.uuid4()),  # Read-only
            "workspace": str(uuid.uuid4()),  # Read-only
            "project": str(uuid.uuid4()),  # Read-only
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
        assert str(response.data["id"]) == str(node.id)

    # DELETE Tests
    @patch("plane.ee.bgtasks.automation_activity_task.automation_activity.delay")
    def test_delete_automation_node_success(
        self,
        mock_automation_activity,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_node,
        create_project_member_admin,
    ):
        """Test deleting automation node successfully"""
        mock_feature_flag.return_value = True

        node, automation, version = create_automation_node

        url = reverse(
            "automation-nodes",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
                "pk": node.id,
            },
        )

        response = session_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify node was deleted
        assert not AutomationNode.objects.filter(id=node.id).exists()

    def test_delete_automation_node_not_found(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_version,
        create_project_member_admin,
    ):
        """Test deleting automation node with non-existent ID"""
        mock_feature_flag.return_value = True

        automation, version = create_automation_version

        non_existent_id = uuid.uuid4()
        url = reverse(
            "automation-nodes",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
                "pk": non_existent_id,
            },
        )

        response = session_client.delete(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    # Edge Cases
    def test_create_automation_node_empty_json(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_version,
        create_project_member_admin,
    ):
        """Test creating automation node with empty JSON"""
        mock_feature_flag.return_value = True

        automation, version = create_automation_version

        url = reverse(
            "automation-nodes",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        response = session_client.post(
            url, data=json.dumps({}), content_type="application/json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_automation_node_malformed_json(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_version,
        create_project_member_admin,
    ):
        """Test creating automation node with malformed JSON"""
        mock_feature_flag.return_value = True

        automation, version = create_automation_version

        url = reverse(
            "automation-nodes",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )
        response = session_client.post(
            url, data="invalid json", content_type="application/json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_automation_node_wrong_data_types(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_version,
        create_project_member_admin,
    ):
        """Test creating automation node with wrong data types"""
        mock_feature_flag.return_value = True

        automation, version = create_automation_version

        url = reverse(
            "automation-nodes",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        invalid_data = {
            "name": 123,  # Should be string
            "node_type": "trigger",
            "handler_name": True,  # Should be string
            "config": "not_json_object",  # Should be dict/object
            "is_enabled": "not_boolean",  # Should be boolean
        }

        response = session_client.post(
            url, data=json.dumps(invalid_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    # Permission Tests (minimal)
    def test_create_automation_node_member_forbidden(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_version,
        automation_node_data,
        create_project_member_member,  # Member role should be forbidden for POST
    ):
        """Test that members cannot create automation nodes"""
        mock_feature_flag.return_value = True

        automation, version = create_automation_version

        url = reverse(
            "automation-nodes",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        response = session_client.post(
            url, data=json.dumps(automation_node_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_access(
        self,
        mock_feature_flag,
        api_client,
        workspace,
        project,
        create_automation_version,
    ):
        """Test that unauthenticated requests are rejected"""
        mock_feature_flag.return_value = True

        automation, version = create_automation_version

        url = reverse(
            "automation-nodes",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
