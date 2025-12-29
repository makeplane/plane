import pytest
from plane.app.serializers import (
    IssuePropertySerializer,
    IssuePropertyValueSerializer,
    IssuePropertyLiteSerializer,
)
from plane.db.models import (
    Project,
    IssueProperty,
    IssuePropertyValue,
    IssuePropertyTypeChoices,
    Issue,
    State,
)


@pytest.mark.unit
class TestIssuePropertySerializer:
    """Test the IssuePropertySerializer"""

    @pytest.mark.django_db
    def test_create_text_property(self, db, workspace):
        """Test creating a text type property"""
        project = Project.objects.create(
            name="Test Project",
            identifier="TEST",
            workspace=workspace,
        )

        serializer = IssuePropertySerializer(
            data={
                "name": "Client Name",
                "property_type": "text",
                "description": "Name of the client",
            },
            context={"project_id": project.id},
        )
        assert serializer.is_valid(), serializer.errors
        prop = serializer.save(project_id=project.id)

        assert prop.name == "Client Name"
        assert prop.key == "client_name"
        assert prop.property_type == "text"

    @pytest.mark.django_db
    def test_create_select_property_with_options(self, db, workspace):
        """Test creating a select type property with options"""
        project = Project.objects.create(
            name="Test Project",
            identifier="TEST",
            workspace=workspace,
        )

        serializer = IssuePropertySerializer(
            data={
                "name": "Priority Level",
                "property_type": "select",
                "options": [
                    {"value": "Low", "color": "#00FF00"},
                    {"value": "Medium", "color": "#FFFF00"},
                    {"value": "High", "color": "#FF0000"},
                ],
            },
            context={"project_id": project.id},
        )
        assert serializer.is_valid(), serializer.errors
        prop = serializer.save(project_id=project.id)

        assert prop.property_type == "select"
        assert len(prop.options) == 3

    @pytest.mark.django_db
    def test_create_select_property_without_options_fails(self, db, workspace):
        """Test that creating a select property without options fails"""
        project = Project.objects.create(
            name="Test Project",
            identifier="TEST",
            workspace=workspace,
        )

        serializer = IssuePropertySerializer(
            data={
                "name": "Priority Level",
                "property_type": "select",
                "options": [],  # Empty options
            },
            context={"project_id": project.id},
        )
        assert not serializer.is_valid()
        assert "options" in serializer.errors

    @pytest.mark.django_db
    def test_create_boolean_property_with_default(self, db, workspace):
        """Test creating a boolean property with default value"""
        project = Project.objects.create(
            name="Test Project",
            identifier="TEST",
            workspace=workspace,
        )

        serializer = IssuePropertySerializer(
            data={
                "name": "Is Urgent",
                "property_type": "boolean",
                "default_value": False,
            },
            context={"project_id": project.id},
        )
        assert serializer.is_valid(), serializer.errors
        prop = serializer.save(project_id=project.id)

        assert prop.default_value is False

    @pytest.mark.django_db
    def test_create_property_duplicate_name_fails(self, db, workspace):
        """Test that creating a property with duplicate name fails"""
        project = Project.objects.create(
            name="Test Project",
            identifier="TEST",
            workspace=workspace,
        )

        IssueProperty.objects.create(
            name="Client Name",
            property_type="text",
            project=project,
            workspace=workspace,
        )

        serializer = IssuePropertySerializer(
            data={
                "name": "Client Name",
                "property_type": "text",
            },
            context={"project_id": project.id},
        )
        assert not serializer.is_valid()
        assert "name" in serializer.errors

    @pytest.mark.django_db
    def test_invalid_default_value_for_type(self, db, workspace):
        """Test that default_value must match property_type"""
        project = Project.objects.create(
            name="Test Project",
            identifier="TEST",
            workspace=workspace,
        )

        # Boolean type with string default should fail
        serializer = IssuePropertySerializer(
            data={
                "name": "Is Active",
                "property_type": "boolean",
                "default_value": "yes",  # Should be boolean, not string
            },
            context={"project_id": project.id},
        )
        assert not serializer.is_valid()
        assert "default_value" in serializer.errors


@pytest.mark.unit
class TestIssuePropertyValueSerializer:
    """Test the IssuePropertyValueSerializer"""

    @pytest.mark.django_db
    def test_create_text_value(self, db, workspace):
        """Test creating a text property value"""
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

        prop = IssueProperty.objects.create(
            name="Client Name",
            property_type="text",
            project=project,
            workspace=workspace,
        )

        serializer = IssuePropertyValueSerializer(
            data={
                "property": prop.id,
                "value": "Acme Corp",
            },
            context={"project_id": project.id},
        )
        assert serializer.is_valid(), serializer.errors
        value = serializer.save(
            issue_id=issue.id,
            property_id=prop.id,
            project_id=project.id,
        )

        assert value.value == "Acme Corp"

    @pytest.mark.django_db
    def test_create_select_value_invalid_option(self, db, workspace):
        """Test that select value must be a valid option"""
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

        prop = IssueProperty.objects.create(
            name="Quarter",
            property_type="select",
            options=[{"value": "Q1"}, {"value": "Q2"}],
            project=project,
            workspace=workspace,
        )

        serializer = IssuePropertyValueSerializer(
            data={
                "property": prop.id,
                "value": "Q5",  # Not a valid option
            },
            context={"project_id": project.id},
        )
        assert not serializer.is_valid()
        assert "value" in serializer.errors

    @pytest.mark.django_db
    def test_create_number_value_with_string_fails(self, db, workspace):
        """Test that number property rejects string value"""
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

        prop = IssueProperty.objects.create(
            name="Story Points",
            property_type="number",
            project=project,
            workspace=workspace,
        )

        serializer = IssuePropertyValueSerializer(
            data={
                "property": prop.id,
                "value": "not a number",
            },
            context={"project_id": project.id},
        )
        assert not serializer.is_valid()
        assert "value" in serializer.errors

    @pytest.mark.django_db
    def test_required_property_without_value_fails(self, db, workspace):
        """Test that required property must have a value"""
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

        prop = IssueProperty.objects.create(
            name="Required Field",
            property_type="text",
            is_required=True,
            project=project,
            workspace=workspace,
        )

        serializer = IssuePropertyValueSerializer(
            data={
                "property": prop.id,
                "value": None,
            },
            context={"project_id": project.id},
        )
        assert not serializer.is_valid()
        assert "value" in serializer.errors
