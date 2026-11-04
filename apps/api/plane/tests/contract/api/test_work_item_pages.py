# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.db.models import (
    Issue,
    Page,
    Project,
    ProjectMember,
    ProjectPage,
    State,
    WorkItemPage,
)


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Pages Project",
        identifier="PP",
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
def issue(db, workspace, project, create_user):
    state = State.objects.create(
        name="Todo",
        project=project,
        workspace=workspace,
        group="backlog",
        default=True,
    )
    return Issue.objects.create(
        name="Pages Work Item",
        workspace=workspace,
        project=project,
        state=state,
        created_by=create_user,
    )


def _url(workspace_slug, project_id, issue_id, link_id=None):
    url = f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/{issue_id}/pages/"
    return f"{url}{link_id}/" if link_id else url


@pytest.mark.contract
class TestWorkItemPagesAPI:
    @pytest.mark.django_db
    def test_list_attach_and_detach_global_page(
        self, api_key_client, workspace, project, issue, create_user
    ):
        page = Page.objects.create(
            name="Global Page",
            description_html="<p>Global page</p>",
            workspace=workspace,
            owned_by=create_user,
            access=Page.PUBLIC_ACCESS,
            is_global=True,
        )
        url = _url(workspace.slug, project.id, issue.id)

        listed = api_key_client.get(url)
        assert listed.status_code == status.HTTP_200_OK
        assert listed.data["total_count"] == 0

        attached = api_key_client.post(url, {"page_id": str(page.id)}, format="json")
        assert attached.status_code == status.HTTP_201_CREATED
        assert str(attached.data["page"]["id"]) == str(page.id)
        link_id = attached.data["id"]
        assert WorkItemPage.objects.filter(issue=issue, page=page).exists()

        listed = api_key_client.get(url)
        assert listed.status_code == status.HTTP_200_OK
        assert listed.data["total_count"] == 1
        assert str(listed.data["results"][0]["page"]["id"]) == str(page.id)

        detached = api_key_client.delete(_url(workspace.slug, project.id, issue.id, link_id))
        assert detached.status_code == status.HTTP_204_NO_CONTENT
        assert not WorkItemPage.objects.filter(issue=issue, page=page).exists()
        assert WorkItemPage.all_objects.filter(pk=link_id, deleted_at__isnull=False).exists()

        listed = api_key_client.get(url)
        assert listed.status_code == status.HTTP_200_OK
        assert listed.data["total_count"] == 0

    @pytest.mark.django_db
    def test_cannot_attach_page_from_another_project(
        self, api_key_client, workspace, project, issue, create_user
    ):
        other_project = Project.objects.create(
            name="Other Project",
            identifier="OP",
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(
            project=other_project,
            member=create_user,
            role=20,
            is_active=True,
        )
        page = Page.objects.create(
            name="Other Project Page",
            workspace=workspace,
            owned_by=create_user,
            access=Page.PUBLIC_ACCESS,
        )
        ProjectPage.objects.create(
            workspace=workspace,
            project=other_project,
            page=page,
        )

        response = api_key_client.post(
            _url(workspace.slug, project.id, issue.id),
            {"page_id": str(page.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert not WorkItemPage.objects.filter(issue=issue, page=page).exists()
