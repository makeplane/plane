# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""POST /api/v1/.../intake-issues/ with an over-long name.

The name went straight into ``Issue.objects.create`` and Postgres raised
``DataError: value too long for type character varying(255)`` (HTTP 500).
"""

from unittest import mock

import pytest
from rest_framework import status

from plane.db.models import Intake, Issue, Project, ProjectMember


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="P", identifier="P", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    Intake.objects.create(name="Intake", project=project, workspace=workspace)
    return project


def url(workspace, project):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/intake-issues/"


@pytest.mark.contract
@pytest.mark.django_db
def test_name_over_limit_is_400(api_key_client, workspace, project):
    response = api_key_client.post(url(workspace, project), {"issue": {"name": "x" * 256}}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert not Issue.objects.filter(project=project).exists()


@pytest.mark.contract
@pytest.mark.django_db
@mock.patch("plane.api.views.intake.issue_activity")
def test_name_at_limit_is_created(activity, api_key_client, workspace, project):
    response = api_key_client.post(url(workspace, project), {"issue": {"name": "x" * 255}}, format="json")

    assert response.status_code == status.HTTP_201_CREATED
