# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the public v1 project page endpoints.

Covers the full CRUD + archive/lock surface, HTML sanitization, `page` webhook
dispatch, and — most importantly — a complete private-page access matrix that
exercises every verb from every relevant vantage point (owner, other project
member, workspace member not in the project, and guest).
"""

from datetime import date
from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    APIToken,
    Page,
    Project,
    ProjectMember,
    ProjectPage,
    User,
    Webhook,
    WorkspaceMember,
)


# ---------------------------------------------------------------------------
# Helpers & fixtures
# ---------------------------------------------------------------------------


def _make_user(prefix):
    """Create and return an active user with a unique identity."""
    uid = uuid4().hex[:8]
    user = User.objects.create(
        email=f"{prefix}-{uid}@plane.so",
        username=f"{prefix}_{uid}",
        first_name=prefix.capitalize(),
        last_name="User",
    )
    user.set_password("test-password")
    user.save()
    return user


def _api_client_for(user):
    """Build an X-Api-Key authenticated client for the given user."""
    token = APIToken.objects.create(user=user, label=f"tok-{uuid4().hex[:6]}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


def _assert_parent_error(response):
    """Assert a 400 body identifies the parent field, in either error shape.

    A malformed UUID is rejected by the serializer field (``{"parent": [...]}``);
    a well-formed but out-of-scope parent is rejected by the view
    (``{"error": "The parent page ..."}``). Both must name the parent so an
    unrelated 400 cannot satisfy the assertion.
    """
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    if "parent" in response.data:
        return
    assert "parent" in str(response.data.get("error", "")).lower()


def _link_page(project, page, user):
    """Attach a page to a project through the ProjectPage join model."""
    ProjectPage.objects.create(
        workspace=project.workspace,
        project=project,
        page=page,
        created_by_id=user.id,
        updated_by_id=user.id,
    )


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the token user (owner) as an admin member."""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,  # Admin
        is_active=True,
    )
    return project


@pytest.fixture
def actors(db, workspace, project, create_user):
    """Build the four access-matrix vantage points, each with its own client.

    - ``owner``: the page owner (also the ``api_key_client`` user), project admin
    - ``member``: a different active project member (role 15)
    - ``ws_only``: a workspace member who is NOT a member of the project
    - ``guest``: an active project member with the guest role (role 5)
    """
    member = _make_user("member")
    WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)
    ProjectMember.objects.create(project=project, member=member, role=15, is_active=True)

    ws_only = _make_user("wsonly")
    WorkspaceMember.objects.create(workspace=workspace, member=ws_only, role=15)

    guest = _make_user("guest")
    WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5)
    ProjectMember.objects.create(project=project, member=guest, role=5, is_active=True)

    return {
        "owner": {"user": create_user, "client": _api_client_for(create_user)},
        "member": {"user": member, "client": _api_client_for(member)},
        "ws_only": {"user": ws_only, "client": _api_client_for(ws_only)},
        "guest": {"user": guest, "client": _api_client_for(guest)},
    }


@pytest.fixture
def other_user(db):
    """Create a second user for ownership tests."""
    return _make_user("other")


@pytest.fixture
def create_page(db, project, create_user):
    """Create a public page owned by the token user."""
    page = Page.objects.create(
        name="Existing Page",
        description_html="<p>Test content</p>",
        owned_by=create_user,
        workspace=project.workspace,
        access=Page.PUBLIC_ACCESS,
    )
    _link_page(project, page, create_user)
    return page


@pytest.fixture
def private_page(db, project, create_user):
    """Create a private page owned by the token user (owner)."""
    page = Page.objects.create(
        name="Private Page",
        description_html="<p>Secret content</p>",
        owned_by=create_user,
        workspace=project.workspace,
        access=Page.PRIVATE_ACCESS,
    )
    _link_page(project, page, create_user)
    return page


@pytest.fixture
def public_page(db, project, create_user):
    """Create a public page owned by the token user (owner)."""
    page = Page.objects.create(
        name="Public Page",
        description_html="<p>Public content</p>",
        owned_by=create_user,
        workspace=project.workspace,
        access=Page.PUBLIC_ACCESS,
    )
    _link_page(project, page, create_user)
    return page


@pytest.fixture
def archived_page(db, project, create_user):
    """Create an archived public page owned by the token user."""
    page = Page.objects.create(
        name="Archived Page",
        description_html="<p>Archived content</p>",
        owned_by=create_user,
        workspace=project.workspace,
        access=Page.PUBLIC_ACCESS,
        archived_at=date.today(),
    )
    _link_page(project, page, create_user)
    return page


@pytest.fixture
def locked_page(db, project, create_user):
    """Create a locked public page owned by the token user."""
    page = Page.objects.create(
        name="Locked Page",
        description_html="<p>Locked content</p>",
        owned_by=create_user,
        workspace=project.workspace,
        access=Page.PUBLIC_ACCESS,
        is_locked=True,
    )
    _link_page(project, page, create_user)
    return page


