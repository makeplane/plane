# Standard library imports
import json
import uuid
from unittest.mock import patch

# Third party imports
import pytest
from rest_framework import status
from django.urls import reverse

# Module imports
from plane.ee.models import (
    Automation,
    AutomationNode,
    AutomationEdge,
    AutomationVersion,
)
from plane.db.models import ProjectMember
from plane.app.permissions import ROLE
from plane.ee.models import AutomationScopeChoices

@pytest.fixture
def automation_edge_data():
    """Return sample automation edge data for testing"""
    return {
        "execution_order": 1,
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
def create_automation_nodes(
    db, create_automation_version, workspace, project, create_user
):
    """Create and return automation nodes for edge testing"""
    automation, version = create_automation_version

    source_node = AutomationNode.objects.create(
        name="Source Node",
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

    target_node = AutomationNode.objects.create(
        name="Target Node",
        node_type="action",
        handler_name="send_notification",
        config={"message": "Task updated"},
        is_enabled=True,
        version=version,
        workspace=workspace,
        project=project,
        created_by=create_user,
        updated_by=create_user,
    )

    return source_node, target_node, automation, version


@pytest.fixture
def create_automation_edge(
    db, create_automation_nodes, workspace, project, create_user
):
    """Create and return an automation edge instance"""
    source_node, target_node, automation, version = create_automation_nodes

    edge = AutomationEdge.objects.create(
        source_node=source_node,
        target_node=target_node,
        execution_order=0,
        version=version,
        workspace=workspace,
        project=project,
        created_by=create_user,
        updated_by=create_user,
    )
    return edge, source_node, target_node, automation, version


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
class TestAutomationEdgeEndpoint:
    """Test data validation and functionality for AutomationEdgeEndpoint"""

    # Basic CRUD Tests
    def test_get_automation_edges_list_basic(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_edge,
        create_project_member_admin,
    ):
        """Test basic GET list functionality for automation edges"""
        mock_feature_flag.return_value = True

        edge, source_node, target_node, automation, version = create_automation_edge

        url = reverse(
            "automation-edges",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert str(response.data[0]["source_node"]) == str(source_node.id)
        assert str(response.data[0]["target_node"]) == str(target_node.id)
        assert response.data[0]["execution_order"] == 0

    def test_get_automation_edge_detail_basic(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_edge,
        create_project_member_admin,
    ):
        """Test basic GET detail functionality for automation edge"""
        mock_feature_flag.return_value = True

        edge, source_node, target_node, automation, version = create_automation_edge

        url = reverse(
            "automation-edges",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
                "pk": edge.id,
            },
        )
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(edge.id)
        assert str(response.data["source_node"]) == str(source_node.id)
        assert str(response.data["target_node"]) == str(target_node.id)
        assert response.data["execution_order"] == 0

    def test_get_automation_edges_member_permission(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_edge,
        create_project_member_member,  # Member role should also work for GET
    ):
        """Test that members can access GET endpoints"""
        mock_feature_flag.return_value = True

        edge, source_node, target_node, automation, version = create_automation_edge

        url = reverse(
            "automation-edges",
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
    def test_create_automation_edge_valid_data(
        self,
        mock_automation_activity,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_nodes,
        automation_edge_data,
        create_project_member_admin,
    ):
        """Test creating automation edge with valid data"""
        mock_feature_flag.return_value = True

        source_node, target_node, automation, version = create_automation_nodes

        edge_data = {
            **automation_edge_data,
            "source_node": str(source_node.id),
            "target_node": str(target_node.id),
        }

        url = reverse(
            "automation-edges",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        response = session_client.post(
            url, data=json.dumps(edge_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert str(response.data["source_node"]) == str(source_node.id)
        assert str(response.data["target_node"]) == str(target_node.id)
        assert response.data["execution_order"] == edge_data["execution_order"]

        # Verify edge was created in database
        edge = AutomationEdge.objects.get(id=response.data["id"])
        assert edge.source_node == source_node
        assert edge.target_node == target_node
        assert edge.version == version

    def test_create_automation_edge_missing_required_fields(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_nodes,
        create_project_member_admin,
    ):
        """Test creating automation edge with missing required fields"""
        mock_feature_flag.return_value = True

        source_node, target_node, automation, version = create_automation_nodes

        url = reverse(
            "automation-edges",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        # Test missing source_node
        incomplete_data = {
            "target_node": str(target_node.id),
            "execution_order": 1,
        }

        response = session_client.post(
            url, data=json.dumps(incomplete_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "source_node" in response.data

    def test_create_automation_edge_invalid_node_ids(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_nodes,
        create_project_member_admin,
    ):
        """Test creating automation edge with invalid node IDs"""
        mock_feature_flag.return_value = True

        source_node, target_node, automation, version = create_automation_nodes

        url = reverse(
            "automation-edges",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        # Test with non-existent source node
        invalid_data = {
            "source_node": str(uuid.uuid4()),  # Non-existent node
            "target_node": str(target_node.id),
            "execution_order": 1,
        }

        response = session_client.post(
            url, data=json.dumps(invalid_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "source_node" in response.data

    def test_create_automation_edge_self_loop_prevention(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_nodes,
        create_project_member_admin,
    ):
        """Test that self-loops are prevented (source_node == target_node)"""
        mock_feature_flag.return_value = True

        source_node, target_node, automation, version = create_automation_nodes

        url = reverse(
            "automation-edges",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        # Try to create self-loop
        self_loop_data = {
            "source_node": str(source_node.id),
            "target_node": str(source_node.id),  # Same as source
            "execution_order": 1,
        }

        response = session_client.post(
            url, data=json.dumps(self_loop_data), content_type="application/json"
        )

        # Should fail due to database constraint
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_automation_edge_duplicate_prevention(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_edge,
        create_project_member_admin,
    ):
        """Test that duplicate edges are prevented"""
        mock_feature_flag.return_value = True

        edge, source_node, target_node, automation, version = create_automation_edge

        url = reverse(
            "automation-edges",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        # Try to create duplicate edge
        duplicate_data = {
            "source_node": str(source_node.id),
            "target_node": str(target_node.id),
            "execution_order": 2,  # Different execution order but same nodes
        }

        response = session_client.post(
            url, data=json.dumps(duplicate_data), content_type="application/json"
        )

        # Should fail due to unique constraint
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_automation_edge_valid_execution_orders(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_user,
        create_automation_nodes,
        create_project_member_admin,
    ):
        """Test creating automation edges with various execution orders"""
        mock_feature_flag.return_value = True

        source_node, target_node, automation, version = create_automation_nodes

        # Create additional target nodes for different edges
        additional_target = AutomationNode.objects.create(
            name="Additional Target",
            node_type="action",
            handler_name="log_action",
            config={},
            is_enabled=True,
            version=version,
            workspace=workspace,
            project=project,
            created_by=create_user,
            updated_by=create_user,
        )

        url = reverse(
            "automation-edges",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        execution_orders = [0, 1]

        for i, execution_order in enumerate(execution_orders):
            target = target_node if i == 0 else additional_target
            valid_data = {
                "source_node": str(source_node.id),
                "target_node": str(target.id),
                "execution_order": execution_order,
            }

            with patch(
                "plane.ee.bgtasks.automation_activity_task.automation_activity.delay"
            ):
                response = session_client.post(
                    url, data=json.dumps(valid_data), content_type="application/json"
                )

            assert response.status_code == status.HTTP_201_CREATED
            assert response.data["execution_order"] == execution_order

    # Data Validation Tests for PATCH
    @patch("plane.ee.bgtasks.automation_activity_task.automation_activity.delay")
    def test_update_automation_edge_valid_data(
        self,
        mock_automation_activity,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_edge,
        create_project_member_admin,
    ):
        """Test updating automation edge with valid data"""
        mock_feature_flag.return_value = True

        edge, source_node, target_node, automation, version = create_automation_edge

        url = reverse(
            "automation-edges",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
                "pk": edge.id,
            },
        )

        update_data = {
            "execution_order": 5,
        }

        response = session_client.patch(
            url, data=json.dumps(update_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["execution_order"] == update_data["execution_order"]

    def test_update_automation_edge_read_only_fields(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_edge,
        create_project_member_admin,
    ):
        """Test that read-only fields cannot be updated"""
        mock_feature_flag.return_value = True

        edge, source_node, target_node, automation, version = create_automation_edge

        url = reverse(
            "automation-edges",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
                "pk": edge.id,
            },
        )

        # Try to update read-only fields
        update_data = {
            "id": str(uuid.uuid4()),  # Read-only
            "workspace": str(uuid.uuid4()),  # Read-only
            "project": str(uuid.uuid4()),  # Read-only
            "created_by": str(uuid.uuid4()),  # Read-only
            "execution_order": 10,  # This should work
        }

        with patch(
            "plane.ee.bgtasks.automation_activity_task.automation_activity.delay"
        ):
            response = session_client.patch(
                url, data=json.dumps(update_data), content_type="application/json"
            )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["execution_order"] == 10
        # Verify read-only fields weren't changed
        assert str(response.data["id"]) == str(edge.id)

    # DELETE Tests
    @patch("plane.ee.bgtasks.automation_activity_task.automation_activity.delay")
    def test_delete_automation_edge_success(
        self,
        mock_automation_activity,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_edge,
        create_project_member_admin,
    ):
        """Test deleting automation edge successfully"""
        mock_feature_flag.return_value = True

        edge, source_node, target_node, automation, version = create_automation_edge

        url = reverse(
            "automation-edges",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
                "pk": edge.id,
            },
        )

        response = session_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify edge was deleted
        assert not AutomationEdge.objects.filter(id=edge.id).exists()

    def test_delete_automation_edge_not_found(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_nodes,
        create_project_member_admin,
    ):
        """Test deleting automation edge with non-existent ID"""
        mock_feature_flag.return_value = True

        source_node, target_node, automation, version = create_automation_nodes

        non_existent_id = uuid.uuid4()
        url = reverse(
            "automation-edges",
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
    def test_create_automation_edge_empty_json(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_nodes,
        create_project_member_admin,
    ):
        """Test creating automation edge with empty JSON"""
        mock_feature_flag.return_value = True

        source_node, target_node, automation, version = create_automation_nodes

        url = reverse(
            "automation-edges",
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

    def test_create_automation_edge_malformed_json(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_nodes,
        create_project_member_admin,
    ):
        """Test creating automation edge with malformed JSON"""
        mock_feature_flag.return_value = True

        source_node, target_node, automation, version = create_automation_nodes

        url = reverse(
            "automation-edges",
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

    def test_create_automation_edge_wrong_data_types(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_nodes,
        create_project_member_admin,
    ):
        """Test creating automation edge with wrong data types"""
        mock_feature_flag.return_value = True

        source_node, target_node, automation, version = create_automation_nodes

        url = reverse(
            "automation-edges",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        invalid_data = {
            "source_node": 123,  # Should be UUID string
            "target_node": True,  # Should be UUID string
            "execution_order": "not_integer",  # Should be integer
        }

        response = session_client.post(
            url, data=json.dumps(invalid_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_automation_edge_negative_execution_order(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_nodes,
        create_project_member_admin,
    ):
        """Test creating automation edge with negative execution order"""
        mock_feature_flag.return_value = True

        source_node, target_node, automation, version = create_automation_nodes

        url = reverse(
            "automation-edges",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        invalid_data = {
            "source_node": str(source_node.id),
            "target_node": str(target_node.id),
            "execution_order": -1,  # Negative execution order
        }

        response = session_client.post(
            url, data=json.dumps(invalid_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    # Permission Tests
    def test_create_automation_edge_member_forbidden(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_nodes,
        automation_edge_data,
        create_project_member_member,  # Member role should be forbidden for POST
    ):
        """Test that members cannot create automation edges"""
        mock_feature_flag.return_value = True

        source_node, target_node, automation, version = create_automation_nodes

        edge_data = {
            **automation_edge_data,
            "source_node": str(source_node.id),
            "target_node": str(target_node.id),
        }

        url = reverse(
            "automation-edges",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        response = session_client.post(
            url, data=json.dumps(edge_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_automation_edge_member_forbidden(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_edge,
        create_project_member_member,
    ):
        """Test that members cannot update automation edges"""
        mock_feature_flag.return_value = True

        edge, source_node, target_node, automation, version = create_automation_edge

        url = reverse(
            "automation-edges",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
                "pk": edge.id,
            },
        )

        update_data = {"execution_order": 5}

        response = session_client.patch(
            url, data=json.dumps(update_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_automation_edge_member_forbidden(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_edge,
        create_project_member_member,
    ):
        """Test that members cannot delete automation edges"""
        mock_feature_flag.return_value = True

        edge, source_node, target_node, automation, version = create_automation_edge

        url = reverse(
            "automation-edges",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
                "pk": edge.id,
            },
        )

        response = session_client.delete(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_access(
        self,
        mock_feature_flag,
        api_client,
        workspace,
        project,
        create_automation_nodes,
    ):
        """Test that unauthenticated requests are rejected"""
        mock_feature_flag.return_value = True

        source_node, target_node, automation, version = create_automation_nodes

        url = reverse(
            "automation-edges",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # Cross-Version Validation Tests
    def test_create_automation_edge_nodes_different_versions(
        self,
        mock_feature_flag,
        session_client,
        workspace,
        project,
        create_automation_nodes,
        create_project_member_admin,
        create_user,
    ):
        """Test creating edge with nodes from different versions fails"""
        mock_feature_flag.return_value = True

        source_node, target_node, automation, version = create_automation_nodes

        # Create a different version
        different_version = AutomationVersion.objects.create(
            automation=automation,
            version_number=2,
            configuration={},
            is_published=False,
            workspace=workspace,
            project=project,
            created_by=create_user,
            updated_by=create_user,
        )

        # Create node in different version
        different_version_node = AutomationNode.objects.create(
            name="Different Version Node",
            node_type="action",
            handler_name="different_handler",
            config={},
            is_enabled=True,
            version=different_version,
            workspace=workspace,
            project=project,
            created_by=create_user,
            updated_by=create_user,
        )

        url = reverse(
            "automation-edges",
            kwargs={
                "slug": workspace.slug,
                "project_id": project.id,
                "automation_id": automation.id,
            },
        )

        invalid_data = {
            "source_node": str(source_node.id),  # From version 1
            "target_node": str(different_version_node.id),  # From version 2
            "execution_order": 1,
        }

        response = session_client.post(
            url, data=json.dumps(invalid_data), content_type="application/json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "target_node" in response.data
