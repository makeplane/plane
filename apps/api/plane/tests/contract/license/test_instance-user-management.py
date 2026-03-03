# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for Instance User Management API endpoints.
Based on plan: plans/260301-2350-swing-sso-admin-user-management/

Endpoints tested:
- GET    /api/instances/users/                     — list users (paginated, searchable)
- POST   /api/instances/users/                     — create user
- GET    /api/instances/users/<id>/                — user detail + workspace memberships
- PATCH  /api/instances/users/<id>/                — update user (+ cascade deactivation)
- POST   /api/instances/users/<id>/reset-password/ — auto-generate password
- POST   /api/instances/users/<id>/workspaces/     — add user to workspace
"""

import uuid

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from plane.db.models import User, Workspace, WorkspaceMember
from plane.license.models import Instance, InstanceAdmin


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def setup_instance(db):
    """Create Instance required for InstanceAdminPermission."""
    instance_id = (
        uuid.uuid4()
        if not Instance.objects.exists()
        else Instance.objects.first().id
    )
    instance, _ = Instance.objects.update_or_create(
        id=instance_id,
        defaults={
            "instance_name": "Test Instance",
            "instance_id": str(uuid.uuid4()),
            "current_version": "1.0.0",
            "domain": "http://localhost:8000",
            "last_checked_at": timezone.now(),
            "is_setup_done": True,
        },
    )
    return instance


@pytest.fixture
def admin_user(db):
    """Create an admin user for instance management."""
    user = User.objects.create(
        email="admin@test.plane.so",
        first_name="Admin",
        last_name="User",
        username="admin@test.plane.so",
    )
    user.set_password("admin-password-123")
    user.save()
    return user


@pytest.fixture
def instance_admin(setup_instance, admin_user):
    """Register admin_user as InstanceAdmin."""
    return InstanceAdmin.objects.create(
        instance=setup_instance,
        user=admin_user,
        role=20,
    )


@pytest.fixture
def admin_client(api_client, admin_user, instance_admin):
    """Authenticated client with instance admin privileges."""
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def regular_user(db):
    """A non-admin user (no InstanceAdmin record)."""
    user = User.objects.create(
        email="regular@test.plane.so",
        first_name="Regular",
        last_name="User",
        username="regular@test.plane.so",
    )
    user.set_password("regular-password-123")
    user.save()
    return user


@pytest.fixture
def nonadmin_client(api_client, regular_user):
    """Authenticated client WITHOUT instance admin privileges."""
    api_client.force_authenticate(user=regular_user)
    return api_client


@pytest.fixture
def test_workspace(admin_user):
    """Create a workspace for add-to-workspace tests."""
    ws = Workspace.objects.create(
        name="Test Workspace",
        slug="test-ws",
        owner=admin_user,
    )
    WorkspaceMember.objects.create(workspace=ws, member=admin_user, role=20)
    return ws


@pytest.fixture
def sample_users(db):
    """Create 5 sample users for list/search tests."""
    users = []
    for i in range(5):
        u = User.objects.create(
            email=f"sample{i}@test.plane.so",
            first_name=f"Sample{i}",
            last_name="Tester",
            username=f"sample{i}@test.plane.so",
        )
        u.set_password("sample-pass-123")
        u.save()
        users.append(u)
    return users


# ---------------------------------------------------------------------------
# Test: User List
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestInstanceUserList:
    """GET /api/instances/users/ — paginated user list with search."""

    @pytest.mark.django_db
    def test_list_returns_users(self, admin_client, sample_users, setup_instance):
        url = reverse("instance-users")
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        # At least sample users + admin user
        assert response.data["total_count"] >= 5

    @pytest.mark.django_db
    def test_list_search_by_email(self, admin_client, sample_users, setup_instance):
        url = reverse("instance-users")
        response = admin_client.get(url, {"search": "sample2@test"})
        assert response.status_code == status.HTTP_200_OK
        emails = [u["email"] for u in response.data["results"]]
        assert "sample2@test.plane.so" in emails

    @pytest.mark.django_db
    def test_list_search_by_name(self, admin_client, sample_users, setup_instance):
        url = reverse("instance-users")
        response = admin_client.get(url, {"search": "Sample3"})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) >= 1

    @pytest.mark.django_db
    def test_list_filter_active(self, admin_client, sample_users, setup_instance):
        # Deactivate one user
        sample_users[0].is_active = False
        sample_users[0].save()
        url = reverse("instance-users")
        response = admin_client.get(url, {"is_active": "true"})
        assert response.status_code == status.HTTP_200_OK
        ids = [u["id"] for u in response.data["results"]]
        assert str(sample_users[0].id) not in ids

    @pytest.mark.django_db
    def test_list_unauthorized(self, nonadmin_client, setup_instance):
        url = reverse("instance-users")
        response = nonadmin_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_list_unauthenticated(self, api_client, setup_instance):
        url = reverse("instance-users")
        response = api_client.get(url)
        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ]


# ---------------------------------------------------------------------------
# Test: User Create
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestInstanceUserCreate:
    """POST /api/instances/users/ — create user."""

    @pytest.mark.django_db
    def test_create_user_success(self, admin_client, setup_instance):
        url = reverse("instance-users")
        data = {
            "first_name": "New",
            "last_name": "User",
            "email": "newuser@test.plane.so",
            "password": "secure-pass-123",
        }
        response = admin_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["email"] == "newuser@test.plane.so"
        assert response.data["first_name"] == "New"
        assert "id" in response.data
        # Verify user exists in DB with hashed password
        user = User.objects.get(email="newuser@test.plane.so")
        assert user.check_password("secure-pass-123")
        assert not user.is_password_autoset

    @pytest.mark.django_db
    def test_create_duplicate_email(self, admin_client, sample_users, setup_instance):
        url = reverse("instance-users")
        data = {
            "first_name": "Dup",
            "email": sample_users[0].email,
            "password": "some-pass-123",
        }
        response = admin_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_missing_email(self, admin_client, setup_instance):
        url = reverse("instance-users")
        data = {"first_name": "NoEmail", "password": "pass-123456"}
        response = admin_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_short_password(self, admin_client, setup_instance):
        url = reverse("instance-users")
        data = {
            "first_name": "Short",
            "email": "shortpw@test.plane.so",
            "password": "abc",
        }
        response = admin_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_unauthorized(self, nonadmin_client, setup_instance):
        url = reverse("instance-users")
        data = {
            "first_name": "Unauth",
            "email": "unauth@test.plane.so",
            "password": "password-123",
        }
        response = nonadmin_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN


# ---------------------------------------------------------------------------
# Test: User Detail
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestInstanceUserDetail:
    """GET /api/instances/users/<id>/ — detail with workspace memberships."""

    @pytest.mark.django_db
    def test_detail_success(self, admin_client, sample_users, setup_instance):
        user = sample_users[0]
        url = reverse("instance-user-detail", kwargs={"pk": user.id})
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == user.email
        assert "workspaces" in response.data

    @pytest.mark.django_db
    def test_detail_with_workspace(
        self, admin_client, sample_users, test_workspace, setup_instance
    ):
        user = sample_users[0]
        WorkspaceMember.objects.create(
            workspace=test_workspace, member=user, role=15, is_active=True
        )
        url = reverse("instance-user-detail", kwargs={"pk": user.id})
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["workspaces"]) == 1
        assert response.data["workspaces"][0]["workspace_name"] == "Test Workspace"

    @pytest.mark.django_db
    def test_detail_not_found(self, admin_client, setup_instance):
        fake_id = uuid.uuid4()
        url = reverse("instance-user-detail", kwargs={"pk": fake_id})
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND


# ---------------------------------------------------------------------------
# Test: User Update
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestInstanceUserUpdate:
    """PATCH /api/instances/users/<id>/ — update user fields."""

    @pytest.mark.django_db
    def test_update_name(self, admin_client, sample_users, setup_instance):
        user = sample_users[0]
        url = reverse("instance-user-detail", kwargs={"pk": user.id})
        response = admin_client.patch(
            url, {"first_name": "Updated"}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["first_name"] == "Updated"
        user.refresh_from_db()
        assert user.first_name == "Updated"

    @pytest.mark.django_db
    def test_deactivate_cascades_workspace_memberships(
        self, admin_client, sample_users, test_workspace, setup_instance
    ):
        user = sample_users[0]
        WorkspaceMember.objects.create(
            workspace=test_workspace, member=user, role=15, is_active=True
        )
        url = reverse("instance-user-detail", kwargs={"pk": user.id})
        response = admin_client.patch(url, {"is_active": False}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_active"] is False
        # Verify cascade: workspace membership deactivated
        membership = WorkspaceMember.objects.get(
            workspace=test_workspace, member=user
        )
        assert membership.is_active is False

    @pytest.mark.django_db
    def test_reactivate_does_not_cascade(
        self, admin_client, sample_users, test_workspace, setup_instance
    ):
        user = sample_users[0]
        user.is_active = False
        user.save()
        wm = WorkspaceMember.objects.create(
            workspace=test_workspace, member=user, role=15, is_active=False
        )
        url = reverse("instance-user-detail", kwargs={"pk": user.id})
        response = admin_client.patch(url, {"is_active": True}, format="json")
        assert response.status_code == status.HTTP_200_OK
        # Workspace membership should remain inactive (no auto-reactivate)
        wm.refresh_from_db()
        assert wm.is_active is False

    @pytest.mark.django_db
    def test_update_not_found(self, admin_client, setup_instance):
        fake_id = uuid.uuid4()
        url = reverse("instance-user-detail", kwargs={"pk": fake_id})
        response = admin_client.patch(
            url, {"first_name": "Ghost"}, format="json"
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


# ---------------------------------------------------------------------------
# Test: Reset Password
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestInstanceUserResetPassword:
    """POST /api/instances/users/<id>/reset-password/ — auto-generate password."""

    @pytest.mark.django_db
    def test_reset_password_success(self, admin_client, sample_users, setup_instance):
        user = sample_users[0]
        url = reverse("instance-user-reset-password", kwargs={"pk": user.id})
        response = admin_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        assert "password" in response.data
        new_pw = response.data["password"]
        assert len(new_pw) >= 12
        # Verify password works
        user.refresh_from_db()
        assert user.check_password(new_pw)
        assert user.is_password_autoset is True

    @pytest.mark.django_db
    def test_reset_password_not_found(self, admin_client, setup_instance):
        fake_id = uuid.uuid4()
        url = reverse("instance-user-reset-password", kwargs={"pk": fake_id})
        response = admin_client.post(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_reset_password_unauthorized(
        self, nonadmin_client, sample_users, setup_instance
    ):
        user = sample_users[0]
        url = reverse("instance-user-reset-password", kwargs={"pk": user.id})
        response = nonadmin_client.post(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN


# ---------------------------------------------------------------------------
# Test: Add User to Workspace
# ---------------------------------------------------------------------------


@pytest.mark.contract
class TestInstanceUserWorkspace:
    """POST /api/instances/users/<id>/workspaces/ — add to workspace."""

    @pytest.mark.django_db
    def test_add_to_workspace_success(
        self, admin_client, sample_users, test_workspace, setup_instance
    ):
        user = sample_users[0]
        url = reverse("instance-user-workspaces", kwargs={"pk": user.id})
        data = {
            "workspace_id": str(test_workspace.id),
            "role": 15,
        }
        response = admin_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["role"] == 15
        # Verify in DB
        assert WorkspaceMember.objects.filter(
            workspace=test_workspace, member=user, is_active=True
        ).exists()

    @pytest.mark.django_db
    def test_add_duplicate_membership(
        self, admin_client, sample_users, test_workspace, setup_instance
    ):
        user = sample_users[0]
        WorkspaceMember.objects.create(
            workspace=test_workspace, member=user, role=15, is_active=True
        )
        url = reverse("instance-user-workspaces", kwargs={"pk": user.id})
        data = {"workspace_id": str(test_workspace.id), "role": 15}
        response = admin_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_reactivate_inactive_membership(
        self, admin_client, sample_users, test_workspace, setup_instance
    ):
        user = sample_users[0]
        WorkspaceMember.objects.create(
            workspace=test_workspace, member=user, role=15, is_active=False
        )
        url = reverse("instance-user-workspaces", kwargs={"pk": user.id})
        data = {"workspace_id": str(test_workspace.id), "role": 20}
        response = admin_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        membership = WorkspaceMember.objects.get(
            workspace=test_workspace, member=user
        )
        assert membership.is_active is True
        assert membership.role == 20

    @pytest.mark.django_db
    def test_add_invalid_role(
        self, admin_client, sample_users, test_workspace, setup_instance
    ):
        user = sample_users[0]
        url = reverse("instance-user-workspaces", kwargs={"pk": user.id})
        data = {"workspace_id": str(test_workspace.id), "role": 99}
        response = admin_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_add_nonexistent_workspace(
        self, admin_client, sample_users, setup_instance
    ):
        user = sample_users[0]
        url = reverse("instance-user-workspaces", kwargs={"pk": user.id})
        data = {"workspace_id": str(uuid.uuid4()), "role": 15}
        response = admin_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_add_nonexistent_user(
        self, admin_client, test_workspace, setup_instance
    ):
        fake_id = uuid.uuid4()
        url = reverse("instance-user-workspaces", kwargs={"pk": fake_id})
        data = {"workspace_id": str(test_workspace.id), "role": 15}
        response = admin_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND
