"""
Integration tests for Issue API custom_fields validation.

Tests that the Issue create/update API endpoints properly validate
custom_fields using IssuePropertyValueSerializer, ensuring type safety
and required field enforcement.
"""
import pytest
from django.urls import reverse
from rest_framework import status

from plane.db.models import (
    Project,
    IssueProperty,
    IssuePropertyValue,
    Issue,
    State,
    ProjectMember,
)


@pytest.mark.contract
class TestIssueCustomFieldsValidation:
    """Test that Issue API validates custom_fields correctly"""

    @pytest.fixture
    def project_with_member(self, db, workspace, create_user):
        """Create a project with the test user as admin member"""
        project = Project.objects.create(
            name="Test Project",
            identifier="TEST",
            workspace=workspace,
        )
        ProjectMember.objects.create(
            project=project,
            member=create_user,
            role=20,  # Admin
            is_active=True,
        )
        return project

    @pytest.fixture
    def default_state(self, db, workspace, project_with_member):
        """Create a default state for issues"""
        return State.objects.create(
            name="Open",
            project=project_with_member,
            workspace=workspace,
        )

    @pytest.fixture
    def properties(self, db, workspace, project_with_member, create_user):
        """Create various property types for testing"""
        return {
            "story_points": IssueProperty.objects.create(
                name="Story Points",
                property_type="number",
                project=project_with_member,
                workspace=workspace,
                created_by=create_user,
            ),
            "is_urgent": IssueProperty.objects.create(
                name="Is Urgent",
                property_type="boolean",
                project=project_with_member,
                workspace=workspace,
                created_by=create_user,
            ),
            "quarter": IssueProperty.objects.create(
                name="Quarter",
                property_type="select",
                options=[
                    {"value": "Q1", "color": "#FF0000"},
                    {"value": "Q2", "color": "#00FF00"},
                    {"value": "Q3", "color": "#0000FF"},
                    {"value": "Q4", "color": "#FFFF00"},
                ],
                project=project_with_member,
                workspace=workspace,
                created_by=create_user,
            ),
            "tags": IssueProperty.objects.create(
                name="Tags",
                property_type="multi_select",
                options=[
                    {"value": "bug", "color": "#FF0000"},
                    {"value": "feature", "color": "#00FF00"},
                    {"value": "docs", "color": "#0000FF"},
                ],
                project=project_with_member,
                workspace=workspace,
                created_by=create_user,
            ),
            "required_field": IssueProperty.objects.create(
                name="Required Field",
                property_type="text",
                is_required=True,
                project=project_with_member,
                workspace=workspace,
                created_by=create_user,
            ),
            "due_date": IssueProperty.objects.create(
                name="Due Date",
                property_type="date",
                project=project_with_member,
                workspace=workspace,
                created_by=create_user,
            ),
        }

    @pytest.mark.django_db
    def test_create_issue_with_valid_custom_fields(
        self, session_client, workspace, project_with_member, default_state, properties
    ):
        """Test creating an issue with valid custom_fields values"""
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/issues/"
        data = {
            "name": "Test Issue",
            "state_id": str(default_state.id),
            "custom_fields": {
                "story_points": 5,
                "is_urgent": True,
                "quarter": "Q1",
                "tags": ["bug", "feature"],
                "required_field": "Some value",
                "due_date": "2024-12-31",
            },
        }
        response = session_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify custom fields were saved
        issue_id = response.data["id"]
        issue = Issue.objects.get(id=issue_id)
        
        values = IssuePropertyValue.objects.filter(issue=issue)
        assert values.count() == 6

    @pytest.mark.django_db
    def test_create_issue_rejects_string_for_number_field(
        self, session_client, workspace, project_with_member, default_state, properties
    ):
        """Test that string values are rejected for number type fields"""
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/issues/"
        data = {
            "name": "Test Issue",
            "state_id": str(default_state.id),
            "custom_fields": {
                "story_points": "not a number",  # Invalid: string for number field
            },
        }
        response = session_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "custom_fields" in response.data
        assert "story_points" in response.data["custom_fields"]
        assert "number" in str(response.data["custom_fields"]["story_points"]).lower()
        
        # Verify no issue was created
        assert Issue.objects.count() == 0

    @pytest.mark.django_db
    def test_create_issue_rejects_non_boolean_for_boolean_field(
        self, session_client, workspace, project_with_member, default_state, properties
    ):
        """Test that non-boolean values are rejected for boolean type fields"""
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/issues/"
        data = {
            "name": "Test Issue",
            "state_id": str(default_state.id),
            "custom_fields": {
                "is_urgent": "yes",  # Invalid: string for boolean field
            },
        }
        response = session_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "custom_fields" in response.data
        assert "is_urgent" in response.data["custom_fields"]
        assert "boolean" in str(response.data["custom_fields"]["is_urgent"]).lower()
        
        # Verify no issue was created
        assert Issue.objects.count() == 0

    @pytest.mark.django_db
    def test_create_issue_rejects_invalid_select_option(
        self, session_client, workspace, project_with_member, default_state, properties
    ):
        """Test that invalid select options are rejected"""
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/issues/"
        data = {
            "name": "Test Issue",
            "state_id": str(default_state.id),
            "custom_fields": {
                "quarter": "Q99",  # Invalid: not in options
            },
        }
        response = session_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "custom_fields" in response.data
        assert "quarter" in response.data["custom_fields"]
        assert "valid option" in str(response.data["custom_fields"]["quarter"]).lower()
        
        # Verify no issue was created
        assert Issue.objects.count() == 0

    @pytest.mark.django_db
    def test_create_issue_rejects_invalid_multi_select_option(
        self, session_client, workspace, project_with_member, default_state, properties
    ):
        """Test that invalid multi_select options are rejected"""
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/issues/"
        data = {
            "name": "Test Issue",
            "state_id": str(default_state.id),
            "custom_fields": {
                "tags": ["bug", "invalid_tag"],  # Invalid: invalid_tag not in options
            },
        }
        response = session_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "custom_fields" in response.data
        assert "tags" in response.data["custom_fields"]
        assert "valid option" in str(response.data["custom_fields"]["tags"]).lower()
        
        # Verify no issue was created
        assert Issue.objects.count() == 0

    @pytest.mark.django_db
    def test_create_issue_rejects_non_list_for_multi_select(
        self, session_client, workspace, project_with_member, default_state, properties
    ):
        """Test that non-list values are rejected for multi_select fields"""
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/issues/"
        data = {
            "name": "Test Issue",
            "state_id": str(default_state.id),
            "custom_fields": {
                "tags": "bug",  # Invalid: string instead of list
            },
        }
        response = session_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "custom_fields" in response.data
        assert "tags" in response.data["custom_fields"]
        assert "list" in str(response.data["custom_fields"]["tags"]).lower()
        
        # Verify no issue was created
        assert Issue.objects.count() == 0

    @pytest.mark.django_db
    def test_create_issue_rejects_null_for_required_field(
        self, session_client, workspace, project_with_member, default_state, properties
    ):
        """Test that null values are rejected for required fields"""
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/issues/"
        data = {
            "name": "Test Issue",
            "state_id": str(default_state.id),
            "custom_fields": {
                "required_field": None,  # Invalid: null for required field
            },
        }
        response = session_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "custom_fields" in response.data
        assert "required_field" in response.data["custom_fields"]
        assert "required" in str(response.data["custom_fields"]["required_field"]).lower()
        
        # Verify no issue was created
        assert Issue.objects.count() == 0

    @pytest.mark.django_db
    def test_create_issue_rejects_unknown_property_key(
        self, session_client, workspace, project_with_member, default_state, properties
    ):
        """Test that unknown property keys are rejected"""
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/issues/"
        data = {
            "name": "Test Issue",
            "state_id": str(default_state.id),
            "custom_fields": {
                "unknown_field": "value",  # Invalid: property doesn't exist
            },
        }
        response = session_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "custom_fields" in response.data
        assert "unknown" in str(response.data["custom_fields"]).lower()
        
        # Verify no issue was created
        assert Issue.objects.count() == 0

    @pytest.mark.django_db
    def test_update_issue_with_valid_custom_fields(
        self, session_client, workspace, project_with_member, default_state, properties
    ):
        """Test updating an issue with valid custom_fields values"""
        # Create issue first
        issue = Issue.objects.create(
            name="Test Issue",
            project=project_with_member,
            workspace=workspace,
            state=default_state,
        )
        
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/issues/{issue.id}/"
        data = {
            "custom_fields": {
                "story_points": 8,
                "is_urgent": False,
            },
        }
        response = session_client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        
        # Verify custom fields were saved
        values = IssuePropertyValue.objects.filter(issue=issue)
        assert values.count() == 2

    @pytest.mark.django_db
    def test_update_issue_rejects_invalid_custom_fields(
        self, session_client, workspace, project_with_member, default_state, properties
    ):
        """Test updating an issue with invalid custom_fields is rejected"""
        # Create issue first
        issue = Issue.objects.create(
            name="Test Issue",
            project=project_with_member,
            workspace=workspace,
            state=default_state,
        )
        
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/issues/{issue.id}/"
        data = {
            "custom_fields": {
                "story_points": "invalid",  # Invalid: string for number field
            },
        }
        response = session_client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "custom_fields" in response.data
        assert "story_points" in response.data["custom_fields"]
        
        # Verify no custom fields were saved
        values = IssuePropertyValue.objects.filter(issue=issue)
        assert values.count() == 0

    @pytest.mark.django_db
    def test_update_existing_custom_field_rejects_invalid_value(
        self, session_client, workspace, project_with_member, default_state, properties
    ):
        """Test updating an existing custom field value with invalid data is rejected"""
        # Create issue with valid custom field
        issue = Issue.objects.create(
            name="Test Issue",
            project=project_with_member,
            workspace=workspace,
            state=default_state,
        )
        IssuePropertyValue.objects.create(
            issue=issue,
            property=properties["story_points"],
            value=5,
            project=project_with_member,
            workspace=workspace,
        )
        
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/issues/{issue.id}/"
        data = {
            "custom_fields": {
                "story_points": "invalid",  # Try to update with invalid value
            },
        }
        response = session_client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "custom_fields" in response.data
        assert "story_points" in response.data["custom_fields"]
        
        # Verify original value is unchanged
        value = IssuePropertyValue.objects.get(issue=issue, property=properties["story_points"])
        assert value.value == 5

    @pytest.mark.django_db
    def test_create_issue_with_multiple_validation_errors(
        self, session_client, workspace, project_with_member, default_state, properties
    ):
        """Test that multiple validation errors are returned together"""
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/issues/"
        data = {
            "name": "Test Issue",
            "state_id": str(default_state.id),
            "custom_fields": {
                "story_points": "not a number",  # Invalid
                "is_urgent": "yes",  # Invalid
                "quarter": "Q99",  # Invalid
            },
        }
        response = session_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "custom_fields" in response.data
        
        # All three errors should be present
        assert "story_points" in response.data["custom_fields"]
        assert "is_urgent" in response.data["custom_fields"]
        assert "quarter" in response.data["custom_fields"]
        
        # Verify no issue was created
        assert Issue.objects.count() == 0

    @pytest.mark.django_db
    def test_create_issue_atomic_no_partial_save_on_error(
        self, session_client, workspace, project_with_member, default_state, properties
    ):
        """Test that when validation fails, NO custom fields are saved (atomic behavior)"""
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/issues/"
        data = {
            "name": "Test Issue",
            "state_id": str(default_state.id),
            "custom_fields": {
                "story_points": 5,  # Valid
                "is_urgent": True,  # Valid
                "quarter": "Q99",  # Invalid - will cause failure
            },
        }
        response = session_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Verify NO custom fields were saved (atomic behavior)
        assert IssuePropertyValue.objects.count() == 0
        
        # Verify no issue was created
        assert Issue.objects.count() == 0

    @pytest.mark.django_db
    def test_update_issue_atomic_no_partial_save_on_error(
        self, session_client, workspace, project_with_member, default_state, properties
    ):
        """Test that when update validation fails, NO custom fields are saved (atomic behavior)"""
        # Create issue first
        issue = Issue.objects.create(
            name="Test Issue",
            project=project_with_member,
            workspace=workspace,
            state=default_state,
        )
        
        # Add one valid custom field
        IssuePropertyValue.objects.create(
            issue=issue,
            property=properties["story_points"],
            value=3,
            project=project_with_member,
            workspace=workspace,
        )
        
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/issues/{issue.id}/"
        data = {
            "custom_fields": {
                "story_points": 8,  # Valid - would update existing
                "is_urgent": True,  # Valid - would create new
                "quarter": "Q99",  # Invalid - will cause failure
            },
        }
        response = session_client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Verify original value is unchanged (atomic rollback)
        value = IssuePropertyValue.objects.get(issue=issue, property=properties["story_points"])
        assert value.value == 3  # Not updated to 8
        
        # Verify no new values were created
        assert IssuePropertyValue.objects.filter(issue=issue).count() == 1

    @pytest.mark.django_db
    def test_bulk_endpoint_atomic_no_partial_save_on_error(
        self, session_client, workspace, project_with_member, default_state, properties
    ):
        """Test that BulkIssuePropertyValueEndpoint doesn't partially save on validation error"""
        # Create issue first
        issue = Issue.objects.create(
            name="Test Issue",
            project=project_with_member,
            workspace=workspace,
            state=default_state,
        )
        
        url = (
            f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}"
            f"/issues/{issue.id}/property-values/"
        )
        data = {
            "custom_fields": {
                "story_points": 5,  # Valid
                "is_urgent": True,  # Valid
                "quarter": "Q99",  # Invalid - will cause failure
            },
        }
        response = session_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Verify NO custom fields were saved (atomic behavior)
        assert IssuePropertyValue.objects.filter(issue=issue).count() == 0


