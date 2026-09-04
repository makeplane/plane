# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file in the repository root for details.

from unittest.mock import patch
from uuid import uuid4

import pytest
from django.urls import resolve
from rest_framework import status

from plane.db.models import Page, Project, ProjectMember, ProjectPage


def _project_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/"


@pytest.fixture
def page_project(workspace, create_user):
    project = Project.objects.create(
        name="Page API Project",
        identifier=f"P{uuid4().hex[:5].upper()}",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        workspace=workspace,
        project=project,
        member=create_user,
        role=20,
    )
    return project


@pytest.mark.contract
def test_page_v1_routes_are_registered():
    project_id = uuid4()
    page_id = uuid4()

    base = _project_url("workspace", project_id)
    urls = [
        f"{base}pages-summary/",
        f"{base}pages/",
        f"{base}pages/{page_id}/",
        f"{base}favorite-pages/{page_id}/",
        f"{base}pages/{page_id}/archive/",
        f"{base}pages/{page_id}/lock/",
        f"{base}pages/{page_id}/access/",
        f"{base}pages/{page_id}/description/",
        f"{base}pages/{page_id}/versions/",
        f"{base}pages/{page_id}/versions/{uuid4()}/",
        f"{base}pages/{page_id}/duplicate/",
    ]

    for url in urls:
        assert resolve(url).func.cls.__module__ == "plane.api.views.page"


@pytest.mark.contract
def test_page_v1_rejects_requests_without_api_key(api_client):
    url = f"{_project_url('workspace', uuid4())}pages/"

    response = api_client.get(url)

    assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.contract
@pytest.mark.django_db
def test_page_v1_accepts_api_key(api_key_client, workspace, page_project):
    project = page_project
    response = api_key_client.get(f"{_project_url(workspace.slug, project.id)}pages/")

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert payload["results"] == []
    assert payload["total_count"] == 0
    assert payload["next_page_results"] is False


@pytest.mark.contract
@pytest.mark.django_db
def test_existing_session_page_route_remains_available(session_client, workspace, page_project):
    url = f"/api/workspaces/{workspace.slug}/projects/{page_project.id}/pages/"

    response = session_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


@pytest.mark.contract
@pytest.mark.django_db
def test_page_v1_supports_create_list_and_put_update(api_key_client, workspace, page_project):
    pages_url = f"{_project_url(workspace.slug, page_project.id)}pages/"

    with patch("plane.app.views.page.base.page_transaction.delay"):
        create_response = api_key_client.post(
            pages_url,
            {"name": "API Page", "description_html": "<p>Initial body</p>"},
            format="json",
        )

    assert create_response.status_code == status.HTTP_201_CREATED, create_response.data
    page_id = create_response.data["id"]
    page = Page.objects.get(id=page_id)
    assert ProjectPage.objects.filter(project=page_project, page=page, deleted_at__isnull=True).exists()

    list_response = api_key_client.get(pages_url)
    assert list_response.status_code == status.HTTP_200_OK
    assert [result["id"] for result in list_response.json()["results"]] == [str(page_id)]

    with patch("plane.app.views.page.base.page_transaction.delay"):
        update_response = api_key_client.put(
            f"{pages_url}{page_id}/",
            {"name": "Updated API Page"},
            format="json",
        )

    assert update_response.status_code == status.HTTP_200_OK, update_response.data
    assert Page.objects.get(id=page_id).name == "Updated API Page"
