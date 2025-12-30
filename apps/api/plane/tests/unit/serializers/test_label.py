import pytest
from plane.app.serializers import LabelSerializer
from plane.db.models import Project, Label


@pytest.mark.unit
class TestLabelSerializer:
    """Test the LabelSerializer"""

    @pytest.mark.django_db
    def test_label_serializer_create_valid_data(self, db, workspace):
        """Test creating a label with valid data"""
        project = Project.objects.create(name="Test Project", identifier="TEST", workspace=workspace)

        serializer = LabelSerializer(
            data={"name": "Test Label"},
            context={"project_id": project.id},
        )
        assert serializer.is_valid()
        assert serializer.errors == {}
        serializer.save(project_id=project.id)

        label = Label.objects.all().first()
        assert label.name == "Test Label"
        assert label.project == project
        assert label

    @pytest.mark.django_db
    def test_label_serializer_create_duplicate_name(self, db, workspace):
        """Test creating a label with a duplicate name"""
        project = Project.objects.create(name="Test Project", identifier="TEST", workspace=workspace)

        Label.objects.create(name="Test Label", project=project)

        serializer = LabelSerializer(data={"name": "Test Label"}, context={"project_id": project.id})
        assert not serializer.is_valid()
        assert serializer.errors == {"name": ["LABEL_NAME_ALREADY_EXISTS"]}
