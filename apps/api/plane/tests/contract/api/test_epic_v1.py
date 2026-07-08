# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.db.models import Issue, IssueType, Project, ProjectMember
from plane.utils.issue_type import create_default_issue_types


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the user as an admin member"""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
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


@pytest.fixture
def epic_type(db, project):
    """Seed the default work item types and return the project's epic type"""
    create_default_issue_types(project)
    return IssueType.objects.get(project_issue_types__project=project, is_epic=True)


def work_items_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/work-items/"


def work_item_detail_url(slug, project_id, work_item_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/work-items/{work_item_id}/"


@pytest.mark.contract
class TestEpicV1NonRegression:
    """The external v1 API keeps manipulating epics as plain work items"""

    @pytest.mark.django_db
    def test_list_includes_epics(self, api_key_client, workspace, project, epic_type):
        epic = Issue.objects.create(name="Epic 1", project=project, type=epic_type)
        issue = Issue.objects.create(name="Issue 1", project=project)
        response = api_key_client.get(work_items_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_200_OK
        ids = {str(item["id"]) for item in response.data["results"]}
        assert {str(epic.id), str(issue.id)} <= ids

    @pytest.mark.django_db
    def test_create_with_epic_type(self, api_key_client, workspace, project, epic_type):
        response = api_key_client.post(
            work_items_url(workspace.slug, project.id),
            {"name": "Epic via v1", "type_id": str(epic_type.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["is_epic"] is True
        assert Issue.objects.get(pk=response.data["id"]).type_id == epic_type.id

    @pytest.mark.django_db
    def test_detail_exposes_is_epic_true(self, api_key_client, workspace, project, epic_type):
        epic = Issue.objects.create(name="Epic 1", project=project, type=epic_type)
        response = api_key_client.get(work_item_detail_url(workspace.slug, project.id, epic.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_epic"] is True

    @pytest.mark.django_db
    def test_detail_exposes_is_epic_false(self, api_key_client, workspace, project, epic_type):
        issue = Issue.objects.create(name="Issue 1", project=project)
        response = api_key_client.get(work_item_detail_url(workspace.slug, project.id, issue.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_epic"] is False

    @pytest.mark.django_db
    def test_type_create_strips_is_epic(self, api_key_client, workspace, project, epic_type):
        response = api_key_client.post(
            f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-item-types/",
            {"name": "Fake Epic", "is_epic": True},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["is_epic"] is False
        assert IssueType.objects.filter(project_issue_types__project=project, is_epic=True).count() == 1

    @pytest.mark.django_db
    def test_epic_type_cannot_be_deleted(self, api_key_client, workspace, project, epic_type):
        response = api_key_client.delete(
            f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-item-types/{epic_type.id}/"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert IssueType.objects.filter(pk=epic_type.id).exists()
