# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for ``IssueChecklistItemViewSet`` cross-project scoping.

``IssueChecklistItemViewSet`` is guarded by ``ProjectEntityPermission``, which
proves only that the caller is a member of the URL ``project_id`` — not that
``issue_id`` belongs to it (the same gap documented in
``plane/app/views/issue/sub_issue.py:38-44``). Every lookup in the viewset is
scoped on ``workspace__slug`` + ``project_id`` + ``issue_id`` together, so a
member of project A must get a plain 404 (not data, not 403) when addressing
a checklist item that actually lives on project B's issue.
"""

import pytest
from rest_framework import status

from plane.db.models import Issue, IssueChecklistItem, Project, ProjectMember

CHECKLIST_LIST_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/checklist-items/"
CHECKLIST_DETAIL_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/checklist-items/{pk}/"


def _make_issue(name, project, workspace, author):
    issue = Issue(name=name, project=project, workspace=workspace)
    issue.save(created_by_id=author.id)
    return issue


@pytest.fixture
def project_a(db, workspace, create_user):
    """The project the caller is a member of (the URL project)."""
    project = Project.objects.create(
        name="Project A", identifier="PA", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def project_b(db, workspace, create_user):
    """A sibling project in the same workspace the caller is NOT a member of."""
    return Project.objects.create(name="Project B", identifier="PB", workspace=workspace, created_by=create_user)


@pytest.fixture
def issue_a(db, workspace, project_a, create_user):
    return _make_issue("A issue", project_a, workspace, create_user)


@pytest.fixture
def issue_b(db, workspace, project_b, create_user):
    """The victim: an issue in project B, which the caller cannot see."""
    return _make_issue("B issue", project_b, workspace, create_user)


@pytest.fixture
def checklist_item_b(db, workspace, project_b, issue_b, create_user):
    """A checklist item on project B's issue."""
    item = IssueChecklistItem(name="B item", issue=issue_b, project=project_b, workspace=workspace)
    item.save(created_by_id=create_user.id)
    return item


@pytest.mark.contract
class TestChecklistCrossProjectScope:
    """A project member must not read or write another project's checklist items."""

    @pytest.mark.django_db
    def test_list_cross_project_issue_hidden(self, session_client, workspace, project_a, issue_b, checklist_item_b):
        url = CHECKLIST_LIST_URL.format(slug=workspace.slug, project_id=project_a.id, issue_id=issue_b.id)
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert response.data == [], f"Leaked cross-project checklist item: {response.data!r}"

    @pytest.mark.django_db
    def test_create_cross_project_issue_404s(self, session_client, workspace, project_a, issue_b):
        url = CHECKLIST_LIST_URL.format(slug=workspace.slug, project_id=project_a.id, issue_id=issue_b.id)
        response = session_client.post(url, {"name": "Sneaky item"}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Expected 404, got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert not IssueChecklistItem.objects.filter(name="Sneaky item").exists(), (
            "A checklist item was created on a cross-project issue"
        )

    @pytest.mark.django_db
    def test_retrieve_cross_project_item_404s(
        self, session_client, workspace, project_a, issue_b, checklist_item_b
    ):
        url = CHECKLIST_DETAIL_URL.format(
            slug=workspace.slug, project_id=project_a.id, issue_id=issue_b.id, pk=checklist_item_b.id
        )
        response = session_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_update_cross_project_item_404s(self, session_client, workspace, project_a, issue_b, checklist_item_b):
        url = CHECKLIST_DETAIL_URL.format(
            slug=workspace.slug, project_id=project_a.id, issue_id=issue_b.id, pk=checklist_item_b.id
        )
        response = session_client.patch(url, {"status": "done"}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Expected 404, got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        checklist_item_b.refresh_from_db()
        assert checklist_item_b.status == "to_do", "Cross-project item was modified"

    @pytest.mark.django_db
    def test_delete_cross_project_item_404s(self, session_client, workspace, project_a, issue_b, checklist_item_b):
        url = CHECKLIST_DETAIL_URL.format(
            slug=workspace.slug, project_id=project_a.id, issue_id=issue_b.id, pk=checklist_item_b.id
        )
        response = session_client.delete(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Expected 404, got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        checklist_item_b.refresh_from_db()
        assert checklist_item_b.deleted_at is None, "Cross-project item was soft-deleted"

    # --- Positive control: legitimate same-project use still works ------------

    @pytest.mark.django_db
    def test_same_project_crud_allowed(self, session_client, workspace, project_a, issue_a):
        create_url = CHECKLIST_LIST_URL.format(slug=workspace.slug, project_id=project_a.id, issue_id=issue_a.id)
        response = session_client.post(create_url, {"name": "Real item"}, format="json")
        assert response.status_code == status.HTTP_201_CREATED, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        item_id = response.data["id"]

        detail_url = CHECKLIST_DETAIL_URL.format(
            slug=workspace.slug, project_id=project_a.id, issue_id=issue_a.id, pk=item_id
        )
        response = session_client.patch(detail_url, {"status": "done"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "done"
