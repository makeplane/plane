# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Instance-admin menu RBAC tests (route-group enforcement).

Covers:
- menu registry: URL-prefix -> menu resolution, shared paths, fail-closed
  None for unmapped paths, swing-sso grouping under settings.
- InstanceAdminMenuPermission end-to-end through real endpoints (proves the
  permission override sweep landed, not just the base default).
- migration backfill: real admins become super, ghost (user=NULL) rows do not.
- setup sign-up creates the first admin as super with all menus.
"""

import importlib
import uuid

import pytest
from django.apps import apps as django_apps
from django.utils import timezone
from rest_framework.test import APIClient

from plane.db.models import User
from plane.license.menu_registry import (
    ALL_PERMISSION_KEYS,
    PERMISSION_KEYS,
    is_shared_path,
    required_menu_for_path,
)
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
def workspace_only_admin(db, instance):
    user = _make_user("workspace-admin")
    InstanceAdmin.objects.create(
        instance=instance, user=user, role=20, is_super_admin=False, allowed_menus=["workspace"]
    )
    return user


@pytest.mark.unit
class TestMenuRegistry:
    def test_permission_keys_are_the_twelve_canonical_menus(self):
        assert len(PERMISSION_KEYS) == 12
        assert "administrators" in PERMISSION_KEYS
        assert "settings" in PERMISSION_KEYS
        assert "authentication" not in PERMISSION_KEYS  # folded into settings

    @pytest.mark.parametrize(
        ("path", "menu"),
        [
            ("/api/instances/workspaces/", "workspace"),
            ("/api/instances/workspaces/owner-options/", "workspace"),
            ("/api/instances/workspace-slug-check/", "workspace"),
            ("/api/instances/bulk-import-projects/", "workspace"),
            ("/api/instances/bulk-import-modules/", "workspace"),
            ("/api/instances/users/", "users"),
            ("/api/instances/users/bulk-import/", "users"),
            ("/api/instances/departments/tree/", "departments"),
            ("/api/instances/staff/stats/", "staff"),
            ("/api/instances/configurations/", "settings"),
            ("/api/instances/email-credentials-check/", "settings"),
            ("/api/instances/swing-sso/test/", "settings"),
            ("/api/instances/task-categories/main/", "task-categories"),
            ("/api/instances/help/articles/", "help-center"),
            ("/api/instances/job-positions/grades/", "job-positions"),
            ("/api/instances/calendar/schedules/", "calendar"),
            ("/api/instances/monitoring/email-logs/", "monitoring"),
            ("/api/instances/usage-monitor/users/", "usage-monitor"),
            ("/api/instances/admins/", "administrators"),
        ],
    )
    def test_required_menu_for_path(self, path, menu):
        assert required_menu_for_path(path) == menu

    def test_unmapped_path_resolves_to_none(self):
        assert required_menu_for_path("/api/instances/not-a-real-group/") is None

    def test_non_instance_path_resolves_to_none(self):
        assert required_menu_for_path("/api/workspaces/foo/") is None

    def test_instance_root_resolves_to_settings(self):
        # PATCH /api/instances/ updates instance settings; GET is AllowAny on
        # the view itself, so the root maps to the settings menu (exact match,
        # never a catch-all prefix).
        assert required_menu_for_path("/api/instances/") == "settings"

    @pytest.mark.parametrize(
        "path",
        [
            "/api/instances/admins/me/",
            "/api/instances/admins/session/",
            "/api/instances/admins/sign-in/",
            "/api/instances/admins/sign-up/",
            "/api/instances/admins/sign-out/",
            "/api/instances/admins/sign-up-screen-visited/",
        ],
    )
    def test_shared_paths(self, path):
        assert is_shared_path(path) is True

    def test_admins_management_is_not_shared(self):
        assert is_shared_path("/api/instances/admins/") is False
        admin_detail = f"/api/instances/admins/{uuid.uuid4()}/"
        assert is_shared_path(admin_detail) is False
        assert required_menu_for_path(admin_detail) == "administrators"


@pytest.mark.unit
class TestInstanceAdminMenuPermission:
    @pytest.mark.django_db
    def test_super_admin_allowed_everywhere(self, super_admin):
        client = _client_for(super_admin)
        assert client.get("/api/instances/users/").status_code == 200
        assert client.get("/api/instances/workspaces/").status_code == 200
        assert client.get("/api/instances/monitoring/email-logs/").status_code == 200

    @pytest.mark.django_db
    def test_scoped_admin_allowed_on_granted_menu(self, workspace_only_admin):
        client = _client_for(workspace_only_admin)
        assert client.get("/api/instances/workspaces/").status_code == 200

    @pytest.mark.django_db
    def test_scoped_admin_denied_on_ungranted_menu(self, workspace_only_admin):
        client = _client_for(workspace_only_admin)
        # users/ carried an explicit per-class permission override before the
        # sweep — a 403 here proves the sweep landed, not just the base default.
        assert client.get("/api/instances/users/").status_code == 403
        assert client.get("/api/instances/monitoring/email-logs/").status_code == 403
        assert client.get("/api/instances/staff/").status_code == 403

    @pytest.mark.django_db
    def test_scoped_admin_allowed_on_shared_path(self, workspace_only_admin):
        client = _client_for(workspace_only_admin)
        assert client.get("/api/instances/admins/me/").status_code == 200

    @pytest.mark.django_db
    def test_empty_menus_admin_denied_everywhere_but_shared(self, instance):
        user = _make_user("no-menu-admin")
        InstanceAdmin.objects.create(instance=instance, user=user, role=20)
        client = _client_for(user)
        assert client.get("/api/instances/workspaces/").status_code == 403
        assert client.get("/api/instances/users/").status_code == 403
        assert client.get("/api/instances/admins/me/").status_code == 200

    @pytest.mark.django_db
    def test_non_admin_denied(self, instance):
        client = _client_for(_make_user("outsider"))
        assert client.get("/api/instances/workspaces/").status_code == 403

    @pytest.mark.django_db
    def test_anonymous_denied(self, instance):
        assert APIClient().get("/api/instances/workspaces/").status_code in (401, 403)


@pytest.mark.unit
class TestBackfillMigration:
    def _backfill(self):
        migration = importlib.import_module("plane.license.migrations.0007_instance_admin_menu_permissions")
        migration.backfill_super_admins(django_apps, None)

    @pytest.mark.django_db
    def test_real_admins_backfilled_as_super_with_all_menus(self, instance):
        user = _make_user("legacy-admin")
        admin = InstanceAdmin.objects.create(instance=instance, user=user, role=20)
        self._backfill()
        admin.refresh_from_db()
        assert admin.is_super_admin is True
        assert set(admin.allowed_menus) == set(ALL_PERMISSION_KEYS)

    @pytest.mark.django_db
    def test_ghost_rows_not_stamped_super(self, instance):
        user = _make_user("ghost-admin")
        admin = InstanceAdmin.objects.create(instance=instance, user=user, role=20)
        InstanceAdmin.objects.filter(pk=admin.pk).update(user=None)
        self._backfill()
        admin.refresh_from_db()
        assert admin.is_super_admin is False

    @pytest.mark.django_db
    def test_zero_admin_instance_is_noop(self, instance):
        self._backfill()
        assert InstanceAdmin.objects.count() == 0


@pytest.mark.unit
class TestSetupCreatesSuperAdmin:
    @pytest.mark.django_db
    def test_signup_first_admin_is_super_with_all_menus(self, instance):
        client = APIClient()
        client.post(
            "/api/instances/admins/sign-up/",
            {
                "email": "first-admin@example.com",
                "password": "Str0ng!Passw0rd#2026",
                "first_name": "First",
                "last_name": "Admin",
            },
            HTTP_USER_AGENT="pytest",
        )
        admin = InstanceAdmin.objects.filter(user__email="first-admin@example.com").first()
        assert admin is not None
        assert admin.is_super_admin is True
        assert set(admin.allowed_menus) == set(ALL_PERMISSION_KEYS)
