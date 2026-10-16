# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for guest scoping in the search endpoints.

In a project with ``guest_view_all_features=False`` a GUEST only sees the
issues they created and the pages and views they own, matching the project
list endpoints. Search (``search-issues``, ``search`` and ``entity-search``)
applies the same rule per result project. Global search also keeps private
pages and views owner-only for every project member, as the page and view
lists do.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Issue,
    IssueView,
    Page,
    Project,
    ProjectMember,
    ProjectPage,
    User,
    WorkspaceMember,
)


@pytest.fixture
def project(db, workspace, create_user):
    """A project (guest_view_all_features defaults to False); owner is an admin."""
    project = Project.objects.create(name="Scoped Project", identifier="SP", workspace=workspace)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def guest(db, workspace, project):
    unique_id = uuid4().hex[:8]
    user = User.objects.create(email=f"guest-{unique_id}@plane.so", username=f"guest_{unique_id}")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=5)
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=5)
    return user


@pytest.fixture
def guest_client(guest):
    client = APIClient()
    client.force_authenticate(user=guest)
    return client


def _make_entities(workspace, project, author, label):
    # BaseModel.save overwrites created_by from the request user, so set it explicitly.
    issue = Issue(name=f"{label} issue", project=project, workspace=workspace)
    issue.save(created_by_id=author.id)
    page = Page.objects.create(workspace=workspace, owned_by=author, name=f"{label} page", is_global=True)
    ProjectPage.objects.create(workspace=workspace, project=project, page=page)
    view = IssueView.objects.create(workspace=workspace, project=project, owned_by=author, name=f"{label} view")
    return {"issue": str(issue.id), "page": str(page.id), "issue_view": str(view.id)}


@pytest.fixture
def own(db, workspace, project, guest):
    return _make_entities(workspace, project, guest, "own")


@pytest.fixture
def foreign(db, workspace, project, create_user):
    return _make_entities(workspace, project, create_user, "foreign")


def _ids(rows):
    return {str(row["id"]) for row in rows}


def _search(client, workspace, project, endpoint):
    """Return {entity: set(ids)} for one search endpoint variant."""
    slug = workspace.slug
    if endpoint == "issue-search-project":
        response = client.get(f"/api/workspaces/{slug}/projects/{project.id}/search-issues/")
        results = {"issue": response.data}
    elif endpoint == "issue-search-workspace":
        # search applies each result project's guest rule, independent of the URL project
        response = client.get(f"/api/workspaces/{slug}/projects/{uuid4()}/search-issues/", {"workspace_search": "true"})
        results = {"issue": response.data}
    elif endpoint in ("global", "global-project"):
        params = {"entities": "issue,page,issue_view"}
        if endpoint == "global-project":
            params["project_id"] = str(project.id)
        response = client.get(f"/api/workspaces/{slug}/search/", params)
        results = response.data["results"]
    else:
        params = {"query_type": "issue,page", "count": 50}
        if endpoint == "entity-project":
            params["project_id"] = str(project.id)
        response = client.get(f"/api/workspaces/{slug}/entity-search/", params)
        results = response.data
    assert response.status_code == status.HTTP_200_OK, response.data
    return {entity: _ids(rows) for entity, rows in results.items()}


ENDPOINTS = [
    "issue-search-project",
    "issue-search-workspace",
    "global",
    "global-project",
    "entity",
    "entity-project",
]


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("endpoint", ENDPOINTS)
class TestSearchGuestScope:
    def test_restricted_guest_only_sees_own_entities(self, guest_client, workspace, project, own, foreign, endpoint):
        results = _search(guest_client, workspace, project, endpoint)
        missing = sorted(entity for entity, ids in results.items() if own[entity] not in ids)
        leaked = sorted(entity for entity, ids in results.items() if foreign[entity] in ids)
        assert not missing and not leaked, f"missing own: {missing}, returned others': {leaked}"

    def test_guest_view_all_features_sees_all_entities(self, guest_client, workspace, project, own, foreign, endpoint):
        project.guest_view_all_features = True
        project.save(update_fields=["guest_view_all_features"])

        results = _search(guest_client, workspace, project, endpoint)
        for entity, ids in results.items():
            assert {own[entity], foreign[entity]} <= ids, entity

    def test_member_sees_all_entities(self, session_client, workspace, project, own, foreign, endpoint):
        results = _search(session_client, workspace, project, endpoint)
        for entity, ids in results.items():
            assert {own[entity], foreign[entity]} <= ids, entity


@pytest.fixture
def member(db, workspace, project):
    unique_id = uuid4().hex[:8]
    user = User.objects.create(email=f"member-{unique_id}@plane.so", username=f"member_{unique_id}")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=15)
    client = APIClient()
    client.force_authenticate(user=user)
    return user, client


def _page(workspace, project, owner, access):
    page = Page.objects.create(workspace=workspace, owned_by=owner, name=f"page {uuid4().hex[:6]}", access=access)
    ProjectPage.objects.create(workspace=workspace, project=project, page=page)
    return str(page.id)


def _view(workspace, project, owner, access):
    view = IssueView.objects.create(
        workspace=workspace, project=project, owned_by=owner, name=f"view {uuid4().hex[:6]}", access=access
    )
    return str(view.id)


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("endpoint", ["global", "global-project"])
class TestGlobalSearchPrivateAccess:
    def test_private_pages_are_owner_only(self, workspace, project, create_user, member, endpoint):
        user, client = member
        others_private = _page(workspace, project, create_user, Page.PRIVATE_ACCESS)
        others_public = _page(workspace, project, create_user, Page.PUBLIC_ACCESS)
        own_private = _page(workspace, project, user, Page.PRIVATE_ACCESS)

        ids = _search(client, workspace, project, endpoint)["page"]

        assert others_private not in ids
        assert {others_public, own_private} <= ids

    def test_private_views_are_owner_only(self, workspace, project, create_user, member, endpoint):
        user, client = member
        others_private = _view(workspace, project, create_user, 0)
        others_public = _view(workspace, project, create_user, 1)
        own_private = _view(workspace, project, user, 0)

        ids = _search(client, workspace, project, endpoint)["issue_view"]

        assert others_private not in ids
        assert {others_public, own_private} <= ids
