# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status
from rest_framework.test import APIClient
from uuid import uuid4

from plane.db.models import (
    Page,
    Project,
    ProjectMember,
    ProjectPage,
    User,
    Workspace,
    WorkspaceMember,
)
from plane.db.models.api import APIToken


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Pages V1 Project",
        identifier="PV1",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


def api_client_for(user, token_value):
    token = APIToken.objects.create(user=user, label="Token", token=token_value)
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


@pytest.fixture
def member_user(db, workspace):
    user = User.objects.create(
        email=f"member-v1-{uuid4().hex[:8]}@plane.so",
        username=f"member-v1-{uuid4().hex[:12]}",
        first_name="Member",
        last_name="User",
    )
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15, is_active=True)
    return user


@pytest.fixture
def member_api_client(member_user):
    return api_client_for(member_user, f"member-v1-token-{uuid4().hex[:12]}")


@pytest.fixture
def guest_user(db, workspace):
    user = User.objects.create(
        email=f"guest-v1-{uuid4().hex[:8]}@plane.so",
        username=f"guest-v1-{uuid4().hex[:12]}",
        first_name="Guest",
        last_name="User",
    )
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=5, is_active=True)
    return user


@pytest.fixture
def guest_api_client(guest_user):
    return api_client_for(guest_user, f"guest-v1-token-{uuid4().hex[:12]}")


def make_wiki_page(workspace, owner, name, access=0, archived_at=None):
    page = Page.objects.create(workspace=workspace, name=name, owned_by=owner, access=access, is_global=True)
    if archived_at:
        page.archived_at = archived_at
        page.save()
    return page


def make_project_page(workspace, project, owner, name, access=0):
    page = Page.objects.create(workspace=workspace, name=name, owned_by=owner, access=access)
    ProjectPage.objects.create(workspace=workspace, project=project, page=page)
    return page


def workspace_pages_url(slug):
    return f"/api/v1/workspaces/{slug}/pages/"


def workspace_page_detail_url(slug, page_id):
    return f"/api/v1/workspaces/{slug}/pages/{page_id}/"


def project_pages_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/"


