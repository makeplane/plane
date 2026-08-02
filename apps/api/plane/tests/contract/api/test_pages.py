# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import patch

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import Page, Project, ProjectMember, ProjectPage, User


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the user as a member"""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
        page_view=True,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,  # Admin role
        is_active=True,
    )
    return project


@pytest.fixture
def other_user(db):
    """Create a second user to test ownership rules"""
    from uuid import uuid4

    unique_id = uuid4().hex[:8]
    user = User.objects.create(
        email=f"other-{unique_id}@plane.so",
        username=f"other_user_{unique_id}",
        first_name="Other",
        last_name="User",
    )
    user.set_password("other-password")
    user.save()
    return user


@pytest.fixture
def page_data():
    """Sample page data for tests"""
    return {
        "name": "Test Page",
        "description_html": "<h1>Test Page</h1><p>A test page for contract tests.</p>",
    }


@pytest.fixture
def create_page(db, project, create_user):
    """Create a test page owned by the authenticated user"""
    page = Page.objects.create(
        name="Existing Page",
        description_html="<p>An existing page</p>",
        workspace=project.workspace,
        owned_by=create_user,
        access=Page.PUBLIC_ACCESS,
    )
    ProjectPage.objects.create(workspace=project.workspace, project=project, page=page)
    return page


def _make_page(project, owner, access=Page.PUBLIC_ACCESS, **kwargs):
    """Helper to create a page linked to a project"""
    page = Page.objects.create(
        workspace=project.workspace,
        owned_by=owner,
        access=access,
        name=kwargs.pop("name", "Helper Page"),
        **kwargs,
    )
    ProjectPage.objects.create(workspace=project.workspace, project=project, page=page)
    return page


@pytest.mark.contract
class TestPageListCreateAPIEndpoint:
    """Test Page List and Create API Endpoint"""

    def get_page_url(self, workspace_slug, project_id):
        """Helper to get page endpoint URL"""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/"

    @pytest.mark.django_db
    def test_create_page_success(self, api_key_client, workspace, project, page_data):
        """Test successful page creation"""
        url = self.get_page_url(workspace.slug, project.id)

        with patch("plane.api.views.page.page_transaction") as mock_page_transaction:
            response = api_key_client.post(url, page_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert Page.objects.count() == 1

        created_page = Page.objects.first()
        assert created_page.name == page_data["name"]
        assert created_page.description_html == page_data["description_html"]
        assert created_page.owned_by_id is not None
        assert ProjectPage.objects.filter(page=created_page, project=project).exists()
        assert response.data["description_html"] == page_data["description_html"]
        mock_page_transaction.delay.assert_called_once()

    @pytest.mark.django_db
    def test_create_page_invalid_data(self, api_key_client, workspace, project):
        """Test page creation with invalid data"""
        url = self.get_page_url(workspace.slug, project.id)

        # Test with empty data
        response = api_key_client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Test with missing name
        response = api_key_client.post(url, {"description_html": "<p>No name</p>"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_page_external_id_conflict(self, api_key_client, workspace, project, page_data):
        """Test page creation deduplication by external id and source"""
        url = self.get_page_url(workspace.slug, project.id)
        payload = {**page_data, "external_id": "ext-1", "external_source": "github"}

        with patch("plane.api.views.page.page_transaction"):
            response = api_key_client.post(url, payload, format="json")
            assert response.status_code == status.HTTP_201_CREATED

            response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_409_CONFLICT
        assert "id" in response.data
        assert Page.objects.count() == 1

    @pytest.mark.django_db
    def test_create_page_ignores_archived_at(self, api_key_client, workspace, project, page_data):
        """Test archived_at is read-only and cannot be set on create"""
        url = self.get_page_url(workspace.slug, project.id)
        payload = {**page_data, "archived_at": "2024-01-01"}

        with patch("plane.api.views.page.page_transaction"):
            response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert Page.objects.first().archived_at is None

    @pytest.mark.django_db
    def test_list_pages(self, api_key_client, workspace, project, create_page):
        """Test listing pages returns the paginated envelope"""
        url = self.get_page_url(workspace.slug, project.id)

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_count"] == 1
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["name"] == create_page.name

    @pytest.mark.django_db
    def test_list_pages_excludes_other_users_private_pages(self, api_key_client, workspace, project, other_user):
        """Test private pages of other users are not listed"""
        _make_page(project, other_user, access=Page.PRIVATE_ACCESS, name="Private Page")
        _make_page(project, other_user, access=Page.PUBLIC_ACCESS, name="Public Page")

        url = self.get_page_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        names = [page["name"] for page in response.data["results"]]
        assert "Public Page" in names
        assert "Private Page" not in names

    @pytest.mark.django_db
    def test_pages_require_authentication(self, api_client, workspace, project):
        """Test pages endpoints reject unauthenticated requests"""
        url = self.get_page_url(workspace.slug, project.id)

        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.contract
class TestPageDetailAPIEndpoint:
    """Test Page Detail API Endpoint"""

    def get_page_url(self, workspace_slug, project_id, page_id):
        """Helper to get page detail endpoint URL"""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/"

    @pytest.mark.django_db
    def test_retrieve_page(self, api_key_client, workspace, project, create_page):
        """Test retrieving a page returns its content"""
        url = self.get_page_url(workspace.slug, project.id, create_page.id)

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == create_page.id
        assert response.data["description_html"] == create_page.description_html

    @pytest.mark.django_db
    def test_retrieve_other_users_private_page_not_found(self, api_key_client, workspace, project, other_user):
        """Test private pages of other users are not retrievable"""
        page = _make_page(project, other_user, access=Page.PRIVATE_ACCESS)
        url = self.get_page_url(workspace.slug, project.id, page.id)

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_update_page(self, api_key_client, workspace, project, create_page):
        """Test updating a page's name and content"""
        url = self.get_page_url(workspace.slug, project.id, create_page.id)
        payload = {"name": "Updated Page", "description_html": "<p>Updated content</p>"}

        with patch("plane.api.views.page.page_transaction") as mock_page_transaction:
            response = api_key_client.patch(url, payload, format="json")

        assert response.status_code == status.HTTP_200_OK
        create_page.refresh_from_db()
        assert create_page.name == "Updated Page"
        assert create_page.description_html == "<p>Updated content</p>"
        mock_page_transaction.delay.assert_called_once()

    @pytest.mark.django_db
    def test_update_locked_page(self, api_key_client, workspace, project, create_page):
        """Test locked pages cannot be updated"""
        create_page.is_locked = True
        create_page.save()
        url = self.get_page_url(workspace.slug, project.id, create_page.id)

        response = api_key_client.patch(url, {"name": "New Name"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_unlock_locked_page(self, api_key_client, workspace, project, create_page):
        """Test a locked page can still be unlocked"""
        create_page.is_locked = True
        create_page.save()
        url = self.get_page_url(workspace.slug, project.id, create_page.id)

        response = api_key_client.patch(url, {"is_locked": False}, format="json")

        assert response.status_code == status.HTTP_200_OK
        create_page.refresh_from_db()
        assert create_page.is_locked is False

    @pytest.mark.django_db
    def test_update_with_string_access_value(self, api_key_client, workspace, project, other_user):
        """Test access values sent as strings do not trigger false ownership errors"""
        page = _make_page(project, other_user, access=Page.PUBLIC_ACCESS)
        url = self.get_page_url(workspace.slug, project.id, page.id)

        response = api_key_client.patch(url, {"name": "Renamed", "access": str(Page.PUBLIC_ACCESS)}, format="json")

        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.name == "Renamed"

    @pytest.mark.django_db
    def test_update_access_by_non_owner(self, api_key_client, workspace, project, other_user):
        """Test only the page owner can change its access level"""
        page = _make_page(project, other_user, access=Page.PUBLIC_ACCESS)
        url = self.get_page_url(workspace.slug, project.id, page.id)

        response = api_key_client.patch(url, {"access": Page.PRIVATE_ACCESS}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_delete_page_requires_archive(self, api_key_client, workspace, project, create_page):
        """Test pages must be archived before deletion"""
        url = self.get_page_url(workspace.slug, project.id, create_page.id)

        response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Page.objects.filter(pk=create_page.pk).exists()

    @pytest.mark.django_db
    def test_delete_archived_page(self, api_key_client, workspace, project, create_page):
        """Test archived pages can be deleted by their owner"""
        create_page.archived_at = timezone.now()
        create_page.save()
        url = self.get_page_url(workspace.slug, project.id, create_page.id)

        response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Page.objects.filter(pk=create_page.pk).exists()


@pytest.mark.contract
class TestPageArchiveUnarchiveAPIEndpoint:
    """Test Page Archive and Unarchive API Endpoint"""

    def get_archive_url(self, workspace_slug, project_id, page_id):
        """Helper to get page archive endpoint URL"""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/archive/"

    @pytest.mark.django_db
    def test_archive_page(self, api_key_client, workspace, project, create_page):
        """Test archiving a page"""
        url = self.get_archive_url(workspace.slug, project.id, create_page.id)

        response = api_key_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        assert "archived_at" in response.data
        create_page.refresh_from_db()
        assert create_page.archived_at is not None

    @pytest.mark.django_db
    def test_unarchive_page(self, api_key_client, workspace, project, create_page):
        """Test unarchiving an archived page"""
        create_page.archived_at = timezone.now()
        create_page.save()
        url = self.get_archive_url(workspace.slug, project.id, create_page.id)

        response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        create_page.refresh_from_db()
        assert create_page.archived_at is None
