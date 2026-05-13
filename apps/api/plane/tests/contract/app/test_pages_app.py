# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.db.models import Page, Project, ProjectMember, ProjectPage


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Pages Project",
        identifier="PGS",
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
def project_pages(db, workspace, project, create_user):
    page_low = Page.objects.create(
        workspace=workspace,
        owned_by=create_user,
        name="Low",
        access=Page.PUBLIC_ACCESS,
        sort_order=100,
    )
    page_mid = Page.objects.create(
        workspace=workspace,
        owned_by=create_user,
        name="Mid",
        access=Page.PUBLIC_ACCESS,
        sort_order=150,
    )
    page_high = Page.objects.create(
        workspace=workspace,
        owned_by=create_user,
        name="High",
        access=Page.PUBLIC_ACCESS,
        sort_order=200,
    )

    for page in [page_low, page_mid, page_high]:
        ProjectPage.objects.create(
            project=project,
            page=page,
            workspace=workspace,
            created_by=create_user,
        )

    return {"low": page_low, "mid": page_mid, "high": page_high}


@pytest.mark.contract
class TestProjectPagesAPI:
    def get_pages_url(self, workspace_slug: str, project_id: str) -> str:
        return f"/api/workspaces/{workspace_slug}/projects/{project_id}/pages/"

    def get_page_url(self, workspace_slug: str, project_id: str, page_id: str) -> str:
        return f"/api/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/"

    @pytest.mark.django_db
    def test_list_pages_sorted_by_sort_order_desc(self, session_client, workspace, project, project_pages):
        url = self.get_pages_url(workspace.slug, project.id)
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert [row["id"] for row in data] == [
            str(project_pages["high"].id),
            str(project_pages["mid"].id),
            str(project_pages["low"].id),
        ]
        assert all("sort_order" in row for row in data)

    @pytest.mark.django_db
    def test_patch_sort_order_updates_page(self, session_client, workspace, project, project_pages):
        page = project_pages["mid"]
        url = self.get_page_url(workspace.slug, project.id, page.id)
        response = session_client.patch(url, {"sort_order": 250}, format="json")

        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.sort_order == 250
        assert response.json()["sort_order"] == 250

    @pytest.mark.django_db
    def test_patch_sort_order_allowed_when_page_is_locked(self, session_client, workspace, project, project_pages):
        page = project_pages["low"]
        page.is_locked = True
        page.save()

        url = self.get_page_url(workspace.slug, project.id, page.id)
        response = session_client.patch(url, {"sort_order": 175}, format="json")

        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.sort_order == 175

    @pytest.mark.django_db
    def test_patch_non_sort_field_blocked_when_page_is_locked(self, session_client, workspace, project, project_pages):
        page = project_pages["high"]
        page.is_locked = True
        page.save()

        url = self.get_page_url(workspace.slug, project.id, page.id)
        response = session_client.patch(url, {"name": "Renamed while locked"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["error"] == "Page is locked"

        page.refresh_from_db()
        assert page.name == "High"
