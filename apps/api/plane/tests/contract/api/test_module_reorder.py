# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for public module reordering via the API."""

import pytest
from rest_framework import status

from plane.db.models import Module, Project, ProjectMember


def _url(slug, project_id, module_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/modules/{module_id}/"


def _lite_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/modules-lite/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Module Reorder Project",
        identifier="MRO",
        workspace=workspace,
        created_by=create_user,
        module_view=True,
    )
    ProjectMember.objects.create(
        workspace=workspace,
        project=project,
        member=create_user,
        role=20,
        is_active=True,
    )
    return project


@pytest.fixture
def modules(db, project):
    return [
        Module.objects.create(
            name="First Module",
            project=project,
            workspace=project.workspace,
            sort_order=100.0,
        ),
        Module.objects.create(
            name="Second Module",
            project=project,
            workspace=project.workspace,
            sort_order=200.0,
        ),
    ]


@pytest.mark.contract
class TestModuleReorderAPI:
    @pytest.mark.django_db
    def test_update_persists_sort_order(self, api_key_client, workspace, project, modules):
        module = modules[0]
        new_sort_order = 15535.0

        response = api_key_client.patch(
            _url(workspace.slug, project.id, module.id),
            {"sort_order": new_sort_order},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["sort_order"] == new_sort_order

        module.refresh_from_db()
        assert module.sort_order == new_sort_order

    @pytest.mark.django_db
    def test_update_sort_order_changes_manual_list_order(self, api_key_client, workspace, project, modules):
        first_module, second_module = modules

        response = api_key_client.patch(
            _url(workspace.slug, project.id, first_module.id),
            {"sort_order": 300.0},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK

        list_response = api_key_client.get(f"{_lite_url(workspace.slug, project.id)}?order_by=sort_order")

        assert list_response.status_code == status.HTTP_200_OK
        assert [item["id"] for item in list_response.data["results"]] == [
            str(second_module.id),
            str(first_module.id),
        ]
