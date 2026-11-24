# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for grouping the issue list by an m2m field after its links are removed.

Removing a work item's label/assignee/module, or deleting the label or module itself,
soft deletes the link row. A work item left with only soft-deleted links must be listed
in the "None" group, not dropped from the grouped list.
"""

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import Issue, IssueAssignee, IssueLabel, Label, Module, ModuleIssue, Project, ProjectMember

ISSUES_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Grouping Project", identifier="GP", workspace=workspace)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


def _link(group_by, issue, project, create_user):
    """Link the issue to one label/assignee/module and return (link model, linked id)."""
    common = {"issue": issue, "project": project, "workspace": project.workspace}
    if group_by == "labels__id":
        label = Label.objects.create(name="Bug", project=project, workspace=project.workspace)
        IssueLabel.objects.create(label=label, **common)
        return IssueLabel, label.id
    if group_by == "assignees__id":
        IssueAssignee.objects.create(assignee=create_user, **common)
        return IssueAssignee, create_user.id
    module = Module.objects.create(name="Sprint", project=project, workspace=project.workspace)
    ModuleIssue.objects.create(module=module, **common)
    return ModuleIssue, module.id


def _group_ids(results, group):
    return [str(issue["id"]) for issue in results.get(group, {}).get("results", [])]


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("group_by", ["labels__id", "assignees__id", "issue_module__module_id"])
class TestIssueListGroupingRemovedLinks:
    def test_issue_with_only_removed_links_is_in_none_group(
        self, session_client, workspace, project, create_user, group_by
    ):
        issue = Issue.objects.create(name="Unlinked", project=project, workspace=workspace)
        link_model, linked_id = _link(group_by, issue, project, create_user)
        url = ISSUES_URL.format(slug=workspace.slug, project_id=project.id)

        response = session_client.get(url, {"group_by": group_by})
        assert response.status_code == status.HTTP_200_OK, response.data
        assert _group_ids(response.data["results"], str(linked_id)) == [str(issue.id)]

        link_model.all_objects.filter(issue=issue).update(deleted_at=timezone.now())

        response = session_client.get(url, {"group_by": group_by})
        assert response.status_code == status.HTTP_200_OK, response.data
        results = response.data["results"]
        assert _group_ids(results, "None") == [str(issue.id)]
        assert str(linked_id) not in results

    def test_issue_with_only_removed_links_is_in_none_sub_group(
        self, session_client, workspace, project, create_user, group_by
    ):
        issue = Issue.objects.create(name="Unlinked", project=project, workspace=workspace)
        link_model, _ = _link(group_by, issue, project, create_user)
        link_model.all_objects.filter(issue=issue).update(deleted_at=timezone.now())
        url = ISSUES_URL.format(slug=workspace.slug, project_id=project.id)

        response = session_client.get(url, {"group_by": "priority", "sub_group_by": group_by})
        assert response.status_code == status.HTTP_200_OK, response.data
        sub_groups = response.data["results"][issue.priority]["results"]
        assert _group_ids(sub_groups, "None") == [str(issue.id)]
