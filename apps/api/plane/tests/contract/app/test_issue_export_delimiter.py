# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import patch

import pytest
from django.urls import reverse
from rest_framework import status

from plane.db.models import ProjectMember


@pytest.fixture
def exportable_project(db, workspace, create_user):
    from plane.db.models import Project

    project = Project.objects.create(
        name="Export Issues",
        identifier="ISS",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,
        is_active=True,
    )
    return project


@pytest.mark.contract
class TestIssueExportDelimiterAPI:
    @pytest.mark.django_db
    @patch("plane.app.views.exporter.base.issue_export_task.delay")
    def test_export_issues_passes_semicolon_delimiter_to_task(
        self, mock_delay, session_client, workspace, exportable_project
    ):
        url = reverse("export-issues", kwargs={"slug": workspace.slug})
        response = session_client.post(
            url,
            {
                "provider": "csv",
                "delimiter": ";",
                "project": [str(exportable_project.id)],
                "multiple": False,
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        mock_delay.assert_called_once()
        assert mock_delay.call_args.kwargs["csv_delimiter"] == ";"

    @pytest.mark.django_db
    @patch("plane.app.views.exporter.base.issue_export_task.delay")
    def test_export_issues_defaults_to_comma_delimiter(self, mock_delay, session_client, workspace, exportable_project):
        url = reverse("export-issues", kwargs={"slug": workspace.slug})
        response = session_client.post(
            url,
            {"provider": "csv", "project": [str(exportable_project.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert mock_delay.call_args.kwargs["csv_delimiter"] == ","

    @pytest.mark.django_db
    @patch("plane.app.views.exporter.base.issue_export_task.delay")
    def test_export_issues_rejects_invalid_delimiter(self, mock_delay, session_client, workspace, exportable_project):
        url = reverse("export-issues", kwargs={"slug": workspace.slug})
        response = session_client.post(
            url,
            {
                "provider": "csv",
                "delimiter": "|",
                "project": [str(exportable_project.id)],
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert mock_delay.call_args.kwargs["csv_delimiter"] == ","
