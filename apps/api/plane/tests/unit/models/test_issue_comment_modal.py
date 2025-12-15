import pytest

from plane.db.models import IssueComment, Description, Project, Issue, Workspace, State


@pytest.fixture
def workspace(create_user):
    """Create a test workspace"""
    return Workspace.objects.create(
        name="Test Workspace",
        slug="test-workspace",
        owner=create_user,
    )


@pytest.fixture
def project(workspace, create_user):
    """Create a test project"""
    return Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def state(project):
    """Create a test state"""
    return State.objects.create(
        name="Todo",
        project=project,
        group="backlog",
        default=True,
    )


@pytest.fixture
def issue(workspace, project, state, create_user):
    """Create a test issue"""
    return Issue.objects.create(
        name="Test Issue",
        workspace=workspace,
        project=project,
        state=state,
        created_by=create_user,
    )


@pytest.mark.unit
class TestIssueCommentModel:
    """Test the IssueComment model"""

    @pytest.mark.django_db
    def test_issue_comment_creation_creates_description(self, workspace, project, issue, create_user):
        """Test that creating a comment automatically creates a description"""
        # Arrange
        comment_html = "<p>This is a test comment</p>"
        comment_json = {"type": "doc", "content": [{"type": "paragraph", "text": "This is a test comment"}]}

        # Act
        issue_comment = IssueComment.objects.create(
            workspace=workspace,
            project=project,
            issue=issue,
            comment_html=comment_html,
            comment_json=comment_json,
            created_by=create_user,
            updated_by=create_user,
        )

        # Assert
        assert issue_comment.id is not None
        assert issue_comment.comment_stripped == "This is a test comment"
        assert issue_comment.description_id is not None

        # Verify description was created
        description = Description.objects.get(pk=issue_comment.description_id)
        assert description is not None
        assert description.description_html == comment_html
        assert description.description_json == comment_json
        assert description.description_stripped == "This is a test comment"
        assert description.workspace_id == workspace.id
        assert description.project_id == project.id

    @pytest.mark.django_db
    def test_issue_comment_update_updates_description(self, workspace, project, issue, create_user):
        """Test that updating a comment updates its associated description"""
        # Arrange - Create initial comment
        initial_html = "<p>Initial comment</p>"
        initial_json = {"type": "doc", "content": [{"type": "paragraph", "text": "Initial comment"}]}

        issue_comment = IssueComment.objects.create(
            workspace=workspace,
            project=project,
            issue=issue,
            comment_html=initial_html,
            comment_json=initial_json,
            created_by=create_user,
            updated_by=create_user,
        )

        initial_description_id = issue_comment.description_id

        # Act - Update the comment
        updated_html = "<p>Updated comment</p>"
        updated_json = {"type": "doc", "content": [{"type": "paragraph", "text": "Updated comment"}]}

        issue_comment.comment_html = updated_html
        issue_comment.comment_json = updated_json
        issue_comment.save()

        # Assert
        # Refresh from database
        issue_comment.refresh_from_db()
        updated_description = Description.objects.get(pk=initial_description_id)

        # Verify comment was updated
        assert issue_comment.comment_stripped == "Updated comment"
        assert issue_comment.description_id == initial_description_id  # Same description object

        # Verify description was updated
        assert updated_description.description_html == updated_html
        assert updated_description.description_json == updated_json
        assert updated_description.description_stripped == "Updated comment"

    @pytest.mark.django_db
    def test_issue_comment_update_only_changed_fields_in_description(self, workspace, project, issue, create_user):
        """Test that only changed fields are updated in description"""
        # Arrange - Create initial comment
        initial_html = "<p>Initial comment</p>"
        initial_json = {"type": "doc", "content": [{"type": "paragraph", "text": "Initial comment"}]}

        issue_comment = IssueComment.objects.create(
            workspace=workspace,
            project=project,
            issue=issue,
            comment_html=initial_html,
            comment_json=initial_json,
            created_by=create_user,
            updated_by=create_user,
        )

        initial_description_id = issue_comment.description_id

        # Act - Update only the HTML (not JSON)
        updated_html = "<p>Updated comment only HTML</p>"

        issue_comment.comment_html = updated_html
        # comment_json remains the same
        issue_comment.save()

        # Assert
        updated_description = Description.objects.get(pk=initial_description_id)

        # Verify HTML was updated
        assert updated_description.description_html == updated_html
        assert updated_description.description_stripped == "Updated comment only HTML"

        # Verify JSON remained the same
        assert updated_description.description_json == initial_json

    @pytest.mark.django_db
    def test_issue_comment_no_update_when_content_unchanged(self, workspace, project, issue, create_user):
        """Test that description is not updated when comment content doesn't change"""
        # Arrange - Create initial comment
        initial_html = "<p>Test comment</p>"
        initial_json = {"type": "doc", "content": [{"type": "paragraph", "text": "Test comment"}]}

        issue_comment = IssueComment.objects.create(
            workspace=workspace,
            project=project,
            issue=issue,
            comment_html=initial_html,
            comment_json=initial_json,
            created_by=create_user,
            updated_by=create_user,
        )

        initial_description_id = issue_comment.description_id

        # Act - Save without changing content
        issue_comment.save()

        # Assert
        updated_description = Description.objects.get(pk=initial_description_id)

        # Verify description was not updated (updated_at should be the same)
        # Note: This test assumes updated_at is not changed when no fields change
        assert updated_description.description_html == initial_html
        assert updated_description.description_json == initial_json
        assert updated_description.description_stripped == "Test comment"

    @pytest.mark.django_db
    def test_issue_comment_update_creates_description_if_missing(self, workspace, project, issue, create_user):
        """Test that updating a comment creates description if it doesn't exist (legacy data)"""
        # Arrange - Create comment and manually remove description (simulating legacy data)
        initial_html = "<p>Legacy comment</p>"
        initial_json = {"type": "doc", "content": [{"type": "paragraph", "text": "Legacy comment"}]}

        issue_comment = IssueComment.objects.create(
            workspace=workspace,
            project=project,
            issue=issue,
            comment_html=initial_html,
            comment_json=initial_json,
            created_by=create_user,
            updated_by=create_user,
        )

        # Simulate legacy data by removing the description
        if issue_comment.description_id:
            Description.objects.filter(pk=issue_comment.description_id).delete()
            IssueComment.objects.filter(pk=issue_comment.pk).update(description_id=None)
            issue_comment.refresh_from_db()

        assert issue_comment.description_id is None

        # Act - Update the comment
        updated_html = "<p>Updated legacy comment</p>"
        updated_json = {"type": "doc", "content": [{"type": "paragraph", "text": "Updated legacy comment"}]}

        issue_comment.comment_html = updated_html
        issue_comment.comment_json = updated_json
        issue_comment.save()

        # Assert
        issue_comment.refresh_from_db()

        # Verify description was created
        assert issue_comment.description_id is not None
        description = Description.objects.get(pk=issue_comment.description_id)
        assert description.description_html == updated_html
        assert description.description_json == updated_json
        assert description.description_stripped == "Updated legacy comment"

    @pytest.mark.django_db
    def test_issue_comment_strips_html_tags(self, workspace, project, issue, create_user):
        """Test that HTML tags are properly stripped from comment_html"""
        # Arrange
        comment_html = "<p>This is <strong>bold</strong> and <em>italic</em> text</p>"
        comment_json = {"type": "doc", "content": []}

        # Act
        issue_comment = IssueComment.objects.create(
            workspace=workspace,
            project=project,
            issue=issue,
            comment_html=comment_html,
            comment_json=comment_json,
            created_by=create_user,
            updated_by=create_user,
        )

        # Assert
        assert issue_comment.comment_stripped == "This is bold and italic text"

        # Verify description has the same stripped content
        description = Description.objects.get(pk=issue_comment.description_id)
        assert description.description_stripped == "This is bold and italic text"

    @pytest.mark.django_db
    def test_issue_comment_empty_html_creates_empty_stripped(self, workspace, project, issue, create_user):
        """Test that empty HTML results in empty comment_stripped"""
        # Arrange
        comment_html = ""
        comment_json = {"type": "doc", "content": []}

        # Act
        issue_comment = IssueComment.objects.create(
            workspace=workspace,
            project=project,
            issue=issue,
            comment_html=comment_html,
            comment_json=comment_json,
            created_by=create_user,
            updated_by=create_user,
        )

        # Assert
        assert issue_comment.comment_stripped == ""

        # Verify description was created with empty stripped content
        description = Description.objects.get(pk=issue_comment.description_id)

        assert description.description_stripped is None
