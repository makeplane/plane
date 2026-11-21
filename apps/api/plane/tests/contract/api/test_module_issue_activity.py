# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Activity for work items added to a module through the public API.

POST /api/v1/workspaces/<slug>/projects/<project_id>/modules/<module_id>/module-issues/

The view queued a single module.activity.created task with no work item and a
"modules_list" payload, but the task records one work item per call and reads
"module_id" (the shape the web app sends). The task found no module and
returned, so the added work items never showed the module in their activity.
"""

from unittest import mock

import pytest
from rest_framework import status

from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import Issue, IssueActivity, Module, ModuleIssue, Project, ProjectMember


@pytest.fixture
def module(db, workspace, create_user):
    project = Project.objects.create(
        name="Module Activity Project",
        identifier="MAP",
        workspace=workspace,
        created_by=create_user,
        module_view=True,
    )
    ProjectMember.objects.create(workspace=workspace, project=project, member=create_user, role=20, is_active=True)
    return Module.objects.create(name="Activity Module", project=project, workspace=workspace)


@pytest.fixture
def issues(module, create_user):
    return [
        Issue.objects.create(
            name=f"Work item {index}",
            project=module.project,
            workspace=module.workspace,
            created_by=create_user,
        )
        for index in range(2)
    ]


@pytest.fixture
def queued_activity():
    """Run each queued issue_activity task in-process instead of through Celery."""
    with (
        mock.patch("plane.api.views.module.issue_activity") as queued,
        mock.patch("plane.bgtasks.issue_activities_task.notifications"),
    ):
        queued.delay.side_effect = issue_activity
        yield queued


def _add_to_module(client, module, issues):
    url = f"/api/v1/workspaces/{module.workspace.slug}/projects/{module.project_id}/modules/{module.id}/module-issues/"
    response = client.post(url, {"issues": [str(issue.id) for issue in issues]}, format="json")
    assert response.status_code == status.HTTP_200_OK
    assert ModuleIssue.objects.filter(module=module).count() == len(issues)


@pytest.mark.contract
class TestModuleIssueActivity:
    @pytest.mark.django_db
    def test_each_added_work_item_records_the_module(self, api_key_client, module, issues, queued_activity):
        _add_to_module(api_key_client, module, issues)

        for issue in issues:
            activity = IssueActivity.objects.filter(issue=issue, field="modules", verb="created")
            assert list(activity.values_list("new_identifier", flat=True)) == [module.id]

    @pytest.mark.django_db
    def test_each_added_work_item_notifies(self, api_key_client, module, issues, queued_activity):
        _add_to_module(api_key_client, module, issues)

        calls = [call.kwargs for call in queued_activity.delay.call_args_list]
        assert sorted(call["issue_id"] for call in calls) == sorted(str(issue.id) for issue in issues)
        assert all(call["notification"] is True for call in calls)
