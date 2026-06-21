# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.db.models import Cycle, CycleIssue, Issue, Project, ProjectMember, WorkspaceSprint, WorkspaceSprintIssue


@pytest.fixture
def project_factory(db, workspace, create_user):
    def _create_project(name="Test Project", identifier="TP"):
        project = Project.objects.create(
            name=name,
            identifier=identifier,
            workspace=workspace,
            created_by=create_user,
            cycle_view=True,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        return project

    return _create_project


@pytest.fixture
def sprint(workspace, create_user):
    return WorkspaceSprint.objects.create(name="Global Sprint", workspace=workspace, owned_by=create_user)


@pytest.mark.contract
class TestWorkspaceSprintAPI:
    def get_sprint_url(self, workspace_slug, sprint_id=None):
        base_url = f"/api/workspaces/{workspace_slug}/sprints/"
        return f"{base_url}{sprint_id}/" if sprint_id else base_url

    def get_sprint_issue_url(self, workspace_slug, sprint_id, issue_id=None):
        base_url = f"/api/workspaces/{workspace_slug}/sprints/{sprint_id}/issues/"
        return f"{base_url}{issue_id}/" if issue_id else base_url

    @pytest.mark.django_db
    def test_create_and_list_workspace_sprints(self, session_client, workspace):
        response = session_client.post(
            self.get_sprint_url(workspace.slug),
            {"name": "Sprint 1", "description": "Workspace-level sprint"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Sprint 1"
        assert str(response.data["workspace_id"]) == str(workspace.id)

        response = session_client.get(self.get_sprint_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["total_issues"] == 0

    @pytest.mark.django_db
    def test_add_issues_from_multiple_projects_to_workspace_sprint(
        self, session_client, workspace, sprint, project_factory
    ):
        project_one = project_factory(name="Project One", identifier="P1")
        project_two = project_factory(name="Project Two", identifier="P2")
        issue_one = Issue.objects.create(name="Issue One", project=project_one, workspace=workspace)
        issue_two = Issue.objects.create(name="Issue Two", project=project_two, workspace=workspace)

        response = session_client.post(
            self.get_sprint_issue_url(workspace.slug, sprint.id),
            {"issue_id": str(issue_one.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

        response = session_client.post(
            self.get_sprint_issue_url(workspace.slug, sprint.id),
            {"issue_id": str(issue_two.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert WorkspaceSprintIssue.objects.filter(sprint=sprint, deleted_at__isnull=True).count() == 2

    @pytest.mark.django_db
    def test_workspace_sprint_coexists_with_project_cycle(self, session_client, workspace, sprint, project_factory):
        project = project_factory()
        issue = Issue.objects.create(name="Issue with cycle", project=project, workspace=workspace)
        cycle = Cycle.objects.create(name="Project Cycle", project=project, workspace=workspace, owned_by=project.created_by)
        CycleIssue.objects.create(issue=issue, cycle=cycle, project=project, workspace=workspace)

        response = session_client.post(
            self.get_sprint_issue_url(workspace.slug, sprint.id),
            {"issue_id": str(issue.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert CycleIssue.objects.filter(issue=issue, cycle=cycle, deleted_at__isnull=True).exists()
        assert WorkspaceSprintIssue.objects.filter(issue=issue, sprint=sprint, deleted_at__isnull=True).exists()

    @pytest.mark.django_db
    def test_issue_moves_between_workspace_sprints(self, session_client, workspace, sprint, project_factory, create_user):
        project = project_factory()
        issue = Issue.objects.create(name="Issue", project=project, workspace=workspace)
        next_sprint = WorkspaceSprint.objects.create(name="Next Sprint", workspace=workspace, owned_by=create_user)

        response = session_client.post(
            self.get_sprint_issue_url(workspace.slug, sprint.id),
            {"issue_id": str(issue.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

        response = session_client.post(
            self.get_sprint_issue_url(workspace.slug, next_sprint.id),
            {"issue_id": str(issue.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert not WorkspaceSprintIssue.objects.filter(issue=issue, sprint=sprint, deleted_at__isnull=True).exists()
        assert WorkspaceSprintIssue.objects.filter(issue=issue, sprint=next_sprint, deleted_at__isnull=True).exists()
