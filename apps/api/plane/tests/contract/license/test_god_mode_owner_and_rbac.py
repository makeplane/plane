# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
End-to-end god-mode flows across both features:

1. A super-admin provisions a scoped admin through the management API,
   and that scoped admin's session honors menu RBAC across endpoints
   that previously carried explicit all-admin permission overrides.
2. A scoped workspace admin (not the GD) creates a workspace — the owner
   is the GD and the acting admin never becomes a member (features compose).
3. Grant changes take effect immediately on the next request.
"""

import uuid

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from plane.db.models import StaffProfile, User, Workspace, WorkspaceMember
from plane.license.menu_registry import ALL_PERMISSION_KEYS
from plane.license.models import Instance, InstanceAdmin


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
def gd_user(db):
    user = _make_user("general-director")
    StaffProfile.objects.create(
        user=user, staff_id="GD000001", job_grade="GD", employment_status="active"
    )
    return user


@pytest.mark.contract
class TestScopedAdminLifecycle:
    @pytest.mark.django_db
    def test_provision_then_enforce_then_regrant(self, super_admin, gd_user):
        super_client = _client_for(super_admin)

        # 1. Super-admin provisions a workspace-only admin via the API.
        scoped_user = _make_user("scoped-admin")
        resp = super_client.post(
            "/api/instances/admins/",
            {"email": scoped_user.email, "allowed_menus": ["workspace"]},
            format="json",
        )
        assert resp.status_code == 201
        admin_id = resp.data["id"]

        scoped_client = _client_for(scoped_user)

        # 2. Sidebar payload reflects the grants.
        me = scoped_client.get("/api/instances/admins/me/")
        assert me.status_code == 200
        assert me.data["is_super_admin"] is False
        assert me.data["allowed_menus"] == ["workspace"]

        # 3. Granted menu works; ungranted menus 403 — including endpoints
        # that carried explicit all-admin permission overrides pre-RBAC.
        assert scoped_client.get("/api/instances/workspaces/").status_code == 200
        assert scoped_client.get("/api/instances/users/").status_code == 403
        assert scoped_client.get("/api/instances/staff/").status_code == 403
        assert scoped_client.get("/api/instances/monitoring/email-logs/").status_code == 403
        assert scoped_client.get("/api/instances/admins/").status_code == 403  # no administrators menu
        assert scoped_client.post("/api/instances/swing-sso/test/", {}).status_code == 403

        # 4. The scoped admin can create a workspace — owned by the GD,
        # without themselves becoming a member (features compose).
        resp = scoped_client.post("/api/instances/workspaces/", {"name": "Composed", "slug": "composed"})
        assert resp.status_code == 201
        workspace = Workspace.objects.get(slug="composed")
        assert workspace.owner == gd_user
        assert not WorkspaceMember.objects.filter(workspace=workspace, member=scoped_user).exists()
        assert WorkspaceMember.objects.get(workspace=workspace, member=gd_user).role == 20

        # 5. Grant change is effective on the very next request.
        resp = super_client.patch(
            f"/api/instances/admins/{admin_id}/",
            {"allowed_menus": ["workspace", "users"]},
            format="json",
        )
        assert resp.status_code == 200
        assert scoped_client.get("/api/instances/users/").status_code == 200

        # 6. Revoking everything locks the admin down to shared paths only.
        resp = super_client.patch(
            f"/api/instances/admins/{admin_id}/", {"allowed_menus": []}, format="json"
        )
        assert resp.status_code == 200
        assert scoped_client.get("/api/instances/workspaces/").status_code == 403
        assert scoped_client.get("/api/instances/admins/me/").status_code == 200


@pytest.mark.contract
class TestAdministratorsMenuDelegation:
    @pytest.mark.django_db
    def test_delegated_admin_manages_within_own_menus_only(self, super_admin, instance):
        delegate = _make_user("delegate")
        InstanceAdmin.objects.create(
            instance=instance, user=delegate, role=20, allowed_menus=["administrators", "calendar"]
        )
        delegate_client = _client_for(delegate)

        target = _make_user("target")
        # Outside own menus -> denied; subset -> allowed; super flag -> denied.
        assert (
            delegate_client.post(
                "/api/instances/admins/", {"email": target.email, "allowed_menus": ["staff"]}, format="json"
            ).status_code
            == 403
        )
        assert (
            delegate_client.post(
                "/api/instances/admins/", {"email": target.email, "is_super_admin": True}, format="json"
            ).status_code
            == 403
        )
        resp = delegate_client.post(
            "/api/instances/admins/", {"email": target.email, "allowed_menus": ["calendar"]}, format="json"
        )
        assert resp.status_code == 201

        # The newly delegated admin can reach calendar, nothing else.
        target_client = _client_for(target)
        assert target_client.get("/api/instances/calendar/schedules/").status_code == 200
        assert target_client.get("/api/instances/workspaces/").status_code == 403
