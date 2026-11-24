# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""issue_export_task lists a work item's current assignees only.

Removing an assignee soft-deletes its IssueAssignee row, but the export read
``issue.assignees`` through that table without the ``deleted_at`` filter, so
removed assignees were still exported, and one re-added after removal appeared
twice.
"""

import json
import zipfile
from unittest.mock import patch

import pytest

from plane.bgtasks.export_task import issue_export_task
from plane.db.models import ExporterHistory, Issue, IssueAssignee, Project, ProjectMember, User, WorkspaceMember

pytestmark = pytest.mark.unit


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Export", identifier="EXP", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def member(db, workspace, project):
    user = User.objects.create(email="assignee@plane.so", username="assignee", first_name="Asha", last_name="Assignee")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=15)
    return user


def _exported_assignees(workspace, project, user):
    exporter = ExporterHistory.objects.create(
        workspace=workspace, project=[project.id], initiated_by=user, provider="json", type="issue_exports"
    )
    with patch("plane.bgtasks.export_task.upload_to_s3") as upload:
        issue_export_task(
            provider="json",
            workspace_id=workspace.id,
            project_ids=[str(project.id)],
            token_id=exporter.token,
            multiple=False,
            slug=workspace.slug,
        )
    assert upload.called, ExporterHistory.objects.get(pk=exporter.pk).reason
    with zipfile.ZipFile(upload.call_args.args[0]) as zf:
        return {row["name"]: row["assignees"] for f in zf.namelist() for row in json.loads(zf.read(f))}


def _assign(issue, user):
    return IssueAssignee.objects.create(issue=issue, assignee=user, project=issue.project, workspace=issue.workspace)


@pytest.mark.django_db
def test_export_leaves_out_removed_assignees(workspace, project, create_user, member):
    removed = Issue.objects.create(name="removed", project=project, workspace=workspace)
    _assign(removed, member).delete()

    readded = Issue.objects.create(name="readded", project=project, workspace=workspace)
    _assign(readded, member).delete()
    _assign(readded, member)

    exported = _exported_assignees(workspace, project, create_user)

    assert exported["removed"] == []
    assert exported["readded"] == [member.full_name]
