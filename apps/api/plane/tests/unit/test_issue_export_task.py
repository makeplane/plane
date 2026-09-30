# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from io import BytesIO
from unittest.mock import patch

import pytest

from plane.bgtasks.export_task import issue_export_task
from plane.db.models import Project, ProjectMember


@pytest.fixture
def exportable_project(db, workspace, create_user):
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


@pytest.mark.unit
class TestIssueExportTaskCsvUpload:
    @pytest.mark.django_db
    @patch("plane.bgtasks.export_task.upload_to_s3")
    @patch("plane.bgtasks.export_task.upload_export_file_to_s3")
    @patch("plane.bgtasks.export_task.DataExporter")
    def test_single_csv_export_uploads_csv_file(
        self,
        mock_data_exporter,
        mock_upload_csv,
        mock_upload_zip,
        workspace,
        create_user,
        exportable_project,
    ):
        from plane.db.models import ExporterHistory

        exporter = ExporterHistory.objects.create(
            workspace=workspace,
            project=[str(exportable_project.id)],
            initiated_by=create_user,
            provider="csv",
            type="issue_exports",
        )

        mock_exporter_instance = mock_data_exporter.return_value
        mock_exporter_instance.export.return_value = (
            "osm-workspace.csv",
            "\ufeffName,Title\nEXP,Issue one\n",
        )

        issue_export_task(
            provider="csv",
            workspace_id=workspace.id,
            project_ids=[str(exportable_project.id)],
            token_id=exporter.token,
            multiple=False,
            slug=workspace.slug,
            csv_delimiter=";",
        )

        mock_upload_csv.assert_called_once()
        mock_upload_zip.assert_not_called()

        csv_buffer = mock_upload_csv.call_args.args[0]
        assert isinstance(csv_buffer, BytesIO)
        content = csv_buffer.getvalue().decode("utf-8-sig")
        assert "Issue one" in content

        mock_data_exporter.assert_called_once()
        assert mock_data_exporter.call_args.kwargs["csv_delimiter"] == ";"

    @pytest.mark.django_db
    @patch("plane.bgtasks.export_task.upload_to_s3")
    @patch("plane.bgtasks.export_task.upload_export_file_to_s3")
    @patch("plane.bgtasks.export_task.DataExporter")
    def test_multiple_csv_exports_are_zipped(
        self,
        mock_data_exporter,
        mock_upload_csv,
        mock_upload_zip,
        workspace,
        create_user,
        exportable_project,
    ):
        from plane.db.models import ExporterHistory

        second_project = Project.objects.create(
            name="Second",
            identifier="SEC",
            workspace=workspace,
            created_by=create_user,
        )

        ProjectMember.objects.create(
            project=second_project,
            member=create_user,
            role=20,
            is_active=True,
        )

        exporter = ExporterHistory.objects.create(
            workspace=workspace,
            project=[str(exportable_project.id), str(second_project.id)],
            initiated_by=create_user,
            provider="csv",
            type="issue_exports",
        )

        mock_exporter_instance = mock_data_exporter.return_value
        mock_exporter_instance.export.side_effect = [
            ("osm-one.csv", "one"),
            ("osm-two.csv", "two"),
        ]

        issue_export_task(
            provider="csv",
            workspace_id=workspace.id,
            project_ids=[str(exportable_project.id), str(second_project.id)],
            token_id=exporter.token,
            multiple=True,
            slug=workspace.slug,
            csv_delimiter=",",
        )

        mock_upload_zip.assert_called_once()
        mock_upload_csv.assert_not_called()
