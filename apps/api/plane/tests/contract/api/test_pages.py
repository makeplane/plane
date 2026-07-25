# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta
from unittest import mock

import pytest
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Page,
    Project,
    ProjectMember,
    ProjectPage,
    User,
    WorkspaceMember,
)
from plane.db.models.api import APIToken


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    """Reset the ApiKeyRateThrottle counter (redis-backed cache) between tests.

    The throttle state lives in the shared cache, not the DB, so it is not
    rolled back per test — without clearing it, a run's requests accumulate and
    later tests spuriously hit HTTP 429. Mirrors the pattern in
    ``test_authentication.py``.
    """
    cache.clear()
    yield
    cache.clear()


# ---------------------------------------------------------------------------
# Fixtures & helpers
# ---------------------------------------------------------------------------


@pytest.fixture
def project(db, workspace, create_user):
    """A project in the test workspace with the api-key user as an admin."""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


def _api_client_for(user):
    """Build an X-Api-Key authenticated client for an arbitrary user."""
    token = APIToken.objects.create(user=user, label="test-token")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


@pytest.fixture
def make_project_user(db, workspace, project):
    """Factory: a user provisioned at a given project role (or workspace-only)."""

    def _make(email, project_role):
        # username is unique and defaults to "" — set it so multiple test users
        # don't collide on the empty string.
        """Create a user at the given project role (None = workspace member only)."""
        user = User.objects.create(email=email, username=email, first_name=email.split("@")[0])
        user.set_password("password")
        user.save()
        WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
        if project_role is not None:
            ProjectMember.objects.create(project=project, member=user, role=project_role, is_active=True)
        return user

    return _make


@pytest.fixture
def role_clients(api_key_client, make_project_user):
    """A client for each role in the access matrix.

    - owner: the api-key user (project admin) who owns the pages under test
    - member: a different project member (role 15)
    - outsider: a workspace member who is NOT in the project
    - guest: a project guest (role 5)
    """
    return {
        "owner": api_key_client,
        "member": _api_client_for(make_project_user("member@plane.so", 15)),
        "outsider": _api_client_for(make_project_user("outsider@plane.so", None)),
        "guest": _api_client_for(make_project_user("guest@plane.so", 5)),
    }


def make_page(
    project,
    owner,
    *,
    access=Page.PRIVATE_ACCESS,
    archived=False,
    locked=False,
    name="Secret Page",
    parent=None,
):
    """Create a page linked to ``project`` and owned by ``owner``."""
    page = Page.objects.create(
        name=name,
        description_html="<p>content</p>",
        owned_by=owner,
        workspace=project.workspace,
        access=access,
        # archived_at is a DateField, so timezone.now() is coerced to its date —
        # the same value the endpoints write.
        archived_at=timezone.now() if archived else None,
        is_locked=locked,
        parent=parent,
    )
    ProjectPage.objects.create(
        workspace=project.workspace,
        project=project,
        page=page,
        created_by_id=owner.id,
        updated_by_id=owner.id,
    )
    return page


def list_url(slug, project_id):
    """URL of the project page list/create endpoint."""
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/pages/"


def detail_url(slug, project_id, page_id):
    """URL of a single page's retrieve/update/delete endpoint."""
    return f"{list_url(slug, project_id)}{page_id}/"


def archive_url(slug, project_id, page_id):
    """URL of a page's archive/restore endpoint."""
    return f"{detail_url(slug, project_id, page_id)}archive/"


def lock_url(slug, project_id, page_id):
    """URL of a page's lock/unlock endpoint."""
    return f"{detail_url(slug, project_id, page_id)}lock/"


