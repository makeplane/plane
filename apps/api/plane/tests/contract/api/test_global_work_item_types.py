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
from unittest.mock import patch, MagicMock
from rest_framework import status
from uuid import uuid4

from plane.db.models import (
    Workspace,
    WorkspaceMember,
    Project,
    ProjectMember,
    IssueType,
    ProjectIssueType,
)
from plane.ee.models import IssueProperty, IssueTypeProperty, PropertyTypeEnum
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
    """Create a test project"""
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
        role=20,
        is_active=True,
    )
    return project


@pytest.fixture
def issue_type(db, workspace, create_user):
    """Create a workspace-level issue type"""
    return IssueType.objects.create(
        name="Task",
        description="Task type",
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def default_issue_type(db, workspace, create_user):
    """Create a default issue type"""
    return IssueType.objects.create(
        name="Default Type",
        description="Default type",
        workspace=workspace,
        is_default=True,
        created_by=create_user,
    )


@pytest.fixture
def issue_property(db, workspace, issue_type, create_user):
    """Create a workspace-level issue property (no project)"""
    return IssueProperty.objects.create(
        name="Test Property",
        display_name="Test Property",
        property_type=PropertyTypeEnum.TEXT,
        workspace=workspace,
        issue_type=issue_type,
        project=None,
        created_by=create_user,
    )


@pytest.fixture
def unattached_issue_property(db, workspace, create_user):
    """Create a workspace-level issue property not associated with a work item type"""
    return IssueProperty.objects.create(
        name="Unattached Property",
        display_name="Unattached Property",
        property_type=PropertyTypeEnum.TEXT,
        workspace=workspace,
        issue_type=None,
        project=None,
        created_by=create_user,
    )


@pytest.fixture
def mock_feature_flag_enabled():
    """Mock the feature flag check to always return True"""
    mock_client = MagicMock()
    mock_client.get_boolean_value.return_value = True
    with patch("openfeature.api.set_provider"):
        with patch("openfeature.api.get_client", return_value=mock_client):
            yield


# ============================================================================
# WORK ITEM TYPE ENDPOINTS
# ============================================================================


@pytest.mark.contract
class TestGlobalWorkItemTypeListCreate:
    """Test GET/POST /workspaces/:slug/work-item-types/"""

    def get_url(self, slug):
        return f"/api/v1/workspaces/{slug}/work-item-types/"

    @pytest.mark.django_db
    def test_list_types(self, api_key_client, workspace, issue_type, mock_feature_flag_enabled):
        url = self.get_url(workspace.slug)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        names = [t["name"] for t in response.data]
        assert "Task" in names

    @pytest.mark.django_db
    def test_list_types_includes_project_ids(
        self, api_key_client, workspace, project, issue_type, mock_feature_flag_enabled
    ):
        """Types associated with projects should include project_ids"""
        ProjectIssueType.objects.create(project=project, issue_type=issue_type, level=0)
        url = self.get_url(workspace.slug)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        type_data = next(t for t in response.data if t["name"] == "Task")
        assert str(project.id) in [str(pid) for pid in type_data["project_ids"]]

    @pytest.mark.django_db
    def test_create_type(self, api_key_client, workspace, mock_feature_flag_enabled):
        url = self.get_url(workspace.slug)
        data = {"name": "Bug", "description": "Bug type"}
        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Bug"
        assert response.data["logo_props"] is not None
        # should NOT have any project association
        assert not ProjectIssueType.objects.filter(issue_type_id=response.data["id"]).exists()

    @pytest.mark.django_db
    def test_create_type_external_id_dedup(self, api_key_client, workspace, issue_type, mock_feature_flag_enabled):
        """Creating a type with duplicate external_id + external_source returns 409"""
        issue_type.external_id = "ext-123"
        issue_type.external_source = "jira"
        issue_type.save()

        url = self.get_url(workspace.slug)
        data = {"name": "Duplicate", "external_id": "ext-123", "external_source": "jira"}
        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_409_CONFLICT
        assert response.data["id"] == str(issue_type.id)


@pytest.mark.contract
class TestGlobalWorkItemTypeDetail:
    """Test GET/PATCH /workspaces/:slug/work-item-types/:type_id/"""

    def get_url(self, slug, type_id):
        return f"/api/v1/workspaces/{slug}/work-item-types/{type_id}/"

    @pytest.mark.django_db
    def test_get_type(self, api_key_client, workspace, issue_type, mock_feature_flag_enabled):
        url = self.get_url(workspace.slug, issue_type.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Task"

    @pytest.mark.django_db
    def test_update_type(self, api_key_client, workspace, issue_type, mock_feature_flag_enabled):
        url = self.get_url(workspace.slug, issue_type.id)
        response = api_key_client.patch(url, {"name": "Updated Task"}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated Task"

    @pytest.mark.django_db
    def test_cannot_disable_default_type(
        self, api_key_client, workspace, default_issue_type, mock_feature_flag_enabled
    ):
        url = self.get_url(workspace.slug, default_issue_type.id)
        response = api_key_client.patch(url, {"is_active": False}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_update_external_id_conflict(
        self, api_key_client, workspace, issue_type, mock_feature_flag_enabled, create_user
    ):
        """Updating external_id to one that already exists on another type returns 409"""
        url = self.get_url(workspace.slug, issue_type.id)
        response = api_key_client.patch(
            url, {"external_id": "ext-existing", "external_source": "jira"}, format="json"
        )

        assert response.status_code == status.HTTP_409_CONFLICT


@pytest.mark.contract
class TestGlobalWorkItemTypeAssociate:
    """Test POST /workspaces/:slug/projects/:project_id/import-work-item-types/"""

    def get_url(self, slug, project_id):
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/import-work-item-types/"

    @pytest.mark.django_db
    def test_associate_type_with_project(
        self, api_key_client, workspace, project, issue_type, mock_feature_flag_enabled
    ):
        url = self.get_url(workspace.slug, project.id)
        response = api_key_client.post(
            url,
            {"work_item_types": [str(issue_type.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert ProjectIssueType.objects.filter(project=project, issue_type=issue_type).exists()

    @pytest.mark.django_db
    def test_associate_duplicate_is_idempotent(
        self, api_key_client, workspace, project, issue_type, mock_feature_flag_enabled
    ):
        ProjectIssueType.objects.create(project=project, issue_type=issue_type, level=0)

        url = self.get_url(workspace.slug, project.id)
        response = api_key_client.post(
            url,
            {"work_item_types": [str(issue_type.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert ProjectIssueType.objects.filter(project=project, issue_type=issue_type).count() == 1


# ============================================================================
# WORK ITEM TYPE PROPERTY ENDPOINTS
# ============================================================================


@pytest.mark.contract
class TestGlobalWorkItemTypePropertyListCreate:
    """Test GET/POST /workspaces/:slug/work-item-types/:type_id/properties/"""

    def get_url(self, slug, type_id):
        return f"/api/v1/workspaces/{slug}/work-item-types/{type_id}/properties/"

    @pytest.mark.django_db
    def test_list_properties(
        self, api_key_client, workspace, issue_type, issue_property, mock_feature_flag_enabled
    ):
        url = self.get_url(workspace.slug, issue_type.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    @pytest.mark.django_db
    def test_add_property_to_type(
        self, api_key_client, workspace, issue_type, unattached_issue_property, mock_feature_flag_enabled
    ):
        url = self.get_url(workspace.slug, issue_type.id)
        data = {"properties": [str(unattached_issue_property.id)]}
        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert IssueTypeProperty.objects.filter(issue_type=issue_type, property=unattached_issue_property).exists()

    @pytest.mark.django_db
    def test_add_property_rejects_invalid_workspace_property(
        self, api_key_client, workspace, issue_type, project, create_user, mock_feature_flag_enabled
    ):
        invalid_property = IssueProperty.objects.create(
            name="Project Property",
            display_name="Project Property",
            property_type=PropertyTypeEnum.TEXT,
            workspace=workspace,
            issue_type=issue_type,
            project=project,
            created_by=create_user,
        )

        url = self.get_url(workspace.slug, issue_type.id)
        response = api_key_client.post(url, {"properties": [str(invalid_property.id)]}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
class TestGlobalWorkItemTypePropertyDetail:
    """Test PATCH/DELETE /workspaces/:slug/work-item-types/:type_id/properties/:property_id/"""

    def get_url(self, slug, type_id, property_id):
        return f"/api/v1/workspaces/{slug}/work-item-types/{type_id}/properties/{property_id}/"

    @pytest.mark.django_db
    def test_update_property_sort_order(
        self, api_key_client, workspace, issue_type, issue_property, mock_feature_flag_enabled
    ):
        url = self.get_url(workspace.slug, issue_type.id, issue_property.id)
        response = api_key_client.patch(url, {"sort_order": 20000}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert IssueTypeProperty.objects.get(issue_type=issue_type, property=issue_property).sort_order == 20000

    @pytest.mark.django_db
    def test_remove_property_from_type(
        self, api_key_client, workspace, issue_type, issue_property, mock_feature_flag_enabled
    ):
        url = self.get_url(workspace.slug, issue_type.id, issue_property.id)
        response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not IssueTypeProperty.objects.filter(issue_type=issue_type, property=issue_property).exists()
