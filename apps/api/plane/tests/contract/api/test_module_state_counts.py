# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""State-group issue counts on the public module endpoints.

GET /api/v1/workspaces/<slug>/projects/<project_id>/modules/
GET /api/v1/workspaces/<slug>/projects/<project_id>/modules/<pk>/
GET /api/v1/workspaces/<slug>/projects/<project_id>/archived-modules/

Each count used to be a distinct count of the state group itself, which the
filter pins to a single value, so every count came back as 0 or 1.
"""

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import Issue, Module, ModuleIssue, Project, ProjectMember, State

# Number of issues in the module for each state group.
ISSUES_PER_GROUP = {"backlog": 1, "unstarted": 2, "started": 0, "completed": 3, "cancelled": 2}
EXPECTED_COUNTS = {f"{group}_issues": count for group, count in ISSUES_PER_GROUP.items()}


@pytest.fixture
def module(db, workspace, create_user):
    """A module holding ISSUES_PER_GROUP issues in each state group."""
    project = Project.objects.create(
        name="Module Counts Project",
        identifier="MCP",
        workspace=workspace,
        created_by=create_user,
        module_view=True,
    )
    ProjectMember.objects.create(
        workspace=workspace,
        project=project,
        member=create_user,
        role=20,
        is_active=True,
    )
    module = Module.objects.create(name="Counted Module", project=project, workspace=workspace)
    for group, count in ISSUES_PER_GROUP.items():
        state = State.objects.create(name=group.title(), project=project, group=group)
        for index in range(count):
            issue = Issue.objects.create(
                name=f"{group} issue {index}",
                workspace=workspace,
                project=project,
                state=state,
                created_by=create_user,
            )
            ModuleIssue.objects.create(module=module, issue=issue, project=project, workspace=workspace)
    return module


def _project_url(module):
    """Base URL of the public API for the module's project."""
    return f"/api/v1/workspaces/{module.workspace.slug}/projects/{module.project_id}"


def _counts(data):
    """The five state-group counts from one serialized module."""
    return {key: data[key] for key in EXPECTED_COUNTS}


def _find(results, module):
    """The single entry for ``module`` in a list response."""
    matches = [item for item in results if str(item["id"]) == str(module.id)]
    assert len(matches) == 1
    return matches[0]


@pytest.mark.contract
class TestModuleStateCounts:
    @pytest.mark.django_db
    def test_detail_counts_issues_in_each_state_group(self, api_key_client, module):
        response = api_key_client.get(f"{_project_url(module)}/modules/{module.id}/")

        assert response.status_code == status.HTTP_200_OK
        assert _counts(response.data) == EXPECTED_COUNTS
        assert response.data["total_issues"] == sum(ISSUES_PER_GROUP.values())

    @pytest.mark.django_db
    def test_list_counts_issues_in_each_state_group(self, api_key_client, module):
        response = api_key_client.get(f"{_project_url(module)}/modules/")

        assert response.status_code == status.HTTP_200_OK
        assert _counts(_find(response.data["results"], module)) == EXPECTED_COUNTS

    @pytest.mark.django_db
    def test_archived_list_counts_issues_in_each_state_group(self, api_key_client, module):
        module.archived_at = timezone.now()
        module.save(update_fields=["archived_at"])

        response = api_key_client.get(f"{_project_url(module)}/archived-modules/")

        assert response.status_code == status.HTTP_200_OK
        assert _counts(_find(response.data["results"], module)) == EXPECTED_COUNTS