# ---------------------------------------------------------------------------
# List & Create
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestPageListCreateAPIEndpoint:
    """Test Page List and Create API Endpoint."""

    def list_url(self, slug, project_id):
        """Return the page list/create URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/"

    @pytest.mark.django_db
    def test_unauthenticated_request(self, api_client, workspace, project):
        """Unauthenticated requests (no API key) are rejected.

        APIKeyAuthentication does not set a WWW-Authenticate header, so DRF may
        surface the missing credential as either 401 or 403.
        """
        url = self.list_url(workspace.slug, project.id)
        response = api_client.get(url)
        assert response.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )

    @pytest.mark.django_db
    def test_list_pages_success(self, api_key_client, workspace, project, create_page):
        """200 with paginated results on list."""
        url = self.list_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert len(response.data["results"]) >= 1

    @pytest.mark.django_db
    def test_list_pages_excludes_archived_by_default(
        self, api_key_client, workspace, project, create_page, archived_page
    ):
        """Archived pages are excluded from the default list."""
        url = self.list_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        page_ids = [str(p["id"]) for p in response.data["results"]]
        assert str(create_page.id) in page_ids
        assert str(archived_page.id) not in page_ids

    @pytest.mark.django_db
    def test_list_type_archived(self, api_key_client, workspace, project, create_page, archived_page):
        """type=archived returns only archived pages."""
        url = self.list_url(workspace.slug, project.id) + "?type=archived"
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        page_ids = [str(p["id"]) for p in response.data["results"]]
        assert str(archived_page.id) in page_ids
        assert str(create_page.id) not in page_ids

    @pytest.mark.django_db
    def test_list_type_public_and_private(self, api_key_client, workspace, project, public_page, private_page):
        """type=public / type=private partition pages by access."""
        base = self.list_url(workspace.slug, project.id)

        public = api_key_client.get(base + "?type=public")
        public_ids = [str(p["id"]) for p in public.data["results"]]
        assert str(public_page.id) in public_ids
        assert str(private_page.id) not in public_ids

        private = api_key_client.get(base + "?type=private")
        private_ids = [str(p["id"]) for p in private.data["results"]]
        assert str(private_page.id) in private_ids
        assert str(public_page.id) not in private_ids

    @pytest.mark.django_db
    def test_list_search_by_name(self, api_key_client, workspace, project, create_user):
        """search= filters pages by name (case-insensitive contains)."""
        matching = Page.objects.create(
            name="Roadmap Q3",
            owned_by=create_user,
            workspace=project.workspace,
        )
        _link_page(project, matching, create_user)
        other = Page.objects.create(
            name="Meeting Notes",
            owned_by=create_user,
            workspace=project.workspace,
        )
        _link_page(project, other, create_user)

        url = self.list_url(workspace.slug, project.id) + "?search=roadmap"
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        page_ids = [str(p["id"]) for p in response.data["results"]]
        assert str(matching.id) in page_ids
        assert str(other.id) not in page_ids

    @pytest.mark.django_db
    def test_create_page_success(self, api_key_client, workspace, project):
        """201 on successful page creation with ProjectPage created."""
        url = self.list_url(workspace.slug, project.id)
        data = {"name": "New Page", "description_html": "<p>Hello world</p>"}

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Page"
        # Binary/Yjs fields never cross the serializer contract.
        assert "description_binary" not in response.data
        assert "description_json" not in response.data

        page = Page.objects.get(pk=response.data["id"])
        assert page.description_binary is None
        assert ProjectPage.objects.filter(page=page, project=project).exists()

    @pytest.mark.django_db
    def test_create_page_sanitizes_description_html(self, api_key_client, workspace, project):
        """description_html is sanitized on write (script tags stripped)."""
        url = self.list_url(workspace.slug, project.id)
        data = {
            "name": "XSS Page",
            "description_html": "<p>safe</p><script>alert('x')</script>",
        }

        response = api_key_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        page = Page.objects.get(pk=response.data["id"])
        assert "<script>" not in page.description_html
        assert "safe" in page.description_html

    @pytest.mark.django_db
    def test_create_page_with_external_id(self, api_key_client, workspace, project):
        """201 on creation with external_id, 409 on duplicate."""
        url = self.list_url(workspace.slug, project.id)
        data = {
            "name": "External Page",
            "external_id": "ext-page-1",
            "external_source": "notion",
        }

        response = api_key_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["external_id"] == "ext-page-1"

        dup_data = {
            "name": "Duplicate Page",
            "external_id": "ext-page-1",
            "external_source": "notion",
        }
        response2 = api_key_client.post(url, dup_data, format="json")
        assert response2.status_code == status.HTTP_409_CONFLICT
        assert "same external id" in response2.data["error"]

    @pytest.mark.django_db
    def test_create_page_dispatches_page_webhook(self, api_key_client, workspace, project):
        """Create flows through the model_activity -> page webhook path."""
        url = self.list_url(workspace.slug, project.id)
        with mock.patch("plane.api.views.page.model_activity") as m:
            response = api_key_client.post(url, {"name": "Hooked"}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        m.delay.assert_called_once()
        assert m.delay.call_args.kwargs["model_name"] == "page"


# ---------------------------------------------------------------------------
# Retrieve, Update & Delete
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestPageDetailAPIEndpoint:
    """Test Page Detail API Endpoint."""

    def detail_url(self, slug, project_id, page_id):
        """Return the page detail URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/"

    @pytest.mark.django_db
    def test_retrieve_page(self, api_key_client, workspace, project, create_page):
        """200 on successful retrieval."""
        url = self.detail_url(workspace.slug, project.id, create_page.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(create_page.id)
        assert response.data["name"] == create_page.name

    @pytest.mark.django_db
    def test_retrieve_page_not_found(self, api_key_client, workspace, project):
        """404 for non-existent page."""
        url = self.detail_url(workspace.slug, project.id, uuid4())
        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_update_page_success(self, api_key_client, workspace, project, create_page):
        """200 on successful update with description_html."""
        url = self.detail_url(workspace.slug, project.id, create_page.id)
        data = {
            "name": "Updated Page Name",
            "description_html": "<p>Updated content</p>",
        }

        response = api_key_client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        create_page.refresh_from_db()
        assert create_page.name == "Updated Page Name"
        assert create_page.description_html == "<p>Updated content</p>"
        assert create_page.description_binary is None

    @pytest.mark.django_db
    def test_update_page_sanitizes_description_html(self, api_key_client, workspace, project, create_page):
        """Update sanitizes description_html with the internal sanitizer."""
        url = self.detail_url(workspace.slug, project.id, create_page.id)
        data = {"description_html": "<p>ok</p><script>alert(1)</script>"}

        response = api_key_client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        create_page.refresh_from_db()
        assert "<script>" not in create_page.description_html
        assert "ok" in create_page.description_html

    @pytest.mark.django_db
    def test_update_locked_page(self, api_key_client, workspace, project, locked_page):
        """400 when trying to update a locked page."""
        url = self.detail_url(workspace.slug, project.id, locked_page.id)
        response = api_key_client.patch(url, {"name": "Nope"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "locked" in response.data["error"].lower()

    @pytest.mark.django_db
    def test_update_archived_page(self, api_key_client, workspace, project, archived_page):
        """400 when trying to update an archived page."""
        url = self.detail_url(workspace.slug, project.id, archived_page.id)
        response = api_key_client.patch(url, {"name": "Nope"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "archived" in response.data["error"].lower()

    @pytest.mark.django_db
    def test_non_owner_cannot_change_access(self, api_key_client, workspace, project, other_user):
        """403 when a non-owner tries to change a public page's access."""
        page = Page.objects.create(
            name="Other's Page",
            description_html="<p>content</p>",
            owned_by=other_user,
            workspace=project.workspace,
            access=Page.PUBLIC_ACCESS,
        )
        _link_page(project, page, other_user)

        url = self.detail_url(workspace.slug, project.id, page.id)
        response = api_key_client.patch(url, {"access": 1}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_update_dispatches_page_webhook(self, api_key_client, workspace, project, create_page):
        """Update flows through the model_activity -> page webhook path."""
        url = self.detail_url(workspace.slug, project.id, create_page.id)
        with mock.patch("plane.api.views.page.model_activity") as m:
            response = api_key_client.patch(url, {"name": "Hooked"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        m.delay.assert_called_once()
        assert m.delay.call_args.kwargs["model_name"] == "page"

    @pytest.mark.django_db
    def test_delete_requires_archived(self, api_key_client, workspace, project, create_page):
        """400 when trying to delete a non-archived page."""
        url = self.detail_url(workspace.slug, project.id, create_page.id)
        response = api_key_client.delete(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "archived" in response.data["error"].lower()

    @pytest.mark.django_db
    def test_delete_archived_page_success(self, api_key_client, workspace, project, archived_page):
        """204 when deleting an archived page owned by the user + webhook fired."""
        url = self.detail_url(workspace.slug, project.id, archived_page.id)
        with mock.patch("plane.api.views.page.webhook_activity") as m:
            response = api_key_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Page.objects.filter(id=archived_page.id).exists()
        m.delay.assert_called_once()
        assert m.delay.call_args.kwargs["event"] == "page"
        assert m.delay.call_args.kwargs["verb"] == "deleted"

    @pytest.mark.django_db
    def test_delete_by_non_owner_non_admin(self, api_key_client, workspace, project, other_user, create_user):
        """403 when a non-owner, non-admin member tries to delete."""
        page = Page.objects.create(
            name="Other's Archived Page",
            description_html="<p>content</p>",
            owned_by=other_user,
            workspace=project.workspace,
            access=Page.PUBLIC_ACCESS,
            archived_at=date.today(),
        )
        _link_page(project, page, other_user)

        # Demote the token user from admin to member.
        ProjectMember.objects.filter(project=project, member=create_user).update(role=15)

        url = self.detail_url(workspace.slug, project.id, page.id)
        response = api_key_client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN


# ---------------------------------------------------------------------------
# Archive / Unarchive
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestPageArchiveAPIEndpoint:
    """Test Page Archive and Unarchive API Endpoint."""

    def archive_url(self, slug, project_id, page_id):
        """Return the page archive/unarchive URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/archive/"

    @pytest.mark.django_db
    def test_archive_page(self, api_key_client, workspace, project, create_page):
        """200 on successful archive."""
        url = self.archive_url(workspace.slug, project.id, create_page.id)
        response = api_key_client.post(url, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert "archived_at" in response.data
        create_page.refresh_from_db()
        assert create_page.archived_at is not None

    @pytest.mark.django_db
    def test_unarchive_page(self, api_key_client, workspace, project, archived_page):
        """204 on successful unarchive."""
        url = self.archive_url(workspace.slug, project.id, archived_page.id)
        response = api_key_client.delete(url, format="json")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        archived_page.refresh_from_db()
        assert archived_page.archived_at is None

    @pytest.mark.django_db
    def test_archive_dispatches_page_webhook(self, api_key_client, workspace, project, create_page):
        """Archive flows through the model_activity -> page webhook path."""
        url = self.archive_url(workspace.slug, project.id, create_page.id)
        with mock.patch("plane.api.views.page.model_activity") as m:
            response = api_key_client.post(url, format="json")
        assert response.status_code == status.HTTP_200_OK
        m.delay.assert_called_once()
        assert m.delay.call_args.kwargs["model_name"] == "page"

    @pytest.mark.django_db
    def test_unarchive_dispatches_page_webhook(self, api_key_client, workspace, project, archived_page):
        """Unarchive flows through the model_activity -> page webhook path."""
        url = self.archive_url(workspace.slug, project.id, archived_page.id)
        with mock.patch("plane.api.views.page.model_activity") as m:
            response = api_key_client.delete(url, format="json")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        m.delay.assert_called_once()
        assert m.delay.call_args.kwargs["model_name"] == "page"


# ---------------------------------------------------------------------------
# Lock / Unlock
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestPageLockAPIEndpoint:
    """Test Page Lock and Unlock API Endpoint."""

    def lock_url(self, slug, project_id, page_id):
        """Return the page lock/unlock URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/lock/"

    @pytest.mark.django_db
    def test_lock_page(self, api_key_client, workspace, project, create_page):
        """200 on successful lock by owner."""
        url = self.lock_url(workspace.slug, project.id, create_page.id)
        response = api_key_client.post(url, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_locked"] is True
        create_page.refresh_from_db()
        assert create_page.is_locked is True

    @pytest.mark.django_db
    def test_unlock_page(self, api_key_client, workspace, project, locked_page):
        """200 on successful unlock by owner."""
        url = self.lock_url(workspace.slug, project.id, locked_page.id)
        response = api_key_client.delete(url, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_locked"] is False
        locked_page.refresh_from_db()
        assert locked_page.is_locked is False

    @pytest.mark.django_db
    def test_lock_by_non_owner(self, api_key_client, workspace, project, other_user):
        """403 when a non-owner tries to lock a public page."""
        page = Page.objects.create(
            name="Other's Page",
            description_html="<p>content</p>",
            owned_by=other_user,
            workspace=project.workspace,
            access=Page.PUBLIC_ACCESS,
        )
        _link_page(project, page, other_user)

        url = self.lock_url(workspace.slug, project.id, page.id)
        response = api_key_client.post(url, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_lock_dispatches_page_webhook(self, api_key_client, workspace, project, create_page):
        """Lock flows through the model_activity -> page webhook path."""
        url = self.lock_url(workspace.slug, project.id, create_page.id)
        with mock.patch("plane.api.views.page.model_activity") as m:
            response = api_key_client.post(url, format="json")
        assert response.status_code == status.HTTP_200_OK
        m.delay.assert_called_once()
        assert m.delay.call_args.kwargs["model_name"] == "page"

    @pytest.mark.django_db
    def test_unlock_dispatches_page_webhook(self, api_key_client, workspace, project, locked_page):
        """Unlock flows through the model_activity -> page webhook path."""
        url = self.lock_url(workspace.slug, project.id, locked_page.id)
        with mock.patch("plane.api.views.page.model_activity") as m:
            response = api_key_client.delete(url, format="json")
        assert response.status_code == status.HTTP_200_OK
        m.delay.assert_called_once()
        assert m.delay.call_args.kwargs["model_name"] == "page"


# ---------------------------------------------------------------------------
# Private-page access matrix
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestPrivatePageAccessMatrix:
    """A private page is visible/editable ONLY to its owner.

    Every verb is exercised from four vantage points against a private page
    owned by ``owner``:

    - ``owner`` — full access
    - ``member`` — a different active project member: private page is invisible,
      so lookups 404 (its existence is never leaked); writes it is allowed to
      attempt (403 only when the queryset can't find it -> 404)
    - ``ws_only`` — a workspace member who is not in the project: 403 on every
      verb (project membership is required)
    - ``guest`` — an active project guest: may read (but the private page is
      invisible -> 404) and is denied all writes (403)
    """

    def detail_url(self, slug, project_id, page_id):
        """Return the page detail URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/"

    def archive_url(self, slug, project_id, page_id):
        """Return the page archive/unarchive URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/archive/"

    def lock_url(self, slug, project_id, page_id):
        """Return the page lock/unlock URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/lock/"

    def list_url(self, slug, project_id):
        """Return the page list/create URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/"

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "actor,expected",
        [
            ("owner", status.HTTP_200_OK),
            ("member", status.HTTP_404_NOT_FOUND),
            ("ws_only", status.HTTP_403_FORBIDDEN),
            ("guest", status.HTTP_404_NOT_FOUND),
        ],
    )
    def test_retrieve(self, workspace, project, private_page, actors, actor, expected):
        """GET resolves per vantage point: the private page is invisible to non-owners."""
        client = actors[actor]["client"]
        url = self.detail_url(workspace.slug, project.id, private_page.id)
        assert client.get(url).status_code == expected

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "actor,expected",
        [
            ("owner", status.HTTP_200_OK),
            ("member", status.HTTP_404_NOT_FOUND),
            ("ws_only", status.HTTP_403_FORBIDDEN),
            ("guest", status.HTTP_403_FORBIDDEN),
        ],
    )
    def test_update(self, workspace, project, private_page, actors, actor, expected):
        """PATCH per vantage point: the private page is invisible to non-owners."""
        client = actors[actor]["client"]
        url = self.detail_url(workspace.slug, project.id, private_page.id)
        assert client.patch(url, {"name": "Edited"}, format="json").status_code == expected

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "actor,expected",
        [
            ("owner", status.HTTP_200_OK),
            ("member", status.HTTP_404_NOT_FOUND),
            ("ws_only", status.HTTP_403_FORBIDDEN),
            ("guest", status.HTTP_403_FORBIDDEN),
        ],
    )
    def test_archive(self, workspace, project, private_page, actors, actor, expected):
        """POST /archive/ per vantage point on the private page."""
        client = actors[actor]["client"]
        url = self.archive_url(workspace.slug, project.id, private_page.id)
        assert client.post(url, format="json").status_code == expected

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "actor,expected",
        [
            ("owner", status.HTTP_200_OK),
            ("member", status.HTTP_404_NOT_FOUND),
            ("ws_only", status.HTTP_403_FORBIDDEN),
            ("guest", status.HTTP_403_FORBIDDEN),
        ],
    )
    def test_lock(self, workspace, project, private_page, actors, actor, expected):
        """POST /lock/ per vantage point on the private page."""
        client = actors[actor]["client"]
        url = self.lock_url(workspace.slug, project.id, private_page.id)
        assert client.post(url, format="json").status_code == expected

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "actor,expected",
        [
            ("owner", status.HTTP_204_NO_CONTENT),
            ("member", status.HTTP_404_NOT_FOUND),
            ("ws_only", status.HTTP_403_FORBIDDEN),
            ("guest", status.HTTP_403_FORBIDDEN),
        ],
    )
    def test_unarchive(self, workspace, project, create_user, actors, actor, expected):
        # A private, archived page owned by the owner.
        """DELETE /archive/ per vantage point on the private page."""
        page = Page.objects.create(
            name="Private Archived",
            description_html="<p>secret</p>",
            owned_by=create_user,
            workspace=project.workspace,
            access=Page.PRIVATE_ACCESS,
            archived_at=date.today(),
        )
        _link_page(project, page, create_user)

        client = actors[actor]["client"]
        url = self.archive_url(workspace.slug, project.id, page.id)
        assert client.delete(url, format="json").status_code == expected

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "actor,expected",
        [
            ("owner", status.HTTP_200_OK),
            ("member", status.HTTP_404_NOT_FOUND),
            ("ws_only", status.HTTP_403_FORBIDDEN),
            ("guest", status.HTTP_403_FORBIDDEN),
        ],
    )
    def test_unlock(self, workspace, project, create_user, actors, actor, expected):
        # A private, locked page owned by the owner.
        """DELETE /lock/ per vantage point on the private page."""
        page = Page.objects.create(
            name="Private Locked",
            description_html="<p>secret</p>",
            owned_by=create_user,
            workspace=project.workspace,
            access=Page.PRIVATE_ACCESS,
            is_locked=True,
        )
        _link_page(project, page, create_user)

        client = actors[actor]["client"]
        url = self.lock_url(workspace.slug, project.id, page.id)
        assert client.delete(url, format="json").status_code == expected

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "actor,expected",
        [
            ("owner", status.HTTP_204_NO_CONTENT),
            ("member", status.HTTP_404_NOT_FOUND),
            ("ws_only", status.HTTP_403_FORBIDDEN),
            ("guest", status.HTTP_403_FORBIDDEN),
        ],
    )
    def test_delete(self, workspace, project, create_user, actors, actor, expected):
        # A private, already-archived page owned by the owner.
        """DELETE per vantage point on an archived private page."""
        page = Page.objects.create(
            name="Private Archived",
            description_html="<p>secret</p>",
            owned_by=create_user,
            workspace=project.workspace,
            access=Page.PRIVATE_ACCESS,
            archived_at=date.today(),
        )
        _link_page(project, page, create_user)

        client = actors[actor]["client"]
        url = self.detail_url(workspace.slug, project.id, page.id)
        assert client.delete(url).status_code == expected

    @pytest.mark.django_db
    def test_list_visibility(self, workspace, project, private_page, actors):
        """A private page appears only in the owner's list; others never see it."""
        url = self.list_url(workspace.slug, project.id)

        # Owner sees it.
        owner_resp = actors["owner"]["client"].get(url)
        assert owner_resp.status_code == status.HTTP_200_OK
        assert str(private_page.id) in [str(p["id"]) for p in owner_resp.data["results"]]

        # Other project member: 200 but the private page is absent.
        member_resp = actors["member"]["client"].get(url)
        assert member_resp.status_code == status.HTTP_200_OK
        assert str(private_page.id) not in [str(p["id"]) for p in member_resp.data["results"]]

        # Guest: 200 but the private page is absent.
        guest_resp = actors["guest"]["client"].get(url)
        assert guest_resp.status_code == status.HTTP_200_OK
        assert str(private_page.id) not in [str(p["id"]) for p in guest_resp.data["results"]]

        # Workspace member not in project: denied entirely.
        assert actors["ws_only"]["client"].get(url).status_code == status.HTTP_403_FORBIDDEN


# ---------------------------------------------------------------------------
# Public-page access matrix (public pages follow project membership)
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestPublicPageAccessMatrix:
    """A public page follows project membership.

    Members may read, update, and archive it; locking stays owner-only; guests
    are read-only; and a workspace member not in the project is denied.
    """

    def detail_url(self, slug, project_id, page_id):
        """Return the page detail URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/"

    def archive_url(self, slug, project_id, page_id):
        """Return the page archive/unarchive URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/archive/"

    def lock_url(self, slug, project_id, page_id):
        """Return the page lock/unlock URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/lock/"

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "actor,expected",
        [
            ("owner", status.HTTP_200_OK),
            ("member", status.HTTP_200_OK),
            ("ws_only", status.HTTP_403_FORBIDDEN),
            ("guest", status.HTTP_200_OK),
        ],
    )
    def test_retrieve(self, workspace, project, public_page, actors, actor, expected):
        """GET resolves per vantage point: the public page follows project membership."""
        client = actors[actor]["client"]
        url = self.detail_url(workspace.slug, project.id, public_page.id)
        assert client.get(url).status_code == expected

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "actor,expected",
        [
            ("owner", status.HTTP_200_OK),
            ("member", status.HTTP_200_OK),
            ("ws_only", status.HTTP_403_FORBIDDEN),
            ("guest", status.HTTP_403_FORBIDDEN),
        ],
    )
    def test_update(self, workspace, project, public_page, actors, actor, expected):
        """PATCH per vantage point: the public page follows project membership."""
        client = actors[actor]["client"]
        url = self.detail_url(workspace.slug, project.id, public_page.id)
        assert client.patch(url, {"name": "Edited"}, format="json").status_code == expected

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "actor,expected",
        [
            ("owner", status.HTTP_200_OK),
            ("member", status.HTTP_403_FORBIDDEN),
            ("ws_only", status.HTTP_403_FORBIDDEN),
            ("guest", status.HTTP_403_FORBIDDEN),
        ],
    )
    def test_lock_is_owner_only(self, workspace, project, public_page, actors, actor, expected):
        """POST /lock/ stays owner-only on a public page."""
        client = actors[actor]["client"]
        url = self.lock_url(workspace.slug, project.id, public_page.id)
        assert client.post(url, format="json").status_code == expected

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "actor,expected",
        [
            ("owner", status.HTTP_200_OK),
            ("member", status.HTTP_403_FORBIDDEN),
            ("ws_only", status.HTTP_403_FORBIDDEN),
            ("guest", status.HTTP_403_FORBIDDEN),
        ],
    )
    def test_unlock_is_owner_only(self, workspace, project, create_user, actors, actor, expected):
        # A public, locked page owned by the owner.
        """DELETE /lock/ stays owner-only on a public page."""
        page = Page.objects.create(
            name="Public Locked",
            description_html="<p>public</p>",
            owned_by=create_user,
            workspace=project.workspace,
            access=Page.PUBLIC_ACCESS,
            is_locked=True,
        )
        _link_page(project, page, create_user)

        client = actors[actor]["client"]
        url = self.lock_url(workspace.slug, project.id, page.id)
        assert client.delete(url, format="json").status_code == expected

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "actor,expected",
        [
            ("owner", status.HTTP_200_OK),
            ("member", status.HTTP_200_OK),
            ("ws_only", status.HTTP_403_FORBIDDEN),
            ("guest", status.HTTP_403_FORBIDDEN),
        ],
    )
    def test_archive(self, workspace, project, public_page, actors, actor, expected):
        """POST /archive/ per vantage point on the public page."""
        client = actors[actor]["client"]
        url = self.archive_url(workspace.slug, project.id, public_page.id)
        assert client.post(url, format="json").status_code == expected

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "actor,expected",
        [
            ("owner", status.HTTP_204_NO_CONTENT),
            ("member", status.HTTP_204_NO_CONTENT),
            ("ws_only", status.HTTP_403_FORBIDDEN),
            ("guest", status.HTTP_403_FORBIDDEN),
        ],
    )
    def test_unarchive(self, workspace, project, create_user, actors, actor, expected):
        # A public, archived page owned by the owner.
        """DELETE /archive/ per vantage point on the public page."""
        page = Page.objects.create(
            name="Public Archived",
            description_html="<p>public</p>",
            owned_by=create_user,
            workspace=project.workspace,
            access=Page.PUBLIC_ACCESS,
            archived_at=date.today(),
        )
        _link_page(project, page, create_user)

        client = actors[actor]["client"]
        url = self.archive_url(workspace.slug, project.id, page.id)
        assert client.delete(url, format="json").status_code == expected


# ---------------------------------------------------------------------------
# external_id conflict handling (must not leak private page identifiers)
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestPageExternalIdConflicts:
    """external_id uniqueness is project-wide, but a 409 must not leak the id
    of a page the caller cannot see."""

    def list_url(self, slug, project_id):
        """Return the page list/create URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/"

    def detail_url(self, slug, project_id, page_id):
        """Return the page detail URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/"

    @pytest.mark.django_db
    def test_create_conflict_hides_private_page_id(self, workspace, project, create_user, actors):
        """A member's 409 must not disclose the UUID of another user's private page."""
        private = Page.objects.create(
            name="Owner Private",
            owned_by=create_user,
            workspace=project.workspace,
            access=Page.PRIVATE_ACCESS,
            external_id="ext-1",
            external_source="notion",
        )
        _link_page(project, private, create_user)

        url = self.list_url(workspace.slug, project.id)
        resp = actors["member"]["client"].post(
            url,
            {"name": "Dup", "external_id": "ext-1", "external_source": "notion"},
            format="json",
        )
        assert resp.status_code == status.HTTP_409_CONFLICT
        # The conflict is reported (uniqueness preserved) but the private page's
        # id is withheld from a caller who cannot see it.
        assert "id" not in resp.data

    @pytest.mark.django_db
    def test_create_conflict_discloses_visible_page_id(self, workspace, project, create_user, actors):
        """A 409 for a public page the caller can see still returns its id."""
        public = Page.objects.create(
            name="Owner Public",
            owned_by=create_user,
            workspace=project.workspace,
            access=Page.PUBLIC_ACCESS,
            external_id="ext-2",
            external_source="notion",
        )
        _link_page(project, public, create_user)

        url = self.list_url(workspace.slug, project.id)
        resp = actors["member"]["client"].post(
            url,
            {"name": "Dup", "external_id": "ext-2", "external_source": "notion"},
            format="json",
        )
        assert resp.status_code == status.HTTP_409_CONFLICT
        assert resp.data.get("id") == str(public.id)

    @pytest.mark.django_db
    def test_update_external_id_conflict(self, api_key_client, workspace, project, create_user):
        """PATCHing a page's external_id to one already used -> 409."""
        first = Page.objects.create(
            name="First",
            owned_by=create_user,
            workspace=project.workspace,
            external_id="ext-a",
            external_source="notion",
        )
        _link_page(project, first, create_user)
        second = Page.objects.create(
            name="Second",
            owned_by=create_user,
            workspace=project.workspace,
            external_id="ext-b",
            external_source="notion",
        )
        _link_page(project, second, create_user)

        url = self.detail_url(workspace.slug, project.id, second.id)
        resp = api_key_client.patch(
            url,
            {"external_id": "ext-a", "external_source": "notion"},
            format="json",
        )
        assert resp.status_code == status.HTTP_409_CONFLICT


# ---------------------------------------------------------------------------
# parent validation (scope + cycle safety)
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestPageParentValidation:
    """`parent` must reference a visible page in the same project and never
    form a cycle (which would make the recursive archive CTE loop forever)."""

    def list_url(self, slug, project_id):
        """Return the page list/create URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/"

    def detail_url(self, slug, project_id, page_id):
        """Return the page detail URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/"

    @pytest.mark.django_db
    def test_create_with_unknown_parent(self, api_key_client, workspace, project):
        """400 when the parent page does not exist in the project."""
        url = self.list_url(workspace.slug, project.id)
        resp = api_key_client.post(url, {"name": "Child", "parent": str(uuid4())}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_with_cross_project_parent(self, api_key_client, workspace, project, create_user):
        """400 when the parent belongs to a different project."""
        other_project = Project.objects.create(
            name="Other Project",
            identifier="OP",
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=other_project, member=create_user, role=20, is_active=True)
        foreign_parent = Page.objects.create(name="Foreign", owned_by=create_user, workspace=workspace)
        _link_page(other_project, foreign_parent, create_user)

        url = self.list_url(workspace.slug, project.id)
        resp = api_key_client.post(url, {"name": "Child", "parent": str(foreign_parent.id)}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_update_self_parent_rejected(self, api_key_client, workspace, project, create_page):
        """400 when a page is set as its own parent."""
        url = self.detail_url(workspace.slug, project.id, create_page.id)
        resp = api_key_client.patch(url, {"parent": str(create_page.id)}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_update_cyclic_parent_rejected(self, api_key_client, workspace, project, create_user):
        """400 when the new parent is a descendant (would form a cycle)."""
        parent = Page.objects.create(name="P", owned_by=create_user, workspace=project.workspace)
        _link_page(project, parent, create_user)
        child = Page.objects.create(name="C", owned_by=create_user, workspace=project.workspace, parent=parent)
        _link_page(project, child, create_user)

        # Setting P.parent = C would create P -> C -> P.
        url = self.detail_url(workspace.slug, project.id, parent.id)
        resp = api_key_client.patch(url, {"parent": str(child.id)}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_update_valid_parent_succeeds(self, api_key_client, workspace, project, create_user):
        """200 when the parent is a valid, non-cyclic page in the project."""
        parent = Page.objects.create(name="Parent", owned_by=create_user, workspace=project.workspace)
        _link_page(project, parent, create_user)
        child = Page.objects.create(name="Child", owned_by=create_user, workspace=project.workspace)
        _link_page(project, child, create_user)

        url = self.detail_url(workspace.slug, project.id, child.id)
        resp = api_key_client.patch(url, {"parent": str(parent.id)}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        child.refresh_from_db()
        assert child.parent_id == parent.id


# ---------------------------------------------------------------------------
# Webhook routing (end-to-end: Webhook.page + mappers + activity branch)
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestPageWebhookRouting:
    """The `page` event routes only to webhooks subscribed to pages."""

    @pytest.mark.django_db
    def test_page_event_targets_page_webhooks(self, db, workspace, project, create_page, create_user):
        """webhook_activity(event='page') dispatches to page-subscribed webhooks."""
        from plane.bgtasks.webhook_task import webhook_activity

        page_webhook = Webhook.objects.create(
            workspace=workspace,
            url="https://example.com/hooks/pages",
            page=True,
        )
        # A webhook NOT subscribed to pages must be ignored.
        Webhook.objects.create(
            workspace=workspace,
            url="https://example.com/hooks/issues",
            issue=True,
            page=False,
        )

        with mock.patch("plane.bgtasks.webhook_task.webhook_send_task") as send_task:
            webhook_activity(
                event="page",
                verb="created",
                field=None,
                old_value=None,
                new_value=None,
                actor_id=str(create_user.id),
                slug=workspace.slug,
                current_site="http://localhost:3000",
                event_id=str(create_page.id),
                old_identifier=None,
                new_identifier=None,
            )

        assert send_task.delay.call_count == 1
        assert send_task.delay.call_args.kwargs["webhook_id"] == page_webhook.id
        assert send_task.delay.call_args.kwargs["event"] == "page"


# ---------------------------------------------------------------------------
# Review-feedback regressions (PR #9470)
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestPageAuditFields:
    """`created_by`/`updated_by` are populated for API-token writes.

    Review feedback suggested pages were persisted without audit users because
    the serializer marks them read-only. They are in fact set by
    ``BaseModel.save()`` from ``crum.CurrentRequestUserMiddleware``, which sees
    the DRF-authenticated user (DRF mirrors ``request.user`` onto the underlying
    Django request). These tests lock that behaviour in.
    """

    def list_url(self, slug, project_id):
        """Return the page list/create URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/"

    @pytest.mark.django_db
    def test_create_sets_created_by(self, api_key_client, workspace, project, create_user):
        """The created page records the API token's user as created_by."""
        url = self.list_url(workspace.slug, project.id)
        response = api_key_client.post(url, {"name": "Audited"}, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        page = Page.objects.get(pk=response.data["id"])
        assert page.created_by_id == create_user.id
        # Plane leaves updated_by unset on insert.
        assert page.updated_by_id is None

    @pytest.mark.django_db
    def test_update_sets_updated_by(self, api_key_client, workspace, project, create_page, create_user):
        """Updating a page records the API token's user as updated_by."""
        url = f"{self.list_url(workspace.slug, project.id)}{create_page.id}/"
        response = api_key_client.patch(url, {"name": "Renamed"}, format="json")

        assert response.status_code == status.HTTP_200_OK
        create_page.refresh_from_db()
        assert create_page.updated_by_id == create_user.id


@pytest.mark.contract
class TestPageExpand:
    """`expand` resolves page relations with page-aware serializers."""

    def detail_url(self, slug, project_id, page_id):
        """Return the page detail URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/"

    @pytest.mark.django_db
    def test_expand_parent_returns_page_fields(self, api_key_client, workspace, project, create_user):
        """expand=parent returns the parent page, not an empty issue payload.

        The shared expansion mapper points `parent` at IssueLiteSerializer; for a
        page that silently produced `{"id": ...}` with every issue-only field
        dropped. PageAPISerializer overrides it with a page serializer.
        """
        parent = Page.objects.create(name="Parent Page", owned_by=create_user, workspace=project.workspace)
        _link_page(project, parent, create_user)
        child = Page.objects.create(name="Child Page", owned_by=create_user, workspace=project.workspace, parent=parent)
        _link_page(project, child, create_user)

        url = f"{self.detail_url(workspace.slug, project.id, child.id)}?expand=parent"
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["parent"]["name"] == "Parent Page"
        assert str(response.data["parent"]["id"]) == str(parent.id)

    @pytest.mark.django_db
    def test_expand_owned_by_returns_user(self, api_key_client, workspace, project, create_page, create_user):
        """expand=owned_by still resolves through the shared user serializer."""
        url = f"{self.detail_url(workspace.slug, project.id, create_page.id)}?expand=owned_by"
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["owned_by"]["id"]) == str(create_user.id)


@pytest.mark.contract
class TestPageParentValidationEdgeCases:
    """Malformed parent references are reported as parent errors."""

    def list_url(self, slug, project_id):
        """Return the page list/create URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/"

    @pytest.mark.django_db
    def test_create_with_malformed_parent_uuid(self, api_key_client, workspace, project):
        """A non-UUID parent yields a 400 naming the parent, not a generic error."""
        url = self.list_url(workspace.slug, project.id)
        response = api_key_client.post(url, {"name": "Child", "parent": "not-a-uuid"}, format="json")

        _assert_parent_error(response)

    @pytest.mark.django_db
    def test_update_with_malformed_parent_uuid(self, api_key_client, workspace, project, create_page):
        """Same on update: malformed parent is a parent error, not a 500."""
        url = f"{self.list_url(workspace.slug, project.id)}{create_page.id}/"
        response = api_key_client.patch(url, {"parent": "not-a-uuid"}, format="json")

        _assert_parent_error(response)

    @pytest.mark.django_db
    def test_deep_chain_parent_is_allowed(self, api_key_client, workspace, project, create_user):
        """A valid deep ancestor chain still passes the cycle walk."""
        pages = []
        previous = None
        for index in range(4):
            page = Page.objects.create(
                name=f"Level {index}",
                owned_by=create_user,
                workspace=project.workspace,
                parent=previous,
            )
            _link_page(project, page, create_user)
            pages.append(page)
            previous = page

        standalone = Page.objects.create(name="Standalone", owned_by=create_user, workspace=project.workspace)
        _link_page(project, standalone, create_user)

        url = f"{self.list_url(workspace.slug, project.id)}{standalone.id}/"
        response = api_key_client.patch(url, {"parent": str(pages[-1].id)}, format="json")

        assert response.status_code == status.HTTP_200_OK
        standalone.refresh_from_db()
        assert standalone.parent_id == pages[-1].id


@pytest.mark.contract
class TestPageTypeParameterSchema:
    """The documented `type` values are constrained in the generated schema."""

    def test_type_parameter_declares_enum_and_default(self):
        """The `type` parameter advertises its allowed values and default."""
        from plane.utils.openapi import PAGE_TYPE_PARAMETER

        assert PAGE_TYPE_PARAMETER.enum == ["all", "public", "private", "archived"]
        assert PAGE_TYPE_PARAMETER.default == "all"


@pytest.mark.contract
class TestPageExpandVisibility:
    """`expand=parent` stays inside the private-page visibility rule."""

    def detail_url(self, slug, project_id, page_id):
        """Return the page detail URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/"

    @pytest.mark.django_db
    def test_expand_parent_hides_other_users_private_parent(self, workspace, project, actors):
        """A private parent owned by someone else is never expanded.

        A public page may point at a private parent. Expansion reads the foreign
        key directly, so without a visibility check the parent's name and
        metadata would leak to any project member. The response falls back to
        the bare id, which the unexpanded representation already exposes.
        """
        owner = actors["owner"]["user"]
        private_parent = Page.objects.create(
            name="Secret Parent",
            owned_by=owner,
            workspace=project.workspace,
            access=Page.PRIVATE_ACCESS,
        )
        _link_page(project, private_parent, owner)
        child = Page.objects.create(
            name="Public Child",
            owned_by=owner,
            workspace=project.workspace,
            access=Page.PUBLIC_ACCESS,
            parent=private_parent,
        )
        _link_page(project, child, owner)

        url = f"{self.detail_url(workspace.slug, project.id, child.id)}?expand=parent"
        response = actors["member"]["client"].get(url)

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["parent"]) == str(private_parent.id)
        assert "Secret Parent" not in str(response.data)

    @pytest.mark.django_db
    def test_owner_still_sees_own_private_parent_expanded(self, workspace, project, actors):
        """The parent's owner still gets the expanded payload."""
        owner = actors["owner"]["user"]
        private_parent = Page.objects.create(
            name="My Parent",
            owned_by=owner,
            workspace=project.workspace,
            access=Page.PRIVATE_ACCESS,
        )
        _link_page(project, private_parent, owner)
        child = Page.objects.create(
            name="Child",
            owned_by=owner,
            workspace=project.workspace,
            access=Page.PUBLIC_ACCESS,
            parent=private_parent,
        )
        _link_page(project, child, owner)

        url = f"{self.detail_url(workspace.slug, project.id, child.id)}?expand=parent"
        response = actors["owner"]["client"].get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["parent"]["name"] == "My Parent"

    @pytest.mark.django_db
    def test_list_expand_parent_hides_private_parent(self, workspace, project, actors):
        """The list endpoint applies the same rule as retrieve."""
        owner = actors["owner"]["user"]
        private_parent = Page.objects.create(
            name="Secret List Parent",
            owned_by=owner,
            workspace=project.workspace,
            access=Page.PRIVATE_ACCESS,
        )
        _link_page(project, private_parent, owner)
        child = Page.objects.create(
            name="Listed Child",
            owned_by=owner,
            workspace=project.workspace,
            access=Page.PUBLIC_ACCESS,
            parent=private_parent,
        )
        _link_page(project, child, owner)

        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/pages/?expand=parent"
        response = actors["member"]["client"].get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "Secret List Parent" not in str(response.data)


@pytest.mark.contract
class TestPageTypeFilterValidation:
    """Unsupported `type` values are rejected rather than silently defaulting."""

    def list_url(self, slug, project_id):
        """Return the page list URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/"

    @pytest.mark.django_db
    def test_unsupported_type_is_rejected(self, api_key_client, workspace, project, create_page):
        """An unknown type returns 400 listing the allowed values."""
        url = f"{self.list_url(workspace.slug, project.id)}?type=bogus"
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["allowed"] == ["all", "archived", "private", "public"]

    @pytest.mark.django_db
    @pytest.mark.parametrize("page_type", ["all", "public", "private", "archived"])
    def test_documented_types_are_accepted(self, api_key_client, workspace, project, create_page, page_type):
        """Every documented type value is accepted."""
        url = f"{self.list_url(workspace.slug, project.id)}?type={page_type}"
        assert api_key_client.get(url).status_code == status.HTTP_200_OK


@pytest.mark.contract
class TestPageExternalIdentityUpdate:
    """The external identity is the (external_id, external_source) pair."""

    def detail_url(self, slug, project_id, page_id):
        """Return the page detail URL."""
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/{page_id}/"

    @pytest.mark.django_db
    def test_changing_only_external_source_detects_collision(self, api_key_client, workspace, project, create_user):
        """Moving a page onto another page's (id, source) pair conflicts.

        Comparing only external_id would let a source-only change slip past the
        guard and create a duplicate identity.
        """
        first = Page.objects.create(
            name="First",
            owned_by=create_user,
            workspace=project.workspace,
            external_id="shared-id",
            external_source="notion",
        )
        _link_page(project, first, create_user)
        second = Page.objects.create(
            name="Second",
            owned_by=create_user,
            workspace=project.workspace,
            external_id="shared-id",
            external_source="confluence",
        )
        _link_page(project, second, create_user)

        url = self.detail_url(workspace.slug, project.id, second.id)
        response = api_key_client.patch(url, {"external_source": "notion"}, format="json")

        assert response.status_code == status.HTTP_409_CONFLICT

    @pytest.mark.django_db
    def test_resubmitting_own_identity_is_not_a_conflict(self, api_key_client, workspace, project, create_user):
        """A page may re-send its own identity without colliding with itself."""
        page = Page.objects.create(
            name="Self",
            owned_by=create_user,
            workspace=project.workspace,
            external_id="own-id",
            external_source="notion",
        )
        _link_page(project, page, create_user)

        url = self.detail_url(workspace.slug, project.id, page.id)
        response = api_key_client.patch(
            url,
            {"name": "Renamed", "external_id": "own-id", "external_source": "notion"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.name == "Renamed"
