# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from uuid import uuid4

from rest_framework import status

from plane.db.models import Label, Page, Project, ProjectMember, ProjectPage, User
from plane.db.models.api import APIToken


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the user as an admin member"""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,  # Admin role
        is_active=True,
    )
    return project


@pytest.fixture
def page_data():
    """Sample page data for tests"""
    return {
        "name": "Test Page",
        "description_html": "<p>A test page for unit tests</p>",
    }


@pytest.fixture
def create_page(db, project, create_user):
    """Create a test page linked to the project"""
    page = Page.objects.create(
        name="Existing Page",
        description_html="<p>An existing page</p>",
        workspace=project.workspace,
        owned_by=create_user,
    )
    ProjectPage.objects.create(
        project=project,
        workspace=project.workspace,
        page=page,
        created_by=create_user,
        updated_by=create_user,
    )
    return page


@pytest.fixture
def other_user(db):
    """Create and return another user instance"""
    user = User.objects.create(
        email="other@plane.so",
        username="other-user",
        first_name="Other",
        last_name="User",
    )
    user.set_password("other-password")
    user.save()
    return user


@pytest.fixture
def other_api_key_client(api_client, other_user):
    """Return an API key authenticated client for the other user"""
    token = APIToken.objects.create(
        user=other_user,
        label="Other API Token",
        token="other-api-token-12345",
    )
    api_client.credentials(HTTP_X_API_KEY=token.token)
    return api_client


@pytest.mark.contract
class TestPageListCreateAPIEndpoint:
    """Test Page List and Create API Endpoint"""

    def get_page_url(self, workspace_slug, project_id):
        """Helper to get page endpoint URL"""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/"

    @pytest.mark.django_db
    def test_create_page_success(self, api_key_client, workspace, project, page_data, create_user):
        """Test successful page creation"""
        url = self.get_page_url(workspace.slug, project.id)

        response = api_key_client.post(url, page_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED

        assert Page.objects.count() == 1

        created_page = Page.objects.first()
        assert created_page.name == page_data["name"]
        assert created_page.description_html == page_data["description_html"]
        assert created_page.description_stripped == "A test page for unit tests"
        assert created_page.owned_by == create_user
        assert created_page.workspace == workspace

        # The page is linked to the project
        assert ProjectPage.objects.filter(project=project, page=created_page).exists()
        assert str(project.id) in response.data["project_ids"]

    @pytest.mark.django_db
    def test_create_page_with_labels(self, api_key_client, workspace, project, page_data):
        """Test page creation with labels"""
        label = Label.objects.create(name="Docs", project=project, workspace=workspace)
        url = self.get_page_url(workspace.slug, project.id)

        response = api_key_client.post(url, {**page_data, "labels": [str(label.id)]}, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert str(label.id) in response.data["label_ids"]

    @pytest.mark.django_db
    def test_create_page_invalid_parent(self, api_key_client, workspace, project, page_data):
        """Test page creation with a parent that does not exist in the project"""
        url = self.get_page_url(workspace.slug, project.id)

        response = api_key_client.post(url, {**page_data, "parent": str(uuid4())}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_page_duplicate_external_id(self, api_key_client, workspace, project, create_page):
        """Test creating page with duplicate external ID"""
        create_page.external_id = "ext-123"
        create_page.external_source = "github"
        create_page.save()

        url = self.get_page_url(workspace.slug, project.id)
        page_data = {
            "name": "Second Page",
            "external_id": "ext-123",
            "external_source": "github",
        }

        response = api_key_client.post(url, page_data, format="json")

        assert response.status_code == status.HTTP_409_CONFLICT
        assert "same external id" in response.data["error"]

    @pytest.mark.django_db
    def test_list_pages_success(self, api_key_client, workspace, project, create_page, create_user):
        """Test successful page listing"""
        url = self.get_page_url(workspace.slug, project.id)

        # Create an additional page
        page = Page.objects.create(
            name="Page 2",
            workspace=project.workspace,
            owned_by=create_user,
        )
        ProjectPage.objects.create(
            project=project,
            workspace=project.workspace,
            page=page,
            created_by=create_user,
            updated_by=create_user,
        )

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert len(response.data["results"]) == 2

    @pytest.mark.django_db
    def test_list_pages_visibility(self, api_key_client, workspace, project, create_page, other_user):
        """Test that private pages of other users are not listed"""
        # Private page owned by another user
        private_page = Page.objects.create(
            name="Private Page",
            workspace=project.workspace,
            owned_by=other_user,
            access=1,  # Private
        )
        ProjectPage.objects.create(
            project=project,
            workspace=project.workspace,
            page=private_page,
            created_by=other_user,
            updated_by=other_user,
        )

        url = self.get_page_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        result_ids = [str(result["id"]) for result in response.data["results"]]
        assert str(create_page.id) in result_ids
        assert str(private_page.id) not in result_ids

    @pytest.mark.django_db
    def test_pages_unauthenticated(self, api_client, workspace, project):
        """Test page endpoints without authentication"""
        url = self.get_page_url(workspace.slug, project.id)

        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        response = api_client.post(url, {"name": "Nope"}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.contract
class TestPageDetailAPIEndpoint:
    """Test Page Detail API Endpoint"""

    def get_page_detail_url(self, workspace_slug, project_id, page_id):
        """Helper to get page detail endpoint URL"""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/"

    @pytest.mark.django_db
    def test_retrieve_page_success(self, api_key_client, workspace, project, create_page):
        """Test successful page retrieval"""
        url = self.get_page_detail_url(workspace.slug, project.id, create_page.id)

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(create_page.id)
        assert response.data["name"] == create_page.name
        assert response.data["description_html"] == "<p>An existing page</p>"
        assert str(project.id) in response.data["project_ids"]

    @pytest.mark.django_db
    def test_retrieve_page_not_found(self, api_key_client, workspace, project):
        """Test page retrieval with invalid page ID"""
        url = self.get_page_detail_url(workspace.slug, project.id, uuid4())

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_update_page_success(self, api_key_client, workspace, project, create_page):
        """Test successful page update"""
        url = self.get_page_detail_url(workspace.slug, project.id, create_page.id)

        response = api_key_client.patch(
            url,
            {"name": "Updated Page", "description_html": "<p>Updated content</p>"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        create_page.refresh_from_db()
        assert create_page.name == "Updated Page"
        assert create_page.description_html == "<p>Updated content</p>"
        assert create_page.description_stripped == "Updated content"

    @pytest.mark.django_db
    def test_update_locked_page(self, api_key_client, workspace, project, create_page):
        """Test updating a locked page"""
        create_page.is_locked = True
        create_page.save()

        url = self.get_page_detail_url(workspace.slug, project.id, create_page.id)
        response = api_key_client.patch(url, {"name": "Should Not Update"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["error"] == "Page is locked"

    @pytest.mark.django_db
    def test_update_page_access_by_non_owner(self, other_api_key_client, workspace, project, create_page, other_user):
        """Test that a non-owner cannot update the page access"""
        # Make the other user a project admin
        ProjectMember.objects.create(
            project=project,
            member=other_user,
            role=20,
            is_active=True,
        )

        url = self.get_page_detail_url(workspace.slug, project.id, create_page.id)
        response = other_api_key_client.patch(url, {"access": 1}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "owned by someone else" in response.data["error"]

    @pytest.mark.django_db
    def test_delete_unarchived_page(self, api_key_client, workspace, project, create_page):
        """Test deleting a page that is not archived"""
        url = self.get_page_detail_url(workspace.slug, project.id, create_page.id)

        response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "should be archived" in response.data["error"]

    @pytest.mark.django_db
    def test_delete_archived_page(self, api_key_client, workspace, project, create_page):
        """Test successful deletion of an archived page"""
        from django.utils import timezone

        create_page.archived_at = timezone.now().date()
        create_page.save()

        url = self.get_page_detail_url(workspace.slug, project.id, create_page.id)
        response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Page.objects.filter(id=create_page.id).exists()

    @pytest.mark.django_db
    def test_delete_page_forbidden_for_non_owner_non_admin(
        self, other_api_key_client, workspace, project, create_page, other_user
    ):
        """Test that a non-owner project member cannot delete the page"""
        from django.utils import timezone

        create_page.archived_at = timezone.now().date()
        create_page.save()

        # Make the other user a regular project member
        ProjectMember.objects.create(
            project=project,
            member=other_user,
            role=15,  # Member role
            is_active=True,
        )

        url = self.get_page_detail_url(workspace.slug, project.id, create_page.id)
        response = other_api_key_client.delete(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Page.objects.filter(id=create_page.id).exists()
