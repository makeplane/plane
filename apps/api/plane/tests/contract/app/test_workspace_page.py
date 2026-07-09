# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from unittest import mock
from uuid import uuid4
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Page,
    PageVersion,
    Project,
    ProjectMember,
    ProjectPage,
    User,
    UserFavorite,
    UserRecentVisit,
    WorkspaceMember,
)
from plane.utils.page_access import can_read_page

RECENT_VISIT_TARGET = "plane.app.views.page.workspace.recent_visited_task"


@pytest.fixture
def project(db, workspace, create_user):
    """Create a project with the test user as an administrator"""
    project = Project.objects.create(name="Wiki Project", identifier="WKP", workspace=workspace)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def member_user(db, workspace):
    """An active workspace member (role 15)"""
    user = User.objects.create(
        email=f"member-{uuid4().hex[:8]}@plane.so",
        username=f"member-{uuid4().hex[:12]}",
        first_name="Member",
        last_name="User",
    )
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15, is_active=True)
    return user


@pytest.fixture
def member_client(member_user):
    client = APIClient()
    client.force_authenticate(user=member_user)
    return client


@pytest.fixture
def guest_user(db, workspace):
    """An active workspace guest (role 5)"""
    user = User.objects.create(
        email=f"guest-{uuid4().hex[:8]}@plane.so",
        username=f"guest-{uuid4().hex[:12]}",
        first_name="Guest",
        last_name="User",
    )
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=5, is_active=True)
    return user


@pytest.fixture
def guest_client(guest_user):
    client = APIClient()
    client.force_authenticate(user=guest_user)
    return client


def make_wiki_page(workspace, owner, name, access=0, parent=None):
    """Create a workspace (wiki) page — is_global, no ProjectPage row"""
    return Page.objects.create(
        workspace=workspace, name=name, owned_by=owner, access=access, parent=parent, is_global=True
    )


def make_project_page(workspace, project, owner, name, access=0, parent=None):
    """Create a page linked to the given project"""
    page = Page.objects.create(workspace=workspace, name=name, owned_by=owner, access=access, parent=parent)
    ProjectPage.objects.create(workspace=workspace, project=project, page=page)
    return page


class TestWorkspacePageBase:
    def pages_url(self, slug):
        return f"/api/workspaces/{slug}/pages/"

    def detail_url(self, slug, page_id):
        return f"/api/workspaces/{slug}/pages/{page_id}/"

    def sub_pages_url(self, slug, page_id):
        return f"/api/workspaces/{slug}/pages/{page_id}/sub-pages/"

    def archive_url(self, slug, page_id):
        return f"/api/workspaces/{slug}/pages/{page_id}/archive/"

    def lock_url(self, slug, page_id):
        return f"/api/workspaces/{slug}/pages/{page_id}/lock/"

    def access_url(self, slug, page_id):
        return f"/api/workspaces/{slug}/pages/{page_id}/access/"

    def description_url(self, slug, page_id):
        return f"/api/workspaces/{slug}/pages/{page_id}/description/"

    def versions_url(self, slug, page_id, pk=None):
        base = f"/api/workspaces/{slug}/pages/{page_id}/versions/"
        return f"{base}{pk}/" if pk else base

    def duplicate_url(self, slug, page_id):
        return f"/api/workspaces/{slug}/pages/{page_id}/duplicate/"

    def favorite_url(self, slug, page_id):
        return f"/api/workspaces/{slug}/favorite-pages/{page_id}/"

    def summary_url(self, slug):
        return f"/api/workspaces/{slug}/pages-summary/"

    def project_pages_url(self, slug, project_id):
        return f"/api/workspaces/{slug}/projects/{project_id}/pages/"

    def project_detail_url(self, slug, project_id, page_id):
        return f"/api/workspaces/{slug}/projects/{project_id}/pages/{page_id}/"


