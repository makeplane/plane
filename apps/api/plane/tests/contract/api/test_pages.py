# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Contract tests for project pages in /api/v1 (fork Liviere/plane, plane/liviere/api).
# Adapted from makeplane/plane#9528 (RemoYukoff) and #9774 (rclod).

from unittest.mock import patch
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Page, Project, ProjectMember, ProjectPage, User
from plane.db.models.api import APIToken
from plane.liviere import live_client
from plane.liviere.live_client import LiveUnavailable
from plane.liviere.pages import API_BLOCK_KEY

VIEWS = "plane.liviere.api.views"

# Yjs state of a page that was opened in the editor, and what the live server returns for an edit
OPENED_BINARY = b"\x01\x02\x03\x04"
LIVE_RESULT = {
    "description_binary": b"\x05\x06\x07\x08",
    "description_html": '<p class="editor-paragraph-block">New</p>',
    "description_json": {"type": "doc", "content": [{"type": "paragraph"}]},
    "update": "dXBkYXRl",
}

# Keys plane-sdk 0.3.1 requires in a paginated response
PAGINATION_KEYS = {
    "total_count",
    "next_cursor",
    "prev_cursor",
    "next_page_results",
    "prev_page_results",
    "count",
    "total_pages",
    "total_results",
    "results",
}


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
        page_view=True,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


def _make_user(prefix):
    unique_id = uuid4().hex[:8]
    user = User.objects.create(
        email=f"{prefix}-{unique_id}@plane.so",
        username=f"{prefix}_{unique_id}",
    )
    user.set_password(uuid4().hex)
    user.save()
    return user


