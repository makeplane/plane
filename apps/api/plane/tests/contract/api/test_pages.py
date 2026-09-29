# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Page, Project, ProjectMember, ProjectPage, User
from plane.db.models.api import APIToken


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Project Pages API",
        identifier="PPA",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,
        is_active=True,
    )
    return project


@pytest.fixture
def project_page(db, workspace, project, create_user):
    page = Page.objects.create(
        name="Public API page",
        workspace=workspace,
        owned_by=create_user,
        access=Page.PUBLIC_ACCESS,
    )
    ProjectPage.objects.create(project=project, page=page, workspace=workspace)
    return page


@pytest.fixture
def other_user(db):
    username = f"other-{uuid4().hex}"
    return User.objects.create(
        username=username,
        email=f"{username}@plane.so",
        first_name="Other",
        last_name="User",
    )


@pytest.mark.contract
class TestProjectPagesListAPIEndpoint:
    def get_url(self, workspace_slug, project_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/pages/"

    @pytest.mark.django_db
    def test_list_pages_returns_visible_project_page(self, api_key_client, workspace, project, project_page):
        response = api_key_client.get(self.get_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert len(response.data["results"]) == 1
        result = response.data["results"][0]
        assert result["id"] == project_page.id
        assert result["name"] == "Public API page"
        assert result["access"] == Page.PUBLIC_ACCESS
        assert result["color"] == ""

    @pytest.mark.django_db
    def test_list_pages_excludes_page_linked_only_to_another_project(
        self, api_key_client, workspace, project, create_user
    ):
        other_project = Project.objects.create(
            name="Other Project",
            identifier="OTP",
            workspace=workspace,
            created_by=create_user,
        )
        other_page = Page.objects.create(
            name="Other project page",
            workspace=workspace,
            owned_by=create_user,
            access=Page.PUBLIC_ACCESS,
        )
        ProjectPage.objects.create(project=other_project, page=other_page, workspace=workspace)

        response = api_key_client.get(self.get_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["results"] == []

    @pytest.mark.django_db
    def test_list_pages_excludes_soft_deleted_project_link(
        self, api_key_client, workspace, project, create_user
    ):
        page = Page.objects.create(
            name="Removed page",
            workspace=workspace,
            owned_by=create_user,
            access=Page.PUBLIC_ACCESS,
        )
        project_page = ProjectPage.objects.create(project=project, page=page, workspace=workspace)
        project_page.deleted_at = timezone.now()
        project_page.save(update_fields=["deleted_at"])

        response = api_key_client.get(self.get_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["results"] == []

    @pytest.mark.django_db
    def test_list_pages_hides_private_page_owned_by_another_user(
        self, api_key_client, workspace, project, other_user
    ):
        page = Page.objects.create(
            name="Private page",
            workspace=workspace,
            owned_by=other_user,
            access=Page.PRIVATE_ACCESS,
        )
        ProjectPage.objects.create(project=project, page=page, workspace=workspace)

        response = api_key_client.get(self.get_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["results"] == []

    @pytest.mark.django_db
    def test_list_pages_excludes_archived_page(self, api_key_client, workspace, project, create_user):
        page = Page.objects.create(
            name="Archived page",
            workspace=workspace,
            owned_by=create_user,
            access=Page.PUBLIC_ACCESS,
            archived_at=timezone.now(),
        )
        ProjectPage.objects.create(project=project, page=page, workspace=workspace)

        response = api_key_client.get(self.get_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["results"] == []

    @pytest.mark.django_db
    def test_list_response_does_not_leak_page_content_or_ui_state(
        self, api_key_client, workspace, project, create_user
    ):
        page = Page.objects.create(
            name="Metadata only",
            workspace=workspace,
            owned_by=create_user,
            access=Page.PUBLIC_ACCESS,
            description_html="<p>private body</p>",
        )
        ProjectPage.objects.create(project=project, page=page, workspace=workspace)

        response = api_key_client.get(
            self.get_url(workspace.slug, project.id) + "?fields=description_html,favorites"
        )

        assert response.status_code == status.HTTP_200_OK
        result = response.data["results"][0]
        assert "description_html" not in result
        assert "description_binary" not in result
        assert "favorite" not in result
        assert "recent_visit" not in result

    @pytest.mark.django_db
    def test_list_pages_requires_api_key(self, api_client, workspace, project):
        response = api_client.get(self.get_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    @pytest.mark.parametrize("token_kwargs", [{"is_active": False}, {"expired_at": timezone.now() - timedelta(minutes=1)}])
    def test_list_pages_rejects_revoked_or_expired_api_key(
        self, workspace, project, create_user, token_kwargs
    ):
        token = APIToken.objects.create(user=create_user, label="Invalid API Token", **token_kwargs)
        client = APIClient()
        client.credentials(HTTP_X_API_KEY=token.token)

        response = client.get(self.get_url(workspace.slug, project.id))

        # Plane's shared API-key authenticator rejects supplied invalid keys as
        # forbidden; a missing key remains unauthenticated (401) above.
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_list_pages_requires_active_project_membership(self, workspace, project, other_user):
        token = APIToken.objects.create(user=other_user, label="Other API Token")
        client = APIClient()
        client.credentials(HTTP_X_API_KEY=token.token)

        response = client.get(self.get_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_list_pages_rejects_inactive_project_membership(
        self, workspace, project, other_user
    ):
        ProjectMember.objects.create(
            project=project,
            workspace=workspace,
            member=other_user,
            role=20,
            is_active=False,
        )
        token = APIToken.objects.create(user=other_user, label="Inactive Member API Token")
        client = APIClient()
        client.credentials(HTTP_X_API_KEY=token.token)

        response = client.get(self.get_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_create_page_persists_and_is_listed_for_the_api_key_member(
        self, api_key_client, workspace, project, create_user
    ):
        create_response = api_key_client.post(
            self.get_url(workspace.slug, project.id),
            {"name": "Created through public API", "access": Page.PUBLIC_ACCESS, "color": "#123456"},
            format="json",
        )

        assert create_response.status_code == status.HTTP_201_CREATED
        page_id = create_response.data["id"]
        page = Page.objects.get(id=page_id)
        assert page.name == "Created through public API"
        assert page.owned_by_id == create_user.id
        assert page.workspace_id == workspace.id
        assert ProjectPage.objects.filter(project=project, page=page, deleted_at__isnull=True).exists()

        list_response = api_key_client.get(self.get_url(workspace.slug, project.id))

        assert list_response.status_code == status.HTTP_200_OK
        assert [result["id"] for result in list_response.data["results"]] == [page.id]

    @pytest.mark.django_db
    def test_create_page_rejects_guest(self, api_key_client, workspace, project, create_user):
        ProjectMember.objects.filter(project=project, member=create_user).update(role=5)

        response = api_key_client.post(
            self.get_url(workspace.slug, project.id), {"name": "Guest page"}, format="json"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not Page.objects.filter(name="Guest page", workspace=workspace).exists()

    @pytest.mark.django_db
    def test_create_page_rejects_empty_name(self, api_key_client, workspace, project):
        response = api_key_client.post(
            self.get_url(workspace.slug, project.id),
            {"name": ""},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "name" in response.data

    @pytest.mark.django_db
    def test_create_page_rejects_server_owned_fields(
        self, api_key_client, workspace, project, other_user
    ):
        response = api_key_client.post(
            self.get_url(workspace.slug, project.id),
            {"name": "Attempted override", "owned_by": str(other_user.id), "project_ids": [str(project.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "owned_by" in response.data
        assert "project_ids" in response.data
        assert not Page.objects.filter(workspace=workspace).exists()

    @pytest.mark.django_db
    def test_create_page_rejects_cross_project_and_lifecycle_injection(
        self, api_key_client, workspace, project, create_user
    ):
        other_project = Project.objects.create(
            name="Other Project",
            identifier="OTH",
            workspace=workspace,
            created_by=create_user,
        )
        parent = Page.objects.create(
            name="Other project parent",
            workspace=workspace,
            owned_by=create_user,
            access=Page.PUBLIC_ACCESS,
        )
        ProjectPage.objects.create(project=other_project, page=parent, workspace=workspace)

        response = api_key_client.post(
            self.get_url(workspace.slug, project.id),
            {
                "name": "Injected relation",
                "parent": str(parent.id),
                "project_ids": [str(other_project.id)],
                "is_locked": True,
                "archived_at": timezone.now().isoformat(),
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert set(response.data) == {"archived_at", "is_locked", "parent", "project_ids"}
        assert not Page.objects.filter(name="Injected relation", workspace=workspace).exists()

    @pytest.mark.django_db
    def test_collection_rejects_out_of_scope_mutation_methods(self, api_key_client, workspace, project):
        response = api_key_client.patch(
            self.get_url(workspace.slug, project.id), {"name": "Not supported"}, format="json"
        )

        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    @pytest.mark.django_db
    def test_create_page_sanitizes_description_html(self, api_key_client, workspace, project):
        response = api_key_client.post(
            self.get_url(workspace.slug, project.id),
            {"name": "Sanitized page", "description_html": "<script>alert('x')</script><p>safe</p>"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        page = Page.objects.get(id=response.data["id"])
        assert "<script" not in page.description_html.lower()
        assert "safe" in page.description_html
