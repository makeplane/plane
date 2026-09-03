# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file in the repository root for details.

from uuid import uuid4

import pytest
from django.urls import resolve
from rest_framework import status

from plane.db.models import Project, ProjectMember


def _project_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/"


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
        assert resolve(url).func.view_class.__module__ == "plane.api.views.page"


@pytest.mark.contract
@pytest.mark.django_db
def test_page_v1_rejects_requests_without_api_key(api_client):
    url = f"{_project_url('workspace', uuid4())}pages/"

    response = api_client.get(url)

    assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.contract
@pytest.mark.django_db
def test_page_v1_accepts_api_key(api_key_client, workspace, create_user):
    project = Project.objects.create(
        name="Page API Project",
        identifier="PAPI",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        workspace=workspace,
        project=project,
        member=create_user,
        role=20,
    )

    response = api_key_client.get(f"{_project_url(workspace.slug, project.id)}pages/")

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert payload["results"] == []
    assert payload["total_count"] == 0
    assert payload["next_page_results"] is False
