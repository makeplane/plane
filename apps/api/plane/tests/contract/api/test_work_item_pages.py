# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the public API (/api/v1/) work item <-> page link endpoints."""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    APIToken,
    Issue,
    IssuePage,
    Page,
    Project,
    ProjectMember,
    ProjectPage,
    State,
    User,
    Workspace,
    WorkspaceMember,
)

ADMIN, MEMBER, GUEST = 20, 15, 5

PAGINATED_ENVELOPE_KEYS = {
    "grouped_by",
    "sub_grouped_by",
    "total_count",
    "next_cursor",
    "prev_cursor",
    "next_page_results",
    "prev_page_results",
    "count",
    "total_pages",
    "total_results",
    "extra_stats",
    "results",
}

WORK_ITEM_PAGE_KEYS = {
    "id",
    "page",
    "issue",
    "project",
    "workspace",
    "created_at",
    "updated_at",
    "created_by",
}

WORK_ITEM_PAGE_LITE_KEYS = {
    "id",
    "name",
    "created_at",
    "updated_at",
    "created_by",
    "is_global",
    "logo_props",
}


@pytest.fixture(autouse=True)
def _no_side_effects(db):
    with (
        mock.patch("plane.api.views.page.page_transaction"),
        mock.patch("plane.api.views.page.track_page_version"),
        mock.patch("plane.api.views.page.base_host", return_value="http://testserver"),
    ):
        yield


def _make_user(workspace, project, ws_role, project_role=None):
    uid = uuid4().hex[:8]
    user = User.objects.create(email=f"u-{uid}@plane.so", username=f"u_{uid}")
    user.set_password("test-password")
    user.save()
    if ws_role is not None:
        WorkspaceMember.objects.create(workspace=workspace, member=user, role=ws_role, is_active=True)
    if project is not None and project_role is not None:
        ProjectMember.objects.create(
            project=project,
            member=user,
            workspace=workspace,
            role=project_role,
            is_active=True,
        )
    return user


