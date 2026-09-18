# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the modules-lite endpoint.

GET /api/v1/workspaces/<slug>/projects/<project_id>/modules-lite/
"""

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import Module, Project, ProjectMember


def _url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/modules-lite/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Module Lite Project",
        identifier="MDL",
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
    active = Module.objects.create(name="Active Module", project=project, workspace=project.workspace)
    archived = Module.objects.create(
        name="Archived Module",
        project=project,
        workspace=project.workspace,
        archived_at=timezone.now(),
    )
    return {"active": active, "archived": archived}


@pytest.mark.contract
class TestModulesLite:
    @pytest.mark.django_db
    def test_paginated_and_excludes_archived(self, api_key_client, workspace, project, modules):
        response = api_key_client.get(_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        names = {item["name"] for item in response.data["results"]}
        assert "Active Module" in names
        assert "Archived Module" not in names