# ---------------------------------------------------------------------------
# List / Create
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestPageListCreateAPIEndpoint:
    """Listing and creating pages through the public token API."""

    @pytest.mark.django_db
    def test_unauthenticated_request(self, api_client, workspace, project):
        # No X-Api-Key -> APIKeyAuthentication returns 401 Unauthorized.
        """A request with no API key is rejected."""
        response = api_client.get(list_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_list_pages_success(self, api_key_client, workspace, project, create_user):
        """Listing returns a paginated payload."""
        make_page(project, create_user, access=Page.PUBLIC_ACCESS, name="A public page")
        response = api_key_client.get(list_url(workspace.slug, project.id))
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert len(response.data["results"]) >= 1

    @pytest.mark.django_db
    def test_list_excludes_archived_by_default(self, api_key_client, workspace, project, create_user):
        """Archived pages are hidden unless asked for."""
        live = make_page(project, create_user, access=Page.PUBLIC_ACCESS, name="Live")
        archived = make_page(project, create_user, access=Page.PUBLIC_ACCESS, archived=True, name="Archived")
        response = api_key_client.get(list_url(workspace.slug, project.id))
        ids = [str(p["id"]) for p in response.data["results"]]
        assert str(live.id) in ids
        assert str(archived.id) not in ids

    @pytest.mark.django_db
    def test_list_search_filters_by_name(self, api_key_client, workspace, project, create_user):
        """`search` narrows the list by page name."""
        make_page(project, create_user, access=Page.PUBLIC_ACCESS, name="Runbook")
        make_page(project, create_user, access=Page.PUBLIC_ACCESS, name="Design Doc")
        response = api_key_client.get(list_url(workspace.slug, project.id), {"search": "run"})
        names = [p["name"] for p in response.data["results"]]
        assert names == ["Runbook"]

    @pytest.mark.django_db
    def test_list_type_filter(self, api_key_client, workspace, project, create_user):
        """`type` selects public, private or archived pages."""
        public = make_page(project, create_user, access=Page.PUBLIC_ACCESS, name="Public")
        private = make_page(project, create_user, access=Page.PRIVATE_ACCESS, name="Private")
        archived = make_page(project, create_user, access=Page.PUBLIC_ACCESS, archived=True, name="Archived")

        def ids(resp):
            """Collect the page ids from a paginated response."""
            return {str(p["id"]) for p in resp.data["results"]}

        public_ids = ids(api_key_client.get(list_url(workspace.slug, project.id), {"type": "public"}))
        assert str(public.id) in public_ids
        assert str(private.id) not in public_ids
        assert str(archived.id) not in public_ids

        private_ids = ids(api_key_client.get(list_url(workspace.slug, project.id), {"type": "private"}))
        assert private_ids == {str(private.id)}

        archived_ids = ids(api_key_client.get(list_url(workspace.slug, project.id), {"type": "archived"}))
        assert archived_ids == {str(archived.id)}

    @pytest.mark.django_db
    def test_list_hides_other_users_private_pages(self, role_clients, workspace, project, create_user):
        """The private-page leak fix: a member never sees another user's private page."""
        private = make_page(project, create_user, access=Page.PRIVATE_ACCESS, name="Owner Only")
        public = make_page(project, create_user, access=Page.PUBLIC_ACCESS, name="Shared")

        response = role_clients["member"].get(list_url(workspace.slug, project.id))
        ids = [str(p["id"]) for p in response.data["results"]]
        assert str(public.id) in ids
        assert str(private.id) not in ids

    @pytest.mark.django_db
    def test_create_page_success(self, api_key_client, workspace, project):
        """A created page is linked to the project with no Yjs binary."""
        data = {"name": "New Page", "description_html": "<p>Hello world</p>"}
        response = api_key_client.post(list_url(workspace.slug, project.id), data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Page"
        page = Page.objects.get(pk=response.data["id"])
        assert page.description_binary is None
        assert ProjectPage.objects.filter(page=page, project=project).exists()

    @pytest.mark.django_db
    def test_create_sanitizes_description_html(self, api_key_client, workspace, project):
        """HTML content is sanitized on write with the same nh3 sanitizer."""
        data = {
            "name": "XSS",
            "description_html": "<p>ok</p><script>alert('xss')</script>",
        }
        response = api_key_client.post(list_url(workspace.slug, project.id), data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        page = Page.objects.get(pk=response.data["id"])
        assert "<script>" not in page.description_html
        assert "ok" in page.description_html

    @pytest.mark.django_db
    def test_create_external_id_conflict(self, api_key_client, workspace, project):
        """A duplicate external id/source pair conflicts."""
        data = {"name": "External", "external_id": "ext-1", "external_source": "notion"}
        first = api_key_client.post(list_url(workspace.slug, project.id), data, format="json")
        assert first.status_code == status.HTTP_201_CREATED

        dup = {"name": "Dup", "external_id": "ext-1", "external_source": "notion"}
        second = api_key_client.post(list_url(workspace.slug, project.id), dup, format="json")
        assert second.status_code == status.HTTP_409_CONFLICT
        assert "same external id" in second.data["error"]

    @pytest.mark.django_db
    def test_create_forbidden_for_guest(self, role_clients, workspace, project):
        """Guests (read-only) cannot create pages."""
        response = role_clients["guest"].post(
            list_url(workspace.slug, project.id),
            {"name": "Nope"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_create_forbidden_for_outsider(self, role_clients, workspace, project):
        """A workspace member outside the project cannot create."""
        response = role_clients["outsider"].post(
            list_url(workspace.slug, project.id),
            {"name": "Nope"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


# ---------------------------------------------------------------------------
# Detail (retrieve / update / delete) — happy paths & guards
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestPageDetailAPIEndpoint:
    """Retrieving, updating and deleting a page through the public token API."""

    @pytest.mark.django_db
    def test_retrieve_page(self, api_key_client, workspace, project, create_user):
        """A visible page can be retrieved by id."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS)
        response = api_key_client.get(detail_url(workspace.slug, project.id, page.id))
        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(page.id)

    @pytest.mark.django_db
    def test_update_page_success(self, api_key_client, workspace, project, create_user):
        """Name and content updates persist."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS)
        data = {"name": "Renamed", "description_html": "<p>updated</p>"}
        response = api_key_client.patch(detail_url(workspace.slug, project.id, page.id), data, format="json")
        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.name == "Renamed"
        assert page.description_html == "<p>updated</p>"
        assert page.description_binary is None

    @pytest.mark.django_db
    def test_update_sanitizes_description_html(self, api_key_client, workspace, project, create_user):
        """Unsafe markup is stripped on update."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS)
        data = {"description_html": "<p>safe</p><img src=x onerror=alert(1)>"}
        response = api_key_client.patch(detail_url(workspace.slug, project.id, page.id), data, format="json")
        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert "onerror" not in page.description_html

    @pytest.mark.django_db
    def test_update_locked_page(self, api_key_client, workspace, project, create_user):
        """A locked page rejects edits."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS, locked=True)
        response = api_key_client.patch(detail_url(workspace.slug, project.id, page.id), {"name": "x"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "locked" in response.data["error"].lower()

    @pytest.mark.django_db
    def test_update_archived_page(self, api_key_client, workspace, project, create_user):
        """An archived page rejects edits."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS, archived=True)
        response = api_key_client.patch(detail_url(workspace.slug, project.id, page.id), {"name": "x"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "archived" in response.data["error"].lower()

    @pytest.mark.django_db
    def test_non_owner_cannot_change_access(self, role_clients, workspace, project, create_user):
        """A member may edit a public page but only the owner can change access."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS)
        response = role_clients["member"].patch(
            detail_url(workspace.slug, project.id, page.id), {"access": 1}, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_member_can_edit_public_page(self, role_clients, workspace, project, create_user):
        """Public pages follow project membership: a member can edit content."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS)
        response = role_clients["member"].patch(
            detail_url(workspace.slug, project.id, page.id), {"name": "Edited by member"}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.name == "Edited by member"

    @pytest.mark.django_db
    def test_delete_requires_archived(self, api_key_client, workspace, project, create_user):
        """A live page must be archived before deletion."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS)
        response = api_key_client.delete(detail_url(workspace.slug, project.id, page.id))
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "archived" in response.data["error"].lower()

    @pytest.mark.django_db
    def test_delete_archived_page(self, api_key_client, workspace, project, create_user):
        """An archived page owned by the caller can be deleted."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS, archived=True)
        with mock.patch("plane.db.mixins.soft_delete_related_objects"):
            response = api_key_client.delete(detail_url(workspace.slug, project.id, page.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Page.objects.filter(id=page.id).exists()

    @pytest.mark.django_db
    def test_member_cannot_delete_others_page(self, role_clients, workspace, project, create_user):
        """A non-owner, non-admin member cannot delete another user's archived page."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS, archived=True)
        with mock.patch("plane.db.mixins.soft_delete_related_objects"):
            response = role_clients["member"].delete(detail_url(workspace.slug, project.id, page.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Page.objects.filter(id=page.id).exists()


# ---------------------------------------------------------------------------
# Archive / Lock
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestPageArchiveLockAPIEndpoint:
    """Archiving, restoring, locking and unlocking through the public token API."""

    @pytest.mark.django_db
    def test_archive_page(self, api_key_client, workspace, project, create_user):
        """Archiving stamps archived_at."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS)
        response = api_key_client.post(archive_url(workspace.slug, project.id, page.id), format="json")
        assert response.status_code == status.HTTP_200_OK
        assert "archived_at" in response.data
        page.refresh_from_db()
        assert page.archived_at is not None

    @pytest.mark.django_db
    def test_unarchive_page(self, api_key_client, workspace, project, create_user):
        """Restoring clears archived_at."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS, archived=True)
        response = api_key_client.delete(archive_url(workspace.slug, project.id, page.id), format="json")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        page.refresh_from_db()
        assert page.archived_at is None

    @pytest.mark.django_db
    def test_member_cannot_archive_others_page(self, role_clients, workspace, project, create_user):
        """Archive is owner-or-admin: a plain member cannot archive another's page."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS)
        response = role_clients["member"].post(archive_url(workspace.slug, project.id, page.id), format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_lock_page(self, api_key_client, workspace, project, create_user):
        """Locking sets is_locked."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS)
        response = api_key_client.post(lock_url(workspace.slug, project.id, page.id), format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_locked"] is True
        page.refresh_from_db()
        assert page.is_locked is True

    @pytest.mark.django_db
    def test_unlock_page(self, api_key_client, workspace, project, create_user):
        """Unlocking clears is_locked."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS, locked=True)
        response = api_key_client.delete(lock_url(workspace.slug, project.id, page.id), format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_locked"] is False
        page.refresh_from_db()
        assert page.is_locked is False

    @pytest.mark.django_db
    def test_member_can_lock_public_page(self, role_clients, workspace, project, create_user):
        """Lock/unlock mirror the internal API: any member can lock a public page."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS)
        response = role_clients["member"].post(lock_url(workspace.slug, project.id, page.id), format="json")
        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.is_locked is True


# ---------------------------------------------------------------------------
# Private-page access matrix — owner / member / outsider / guest × every verb
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestPrivatePageAccessMatrix:
    """A private page owned by ``create_user`` must be invisible/immutable to
    everyone else. ``member`` (a project member who is not the owner) gets 404 —
    the page is filtered out of their queryset, so its existence never leaks;
    ``outsider`` (not in the project) is rejected by permission (403); ``guest``
    can read but never mutate (403 on writes, 404 on the private read)."""

    def _run(self, role_clients, workspace, project, create_user, *, method, url_fn, expected, page_kwargs):
        """Assert the expected status for each role against one private page."""
        for role, client in role_clients.items():
            page = make_page(project, create_user, access=Page.PRIVATE_ACCESS, **page_kwargs)
            url = url_fn(workspace.slug, project.id, page.id)
            response = getattr(client, method)(url, format="json")
            assert response.status_code == expected[role], (
                f"{role} {method.upper()} {url} -> {response.status_code}, expected {expected[role]}"
            )

    @pytest.mark.django_db
    def test_retrieve(self, role_clients, workspace, project, create_user):
        """Private-page reads are owner-only."""
        self._run(
            role_clients,
            workspace,
            project,
            create_user,
            method="get",
            url_fn=detail_url,
            expected={"owner": 200, "member": 404, "outsider": 403, "guest": 404},
            page_kwargs={},
        )

    @pytest.mark.django_db
    def test_update(self, role_clients, workspace, project, create_user):
        # owner update succeeds (200); non-owners never get that far.
        """Private-page updates are owner-only."""
        for role, client in role_clients.items():
            page = make_page(project, create_user, access=Page.PRIVATE_ACCESS)
            url = detail_url(workspace.slug, project.id, page.id)
            response = client.patch(url, {"name": "changed"}, format="json")
            expected = {"owner": 200, "member": 404, "outsider": 403, "guest": 403}
            assert response.status_code == expected[role], f"{role}: {response.status_code}"

    @pytest.mark.django_db
    def test_delete(self, role_clients, workspace, project, create_user):
        """Private-page deletes are owner-only."""
        expected = {"owner": 204, "member": 404, "outsider": 403, "guest": 403}
        with mock.patch("plane.db.mixins.soft_delete_related_objects"):
            self._run(
                role_clients,
                workspace,
                project,
                create_user,
                method="delete",
                url_fn=detail_url,
                expected=expected,
                page_kwargs={"archived": True},
            )

    @pytest.mark.django_db
    def test_archive(self, role_clients, workspace, project, create_user):
        """Private-page archiving is owner-only."""
        self._run(
            role_clients,
            workspace,
            project,
            create_user,
            method="post",
            url_fn=archive_url,
            expected={"owner": 200, "member": 404, "outsider": 403, "guest": 403},
            page_kwargs={},
        )

    @pytest.mark.django_db
    def test_unarchive(self, role_clients, workspace, project, create_user):
        """Private-page restoring is owner-only."""
        self._run(
            role_clients,
            workspace,
            project,
            create_user,
            method="delete",
            url_fn=archive_url,
            expected={"owner": 204, "member": 404, "outsider": 403, "guest": 403},
            page_kwargs={"archived": True},
        )

    @pytest.mark.django_db
    def test_lock(self, role_clients, workspace, project, create_user):
        """Private-page locking is owner-only."""
        self._run(
            role_clients,
            workspace,
            project,
            create_user,
            method="post",
            url_fn=lock_url,
            expected={"owner": 200, "member": 404, "outsider": 403, "guest": 403},
            page_kwargs={},
        )

    @pytest.mark.django_db
    def test_unlock(self, role_clients, workspace, project, create_user):
        """Private-page unlocking is owner-only."""
        self._run(
            role_clients,
            workspace,
            project,
            create_user,
            method="delete",
            url_fn=lock_url,
            expected={"owner": 200, "member": 404, "outsider": 403, "guest": 403},
            page_kwargs={"locked": True},
        )


# ---------------------------------------------------------------------------
# Webhooks — API-driven changes are externally observable identically to the UI
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestPageAPIWebhook:
    """Public-API mutations fire the same page webhooks as the UI."""

    @pytest.fixture(autouse=True)
    def _web_url(self, settings):
        """Give base_host() an origin to build current_site from."""
        settings.WEB_URL = "http://localhost"

    @pytest.mark.django_db
    def test_content_update_fires_page_webhook_with_update_action(
        self, api_key_client, workspace, project, create_user
    ):
        """A public-API page update fires the shared `page` webhook, action=update."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS)
        with (
            mock.patch("plane.bgtasks.webhook_task.webhook_activity") as mocked_webhook,
            mock.patch("plane.api.views.page.page_transaction"),
        ):
            response = api_key_client.patch(
                detail_url(workspace.slug, project.id, page.id),
                {"description_html": "<p>edited via api</p>"},
                format="json",
            )

        assert response.status_code == status.HTTP_200_OK
        mocked_webhook.delay.assert_called_once()
        kwargs = mocked_webhook.delay.call_args.kwargs
        assert kwargs["event"] == "page"
        assert kwargs["verb"] == "updated"
        assert kwargs["field"] == "description_html"
        # Content updates reuse the debounced content-persist path.
        assert kwargs["debounce"] is True
        assert str(kwargs["event_id"]) == str(page.id)

    @pytest.mark.django_db
    def test_property_update_routes_through_model_activity(self, api_key_client, workspace, project, create_user):
        """Property edits fan out `page` updates through the shared model_activity."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS)
        with mock.patch("plane.api.views.page.model_activity") as mocked_model_activity:
            response = api_key_client.patch(
                detail_url(workspace.slug, project.id, page.id),
                {"name": "Renamed via API"},
                format="json",
            )

        assert response.status_code == status.HTTP_200_OK
        mocked_model_activity.delay.assert_called_once()
        kwargs = mocked_model_activity.delay.call_args.kwargs
        assert kwargs["model_name"] == "page"
        assert str(kwargs["model_id"]) == str(page.id)
        assert kwargs["requested_data"] == {"name": "Renamed via API"}

    @pytest.mark.django_db
    def test_create_fires_page_created_webhook(self, api_key_client, workspace, project):
        """Creating a page fires the page created webhook."""
        with (
            mock.patch("plane.bgtasks.webhook_task.webhook_activity") as mocked_webhook,
            mock.patch("plane.api.views.page.page_transaction"),
        ):
            response = api_key_client.post(
                list_url(workspace.slug, project.id),
                {"name": "Hooked"},
                format="json",
            )

        assert response.status_code == status.HTTP_201_CREATED
        mocked_webhook.delay.assert_called_once()
        kwargs = mocked_webhook.delay.call_args.kwargs
        assert kwargs["event"] == "page"
        assert kwargs["verb"] == "created"
        assert str(kwargs["event_id"]) == str(response.data["id"])


# ---------------------------------------------------------------------------
# Parent scoping — a writable relation must not reach outside the caller's scope
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestPageParentScoping:
    """``parent`` resolves through the model manager, so it is validated against
    the caller's access-scoped queryset before any save."""

    @pytest.fixture
    def other_project(self, db, workspace, create_user):
        """A second project in the same workspace, with the api-key user as admin."""
        project = Project.objects.create(
            name="Other Project",
            identifier="OP",
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        return project

    @pytest.mark.django_db
    def test_create_rejects_parent_from_another_project(
        self, api_key_client, workspace, project, other_project, create_user
    ):
        """A page in another project is not a valid parent even for the same user."""
        foreign = make_page(other_project, create_user, access=Page.PUBLIC_ACCESS, name="Foreign")
        response = api_key_client.post(
            list_url(workspace.slug, project.id),
            {"name": "Child", "parent": str(foreign.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not Page.objects.filter(name="Child").exists()

    @pytest.mark.django_db
    def test_create_rejects_another_users_private_parent(self, api_key_client, workspace, project, make_project_user):
        """Another member's private page must not become a parent."""
        other = make_project_user("privateowner@plane.so", 15)
        secret = make_page(project, other, access=Page.PRIVATE_ACCESS, name="Their Secret")
        response = api_key_client.post(
            list_url(workspace.slug, project.id),
            {"name": "Child", "parent": str(secret.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_accepts_visible_parent(self, api_key_client, workspace, project, create_user):
        """A parent the caller can see is accepted."""
        parent = make_page(project, create_user, access=Page.PUBLIC_ACCESS, name="Parent")
        response = api_key_client.post(
            list_url(workspace.slug, project.id),
            {"name": "Child", "parent": str(parent.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, f"Got {response.data!r}"
        assert str(Page.objects.get(pk=response.data["id"]).parent_id) == str(parent.id)

    @pytest.mark.django_db
    def test_update_rejects_parent_from_another_project(
        self, api_key_client, workspace, project, other_project, create_user
    ):
        """A parent outside the project is rejected on update."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS)
        foreign = make_page(other_project, create_user, access=Page.PUBLIC_ACCESS, name="Foreign")
        response = api_key_client.patch(
            detail_url(workspace.slug, project.id, page.id),
            {"parent": str(foreign.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        page.refresh_from_db()
        assert page.parent_id is None

    @pytest.mark.django_db
    def test_update_rejects_self_as_parent(self, api_key_client, workspace, project, create_user):
        """A page under itself would make the recursive tree walk loop."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS)
        response = api_key_client.patch(
            detail_url(workspace.slug, project.id, page.id),
            {"parent": str(page.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        page.refresh_from_db()
        assert page.parent_id is None

    @pytest.mark.django_db
    def test_update_rejects_descendant_as_parent(self, api_key_client, workspace, project, create_user):
        """Re-parenting a page under its own child would close a cycle."""
        parent = make_page(project, create_user, access=Page.PUBLIC_ACCESS, name="Root")
        child = make_page(project, create_user, access=Page.PUBLIC_ACCESS, name="Child", parent=parent)
        response = api_key_client.patch(
            detail_url(workspace.slug, project.id, parent.id),
            {"parent": str(child.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        parent.refresh_from_db()
        assert parent.parent_id is None

    @pytest.mark.django_db
    def test_update_allows_detaching_parent(self, api_key_client, workspace, project, create_user):
        """Clearing the parent is allowed."""
        parent = make_page(project, create_user, access=Page.PUBLIC_ACCESS, name="Root")
        child = make_page(project, create_user, access=Page.PUBLIC_ACCESS, name="Child", parent=parent)
        response = api_key_client.patch(
            detail_url(workspace.slug, project.id, child.id),
            {"parent": None},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, f"Got {response.data!r}"
        child.refresh_from_db()
        assert child.parent_id is None


# ---------------------------------------------------------------------------
# Version history must record the stored (sanitized) content
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestPageVersionHistorySanitization:
    """Version history records the stored, sanitized content."""

    @pytest.mark.django_db
    def test_update_records_sanitized_html_in_version_history(self, api_key_client, workspace, project, create_user):
        """page_transaction must receive what was stored, not the raw body."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS)
        with mock.patch("plane.api.views.page.page_transaction") as mocked_transaction:
            response = api_key_client.patch(
                detail_url(workspace.slug, project.id, page.id),
                {"description_html": "<p>keep</p><script>alert('xss')</script>"},
                format="json",
            )

        assert response.status_code == status.HTTP_200_OK
        mocked_transaction.delay.assert_called_once()
        recorded = mocked_transaction.delay.call_args.kwargs["new_description_html"]
        assert "<script>" not in recorded
        assert "keep" in recorded
        page.refresh_from_db()
        assert recorded == page.description_html

    @pytest.mark.django_db
    def test_create_records_sanitized_html_in_version_history(self, api_key_client, workspace, project):
        """Create records sanitized content in version history."""
        with mock.patch("plane.api.views.page.page_transaction") as mocked_transaction:
            response = api_key_client.post(
                list_url(workspace.slug, project.id),
                {"name": "Fresh", "description_html": "<p>ok</p><script>bad()</script>"},
                format="json",
            )

        assert response.status_code == status.HTTP_201_CREATED
        recorded = mocked_transaction.delay.call_args.kwargs["new_description_html"]
        assert "<script>" not in recorded


# ---------------------------------------------------------------------------
# Prior state reported on lock / archive transitions
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestPagePriorStateReporting:
    """Update webhooks report the page's real pre-mutation state."""

    @pytest.fixture(autouse=True)
    def _web_url(self, settings):
        """Give base_host() an origin to build current_site from."""
        settings.WEB_URL = "http://localhost"

    @pytest.mark.django_db
    def test_lock_reports_actual_prior_lock_state(self, api_key_client, workspace, project, create_user):
        """Locking an already-locked page reports old_value=True, not False."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS, locked=True)
        with mock.patch("plane.bgtasks.webhook_task.webhook_activity") as mocked_webhook:
            response = api_key_client.post(lock_url(workspace.slug, project.id, page.id), format="json")

        assert response.status_code == status.HTTP_200_OK
        kwargs = mocked_webhook.delay.call_args.kwargs
        assert kwargs["field"] == "is_locked"
        assert kwargs["old_value"] is True
        assert kwargs["new_value"] is True

    @pytest.mark.django_db
    def test_unlock_reports_actual_prior_lock_state(self, api_key_client, workspace, project, create_user):
        """Unlocking an already-unlocked page reports old_value=False, not True."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS, locked=False)
        with mock.patch("plane.bgtasks.webhook_task.webhook_activity") as mocked_webhook:
            response = api_key_client.delete(lock_url(workspace.slug, project.id, page.id), format="json")

        assert response.status_code == status.HTTP_200_OK
        kwargs = mocked_webhook.delay.call_args.kwargs
        assert kwargs["old_value"] is False
        assert kwargs["new_value"] is False

    @pytest.mark.django_db
    def test_archive_reports_prior_archived_at(self, api_key_client, workspace, project, create_user):
        """Re-archiving an archived page reports its previous archived_at."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS, archived=True)
        with mock.patch("plane.bgtasks.webhook_task.webhook_activity") as mocked_webhook:
            response = api_key_client.post(archive_url(workspace.slug, project.id, page.id), format="json")

        assert response.status_code == status.HTTP_200_OK
        kwargs = mocked_webhook.delay.call_args.kwargs
        assert kwargs["field"] == "archived_at"
        assert kwargs["old_value"] is not None
        assert kwargs["new_value"] is not None

    @pytest.mark.django_db
    def test_archive_refreshes_updated_at(self, api_key_client, workspace, project, create_user):
        """Archiving through the public API also maintains updated_at."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS)
        Page.objects.filter(pk=page.id).update(updated_at=timezone.now() - timedelta(days=2))
        before = Page.objects.get(pk=page.id).updated_at

        # Stub the webhook fan-out: this test is about updated_at, and the real
        # task would need a broker.
        with mock.patch("plane.bgtasks.webhook_task.webhook_activity"):
            response = api_key_client.post(archive_url(workspace.slug, project.id, page.id), format="json")

        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.updated_at > before

    @pytest.mark.django_db
    def test_archive_writes_timezone_aware_date(self, api_key_client, workspace, project, create_user):
        """archived_at lands on the UTC date, not a naive server-local one."""
        page = make_page(project, create_user, access=Page.PUBLIC_ACCESS)
        with mock.patch("plane.bgtasks.webhook_task.webhook_activity"):
            response = api_key_client.post(archive_url(workspace.slug, project.id, page.id), format="json")
        assert response.status_code == status.HTTP_200_OK
        page.refresh_from_db()
        assert page.archived_at == timezone.now().date()
