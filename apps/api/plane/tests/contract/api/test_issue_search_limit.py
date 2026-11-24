# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""GET /api/v1/workspaces/<slug>/issues/search/ with a bad ``limit``.

``limit`` went straight into ``[: int(limit)]``, so a value that isn't a whole
number, or a negative one, raised ValueError (HTTP 500) instead of a 400.
"""

import pytest
from rest_framework import status

from plane.db.models import Issue, Project, ProjectMember


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Search", identifier="SRC", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    for n in range(3):
        Issue.objects.create(name=f"findme {n}", project=project, workspace=workspace)
    return project


def url(workspace):
    return f"/api/v1/workspaces/{workspace.slug}/issues/search/"


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("limit", ["abc", "-1", "0", "1.5", "1001"])
def test_invalid_limit_is_400(api_key_client, workspace, project, limit):
    response = api_key_client.get(url(workspace), {"search": "findme", "workspace_search": "true", "limit": limit})

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
@pytest.mark.django_db
def test_valid_limit_caps_the_results(api_key_client, workspace, project):
    response = api_key_client.get(url(workspace), {"search": "findme", "workspace_search": "true", "limit": "2"})

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data["issues"]) == 2
