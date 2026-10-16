# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for `logo_props` on the v1 module endpoints.

POST  /api/v1/workspaces/<slug>/projects/<project_id>/modules/
PATCH /api/v1/workspaces/<slug>/projects/<project_id>/modules/<pk>/
"""

from unittest import mock

import pytest
from rest_framework import status

from plane.db.models import Module, Project, ProjectMember

EMOJI_LOGO = {"in_use": "emoji", "emoji": {"value": "128640"}}
ICON_LOGO = {"in_use": "icon", "icon": {"name": "Rocket", "color": "#5e6ad2"}}
IMAGE_LOGO = {"in_use": "image", "image": {"url": "https://cdn.example.com/client-a.png"}}


def _list_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/modules/"


def _detail_url(slug, project_id, module_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/modules/{module_id}/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Module Logo Project",
        identifier="MLP",
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


@pytest.mark.contract
class TestModuleLogoProps:
    @pytest.mark.django_db
    @pytest.mark.parametrize("logo_props", [EMOJI_LOGO, ICON_LOGO, IMAGE_LOGO], ids=["emoji", "icon", "image"])
    def test_create_module_with_logo_props(self, api_key_client, workspace, project, logo_props):
        with mock.patch("plane.api.views.module.model_activity"):
            response = api_key_client.post(
                _list_url(workspace.slug, project.id),
                {"name": "Client A", "logo_props": logo_props},
                format="json",
            )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["logo_props"] == logo_props
        assert Module.objects.get(pk=response.data["id"]).logo_props == logo_props

    @pytest.mark.django_db
    def test_create_module_without_logo_props_defaults_to_empty(self, api_key_client, workspace, project):
        with mock.patch("plane.api.views.module.model_activity"):
            response = api_key_client.post(
                _list_url(workspace.slug, project.id),
                {"name": "No Logo"},
                format="json",
            )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["logo_props"] == {}

    @pytest.mark.django_db
    def test_update_module_logo_props(self, api_key_client, workspace, project):
        module = Module.objects.create(
            name="Client B",
            project=project,
            workspace=workspace,
            logo_props=EMOJI_LOGO,
        )

        with mock.patch("plane.api.views.module.model_activity"):
            response = api_key_client.patch(
                _detail_url(workspace.slug, project.id, module.id),
                {"logo_props": ICON_LOGO},
                format="json",
            )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["logo_props"] == ICON_LOGO
        module.refresh_from_db()
        assert module.logo_props == ICON_LOGO
        # Fields not sent in the PATCH are left untouched.
        assert module.name == "Client B"
