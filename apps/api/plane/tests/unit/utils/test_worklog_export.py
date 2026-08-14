# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.db.models import Issue, IssueWorklog, Project, ProjectMember, State
from plane.utils.porters.exporter import DataExporter
from plane.utils.porters.serializers.worklog import IssueWorklogExportSerializer


@pytest.mark.django_db
@pytest.mark.unit
def test_worklog_export_serializer_uses_real_worklog_rows(workspace, create_user):
    project = Project.objects.create(
        name="Export Project",
        identifier="EXP",
        workspace=workspace,
        created_by=create_user,
        is_time_tracking_enabled=True,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    state = State.objects.create(
        name="Todo",
        project=project,
        workspace=workspace,
        group="backlog",
        default=True,
    )
    issue = Issue.objects.create(
        name="Logged issue",
        workspace=workspace,
        project=project,
        state=state,
        created_by=create_user,
    )
    worklog = IssueWorklog.objects.create(
        issue=issue,
        project=project,
        workspace=workspace,
        actor=create_user,
        created_by=create_user,
        duration=5400,
        description="Pairing",
    )

    exporter = DataExporter(IssueWorklogExportSerializer, format_type="json")
    _filename, content = exporter.export("worklogs", IssueWorklog.objects.filter(id=worklog.id))
    assert "5400" in content
    assert "Logged issue" in content
    assert "Pairing" in content
    assert f"{project.identifier}-{issue.sequence_id}" in content