def _client_for(user):
    token = APIToken.objects.create(user=user, label="t", token=f"tok-{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


def _make_project(workspace, owner, identifier, guest_view_all_features=True):
    project = Project.objects.create(
        name=f"Project {identifier}",
        identifier=identifier,
        workspace=workspace,
        created_by=owner,
        guest_view_all_features=guest_view_all_features,
    )
    ProjectMember.objects.create(
        project=project,
        member=owner,
        workspace=workspace,
        role=ADMIN,
        is_active=True,
    )
    State.objects.create(
        name="Todo",
        project=project,
        workspace=workspace,
        group="backlog",
        default=True,
    )
    return project


def _make_issue(project, author, name="Work Item"):
    issue = Issue(name=name, project=project, workspace=project.workspace)
    issue.save(created_by_id=author.id)
    return issue


def _make_page(workspace, project, owner, name="Page", access=Page.PUBLIC_ACCESS):
    page = Page.objects.create(
        workspace=workspace,
        owned_by=owner,
        name=name,
        description_html="<p>Body</p>",
        access=access,
    )
    ProjectPage.objects.create(
        workspace=workspace,
        project=project,
        page=page,
        created_by=owner,
    )
    return page


def _links_url(slug, project_id, issue_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/work-items/{issue_id}/pages/"


def _link_detail_url(slug, project_id, issue_id, link_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/work-items/{issue_id}/pages/{link_id}/"


@pytest.fixture
def own_project(workspace, create_user):
    return _make_project(workspace, create_user, "OWN")


@pytest.fixture
def own_issue(own_project, create_user):
    return _make_issue(own_project, create_user, "Own Work Item")


@pytest.fixture
def own_page(workspace, own_project, create_user):
    return _make_page(workspace, own_project, create_user, "Own Page")


@pytest.fixture
def member_user(workspace, own_project):
    return _make_user(workspace, own_project, MEMBER, MEMBER)


@pytest.fixture
def guest_user(workspace, own_project):
    return _make_user(workspace, own_project, GUEST, GUEST)


@pytest.fixture
def non_member_user(workspace):
    return _make_user(workspace, None, MEMBER, None)


@pytest.fixture
def sibling_bundle(workspace):
    colleague = _make_user(workspace, None, ADMIN, None)
    project = _make_project(workspace, colleague, "SIB")
    issue = _make_issue(project, colleague, "Sibling Issue")
    page = _make_page(workspace, project, colleague, "Sibling Page")
    link = IssuePage.objects.create(issue=issue, page=page, project=project, workspace=workspace)
    return {"project": project, "issue": issue, "page": page, "link": link}


@pytest.fixture
def other_tenant_bundle(db):
    uid = uuid4().hex[:8]
    owner = User.objects.create(email=f"other-{uid}@plane.so", username=f"other_{uid}")
    other_ws = Workspace.objects.create(name="Other", owner=owner, slug=f"other-{uid}")
    WorkspaceMember.objects.create(workspace=other_ws, member=owner, role=ADMIN, is_active=True)
    project = _make_project(other_ws, owner, "OTH")
    issue = _make_issue(project, owner, "Other Issue")
    page = _make_page(other_ws, project, owner, "Other Page")
    link = IssuePage.objects.create(issue=issue, page=page, project=project, workspace=other_ws)
    return {"workspace": other_ws, "project": project, "issue": issue, "page": page, "link": link}


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkItemPagesHappyPath:
    def test_create_list_retrieve_delete_work_item_page_link(
        self, api_key_client, workspace, own_project, own_issue, own_page
    ):
        url = _links_url(workspace.slug, own_project.id, own_issue.id)

        # Create link -> 201
        create_resp = api_key_client.post(url, {"page_id": str(own_page.id)}, format="json")
        assert create_resp.status_code == status.HTTP_201_CREATED, create_resp.content
        link_data = create_resp.json()
        assert set(link_data.keys()) == WORK_ITEM_PAGE_KEYS
        assert set(link_data["page"].keys()) == WORK_ITEM_PAGE_LITE_KEYS
        assert link_data["page"]["id"] == str(own_page.id)
        assert link_data["issue"] == str(own_issue.id)
        assert link_data["project"] == str(own_project.id)
        assert link_data["workspace"] == str(workspace.id)

        # Duplicate link -> returns existing link with 200 OK and does not duplicate row
        dup_resp = api_key_client.post(url, {"page_id": str(own_page.id)}, format="json")
        assert dup_resp.status_code == status.HTTP_200_OK, dup_resp.content
        assert dup_resp.json()["id"] == link_data["id"]
        assert IssuePage.objects.filter(issue=own_issue, page=own_page).count() == 1

        # List links -> paginated envelope
        list_resp = api_key_client.get(url)
        assert list_resp.status_code == status.HTTP_200_OK, list_resp.content
        envelope = list_resp.json()
        assert set(envelope.keys()) == PAGINATED_ENVELOPE_KEYS
        assert envelope["total_count"] == 1
        assert envelope["results"][0]["id"] == link_data["id"]

        # Retrieve link -> 200
        detail_url = _link_detail_url(workspace.slug, own_project.id, own_issue.id, link_data["id"])
        retrieve_resp = api_key_client.get(detail_url)
        assert retrieve_resp.status_code == status.HTTP_200_OK, retrieve_resp.content
        assert set(retrieve_resp.json().keys()) == WORK_ITEM_PAGE_KEYS

        # Delete link -> 204
        delete_resp = api_key_client.delete(detail_url)
        assert delete_resp.status_code == status.HTTP_204_NO_CONTENT
        assert IssuePage.objects.filter(issue=own_issue, page=own_page).count() == 0


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkItemPagesValidationAndVisibility:
    def test_invalid_payloads_return_400(self, api_key_client, workspace, own_project, own_issue):
        url = _links_url(workspace.slug, own_project.id, own_issue.id)
        assert api_key_client.post(url, {}, format="json").status_code == status.HTTP_400_BAD_REQUEST
        assert (
            api_key_client.post(url, {"page_id": "not-a-uuid"}, format="json").status_code
            == status.HTTP_400_BAD_REQUEST
        )
        assert api_key_client.get(f"{url}?pql=name='x'").status_code == status.HTTP_400_BAD_REQUEST

    def test_private_page_owned_by_another_user_cannot_be_linked_or_listed(
        self, api_key_client, workspace, own_project, own_issue, member_user
    ):
        private_page = _make_page(workspace, own_project, member_user, "Secret Page", access=Page.PRIVATE_ACCESS)
        url = _links_url(workspace.slug, own_project.id, own_issue.id)

        # Admin (not the page owner) gets 404 when trying to attach member's private page
        resp = api_key_client.post(url, {"page_id": str(private_page.id)}, format="json")
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        assert IssuePage.objects.filter(issue=own_issue, page=private_page).count() == 0

        # Member (the page owner) can attach their own private page
        member_client = _client_for(member_user)
        ok_resp = member_client.post(url, {"page_id": str(private_page.id)}, format="json")
        assert ok_resp.status_code == status.HTTP_201_CREATED

        # Admin still does not see the private page link in list or detail
        list_resp = api_key_client.get(url)
        assert list_resp.json()["total_count"] == 0
        assert (
            api_key_client.get(
                _link_detail_url(workspace.slug, own_project.id, own_issue.id, ok_resp.json()["id"])
            ).status_code
            == status.HTTP_404_NOT_FOUND
        )


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkItemPagesPermissionsAndScope:
    def test_permission_matrix_admin_member_guest_non_member(
        self,
        api_key_client,
        workspace,
        own_project,
        own_issue,
        own_page,
        member_user,
        guest_user,
        non_member_user,
    ):
        member_client = _client_for(member_user)
        guest_client = _client_for(guest_user)
        non_member_client = _client_for(non_member_user)
        url = _links_url(workspace.slug, own_project.id, own_issue.id)

        # Non-member gets 403 on all operations
        assert non_member_client.get(url).status_code == status.HTTP_403_FORBIDDEN
        assert (
            non_member_client.post(url, {"page_id": str(own_page.id)}, format="json").status_code
            == status.HTTP_403_FORBIDDEN
        )

        # Guest (with guest_view_all_features=True) can read but cannot create or delete links
        assert guest_client.get(url).status_code == status.HTTP_200_OK
        assert (
            guest_client.post(url, {"page_id": str(own_page.id)}, format="json").status_code
            == status.HTTP_403_FORBIDDEN
        )

        # Member can create and delete links
        create_resp = member_client.post(url, {"page_id": str(own_page.id)}, format="json")
        assert create_resp.status_code == status.HTTP_201_CREATED
        link_id = create_resp.json()["id"]
        detail_url = _link_detail_url(workspace.slug, own_project.id, own_issue.id, link_id)

        assert guest_client.get(detail_url).status_code == status.HTTP_200_OK
        assert guest_client.delete(detail_url).status_code == status.HTTP_403_FORBIDDEN
        assert non_member_client.delete(detail_url).status_code == status.HTTP_403_FORBIDDEN
        assert member_client.delete(detail_url).status_code == status.HTTP_204_NO_CONTENT

        # Admin can also create and delete links
        admin_create = api_key_client.post(url, {"page_id": str(own_page.id)}, format="json")
        assert admin_create.status_code == status.HTTP_201_CREATED
        admin_detail_url = _link_detail_url(workspace.slug, own_project.id, own_issue.id, admin_create.json()["id"])
        assert api_key_client.delete(admin_detail_url).status_code == status.HTTP_204_NO_CONTENT

    def test_restricted_guest_can_only_access_own_work_items(
        self, workspace, own_project, own_issue, own_page, guest_user
    ):
        Project.objects.filter(pk=own_project.id).update(guest_view_all_features=False)
        guest_issue = _make_issue(own_project, guest_user, "Guest Work Item")
        foreign_link = IssuePage.objects.create(
            issue=own_issue, page=own_page, project=own_project, workspace=workspace
        )
        own_link = IssuePage.objects.create(issue=guest_issue, page=own_page, project=own_project, workspace=workspace)

        guest_client = _client_for(guest_user)

        # Foreign work item returns 404 on list and detail
        assert (
            guest_client.get(_links_url(workspace.slug, own_project.id, own_issue.id)).status_code
            == status.HTTP_404_NOT_FOUND
        )
        assert (
            guest_client.get(
                _link_detail_url(workspace.slug, own_project.id, own_issue.id, foreign_link.id)
            ).status_code
            == status.HTTP_404_NOT_FOUND
        )

        # Guest's own work item returns 200 on list and detail
        assert (
            guest_client.get(_links_url(workspace.slug, own_project.id, guest_issue.id)).status_code
            == status.HTTP_200_OK
        )
        assert (
            guest_client.get(_link_detail_url(workspace.slug, own_project.id, guest_issue.id, own_link.id)).status_code
            == status.HTTP_200_OK
        )

    @pytest.mark.parametrize("bundle_fixture", ["sibling_bundle", "other_tenant_bundle"])
    def test_cross_project_and_cross_workspace_ids_return_404_with_no_side_effects(
        self,
        request,
        api_key_client,
        workspace,
        own_project,
        own_issue,
        own_page,
        bundle_fixture,
    ):
        bundle = request.getfixturevalue(bundle_fixture)
        foreign_issue = bundle["issue"]
        foreign_page = bundle["page"]
        foreign_link = bundle["link"]

        # Foreign issue_id under own_project URL -> 404
        foreign_issue_url = _links_url(workspace.slug, own_project.id, foreign_issue.id)
        assert api_key_client.get(foreign_issue_url).status_code == status.HTTP_404_NOT_FOUND
        assert (
            api_key_client.post(foreign_issue_url, {"page_id": str(own_page.id)}, format="json").status_code
            == status.HTTP_404_NOT_FOUND
        )

        # Foreign page_id in body on own_issue -> 404
        own_issue_url = _links_url(workspace.slug, own_project.id, own_issue.id)
        assert (
            api_key_client.post(own_issue_url, {"page_id": str(foreign_page.id)}, format="json").status_code
            == status.HTTP_404_NOT_FOUND
        )
        assert IssuePage.objects.filter(issue=own_issue).count() == 0

        # Foreign link pk under own_issue -> 404 and not deleted
        foreign_link_url = _link_detail_url(workspace.slug, own_project.id, own_issue.id, foreign_link.id)
        assert api_key_client.get(foreign_link_url).status_code == status.HTTP_404_NOT_FOUND
        assert api_key_client.delete(foreign_link_url).status_code == status.HTTP_404_NOT_FOUND
        assert IssuePage.objects.filter(pk=foreign_link.pk).exists()
