# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Estimate, Project, ProjectMember
from plane.db.models.api import APIToken


def api_client_for(user):
    token = APIToken.objects.create(user=user, label="Token", token=f"tok-{uuid4().hex[:16]}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


def estimates_v1_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/estimates/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Estimates v1 Project",
        identifier=f"EV{uuid4().hex[:3].upper()}",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.mark.contract
class TestEstimatesV1TimeType:
    """With TIME declared on EstimateType, the public v1 surface accepts the
    same estimate types as the web app — no more web/API asymmetry (SEC-1)."""

    @pytest.mark.django_db
    def test_v1_create_time_estimate_accepted(self, workspace, project, create_user):
        client = api_client_for(create_user)

        response = client.post(
            estimates_v1_url(workspace.slug, project.id),
            {"name": "Time", "type": "time"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert Estimate.objects.get(project=project).type == "time"

    @pytest.mark.django_db
    def test_v1_create_still_rejects_unknown_type(self, workspace, project, create_user):
        client = api_client_for(create_user)

        response = client.post(
            estimates_v1_url(workspace.slug, project.id),
            {"name": "Bad", "type": "not-a-type"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_v1_unauthenticated_rejected(self, workspace, project):
        client = APIClient()

        response = client.post(
            estimates_v1_url(workspace.slug, project.id),
            {"name": "Nope", "type": "time"},
            format="json",
        )

        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