@pytest.mark.contract
class TestWorkspacePageCRUD(TestWorkspacePageBase):
    """CRUD over workspace (wiki) pages"""

    @pytest.mark.django_db
    def test_create_workspace_page(self, session_client, workspace, create_user):
        """Creating a wiki page should force is_global and never create a ProjectPage"""
        response = session_client.post(self.pages_url(workspace.slug), {"name": "Wiki Root"}, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        page = Page.objects.get(pk=response.json()["id"])
        assert page.is_global is True
        assert page.owned_by_id == create_user.id
        assert ProjectPage.objects.filter(page=page).count() == 0

    @pytest.mark.django_db
    def test_create_forbidden_for_guest(self, guest_client, workspace):
        """Workspace guests are excluded from the wiki"""
        response = guest_client.post(self.pages_url(workspace.slug), {"name": "Nope"}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_list_returns_only_root_wiki_pages(self, session_client, workspace, project, create_user):
        """The wiki list should return root wiki pages only — no children, no project pages"""
        root = make_wiki_page(workspace, create_user, "Root")
        child = make_wiki_page(workspace, create_user, "Child", parent=root)
        project_page = make_project_page(workspace, project, create_user, "Project Page")

        response = session_client.get(self.pages_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        page_ids = {page["id"] for page in response.json()}
        assert page_ids == {str(root.id)}
        assert str(child.id) not in page_ids
        assert str(project_page.id) not in page_ids

    @pytest.mark.django_db
    def test_list_forbidden_for_guest(self, guest_client, workspace):
        """Workspace guests cannot list wiki pages"""
        response = guest_client.get(self.pages_url(workspace.slug))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_list_excludes_private_pages_of_others(self, session_client, workspace, member_user):
        """A private page must not appear in someone else's list"""
        private_page = make_wiki_page(workspace, member_user, "Secret", access=1)

        response = session_client.get(self.pages_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert str(private_page.id) not in {page["id"] for page in response.json()}

    @pytest.mark.django_db
    def test_retrieve_wiki_page_tracks_workspace_page_visit(self, session_client, workspace, create_user):
        """Retrieve should return the page and log a workspace_page recent visit"""
        page = make_wiki_page(workspace, create_user, "Readable")

        with mock.patch(RECENT_VISIT_TARGET) as recent_visit:
            response = session_client.get(self.detail_url(workspace.slug, page.id))

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["id"] == str(page.id)
        recent_visit.delay.assert_called_once()
        assert recent_visit.delay.call_args.kwargs["entity_name"] == "workspace_page"
        assert recent_visit.delay.call_args.kwargs["project_id"] is None

    @pytest.mark.django_db
    def test_retrieve_private_page_of_other_user_forbidden(self, member_client, workspace, create_user):
        """A private page is invisible to everyone but its owner"""
        private_page = make_wiki_page(workspace, create_user, "Secret", access=1)

        response = member_client.get(self.detail_url(workspace.slug, private_page.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_retrieve_forbidden_for_guest(self, guest_client, workspace, create_user):
        """Workspace guests cannot read any wiki page, even public ones"""
        page = make_wiki_page(workspace, create_user, "Public")

        response = guest_client.get(self.detail_url(workspace.slug, page.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_member_can_patch_public_page_of_other_user(self, member_client, workspace, create_user):
        """Members can edit someone else's public page"""
        page = make_wiki_page(workspace, create_user, "Shared Doc")

        response = member_client.patch(self.detail_url(workspace.slug, page.id), {"name": "Renamed"}, format="json")

        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.name == "Renamed"

    @pytest.mark.django_db
    def test_destroy_requires_archive_first(self, session_client, workspace, create_user):
        """A wiki page must be archived before deletion"""
        page = make_wiki_page(workspace, create_user, "Not Archived")

        response = session_client.delete(self.detail_url(workspace.slug, page.id))
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_member_cannot_destroy_page_of_other_user(self, member_client, session_client, workspace, create_user):
        """DELETE on someone else's page is reserved to workspace admins"""
        page = make_wiki_page(workspace, create_user, "Admin Owned")
        session_client.post(self.archive_url(workspace.slug, page.id))

        response = member_client.delete(self.detail_url(workspace.slug, page.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Page.objects.filter(pk=page.id).exists()

    @pytest.mark.django_db
    def test_admin_can_destroy_page_of_member(self, session_client, workspace, member_user):
        """Workspace admins can delete any wiki page"""
        page = make_wiki_page(workspace, member_user, "Member Owned")
        session_client.post(self.archive_url(workspace.slug, page.id))

        response = session_client.delete(self.detail_url(workspace.slug, page.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Page.objects.filter(pk=page.id).exists()


@pytest.mark.contract
class TestWorkspacePageContainerInvariant(TestWorkspacePageBase):
    """A page and its parent must live in the same container (wiki or project)"""

    @pytest.mark.django_db
    def test_create_wiki_page_with_project_page_parent_rejected(self, session_client, workspace, project, create_user):
        """A wiki page cannot be created under a project page"""
        project_page = make_project_page(workspace, project, create_user, "Project Parent")

        response = session_client.post(
            self.pages_url(workspace.slug), {"name": "Wiki Child", "parent": str(project_page.id)}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_patch_wiki_page_parent_to_project_page_rejected(self, session_client, workspace, project, create_user):
        """A wiki page cannot be moved under a project page"""
        wiki_page = make_wiki_page(workspace, create_user, "Wiki")
        project_page = make_project_page(workspace, project, create_user, "Project Parent")

        response = session_client.patch(
            self.detail_url(workspace.slug, wiki_page.id), {"parent": str(project_page.id)}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        wiki_page.refresh_from_db()
        assert wiki_page.parent_id is None

    @pytest.mark.django_db
    def test_create_project_page_with_wiki_parent_rejected(self, session_client, workspace, project, create_user):
        """A project page cannot be created under a wiki page"""
        wiki_page = make_wiki_page(workspace, create_user, "Wiki Parent")

        response = session_client.post(
            self.project_pages_url(workspace.slug, project.id),
            {"name": "Project Child", "parent": str(wiki_page.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_patch_project_page_parent_to_wiki_page_rejected(self, session_client, workspace, project, create_user):
        """A project page cannot be moved under a wiki page"""
        project_page = make_project_page(workspace, project, create_user, "Project Page")
        wiki_page = make_wiki_page(workspace, create_user, "Wiki Parent")

        response = session_client.patch(
            self.project_detail_url(workspace.slug, project.id, project_page.id),
            {"parent": str(wiki_page.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        project_page.refresh_from_db()
        assert project_page.parent_id is None

    @pytest.mark.django_db
    def test_create_wiki_sub_page_with_wiki_parent(self, session_client, workspace, create_user):
        """A wiki page can be created under another wiki page of the same workspace"""
        root = make_wiki_page(workspace, create_user, "Root")

        response = session_client.post(
            self.pages_url(workspace.slug), {"name": "Sub Page", "parent": str(root.id)}, format="json"
        )
        assert response.status_code == status.HTTP_201_CREATED
        sub_page = Page.objects.get(pk=response.json()["id"])
        assert sub_page.parent_id == root.id
        assert sub_page.is_global is True


@pytest.mark.contract
class TestWorkspacePageSubPagesAndArchive(TestWorkspacePageBase):
    """Nested wiki pages and the archive cascade"""

    @pytest.mark.django_db
    def test_sub_pages_returns_direct_children_only(self, session_client, workspace, create_user, member_user):
        """Sub-pages should return direct visible children only"""
        root = make_wiki_page(workspace, create_user, "Root")
        child_1 = make_wiki_page(workspace, create_user, "Child 1", parent=root)
        grandchild = make_wiki_page(workspace, create_user, "Grandchild", parent=child_1)
        private_child = make_wiki_page(workspace, member_user, "Private Child", access=1, parent=root)

        response = session_client.get(self.sub_pages_url(workspace.slug, root.id))

        assert response.status_code == status.HTTP_200_OK
        page_ids = {page["id"] for page in response.json()}
        assert page_ids == {str(child_1.id)}
        assert str(grandchild.id) not in page_ids
        assert str(private_child.id) not in page_ids

    @pytest.mark.django_db
    def test_archive_cascades_to_descendants(self, session_client, workspace, create_user):
        """Archiving a wiki page archives its whole subtree"""
        root = make_wiki_page(workspace, create_user, "Root")
        child = make_wiki_page(workspace, create_user, "Child", parent=root)

        response = session_client.post(self.archive_url(workspace.slug, root.id))

        assert response.status_code == status.HTTP_200_OK
        root.refresh_from_db()
        child.refresh_from_db()
        assert root.archived_at is not None
        assert child.archived_at is not None

    @pytest.mark.django_db
    def test_unarchive_cascades_to_descendants(self, session_client, workspace, create_user):
        """Unarchiving restores the whole subtree"""
        root = make_wiki_page(workspace, create_user, "Root")
        child = make_wiki_page(workspace, create_user, "Child", parent=root)
        session_client.post(self.archive_url(workspace.slug, root.id))

        response = session_client.delete(self.archive_url(workspace.slug, root.id))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        root.refresh_from_db()
        child.refresh_from_db()
        assert root.archived_at is None
        assert child.archived_at is None

    @pytest.mark.django_db
    def test_archive_cascade_never_touches_project_pages(self, session_client, workspace, project, create_user):
        """The recursive cascade stays inside the wiki container"""
        wiki_root = make_wiki_page(workspace, create_user, "Wiki Root")
        make_wiki_page(workspace, create_user, "Wiki Child", parent=wiki_root)
        project_root = make_project_page(workspace, project, create_user, "Project Root")
        project_child = make_project_page(workspace, project, create_user, "Project Child", parent=project_root)

        response = session_client.post(self.archive_url(workspace.slug, wiki_root.id))

        assert response.status_code == status.HTTP_200_OK
        project_root.refresh_from_db()
        project_child.refresh_from_db()
        assert project_root.archived_at is None
        assert project_child.archived_at is None

    @pytest.mark.django_db
    def test_member_cannot_archive_page_of_other_user(self, member_client, workspace, create_user):
        """Only the owner or an admin can archive a page"""
        page = make_wiki_page(workspace, create_user, "Admin Owned")

        response = member_client.post(self.archive_url(workspace.slug, page.id))
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        page.refresh_from_db()
        assert page.archived_at is None

    @pytest.mark.django_db
    def test_admin_can_archive_page_of_member(self, session_client, workspace, member_user):
        """Workspace admins can archive any wiki page"""
        page = make_wiki_page(workspace, member_user, "Member Owned")

        response = session_client.post(self.archive_url(workspace.slug, page.id))
        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.archived_at is not None


@pytest.mark.contract
class TestWorkspacePageLockAccess(TestWorkspacePageBase):
    """Lock/unlock and access level changes"""

    @pytest.mark.django_db
    def test_owner_can_lock_and_unlock(self, session_client, workspace, create_user):
        page = make_wiki_page(workspace, create_user, "Lockable")

        response = session_client.post(self.lock_url(workspace.slug, page.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        page.refresh_from_db()
        assert page.is_locked is True

        response = session_client.delete(self.lock_url(workspace.slug, page.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        page.refresh_from_db()
        assert page.is_locked is False

    @pytest.mark.django_db
    def test_member_cannot_lock_page_of_other_user(self, member_client, workspace, create_user):
        page = make_wiki_page(workspace, create_user, "Admin Owned")

        response = member_client.post(self.lock_url(workspace.slug, page.id))
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        page.refresh_from_db()
        assert page.is_locked is False

    @pytest.mark.django_db
    def test_owner_can_change_access(self, member_client, workspace, member_user):
        page = make_wiki_page(workspace, member_user, "Mine")

        response = member_client.post(self.access_url(workspace.slug, page.id), {"access": 1}, format="json")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        page.refresh_from_db()
        assert page.access == Page.PRIVATE_ACCESS

    @pytest.mark.django_db
    def test_member_cannot_change_access_of_other_user(self, member_client, workspace, create_user):
        page = make_wiki_page(workspace, create_user, "Admin Owned")

        response = member_client.post(self.access_url(workspace.slug, page.id), {"access": 1}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        page.refresh_from_db()
        assert page.access == Page.PUBLIC_ACCESS

    @pytest.mark.django_db
    def test_admin_can_change_access_of_member_page(self, session_client, workspace, member_user):
        page = make_wiki_page(workspace, member_user, "Member Owned")

        response = session_client.post(self.access_url(workspace.slug, page.id), {"access": 1}, format="json")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        page.refresh_from_db()
        assert page.access == Page.PRIVATE_ACCESS

    @pytest.mark.django_db
    def test_empty_body_does_not_flip_access(self, session_client, workspace, create_user):
        # an empty body must not silently turn a private page public (default-0 pitfall)
        page = make_wiki_page(workspace, create_user, "Private page", access=Page.PRIVATE_ACCESS)
        response = session_client.post(self.access_url(workspace.slug, page.id), {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        page.refresh_from_db()
        assert page.access == Page.PRIVATE_ACCESS

    @pytest.mark.django_db
    def test_invalid_access_value_rejected(self, session_client, workspace, create_user):
        page = make_wiki_page(workspace, create_user, "A page")
        response = session_client.post(self.access_url(workspace.slug, page.id), {"access": 42}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        page.refresh_from_db()
        assert page.access == Page.PUBLIC_ACCESS


@pytest.mark.contract
class TestWorkspacePageFavorites(TestWorkspacePageBase):
    """Favorites over wiki pages carry no project"""

    @pytest.mark.django_db
    def test_favorite_create_and_destroy(self, session_client, workspace, create_user):
        page = make_wiki_page(workspace, create_user, "Favorite Me")

        response = session_client.post(self.favorite_url(workspace.slug, page.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        favorite = UserFavorite.objects.get(entity_type="page", entity_identifier=page.id, user=create_user)
        assert favorite.project_id is None
        assert favorite.workspace_id == workspace.id

        response = session_client.delete(self.favorite_url(workspace.slug, page.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not UserFavorite.objects.filter(entity_type="page", entity_identifier=page.id).exists()

    @pytest.mark.django_db
    def test_favorite_project_page_via_workspace_route_rejected(self, session_client, workspace, project, create_user):
        """A project page cannot be favorited through the workspace wiki route"""
        project_page = make_project_page(workspace, project, create_user, "Project Page")

        response = session_client.post(self.favorite_url(workspace.slug, project_page.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.contract
class TestWorkspacePageVersions(TestWorkspacePageBase):
    """Page version history at the workspace level"""

    @pytest.mark.django_db
    def test_versions_list_and_detail(self, session_client, workspace, create_user):
        page = make_wiki_page(workspace, create_user, "Versioned")
        version = PageVersion.objects.create(workspace=workspace, page=page, owned_by=create_user)

        response = session_client.get(self.versions_url(workspace.slug, page.id))
        assert response.status_code == status.HTTP_200_OK
        assert {item["id"] for item in response.json()} == {str(version.id)}

        response = session_client.get(self.versions_url(workspace.slug, page.id, pk=version.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["id"] == str(version.id)

    @pytest.mark.django_db
    def test_version_of_project_page_not_reachable_via_workspace_route(
        self, session_client, workspace, project, create_user
    ):
        """Versions of a project page must never leak through the workspace routes"""
        project_page = make_project_page(workspace, project, create_user, "Project Page")
        version = PageVersion.objects.create(workspace=workspace, page=project_page, owned_by=create_user)

        response = session_client.get(self.versions_url(workspace.slug, project_page.id, pk=version.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.contract
class TestWorkspacePageDescription(TestWorkspacePageBase):
    """Binary description endpoint — the actual guard of the realtime editor"""

    @pytest.mark.django_db
    def test_description_get_streams_binary(self, session_client, workspace, create_user):
        page = make_wiki_page(workspace, create_user, "Binary")
        page.description_binary = b"\x01\x02\x03"
        page.save()

        response = session_client.get(self.description_url(workspace.slug, page.id))

        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "application/octet-stream"
        assert b"".join(response.streaming_content) == b"\x01\x02\x03"

    @pytest.mark.django_db
    def test_description_patch_updates_html(self, session_client, workspace, create_user):
        page = make_wiki_page(workspace, create_user, "Editable")

        response = session_client.patch(
            self.description_url(workspace.slug, page.id),
            {"description_html": "<p>updated</p>"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert "updated" in page.description_html

    @pytest.mark.django_db
    def test_description_patch_locked_page_rejected(self, session_client, workspace, create_user):
        page = make_wiki_page(workspace, create_user, "Locked")
        page.is_locked = True
        page.save()

        response = session_client.patch(
            self.description_url(workspace.slug, page.id),
            {"description_html": "<p>updated</p>"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_description_forbidden_for_guest(self, guest_client, workspace, create_user):
        page = make_wiki_page(workspace, create_user, "Public")

        response = guest_client.get(self.description_url(workspace.slug, page.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_description_private_page_hidden_from_other_member(self, member_client, workspace, create_user):
        private_page = make_wiki_page(workspace, create_user, "Secret", access=1)

        response = member_client.get(self.description_url(workspace.slug, private_page.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
class TestWorkspacePageDuplicate(TestWorkspacePageBase):
    """Duplication of wiki pages stays inside the workspace container"""

    @pytest.mark.django_db
    def test_duplicate_creates_wiki_copy_without_project_page(self, session_client, workspace, create_user):
        page = make_wiki_page(workspace, create_user, "Original")

        response = session_client.post(self.duplicate_url(workspace.slug, page.id))

        assert response.status_code == status.HTTP_201_CREATED
        copy = Page.objects.get(pk=response.json()["id"])
        assert copy.name == "Original (Copy)"
        assert copy.is_global is True
        assert copy.owned_by_id == create_user.id
        assert ProjectPage.objects.filter(page=copy).count() == 0

    @pytest.mark.django_db
    def test_duplicate_private_page_of_other_user_forbidden(self, member_client, workspace, create_user):
        private_page = make_wiki_page(workspace, create_user, "Secret", access=1)

        response = member_client.post(self.duplicate_url(workspace.slug, private_page.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
class TestWorkspaceProjectIsolation(TestWorkspacePageBase):
    """Wiki pages and project pages never leak into each other's routes"""

    @pytest.mark.django_db
    def test_wiki_page_never_in_project_list(self, session_client, workspace, project, create_user):
        wiki_page = make_wiki_page(workspace, create_user, "Wiki Page")
        project_page = make_project_page(workspace, project, create_user, "Project Page")

        response = session_client.get(self.project_pages_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        page_ids = {page["id"] for page in response.json()}
        assert str(project_page.id) in page_ids
        assert str(wiki_page.id) not in page_ids

    @pytest.mark.django_db
    def test_project_page_not_retrievable_via_workspace_route(self, session_client, workspace, project, create_user):
        project_page = make_project_page(workspace, project, create_user, "Project Page")

        response = session_client.get(self.detail_url(workspace.slug, project_page.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_wiki_page_not_retrievable_via_project_route(self, session_client, workspace, project, create_user):
        wiki_page = make_wiki_page(workspace, create_user, "Wiki Page")

        response = session_client.get(self.project_detail_url(workspace.slug, project.id, wiki_page.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.contract
class TestWorkspacePageSummary(TestWorkspacePageBase):
    @pytest.mark.django_db
    def test_summary_counts_visible_wiki_pages(self, session_client, workspace, create_user, member_user):
        make_wiki_page(workspace, create_user, "Public 1")
        make_wiki_page(workspace, create_user, "Public 2")
        make_wiki_page(workspace, create_user, "My Private", access=1)
        # invisible: private page of someone else
        make_wiki_page(workspace, member_user, "Their Private", access=1)
        archived = make_wiki_page(workspace, create_user, "Archived")
        session_client.post(self.archive_url(workspace.slug, archived.id))

        response = session_client.get(self.summary_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        stats = response.json()
        assert stats["public_pages"] == 2
        assert stats["private_pages"] == 1
        assert stats["archived_pages"] == 1


@pytest.mark.contract
class TestCanReadPageWiki:
    """Read access resolution for wiki pages (work-item-pages attachments)"""

    @pytest.mark.django_db
    def test_public_wiki_page_readable_by_workspace_member(self, workspace, create_user, member_user):
        page = make_wiki_page(workspace, create_user, "Public Wiki")
        assert can_read_page(member_user, page) is True

    @pytest.mark.django_db
    def test_public_wiki_page_not_readable_by_guest(self, workspace, create_user, guest_user):
        page = make_wiki_page(workspace, create_user, "Public Wiki")
        assert can_read_page(guest_user, page) is False

    @pytest.mark.django_db
    def test_private_wiki_page_owner_only(self, workspace, create_user, member_user):
        page = make_wiki_page(workspace, create_user, "Private Wiki", access=1)
        assert can_read_page(create_user, page) is True
        assert can_read_page(member_user, page) is False


@pytest.mark.contract
class TestRecentVisitsWhitelist:
    @pytest.mark.django_db
    def test_workspace_page_visits_are_listed(self, session_client, workspace, create_user):
        page = make_wiki_page(workspace, create_user, "Visited")
        UserRecentVisit.objects.create(
            workspace=workspace,
            user=create_user,
            entity_name="workspace_page",
            entity_identifier=page.id,
        )

        response = session_client.get(f"/api/workspaces/{workspace.slug}/recent-visits/")

        assert response.status_code == status.HTTP_200_OK
        entries = [item for item in response.json() if item["entity_name"] == "workspace_page"]
        assert len(entries) == 1
        assert entries[0]["entity_identifier"] == str(page.id)
        assert entries[0]["entity_data"]["name"] == "Visited"


@pytest.mark.contract
class TestWorkspacePagePatchGuards(TestWorkspacePageBase):
    """PATCH must not smuggle lock/archive state transitions (BK-1)."""

    @pytest.mark.django_db
    def test_member_cannot_lock_public_page_via_patch(self, member_client, workspace, create_user):
        page = make_wiki_page(workspace, create_user, "Public")  # owned by someone else, public
        response = member_client.patch(
            self.detail_url(workspace.slug, page.id), {"is_locked": True}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        page.refresh_from_db()
        assert page.is_locked is False

    @pytest.mark.django_db
    def test_member_cannot_archive_public_page_via_patch(self, member_client, workspace, create_user):
        page = make_wiki_page(workspace, create_user, "Public")
        response = member_client.patch(
            self.detail_url(workspace.slug, page.id), {"archived_at": "2020-01-01"}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        page.refresh_from_db()
        assert page.archived_at is None

    @pytest.mark.django_db
    def test_owner_can_still_rename_via_patch(self, session_client, workspace, create_user):
        page = make_wiki_page(workspace, create_user, "Old name")
        response = session_client.patch(
            self.detail_url(workspace.slug, page.id), {"name": "New name"}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.name == "New name"


@pytest.mark.contract
class TestWorkspacePageAccessRecentVisitCleanup(TestWorkspacePageBase):
    """Flipping a page to private purges other users' recent-visit rows (BK-2)."""

    @pytest.mark.django_db
    def test_private_flip_purges_other_users_recent_visits(self, session_client, workspace, create_user, member_user):
        page = make_wiki_page(workspace, create_user, "Public", access=0)
        # a visit recorded by another member
        UserRecentVisit.objects.create(
            workspace=workspace,
            user=member_user,
            entity_name="workspace_page",
            entity_identifier=str(page.id),
        )
        # a visit by the owner themselves
        UserRecentVisit.objects.create(
            workspace=workspace,
            user=create_user,
            entity_name="workspace_page",
            entity_identifier=str(page.id),
        )
        response = session_client.post(self.access_url(workspace.slug, page.id), {"access": 1}, format="json")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        # the other member's visit is gone; the owner's is kept
        assert not UserRecentVisit.objects.filter(
            entity_identifier=str(page.id), user=member_user
        ).exists()
        assert UserRecentVisit.objects.filter(entity_identifier=str(page.id), user=create_user).exists()
