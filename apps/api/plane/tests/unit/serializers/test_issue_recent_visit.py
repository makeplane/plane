import pytest

from plane.db.models import (
    Workspace,
    Project,
    Issue,
    User,
    IssueAssignee,
    WorkspaceMember,
    ProjectMember,
)
from plane.app.serializers.workspace import IssueRecentVisitSerializer
from django.utils import timezone


@pytest.mark.unit
class TestIssueRecentVisitSerializer:
    """Test the IssueRecentVisitSerializer"""

    def test_issue_recent_visit_serializer_fields(self, db):
        """Test that the serializer includes the correct fields"""

        test_user_1 = User.objects.create(email="test_user_1@example.com", first_name="Test", last_name="User")

        # To test for deleted issue assignee
        test_user_2 = User.objects.create(
            email="test_user_2@example.com",
            first_name="Other",
            last_name="User",
            username="some user name",
        )

        workspace = Workspace.objects.create(name="Test Workspace", slug="test-workspace", owner=test_user_1)

        WorkspaceMember.objects.create(member=test_user_2, role=15, workspace=workspace)

        project = Project.objects.create(name="Test Project", identifier="test-project", workspace=workspace)
        ProjectMember.objects.create(project=project, member=test_user_2)

        issue = Issue.objects.create(
            name="Test Issue",
            workspace=workspace,
            project=project,
        )

        IssueAssignee.objects.create(issue=issue, assignee=test_user_1, project=project)

        # Deleted issue assignee
        IssueAssignee.objects.create(
            issue=issue,
            assignee=test_user_2,
            project=project,
            deleted_at=timezone.now(),
        )

        serialized_data = IssueRecentVisitSerializer(
            issue,
        ).data

        # Check fields are present and correct
        assert "name" in serialized_data
        assert "assignees" in serialized_data
        assert "project_identifier" in serialized_data

        assert serialized_data["name"] == "Test Issue"
        assert serialized_data["project_identifier"] == "TEST-PROJECT"

        # Only including non-deleted issue assignees
        assert serialized_data["assignees"] == [test_user_1.id]
