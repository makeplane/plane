import pytest

from plane.db.models import (
    Workspace,
    User,
    WorkspaceMember,
    Project,
)
from plane.app.serializers.project import ProjectSerializer
from django.db import IntegrityError
from plane.ee.models.initiative import Initiative, InitiativeProject


@pytest.mark.unit
class TestProjectSerializer:
    """Test the ProjectSerializer"""

    def test_project_serializer_fields(self, db):
        """Test that the serializer includes the correct fields"""

        test_user = User.objects.create(
            email="test_user@example.com", first_name="Test", last_name="User"
        )

        workspace = Workspace.objects.create(
            name="Test Workspace", slug="test-workspace", owner=test_user
        )

        WorkspaceMember.objects.create(member=test_user, role=15, workspace=workspace)

        project = Project.objects.create(
            name="Test Project", identifier="test-project", workspace=workspace
        )

        serializer = ProjectSerializer(project).data

        assert serializer["name"] == "Test Project"
        assert serializer["identifier"] == "TEST-PROJECT"
        assert serializer["workspace"] == workspace.id

    def test_project_serializer_create_with_duplicated_name(self, db):
        """Test that the serializer raises an error when the identifier is incorrect"""

        test_user = User.objects.create(
            email="test_user@example.com", first_name="Test", last_name="User"
        )

        workspace = Workspace.objects.create(
            name="Test Workspace", slug="test-workspace", owner=test_user
        )

        WorkspaceMember.objects.create(member=test_user, role=15, workspace=workspace)

        Project.objects.create(
            name="Test Project", identifier="TEST-PROJECT", workspace=workspace
        )

        project_with_duplicated_name_serializer = ProjectSerializer(
            data={
                "name": "Test Project",
                "identifier": "TEST-PROJECT",
            },
            context={"workspace_id": workspace.id},
        )
        assert project_with_duplicated_name_serializer.is_valid()

        # But saving should raise an IntegrityError
        with pytest.raises(IntegrityError):
            project_with_duplicated_name_serializer.save()

    def test_project_serializer_initiative_ids(self, db):
        """Test that the serializer properly handles initiative_ids updates"""

        test_user = User.objects.create(
            email="test_user@example.com", first_name="Test", last_name="User"
        )

        workspace = Workspace.objects.create(
            name="Test Workspace", slug="test-workspace", owner=test_user
        )

        WorkspaceMember.objects.create(member=test_user, role=15, workspace=workspace)

        project = Project.objects.create(
            name="Test Project", identifier="TEST-PROJECT", workspace=workspace
        )

        # Create some initiatives
        initiative_1 = Initiative.objects.create(
            name="Initiative 1",
            workspace=workspace,
            created_by=test_user,
        )

        initiative_2 = Initiative.objects.create(
            name="Initiative 2",
            workspace=workspace,
            created_by=test_user,
        )

        # Test adding initiatives
        serializer = ProjectSerializer(
            instance=project,
            data={"initiative_ids": [str(initiative_1.id), str(initiative_2.id)]},
            context={"workspace_id": workspace.id, "user_id": test_user.id},
            partial=True,
        )

        assert serializer.is_valid()
        serializer.save()

        # Verify initiatives were linked
        assert InitiativeProject.objects.filter(project=project).count() == 2
        assert InitiativeProject.objects.filter(
            project=project, initiative=initiative_1
        ).exists()
        assert InitiativeProject.objects.filter(
            project=project, initiative=initiative_2
        ).exists()

        # Test removing one initiative
        serializer = ProjectSerializer(
            instance=project,
            data={"initiative_ids": [str(initiative_1.id)]},
            context={"workspace_id": workspace.id, "user_id": test_user.id},
            partial=True,
        )

        assert serializer.is_valid()
        serializer.save()

        # Verify one initiative was removed
        assert InitiativeProject.objects.filter(project=project).count() == 1
        assert InitiativeProject.objects.filter(
            project=project, initiative=initiative_1
        ).exists()
        assert not InitiativeProject.objects.filter(
            project=project, initiative=initiative_2
        ).exists()

        # Test removing all initiatives
        serializer = ProjectSerializer(
            instance=project,
            data={"initiative_ids": []},
            context={"workspace_id": workspace.id, "user_id": test_user.id},
            partial=True,
        )

        assert serializer.is_valid()
        serializer.save()

        # Verify all initiatives were removed
        assert InitiativeProject.objects.filter(project=project).count() == 0
