# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Intake on projects created through the public API.

POST /api/v1/workspaces/<slug>/projects/ with "intake_view": true

The flag was saved, but only PATCH created the project's default intake, so
every work item later submitted to the new project's intake failed with 500
(after the work item itself had already been created).
"""

from unittest import mock

import pytest
from rest_framework import status

from plane.db.models import Intake, IntakeIssue


def _projects_url(workspace):
    return f"/api/v1/workspaces/{workspace.slug}/projects/"


def _create_project(client, workspace, **fields):
    """Create a project through the public API and return its id."""
    payload = {"name": "Intake Project", "identifier": "IP", **fields}
    response = client.post(_projects_url(workspace), payload, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    return response.data["id"]


@pytest.mark.contract
class TestProjectCreateIntake:
    @pytest.mark.django_db
    def test_create_with_intake_view_creates_default_intake(self, api_key_client, workspace):
        project_id = _create_project(api_key_client, workspace, intake_view=True)

        assert Intake.objects.filter(project_id=project_id, is_default=True).count() == 1

    @pytest.mark.django_db
    def test_create_without_intake_view_creates_no_intake(self, api_key_client, workspace):
        project_id = _create_project(api_key_client, workspace)

        assert not Intake.objects.filter(project_id=project_id).exists()

    @pytest.mark.django_db
    @mock.patch("plane.api.views.intake.issue_activity")
    def test_intake_work_item_can_be_submitted_after_create(self, activity, api_key_client, workspace):
        project_id = _create_project(api_key_client, workspace, intake_view=True)

        response = api_key_client.post(
            f"{_projects_url(workspace)}{project_id}/intake-issues/",
            {"issue": {"name": "Request from the intake"}},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert IntakeIssue.objects.filter(project_id=project_id).count() == 1
