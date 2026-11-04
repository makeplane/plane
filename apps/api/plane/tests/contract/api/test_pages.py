# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status
from uuid import uuid4

from plane.db.models import Page, Project, ProjectMember, ProjectPage, User


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the user as an admin member."""
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
def other_user(db):
    """Create a second user for ownership tests."""
    user = User.objects.create(
        email="other@plane.so",
        first_name="Other",
        last_name="User",
    )
    user.set_password("other-password")
    user.save()
    return user


@pytest.fixture
def create_page(db, project, create_user):
    """Create a test page linked to the project."""
    page = Page.objects.create(
        name="Existing Page",
        description_html="<p>Test content</p>",
        owned_by=create_user,
        workspace=project.workspace,
    )
    ProjectPage.objects.create(
        workspace=project.workspace,
        project=project,
        page=page,
        created_by_id=create_user.id,
        updated_by_id=create_user.id,
    )
    return page


@pytest.fixture
def archived_page(db, project, create_user):
    """Create an archived test page."""
    from datetime import date

    page = Page.objects.create(
        name="Archived Page",
        description_html="<p>Archived content</p>",
        owned_by=create_user,
        workspace=project.workspace,
        archived_at=date.today(),
    )
    ProjectPage.objects.create(
        workspace=project.workspace,
        project=project,
        page=page,
        created_by_id=create_user.id,
        updated_by_id=create_user.id,
    )
    return page


@pytest.fixture
def locked_page(db, project, create_user):
    """Create a locked test page."""
    page = Page.objects.create(
        name="Locked Page",
        description_html="<p>Locked content</p>",
        owned_by=create_user,
        workspace=project.workspace,
        is_locked=True,
    )
    ProjectPage.objects.create(
        workspace=project.workspace,
        project=project,
        page=page,
        created_by_id=create_user.id,
        updated_by_id=create_user.id,
    )
    return page


@pytest.mark.contract
class TestPageListCreateAPIEndpoint:
    """Test Page List and Create API Endpoint."""

    def get_url(self, workspace_slug, project_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/"

    @pytest.mark.django_db
    def test_unauthenticated_request(self, api_client, workspace, project):
        """401 for unauthenticated requests."""
        url = self.get_url(workspace.slug, project.id)
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_list_pages_success(self, api_key_client, workspace, project, create_page):
        """200 with paginated results on list."""
        url = self.get_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert len(response.data["results"]) >= 1

    @pytest.mark.django_db
    def test_list_pages_excludes_archived(
        self, api_key_client, workspace, project, create_page, archived_page
    ):
        """Archived pages are excluded from the default list."""
        url = self.get_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        page_ids = [str(p["id"]) for p in response.data["results"]]
        assert str(create_page.id) in page_ids
        assert str(archived_page.id) not in page_ids

    @pytest.mark.django_db
    def test_create_page_success(self, api_key_client, workspace, project):
        """201 on successful page creation with ProjectPage created."""
        url = self.get_url(workspace.slug, project.id)
        data = {
            "name": "New Page",
            "description_html": "<p>Hello world</p>",
        }

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Page"

        page = Page.objects.get(pk=response.data["id"])
        assert page.description_binary is None
        assert ProjectPage.objects.filter(
            page=page, project=project
        ).exists()

    @pytest.mark.django_db
    def test_create_page_with_external_id(
        self, api_key_client, workspace, project
    ):
        """201 on creation with external_id, 409 on duplicate."""
        url = self.get_url(workspace.slug, project.id)
        data = {
            "name": "External Page",
            "external_id": "ext-page-1",
            "external_source": "notion",
        }

        response = api_key_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["external_id"] == "ext-page-1"

        # Duplicate should return 409
        dup_data = {
            "name": "Duplicate Page",
            "external_id": "ext-page-1",
            "external_source": "notion",
        }
        response2 = api_key_client.post(url, dup_data, format="json")
        assert response2.status_code == status.HTTP_409_CONFLICT
        assert "same external id" in response2.data["error"]


@pytest.mark.contract
class TestPageDetailAPIEndpoint:
    """Test Page Detail API Endpoint."""

    def get_url(self, workspace_slug, project_id, page_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/"

    @pytest.mark.django_db
    def test_retrieve_page(self, api_key_client, workspace, project, create_page):
        """200 on successful retrieval."""
        url = self.get_url(workspace.slug, project.id, create_page.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(create_page.id)
        assert response.data["name"] == create_page.name

    @pytest.mark.django_db
    def test_retrieve_page_not_found(self, api_key_client, workspace, project):
        """404 for non-existent page."""
        fake_id = uuid4()
        url = self.get_url(workspace.slug, project.id, fake_id)
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_update_page_success(
        self, api_key_client, workspace, project, create_page
    ):
        """200 on successful update with description_html."""
        url = self.get_url(workspace.slug, project.id, create_page.id)
        data = {
            "name": "Updated Page Name",
            "description_html": "<p>Updated content</p>",
        }

        response = api_key_client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        create_page.refresh_from_db()
        assert create_page.name == "Updated Page Name"
        assert create_page.description_html == "<p>Updated content</p>"
        assert create_page.description_binary is None

    @pytest.mark.django_db
    def test_update_locked_page(
        self, api_key_client, workspace, project, locked_page
    ):
        """400 when trying to update a locked page."""
        url = self.get_url(workspace.slug, project.id, locked_page.id)
        data = {"name": "Should Fail"}

        response = api_key_client.patch(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "locked" in response.data["error"].lower()

    @pytest.mark.django_db
    def test_update_archived_page(
        self, api_key_client, workspace, project, archived_page
    ):
        """400 when trying to update an archived page."""
        url = self.get_url(workspace.slug, project.id, archived_page.id)
        data = {"name": "Should Fail"}

        response = api_key_client.patch(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "archived" in response.data["error"].lower()

    @pytest.mark.django_db
    def test_non_owner_cannot_change_access(
        self,
        api_key_client,
        workspace,
        project,
        other_user,
        create_user,
    ):
        """403 when non-owner tries to change page access."""
        # Create a page owned by other_user
        page = Page.objects.create(
            name="Other's Page",
            description_html="<p>content</p>",
            owned_by=other_user,
            workspace=project.workspace,
            access=0,  # Public
        )
        ProjectPage.objects.create(
            workspace=project.workspace,
            project=project,
            page=page,
            created_by_id=other_user.id,
            updated_by_id=other_user.id,
        )

        url = self.get_url(workspace.slug, project.id, page.id)
        data = {"access": 1}  # Try to make it private

        response = api_key_client.patch(url, data, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_delete_requires_archived(
        self, api_key_client, workspace, project, create_page
    ):
        """400 when trying to delete a non-archived page."""
        url = self.get_url(workspace.slug, project.id, create_page.id)
        response = api_key_client.delete(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "archived" in response.data["error"].lower()

    @pytest.mark.django_db
    def test_delete_archived_page_success(
        self, api_key_client, workspace, project, archived_page
    ):
        """204 when deleting an archived page owned by the user."""
        url = self.get_url(workspace.slug, project.id, archived_page.id)
        response = api_key_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Page.objects.filter(id=archived_page.id).exists()

    @pytest.mark.django_db
    def test_delete_by_non_owner_non_admin(
        self,
        api_key_client,
        workspace,
        project,
        other_user,
        create_user,
    ):
        """403 when non-owner non-admin tries to delete."""
        from datetime import date

        page = Page.objects.create(
            name="Other's Archived Page",
            description_html="<p>content</p>",
            owned_by=other_user,
            workspace=project.workspace,
            archived_at=date.today(),
        )
        ProjectPage.objects.create(
            workspace=project.workspace,
            project=project,
            page=page,
            created_by_id=other_user.id,
            updated_by_id=other_user.id,
        )

        # Make the authenticated user a Member (not Admin)
        ProjectMember.objects.filter(
            project=project, member=create_user
        ).update(role=15)

        url = self.get_url(workspace.slug, project.id, page.id)
        response = api_key_client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
class TestPageArchiveAPIEndpoint:
    """Test Page Archive and Unarchive API Endpoint."""

    def get_url(self, workspace_slug, project_id, page_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/archive/"

    @pytest.mark.django_db
    def test_archive_page(self, api_key_client, workspace, project, create_page):
        """200 on successful archive."""
        url = self.get_url(workspace.slug, project.id, create_page.id)
        response = api_key_client.post(url, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert "archived_at" in response.data
        create_page.refresh_from_db()
        assert create_page.archived_at is not None

    @pytest.mark.django_db
    def test_unarchive_page(
        self, api_key_client, workspace, project, archived_page
    ):
        """204 on successful unarchive."""
        url = self.get_url(workspace.slug, project.id, archived_page.id)
        response = api_key_client.delete(url, format="json")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        archived_page.refresh_from_db()
        assert archived_page.archived_at is None


@pytest.mark.contract
class TestPageLockAPIEndpoint:
    """Test Page Lock and Unlock API Endpoint."""

    def get_url(self, workspace_slug, project_id, page_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/lock/"

    @pytest.mark.django_db
    def test_lock_page(self, api_key_client, workspace, project, create_page):
        """200 on successful lock by owner."""
        url = self.get_url(workspace.slug, project.id, create_page.id)
        response = api_key_client.post(url, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_locked"] is True
        create_page.refresh_from_db()
        assert create_page.is_locked is True

    @pytest.mark.django_db
    def test_unlock_page(
        self, api_key_client, workspace, project, locked_page
    ):
        """200 on successful unlock by owner."""
        url = self.get_url(workspace.slug, project.id, locked_page.id)
        response = api_key_client.delete(url, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_locked"] is False
        locked_page.refresh_from_db()
        assert locked_page.is_locked is False

    @pytest.mark.django_db
    def test_lock_by_non_owner(
        self,
        api_key_client,
        workspace,
        project,
        other_user,
    ):
        """403 when non-owner tries to lock a page."""
        page = Page.objects.create(
            name="Other's Page",
            description_html="<p>content</p>",
            owned_by=other_user,
            workspace=project.workspace,
        )
        ProjectPage.objects.create(
            workspace=project.workspace,
            project=project,
            page=page,
            created_by_id=other_user.id,
            updated_by_id=other_user.id,
        )

        url = self.get_url(workspace.slug, project.id, page.id)
        response = api_key_client.post(url, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_unlock_by_non_owner(
        self,
        api_key_client,
        workspace,
        project,
        other_user,
    ):
        """403 when non-owner tries to unlock a page."""
        page = Page.objects.create(
            name="Other's Locked Page",
            description_html="<p>content</p>",
            owned_by=other_user,
            workspace=project.workspace,
            is_locked=True,
        )
        ProjectPage.objects.create(
            workspace=project.workspace,
            project=project,
            page=page,
            created_by_id=other_user.id,
            updated_by_id=other_user.id,
        )

        url = self.get_url(workspace.slug, project.id, page.id)
        response = api_key_client.delete(url, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
