# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""POST /api/v1/.../cycles/<cycle_id>/cycle-issues/ only moves work items of the URL project.

A body work item from another project keeps its existing cycle; a work item of the URL
project is still moved into the target cycle.
"""

from unittest import mock

import pytest
from rest_framework import status

from plane.db.models import Cycle, CycleIssue, Issue, Project, ProjectMember


def _project_with_cycle_issue(workspace, user, identifier):
    project = Project.objects.create(name=identifier, identifier=identifier, workspace=workspace, created_by=user)
    issue = Issue.objects.create(name=f"{identifier}1", workspace=workspace, project=project)
    cycle = Cycle.objects.create(name=f"{identifier} old", project=project, workspace=workspace, owned_by=user)
    cycle_issue = CycleIssue.objects.create(issue=issue, cycle=cycle, project=project, workspace=workspace)
    return project, cycle_issue


@pytest.mark.contract
@pytest.mark.django_db
@mock.patch("plane.api.views.cycle.issue_activity")
def test_cycle_issue_post_only_moves_url_project_work_items(activity, api_key_client, workspace, create_user):
    project, own = _project_with_cycle_issue(workspace, create_user, "PA")
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    _, foreign = _project_with_cycle_issue(workspace, create_user, "PB")
    target = Cycle.objects.create(name="PA new", project=project, workspace=workspace, owned_by=create_user)
    foreign_cycle_id = foreign.cycle_id

    url = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/cycles/{target.id}/cycle-issues/"
    body = {"issues": [str(own.issue_id), str(foreign.issue_id)]}
    response = api_key_client.post(url, body, format="json")

    assert response.status_code == status.HTTP_200_OK
    foreign.refresh_from_db()
    own.refresh_from_db()
    assert foreign.cycle_id == foreign_cycle_id
    assert own.cycle_id == target.id
    assert not CycleIssue.objects.filter(cycle=target, issue_id=foreign.issue_id).exists()
