# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""issue_export_task: guests only export issues they created unless guest_view_all_features."""

import json
import zipfile
from unittest.mock import patch
from uuid import uuid4

import pytest

from plane.bgtasks.export_task import issue_export_task
from plane.db.models import ExporterHistory, Issue, Project, ProjectMember, User, WorkspaceMember

pytestmark = pytest.mark.unit


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Export", identifier="EXP", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def make_member(db, workspace, project):
    def make(project_role):
        unique_id = uuid4().hex[:8]
        user = User.objects.create(email=f"user-{unique_id}@plane.so", username=f"user_{unique_id}")
        WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
        ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=project_role)
        return user

    return make


def _make_issue(name, project, author):
    issue = Issue(name=name, project=project, workspace=project.workspace)
    issue.save(created_by_id=author.id)
    return issue


def _exported_names(workspace, project, user):
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
        return {row["name"] for f in zf.namelist() for row in json.loads(zf.read(f))}


@pytest.mark.django_db
@pytest.mark.parametrize(
    "project_role, guest_view_all_features, expected",
    [
        (5, False, {"own"}),
        (5, True, {"own", "other"}),
        (15, False, {"own", "other"}),
    ],
)
def test_export_respects_guest_scope(
    workspace, project, create_user, make_member, project_role, guest_view_all_features, expected
):
    Project.objects.filter(pk=project.pk).update(guest_view_all_features=guest_view_all_features)
    user = make_member(project_role)
    _make_issue("own", project, user)
    _make_issue("other", project, create_user)

    assert _exported_names(workspace, project, user) == expected
