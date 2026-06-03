# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Instance-admin management API tests.

Covers:
- POST/PATCH/DELETE /api/instances/admins/ with escalation + lockout guards
  (only super-admins mint super-admins; administrators-menu admins grant only
  subsets of their own menus and never edit their own row; the last active
  loginable super-admin can never be demoted/deleted/deactivated).
- Ghost rows (user=NULL) and inactive users never satisfy the last-super count.
- Lockout guards on user deactivation, password reset, staff deactivation.
- /admins/me/ exposes is_super_admin + allowed_menus.
- Admins list cache is pinned and invalidated on mutation (DEBUG=False).
"""

import uuid

import pytest
from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from plane.db.models import StaffProfile, User
from plane.license.menu_registry import ALL_PERMISSION_KEYS
from plane.license.models import Instance, InstanceAdmin

ADMINS_URL = "/api/instances/admins/"


def _make_user(prefix: str) -> User:
    return User.objects.create(
        email=f"{prefix}-{uuid.uuid4().hex[:8]}@example.com",
        username=uuid.uuid4().hex,
        display_name=prefix,
    )


def _client_for(user) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def instance(db):
    return Instance.objects.create(
        instance_name="Test Instance",
        is_setup_done=True,
        last_checked_at=timezone.now(),
    )


@pytest.fixture
def super_admin(db, instance):
    user = _make_user("super-admin")
    InstanceAdmin.objects.create(
        instance=instance, user=user, role=20, is_super_admin=True, allowed_menus=list(ALL_PERMISSION_KEYS)
    )
    return user


@pytest.fixture
def admins_menu_admin(db, instance):
    """Non-super admin granted the administrators + workspace menus."""
    user = _make_user("admins-menu-admin")
    InstanceAdmin.objects.create(
        instance=instance, user=user, role=20, allowed_menus=["administrators", "workspace"]
    )
    return user


@pytest.mark.unit
class TestAdminCreate:
    @pytest.mark.django_db
    def test_super_admin_creates_scoped_admin_with_menus(self, super_admin):
        target = _make_user("new-admin")
        resp = _client_for(super_admin).post(
            ADMINS_URL,
            {"email": target.email, "allowed_menus": ["workspace", "users"]},
            format="json",
        )
        assert resp.status_code == 201
        admin = InstanceAdmin.objects.get(user=target)
        assert admin.is_super_admin is False
        assert set(admin.allowed_menus) == {"workspace", "users"}

    @pytest.mark.django_db
    def test_super_admin_creates_another_super_admin(self, super_admin):
        target = _make_user("second-super")
        resp = _client_for(super_admin).post(
            ADMINS_URL, {"email": target.email, "is_super_admin": True}, format="json"
        )
        assert resp.status_code == 201
        assert InstanceAdmin.objects.get(user=target).is_super_admin is True

    @pytest.mark.django_db
    def test_invalid_menu_key_rejected(self, super_admin):
        target = _make_user("bad-menus")
        resp = _client_for(super_admin).post(
            ADMINS_URL, {"email": target.email, "allowed_menus": ["workspace", "authentication"]}, format="json"
        )
        assert resp.status_code == 400
        assert not InstanceAdmin.objects.filter(user=target).exists()

    @pytest.mark.django_db
    def test_unknown_email_rejected(self, super_admin):
        resp = _client_for(super_admin).post(
            ADMINS_URL, {"email": "ghost@example.com", "allowed_menus": []}, format="json"
        )
        assert resp.status_code == 400

    @pytest.mark.django_db
    def test_duplicate_admin_rejected(self, super_admin, admins_menu_admin):
        resp = _client_for(super_admin).post(
            ADMINS_URL, {"email": admins_menu_admin.email, "allowed_menus": []}, format="json"
        )
        assert resp.status_code == 400

    @pytest.mark.django_db
    def test_admin_without_administrators_menu_denied(self, instance, super_admin):
        user = _make_user("workspace-only")
        InstanceAdmin.objects.create(instance=instance, user=user, role=20, allowed_menus=["workspace"])
        target = _make_user("target")
        resp = _client_for(user).post(ADMINS_URL, {"email": target.email}, format="json")
        assert resp.status_code == 403

    @pytest.mark.django_db
    def test_admins_menu_admin_cannot_mint_super(self, admins_menu_admin):
        target = _make_user("target")
        resp = _client_for(admins_menu_admin).post(
            ADMINS_URL, {"email": target.email, "is_super_admin": True}, format="json"
        )
        assert resp.status_code == 403
        assert not InstanceAdmin.objects.filter(user=target).exists()

    @pytest.mark.django_db
    def test_admins_menu_admin_grants_only_subset_of_own_menus(self, admins_menu_admin):
        target = _make_user("target")
        client = _client_for(admins_menu_admin)
        # "users" is outside the caller's own menus -> denied
        resp = client.post(ADMINS_URL, {"email": target.email, "allowed_menus": ["users"]}, format="json")
        assert resp.status_code == 403
        # subset of own menus -> allowed
        resp = client.post(ADMINS_URL, {"email": target.email, "allowed_menus": ["workspace"]}, format="json")
        assert resp.status_code == 201


@pytest.mark.unit
class TestAdminPatch:
    def _admin_row(self, user):
        return InstanceAdmin.objects.get(user=user)

    @pytest.mark.django_db
    def test_super_admin_updates_menus(self, super_admin, admins_menu_admin):
        row = self._admin_row(admins_menu_admin)
        resp = _client_for(super_admin).patch(
            f"{ADMINS_URL}{row.pk}/", {"allowed_menus": ["staff"]}, format="json"
        )
        assert resp.status_code == 200
        row.refresh_from_db()
        assert row.allowed_menus == ["staff"]

    @pytest.mark.django_db
    def test_demoting_last_super_admin_blocked(self, super_admin):
        row = self._admin_row(super_admin)
        resp = _client_for(super_admin).patch(
            f"{ADMINS_URL}{row.pk}/", {"is_super_admin": False}, format="json"
        )
        assert resp.status_code == 400
        row.refresh_from_db()
        assert row.is_super_admin is True

    @pytest.mark.django_db
    def test_demote_allowed_when_another_super_exists(self, instance, super_admin):
        other = _make_user("other-super")
        other_row = InstanceAdmin.objects.create(
            instance=instance, user=other, role=20, is_super_admin=True
        )
        resp = _client_for(super_admin).patch(
            f"{ADMINS_URL}{other_row.pk}/", {"is_super_admin": False}, format="json"
        )
        assert resp.status_code == 200

    @pytest.mark.django_db
    def test_ghost_super_row_does_not_satisfy_last_super_guard(self, instance, super_admin):
        ghost = InstanceAdmin.objects.create(
            instance=instance, user=_make_user("ghost"), role=20, is_super_admin=True
        )
        InstanceAdmin.objects.filter(pk=ghost.pk).update(user=None)
        row = InstanceAdmin.objects.get(user=super_admin)
        resp = _client_for(super_admin).patch(
            f"{ADMINS_URL}{row.pk}/", {"is_super_admin": False}, format="json"
        )
        assert resp.status_code == 400  # ghost super must not count

    @pytest.mark.django_db
    def test_inactive_super_does_not_satisfy_last_super_guard(self, instance, super_admin):
        dormant = _make_user("dormant-super")
        InstanceAdmin.objects.create(instance=instance, user=dormant, role=20, is_super_admin=True)
        User.objects.filter(pk=dormant.pk).update(is_active=False)
        row = InstanceAdmin.objects.get(user=super_admin)
        resp = _client_for(super_admin).patch(
            f"{ADMINS_URL}{row.pk}/", {"is_super_admin": False}, format="json"
        )
        assert resp.status_code == 400

    @pytest.mark.django_db
    def test_admins_menu_admin_cannot_edit_own_row(self, admins_menu_admin):
        row = self._admin_row(admins_menu_admin)
        resp = _client_for(admins_menu_admin).patch(
            f"{ADMINS_URL}{row.pk}/", {"allowed_menus": ["workspace"]}, format="json"
        )
        assert resp.status_code == 403

    @pytest.mark.django_db
    def test_admins_menu_admin_cannot_set_super_flag(self, instance, admins_menu_admin):
        scoped = _make_user("scoped")
        row = InstanceAdmin.objects.create(instance=instance, user=scoped, role=20, allowed_menus=["workspace"])
        resp = _client_for(admins_menu_admin).patch(
            f"{ADMINS_URL}{row.pk}/", {"is_super_admin": True}, format="json"
        )
        assert resp.status_code == 403

    @pytest.mark.django_db
    def test_patch_validates_menu_keys(self, super_admin, admins_menu_admin):
        row = self._admin_row(admins_menu_admin)
        resp = _client_for(super_admin).patch(
            f"{ADMINS_URL}{row.pk}/", {"allowed_menus": ["not-a-menu"]}, format="json"
        )
        assert resp.status_code == 400


@pytest.mark.unit
class TestAdminDelete:
    @pytest.mark.django_db
    def test_delete_scoped_admin(self, super_admin, admins_menu_admin):
        row = InstanceAdmin.objects.get(user=admins_menu_admin)
        resp = _client_for(super_admin).delete(f"{ADMINS_URL}{row.pk}/")
        assert resp.status_code == 204
        assert not InstanceAdmin.objects.filter(pk=row.pk).exists()

    @pytest.mark.django_db
    def test_delete_last_super_admin_blocked(self, instance, super_admin):
        second = _make_user("second-super")
        InstanceAdmin.objects.create(instance=instance, user=second, role=20, is_super_admin=True)
        row = InstanceAdmin.objects.get(user=super_admin)
        # second super exists, but self-delete is always blocked
        resp = _client_for(super_admin).delete(f"{ADMINS_URL}{row.pk}/")
        assert resp.status_code == 400
        # other super deleting the row is fine (not last, not self)
        resp = _client_for(second).delete(f"{ADMINS_URL}{row.pk}/")
        assert resp.status_code == 204

    @pytest.mark.django_db
    def test_delete_sole_super_admin_blocked_even_by_other_admin(self, super_admin, admins_menu_admin):
        row = InstanceAdmin.objects.get(user=super_admin)
        resp = _client_for(admins_menu_admin).delete(f"{ADMINS_URL}{row.pk}/")
        assert resp.status_code == 400


@pytest.mark.unit
class TestLockoutGuards:
    @pytest.mark.django_db
    def test_deactivating_last_super_admin_user_blocked(self, super_admin):
        resp = _client_for(super_admin).patch(
            f"/api/instances/users/{super_admin.pk}/", {"is_active": False}, format="json"
        )
        assert resp.status_code == 400
        super_admin.refresh_from_db()
        assert super_admin.is_active is True

    @pytest.mark.django_db
    def test_deactivating_super_with_another_super_alive_allowed(self, instance, super_admin):
        other = _make_user("other-super")
        InstanceAdmin.objects.create(instance=instance, user=other, role=20, is_super_admin=True)
        resp = _client_for(super_admin).patch(
            f"/api/instances/users/{other.pk}/", {"is_active": False}, format="json"
        )
        assert resp.status_code == 200

    @pytest.mark.django_db
    def test_non_super_cannot_reset_super_admin_password(self, instance, super_admin):
        user = _make_user("users-menu-admin")
        InstanceAdmin.objects.create(instance=instance, user=user, role=20, allowed_menus=["users"])
        resp = _client_for(user).post(f"/api/instances/users/{super_admin.pk}/reset-password/")
        assert resp.status_code == 403

    @pytest.mark.django_db
    def test_super_can_reset_other_super_password(self, instance, super_admin):
        other = _make_user("other-super")
        InstanceAdmin.objects.create(instance=instance, user=other, role=20, is_super_admin=True)
        resp = _client_for(super_admin).post(f"/api/instances/users/{other.pk}/reset-password/")
        assert resp.status_code == 200

    @pytest.mark.django_db
    def test_staff_deactivate_last_super_admin_blocked(self, super_admin):
        staff = StaffProfile.objects.create(
            user=super_admin, staff_id="SA000001", job_grade="GD", employment_status="active"
        )
        resp = _client_for(super_admin).post(f"/api/instances/staff/{staff.pk}/deactivate/")
        assert resp.status_code == 400
        super_admin.refresh_from_db()
        assert super_admin.is_active is True


@pytest.mark.unit
class TestAdminsMeShape:
    @pytest.mark.django_db
    def test_me_returns_menu_fields(self, admins_menu_admin):
        resp = _client_for(admins_menu_admin).get("/api/instances/admins/me/")
        assert resp.status_code == 200
        assert resp.data["is_super_admin"] is False
        assert set(resp.data["allowed_menus"]) == {"administrators", "workspace"}

    @pytest.mark.django_db
    def test_me_super_admin(self, super_admin):
        resp = _client_for(super_admin).get("/api/instances/admins/me/")
        assert resp.data["is_super_admin"] is True


@pytest.mark.unit
class TestAdminsListCache:
    @override_settings(DEBUG=False)
    @pytest.mark.django_db
    def test_list_reflects_mutation_immediately(self, super_admin):
        cache.clear()
        client = _client_for(super_admin)
        first = client.get(ADMINS_URL)
        assert first.status_code == 200
        emails_before = {row["user_detail"]["email"] for row in first.data}

        target = _make_user("freshly-granted")
        assert client.post(ADMINS_URL, {"email": target.email, "allowed_menus": []}, format="json").status_code == 201

        second = client.get(ADMINS_URL)
        emails_after = {row["user_detail"]["email"] for row in second.data}
        assert target.email in emails_after
        assert emails_before != emails_after
        cache.clear()