def _client_for(user, project, role):
    ProjectMember.objects.create(project=project, member=user, role=role, is_active=True)
    token = APIToken.objects.create(user=user, label=f"role {role}", token=f"plane_api_{uuid4().hex}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


@pytest.fixture
def other_user(db):
    return _make_user("other")


@pytest.fixture
def member_client(db, project, other_user):
    """API client of a project member (role 15) who is not the admin."""
    return _client_for(other_user, project, 15)


@pytest.fixture
def guest_user(db):
    return _make_user("guest")


@pytest.fixture
def guest_client(db, project, guest_user):
    return _client_for(guest_user, project, 5)


def _make_page(project, owner, access=Page.PUBLIC_ACCESS, **kwargs):
    page = Page.objects.create(
        workspace=project.workspace,
        owned_by=owner,
        access=access,
        name=kwargs.pop("name", "Helper Page"),
        **kwargs,
    )
    ProjectPage.objects.create(workspace=project.workspace, project=project, page=page)
    return page


@pytest.fixture
def live_edit():
    """The live server call; tests of the live path check its arguments."""
    with patch(f"{VIEWS}.apply_page_edit", return_value=LIVE_RESULT) as mock:
        yield mock


def _opened_page(project, owner, **kwargs):
    page = _make_page(project, owner, **kwargs)
    page.description_binary = OPENED_BINARY
    page.save()
    return page


def _list_url(workspace, project):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/pages/"


def _detail_url(workspace, project, page):
    return f"{_list_url(workspace, project)}{page.id}/"


def _archive_url(workspace, project, page):
    return f"{_detail_url(workspace, project, page)}archive/"


@pytest.mark.contract
class TestPageListCreate:
    @pytest.mark.django_db
    def test_create_page(self, api_key_client, workspace, project, create_user, django_capture_on_commit_callbacks):
        payload = {"name": "Spec", "description_html": "<h1>Spec</h1><p>Body</p>", "access": 1}
        with patch(f"{VIEWS}.page_transaction") as mock_transaction:
            with django_capture_on_commit_callbacks(execute=True):
                response = api_key_client.post(_list_url(workspace, project), payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        page = Page.objects.get(pk=response.data["id"])
        assert page.name == "Spec"
        assert page.description_html == "<h1>Spec</h1><p>Body</p>"
        assert page.description_binary is None
        assert page.description_json == {}
        assert page.owned_by_id == create_user.id
        assert page.access == Page.PRIVATE_ACCESS
        assert ProjectPage.objects.filter(page=page, project=project).exists()
        assert response.data["projects"] == [str(project.id)]
        assert response.data["description_html"] == "<h1>Spec</h1><p>Body</p>"
        mock_transaction.delay.assert_called_once()

    @pytest.mark.django_db
    def test_create_requires_name(self, api_key_client, workspace, project):
        response = api_key_client.post(_list_url(workspace, project), {"description_html": "<p>x</p>"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Page.objects.count() == 0

    @pytest.mark.django_db
    def test_create_ignores_server_fields(self, api_key_client, workspace, project, create_user, other_user):
        payload = {
            "name": "Spec",
            "description_html": "<p>x</p>",
            "owned_by": str(other_user.id),
            "archived_at": "2024-01-01",
            "description_binary": "AAAAAAAA",
            "description_json": {"type": "doc"},
            "view_props": {"full_width": True},
        }
        response = api_key_client.post(_list_url(workspace, project), payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        page = Page.objects.get(pk=response.data["id"])
        assert page.owned_by_id == create_user.id
        assert page.archived_at is None
        assert page.description_binary is None
        assert page.description_json == {}
        assert page.view_props == {"full_width": False}

    @pytest.mark.django_db
    def test_create_sanitizes_html(self, api_key_client, workspace, project):
        payload = {"name": "XSS", "description_html": "<p>ok</p><script>alert(1)</script>"}
        response = api_key_client.post(_list_url(workspace, project), payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert "<script" not in Page.objects.get(pk=response.data["id"]).description_html

    @pytest.mark.django_db
    def test_create_external_id_conflict(self, api_key_client, workspace, project):
        payload = {"name": "Imported", "description_html": "<p>x</p>", "external_id": "1", "external_source": "asana"}
        first = api_key_client.post(_list_url(workspace, project), payload, format="json")
        second = api_key_client.post(_list_url(workspace, project), payload, format="json")

        assert first.status_code == status.HTTP_201_CREATED
        assert second.status_code == status.HTTP_409_CONFLICT
        assert second.json()["id"] == first.json()["id"]
        assert Page.objects.count() == 1

    @pytest.mark.django_db
    def test_create_with_parent_id(self, api_key_client, workspace, project, create_user):
        parent = _make_page(project, create_user, name="Parent")
        payload = {"name": "Child", "description_html": "<p>x</p>", "parent_id": str(parent.id)}
        response = api_key_client.post(_list_url(workspace, project), payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["parent_id"] == str(parent.id)
        assert Page.objects.get(pk=response.data["id"]).parent_id == parent.id

    @pytest.mark.django_db
    def test_create_rejects_parent_from_other_project(self, api_key_client, workspace, project, create_user):
        other_project = Project.objects.create(name="Other", identifier="OP", workspace=workspace)
        foreign = _make_page(other_project, create_user, name="Foreign")
        payload = {"name": "Child", "description_html": "<p>x</p>", "parent_id": str(foreign.id)}
        response = api_key_client.post(_list_url(workspace, project), payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "parent_id" in response.data

    @pytest.mark.django_db
    def test_list_pagination_envelope(self, api_key_client, workspace, project, create_user):
        _make_page(project, create_user, name="One")
        response = api_key_client.get(_list_url(workspace, project), {"per_page": 10})

        assert response.status_code == status.HTTP_200_OK
        assert PAGINATION_KEYS <= set(response.data)
        assert response.data["total_count"] == 1
        page = response.data["results"][0]
        for key in ("id", "name", "owned_by", "access", "is_locked", "archived_at", "parent_id", "projects"):
            assert key in page

    @pytest.mark.django_db
    def test_list_visibility(self, api_key_client, workspace, project, create_user, other_user):
        _make_page(project, other_user, access=Page.PRIVATE_ACCESS, name="Their private")
        _make_page(project, other_user, name="Their public")
        _make_page(project, create_user, access=Page.PRIVATE_ACCESS, name="My private")
        parent = _make_page(project, create_user, name="Parent")
        _make_page(project, create_user, name="Nested", parent=parent)
        _make_page(project, create_user, name="Archived", archived_at=timezone.now().date())

        response = api_key_client.get(_list_url(workspace, project))
        names = {page["name"] for page in response.data["results"]}

        assert names == {"Their public", "My private", "Parent", "Nested", "Archived"}

    @pytest.mark.django_db
    def test_list_filter_by_external_id(self, api_key_client, workspace, project, create_user):
        _make_page(project, create_user, name="A", external_id="a", external_source="asana")
        _make_page(project, create_user, name="B", external_id="b", external_source="asana")
        response = api_key_client.get(_list_url(workspace, project), {"external_id": "b"})

        assert [page["name"] for page in response.data["results"]] == ["B"]

    @pytest.mark.django_db
    def test_guest_sees_only_own_pages(self, guest_client, workspace, project, create_user, guest_user):
        _make_page(project, create_user, name="Admin public")
        _make_page(project, guest_user, name="Guest own")

        response = guest_client.get(_list_url(workspace, project))
        assert {page["name"] for page in response.data["results"]} == {"Guest own"}

        project.guest_view_all_features = True
        project.save()
        response = guest_client.get(_list_url(workspace, project))
        assert {page["name"] for page in response.data["results"]} == {"Admin public", "Guest own"}

    @pytest.mark.django_db
    def test_guest_cannot_create(self, guest_client, workspace, project):
        response = guest_client.post(
            _list_url(workspace, project), {"name": "x", "description_html": "<p>x</p>"}, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_non_member_denied(self, workspace, project):
        client = APIClient()
        token = APIToken.objects.create(user=_make_user("outsider"), label="x", token=f"plane_api_{uuid4().hex}")
        client.credentials(HTTP_X_API_KEY=token.token)
        assert client.get(_list_url(workspace, project)).status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
class TestPageDetail:
    @pytest.mark.django_db
    def test_retrieve(self, api_key_client, workspace, project, create_user):
        page = _make_page(project, create_user, name="Doc", description_html="<p>Body</p>")
        response = api_key_client.get(_detail_url(workspace, project, page))

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["id"] == str(page.id)
        assert response.data["description_html"] == "<p>Body</p>"
        assert response.data["projects"] == [str(project.id)]
        assert "description_binary" not in response.data

    @pytest.mark.django_db
    def test_other_users_private_page_hidden(self, api_key_client, workspace, project, other_user):
        page = _make_page(project, other_user, access=Page.PRIVATE_ACCESS)
        response = api_key_client.get(_detail_url(workspace, project, page))
        assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    @pytest.mark.django_db
    def test_put_is_partial(self, api_key_client, workspace, project, create_user, live_edit):
        # Never opened in the editor: no Yjs binary, so the name is written directly
        page = _make_page(project, create_user, name="Old", description_html="<p>Keep</p>")

        response = api_key_client.put(_detail_url(workspace, project, page), {"name": "New"}, format="json")

        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.name == "New"
        assert page.description_html == "<p>Keep</p>"
        assert page.description_binary is None
        live_edit.assert_not_called()

    @pytest.mark.parametrize("method", ["put", "patch"])
    @pytest.mark.django_db
    def test_content_update_resets_editor_state(
        self, method, api_key_client, workspace, project, create_user, django_capture_on_commit_callbacks
    ):
        # Never opened in the editor: no Yjs binary yet
        page = _make_page(project, create_user, description_html="<p>Old</p>", description_json={"type": "doc"})

        with (
            patch(f"{VIEWS}.page_transaction") as mock_transaction,
            patch(f"{VIEWS}.track_page_version") as mock_version,
        ):
            with django_capture_on_commit_callbacks(execute=True):
                response = getattr(api_key_client, method)(
                    _detail_url(workspace, project, page), {"description_html": "<p>New</p>"}, format="json"
                )

        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.description_html == "<p>New</p>"
        assert page.description_binary is None
        assert page.description_json == {}
        assert response.data["description_html"] == "<p>New</p>"
        mock_transaction.delay.assert_called_once()
        mock_version.delay.assert_called_once()
        assert "<p>Old</p>" in mock_version.delay.call_args.kwargs["existing_instance"]

    @pytest.mark.parametrize("method", ["put", "patch"])
    @pytest.mark.django_db
    def test_opened_page_is_edited_through_live(
        self, method, api_key_client, workspace, project, create_user, live_edit, django_capture_on_commit_callbacks
    ):
        page = _opened_page(project, create_user, name="Old", description_html="<p>Old</p>")

        with (
            patch(f"{VIEWS}.page_transaction") as mock_transaction,
            patch(f"{VIEWS}.track_page_version") as mock_version,
            patch(f"{VIEWS}.publish_page_update") as mock_publish,
        ):
            with django_capture_on_commit_callbacks(execute=True):
                response = getattr(api_key_client, method)(
                    _detail_url(workspace, project, page),
                    {"name": "New", "description_html": "<p>New</p><script>x</script>"},
                    format="json",
                )

        assert response.status_code == status.HTTP_200_OK
        # live gets the stored binary and the sanitized HTML
        args, kwargs = live_edit.call_args
        assert args == (page.id, OPENED_BINARY)
        assert kwargs == {"description_html": "<p>New</p>", "name": "New"}
        # the state computed by live is stored in one write, never a cleared binary
        page.refresh_from_db()
        assert page.name == "New"
        assert bytes(page.description_binary) == LIVE_RESULT["description_binary"]
        assert page.description_html == LIVE_RESULT["description_html"]
        assert page.description_json == LIVE_RESULT["description_json"]
        mock_publish.assert_called_once_with(page.id, LIVE_RESULT["update"])
        mock_transaction.delay.assert_called_once()
        mock_version.delay.assert_called_once()

    @pytest.mark.django_db
    def test_opened_page_rename_updates_the_title_through_live(
        self, api_key_client, workspace, project, create_user, live_edit
    ):
        page = _opened_page(project, create_user, name="Old", description_html="<p>Body</p>")

        with patch(f"{VIEWS}.publish_page_update"):
            response = api_key_client.put(_detail_url(workspace, project, page), {"name": "Renamed"}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert live_edit.call_args.kwargs == {"description_html": None, "name": "Renamed"}
        page.refresh_from_db()
        assert page.name == "Renamed"
        assert page.description_html == "<p>Body</p>"
        assert bytes(page.description_binary) == LIVE_RESULT["description_binary"]

    @pytest.mark.django_db
    def test_nothing_written_when_live_is_unavailable(self, api_key_client, workspace, project, create_user, live_edit):
        page = _opened_page(project, create_user, name="Old", description_html="<p>Old</p>")
        live_edit.side_effect = LiveUnavailable("down")

        with patch(f"{VIEWS}.publish_page_update") as mock_publish:
            response = api_key_client.put(
                _detail_url(workspace, project, page), {"name": "New", "description_html": "<p>New</p>"}, format="json"
            )

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        page.refresh_from_db()
        assert page.name == "Old"
        assert page.description_html == "<p>Old</p>"
        assert bytes(page.description_binary) == OPENED_BINARY
        mock_publish.assert_not_called()

    @pytest.mark.django_db
    def test_unchanged_content_keeps_editor_state(self, api_key_client, workspace, project, create_user):
        page = _make_page(project, create_user, description_html="<p>Same</p>")
        page.description_binary = b"\x01\x02\x03\x04"
        page.save()

        response = api_key_client.put(
            _detail_url(workspace, project, page), {"description_html": "<p>Same</p>"}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert bytes(page.description_binary) == b"\x01\x02\x03\x04"

    @pytest.mark.django_db
    def test_locked_page_refused(self, api_key_client, workspace, project, create_user):
        page = _make_page(project, create_user, is_locked=True)

        response = api_key_client.put(_detail_url(workspace, project, page), {"name": "New"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Unlocking is done in the app only
        response = api_key_client.patch(_detail_url(workspace, project, page), {"is_locked": False}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        page.refresh_from_db()
        assert page.is_locked is True

    @pytest.mark.django_db
    def test_api_key_cannot_change_is_locked(self, api_key_client, workspace, project, create_user):
        page = _make_page(project, create_user)

        response = api_key_client.patch(_detail_url(workspace, project, page), {"is_locked": True}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        page.refresh_from_db()
        assert page.is_locked is False

        # Sending the current value is not a change
        response = api_key_client.patch(
            _detail_url(workspace, project, page), {"is_locked": False, "name": "Renamed"}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_archived_page_refused(self, api_key_client, workspace, project, create_user):
        page = _make_page(project, create_user, archived_at=timezone.now().date())
        response = api_key_client.put(
            _detail_url(workspace, project, page), {"description_html": "<p>x</p>"}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_access_change_only_by_owner(self, member_client, workspace, project, create_user, other_user):
        theirs = _make_page(project, create_user)
        response = member_client.patch(_detail_url(workspace, project, theirs), {"access": 1}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        own = _make_page(project, other_user)
        response = member_client.patch(_detail_url(workspace, project, own), {"access": "1"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        own.refresh_from_db()
        assert own.access == Page.PRIVATE_ACCESS

    @pytest.mark.django_db
    def test_parent_cannot_be_descendant(self, api_key_client, workspace, project, create_user):
        parent = _make_page(project, create_user, name="Parent")
        child = _make_page(project, create_user, name="Child", parent=parent)

        response = api_key_client.patch(
            _detail_url(workspace, project, parent), {"parent_id": str(child.id)}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        response = api_key_client.patch(
            _detail_url(workspace, project, parent), {"parent_id": str(parent.id)}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_guest_can_update_own_page_like_ui(self, guest_client, workspace, project, guest_user):
        # ProjectPagePermission lets the owner through whatever the role, as in the UI
        page = _make_page(project, guest_user)
        response = guest_client.put(_detail_url(workspace, project, page), {"name": "x"}, format="json")
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_guest_cannot_update_others_page(self, guest_client, workspace, project, create_user):
        project.guest_view_all_features = True
        project.save()
        page = _make_page(project, create_user)
        response = guest_client.put(_detail_url(workspace, project, page), {"name": "x"}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_delete_requires_archive(self, api_key_client, workspace, project, create_user):
        page = _make_page(project, create_user)

        response = api_key_client.delete(_detail_url(workspace, project, page))
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["error"] == "The page should be archived before deleting"

        assert api_key_client.post(_archive_url(workspace, project, page)).status_code == status.HTTP_200_OK
        assert api_key_client.delete(_detail_url(workspace, project, page)).status_code == status.HTTP_204_NO_CONTENT
        assert not Page.objects.filter(pk=page.id).exists()

    @pytest.mark.django_db
    def test_member_cannot_delete_others_page(self, member_client, workspace, project, create_user):
        page = _make_page(project, create_user, archived_at=timezone.now().date())
        response = member_client.delete(_detail_url(workspace, project, page))
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Page.objects.filter(pk=page.id).exists()


@pytest.mark.contract
class TestPageArchive:
    @pytest.mark.django_db
    def test_archive_and_unarchive_include_descendants(self, api_key_client, workspace, project, create_user):
        parent = _make_page(project, create_user, name="Parent")
        child = _make_page(project, create_user, name="Child", parent=parent)

        response = api_key_client.post(_archive_url(workspace, project, parent))
        assert response.status_code == status.HTTP_200_OK
        parent.refresh_from_db()
        child.refresh_from_db()
        assert parent.archived_at is not None
        assert child.archived_at is not None

        response = api_key_client.delete(_archive_url(workspace, project, parent))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        parent.refresh_from_db()
        child.refresh_from_db()
        assert parent.archived_at is None
        assert child.archived_at is None

    @pytest.mark.django_db
    def test_unarchive_detaches_archived_parent(self, api_key_client, workspace, project, create_user):
        today = timezone.now().date()
        parent = _make_page(project, create_user, name="Parent", archived_at=today)
        child = _make_page(project, create_user, name="Child", parent=parent, archived_at=today)

        response = api_key_client.delete(_archive_url(workspace, project, child))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        child.refresh_from_db()
        assert child.parent_id is None
        assert child.archived_at is None

    @pytest.mark.django_db
    def test_member_cannot_archive_others_page(self, member_client, workspace, project, create_user):
        page = _make_page(project, create_user)
        response = member_client.post(_archive_url(workspace, project, page))
        assert response.status_code == status.HTTP_403_FORBIDDEN
        page.refresh_from_db()
        assert page.archived_at is None


def _block_url(workspace, project, page):
    return f"/api/workspaces/{workspace.slug}/projects/{project.id}/pages/{page.id}/liviere/api-block/"


def _block(page):
    page.view_props = {**page.view_props, API_BLOCK_KEY: True}
    page.save()
    return page


@pytest.mark.contract
class TestApiChangesBlocked:
    @pytest.mark.django_db
    def test_writes_refused_reads_allowed(self, api_key_client, workspace, project, create_user, live_edit):
        page = _block(_opened_page(project, create_user, name="Old", description_html="<p>Old</p>"))

        response = api_key_client.put(
            _detail_url(workspace, project, page), {"name": "New", "description_html": "<p>New</p>"}, format="json"
        )
        assert response.status_code == status.HTTP_409_CONFLICT
        assert "Block API changes" in response.data["error"]
        assert api_key_client.post(_archive_url(workspace, project, page)).status_code == status.HTTP_409_CONFLICT
        live_edit.assert_not_called()

        page.refresh_from_db()
        assert (page.name, page.description_html, page.archived_at) == ("Old", "<p>Old</p>", None)

        response = api_key_client.get(_detail_url(workspace, project, page))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["api_changes_blocked"] is True

    @pytest.mark.django_db
    def test_unarchive_and_delete_refused(self, api_key_client, workspace, project, create_user):
        page = _block(_make_page(project, create_user, archived_at=timezone.now().date()))

        assert api_key_client.delete(_archive_url(workspace, project, page)).status_code == status.HTTP_409_CONFLICT
        assert api_key_client.delete(_detail_url(workspace, project, page)).status_code == status.HTTP_409_CONFLICT
        assert Page.objects.filter(pk=page.id, archived_at__isnull=False).exists()

    @pytest.mark.django_db
    def test_flag_off_by_default(self, api_key_client, workspace, project, create_user):
        page = _make_page(project, create_user)
        response = api_key_client.get(_detail_url(workspace, project, page))
        assert response.data["api_changes_blocked"] is False


@pytest.mark.contract
class TestApiBlockToggle:
    @pytest.mark.django_db
    def test_owner_toggles_in_the_app(self, session_client, workspace, project, create_user):
        page = _make_page(project, create_user)
        page.view_props = {"full_width": True}
        page.save()

        response = session_client.post(_block_url(workspace, project, page))
        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.view_props == {"full_width": True, API_BLOCK_KEY: True}

        response = session_client.delete(_block_url(workspace, project, page))
        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.view_props == {"full_width": True, API_BLOCK_KEY: False}

    @pytest.mark.django_db
    def test_admin_toggles_page_of_another_member(self, session_client, workspace, project, other_user):
        ProjectMember.objects.create(project=project, member=other_user, role=15, is_active=True)
        page = _make_page(project, other_user)

        assert session_client.post(_block_url(workspace, project, page)).status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_member_cannot_toggle_page_of_another_user(self, workspace, project, create_user, other_user):
        ProjectMember.objects.create(project=project, member=other_user, role=15, is_active=True)
        page = _make_page(project, create_user)
        client = APIClient()
        client.force_login(other_user)

        assert client.post(_block_url(workspace, project, page)).status_code == status.HTTP_403_FORBIDDEN
        page.refresh_from_db()
        assert API_BLOCK_KEY not in page.view_props

    @pytest.mark.django_db
    def test_api_key_cannot_reach_the_toggle(self, api_key_client, workspace, project, create_user):
        page = _block(_make_page(project, create_user))

        response = api_key_client.delete(_block_url(workspace, project, page))

        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
        page.refresh_from_db()
        assert page.view_props[API_BLOCK_KEY] is True


@pytest.mark.unit
class TestLiveClient:
    def test_apply_page_edit_request_and_response(self, monkeypatch):
        monkeypatch.setenv("LIVE_SERVER_SECRET_KEY", "test-secret")
        response = patch.object(live_client.requests, "post").start()
        response.return_value.status_code = 200
        response.return_value.json.return_value = {
            "description_binary": "BQYHCA==",
            "description_html": "<p>x</p>",
            "description_json": {"type": "doc"},
            "update": "dXBk",
        }
        try:
            result = live_client.apply_page_edit("page-1", OPENED_BINARY, name="Renamed")
        finally:
            patch.stopall()

        url = response.call_args.args[0]
        assert url.endswith("/liviere/page-edit/")
        assert response.call_args.kwargs["headers"] == {"live-server-secret-key": "test-secret"}
        assert response.call_args.kwargs["json"] == {
            "page_id": "page-1",
            "description_binary": "AQIDBA==",
            "name": "Renamed",
        }
        assert response.call_args.kwargs["timeout"] == live_client.TIMEOUT_SECONDS
        assert result["description_binary"] == b"\x05\x06\x07\x08"

    def test_unavailable_without_secret_or_on_error(self, monkeypatch):
        monkeypatch.delenv("LIVE_SERVER_SECRET_KEY", raising=False)
        with pytest.raises(LiveUnavailable):
            live_client.apply_page_edit("page-1", OPENED_BINARY, name="x")

        monkeypatch.setenv("LIVE_SERVER_SECRET_KEY", "test-secret")
        with patch.object(live_client.requests, "post", side_effect=live_client.requests.ConnectionError()):
            with pytest.raises(LiveUnavailable):
                live_client.apply_page_edit("page-1", OPENED_BINARY, name="x")
        with patch.object(live_client.requests, "post") as post:
            post.return_value.status_code = 500
            with pytest.raises(LiveUnavailable):
                live_client.apply_page_edit("page-1", OPENED_BINARY, name="x")


@pytest.mark.unit
class TestPageVersionTask:
    @pytest.mark.django_db
    def test_version_recorded_after_a_content_change(self, project, create_user):
        # In v1.4.2 the task read Page.description (no such field) and silently recorded nothing
        from plane.bgtasks.page_version_task import track_page_version
        from plane.db.models import PageVersion

        page = _make_page(project, create_user, description_html="<p>New</p>", description_json={"type": "doc"})

        track_page_version(str(page.id), '{"description_html": "<p>Old</p>"}', str(create_user.id))

        version = PageVersion.objects.get(page=page)
        assert version.description_html == "<p>New</p>"
        assert version.description_json == {"type": "doc"}
