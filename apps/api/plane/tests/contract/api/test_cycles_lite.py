# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the cycles-lite endpoint.

GET /api/v1/workspaces/<slug>/projects/<project_id>/cycles-lite/
"""

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import Cycle, Project, ProjectMember


def _url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/cycles-lite/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Cycle Lite Project",
        identifier="CLP",
        workspace=workspace,
        created_by=create_user,
        cycle_view=True,
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
def cycles(db, project, create_user):
    now = timezone.now()
    active = Cycle.objects.create(
        name="Active Cycle",
        project=project,
        workspace=project.workspace,
        owned_by=create_user,
        start_date=now,
        end_date=now + timedelta(days=7),
    )
    archived = Cycle.objects.create(
        name="Archived Cycle",
        project=project,
        workspace=project.workspace,
        owned_by=create_user,
        archived_at=now,
    )
    return {"active": active, "archived": archived}


@pytest.mark.contract
class TestCyclesLite:
    @pytest.mark.django_db
    def test_paginated_and_excludes_archived(self, api_key_client, workspace, project, cycles):
        response = api_key_client.get(_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        names = {item["name"] for item in response.data["results"]}
        assert "Active Cycle" in names
        assert "Archived Cycle" not in names
