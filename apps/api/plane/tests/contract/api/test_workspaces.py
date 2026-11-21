# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for the public (token) workspace API.

Covers POST/GET /api/v1/workspaces/ and GET/PATCH /api/v1/workspaces/{slug}/,
which mirror the internal app workspace-create logic so a workspace can be
provisioned headlessly with an API key.
"""

from unittest import mock
from uuid import uuid4

import pytest
from django.db import IntegrityError
from rest_framework import status
from rest_framework.test import APIClient

from plane.api.views.workspace import generate_unique_workspace_slug
from plane.db.models import User, Workspace, WorkspaceMember


LIST_CREATE_URL = "/api/v1/workspaces/"


def detail_url(slug):
    return f"/api/v1/workspaces/{slug}/"


@pytest.fixture
def foreign_workspace(db):
    """A workspace owned by a different user; the token user is not a member."""
    unique_id = uuid4().hex[:8]
    other = User.objects.create(
        email=f"other-{unique_id}@plane.so",
        username=f"other_user_{unique_id}",
        first_name="Other",
        last_name="User",
    )
    other.set_password("test-password")
    other.save()
    workspace = Workspace.objects.create(name="Foreign", owner=other, slug=f"foreign-{unique_id}")
    WorkspaceMember.objects.create(workspace=workspace, member=other, role=20)
    return workspace


@pytest.fixture
def member_workspace(db, create_user):
    """A workspace owned by someone else where the token user is a plain Member (role 15)."""
    unique_id = uuid4().hex[:8]
    owner = User.objects.create(
        email=f"owner-{unique_id}@plane.so",
        username=f"owner_user_{unique_id}",
        first_name="Owner",
        last_name="User",
    )
    owner.set_password("test-password")
    owner.save()
    workspace = Workspace.objects.create(name="Shared", owner=owner, slug=f"shared-{unique_id}")
    WorkspaceMember.objects.create(workspace=workspace, member=owner, role=20)
    WorkspaceMember.objects.create(workspace=workspace, member=create_user, role=15)
    return workspace


@pytest.fixture
def admin_non_owner_workspace(db, create_user):
    """A workspace owned by someone else where the token user is a role-20 Admin (not the owner)."""
    unique_id = uuid4().hex[:8]
    owner = User.objects.create(
        email=f"owner-{unique_id}@plane.so",
        username=f"owner_user_{unique_id}",
        first_name="Owner",
        last_name="User",
    )
    owner.set_password("test-password")
    owner.save()
    workspace = Workspace.objects.create(name="Co-owned", owner=owner, slug=f"co-owned-{unique_id}")
    WorkspaceMember.objects.create(workspace=workspace, member=owner, role=20)
    WorkspaceMember.objects.create(workspace=workspace, member=create_user, role=20)
    return workspace


@pytest.mark.contract
class TestWorkspaceListCreateAPIEndpoint:
    """Contract tests for POST/GET /api/v1/workspaces/."""

    @pytest.mark.django_db
    @mock.patch("plane.bgtasks.workspace_seed_task.workspace_seed.delay")
    def test_create_workspace_with_explicit_slug(self, mock_seed, api_key_client, create_user):
        payload = {"name": "Acme", "slug": "acme-inc"}

        response = api_key_client.post(LIST_CREATE_URL, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED, f"Got {response.status_code}: {response.data!r}"
        workspace = Workspace.objects.get(id=response.data["id"])
        assert workspace.slug == "acme-inc"
        # Token user becomes the owner and an admin member (role 20).
        assert workspace.owner == create_user
        assert WorkspaceMember.objects.filter(workspace=workspace, member=create_user, role=20).count() == 1
        # Response carries the derived membership fields.
        assert response.data["role"] == 20
        assert response.data["total_members"] == 1
        # Seeding was dispatched exactly once for the new workspace.
        mock_seed.assert_called_once_with(response.data["id"])

    @pytest.mark.django_db
    @mock.patch("plane.bgtasks.workspace_seed_task.workspace_seed.delay")
    def test_create_workspace_auto_generates_slug(self, mock_seed, api_key_client, create_user):
        """Omitting slug must auto-generate a URL-safe slug from the name."""
        response = api_key_client.post(LIST_CREATE_URL, {"name": "Acme Corp"}, format="json")

        assert response.status_code == status.HTTP_201_CREATED, f"Got {response.status_code}: {response.data!r}"
        workspace = Workspace.objects.get(id=response.data["id"])
        assert workspace.slug == "acme-corp"

    @pytest.mark.django_db
    @mock.patch("plane.bgtasks.workspace_seed_task.workspace_seed.delay")
    def test_create_workspace_auto_slug_avoids_collision(self, mock_seed, api_key_client, create_user):
        """An auto-generated slug must not collide with an existing workspace."""
        Workspace.objects.create(name="Existing", owner=create_user, slug="acme-corp")

        response = api_key_client.post(LIST_CREATE_URL, {"name": "Acme Corp"}, format="json")

        assert response.status_code == status.HTTP_201_CREATED, f"Got {response.status_code}: {response.data!r}"
        workspace = Workspace.objects.get(id=response.data["id"])
        assert workspace.slug == "acme-corp-1"

    @pytest.mark.django_db
    def test_create_workspace_requires_name(self, api_key_client):
        response = api_key_client.post(LIST_CREATE_URL, {}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Workspace.objects.count() == 0

    @pytest.mark.django_db
    @mock.patch("plane.bgtasks.workspace_seed_task.workspace_seed.delay")
    def test_create_workspace_duplicate_slug_returns_400(self, mock_seed, api_key_client):
        """A duplicate explicit slug is rejected by the serializer (mirrors the
        internal API, which returns a field-shaped 400 rather than a 409)."""
        api_key_client.post(LIST_CREATE_URL, {"name": "Acme", "slug": "acme"}, format="json")

        response = api_key_client.post(LIST_CREATE_URL, {"name": "Acme Two", "slug": "acme"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "slug" in response.data
        assert Workspace.objects.filter(slug="acme").count() == 1

    @pytest.mark.django_db
    def test_create_workspace_rejects_restricted_slug(self, api_key_client):
        response = api_key_client.post(LIST_CREATE_URL, {"name": "Acme", "slug": "api"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "slug" in response.data
        assert Workspace.objects.count() == 0

    @pytest.mark.django_db
    def test_create_workspace_rejects_invalid_slug(self, api_key_client):
        response = api_key_client.post(LIST_CREATE_URL, {"name": "Acme", "slug": "bad slug!"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "slug" in response.data

    @pytest.mark.django_db
    def test_create_workspace_rejects_name_with_url(self, api_key_client):
        response = api_key_client.post(
            LIST_CREATE_URL, {"name": "https://evil.example.com", "slug": "evil"}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "name" in response.data
        assert Workspace.objects.count() == 0

    @pytest.mark.django_db
    def test_create_workspace_requires_authentication(self):
        response = APIClient().post(LIST_CREATE_URL, {"name": "Acme", "slug": "acme"}, format="json")

        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
        assert Workspace.objects.count() == 0

    @pytest.mark.django_db
    def test_list_returns_only_member_workspaces(self, api_key_client, workspace, foreign_workspace):
        response = api_key_client.get(LIST_CREATE_URL)

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        slugs = {row["slug"] for row in response.data["results"]}
        assert workspace.slug in slugs
        assert foreign_workspace.slug not in slugs

    @pytest.mark.django_db
    def test_create_slug_collision_race_returns_409(self, api_key_client):
        """A slug unique-violation that slips past validation (a create race)
        is reported as a 409 conflict."""
        collision = IntegrityError('unique constraint "workspaces_slug_key" ... already exists')
        with mock.patch("plane.api.views.workspace.WorkspaceSerializer.save", side_effect=collision):
            response = api_key_client.post(LIST_CREATE_URL, {"name": "Race", "slug": "race"}, format="json")

        assert response.status_code == status.HTTP_409_CONFLICT
        assert "slug" in response.data

    @pytest.mark.django_db
    def test_create_unexpected_integrity_error_not_reported_as_slug_conflict(self, api_key_client):
        """A non-slug IntegrityError must not be mislabeled as a slug conflict;
        it bubbles to the global handler (400) instead of returning 409."""
        with mock.patch(
            "plane.api.views.workspace.WorkspaceSerializer.save",
            side_effect=IntegrityError("some unrelated constraint violated"),
        ):
            response = api_key_client.post(LIST_CREATE_URL, {"name": "Boom", "slug": "boom"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.status_code != status.HTTP_409_CONFLICT


@pytest.mark.contract
class TestWorkspaceDetailAPIEndpoint:
    """Contract tests for GET/PATCH /api/v1/workspaces/{slug}/."""

    @pytest.mark.django_db
    def test_retrieve_workspace(self, api_key_client, workspace):
        response = api_key_client.get(detail_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        assert response.data["slug"] == workspace.slug
        assert response.data["role"] == 20
        assert response.data["total_members"] == 1

    @pytest.mark.django_db
    def test_retrieve_workspace_non_member_returns_404(self, api_key_client, foreign_workspace):
        response = api_key_client.get(detail_url(foreign_workspace.slug))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_update_workspace_name(self, api_key_client, workspace):
        response = api_key_client.patch(detail_url(workspace.slug), {"name": "Renamed"}, format="json")

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        workspace.refresh_from_db()
        assert workspace.name == "Renamed"

    @pytest.mark.django_db
    def test_update_workspace_rejects_name_with_url(self, api_key_client, workspace):
        response = api_key_client.patch(detail_url(workspace.slug), {"name": "https://evil.example.com"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "name" in response.data

    @pytest.mark.django_db
    def test_update_workspace_non_member_forbidden(self, api_key_client, foreign_workspace):
        response = api_key_client.patch(detail_url(foreign_workspace.slug), {"name": "Hijack"}, format="json")

        # Non-members are rejected by the workspace permission (403); a member
        # of no such workspace never reaches the object.
        assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    @pytest.mark.django_db
    def test_member_can_retrieve_but_not_update(self, api_key_client, member_workspace):
        """A plain member (role 15) may read the workspace but not update it,
        mirroring the internal admin-only partial_update."""
        get_response = api_key_client.get(detail_url(member_workspace.slug))
        assert get_response.status_code == status.HTTP_200_OK, f"Got {get_response.status_code}: {get_response.data!r}"
        assert get_response.data["role"] == 15

        patch_response = api_key_client.patch(detail_url(member_workspace.slug), {"name": "Renamed"}, format="json")
        assert patch_response.status_code == status.HTTP_403_FORBIDDEN
        member_workspace.refresh_from_db()
        assert member_workspace.name == "Shared"

    @pytest.mark.django_db
    def test_update_workspace_as_admin_non_owner(self, api_key_client, admin_non_owner_workspace):
        """Update is admin-only, not owner-only: a role-20 admin who is not the
        workspace owner can still update it."""
        response = api_key_client.patch(
            detail_url(admin_non_owner_workspace.slug), {"name": "Renamed By Admin"}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK, f"Got {response.status_code}: {response.data!r}"
        admin_non_owner_workspace.refresh_from_db()
        assert admin_non_owner_workspace.name == "Renamed By Admin"

    @pytest.mark.django_db
    def test_update_unexpected_integrity_error_not_reported_as_slug_conflict(self, api_key_client, workspace):
        """A non-slug IntegrityError during update bubbles to the global handler
        (400) rather than being mislabeled as a 409 slug conflict."""
        with mock.patch(
            "plane.api.views.workspace.WorkspaceSerializer.save",
            side_effect=IntegrityError("some unrelated constraint violated"),
        ):
            response = api_key_client.patch(detail_url(workspace.slug), {"name": "Boom"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.status_code != status.HTTP_409_CONFLICT


@pytest.mark.contract
@pytest.mark.django_db
class TestGenerateUniqueWorkspaceSlug:
    """Unit-level checks for the slug generator used by headless provisioning."""

    def test_slugifies_name(self, db):
        assert generate_unique_workspace_slug("Hello World") == "hello-world"

    def test_falls_back_for_symbol_only_name(self, db):
        assert generate_unique_workspace_slug("!!!") == "workspace"

    def test_truncates_to_max_length(self, db):
        slug = generate_unique_workspace_slug("a" * 100)
        assert len(slug) <= 48

    def test_appends_suffix_on_collision(self, db, create_user):
        Workspace.objects.create(name="Taken", owner=create_user, slug="taken")
        assert generate_unique_workspace_slug("Taken") == "taken-1"
