# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Tests for the Pages v1 API endpoints.

Covers: list, create, retrieve, partial update, delete.
"""

import pytest
from rest_framework import status

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
def page(db, workspace, project, create_user):
    """Create a test page in the project"""
    p = Page.objects.create(
        name="Test Page",
        description_html="<p>Test content</p>",
        owned_by=create_user,
        workspace=workspace,
        access=0,
    )
    ProjectPage.objects.create(
        workspace=workspace,
        project=project,
        page=p,
        created_by=create_user,
        updated_by=create_user,
    )
    return p


@pytest.fixture
def locked_page(db, workspace, project, create_user):
    """Create a locked test page in the project"""
    p = Page.objects.create(
        name="Locked Page",
        description_html="<p>Locked content</p>",
        owned_by=create_user,
        workspace=workspace,
        access=0,
        is_locked=True,
    )
    ProjectPage.objects.create(
        workspace=workspace,
        project=project,
        page=p,
        created_by=create_user,
        updated_by=create_user,
    )
    return p


class TestPageListCreate:
    """Tests for GET and POST /api/v1/workspaces/{slug}/projects/{id}/pages/"""

    def get_url(self, slug, project_id):
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/"

    @pytest.mark.django_db
    def test_list_pages_unauthenticated(self, api_client, workspace, project):
        """Unauthenticated requests should be rejected"""
        response = api_client.get(self.get_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_list_pages_returns_200(self, api_key_client, workspace, project):
        """Authenticated requests should return a list of pages"""
        response = api_key_client.get(self.get_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)

    @pytest.mark.django_db
    def test_list_pages_includes_project_page(self, api_key_client, workspace, project, page):
        """Listed pages should include pages belonging to the project"""
        response = api_key_client.get(self.get_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_200_OK
        page_ids = [str(p["id"]) for p in response.data]
        assert str(page.id) in page_ids

    @pytest.mark.django_db
    def test_create_page(self, api_key_client, workspace, project):
        """Creating a page should return 201 with the page data"""
        payload = {
            "name": "My New Page",
            "description_html": "<p>Hello world</p>",
        }
        response = api_key_client.post(
            self.get_url(workspace.slug, project.id),
            payload,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "My New Page"
        assert Page.objects.filter(name="My New Page").exists()

    @pytest.mark.django_db
    def test_create_page_missing_name(self, api_key_client, workspace, project):
        """Creating a page without a name should return 400"""
        response = api_key_client.post(
            self.get_url(workspace.slug, project.id),
            {"description_html": "<p>No name</p>"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_page_invalid_project(self, api_key_client, workspace):
        """Creating a page with an invalid project ID should return 404"""
        import uuid
        response = api_key_client.post(
            self.get_url(workspace.slug, uuid.uuid4()),
            {"name": "Orphan Page"},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestPageDetail:
    """Tests for GET, PATCH, DELETE /api/v1/workspaces/{slug}/projects/{id}/pages/{page_id}/"""

    def get_url(self, slug, project_id, page_id):
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/"

    @pytest.mark.django_db
    def test_get_page(self, api_key_client, workspace, project, page):
        """Retrieving a page by ID should return the page data"""
        response = api_key_client.get(
            self.get_url(workspace.slug, project.id, page.id)
        )
        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(page.id)
        assert response.data["name"] == page.name

    @pytest.mark.django_db
    def test_get_nonexistent_page(self, api_key_client, workspace, project):
        """Retrieving a non-existent page should return 404"""
        import uuid
        response = api_key_client.get(
            self.get_url(workspace.slug, project.id, uuid.uuid4())
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_patch_page_name(self, api_key_client, workspace, project, page):
        """Updating a page name should return 200 with updated data"""
        response = api_key_client.patch(
            self.get_url(workspace.slug, project.id, page.id),
            {"name": "Updated Name"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated Name"

    @pytest.mark.django_db
    def test_patch_locked_page(self, api_key_client, workspace, project, locked_page):
        """Updating a locked page should return 400"""
        response = api_key_client.patch(
            self.get_url(workspace.slug, project.id, locked_page.id),
            {"name": "Should Fail"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_delete_page_by_owner(self, api_key_client, workspace, project, page):
        """Deleting a page as the owner should return 204"""
        page_id = page.id
        response = api_key_client.delete(
            self.get_url(workspace.slug, project.id, page_id)
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Page.objects.filter(id=page_id).exists()

    @pytest.mark.django_db
    def test_delete_page_unauthenticated(self, api_client, workspace, project, page):
        """Unauthenticated delete request should return 401"""
        response = api_client.delete(
            self.get_url(workspace.slug, project.id, page.id)
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
