# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Transferring work items to a cycle that doesn't exist in the project is a 400.

``transfer_cycle_issues`` read ``new_cycle.end_date`` on the result of
``.first()``, so an unknown ``new_cycle_id`` (deleted, or from another project)
raised AttributeError (HTTP 500).
"""

from datetime import timedelta
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import Cycle, Project, ProjectMember


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Transfer", identifier="TRM", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def ended_cycle(db, workspace, project, create_user):
    now = timezone.now()
    return Cycle.objects.create(
        name="Sprint 1",
        project=project,
        workspace=workspace,
        owned_by=create_user,
        start_date=now - timedelta(days=14),
        end_date=now - timedelta(days=1),
    )


@pytest.mark.contract
@pytest.mark.django_db
def test_transfer_to_an_unknown_cycle_is_400(session_client, workspace, project, ended_cycle):
    url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/cycles/{ended_cycle.id}/transfer-issues/"

    response = session_client.post(url, {"new_cycle_id": str(uuid4())}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["error"] == "Target cycle not found"
    ended_cycle.refresh_from_db()
    assert not ended_cycle.progress_snapshot


@pytest.mark.contract
@pytest.mark.django_db
def test_transfer_to_a_cycle_of_another_project_is_400(session_client, workspace, project, ended_cycle, create_user):
    other = Project.objects.create(name="Other", identifier="OTR", workspace=workspace, created_by=create_user)
    foreign_cycle = Cycle.objects.create(name="Elsewhere", project=other, workspace=workspace, owned_by=create_user)
    url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/cycles/{ended_cycle.id}/transfer-issues/"

    response = session_client.post(url, {"new_cycle_id": str(foreign_cycle.id)}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
