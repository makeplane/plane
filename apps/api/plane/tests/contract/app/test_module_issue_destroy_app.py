# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""DELETE .../modules/{module_id}/issues/{issue_id}/ when the link is already gone.

``module_issue.first().module`` raised ``AttributeError`` on ``None`` (HTTP 500)
for repeated deletes; it must now be a no-op 204.
"""

from unittest import mock

import pytest
from rest_framework import status

from plane.db.models import Issue, Module, ModuleIssue, Project, ProjectMember, State


@pytest.fixture
def setup(db, workspace, create_user):
    project = Project.objects.create(name="P", identifier="P", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    state = State.objects.create(name="Todo", project=project, group="backlog", default=True)
    issue = Issue.objects.create(name="I", workspace=workspace, project=project, state=state, created_by=create_user)
    module = Module.objects.create(name="M", project=project, workspace=workspace)
    return project, issue, module


def url(workspace, project, module, issue):
    return f"/api/workspaces/{workspace.slug}/projects/{project.id}/modules/{module.id}/issues/{issue.id}/"


@pytest.mark.contract
@pytest.mark.django_db
@mock.patch("plane.app.views.module.issue.issue_activity")
def test_delete_missing_link_is_noop(activity, session_client, workspace, setup):
    project, issue, module = setup

    response = session_client.delete(url(workspace, project, module, issue))

    assert response.status_code == status.HTTP_204_NO_CONTENT
    activity.delay.assert_not_called()


@pytest.mark.contract
@pytest.mark.django_db
@mock.patch("plane.app.views.module.issue.issue_activity")
def test_delete_existing_link(activity, session_client, workspace, setup):
    project, issue, module = setup
    ModuleIssue.objects.create(module=module, issue=issue, project=project, workspace=workspace)

    response = session_client.delete(url(workspace, project, module, issue))

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not ModuleIssue.objects.filter(module=module, issue=issue).exists()
    assert '"module_name": "M"' in activity.delay.call_args.kwargs["current_instance"]
