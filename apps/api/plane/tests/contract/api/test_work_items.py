# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import pytest
from unittest.mock import patch
from rest_framework import status
from uuid import uuid4

from plane.db.models import (
    Project,
    ProjectMember,
    Issue,
    State,
    Label,
    IssueType,
    ProjectIssueType,
    EstimatePoint,
    Estimate,
    Workspace,
    WorkspaceMember,
)
from plane.ee.models import (
    IssueProperty,
    IssuePropertyOption,
    IssuePropertyValue,
    PropertyTypeEnum,
    RelationTypeEnum,
)
from plane.app.permissions import ROLE


# ============================================================================
# FIXTURES
# ============================================================================


@pytest.fixture
def workspace(db, create_user):
    """Create a test workspace with the user as admin member"""
    workspace = Workspace.objects.create(
        name="Test Workspace",
        slug=f"test-workspace-{uuid4().hex[:8]}",
        owner=create_user,
    )
    WorkspaceMember.objects.create(
        workspace=workspace,
        member=create_user,
        role=ROLE.ADMIN.value,
        is_active=True,
    )
    return workspace


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the user as a member"""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        workspace=workspace,
        role=20,  # Admin role
        is_active=True,
    )
    return project


@pytest.fixture
def state(db, workspace, project, create_user):
    """Create a default state for the project"""
    return State.objects.create(
        name="Backlog",
        group="backlog",
        project=project,
        workspace=workspace,
        default=True,
        created_by=create_user,
    )


@pytest.fixture
def additional_states(db, workspace, project, create_user):
    """Create additional states for the project"""
    return [
        State.objects.create(
            name="In Progress",
            group="started",
            project=project,
            workspace=workspace,
            default=False,
            created_by=create_user,
        ),
        State.objects.create(
            name="Done",
            group="completed",
            project=project,
            workspace=workspace,
            default=False,
            created_by=create_user,
        ),
    ]


@pytest.fixture
def label(db, workspace, project, create_user):
    """Create a test label"""
    return Label.objects.create(
        name="Test Label",
        color="#FF0000",
        project=project,
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def issue_type(db, workspace, create_user):
    """Create an issue type for the workspace"""
    return IssueType.objects.create(
        name="Task",
        description="Task issue type",
        workspace=workspace,
        is_default=True,
        created_by=create_user,
    )


@pytest.fixture
def project_issue_type(db, workspace, project, issue_type, create_user):
    """Create a project issue type mapping"""
    return ProjectIssueType.objects.create(
        project=project,
        issue_type=issue_type,
        is_default=True,
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def issue(db, workspace, project, state, create_user, issue_type):
    """Create a test issue"""
    return Issue.objects.create(
        name="Test Work Item",
        description_html="<p>Test description</p>",
        project=project,
        workspace=workspace,
        state=state,
        priority="medium",
        type=issue_type,
        created_by=create_user,
    )


@pytest.fixture
def issue_without_type(db, workspace, project, state, create_user):
    """Create a test issue without a type"""
    return Issue.objects.create(
        name="Test Work Item Without Type",
        description_html="<p>Test description</p>",
        project=project,
        workspace=workspace,
        state=state,
        priority="medium",
        type=None,
        created_by=create_user,
    )


@pytest.fixture
def text_property(db, workspace, project, issue_type, create_user):
    """Create a TEXT type custom property"""
    return IssueProperty.objects.create(
        name="custom-text",
        display_name="Custom Text",
        description="A text field",
        property_type=PropertyTypeEnum.TEXT,
        issue_type=issue_type,
        project=project,
        workspace=workspace,
        is_required=False,
        created_by=create_user,
    )


@pytest.fixture
def option_property(db, workspace, project, issue_type, create_user):
    """Create an OPTION type custom property with options"""
    prop = IssueProperty.objects.create(
        name="custom-dropdown",
        display_name="Custom Dropdown",
        description="A dropdown field",
        property_type=PropertyTypeEnum.OPTION,
        issue_type=issue_type,
        project=project,
        workspace=workspace,
        is_required=False,
        created_by=create_user,
    )
    # Create options
    IssuePropertyOption.objects.create(
        name="Option 1",
        property=prop,
        workspace=workspace,
        project=project,
    )
    IssuePropertyOption.objects.create(
        name="Option 2",
        property=prop,
        workspace=workspace,
        project=project,
    )
    return prop


@pytest.fixture
def decimal_property(db, workspace, project, issue_type, create_user):
    """Create a DECIMAL type custom property"""
    return IssueProperty.objects.create(
        name="custom-number",
        display_name="Custom Number",
        description="A number field",
        property_type=PropertyTypeEnum.DECIMAL,
        issue_type=issue_type,
        project=project,
        workspace=workspace,
        is_required=False,
        created_by=create_user,
    )


@pytest.fixture
def required_property(db, workspace, project, issue_type, create_user):
    """Create a required custom property"""
    return IssueProperty.objects.create(
        name="required-field",
        display_name="Required Field",
        description="A required field",
        property_type=PropertyTypeEnum.TEXT,
        issue_type=issue_type,
        project=project,
        workspace=workspace,
        is_required=True,
        created_by=create_user,
    )


@pytest.fixture
def user_relation_property(db, workspace, project, issue_type, create_user):
    """Create a USER RELATION type custom property"""
    return IssueProperty.objects.create(
        name="assigned-reviewer",
        display_name="Assigned Reviewer",
        description="User relation field",
        property_type=PropertyTypeEnum.RELATION,
        relation_type=RelationTypeEnum.USER,
        issue_type=issue_type,
        project=project,
        workspace=workspace,
        is_required=False,
        created_by=create_user,
    )


@pytest.fixture
def estimate(db, workspace, project, create_user):
    """Create an estimate system for the project"""
    est = Estimate.objects.create(
        name="Story Points",
        project=project,
        workspace=workspace,
        last_used=True,
        created_by=create_user,
    )
    EstimatePoint.objects.create(
        estimate=est,
        key=0,
        value="1",
        project=project,
        workspace=workspace,
    )
    EstimatePoint.objects.create(
        estimate=est,
        key=1,
        value="2",
        project=project,
        workspace=workspace,
    )
    return est


@pytest.fixture
def mock_issue_types_enabled():
    """Mock the ISSUE_TYPES feature flag as enabled"""
    with patch("plane.api.views.work_item_properties.check_workspace_feature_flag", return_value=True):
        with patch("plane.api.views.work_item_type_schema.check_workspace_feature_flag", return_value=True):
            with patch("plane.api.views.work_item_type_create.check_workspace_feature_flag", return_value=True):
                yield


@pytest.fixture
def mock_issue_types_disabled():
    """Mock the ISSUE_TYPES feature flag as disabled"""
    with patch("plane.api.views.work_item_properties.check_workspace_feature_flag", return_value=False):
        with patch("plane.api.views.work_item_type_schema.check_workspace_feature_flag", return_value=False):
            with patch("plane.api.views.work_item_type_create.check_workspace_feature_flag", return_value=False):
                yield


# ============================================================================
# WORK ITEM PROPERTIES ENDPOINT TESTS
# ============================================================================


@pytest.mark.contract
class TestWorkItemPropertiesAPIEndpoint:
    """Test Work Item Properties API Endpoint (GET/PATCH)"""

    def get_properties_url(self, workspace_slug, project_id, issue_id):
        """Helper to get properties endpoint URL"""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/{issue_id}/properties/"

    # -------------------------------------------------------------------------
    # GET Tests
    # -------------------------------------------------------------------------

    @pytest.mark.django_db
    def test_get_properties_success(
        self, api_key_client, workspace, project, issue, state, mock_issue_types_enabled, project_issue_type
    ):
        """Test successful retrieval of work item properties"""
        url = self.get_properties_url(workspace.slug, project.id, issue.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(issue.id)
        assert response.data["name"] == issue.name
        assert response.data["priority"] == issue.priority
        assert str(response.data["state_id"]) == str(state.id)

    @pytest.mark.django_db
    def test_get_properties_with_custom_fields(
        self,
        api_key_client,
        workspace,
        project,
        issue,
        text_property,
        option_property,
        mock_issue_types_enabled,
        project_issue_type,
    ):
        """Test retrieval includes custom field definitions"""
        # Create a property value
        IssuePropertyValue.objects.create(
            issue=issue,
            property=text_property,
            value_text="Test value",
            project=project,
            workspace=workspace,
        )

        url = self.get_properties_url(workspace.slug, project.id, issue.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # Check custom fields are in response
        assert "custom_field_custom-text" in response.data
        assert response.data["custom_field_custom-text"]["value"] == "Test value"
        assert "custom_field_custom-dropdown" in response.data

    @pytest.mark.django_db
    def test_get_properties_without_issue_type(
        self, api_key_client, workspace, project, issue_without_type, mock_issue_types_enabled
    ):
        """Test retrieval of work item without issue type returns no custom fields"""
        url = self.get_properties_url(workspace.slug, project.id, issue_without_type.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(issue_without_type.id)
        # Should not have custom fields when issue has no type
        custom_fields = [k for k in response.data.keys() if k.startswith("custom_field_")]
        assert len(custom_fields) == 0

    @pytest.mark.django_db
    def test_get_properties_feature_disabled(
        self, api_key_client, workspace, project, issue, text_property, mock_issue_types_disabled, project_issue_type
    ):
        """Test retrieval when ISSUE_TYPES feature is disabled returns no custom fields"""
        url = self.get_properties_url(workspace.slug, project.id, issue.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # Custom fields should not be included when feature is disabled
        custom_fields = [k for k in response.data.keys() if k.startswith("custom_field_")]
        assert len(custom_fields) == 0

    @pytest.mark.django_db
    def test_get_properties_not_found(self, api_key_client, workspace, project, mock_issue_types_enabled):
        """Test retrieval of non-existent work item"""
        fake_id = uuid4()
        url = self.get_properties_url(workspace.slug, project.id, fake_id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    # -------------------------------------------------------------------------
    # PATCH Tests
    # -------------------------------------------------------------------------

    @pytest.mark.django_db
    def test_patch_standard_fields(
        self, api_key_client, workspace, project, issue, mock_issue_types_enabled, project_issue_type
    ):
        """Test updating standard work item fields"""
        url = self.get_properties_url(workspace.slug, project.id, issue.id)
        update_data = {
            "name": "Updated Work Item Name",
            "priority": "high",
        }

        response = api_key_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.name == "Updated Work Item Name"
        assert issue.priority == "high"

    @pytest.mark.django_db
    def test_patch_custom_field_text(
        self, api_key_client, workspace, project, issue, text_property, mock_issue_types_enabled, project_issue_type
    ):
        """Test updating a TEXT custom field"""
        url = self.get_properties_url(workspace.slug, project.id, issue.id)
        update_data = {
            "custom_field_custom-text": "New text value",
        }

        response = api_key_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["custom_field_custom-text"]["value"] == "New text value"

        # Verify in database
        pv = IssuePropertyValue.objects.filter(issue=issue, property=text_property).first()
        assert pv is not None
        assert pv.value_text == "New text value"

    @pytest.mark.django_db
    def test_patch_custom_field_option(
        self, api_key_client, workspace, project, issue, option_property, mock_issue_types_enabled, project_issue_type
    ):
        """Test updating an OPTION custom field"""
        option = option_property.options.first()
        url = self.get_properties_url(workspace.slug, project.id, issue.id)
        update_data = {
            "custom_field_custom-dropdown": str(option.id),
        }

        response = api_key_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK

        # Verify in database
        pv = IssuePropertyValue.objects.filter(issue=issue, property=option_property).first()
        assert pv is not None
        assert str(pv.value_option_id) == str(option.id)

    @pytest.mark.django_db
    def test_patch_custom_field_option_by_name(
        self, api_key_client, workspace, project, issue, option_property, mock_issue_types_enabled, project_issue_type
    ):
        """Test updating an OPTION custom field using option name"""
        url = self.get_properties_url(workspace.slug, project.id, issue.id)
        update_data = {
            "custom_field_custom-dropdown": "Option 1",
        }

        response = api_key_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK

        # Verify in database
        pv = IssuePropertyValue.objects.filter(issue=issue, property=option_property).first()
        assert pv is not None
        assert pv.value_option.name == "Option 1"

    @pytest.mark.django_db
    def test_patch_custom_field_decimal(
        self, api_key_client, workspace, project, issue, decimal_property, mock_issue_types_enabled, project_issue_type
    ):
        """Test updating a DECIMAL custom field"""
        url = self.get_properties_url(workspace.slug, project.id, issue.id)
        update_data = {
            "custom_field_custom-number": 42.5,
        }

        response = api_key_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK

        # Verify in database
        pv = IssuePropertyValue.objects.filter(issue=issue, property=decimal_property).first()
        assert pv is not None
        assert pv.value_decimal == 42.5

    @pytest.mark.django_db
    def test_patch_mixed_standard_and_custom(
        self, api_key_client, workspace, project, issue, text_property, mock_issue_types_enabled, project_issue_type
    ):
        """Test updating both standard and custom fields in one request"""
        url = self.get_properties_url(workspace.slug, project.id, issue.id)
        update_data = {
            "name": "Updated Name",
            "priority": "urgent",
            "custom_field_custom-text": "Custom value",
        }

        response = api_key_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK
        issue.refresh_from_db()
        assert issue.name == "Updated Name"
        assert issue.priority == "urgent"
        assert response.data["custom_field_custom-text"]["value"] == "Custom value"

    @pytest.mark.django_db
    def test_patch_unknown_custom_field(
        self, api_key_client, workspace, project, issue, mock_issue_types_enabled, project_issue_type
    ):
        """Test updating an unknown custom field returns error"""
        url = self.get_properties_url(workspace.slug, project.id, issue.id)
        update_data = {
            "custom_field_unknown": "Some value",
        }

        response = api_key_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Unknown property" in response.data["error"]

    @pytest.mark.django_db
    def test_patch_custom_field_feature_disabled(
        self, api_key_client, workspace, project, issue, text_property, mock_issue_types_disabled, project_issue_type
    ):
        """Test updating custom fields when feature is disabled returns payment required"""
        url = self.get_properties_url(workspace.slug, project.id, issue.id)
        update_data = {
            "custom_field_custom-text": "Some value",
        }

        response = api_key_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_402_PAYMENT_REQUIRED

    @pytest.mark.django_db
    def test_patch_clear_custom_field(
        self, api_key_client, workspace, project, issue, text_property, mock_issue_types_enabled, project_issue_type
    ):
        """Test clearing a custom field by setting to null"""
        # First set a value
        IssuePropertyValue.objects.create(
            issue=issue,
            property=text_property,
            value_text="Initial value",
            project=project,
            workspace=workspace,
        )

        url = self.get_properties_url(workspace.slug, project.id, issue.id)
        update_data = {
            "custom_field_custom-text": None,
        }

        response = api_key_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK
        # Value should be cleared
        assert IssuePropertyValue.objects.filter(issue=issue, property=text_property).count() == 0


# ============================================================================
# WORK ITEM TYPE SCHEMA ENDPOINT TESTS
# ============================================================================


@pytest.mark.contract
class TestWorkItemTypeSchemaAPIEndpoint:
    """Test Work Item Type Schema API Endpoint (GET)"""

    def get_schema_url(self, workspace_slug, project_id):
        """Helper to get schema endpoint URL"""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-item-types/schema/"

    @pytest.mark.django_db
    def test_get_schema_success(
        self,
        api_key_client,
        workspace,
        project,
        state,
        additional_states,
        issue_type,
        project_issue_type,
        mock_issue_types_enabled,
    ):
        """Test successful schema retrieval"""
        url = self.get_schema_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["type_id"]) == str(issue_type.id)
        assert response.data["type_name"] == "Task"
        assert "fields" in response.data
        assert "custom_fields" in response.data

    @pytest.mark.django_db
    def test_get_schema_standard_fields(
        self, api_key_client, workspace, project, state, issue_type, project_issue_type, mock_issue_types_enabled
    ):
        """Test schema includes all standard fields"""
        url = self.get_schema_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        fields = response.data["fields"]

        # Check required standard fields
        assert "name" in fields
        assert fields["name"]["required"] is True
        assert fields["name"]["type"] == "string"

        assert "description_html" in fields
        assert "priority" in fields
        assert "state_id" in fields
        assert "assignee_ids" in fields
        assert "label_ids" in fields
        assert "start_date" in fields
        assert "target_date" in fields
        assert "parent_id" in fields

    @pytest.mark.django_db
    def test_get_schema_state_options(
        self,
        api_key_client,
        workspace,
        project,
        state,
        additional_states,
        issue_type,
        project_issue_type,
        mock_issue_types_enabled,
    ):
        """Test schema includes state options"""
        url = self.get_schema_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        state_field = response.data["fields"]["state_id"]
        assert "options" in state_field
        assert len(state_field["options"]) == 3  # state + 2 additional

    @pytest.mark.django_db
    def test_get_schema_priority_options(
        self, api_key_client, workspace, project, state, issue_type, project_issue_type, mock_issue_types_enabled
    ):
        """Test schema includes priority options"""
        url = self.get_schema_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        priority_field = response.data["fields"]["priority"]
        assert "options" in priority_field
        priority_values = [opt["value"] for opt in priority_field["options"]]
        assert "urgent" in priority_values
        assert "high" in priority_values
        assert "medium" in priority_values
        assert "low" in priority_values
        assert "none" in priority_values

    @pytest.mark.django_db
    def test_get_schema_with_type_id(
        self, api_key_client, workspace, project, state, issue_type, project_issue_type, mock_issue_types_enabled
    ):
        """Test schema retrieval with specific type_id"""
        url = f"{self.get_schema_url(workspace.slug, project.id)}?type_id={issue_type.id}"
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["type_id"]) == str(issue_type.id)

    @pytest.mark.django_db
    def test_get_schema_with_custom_fields(
        self,
        api_key_client,
        workspace,
        project,
        state,
        issue_type,
        project_issue_type,
        text_property,
        option_property,
        mock_issue_types_enabled,
    ):
        """Test schema includes custom field definitions"""
        url = self.get_schema_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        custom_fields = response.data["custom_fields"]

        assert "custom_field_custom-text" in custom_fields
        text_field = custom_fields["custom_field_custom-text"]
        assert text_field["type"] == "TEXT"
        assert text_field["display_name"] == "Custom Text"

        assert "custom_field_custom-dropdown" in custom_fields
        dropdown_field = custom_fields["custom_field_custom-dropdown"]
        assert dropdown_field["type"] == "OPTION"
        assert "options" in dropdown_field
        assert len(dropdown_field["options"]) == 2

    @pytest.mark.django_db
    def test_get_schema_include_members(
        self, api_key_client, workspace, project, state, issue_type, project_issue_type, mock_issue_types_enabled
    ):
        """Test schema with include=members returns member options"""
        url = f"{self.get_schema_url(workspace.slug, project.id)}?include=members"
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assignee_field = response.data["fields"]["assignee_ids"]
        assert "options" in assignee_field
        # At least one member (the user who created the project)
        assert len(assignee_field["options"]) >= 1

    @pytest.mark.django_db
    def test_get_schema_include_labels(
        self, api_key_client, workspace, project, state, label, issue_type, project_issue_type, mock_issue_types_enabled
    ):
        """Test schema with include=labels returns label options"""
        url = f"{self.get_schema_url(workspace.slug, project.id)}?include=labels"
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        label_field = response.data["fields"]["label_ids"]
        assert "options" in label_field
        assert len(label_field["options"]) >= 1
        assert any(opt["name"] == "Test Label" for opt in label_field["options"])

    @pytest.mark.django_db
    def test_get_schema_with_estimates(
        self,
        api_key_client,
        workspace,
        project,
        state,
        estimate,
        issue_type,
        project_issue_type,
        mock_issue_types_enabled,
    ):
        """Test schema includes estimate points when project has estimates"""
        url = self.get_schema_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "estimate_point_id" in response.data["fields"]
        estimate_field = response.data["fields"]["estimate_point_id"]
        assert "options" in estimate_field
        assert len(estimate_field["options"]) == 2

    @pytest.mark.django_db
    def test_get_schema_feature_disabled(self, api_key_client, workspace, project, state, mock_issue_types_disabled):
        """Test schema when ISSUE_TYPES feature is disabled returns null type"""
        url = self.get_schema_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["type_id"] is None
        assert response.data["type_name"] is None
        # Standard fields should still be present
        assert "fields" in response.data
        assert "name" in response.data["fields"]
        # Custom fields should be empty
        assert response.data["custom_fields"] == {}

    @pytest.mark.django_db
    def test_get_schema_no_project_issue_type(
        self, api_key_client, workspace, project, state, mock_issue_types_enabled
    ):
        """Test schema when project has no issue type configured"""
        # No project_issue_type fixture, so project has no types
        url = self.get_schema_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["type_id"] is None
        # Standard fields should still be present
        assert "fields" in response.data


# ============================================================================
# WORK ITEM CREATE ENDPOINT TESTS
# ============================================================================


@pytest.mark.contract
class TestWorkItemCreateAPIEndpoint:
    """Test Work Item Create API Endpoint (POST)"""

    def get_create_url(self, workspace_slug, project_id):
        """Helper to get create endpoint URL"""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/create/"

    @pytest.mark.django_db
    def test_create_minimal_work_item(self, api_key_client, workspace, project, state, mock_issue_types_disabled):
        """Test creating work item with only required fields (no types enabled)"""
        url = self.get_create_url(workspace.slug, project.id)
        data = {
            "name": "New Work Item",
        }

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Work Item"
        assert Issue.objects.filter(name="New Work Item").exists()

    @pytest.mark.django_db
    def test_create_work_item_with_type(
        self, api_key_client, workspace, project, state, issue_type, project_issue_type, mock_issue_types_enabled
    ):
        """Test creating work item with type_id"""
        url = self.get_create_url(workspace.slug, project.id)
        data = {
            "name": "Typed Work Item",
            "type_id": str(issue_type.id),
        }

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Typed Work Item"
        assert str(response.data["type_id"]) == str(issue_type.id)

    @pytest.mark.django_db
    def test_create_work_item_requires_type_when_enabled(
        self, api_key_client, workspace, project, state, issue_type, project_issue_type, mock_issue_types_enabled
    ):
        """Test creating work item without type_id when types are enabled fails"""
        url = self.get_create_url(workspace.slug, project.id)
        data = {
            "name": "Work Item Without Type",
        }

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "type_id is required" in response.data["error"]

    @pytest.mark.django_db
    def test_create_work_item_with_standard_fields(
        self,
        api_key_client,
        workspace,
        project,
        state,
        label,
        issue_type,
        project_issue_type,
        create_user,
        mock_issue_types_enabled,
    ):
        """Test creating work item with all standard fields"""
        url = self.get_create_url(workspace.slug, project.id)
        data = {
            "name": "Complete Work Item",
            "type_id": str(issue_type.id),
            "description_html": "<p>Full description</p>",
            "priority": "high",
            "state_id": str(state.id),
            "assignee_ids": [str(create_user.id)],
            "label_ids": [str(label.id)],
            "start_date": "2026-01-01",
            "target_date": "2026-12-31",
        }

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Complete Work Item"
        assert response.data["priority"] == "high"
        assert str(response.data["state_id"]) == str(state.id)

    @pytest.mark.django_db
    def test_create_work_item_with_custom_fields(
        self,
        api_key_client,
        workspace,
        project,
        state,
        issue_type,
        project_issue_type,
        text_property,
        decimal_property,
        mock_issue_types_enabled,
    ):
        """Test creating work item with custom field values"""
        url = self.get_create_url(workspace.slug, project.id)
        data = {
            "name": "Work Item with Custom Fields",
            "type_id": str(issue_type.id),
            "custom_field_custom-text": "Custom value",
            "custom_field_custom-number": 42.5,
        }

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED

        # Verify custom fields were saved
        issue = Issue.objects.get(id=response.data["id"])
        text_value = IssuePropertyValue.objects.filter(issue=issue, property=text_property).first()
        assert text_value is not None
        assert text_value.value_text == "Custom value"

        decimal_value = IssuePropertyValue.objects.filter(issue=issue, property=decimal_property).first()
        assert decimal_value is not None
        assert decimal_value.value_decimal == 42.5

    @pytest.mark.django_db
    def test_create_work_item_with_option_field(
        self,
        api_key_client,
        workspace,
        project,
        state,
        issue_type,
        project_issue_type,
        option_property,
        mock_issue_types_enabled,
    ):
        """Test creating work item with OPTION custom field"""
        option = option_property.options.first()
        url = self.get_create_url(workspace.slug, project.id)
        data = {
            "name": "Work Item with Option",
            "type_id": str(issue_type.id),
            "custom_field_custom-dropdown": str(option.id),
        }

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED

        # Verify option was saved
        issue = Issue.objects.get(id=response.data["id"])
        option_value = IssuePropertyValue.objects.filter(issue=issue, property=option_property).first()
        assert option_value is not None
        assert str(option_value.value_option_id) == str(option.id)

    @pytest.mark.django_db
    def test_create_work_item_missing_required_field(
        self,
        api_key_client,
        workspace,
        project,
        state,
        issue_type,
        project_issue_type,
        required_property,
        mock_issue_types_enabled,
    ):
        """Test creating work item without required custom field fails"""
        url = self.get_create_url(workspace.slug, project.id)
        data = {
            "name": "Work Item Missing Required",
            "type_id": str(issue_type.id),
        }

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "custom_field_required-field" in response.data
        assert "required" in response.data["custom_field_required-field"].lower()

    @pytest.mark.django_db
    def test_create_work_item_invalid_priority(
        self, api_key_client, workspace, project, state, mock_issue_types_disabled
    ):
        """Test creating work item with invalid priority fails"""
        url = self.get_create_url(workspace.slug, project.id)
        data = {
            "name": "Invalid Priority Work Item",
            "priority": "invalid",
        }

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "priority" in response.data

    @pytest.mark.django_db
    def test_create_work_item_invalid_state(self, api_key_client, workspace, project, state, mock_issue_types_disabled):
        """Test creating work item with invalid state_id fails"""
        url = self.get_create_url(workspace.slug, project.id)
        data = {
            "name": "Invalid State Work Item",
            "state_id": str(uuid4()),
        }

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "state_id" in response.data

    @pytest.mark.django_db
    def test_create_work_item_invalid_type_id(
        self, api_key_client, workspace, project, state, issue_type, project_issue_type, mock_issue_types_enabled
    ):
        """Test creating work item with invalid type_id fails"""
        url = self.get_create_url(workspace.slug, project.id)
        data = {
            "name": "Invalid Type Work Item",
            "type_id": str(uuid4()),
        }

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "type_id" in response.data["error"].lower()

    @pytest.mark.django_db
    def test_create_work_item_missing_name(self, api_key_client, workspace, project, state, mock_issue_types_disabled):
        """Test creating work item without name fails"""
        url = self.get_create_url(workspace.slug, project.id)
        data = {
            "priority": "high",
        }

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "name" in response.data

    @pytest.mark.django_db
    def test_create_work_item_invalid_custom_field_type(
        self,
        api_key_client,
        workspace,
        project,
        state,
        issue_type,
        project_issue_type,
        decimal_property,
        mock_issue_types_enabled,
    ):
        """Test creating work item with wrong custom field type fails"""
        url = self.get_create_url(workspace.slug, project.id)
        data = {
            "name": "Invalid Custom Field Type",
            "type_id": str(issue_type.id),
            "custom_field_custom-number": "not a number",
        }

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "custom_field_custom-number" in response.data

    @pytest.mark.django_db
    def test_create_work_item_invalid_option_value(
        self,
        api_key_client,
        workspace,
        project,
        state,
        issue_type,
        project_issue_type,
        option_property,
        mock_issue_types_enabled,
    ):
        """Test creating work item with invalid option value fails"""
        url = self.get_create_url(workspace.slug, project.id)
        data = {
            "name": "Invalid Option Value",
            "type_id": str(issue_type.id),
            "custom_field_custom-dropdown": str(uuid4()),  # Non-existent option
        }

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "custom_field_custom-dropdown" in response.data

    @pytest.mark.django_db
    def test_create_work_item_response_format(
        self, api_key_client, workspace, project, state, issue_type, project_issue_type, mock_issue_types_enabled
    ):
        """Test create response includes expected fields"""
        url = self.get_create_url(workspace.slug, project.id)
        data = {
            "name": "Response Format Test",
            "type_id": str(issue_type.id),
        }

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        # Check response contains expected fields
        assert "id" in response.data
        assert "name" in response.data
        assert "project_id" in response.data
        assert "workspace_id" in response.data
        assert "sequence_id" in response.data
        assert "created_at" in response.data
        assert "updated_at" in response.data
