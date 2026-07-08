# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.db.models import Page, Project, ProjectMember, ProjectPage


@pytest.fixture
def project(db, workspace, create_user):
    """Create a project with the test user as an administrator"""
    project = Project.objects.create(name="Pages Project", identifier="PGP", workspace=workspace)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


def make_page(workspace, project, owner, name, parent=None):
    """Create a page linked to the given project"""
    page = Page.objects.create(workspace=workspace, name=name, owned_by=owner, access=0, parent=parent)
    ProjectPage.objects.create(workspace=workspace, project=project, page=page)
    return page


class TestPageBase:
    def get_pages_url(self, workspace_slug, project_id):
        return f"/api/workspaces/{workspace_slug}/projects/{project_id}/pages/"

    def get_page_detail_url(self, workspace_slug, project_id, page_id):
        return f"/api/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/"

    def get_sub_pages_url(self, workspace_slug, project_id, page_id):
        return f"/api/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/sub-pages/"


@pytest.mark.contract
class TestSubPagesEndpoint(TestPageBase):
    """Test the sub-pages endpoint"""

    @pytest.mark.django_db
    def test_sub_pages_returns_direct_children_only(self, session_client, workspace, project, create_user):
        """Sub-pages endpoint should return direct children but not grandchildren"""
        root = make_page(workspace, project, create_user, "Root")
        child_1 = make_page(workspace, project, create_user, "Child 1", parent=root)
        child_2 = make_page(workspace, project, create_user, "Child 2", parent=root)
        grandchild = make_page(workspace, project, create_user, "Grandchild", parent=child_1)

        url = self.get_sub_pages_url(workspace.slug, project.id, root.id)
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        page_ids = {page["id"] for page in response.json()}
        assert page_ids == {str(child_1.id), str(child_2.id)}
        assert str(grandchild.id) not in page_ids

    @pytest.mark.django_db
    def test_sub_pages_of_child_returns_grandchildren(self, session_client, workspace, project, create_user):
        """Sub-pages endpoint on a child should return its own children"""
        root = make_page(workspace, project, create_user, "Root")
        child = make_page(workspace, project, create_user, "Child", parent=root)
        grandchild = make_page(workspace, project, create_user, "Grandchild", parent=child)

        url = self.get_sub_pages_url(workspace.slug, project.id, child.id)
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        page_ids = {page["id"] for page in response.json()}
        assert page_ids == {str(grandchild.id)}

    @pytest.mark.django_db
    def test_sub_pages_empty_for_leaf_page(self, session_client, workspace, project, create_user):
        """Sub-pages endpoint should return an empty list for a page without children"""
        leaf = make_page(workspace, project, create_user, "Leaf")

        url = self.get_sub_pages_url(workspace.slug, project.id, leaf.id)
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    @pytest.mark.django_db
    def test_sub_pages_unauthenticated(self, api_client, workspace, project, create_user):
        """Unauthenticated users cannot access the sub-pages endpoint"""
        root = make_page(workspace, project, create_user, "Root")

        url = self.get_sub_pages_url(workspace.slug, project.id, root.id)
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_root_list_excludes_children(self, session_client, workspace, project, create_user):
        """The pages list should keep returning only root pages"""
        root = make_page(workspace, project, create_user, "Root")
        child = make_page(workspace, project, create_user, "Child", parent=root)

        url = self.get_pages_url(workspace.slug, project.id)
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        page_ids = {page["id"] for page in response.json()}
        assert str(root.id) in page_ids
        assert str(child.id) not in page_ids


@pytest.mark.contract
class TestPageParentValidation(TestPageBase):
    """Test the parent validation on page partial update"""

    @pytest.mark.django_db
    def test_parent_cannot_be_self(self, session_client, workspace, project, create_user):
        """A page cannot be its own parent"""
        page = make_page(workspace, project, create_user, "Self Parent")

        url = self.get_page_detail_url(workspace.slug, project.id, page.id)
        response = session_client.patch(url, {"parent": str(page.id)}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        page.refresh_from_db()
        assert page.parent_id is None

    @pytest.mark.django_db
    def test_parent_cannot_be_descendant(self, session_client, workspace, project, create_user):
        """A page cannot be moved under one of its own descendants"""
        root = make_page(workspace, project, create_user, "Root")
        child = make_page(workspace, project, create_user, "Child", parent=root)
        grandchild = make_page(workspace, project, create_user, "Grandchild", parent=child)

        url = self.get_page_detail_url(workspace.slug, project.id, root.id)
        response = session_client.patch(url, {"parent": str(grandchild.id)}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        root.refresh_from_db()
        assert root.parent_id is None

    @pytest.mark.django_db
    def test_parent_cross_project_rejected(self, session_client, workspace, project, create_user):
        """The parent page must belong to the same project"""
        other_project = Project.objects.create(name="Other Project", identifier="OTH", workspace=workspace)
        ProjectMember.objects.create(project=other_project, member=create_user, role=20, is_active=True)

        page = make_page(workspace, project, create_user, "Page")
        other_page = make_page(workspace, other_project, create_user, "Other Page")

        url = self.get_page_detail_url(workspace.slug, project.id, page.id)
        response = session_client.patch(url, {"parent": str(other_page.id)}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        page.refresh_from_db()
        assert page.parent_id is None

    @pytest.mark.django_db
    def test_create_sub_page_with_parent(self, session_client, workspace, project, create_user):
        """A page can be created with a parent of the same project"""
        root = make_page(workspace, project, create_user, "Root")

        url = self.get_pages_url(workspace.slug, project.id)
        response = session_client.post(url, {"name": "Sub Page", "parent": str(root.id)}, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        sub_page = Page.objects.get(pk=response.json()["id"])
        assert sub_page.parent_id == root.id

    @pytest.mark.django_db
    def test_create_sub_page_cross_project_parent_rejected(self, session_client, workspace, project, create_user):
        """A page cannot be created with a parent from another project"""
        other_project = Project.objects.create(name="Other Create Project", identifier="OCP", workspace=workspace)
        ProjectMember.objects.create(project=other_project, member=create_user, role=20, is_active=True)
        other_page = make_page(workspace, other_project, create_user, "Other Page")

        url = self.get_pages_url(workspace.slug, project.id)
        response = session_client.post(url, {"name": "Sub Page", "parent": str(other_page.id)}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_valid_parent_update(self, session_client, workspace, project, create_user):
        """A page can be moved under a sibling of the same project"""
        root = make_page(workspace, project, create_user, "Root")
        sibling = make_page(workspace, project, create_user, "Sibling")

        url = self.get_page_detail_url(workspace.slug, project.id, sibling.id)
        response = session_client.patch(url, {"parent": str(root.id)}, format="json")

        assert response.status_code == status.HTTP_200_OK
        sibling.refresh_from_db()
        assert sibling.parent_id == root.id
