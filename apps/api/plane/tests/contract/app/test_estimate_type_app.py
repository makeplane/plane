# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import Estimate, Project, ProjectMember


def estimates_url(slug, project_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/estimates/"


def estimate_detail_url(slug, project_id, estimate_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/estimates/{estimate_id}/"


def make_points_payload():
    return [{"key": i, "value": str(60 * (i + 1))} for i in range(2)]


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Estimates Project",
        identifier=f"E{uuid4().hex[:4].upper()}",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.mark.contract
class TestEstimateTypeValidation:
    """The internal write path must only accept declared EstimateType values
    (categories / points / time) — review finding SEC-1."""

    @pytest.mark.django_db
    def test_create_time_estimate_accepted(self, session_client, workspace, project):
        response = session_client.post(
            estimates_url(workspace.slug, project.id),
            {
                "estimate": {"name": "Time", "type": "time", "last_used": True},
                "estimate_points": make_points_payload(),
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        estimate = Estimate.objects.get(project=project)
        assert estimate.type == "time"
        assert estimate.points.count() == 2

    @pytest.mark.django_db
    def test_create_rejects_unknown_type(self, session_client, workspace, project):
        response = session_client.post(
            estimates_url(workspace.slug, project.id),
            {
                "estimate": {"name": "Bad", "type": "not-a-type"},
                "estimate_points": make_points_payload(),
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Estimate.objects.filter(project=project).count() == 0

    @pytest.mark.django_db
    def test_create_rejects_missing_estimate_payload(self, session_client, workspace, project):
        response = session_client.post(
            estimates_url(workspace.slug, project.id),
            {"estimate_points": make_points_payload()},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_partial_update_accepts_time_and_rejects_unknown_type(self, session_client, workspace, project):
        create = session_client.post(
            estimates_url(workspace.slug, project.id),
            {
                "estimate": {"name": "Points", "type": "points"},
                "estimate_points": make_points_payload(),
            },
            format="json",
        )
        estimate_id = create.data["id"]
        point = create.data["points"][0]

        ok = session_client.patch(
            estimate_detail_url(workspace.slug, project.id, estimate_id),
            {
                "estimate": {"type": "time"},
                "estimate_points": [{"id": point["id"], "key": point["key"], "value": point["value"]}],
            },
            format="json",
        )
        assert ok.status_code == status.HTTP_200_OK
        assert Estimate.objects.get(pk=estimate_id).type == "time"

        bad = session_client.patch(
            estimate_detail_url(workspace.slug, project.id, estimate_id),
            {
                "estimate": {"type": "sprint-units"},
                "estimate_points": [{"id": point["id"], "key": point["key"], "value": point["value"]}],
            },
            format="json",
        )
        assert bad.status_code == status.HTTP_400_BAD_REQUEST
        assert Estimate.objects.get(pk=estimate_id).type == "time"
