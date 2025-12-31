import pytest
from uuid import uuid4

from plane.db.models import (
    IssueProperty,
    IssuePropertyValue,
    IssuePropertyTypeChoices,
    Issue,
    Project,
    Workspace,
    State,
)


@pytest.mark.unit
class TestIssuePropertyModel:
    """Test the IssueProperty model"""

    @pytest.mark.django_db
    def test_issue_property_creation(self, create_user, workspace):
        """Test creating an issue property"""
        # Create a project first
        project = Project.objects.create(
            name="Test Project",
            identifier="TEST",
            workspace=workspace,
        )

        # Create an issue property
        issue_property = IssueProperty.objects.create(
            name="Client Name",
            property_type=IssuePropertyTypeChoices.TEXT,
            project=project,
            workspace=workspace,
        )

        # Verify it was created with auto-generated key
        assert issue_property.id is not None
        assert issue_property.name == "Client Name"
        assert issue_property.key == "client_name"  # Auto-generated from name
        assert issue_property.property_type == "text"
        assert issue_property.project == project

    @pytest.mark.django_db
    def test_issue_property_key_generation(self, create_user, workspace):
        """Test that key is auto-generated from name"""
        project = Project.objects.create(
            name="Test Project",
            identifier="TEST",
            workspace=workspace,
        )

        # Create property with spaces and special characters in name
        prop1 = IssueProperty.objects.create(
            name="Cost Center ID",
            property_type=IssuePropertyTypeChoices.TEXT,
            project=project,
            workspace=workspace,
        )

        assert prop1.key == "cost_center_id"

        # Create another with same name - should get unique key
        prop2 = IssueProperty.objects.create(
            name="Cost Center ID",
            property_type=IssuePropertyTypeChoices.NUMBER,
            project=project,
            workspace=workspace,
        )

        # Second one should have incremented key
        assert prop2.key.startswith("cost_center_id")

    @pytest.mark.django_db
    def test_issue_property_select_type_with_options(self, create_user, workspace):
        """Test creating a SELECT type property with options"""
        project = Project.objects.create(
            name="Test Project",
            identifier="TEST",
            workspace=workspace,
        )

        options = [
            {"value": "Q1", "color": "#FF0000"},
            {"value": "Q2", "color": "#00FF00"},
            {"value": "Q3", "color": "#0000FF"},
            {"value": "Q4", "color": "#FFFF00"},
        ]

        issue_property = IssueProperty.objects.create(
            name="Quarter",
            property_type=IssuePropertyTypeChoices.SELECT,
            options=options,
            project=project,
            workspace=workspace,
        )

        assert issue_property.property_type == "select"
        assert len(issue_property.options) == 4
        assert issue_property.options[0]["value"] == "Q1"

    @pytest.mark.django_db
    def test_issue_property_sort_order(self, create_user, workspace):
        """Test that sort_order auto-increments"""
        project = Project.objects.create(
            name="Test Project",
            identifier="TEST",
            workspace=workspace,
        )

        prop1 = IssueProperty.objects.create(
            name="Prop 1",
            property_type=IssuePropertyTypeChoices.TEXT,
            project=project,
            workspace=workspace,
        )

        prop2 = IssueProperty.objects.create(
            name="Prop 2",
            property_type=IssuePropertyTypeChoices.TEXT,
            project=project,
            workspace=workspace,
        )

        assert prop2.sort_order > prop1.sort_order


@pytest.mark.unit
class TestIssuePropertyValueModel:
    """Test the IssuePropertyValue model"""

    @pytest.mark.django_db
    def test_issue_property_value_creation(self, create_user, workspace):
        """Test creating an issue property value"""
        # Create project
        project = Project.objects.create(
            name="Test Project",
            identifier="TEST",
            workspace=workspace,
        )

        # Create state
        state = State.objects.create(
            name="Open",
            project=project,
            workspace=workspace,
        )

        # Create issue
        issue = Issue.objects.create(
            name="Test Issue",
            project=project,
            workspace=workspace,
            state=state,
        )

        # Create property
        issue_property = IssueProperty.objects.create(
            name="Client Name",
            property_type=IssuePropertyTypeChoices.TEXT,
            project=project,
            workspace=workspace,
        )

        # Create property value
        property_value = IssuePropertyValue.objects.create(
            issue=issue,
            property=issue_property,
            value="Acme Corp",
            project=project,
            workspace=workspace,
        )

        assert property_value.id is not None
        assert property_value.value == "Acme Corp"
        assert property_value.issue == issue
        assert property_value.property == issue_property

    @pytest.mark.django_db
    def test_issue_property_value_json_types(self, create_user, workspace):
        """Test that value field stores different JSON types correctly"""
        project = Project.objects.create(
            name="Test Project",
            identifier="TEST",
            workspace=workspace,
        )

        state = State.objects.create(
            name="Open",
            project=project,
            workspace=workspace,
        )

        issue = Issue.objects.create(
            name="Test Issue",
            project=project,
            workspace=workspace,
            state=state,
        )

        # Test TEXT type
        text_prop = IssueProperty.objects.create(
            name="Text Field",
            property_type=IssuePropertyTypeChoices.TEXT,
            project=project,
            workspace=workspace,
        )
        text_value = IssuePropertyValue.objects.create(
            issue=issue,
            property=text_prop,
            value="Hello World",
            project=project,
            workspace=workspace,
        )
        assert text_value.value == "Hello World"

        # Test NUMBER type
        number_prop = IssueProperty.objects.create(
            name="Number Field",
            property_type=IssuePropertyTypeChoices.NUMBER,
            project=project,
            workspace=workspace,
        )
        number_value = IssuePropertyValue.objects.create(
            issue=issue,
            property=number_prop,
            value=42.5,
            project=project,
            workspace=workspace,
        )
        assert number_value.value == 42.5

        # Test BOOLEAN type
        bool_prop = IssueProperty.objects.create(
            name="Boolean Field",
            property_type=IssuePropertyTypeChoices.BOOLEAN,
            project=project,
            workspace=workspace,
        )
        bool_value = IssuePropertyValue.objects.create(
            issue=issue,
            property=bool_prop,
            value=True,
            project=project,
            workspace=workspace,
        )
        assert bool_value.value is True

        # Test MULTI_SELECT type (array)
        multi_prop = IssueProperty.objects.create(
            name="Multi Select Field",
            property_type=IssuePropertyTypeChoices.MULTI_SELECT,
            options=[{"value": "opt1"}, {"value": "opt2"}, {"value": "opt3"}],
            project=project,
            workspace=workspace,
        )
        multi_value = IssuePropertyValue.objects.create(
            issue=issue,
            property=multi_prop,
            value=["opt1", "opt2"],
            project=project,
            workspace=workspace,
        )
        assert multi_value.value == ["opt1", "opt2"]