def project_page_detail_url(slug, project_id, page_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/"


@pytest.mark.contract
class TestWorkspacePagesV1List:
    @pytest.mark.django_db
    def test_list_returns_paginated_envelope(self, api_key_client, workspace, create_user):
        make_wiki_page(workspace, create_user, "Page A")
        make_wiki_page(workspace, create_user, "Page B")

        response = api_key_client.get(workspace_pages_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total_count"] == 2
        assert "next_cursor" in data
        assert "prev_cursor" in data
        assert len(data["results"]) == 2

    @pytest.mark.django_db
    def test_list_excludes_project_pages_and_private_pages_of_others(
        self, api_key_client, workspace, project, create_user, member_user
    ):
        wiki_page = make_wiki_page(workspace, create_user, "Wiki")
        project_page = make_project_page(workspace, project, create_user, "Project Page")
        private_page = make_wiki_page(workspace, member_user, "Their Secret", access=1)

        response = api_key_client.get(workspace_pages_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        page_ids = {item["id"] for item in response.json()["results"]}
        assert page_ids == {str(wiki_page.id)}
        assert str(project_page.id) not in page_ids
        assert str(private_page.id) not in page_ids

    @pytest.mark.django_db
    def test_list_type_filters(self, api_key_client, workspace, create_user):
        from django.utils import timezone

        public_page = make_wiki_page(workspace, create_user, "Public")
        private_page = make_wiki_page(workspace, create_user, "Private", access=1)
        archived_page = make_wiki_page(workspace, create_user, "Archived", archived_at=timezone.now().date())

        url = workspace_pages_url(workspace.slug)

        response = api_key_client.get(url, {"type": "public"})
        assert {item["id"] for item in response.json()["results"]} == {str(public_page.id)}

        response = api_key_client.get(url, {"type": "private"})
        assert {item["id"] for item in response.json()["results"]} == {str(private_page.id)}

        response = api_key_client.get(url, {"type": "archived"})
        assert {item["id"] for item in response.json()["results"]} == {str(archived_page.id)}

    @pytest.mark.django_db
    def test_list_type_shared_is_empty_in_ce(self, api_key_client, workspace, create_user):
        make_wiki_page(workspace, create_user, "Public")

        response = api_key_client.get(workspace_pages_url(workspace.slug), {"type": "shared"})

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["results"] == []

    @pytest.mark.django_db
    def test_list_invalid_type_rejected(self, api_key_client, workspace):
        response = api_key_client.get(workspace_pages_url(workspace.slug), {"type": "bogus"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_list_search_filters_by_name(self, api_key_client, workspace, create_user):
        roadmap = make_wiki_page(workspace, create_user, "Roadmap 2026")
        make_wiki_page(workspace, create_user, "Meeting notes")

        response = api_key_client.get(workspace_pages_url(workspace.slug), {"search": "roadmap"})

        assert response.status_code == status.HTTP_200_OK
        assert {item["id"] for item in response.json()["results"]} == {str(roadmap.id)}

    @pytest.mark.django_db
    def test_list_per_page_cannot_exceed_max(self, api_key_client, workspace, create_user):
        make_wiki_page(workspace, create_user, "Page")
        response = api_key_client.get(workspace_pages_url(workspace.slug), {"per_page": 101})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_list_forbidden_for_guest(self, guest_api_client, workspace, create_user):
        make_wiki_page(workspace, create_user, "Public")
        response = guest_api_client.get(workspace_pages_url(workspace.slug))
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
class TestWorkspacePagesV1Create:
    @pytest.mark.django_db
    def test_create_workspace_page(self, api_key_client, workspace, create_user):
        response = api_key_client.post(
            workspace_pages_url(workspace.slug),
            {"name": "API Wiki Page", "description_html": "<p>hello</p>", "access": 1, "color": "#ff0000"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        page = Page.objects.get(pk=response.json()["id"])
        assert page.is_global is True
        assert page.owned_by_id == create_user.id
        assert page.access == Page.PRIVATE_ACCESS
        assert ProjectPage.objects.filter(page=page).count() == 0

    @pytest.mark.django_db
    def test_create_requires_name(self, api_key_client, workspace):
        response = api_key_client.post(workspace_pages_url(workspace.slug), {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "name" in response.json()

    @pytest.mark.django_db
    def test_create_forbidden_for_guest(self, guest_api_client, workspace):
        response = guest_api_client.post(workspace_pages_url(workspace.slug), {"name": "Nope"}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
class TestWorkspacePagesV1Detail:
    @pytest.mark.django_db
    def test_retrieve_workspace_page(self, api_key_client, workspace, create_user):
        page = make_wiki_page(workspace, create_user, "Readable")

        response = api_key_client.get(workspace_page_detail_url(workspace.slug, page.id))

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == str(page.id)
        assert data["is_global"] is True
        assert data["project_ids"] == []

    @pytest.mark.django_db
    def test_retrieve_cross_workspace_page_is_404(self, api_key_client, workspace, create_user):
        other_workspace = Workspace.objects.create(name="Other", slug="other-workspace-v1", owner=create_user)
        WorkspaceMember.objects.create(workspace=other_workspace, member=create_user, role=20)
        foreign_page = make_wiki_page(other_workspace, create_user, "Foreign")

        response = api_key_client.get(workspace_page_detail_url(workspace.slug, foreign_page.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_retrieve_nonexistent_page_is_404(self, api_key_client, workspace):
        response = api_key_client.get(workspace_page_detail_url(workspace.slug, uuid4()))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_delete_own_page(self, member_api_client, workspace, member_user):
        page = make_wiki_page(workspace, member_user, "Mine")

        response = member_api_client.delete(workspace_page_detail_url(workspace.slug, page.id))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Page.objects.filter(pk=page.id).exists()

    @pytest.mark.django_db
    def test_member_cannot_delete_page_of_other_user(self, member_api_client, workspace, create_user):
        page = make_wiki_page(workspace, create_user, "Admin Owned")

        response = member_api_client.delete(workspace_page_detail_url(workspace.slug, page.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Page.objects.filter(pk=page.id).exists()

    @pytest.mark.django_db
    def test_admin_can_delete_page_of_member(self, api_key_client, workspace, member_user):
        page = make_wiki_page(workspace, member_user, "Member Owned")

        response = api_key_client.delete(workspace_page_detail_url(workspace.slug, page.id))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Page.objects.filter(pk=page.id).exists()


@pytest.mark.contract
class TestProjectPagesV1:
    @pytest.mark.django_db
    def test_list_project_pages_excludes_wiki_pages(self, api_key_client, workspace, project, create_user):
        project_page = make_project_page(workspace, project, create_user, "Project Page")
        wiki_page = make_wiki_page(workspace, create_user, "Wiki Page")

        response = api_key_client.get(project_pages_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        page_ids = {item["id"] for item in response.json()["results"]}
        assert page_ids == {str(project_page.id)}
        assert str(wiki_page.id) not in page_ids

    @pytest.mark.django_db
    def test_create_project_page(self, api_key_client, workspace, project, create_user):
        response = api_key_client.post(
            project_pages_url(workspace.slug, project.id), {"name": "API Project Page"}, format="json"
        )

        assert response.status_code == status.HTTP_201_CREATED
        page = Page.objects.get(pk=response.json()["id"])
        assert page.is_global is False
        assert page.owned_by_id == create_user.id
        assert ProjectPage.objects.filter(page=page, project=project).count() == 1

    @pytest.mark.django_db
    def test_retrieve_project_page(self, api_key_client, workspace, project, create_user):
        page = make_project_page(workspace, project, create_user, "Readable")

        response = api_key_client.get(project_page_detail_url(workspace.slug, project.id, page.id))

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == str(page.id)
        assert data["project_ids"] == [str(project.id)]

    @pytest.mark.django_db
    def test_private_project_page_of_other_user_hidden(self, api_key_client, workspace, project, create_user):
        other = User.objects.create(
            email=f"other-v1-{uuid4().hex[:8]}@plane.so", username=f"other-v1-{uuid4().hex[:12]}"
        )
        ProjectMember.objects.create(project=project, member=other, role=15, is_active=True)
        private_page = make_project_page(workspace, project, other, "Their Secret", access=1)

        response = api_key_client.get(project_page_detail_url(workspace.slug, project.id, private_page.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND

        response = api_key_client.get(project_pages_url(workspace.slug, project.id))
        assert str(private_page.id) not in {item["id"] for item in response.json()["results"]}

    @pytest.mark.django_db
    def test_delete_project_page_owner_or_admin_only(self, api_key_client, workspace, project, create_user):
        other = User.objects.create(
            email=f"other-owner-v1-{uuid4().hex[:8]}@plane.so", username=f"other-owner-v1-{uuid4().hex[:12]}"
        )
        ProjectMember.objects.create(project=project, member=other, role=15, is_active=True)
        page = make_project_page(workspace, project, other, "Their Page")

        # requester (project admin) can delete someone else's page
        response = api_key_client.delete(project_page_detail_url(workspace.slug, project.id, page.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Page.objects.filter(pk=page.id).exists()

    @pytest.mark.django_db
    def test_non_admin_member_cannot_delete_page_of_other_user(self, workspace, project, create_user, member_user):
        ProjectMember.objects.create(project=project, member=member_user, role=15, is_active=True)
        member_client = api_client_for(member_user, "member-project-v1-token")
        page = make_project_page(workspace, project, create_user, "Admin Owned")

        response = member_client.delete(project_page_detail_url(workspace.slug, project.id, page.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Page.objects.filter(pk=page.id).exists()
