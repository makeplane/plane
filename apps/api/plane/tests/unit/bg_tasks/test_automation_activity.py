# Python imports
import pytest
from unittest.mock import Mock, patch

# Module imports
from plane.ee.models import (
    AutomationNode,
    AutomationEdge,
    AutomationVersion,
    Automation,
)
from plane.ee.bgtasks.automation_activity_task import (
    create_automation_activity,
    delete_automation_activity,
    track_automation_field_change,
    update_automation_activity,
    create_automation_node_activity,
    track_automation_node_field_change,
    update_automation_node_activity,
    delete_automation_node_activity,
    create_automation_edge_activity,
    track_automation_edge_field_change,
    update_automation_edge_activity,
    delete_automation_edge_activity,
    automation_activity,
)


@pytest.fixture
def create_automation_version(db, workspace, project, create_user):
    """Create and return an automation with version"""
    automation = Automation.objects.create(
        name="Test Automation",
        description="Test automation description",
        scope="workitem",
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


@pytest.mark.unit
@pytest.mark.django_db
class TestCreateAutomationActivity:
    """Test cases for create_automation_activity function"""

    def test_create_automation_activity_with_valid_data(
        self, create_user, create_automation_version
    ):
        """Test creating automation activity with valid data"""
        # Arrange
        requested_data = '{"name": "Test Automation"}'
        current_instance = None
        automation, version = create_automation_version
        project_id = automation.project.id
        workspace_id = automation.workspace.id
        actor_id = create_user.id
        automation_activities = []
        epoch = 1234567890

        # Act
        create_automation_activity(
            requested_data,
            current_instance,
            automation,
            project_id,
            workspace_id,
            actor_id,
            automation_activities,
            epoch,
        )

        # Assert
        assert len(automation_activities) == 1
        activity = automation_activities[0]
        assert activity.automation == automation
        assert activity.project_id == project_id
        assert activity.automation_version == version
        assert activity.actor_id == actor_id
        assert activity.verb == "created"
        assert activity.field == "automation"
        assert activity.workspace_id == workspace_id
        assert activity.epoch == epoch

    def test_create_automation_activity_with_none_data(
        self, create_user, create_automation_version
    ):
        """Test creating automation activity with None requested_data"""
        # Arrange
        requested_data = None
        current_instance = None
        automation, version = create_automation_version
        automation.current_version = version
        project_id = automation.project.id
        workspace_id = automation.workspace.id
        actor_id = create_user.id
        automation_activities = []
        epoch = 1234567890

        # Act
        create_automation_activity(
            requested_data,
            current_instance,
            automation,
            project_id,
            workspace_id,
            actor_id,
            automation_activities,
            epoch,
        )

        # Assert
        assert len(automation_activities) == 1
        activity = automation_activities[0]
        assert activity.verb == "created"
        assert activity.field == "automation"


class TestDeleteAutomationActivity:
    """Test cases for delete_automation_activity function"""

    def test_delete_automation_activity_with_valid_data(
        self, create_user, create_automation_version
    ):
        """Test deleting automation activity with valid data"""
        # Arrange
        requested_data = None
        current_instance = '{"name": "Test Automation"}'
        automation, version = create_automation_version
        project_id = automation.project.id
        workspace_id = automation.workspace.id
        actor_id = create_user.id
        automation_activities = []
        epoch = 1234567890

        # Act
        delete_automation_activity(
            requested_data,
            current_instance,
            automation,
            workspace_id,
            project_id,
            actor_id,
            automation_activities,
            epoch,
        )

        # Assert
        assert len(automation_activities) == 1
        activity = automation_activities[0]
        assert activity.automation == automation
        assert activity.actor_id == actor_id
        assert activity.verb == "deleted"
        assert activity.field == "automation"
        assert activity.workspace_id == workspace_id
        assert activity.project_id == project_id
        assert activity.epoch == epoch

    def test_delete_automation_activity_with_none_current_instance(
        self, create_user, create_automation_version
    ):
        """Test deleting automation activity with None current_instance"""
        # Arrange
        requested_data = None
        current_instance = None
        automation, version = create_automation_version
        project_id = automation.project.id
        workspace_id = automation.workspace.id
        actor_id = create_user.id
        automation_activities = []
        epoch = 1234567890

        # Act
        delete_automation_activity(
            requested_data,
            current_instance,
            automation,
            workspace_id,
            project_id,
            actor_id,
            automation_activities,
            epoch,
        )

        # Assert
        assert len(automation_activities) == 1
        activity = automation_activities[0]
        assert activity.verb == "deleted"


class TestTrackAutomationFieldChange:
    """Test cases for track_automation_field_change function"""

    def test_track_field_change_when_values_different(
        self, create_user, create_automation_version
    ):
        """Test tracking field change when values are different"""
        # Arrange
        field_name = "name"
        requested_data = {"name": "New Name"}
        current_instance = {"name": "Old Name"}
        automation, version = create_automation_version
        project_id = automation.project.id
        workspace_id = automation.workspace.id
        actor_id = create_user.id
        automation_activities = []
        epoch = 1234567890

        # Act
        track_automation_field_change(
            field_name,
            requested_data,
            current_instance,
            automation,
            project_id,
            workspace_id,
            actor_id,
            automation_activities,
            epoch,
        )

        # Assert
        assert len(automation_activities) == 1
        activity = automation_activities[0]
        assert activity.automation == automation
        assert activity.actor_id == actor_id
        assert activity.verb == "updated"
        assert activity.field == field_name
        assert activity.project_id == project_id
        assert activity.workspace_id == workspace_id
        assert activity.old_value == "Old Name"
        assert activity.new_value == "New Name"
        assert activity.epoch == epoch

    def test_track_field_change_when_values_same(
        self, create_user, create_automation_version
    ):
        """Test tracking field change when values are the same"""
        # Arrange
        field_name = "name"
        requested_data = {"name": "Same Name"}
        current_instance = {"name": "Same Name"}
        automation, version = create_automation_version
        project_id = automation.project.id
        workspace_id = automation.workspace.id
        actor_id = create_user.id
        automation_activities = []
        epoch = 1234567890

        # Act
        track_automation_field_change(
            field_name,
            requested_data,
            current_instance,
            automation,
            project_id,
            workspace_id,
            actor_id,
            automation_activities,
            epoch,
        )

        # Assert
        assert len(automation_activities) == 0


class TestUpdateAutomationActivity:
    """Test cases for update_automation_activity function"""

    def test_update_automation_activity_with_tracked_fields(
        self, create_user, create_automation_version
    ):
        """Test updating automation activity with tracked fields"""
        # Arrange
        requested_data = '{"name": "New Name", "description": "New Description", "unknown_field": "value"}'
        current_instance = '{"name": "Old Name", "description": "Old Description"}'
        automation, version = create_automation_version
        project_id = automation.project.id
        workspace_id = automation.workspace.id
        actor_id = create_user.id
        automation_activities = []
        epoch = 1234567890

        # Act
        update_automation_activity(
            requested_data,
            current_instance,
            automation,
            project_id,
            workspace_id,
            actor_id,
            automation_activities,
            epoch,
        )

        # Assert
        assert len(automation_activities) == 2  # name and description changed
        field_names = [activity.field for activity in automation_activities]
        assert "name" in field_names
        assert "description" in field_names

    def test_update_automation_activity_with_none_data(
        self, create_user, create_automation_version
    ):
        """Test updating automation activity with None data"""
        # Arrange
        requested_data = None
        current_instance = '{"name": "Old Name"}'
        automation, version = create_automation_version
        project_id = automation.project.id
        workspace_id = automation.workspace.id
        actor_id = create_user.id
        automation_activities = []
        epoch = 1234567890

        # Act
        update_automation_activity(
            requested_data,
            current_instance,
            automation,
            project_id,
            workspace_id,
            actor_id,
            automation_activities,
            epoch,
        )

        # Assert
        assert len(automation_activities) == 0


class TestCreateAutomationNodeActivity:
    """Test cases for create_automation_node_activity function"""

    def test_create_automation_node_activity_with_valid_data(
        self, create_user, create_automation_version
    ):
        """Test creating automation node activity with valid data"""
        # Arrange
        requested_data = '{"id": "node_123", "name": "Test Node"}'
        current_instance = None
        automation, version = create_automation_version
        project_id = automation.project.id
        workspace_id = automation.workspace.id
        actor_id = create_user.id
        automation_activities = []
        epoch = 1234567890

        # Act
        create_automation_node_activity(
            requested_data,
            current_instance,
            automation,
            project_id,
            workspace_id,
            actor_id,
            automation_activities,
            epoch,
        )

        # Assert
        assert len(automation_activities) == 1
        activity = automation_activities[0]
        assert activity.automation == automation
        assert activity.automation_node_id == "node_123"
        assert activity.project_id == project_id
        assert activity.automation_version == version
        assert activity.actor_id == actor_id
        assert activity.verb == "created"
        assert activity.field == "automation.node"
        assert activity.workspace_id == workspace_id
        assert activity.epoch == epoch


class TestTrackAutomationNodeFieldChange:
    """Test cases for track_automation_node_field_change function"""

    def test_track_node_field_change_when_values_different(
        self, create_user, create_automation_version
    ):
        """Test tracking node field change when values are different"""
        # Arrange
        field_name = "name"
        requested_data = {"id": "node_123", "name": "New Node Name"}
        current_instance = {"id": "node_123", "name": "Old Node Name"}
        automation, version = create_automation_version
        project_id = automation.project.id
        workspace_id = automation.workspace.id
        actor_id = create_user.id
        automation_activities = []
        epoch = 1234567890

        # Act
        track_automation_node_field_change(
            field_name,
            requested_data,
            current_instance,
            automation,
            project_id,
            workspace_id,
            actor_id,
            automation_activities,
            epoch,
        )

        # Assert
        assert len(automation_activities) == 1
        activity = automation_activities[0]
        assert activity.automation == automation
        assert activity.automation_node_id == "node_123"
        assert activity.actor_id == actor_id
        assert activity.verb == "updated"
        assert activity.field == "node.name"
        assert activity.project_id == project_id
        assert activity.workspace_id == workspace_id
        assert activity.old_value == "Old Node Name"
        assert activity.new_value == "New Node Name"
        assert activity.epoch == epoch


class TestUpdateAutomationNodeActivity:
    """Test cases for update_automation_node_activity function"""

    def test_update_automation_node_activity_with_tracked_fields(
        self, create_user, create_automation_version
    ):
        """Test updating automation node activity with tracked fields"""
        # Arrange
        requested_data = '{"id": "node_123", "name": "New Name", "node_type": "action", "unknown_field": "value"}'
        current_instance = (
            '{"id": "node_123", "name": "Old Name", "node_type": "trigger"}'
        )
        automation, version = create_automation_version
        project_id = automation.project.id
        workspace_id = automation.workspace.id
        actor_id = create_user.id
        automation_activities = []
        epoch = 1234567890

        # Act
        update_automation_node_activity(
            requested_data,
            current_instance,
            automation,
            project_id,
            workspace_id,
            actor_id,
            automation_activities,
            epoch,
        )

        # Assert
        assert len(automation_activities) == 2  # name and node_type changed
        field_names = [activity.field for activity in automation_activities]
        assert "node.name" in field_names
        assert "node.node_type" in field_names


class TestDeleteAutomationNodeActivity:
    """Test cases for delete_automation_node_activity function"""

    def test_delete_automation_node_activity_with_valid_data(
        self, create_user, create_automation_version
    ):
        """Test deleting automation node activity with valid data"""
        # Arrange
        requested_data = '{"id": "node_123", "name": "Test Node"}'
        current_instance = None
        automation, version = create_automation_version
        project_id = automation.project.id
        workspace_id = automation.workspace.id
        actor_id = create_user.id
        automation_activities = []
        epoch = 1234567890

        # Act
        delete_automation_node_activity(
            requested_data,
            current_instance,
            automation,
            project_id,
            workspace_id,
            actor_id,
            automation_activities,
            epoch,
        )

        # Assert
        assert len(automation_activities) == 1
        activity = automation_activities[0]
        assert activity.automation == automation
        assert activity.automation_node_id == "node_123"
        assert activity.actor_id == actor_id
        assert activity.verb == "deleted"
        assert activity.field == "automation.node"
        assert activity.workspace_id == workspace_id
        assert activity.project_id == project_id
        assert activity.epoch == epoch


class TestCreateAutomationEdgeActivity:
    """Test cases for create_automation_edge_activity function"""

    def test_create_automation_edge_activity_with_valid_data(
        self, create_user, create_automation_version
    ):
        """Test creating automation edge activity with valid data"""
        # Arrange
        requested_data = (
            '{"id": "edge_123", "source_node": "node_1", "target_node": "node_2"}'
        )
        current_instance = None
        automation, version = create_automation_version
        project_id = automation.project.id
        workspace_id = automation.workspace.id
        actor_id = create_user.id
        automation_activities = []
        epoch = 1234567890

        # Act
        create_automation_edge_activity(
            requested_data,
            current_instance,
            automation,
            project_id,
            workspace_id,
            actor_id,
            automation_activities,
            epoch,
        )

        # Assert
        assert len(automation_activities) == 1
        activity = automation_activities[0]
        assert activity.automation == automation
        assert activity.project_id == project_id
        assert activity.automation_version == 1
        assert activity.actor_id == actor_id
        assert activity.verb == "created"
        assert activity.field == "automation.edge"
        assert activity.workspace_id == workspace_id
        assert activity.epoch == epoch


class TestTrackAutomationEdgeFieldChange:
    """Test cases for track_automation_edge_field_change function"""

    def test_track_edge_field_change_with_node_fields(self):
        """Test tracking edge field change with source_node or target_node fields"""
        # Arrange
        field_name = "target_node"
        requested_data = {"id": "edge_123", "target_node": "node_2"}
        current_instance = {"id": "edge_123", "target_node": "node_1"}
        automation = Mock()
        project_id = "proj_123"
        workspace_id = "ws_123"
        actor_id = "user_123"
        automation_activities = []
        epoch = 1234567890

        # Act
        track_automation_edge_field_change(
            field_name,
            requested_data,
            current_instance,
            automation,
            project_id,
            workspace_id,
            actor_id,
            automation_activities,
            epoch,
        )

        # Assert
        assert len(automation_activities) == 1
        activity = automation_activities[0]
        assert activity.automation == automation
        assert activity.automation_edge_id == "edge_123"
        assert activity.actor_id == actor_id
        assert activity.verb == "updated"
        assert activity.field == "edge.target_node"
        assert activity.old_value == "node_1"
        assert activity.new_value == "node_2"
        assert activity.old_identifier == "node_1"
        assert activity.new_identifier == "node_2"

    def test_track_edge_field_change_with_non_node_fields(
        self, create_user, create_automation_version
    ):
        """Test tracking edge field change with non-node fields"""
        # Arrange
        field_name = "execution_order"
        requested_data = {"id": "edge_123", "execution_order": 2}
        current_instance = {"id": "edge_123", "execution_order": 1}
        automation, version = create_automation_version
        project_id = automation.project.id
        workspace_id = automation.workspace.id
        actor_id = create_user.id
        automation_activities = []
        epoch = 1234567890

        # Act
        track_automation_edge_field_change(
            field_name,
            requested_data,
            current_instance,
            automation,
            project_id,
            workspace_id,
            actor_id,
            automation_activities,
            epoch,
        )

        # Assert
        assert len(automation_activities) == 1
        activity = automation_activities[0]
        assert activity.field == "edge.execution_order"
        assert activity.old_value == 1
        assert activity.new_value == 2
        assert activity.old_identifier is None
        assert activity.new_identifier is None


class TestUpdateAutomationEdgeActivity:
    """Test cases for update_automation_edge_activity function"""

    def test_update_automation_edge_activity_with_tracked_fields(
        self, create_user, create_automation_version
    ):
        """Test updating automation edge activity with tracked fields"""
        # Arrange
        requested_data = '{"id": "edge_123", "target_node": "node_2", "execution_order": 2, "unknown_field": "value"}'
        current_instance = (
            '{"id": "edge_123", "target_node": "node_1", "execution_order": 1}'
        )
        automation, version = create_automation_version
        project_id = automation.project.id
        workspace_id = automation.workspace.id
        actor_id = create_user.id
        automation_activities = []
        epoch = 1234567890

        # Act
        update_automation_edge_activity(
            requested_data,
            current_instance,
            automation,
            project_id,
            workspace_id,
            actor_id,
            automation_activities,
            epoch,
        )

        # Assert
        assert (
            len(automation_activities) == 2
        )  # target_node and execution_order changed
        field_names = [activity.field for activity in automation_activities]
        assert "edge.target_node" in field_names
        assert "edge.execution_order" in field_names


class TestDeleteAutomationEdgeActivity:
    """Test cases for delete_automation_edge_activity function"""

    def test_delete_automation_edge_activity_with_valid_data(
        self, create_user, create_automation_version
    ):
        """Test deleting automation edge activity with valid data"""
        # Arrange
        requested_data = (
            '{"id": "edge_123", "source_node": "node_1", "target_node": "node_2"}'
        )
        current_instance = None
        automation, version = create_automation_version
        project_id = automation.project.id
        workspace_id = automation.workspace.id
        actor_id = create_user.id
        automation_activities = []
        epoch = 1234567890

        # Act
        delete_automation_edge_activity(
            requested_data,
            current_instance,
            automation,
            project_id,
            workspace_id,
            actor_id,
            automation_activities,
            epoch,
        )

        # Assert
        assert len(automation_activities) == 1
        activity = automation_activities[0]
        assert activity.automation == automation
        assert activity.automation_edge_id == "edge_123"
        assert activity.actor_id == actor_id
        assert activity.verb == "deleted"
        assert activity.field == "automation.edge"
        assert activity.workspace_id == workspace_id
        assert activity.project_id == project_id
        assert activity.epoch == epoch


class TestAutomationActivityTask:
    """Test cases for automation_activity shared task"""

    def test_automation_activity_create_type(
        self, create_user, create_automation_version
    ):
        """Test automation_activity task with create type"""
        # Arrange
        automation, version = create_automation_version

        type_val = "automation.activity.created"
        requested_data = '{"name": "Test Automation"}'
        current_instance = None
        automation_id = automation.id
        project_id = automation.project.id
        actor_id = create_user.id
        slug = automation.workspace.slug
        epoch = 1234567890

        # Act
        result = automation_activity(
            type_val,
            requested_data,
            current_instance,
            automation_id,
            project_id,
            actor_id,
            slug,
            epoch,
        )

        # Assert
        assert result is None

    @patch("plane.ee.bgtasks.automation_activity_task.AutomationActivity")
    @patch("plane.ee.bgtasks.automation_activity_task.Workspace")
    @patch("plane.ee.bgtasks.automation_activity_task.Automation")
    def test_automation_activity_update_type(
        self, create_user, create_automation_version
    ):
        """Test automation_activity task with update type"""
        # Arrange
        automation, version = create_automation_version

        type_val = "automation.activity.updated"
        requested_data = '{"name": "Updated Name"}'
        current_instance = '{"name": "Original Name"}'
        automation_id = automation.id
        project_id = automation.project.id
        actor_id = create_user.id
        slug = automation.workspace.slug
        epoch = 1234567890

        # Act
        result = automation_activity(
            type_val,
            requested_data,
            current_instance,
            automation_id,
            project_id,
            actor_id,
            slug,
            epoch,
        )

        # Assert
        assert result is None

    def test_automation_activity_node_create_type(
        self, create_user, create_automation_version
    ):
        """Test automation_activity task with node create type"""
        # Arrange
        automation, version = create_automation_version

        type_val = "automation.node.activity.created"
        requested_data = '{"id": "node_123", "name": "Test Node"}'
        current_instance = None
        automation_id = automation.id
        project_id = automation.project.id
        actor_id = create_user.id
        slug = automation.workspace.slug
        epoch = 1234567890

        # Act
        result = automation_activity(
            type_val,
            requested_data,
            current_instance,
            automation_id,
            project_id,
            actor_id,
            slug,
            epoch,
        )

        # Assert
        assert result is None

    def test_automation_activity_invalid_type(
        self, create_user, create_automation_version
    ):
        """Test automation_activity task with invalid type"""
        # Arrange
        automation, version = create_automation_version

        type_val = "invalid.activity.type"
        requested_data = '{"name": "Test"}'
        current_instance = None
        automation_id = automation.id
        project_id = automation.project.id
        actor_id = create_user.id
        slug = automation.workspace.slug
        epoch = 1234567890

        # Act
        result = automation_activity(
            type_val,
            requested_data,
            current_instance,
            automation_id,
            project_id,
            actor_id,
            slug,
            epoch,
        )

        # Assert
        assert result is None

    def test_automation_activity_exception_handling(
        self,
        create_user,
        create_automation_version,
    ):
        """Test automation_activity task exception handling"""
        # Arrange
        automation, version = create_automation_version

        type_val = "automation.activity.created"
        requested_data = '{"name": "Test"}'
        current_instance = None
        automation_id = automation.id
        project_id = automation.project.id
        actor_id = create_user.id
        slug = automation.workspace.slug
        epoch = 1234567890

        # Act
        result = automation_activity(
            type_val,
            requested_data,
            current_instance,
            automation_id,
            project_id,
            actor_id,
            slug,
            epoch,
        )

        # Assert
        assert result is None

    def test_automation_activity_all_types_covered(
        self, create_user, create_automation_version
    ):
        """Test that all activity types in ACTIVITY_MAPPER are covered"""
        # Arrange
        automation, version = create_automation_version

        activity_types = [
            "automation.activity.created",
            "automation.activity.updated",
            "automation.activity.deleted",
            "automation.node.activity.created",
            "automation.node.activity.updated",
            "automation.node.activity.deleted",
            "automation.edge.activity.created",
            "automation.edge.activity.updated",
            "automation.edge.activity.deleted",
        ]

        automation_id = automation.id
        project_id = automation.project.id
        actor_id = create_user.id
        slug = automation.workspace.slug
        epoch = 1234567890

        # Act & Assert
        for activity_type in activity_types:
            result = automation_activity(
                activity_type,
                '{"id": "test_123", "name": "Test"}',
                '{"id": "test_123", "name": "Old Test"}',
                automation_id,
                project_id,
                actor_id,
                slug,
                epoch,
            )
            assert result is None

        # Verify all types were processed
        assert len(activity_types) == 11
