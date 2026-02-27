# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from unittest.mock import MagicMock, patch
from rest_framework import status
from uuid import uuid4
from django.utils import timezone

from plane.db.models import Page, ProjectPage, Project, ProjectMember


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
        role=20,  # Admin role
        is_active=True,
    )
    return project


@pytest.fixture
def page_data():
    """Sample page data for tests"""
    return {
        "name": "Test Page",
        "description_html": "<p>Test page content</p>",
    }


@pytest.fixture(autouse=True)
def _mock_celery():
    """Prevent all celery tasks from hitting a broker"""
    with patch("celery.app.task.Task.delay", return_value=MagicMock(id="mock-task-id")):
        yield


@pytest.fixture
def create_page(db, project, create_user):
    """Create a test page with project association"""
    page = Page.objects.create(
        name="Existing Page",
        description_html="<p>Existing content</p>",
        workspace=project.workspace,
        owned_by=create_user,
    )
    ProjectPage.objects.create(
        workspace=project.workspace,
        project=project,
        page=page,
    )
    return page


@pytest.mark.contract
class TestPageListCreateAPIEndpoint:
    """Test Page List and Create API Endpoint"""

    def get_page_url(self, workspace_slug, project_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/"

    @pytest.mark.django_db
    def test_create_page_success(self, api_key_client, workspace, project, page_data):
        """Test successful page creation"""
        url = self.get_page_url(workspace.slug, project.id)

        response = api_key_client.post(url, page_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert Page.objects.count() == 1

        created_page = Page.objects.first()
        assert created_page.name == page_data["name"]
        assert created_page.description_html == page_data["description_html"]
        assert created_page.owned_by is not None

        # Verify ProjectPage association was created
        assert ProjectPage.objects.filter(page=created_page, project=project).exists()

    @pytest.mark.django_db
    def test_create_page_with_external_id(self, api_key_client, workspace, project):
        """Test creating page with external ID"""
        url = self.get_page_url(workspace.slug, project.id)

        data = {
            "name": "External Page",
            "external_id": "ext-123",
            "external_source": "confluence",
        }

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        created_page = Page.objects.first()
        assert created_page.external_id == "ext-123"
        assert created_page.external_source == "confluence"

    @pytest.mark.django_db
    def test_create_page_duplicate_external_id(self, api_key_client, workspace, project, create_user):
        """Test creating page with duplicate external ID returns 409"""
        url = self.get_page_url(workspace.slug, project.id)

        # Create first page with external ID
        page = Page.objects.create(
            name="First Page",
            workspace=workspace,
            owned_by=create_user,
            external_id="ext-123",
            external_source="confluence",
        )
        ProjectPage.objects.create(
            workspace=workspace,
            project=project,
            page=page,
        )

        # Try to create second page with same external ID
        data = {
            "name": "Second Page",
            "external_id": "ext-123",
            "external_source": "confluence",
        }

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_409_CONFLICT
        assert "same external id" in response.data["error"]

    @pytest.mark.django_db
    def test_list_pages_success(self, api_key_client, workspace, project, create_page, create_user):
        """Test successful page listing"""
        url = self.get_page_url(workspace.slug, project.id)

        # Create additional pages
        for i in range(2):
            page = Page.objects.create(
                name=f"Page {i + 2}",
                workspace=workspace,
                owned_by=create_user,
            )
            ProjectPage.objects.create(
                workspace=workspace,
                project=project,
                page=page,
            )

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert len(response.data["results"]) == 3  # Including create_page fixture

    @pytest.mark.django_db
    def test_list_pages_excludes_archived(self, api_key_client, workspace, project, create_user):
        """Test that archived pages are excluded from listing"""
        url = self.get_page_url(workspace.slug, project.id)

        # Create a non-archived page
        active_page = Page.objects.create(
            name="Active Page",
            workspace=workspace,
            owned_by=create_user,
        )
        ProjectPage.objects.create(
            workspace=workspace,
            project=project,
            page=active_page,
        )

        # Create an archived page
        archived_page = Page.objects.create(
            name="Archived Page",
            workspace=workspace,
            owned_by=create_user,
            archived_at=timezone.now().date(),
        )
        ProjectPage.objects.create(
            workspace=workspace,
            project=project,
            page=archived_page,
        )

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        page_ids = [str(p["id"]) for p in response.data["results"]]
        assert str(active_page.id) in page_ids
        assert str(archived_page.id) not in page_ids

    @pytest.mark.django_db
    def test_list_pages_excludes_private_pages_of_other_users(self, api_key_client, workspace, project, create_user):
        """Test that private pages owned by other users are excluded"""
        url = self.get_page_url(workspace.slug, project.id)

        from plane.db.models import User

        other_user = User.objects.create(
            email="other@plane.so",
            username=f"other_{uuid4().hex[:8]}",
            first_name="Other",
            last_name="User",
        )

        # Public page by other user -- should be visible
        public_page = Page.objects.create(
            name="Public Page",
            workspace=workspace,
            owned_by=other_user,
            access=0,
        )
        ProjectPage.objects.create(
            workspace=workspace,
            project=project,
            page=public_page,
        )

        # Private page by other user -- should be hidden
        private_page = Page.objects.create(
            name="Private Page",
            workspace=workspace,
            owned_by=other_user,
            access=1,
        )
        ProjectPage.objects.create(
            workspace=workspace,
            project=project,
            page=private_page,
        )

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        page_ids = [str(p["id"]) for p in response.data["results"]]
        assert str(public_page.id) in page_ids
        assert str(private_page.id) not in page_ids


@pytest.mark.contract
class TestPageDetailAPIEndpoint:
    """Test Page Detail API Endpoint"""

    def get_page_detail_url(self, workspace_slug, project_id, page_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/"

    @pytest.mark.django_db
    def test_get_page_success(self, api_key_client, workspace, project, create_page):
        """Test successful page retrieval"""
        url = self.get_page_detail_url(workspace.slug, project.id, create_page.id)

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(create_page.id)
        assert response.data["name"] == create_page.name

    @pytest.mark.django_db
    def test_get_page_not_found(self, api_key_client, workspace, project):
        """Test getting non-existent page"""
        fake_id = uuid4()
        url = self.get_page_detail_url(workspace.slug, project.id, fake_id)

        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_update_page_success(self, api_key_client, workspace, project, create_page):
        """Test successful page update"""
        url = self.get_page_detail_url(workspace.slug, project.id, create_page.id)

        update_data = {
            "name": f"Updated Page {uuid4()}",
        }

        response = api_key_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK

        create_page.refresh_from_db()
        assert create_page.name == update_data["name"]

    @pytest.mark.django_db
    def test_update_page_description(self, api_key_client, workspace, project, create_page):
        """Test updating page description fires page_transaction"""
        url = self.get_page_detail_url(workspace.slug, project.id, create_page.id)

        update_data = {
            "description_html": "<p>Updated content</p>",
        }

        response = api_key_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK

        create_page.refresh_from_db()
        assert create_page.description_html == "<p>Updated content</p>"

    @pytest.mark.django_db
    def test_update_locked_page(self, api_key_client, workspace, project, create_page):
        """Test that locked pages cannot be updated"""
        create_page.is_locked = True
        create_page.save()

        url = self.get_page_detail_url(workspace.slug, project.id, create_page.id)

        response = api_key_client.patch(url, {"name": "New Name"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "locked" in response.data["error"].lower()

    @pytest.mark.django_db
    def test_update_page_access_by_non_owner(self, api_key_client, workspace, project, create_user):
        """Test that non-owners cannot change page access level"""
        from plane.db.models import User

        other_user = User.objects.create(
            email="owner@plane.so",
            username=f"owner_{uuid4().hex[:8]}",
            first_name="Owner",
            last_name="User",
        )

        page = Page.objects.create(
            name="Other's Page",
            workspace=workspace,
            owned_by=other_user,
            access=0,  # Public
        )
        ProjectPage.objects.create(
            workspace=workspace,
            project=project,
            page=page,
        )

        url = self.get_page_detail_url(workspace.slug, project.id, page.id)

        response = api_key_client.patch(url, {"access": 1}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "owned by someone else" in response.data["error"]

    @pytest.mark.django_db
    def test_update_page_external_id_conflict(self, api_key_client, workspace, project, create_page, create_user):
        """Test updating page with conflicting external ID"""
        # Create another page with an external ID
        other_page = Page.objects.create(
            name="Other Page",
            workspace=workspace,
            owned_by=create_user,
            external_id="ext-456",
            external_source="confluence",
        )
        ProjectPage.objects.create(
            workspace=workspace,
            project=project,
            page=other_page,
        )

        url = self.get_page_detail_url(workspace.slug, project.id, create_page.id)

        response = api_key_client.patch(
            url,
            {"external_id": "ext-456", "external_source": "confluence"},
            format="json",
        )

        assert response.status_code == status.HTTP_409_CONFLICT
        assert "same external id" in response.data["error"]

    @pytest.mark.django_db
    def test_delete_archived_page_success(self, api_key_client, workspace, project, create_page):
        """Test successful deletion of an archived page"""
        create_page.archived_at = timezone.now().date()
        create_page.save()

        url = self.get_page_detail_url(workspace.slug, project.id, create_page.id)

        response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Page.objects.filter(id=create_page.id).exists()

    @pytest.mark.django_db
    def test_delete_non_archived_page(self, api_key_client, workspace, project, create_page):
        """Test that non-archived pages cannot be deleted"""
        url = self.get_page_detail_url(workspace.slug, project.id, create_page.id)

        response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "archived before deleting" in response.data["error"]

    @pytest.mark.django_db
    def test_delete_page_non_owner_non_admin(self, api_key_client, workspace, project, create_user):
        """Test that non-owner non-admin cannot delete a page"""
        from plane.db.models import User

        other_user = User.objects.create(
            email="owner2@plane.so",
            username=f"owner2_{uuid4().hex[:8]}",
            first_name="Page",
            last_name="Owner",
        )

        page = Page.objects.create(
            name="Other's Page",
            workspace=workspace,
            owned_by=other_user,
            access=0,
            archived_at=timezone.now().date(),
        )
        ProjectPage.objects.create(
            workspace=workspace,
            project=project,
            page=page,
        )

        # Downgrade the API user to member (role=15) so they are not admin
        ProjectMember.objects.filter(project=project, member=create_user).update(role=15)

        url = self.get_page_detail_url(workspace.slug, project.id, page.id)

        response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Only admin or owner" in response.data["error"]

    @pytest.mark.django_db
    def test_delete_page_clears_children_parent(self, api_key_client, workspace, project, create_page, create_user):
        """Test that deleting a page sets parent=None on its children"""
        child_page = Page.objects.create(
            name="Child Page",
            workspace=workspace,
            owned_by=create_user,
            parent=create_page,
        )
        ProjectPage.objects.create(
            workspace=workspace,
            project=project,
            page=child_page,
        )

        # Archive the parent so it can be deleted
        create_page.archived_at = timezone.now().date()
        create_page.save()

        url = self.get_page_detail_url(workspace.slug, project.id, create_page.id)

        response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        child_page.refresh_from_db()
        assert child_page.parent is None

