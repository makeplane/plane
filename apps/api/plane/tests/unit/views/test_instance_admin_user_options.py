# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Instance-admin user-options API tests.

Covers GET /api/instances/admins/user-options/?search= — the candidate source
for the Add-administrator multi-select picker:
- matches active staff by display name, email, or staff_id;
- excludes users who are already instance admins;
- excludes inactive users and non-active employment statuses;
- dedups on user; caps results;
- requires the administrators menu (scoped admin without it → 403; super → 200).
"""

import uuid

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from plane.db.models import EmploymentStatus, StaffProfile, User
from plane.license.menu_registry import ALL_PERMISSION_KEYS
from plane.license.models import Instance, InstanceAdmin

USER_OPTIONS_URL = "/api/instances/admins/user-options/"


def _make_user(prefix: str, *, is_active: bool = True) -> User:
    return User.objects.create(
        email=f"{prefix}-{uuid.uuid4().hex[:8]}@example.com",
        username=uuid.uuid4().hex,
        display_name=prefix,
        is_active=is_active,
    )


def _make_staff(user, staff_id, *, status=EmploymentStatus.ACTIVE) -> StaffProfile:
    return StaffProfile.objects.create(user=user, staff_id=staff_id, employment_status=status)


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
def administrators_admin(db, instance):
    """Non-super admin holding the administrators menu (can manage admins)."""
    user = _make_user("administrators-admin")
    InstanceAdmin.objects.create(instance=instance, user=user, role=20, allowed_menus=["administrators"])
    return user


@pytest.fixture
def workspace_only_admin(db, instance):
    """Non-super admin without the administrators menu."""
    user = _make_user("workspace-admin")
    InstanceAdmin.objects.create(instance=instance, user=user, role=20, allowed_menus=["workspace"])
    return user


@pytest.mark.unit
class TestAdminUserOptionsAccess:
    @pytest.mark.django_db
    def test_super_admin_can_enumerate(self, super_admin):
        _make_staff(_make_user("alice"), "10001")
        resp = _client_for(super_admin).get(USER_OPTIONS_URL)
        assert resp.status_code == 200
        assert "candidates" in resp.data

    @pytest.mark.django_db
    def test_administrators_admin_can_enumerate(self, administrators_admin):
        _make_staff(_make_user("alice"), "10001")
        resp = _client_for(administrators_admin).get(USER_OPTIONS_URL)
        assert resp.status_code == 200

    @pytest.mark.django_db
    def test_scoped_admin_without_administrators_menu_denied(self, workspace_only_admin):
        resp = _client_for(workspace_only_admin).get(USER_OPTIONS_URL)
        assert resp.status_code == 403

    @pytest.mark.django_db
    def test_anonymous_denied(self, instance):
        resp = APIClient().get(USER_OPTIONS_URL)
        assert resp.status_code in (401, 403)


@pytest.mark.unit
class TestAdminUserOptionsSearch:
    @pytest.mark.django_db
    def test_returns_staff_id_field(self, super_admin):
        _make_staff(_make_user("alice"), "10001")
        resp = _client_for(super_admin).get(USER_OPTIONS_URL)
        candidate = next(c for c in resp.data["candidates"] if c["staff_id"] == "10001")
        assert set(candidate.keys()) == {"id", "display_name", "email", "staff_id"}

    @pytest.mark.django_db
    def test_search_by_display_name(self, super_admin):
        _make_staff(_make_user("zoltan"), "20001")
        _make_staff(_make_user("yvonne"), "20002")
        resp = _client_for(super_admin).get(USER_OPTIONS_URL, {"search": "zolt"})
        names = [c["display_name"] for c in resp.data["candidates"]]
        assert "zoltan" in names
        assert "yvonne" not in names

    @pytest.mark.django_db
    def test_search_by_staff_id(self, super_admin):
        target = _make_user("by-staff-id")
        _make_staff(target, "98765")
        _make_staff(_make_user("other"), "11111")
        resp = _client_for(super_admin).get(USER_OPTIONS_URL, {"search": "9876"})
        staff_ids = [c["staff_id"] for c in resp.data["candidates"]]
        assert staff_ids == ["98765"]

    @pytest.mark.django_db
    def test_search_by_email(self, super_admin):
        target = _make_user("emailmatch")
        _make_staff(target, "30001")
        resp = _client_for(super_admin).get(USER_OPTIONS_URL, {"search": target.email})
        assert [c["id"] for c in resp.data["candidates"]] == [str(target.id)]

    @pytest.mark.django_db
    def test_excludes_existing_admins(self, super_admin, instance):
        already = _make_user("already-admin")
        _make_staff(already, "40001")
        InstanceAdmin.objects.create(instance=instance, user=already, role=20, allowed_menus=["workspace"])
        resp = _client_for(super_admin).get(USER_OPTIONS_URL)
        ids = [c["id"] for c in resp.data["candidates"]]
        assert str(already.id) not in ids

    @pytest.mark.django_db
    def test_excludes_inactive_user(self, super_admin):
        inactive = _make_user("inactive", is_active=False)
        _make_staff(inactive, "50001")
        resp = _client_for(super_admin).get(USER_OPTIONS_URL)
        ids = [c["id"] for c in resp.data["candidates"]]
        assert str(inactive.id) not in ids

    @pytest.mark.django_db
    def test_excludes_resigned_staff(self, super_admin):
        resigned = _make_user("resigned")
        _make_staff(resigned, "60001", status=EmploymentStatus.RESIGNED)
        resp = _client_for(super_admin).get(USER_OPTIONS_URL)
        ids = [c["id"] for c in resp.data["candidates"]]
        assert str(resigned.id) not in ids

    @pytest.mark.django_db
    def test_dedups_on_user(self, super_admin):
        user = _make_user("dup")
        _make_staff(user, "70001")
        # soft-deleted second profile for the same user must not duplicate the row
        StaffProfile.objects.create(
            user=user, staff_id="70002", employment_status=EmploymentStatus.ACTIVE, deleted_at=timezone.now()
        )
        resp = _client_for(super_admin).get(USER_OPTIONS_URL)
        matches = [c for c in resp.data["candidates"] if c["id"] == str(user.id)]
        assert len(matches) == 1

    @pytest.mark.django_db
    def test_caps_results(self, super_admin):
        for i in range(60):
            _make_staff(_make_user(f"bulk{i}"), f"8{i:04d}")
        resp = _client_for(super_admin).get(USER_OPTIONS_URL)
        assert len(resp.data["candidates"]) <= 50
