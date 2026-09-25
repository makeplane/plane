# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.db.models import Issue, Project, ProjectMember, State

ROUTE_PREFIXES = ["issues", "work-items"]


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Test Project", identifier="TP", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    State.objects.create(
        name="Backlog",
        color="#000000",
        group="backlog",
        default=True,
        project=project,
        workspace=workspace,
        created_by=create_user,
    )
    return project


@pytest.fixture
def issue(db, project, workspace, create_user):
    return Issue.objects.create(name="Existing Issue", project=project, workspace=workspace, created_by=create_user)


@pytest.mark.contract
class TestWorkItemByIdentifierRouteContract:
    """
    Contract: ``/api/v1/workspaces/<slug>/{issues,work-items}/<PROJECT>-<number>/``
    only matches a numeric work item number. Any other path under the prefix
    (e.g. ``advanced-search``, which Community Edition does not serve) is a 404,
    not a misleading 403 or a 500. See makeplane/plane#8822.
    """

    @pytest.mark.django_db
    @pytest.mark.parametrize("prefix", ROUTE_PREFIXES)
    def test_numeric_identifier_returns_work_item(self, api_key_client, workspace, issue, prefix):
        url = f"/api/v1/workspaces/{workspace.slug}/{prefix}/TP-{issue.sequence_id}/"

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(issue.id)

    @pytest.mark.django_db
    @pytest.mark.parametrize("method", ["get", "post"])
    def test_advanced_search_path_is_not_found(self, api_key_client, workspace, project, method):
        url = f"/api/v1/workspaces/{workspace.slug}/work-items/advanced-search/"

        response = getattr(api_key_client, method)(url, {"query": "anything"}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    @pytest.mark.parametrize("prefix", ROUTE_PREFIXES)
    def test_non_numeric_number_in_member_project_is_not_found(self, api_key_client, workspace, issue, prefix):
        url = f"/api/v1/workspaces/{workspace.slug}/{prefix}/TP-abc/"

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND
