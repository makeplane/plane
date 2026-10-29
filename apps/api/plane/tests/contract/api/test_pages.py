# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the public API (/api/v1/) project pages endpoints."""

from unittest import mock
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    APIToken,
    Page,
    Project,
    ProjectMember,
    ProjectPage,
    User,
    UserFavorite,
    UserRecentVisit,
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

PAGE_EXPECTED_KEYS = {
    "id",
    "name",
    "description_html",
    "description_stripped",
    "description",
    "owned_by",
    "access",
    "color",
    "is_locked",
    "archived_at",
    "parent_id",
    "projects",
    "workspace",
    "view_props",
    "logo_props",
    "external_id",
    "external_source",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    "anchor",
    "collection_id",
    "page_collection_id",
}


@pytest.fixture(autouse=True)
def _no_side_effects(db):
    with (
        mock.patch("plane.api.views.page.page_transaction") as mock_tx,
        mock.patch("plane.api.views.page.track_page_version") as mock_ver,
        mock.patch("plane.api.views.page.base_host", return_value="http://testserver"),
    ):
        yield {"page_transaction": mock_tx, "track_page_version": mock_ver}


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
    return project


def _make_page(
    workspace,
    project,
    owner,
    name="Sample Page",
    description_html="<p>Hello world</p>",
    access=Page.PUBLIC_ACCESS,
    parent=None,
    is_locked=False,
    archived_at=None,
):
    page = Page.objects.create(
        workspace=workspace,
        owned_by=owner,
        name=name,
        description_html=description_html,
        access=access,
        parent=parent,
        is_locked=is_locked,
        archived_at=archived_at,
    )
    ProjectPage.objects.create(
        workspace=workspace,
        project=project,
        page=page,
        created_by=owner,
    )
    return page


def _pages_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/"


def _page_detail_url(slug, project_id, page_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/"


def _page_archive_url(slug, project_id, page_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/archive/"


@pytest.fixture
def own_project(workspace, create_user):
    return _make_project(workspace, create_user, "OWN")


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
def sibling_page(workspace):
    colleague = _make_user(workspace, None, ADMIN, None)
    project = _make_project(workspace, colleague, "SIB")
    return _make_page(workspace, project, colleague, name="Sibling Page")


@pytest.fixture
def other_tenant_page(db):
    uid = uuid4().hex[:8]
    owner = User.objects.create(email=f"other-{uid}@plane.so", username=f"other_{uid}")
    other_ws = Workspace.objects.create(name="Other", owner=owner, slug=f"other-{uid}")
    WorkspaceMember.objects.create(workspace=other_ws, member=owner, role=ADMIN, is_active=True)
    project = _make_project(other_ws, owner, "OTH")
    return _make_page(other_ws, project, owner, name="Other Tenant Page")


@pytest.mark.contract
@pytest.mark.django_db
class TestProjectPagesHappyPath:
    def test_create_retrieve_list_response_shape(self, api_key_client, workspace, own_project, _no_side_effects):
        parent_resp = api_key_client.post(
            _pages_url(workspace.slug, own_project.id),
            {
                "name": "Parent Page",
                "description_html": "<p>Parent body<script>alert(1)</script></p>",
                "access": 0,
                "color": "#ff0000",
                "external_id": "ext-1",
                "external_source": "notion",
            },
            format="json",
        )
        assert parent_resp.status_code == status.HTTP_201_CREATED, parent_resp.content
        parent_data = parent_resp.json()
        assert set(parent_data.keys()) == PAGE_EXPECTED_KEYS
        assert "description_binary" not in parent_data
        assert "<script>" not in parent_data["description_html"]
        assert parent_data["projects"] == [str(own_project.id)]
        assert parent_data["anchor"] is None
        assert parent_data["collection_id"] is None
        assert parent_data["page_collection_id"] is None
        assert _no_side_effects["page_transaction"].delay.called

        child_resp = api_key_client.post(
            _pages_url(workspace.slug, own_project.id),
            {
                "name": "Child Page",
                "description_html": "<p>Child body</p>",
                "parent_id": parent_data["id"],
            },
            format="json",
        )
        assert child_resp.status_code == status.HTTP_201_CREATED, child_resp.content
        child_data = child_resp.json()
        assert child_data["parent_id"] == parent_data["id"]

        # Retrieve child page directly
        retrieve_resp = api_key_client.get(_page_detail_url(workspace.slug, own_project.id, child_data["id"]))
        assert retrieve_resp.status_code == status.HTTP_200_OK, retrieve_resp.content
        assert set(retrieve_resp.json().keys()) == PAGE_EXPECTED_KEYS
        assert retrieve_resp.json()["id"] == child_data["id"]

        # List includes both parent and child pages inside paginated envelope
        list_resp = api_key_client.get(_pages_url(workspace.slug, own_project.id))
        assert list_resp.status_code == status.HTTP_200_OK, list_resp.content
        envelope = list_resp.json()
        assert set(envelope.keys()) == PAGINATED_ENVELOPE_KEYS
        assert envelope["total_count"] == 2
        returned_ids = {item["id"] for item in envelope["results"]}
        assert returned_ids == {parent_data["id"], child_data["id"]}

    @pytest.mark.parametrize("method", ["put", "patch"])
    def test_update_page_clears_binary_and_tracks_version(
        self, api_key_client, workspace, own_project, create_user, _no_side_effects, method
    ):
        page = _make_page(workspace, own_project, create_user, name="Initial")
        Page.objects.filter(pk=page.id).update(
            description_binary=b"yjs-state",
            description_json={"type": "doc"},
        )

        caller = getattr(api_key_client, method)
        resp = caller(
            _page_detail_url(workspace.slug, own_project.id, page.id),
            {"name": "Updated", "description_html": "<p>Updated<script>bad()</script></p>"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK, resp.content
        body = resp.json()
        assert set(body.keys()) == PAGE_EXPECTED_KEYS
        assert body["name"] == "Updated"
        assert "<script>" not in body["description_html"]
        assert body["description"] == {}

        page.refresh_from_db()
        assert page.description_binary is None
        assert page.description_json == {}
        assert _no_side_effects["page_transaction"].delay.called
        assert _no_side_effects["track_page_version"].delay.called

    def test_archive_unarchive_and_delete_lifecycle(self, api_key_client, workspace, own_project, create_user):
        parent = _make_page(workspace, own_project, create_user, name="Parent")
        child = _make_page(workspace, own_project, create_user, name="Child", parent=parent)
        UserFavorite.objects.create(
            workspace=workspace,
            project=own_project,
            user=create_user,
            entity_type="page",
            entity_identifier=parent.id,
        )
        UserRecentVisit.objects.create(
            workspace=workspace,
            project=own_project,
            user=create_user,
            entity_name="page",
            entity_identifier=parent.id,
        )

        # Delete before archive is rejected with 400
        del_unarchived = api_key_client.delete(_page_detail_url(workspace.slug, own_project.id, parent.id))
        assert del_unarchived.status_code == status.HTTP_400_BAD_REQUEST
        assert del_unarchived.json()["error"] == "The page should be archived before deleting"

        # Archive parent cascades to child and removes favorite
        arch_resp = api_key_client.post(_page_archive_url(workspace.slug, own_project.id, parent.id))
        assert arch_resp.status_code == status.HTTP_200_OK, arch_resp.content
        parent.refresh_from_db()
        child.refresh_from_db()
        assert parent.archived_at is not None
        assert child.archived_at is not None
        assert not UserFavorite.objects.filter(entity_identifier=parent.id).exists()

        # Default list excludes archived; ?archived=true returns only archived pages
        active_page = _make_page(workspace, own_project, create_user, name="Active")
        list_default = api_key_client.get(_pages_url(workspace.slug, own_project.id))
        assert list_default.json()["total_count"] == 1
        assert {row["id"] for row in list_default.json()["results"]} == {str(active_page.id)}
        list_archived = api_key_client.get(f"{_pages_url(workspace.slug, own_project.id)}?archived=true")
        assert list_archived.json()["total_count"] == 2
        assert {row["id"] for row in list_archived.json()["results"]} == {str(parent.id), str(child.id)}

        # Unarchiving child while parent is archived detaches child from parent
        unarch_child = api_key_client.delete(_page_archive_url(workspace.slug, own_project.id, child.id))
        assert unarch_child.status_code == status.HTTP_204_NO_CONTENT
        child.refresh_from_db()
        assert child.archived_at is None
        assert child.parent_id is None

        # Re-parent child under archived parent to verify delete detaches children
        Page.objects.filter(pk=child.id).update(parent=parent)
        del_resp = api_key_client.delete(_page_detail_url(workspace.slug, own_project.id, parent.id))
        assert del_resp.status_code == status.HTTP_204_NO_CONTENT
        child.refresh_from_db()
        assert child.parent_id is None
        assert not Page.objects.filter(pk=parent.id).exists()
        assert not UserRecentVisit.objects.filter(entity_identifier=parent.id).exists()


@pytest.mark.contract
@pytest.mark.django_db
class TestProjectPagesValidation:
    def test_invalid_create_payloads_return_400(self, api_key_client, workspace, own_project, sibling_page):
        url = _pages_url(workspace.slug, own_project.id)

        # Missing required description_html
        resp = api_key_client.post(url, {"name": "Only Name"}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

        # Missing required name
        resp = api_key_client.post(url, {"description_html": "<p>x</p>"}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

        # Non-null collection_id rejected on CE
        resp = api_key_client.post(
            url,
            {
                "name": "Page",
                "description_html": "<p>x</p>",
                "collection_id": str(uuid4()),
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "Collections are not available on this edition" in str(resp.json())

        # parent_id from another project rejected with 400
        resp = api_key_client.post(
            url,
            {
                "name": "Page",
                "description_html": "<p>x</p>",
                "parent_id": str(sibling_page.id),
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

        # Invalid access value rejected with 400
        resp = api_key_client.post(
            url,
            {"name": "Page", "description_html": "<p>x</p>", "access": 99},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_locked_and_archived_pages_refuse_update_unless_only_is_locked(
        self, api_key_client, workspace, own_project, create_user
    ):
        locked_page = _make_page(workspace, own_project, create_user, name="Locked", is_locked=True)
        url = _page_detail_url(workspace.slug, own_project.id, locked_page.id)

        resp = api_key_client.put(url, {"name": "Blocked"}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert resp.json() == {"error": "Page is locked"}

        # Unlocking via is_locked only succeeds
        unlock_resp = api_key_client.put(url, {"is_locked": False}, format="json")
        assert unlock_resp.status_code == status.HTTP_200_OK
        assert unlock_resp.json()["is_locked"] is False

        # Archived page refuses normal updates
        archived_page = _make_page(
            workspace,
            own_project,
            create_user,
            name="Archived",
            archived_at=timezone.now().date(),
        )
        arch_url = _page_detail_url(workspace.slug, own_project.id, archived_page.id)
        resp = api_key_client.put(arch_url, {"name": "Blocked"}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_non_owner_cannot_change_access(self, workspace, own_project, create_user, member_user):
        page = _make_page(workspace, own_project, create_user, name="Owner Page")
        member_client = _client_for(member_user)
        resp = member_client.put(
            _page_detail_url(workspace.slug, own_project.id, page.id),
            {"access": Page.PRIVATE_ACCESS},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        page.refresh_from_db()
        assert page.access == Page.PUBLIC_ACCESS

    def test_non_owner_put_with_unchanged_access_as_string_succeeds(
        self, workspace, own_project, create_user, member_user
    ):
        page = _make_page(workspace, own_project, create_user, name="Owner Page")
        member_client = _client_for(member_user)
        resp = member_client.put(
            _page_detail_url(workspace.slug, own_project.id, page.id),
            {"access": str(Page.PUBLIC_ACCESS)},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK, resp.content
        page.refresh_from_db()
        assert page.access == Page.PUBLIC_ACCESS

    @pytest.mark.parametrize("parent_kind", ["foreign_private", "archived", "other_project"])
    def test_parent_id_must_be_visible_active_page_of_same_project(
        self, api_key_client, workspace, own_project, create_user, member_user, sibling_page, parent_kind
    ):
        parents = {
            "foreign_private": _make_page(
                workspace, own_project, member_user, name="Private", access=Page.PRIVATE_ACCESS
            ),
            "archived": _make_page(
                workspace, own_project, create_user, name="Archived", archived_at=timezone.now().date()
            ),
            "other_project": sibling_page,
        }
        page_count = Page.objects.count()

        resp = api_key_client.post(
            _pages_url(workspace.slug, own_project.id),
            {
                "name": "Child",
                "description_html": "<p>x</p>",
                "parent_id": str(parents[parent_kind].id),
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST, resp.content
        assert "parent_id" in resp.json()
        assert Page.objects.count() == page_count

    def test_pql_and_filters_rejected_on_list(self, api_key_client, workspace, own_project):
        resp = api_key_client.get(f"{_pages_url(workspace.slug, own_project.id)}?pql=name='x'")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "unsupported_parameters" in resp.json()


@pytest.mark.contract
@pytest.mark.django_db
class TestProjectPagesPermissionsAndScope:
    def test_permission_matrix_admin_member_guest_non_member(
        self,
        api_key_client,
        workspace,
        own_project,
        create_user,
        member_user,
        guest_user,
        non_member_user,
    ):
        page = _make_page(workspace, own_project, create_user, name="Shared Public Page")
        member_client = _client_for(member_user)
        guest_client = _client_for(guest_user)
        non_member_client = _client_for(non_member_user)

        list_url = _pages_url(workspace.slug, own_project.id)
        detail_url = _page_detail_url(workspace.slug, own_project.id, page.id)

        # Non-member is denied on all operations
        assert non_member_client.get(list_url).status_code == status.HTTP_403_FORBIDDEN
        assert (
            non_member_client.post(list_url, {"name": "X", "description_html": "<p>x</p>"}, format="json").status_code
            == status.HTTP_403_FORBIDDEN
        )
        assert non_member_client.get(detail_url).status_code == status.HTTP_403_FORBIDDEN
        assert non_member_client.put(detail_url, {"name": "X"}, format="json").status_code == status.HTTP_403_FORBIDDEN
        assert non_member_client.delete(detail_url).status_code == status.HTTP_403_FORBIDDEN

        # Guest (with guest_view_all_features=True) can read, but cannot create/update/delete
        assert guest_client.get(list_url).status_code == status.HTTP_200_OK
        assert guest_client.get(detail_url).status_code == status.HTTP_200_OK
        assert (
            guest_client.post(list_url, {"name": "X", "description_html": "<p>x</p>"}, format="json").status_code
            == status.HTTP_403_FORBIDDEN
        )
        assert guest_client.put(detail_url, {"name": "X"}, format="json").status_code == status.HTTP_403_FORBIDDEN
        assert guest_client.delete(detail_url).status_code == status.HTTP_403_FORBIDDEN

        # Member can list, retrieve, create, and update public pages, but cannot delete others' pages
        assert member_client.get(list_url).status_code == status.HTTP_200_OK
        assert member_client.get(detail_url).status_code == status.HTTP_200_OK
        member_create = member_client.post(
            list_url, {"name": "Member Page", "description_html": "<p>m</p>"}, format="json"
        )
        assert member_create.status_code == status.HTTP_201_CREATED
        assert (
            member_client.put(detail_url, {"name": "Edited by Member"}, format="json").status_code == status.HTTP_200_OK
        )
        assert member_client.delete(detail_url).status_code == status.HTTP_403_FORBIDDEN

        # Member CAN archive and delete their own page
        own_member_page_id = member_create.json()["id"]
        assert (
            member_client.post(_page_archive_url(workspace.slug, own_project.id, own_member_page_id)).status_code
            == status.HTTP_200_OK
        )
        assert (
            member_client.delete(_page_detail_url(workspace.slug, own_project.id, own_member_page_id)).status_code
            == status.HTTP_204_NO_CONTENT
        )

        # Admin can archive and delete any public page in the project
        assert (
            api_key_client.post(_page_archive_url(workspace.slug, own_project.id, page.id)).status_code
            == status.HTTP_200_OK
        )
        assert api_key_client.delete(detail_url).status_code == status.HTTP_204_NO_CONTENT

    def test_restricted_guest_sees_only_own_pages(self, workspace, own_project, create_user, guest_user):
        Project.objects.filter(pk=own_project.id).update(guest_view_all_features=False)
        foreign_page = _make_page(workspace, own_project, create_user, name="Foreign")
        own_guest_page = _make_page(workspace, own_project, guest_user, name="Guest Own")

        guest_client = _client_for(guest_user)
        list_resp = guest_client.get(_pages_url(workspace.slug, own_project.id))
        assert list_resp.status_code == status.HTTP_200_OK
        ids = {row["id"] for row in list_resp.json()["results"]}
        assert ids == {str(own_guest_page.id)}

        assert (
            guest_client.get(_page_detail_url(workspace.slug, own_project.id, foreign_page.id)).status_code
            == status.HTTP_404_NOT_FOUND
        )
        assert (
            guest_client.get(_page_detail_url(workspace.slug, own_project.id, own_guest_page.id)).status_code
            == status.HTTP_200_OK
        )

    @pytest.mark.parametrize("target_fixture", ["sibling_page", "other_tenant_page"])
    def test_cross_project_and_cross_workspace_page_ids_return_404_with_no_side_effects(
        self, request, api_key_client, workspace, own_project, target_fixture
    ):
        target_page = request.getfixturevalue(target_fixture)
        original_name = target_page.name
        detail_url = _page_detail_url(workspace.slug, own_project.id, target_page.id)
        archive_url = _page_archive_url(workspace.slug, own_project.id, target_page.id)

        assert api_key_client.get(detail_url).status_code == status.HTTP_404_NOT_FOUND
        assert api_key_client.put(detail_url, {"name": "Pwned"}, format="json").status_code == status.HTTP_404_NOT_FOUND
        assert (
            api_key_client.patch(detail_url, {"name": "Pwned"}, format="json").status_code == status.HTTP_404_NOT_FOUND
        )
        assert api_key_client.post(archive_url).status_code == status.HTTP_404_NOT_FOUND
        assert api_key_client.delete(archive_url).status_code == status.HTTP_404_NOT_FOUND
        assert api_key_client.delete(detail_url).status_code == status.HTTP_404_NOT_FOUND

        target_page.refresh_from_db()
        assert target_page.name == original_name
        assert target_page.archived_at is None
        assert target_page.deleted_at is None

    @pytest.mark.parametrize("caller", ["admin", "member"])
    def test_private_page_of_another_user_is_hidden_from_non_owners(
        self, api_key_client, workspace, own_project, member_user, caller
    ):
        owner = _make_user(workspace, own_project, MEMBER, MEMBER)
        private_page = _make_page(workspace, own_project, owner, name="Secret", access=Page.PRIVATE_ACCESS)
        client = api_key_client if caller == "admin" else _client_for(member_user)
        detail_url = _page_detail_url(workspace.slug, own_project.id, private_page.id)
        archive_url = _page_archive_url(workspace.slug, own_project.id, private_page.id)
        denied = (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

        assert client.get(detail_url).status_code in denied
        assert client.put(detail_url, {"name": "Pwned"}, format="json").status_code in denied
        assert client.delete(detail_url).status_code in denied
        assert client.post(archive_url).status_code in denied
        assert client.delete(archive_url).status_code in denied

        private_page.refresh_from_db()
        assert private_page.name == "Secret"
        assert private_page.access == Page.PRIVATE_ACCESS
        assert private_page.archived_at is None
        assert private_page.deleted_at is None

        list_resp = client.get(_pages_url(workspace.slug, own_project.id))
        assert list_resp.status_code == status.HTTP_200_OK
        assert str(private_page.id) not in {row["id"] for row in list_resp.json()["results"]}

    def test_member_owner_can_unarchive_own_page(self, workspace, own_project, member_user):
        page = _make_page(workspace, own_project, member_user, name="Mine", archived_at=timezone.now().date())
        member_client = _client_for(member_user)

        resp = member_client.delete(_page_archive_url(workspace.slug, own_project.id, page.id))
        assert resp.status_code == status.HTTP_204_NO_CONTENT, resp.content
        page.refresh_from_db()
        assert page.archived_at is None

    def test_archive_cascade_does_not_reach_children_in_other_projects(
        self, api_key_client, workspace, own_project, create_user, sibling_page
    ):
        parent = _make_page(workspace, own_project, create_user, name="Parent")
        own_child = _make_page(workspace, own_project, create_user, name="Own child", parent=parent)
        # A child linked only to another project, reparented under our page.
        foreign_child = Page.objects.get(pk=sibling_page.pk)
        foreign_child.parent = parent
        foreign_child.save()

        resp = api_key_client.post(_page_archive_url(workspace.slug, own_project.id, parent.id))
        assert resp.status_code == status.HTTP_200_OK, resp.content

        parent.refresh_from_db()
        own_child.refresh_from_db()
        foreign_child.refresh_from_db()
        assert parent.archived_at is not None
        assert own_child.archived_at is not None
        assert foreign_child.archived_at is None

    def test_projects_only_lists_projects_the_caller_belongs_to(
        self, api_key_client, workspace, own_project, create_user, sibling_page
    ):
        page = _make_page(workspace, own_project, create_user, name="Shared")
        ProjectPage.objects.create(workspace=workspace, project=sibling_page.projects.first(), page=page)

        resp = api_key_client.get(_page_detail_url(workspace.slug, own_project.id, page.id))
        assert resp.status_code == status.HTTP_200_OK, resp.content
        assert resp.json()["projects"] == [str(own_project.id)]


@pytest.mark.contract
@pytest.mark.django_db
class TestPageCreateAtomicity:
    def test_failed_project_link_does_not_leave_orphan_page(self, api_key_client, workspace, own_project):
        page_count = Page.objects.count()
        with mock.patch.object(ProjectPage.objects, "create", side_effect=RuntimeError("db down")):
            api_key_client.raise_request_exception = False
            resp = api_key_client.post(
                _pages_url(workspace.slug, own_project.id),
                {"name": "Orphan?", "description_html": "<p>x</p>"},
                format="json",
            )
        assert resp.status_code >= 500
        assert Page.objects.count() == page_count
