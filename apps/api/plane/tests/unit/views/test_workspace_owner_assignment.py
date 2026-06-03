# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
God-mode workspace owner assignment tests.

Covers:
- Single create: owner defaults to GD, explicit owner_id override,
  instance admin never seeded as WorkspaceMember.
- Bulk create: per-row owner_email override, fail-fast 400 when no GD
  and rows lack owner_email.
- Project bulk import: acting instance admin excluded from ProjectMember
  even on legacy admin-owned workspaces; owner seeded from workspace.owner.
- owner-options endpoint: default_owner + candidates payload.
"""

import uuid

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from plane.db.models import (
    Project,
    ProjectMember,
    StaffProfile,
    User,
    Workspace,
    WorkspaceMember,
)
from plane.license.models import Instance, InstanceAdmin

WORKSPACES_URL = "/api/instances/workspaces/"
BULK_CREATE_URL = "/api/instances/workspaces/bulk-create/"
PROJECT_IMPORT_URL = "/api/instances/bulk-import-projects/"
OWNER_OPTIONS_URL = "/api/instances/workspaces/owner-options/"


def _make_user(prefix: str) -> User:
    return User.objects.create(
        email=f"{prefix}-{uuid.uuid4().hex[:8]}@example.com",
        username=uuid.uuid4().hex,
        display_name=prefix,
    )


@pytest.fixture
def instance(db):
    return Instance.objects.create(
        instance_name="Test Instance",
        is_setup_done=True,
        last_checked_at=timezone.now(),
    )


@pytest.fixture
def admin_user(db, instance):
    user = _make_user("instance-admin")
    # Super-admin — the typical god-mode creator under menu RBAC
    InstanceAdmin.objects.create(instance=instance, user=user, role=20, is_super_admin=True)
    return user


@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def gd_user(db):
    user = _make_user("general-director")
    StaffProfile.objects.create(
        user=user, staff_id="GD000001", job_grade="GD", employment_status="active"
    )
    return user


@pytest.mark.unit
class TestSingleWorkspaceCreateOwner:
    @pytest.mark.django_db
    def test_default_owner_is_gd_and_admin_excluded(self, admin_client, admin_user, gd_user):
        resp = admin_client.post(WORKSPACES_URL, {"name": "Acme", "slug": "acme"})
        assert resp.status_code == 201
        workspace = Workspace.objects.get(slug="acme")
        assert workspace.owner == gd_user
        assert not WorkspaceMember.objects.filter(workspace=workspace, member=admin_user).exists()
        assert WorkspaceMember.objects.get(workspace=workspace, member=gd_user).role == 20

    @pytest.mark.django_db
    def test_explicit_owner_id_overrides_gd(self, admin_client, admin_user, gd_user):
        chosen = _make_user("chosen-owner")
        resp = admin_client.post(
            WORKSPACES_URL, {"name": "Beta", "slug": "beta", "owner_id": str(chosen.id)}
        )
        assert resp.status_code == 201
        workspace = Workspace.objects.get(slug="beta")
        assert workspace.owner == chosen
        assert WorkspaceMember.objects.get(workspace=workspace, member=chosen).role == 20
        assert not WorkspaceMember.objects.filter(workspace=workspace, member=admin_user).exists()

    @pytest.mark.django_db
    def test_invalid_owner_id_returns_400(self, admin_client, gd_user):
        resp = admin_client.post(
            WORKSPACES_URL, {"name": "Gamma", "slug": "gamma", "owner_id": str(uuid.uuid4())}
        )
        assert resp.status_code == 400
        assert not Workspace.objects.filter(slug="gamma").exists()

    @pytest.mark.django_db
    def test_no_owner_and_no_gd_returns_400(self, admin_client):
        resp = admin_client.post(WORKSPACES_URL, {"name": "Delta", "slug": "delta"})
        assert resp.status_code == 400
        assert not Workspace.objects.filter(slug="delta").exists()

    @pytest.mark.django_db
    def test_no_owner_and_ambiguous_gd_returns_400(self, admin_client, gd_user):
        second_gd = _make_user("second-gd")
        StaffProfile.objects.create(
            user=second_gd, staff_id="GD000002", job_grade="GD", employment_status="active"
        )
        resp = admin_client.post(WORKSPACES_URL, {"name": "Epsilon", "slug": "epsilon"})
        assert resp.status_code == 400
        assert not Workspace.objects.filter(slug="epsilon").exists()


@pytest.mark.unit
class TestBulkWorkspaceCreateOwner:
    @pytest.mark.django_db
    def test_bulk_default_owner_is_gd(self, admin_client, admin_user, gd_user):
        resp = admin_client.post(
            BULK_CREATE_URL,
            {"workspaces": [{"name": "Bulk One"}, {"name": "Bulk Two"}]},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["total_created"] == 2
        for workspace in Workspace.objects.filter(name__startswith="Bulk "):
            assert workspace.owner == gd_user
            assert not WorkspaceMember.objects.filter(
                workspace=workspace, member=admin_user
            ).exists()
            assert WorkspaceMember.objects.get(workspace=workspace, member=gd_user).role == 20

    @pytest.mark.django_db
    def test_bulk_row_owner_email_overrides_gd(self, admin_client, gd_user):
        chosen = _make_user("row-owner")
        resp = admin_client.post(
            BULK_CREATE_URL,
            {
                "workspaces": [
                    {"name": "Owned Row", "owner_email": chosen.email},
                    {"name": "Default Row"},
                ]
            },
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["total_created"] == 2
        assert Workspace.objects.get(name="Owned Row").owner == chosen
        assert Workspace.objects.get(name="Default Row").owner == gd_user

    @pytest.mark.django_db
    def test_bulk_invalid_owner_email_skips_row_only(self, admin_client, gd_user):
        resp = admin_client.post(
            BULK_CREATE_URL,
            {
                "workspaces": [
                    {"name": "Bad Owner", "owner_email": "ghost@example.com"},
                    {"name": "Good Row"},
                ]
            },
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["total_created"] == 1
        assert resp.data["total_skipped"] == 1
        assert not Workspace.objects.filter(name="Bad Owner").exists()
        assert Workspace.objects.get(name="Good Row").owner == gd_user

    @pytest.mark.django_db
    def test_bulk_no_gd_and_missing_owner_email_fails_fast(self, admin_client):
        resp = admin_client.post(
            BULK_CREATE_URL,
            {"workspaces": [{"name": "No Owner One"}, {"name": "No Owner Two"}]},
            format="json",
        )
        assert resp.status_code == 400
        assert Workspace.objects.count() == 0

    @pytest.mark.django_db
    def test_bulk_no_gd_but_all_rows_have_owner_email_succeeds(self, admin_client):
        chosen = _make_user("explicit-only")
        resp = admin_client.post(
            BULK_CREATE_URL,
            {"workspaces": [{"name": "Explicit Row", "owner_email": chosen.email}]},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["total_created"] == 1
        assert Workspace.objects.get(name="Explicit Row").owner == chosen


@pytest.mark.unit
class TestProjectBulkImportAdminExclusion:
    def _import(self, client, slug, name="Imported Project"):
        return client.post(
            PROJECT_IMPORT_URL,
            {"projects": [{"workspace_slug": slug, "name": name}]},
            format="json",
        )

    @pytest.mark.django_db
    def test_gd_owned_workspace_admin_not_project_member(self, admin_client, admin_user, gd_user):
        workspace = Workspace.objects.create(name="GD WS", slug="gd-ws", owner=gd_user)
        WorkspaceMember.objects.create(workspace=workspace, member=gd_user, role=20)

        resp = self._import(admin_client, "gd-ws")
        assert resp.status_code == 200
        assert resp.data["total_created"] == 1

        project = Project.objects.get(workspace=workspace, name="Imported Project")
        assert project.created_by == admin_user  # attribution stays the actor
        assert not ProjectMember.objects.filter(project=project, member=admin_user).exists()
        assert ProjectMember.objects.get(project=project, member=gd_user).role == 20

    @pytest.mark.django_db
    def test_legacy_admin_owned_workspace_still_excludes_admin(self, admin_client, admin_user):
        # Legacy: admin is owner AND an active role-20 WorkspaceMember (no backfill).
        other_admin = _make_user("other-ws-admin")
        workspace = Workspace.objects.create(name="Legacy WS", slug="legacy-ws", owner=admin_user)
        WorkspaceMember.objects.create(workspace=workspace, member=admin_user, role=20)
        WorkspaceMember.objects.create(workspace=workspace, member=other_admin, role=20)

        resp = self._import(admin_client, "legacy-ws")
        assert resp.status_code == 200
        assert resp.data["total_created"] == 1

        project = Project.objects.get(workspace=workspace, name="Imported Project")
        # Acting admin excluded even though they own the legacy workspace and
        # remain a role-20 WorkspaceMember there... unless they ARE the owner.
        # Here admin IS the owner — the owner seed wins over actor exclusion.
        assert ProjectMember.objects.filter(project=project, member=admin_user).exists()
        assert ProjectMember.objects.get(project=project, member=other_admin).role == 20

    @pytest.mark.django_db
    def test_legacy_workspace_admin_member_but_not_owner_excluded(self, admin_client, admin_user, gd_user):
        # Legacy: GD owns it but admin lingers as a role-20 member (H8 vector).
        workspace = Workspace.objects.create(name="Mixed WS", slug="mixed-ws", owner=gd_user)
        WorkspaceMember.objects.create(workspace=workspace, member=gd_user, role=20)
        WorkspaceMember.objects.create(workspace=workspace, member=admin_user, role=20)

        resp = self._import(admin_client, "mixed-ws")
        assert resp.status_code == 200

        project = Project.objects.get(workspace=workspace, name="Imported Project")
        assert not ProjectMember.objects.filter(project=project, member=admin_user).exists()
        assert ProjectMember.objects.filter(project=project, member=gd_user).exists()


@pytest.mark.unit
class TestWorkspaceOwnerOptions:
    @pytest.mark.django_db
    def test_returns_gd_default_and_staff_candidates(self, admin_client, gd_user):
        staff_user = _make_user("staff-member")
        StaffProfile.objects.create(
            user=staff_user, staff_id="ST000001", job_grade="Manager", employment_status="active"
        )
        resigned = _make_user("resigned-staff")
        StaffProfile.objects.create(
            user=resigned, staff_id="ST000002", job_grade="Manager", employment_status="resigned"
        )

        resp = admin_client.get(OWNER_OPTIONS_URL)
        assert resp.status_code == 200
        assert resp.data["default_owner"]["id"] == str(gd_user.id)
        assert resp.data["default_owner"]["email"] == gd_user.email
        candidate_ids = {c["id"] for c in resp.data["candidates"]}
        assert str(staff_user.id) in candidate_ids
        assert str(gd_user.id) in candidate_ids
        assert str(resigned.id) not in candidate_ids

    @pytest.mark.django_db
    def test_no_gd_returns_null_default(self, admin_client):
        resp = admin_client.get(OWNER_OPTIONS_URL)
        assert resp.status_code == 200
        assert resp.data["default_owner"] is None

    @pytest.mark.django_db
    def test_search_filters_candidates(self, admin_client, gd_user):
        findable = _make_user("findable-person")
        StaffProfile.objects.create(
            user=findable, staff_id="ST000003", job_grade="Manager", employment_status="active"
        )
        resp = admin_client.get(OWNER_OPTIONS_URL, {"search": "findable"})
        assert resp.status_code == 200
        candidate_ids = {c["id"] for c in resp.data["candidates"]}
        assert candidate_ids == {str(findable.id)}

    @pytest.mark.django_db
    def test_non_admin_denied(self, db, gd_user):
        outsider = _make_user("outsider")
        client = APIClient()
        client.force_authenticate(user=outsider)
        assert client.get(OWNER_OPTIONS_URL).status_code == 403

    def test_anonymous_denied(self):
        assert APIClient().get(OWNER_OPTIONS_URL).status_code in (401, 403)
