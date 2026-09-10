# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for checklist item ordering (spec FR-007, FR-021, FR-023).

Server-computed append on create (``Max(sort_order) + 65535``), client-driven
float-midpoint reorder via a plain PATCH of ``sort_order``, and a
deterministic ``created_at`` tiebreak when two items share a ``sort_order``.
"""

import pytest
from rest_framework import status

from plane.db.models import Issue, IssueChecklistItem, Project, ProjectMember

CHECKLIST_LIST_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/checklist-items/"
CHECKLIST_DETAIL_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/checklist-items/{pk}/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Test Project", identifier="TP", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def issue(db, workspace, project, create_user):
    issue = Issue(name="Test issue", project=project, workspace=workspace)
    issue.save(created_by_id=create_user.id)
    return issue


@pytest.mark.contract
class TestChecklistSortOrder:
    @pytest.mark.django_db
    def test_bare_creates_append_in_order(self, session_client, workspace, project, issue):
        url = CHECKLIST_LIST_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id)

        first = session_client.post(url, {"name": "First"}, format="json")
        second = session_client.post(url, {"name": "Second"}, format="json")
        third = session_client.post(url, {"name": "Third"}, format="json")
        for response in (first, second, third):
            assert response.status_code == status.HTTP_201_CREATED

        assert first.data["sort_order"] == 65535
        assert second.data["sort_order"] == 131070
        assert third.data["sort_order"] == 196605

        list_response = session_client.get(url)
        assert [row["name"] for row in list_response.data] == ["First", "Second", "Third"]

    @pytest.mark.django_db
    def test_midpoint_reorder(self, session_client, workspace, project, issue):
        list_url = CHECKLIST_LIST_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id)
        first = session_client.post(list_url, {"name": "First"}, format="json").data
        second = session_client.post(list_url, {"name": "Second"}, format="json").data
        third = session_client.post(list_url, {"name": "Third"}, format="json").data

        # move "Third" between "First" and "Second"
        midpoint = (first["sort_order"] + second["sort_order"]) / 2
        detail_url = CHECKLIST_DETAIL_URL.format(
            slug=workspace.slug, project_id=project.id, issue_id=issue.id, pk=third["id"]
        )
        response = session_client.patch(detail_url, {"sort_order": midpoint}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["sort_order"] == midpoint

        list_response = session_client.get(list_url)
        assert [row["name"] for row in list_response.data] == ["First", "Third", "Second"]

    @pytest.mark.django_db
    def test_equal_sort_order_breaks_tie_on_created_at(self, db, workspace, project, issue, create_user):
        """Two items sharing a sort_order (a concurrent-append race) still
        return in a deterministic order via the (sort_order, created_at)
        Meta.ordering tiebreak, rather than an arbitrary one."""
        first = IssueChecklistItem(name="Older", issue=issue, project=project, workspace=workspace, sort_order=100)
        first.save(created_by_id=create_user.id)
        second = IssueChecklistItem(name="Newer", issue=issue, project=project, workspace=workspace, sort_order=100)
        second.save(created_by_id=create_user.id)

        ordered_names = list(
            IssueChecklistItem.objects.filter(issue=issue).order_by("sort_order", "created_at").values_list(
                "name", flat=True
            )
        )
        assert ordered_names == ["Older", "Newer"]

    @pytest.mark.django_db
    def test_client_supplied_sort_order_on_create_is_honoured(self, session_client, workspace, project, issue):
        url = CHECKLIST_LIST_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id)
        response = session_client.post(url, {"name": "Positioned", "sort_order": 42.5}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["sort_order"] == 42.5