@pytest.mark.contract
class TestSoftDeletedPropertyFiltering:
    """Test that soft-deleted properties don't appear in API responses"""

    @pytest.fixture
    def project_with_member(self, db, workspace, create_user):
        """Create a project with the test user as admin member"""
        project = Project.objects.create(
            name="Test Project",
            identifier="TEST",
            workspace=workspace,
        )
        ProjectMember.objects.create(
            project=project,
            member=create_user,
            role=20,  # Admin
            is_active=True,
        )
        return project

    @pytest.fixture
    def default_state(self, db, workspace, project_with_member):
        """Create a default state for issues"""
        return State.objects.create(
            name="Open",
            project=project_with_member,
            workspace=workspace,
        )

    @pytest.fixture
    def properties(self, db, workspace, project_with_member, create_user):
        """Create test properties"""
        return {
            "active_field": IssueProperty.objects.create(
                name="Active Field",
                property_type="text",
                project=project_with_member,
                workspace=workspace,
                created_by=create_user,
            ),
            "deleted_field": IssueProperty.objects.create(
                name="Deleted Field",
                property_type="text",
                project=project_with_member,
                workspace=workspace,
                created_by=create_user,
            ),
        }

    @pytest.mark.django_db
    def test_bulk_endpoint_hides_soft_deleted_property_values(
        self, session_client, workspace, project_with_member, default_state, properties, create_user
    ):
        """Test that BulkIssuePropertyValueEndpoint.get doesn't return values for soft-deleted properties"""
        # Create issue
        issue = Issue.objects.create(
            name="Test Issue",
            project=project_with_member,
            workspace=workspace,
            state=default_state,
        )
        
        # Create values for both properties
        IssuePropertyValue.objects.create(
            issue=issue,
            property=properties["active_field"],
            value="Active Value",
            project=project_with_member,
            workspace=workspace,
        )
        IssuePropertyValue.objects.create(
            issue=issue,
            property=properties["deleted_field"],
            value="Should Not Appear",
            project=project_with_member,
            workspace=workspace,
        )
        
        # Soft-delete the property (not the value)
        from django.utils import timezone
        properties["deleted_field"].deleted_at = timezone.now()
        properties["deleted_field"].save()
        
        # Get custom fields via bulk endpoint
        url = (
            f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}"
            f"/issues/{issue.id}/custom-fields/"
        )
        response = session_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert "custom_fields" in response.data
        
        # Only active property should appear
        assert "active_field" in response.data["custom_fields"]
        assert response.data["custom_fields"]["active_field"] == "Active Value"
        
        # Deleted property should NOT appear
        assert "deleted_field" not in response.data["custom_fields"]
        
        # Verify the value still exists in database (soft-delete only affects property)
        assert IssuePropertyValue.objects.filter(
            issue=issue,
            property=properties["deleted_field"],
            deleted_at__isnull=True
        ).exists()

    @pytest.mark.django_db
    def test_issue_detail_serializer_hides_soft_deleted_property_values(
        self, session_client, workspace, project_with_member, default_state, properties, create_user
    ):
        """Test that IssueDetailSerializer doesn't return values for soft-deleted properties"""
        # Create issue
        issue = Issue.objects.create(
            name="Test Issue",
            project=project_with_member,
            workspace=workspace,
            state=default_state,
        )
        
        # Create values for both properties
        IssuePropertyValue.objects.create(
            issue=issue,
            property=properties["active_field"],
            value="Active Value",
            project=project_with_member,
            workspace=workspace,
        )
        IssuePropertyValue.objects.create(
            issue=issue,
            property=properties["deleted_field"],
            value="Should Not Appear",
            project=project_with_member,
            workspace=workspace,
        )
        
        # Soft-delete the property (not the value)
        from django.utils import timezone
        properties["deleted_field"].deleted_at = timezone.now()
        properties["deleted_field"].save()
        
        # Get issue detail
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/issues/{issue.id}/"
        response = session_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert "custom_fields" in response.data
        
        # Only active property should appear
        assert "active_field" in response.data["custom_fields"]
        assert response.data["custom_fields"]["active_field"] == "Active Value"
        
        # Deleted property should NOT appear
        assert "deleted_field" not in response.data["custom_fields"]

    @pytest.mark.django_db
    def test_soft_deleted_value_is_hidden_even_with_active_property(
        self, session_client, workspace, project_with_member, default_state, properties, create_user
    ):
        """Test that soft-deleted values are hidden even when property is active"""
        # Create issue
        issue = Issue.objects.create(
            name="Test Issue",
            project=project_with_member,
            workspace=workspace,
            state=default_state,
        )
        
        # Create value
        value = IssuePropertyValue.objects.create(
            issue=issue,
            property=properties["active_field"],
            value="Should Not Appear",
            project=project_with_member,
            workspace=workspace,
        )
        
        # Soft-delete the value (not the property)
        from django.utils import timezone
        value.deleted_at = timezone.now()
        value.save()
        
        # Get custom fields via bulk endpoint
        url = (
            f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}"
            f"/issues/{issue.id}/custom-fields/"
        )
        response = session_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert "custom_fields" in response.data
        
        # Soft-deleted value should NOT appear
        assert "active_field" not in response.data["custom_fields"]

    @pytest.mark.django_db
    def test_both_property_and_value_deleted_is_hidden(
        self, session_client, workspace, project_with_member, default_state, properties, create_user
    ):
        """Test that values are hidden when both property AND value are soft-deleted"""
        # Create issue
        issue = Issue.objects.create(
            name="Test Issue",
            project=project_with_member,
            workspace=workspace,
            state=default_state,
        )
        
        # Create value
        value = IssuePropertyValue.objects.create(
            issue=issue,
            property=properties["deleted_field"],
            value="Should Not Appear",
            project=project_with_member,
            workspace=workspace,
        )
        
        # Soft-delete both property and value
        from django.utils import timezone
        now = timezone.now()
        properties["deleted_field"].deleted_at = now
        properties["deleted_field"].save()
        value.deleted_at = now
        value.save()
        
        # Get custom fields via bulk endpoint
        url = (
            f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}"
            f"/issues/{issue.id}/custom-fields/"
        )
        response = session_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert "custom_fields" in response.data
        
        # Nothing should appear
        assert len(response.data["custom_fields"]) == 0

    @pytest.mark.django_db
    def test_soft_deleted_issue_returns_404(
        self, session_client, workspace, project_with_member, default_state, properties, create_user
    ):
        """Test that operations on soft-deleted issues return 404"""
        # Create issue
        issue = Issue.objects.create(
            name="Test Issue",
            project=project_with_member,
            workspace=workspace,
            state=default_state,
        )
        
        # Create a property value
        IssuePropertyValue.objects.create(
            issue=issue,
            property=properties["active_field"],
            value="Some Value",
            project=project_with_member,
            workspace=workspace,
        )
        
        # Soft-delete the issue
        from django.utils import timezone
        issue.deleted_at = timezone.now()
        issue.save()
        
        # Try to get custom fields for soft-deleted issue
        url = (
            f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}"
            f"/issues/{issue.id}/custom-fields/"
        )
        response = session_client.get(url)
        
        # Should return 404, not the custom fields
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "error" in response.data
        assert "not found" in response.data["error"].lower()
