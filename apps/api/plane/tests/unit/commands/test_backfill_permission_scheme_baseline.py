# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""
Tests for the ``backfill_permission_scheme_baseline`` management command.
"""

from io import StringIO
from uuid import uuid4

import pytest
from crum import impersonate
from django.core.management import call_command


@pytest.fixture
def workspace_owner(db):
    from plane.db.models import User

    uid = uuid4().hex[:8]
    user = User.objects.create(
        email=f"backfill-owner-{uid}@test.plane.so",
        username=f"backfill_owner_{uid}",
    )
    user.set_password("testpass123")
    user.save(update_fields=["password"])
    return user


@pytest.fixture
def workspace(db, workspace_owner):
    from plane.db.models import Workspace

    with impersonate(workspace_owner):
        return Workspace.objects.create(
            slug=f"backfill-ws-{uuid4().hex[:8]}",
            name="Backfill Test",
            owner=workspace_owner,
        )


@pytest.mark.django_db
class TestBackfillPermissionSchemeBaseline:
    def _make_scheme(self, workspace, namespace, slug, permissions):
        from plane.db.models.permission import PermissionScheme

        return PermissionScheme.objects.create(
            workspace=workspace,
            namespace=namespace,
            slug=slug,
            name=slug.replace("-", " ").title(),
            permissions=permissions,
        )

    def _run(self, **kwargs):
        buf = StringIO()
        call_command("backfill_permission_scheme_baseline", stdout=buf, **kwargs)
        return buf.getvalue()

    def test_adds_workspace_view_to_workspace_scheme(self, workspace):
        ps = self._make_scheme(workspace, "workspace", "ws-no-view", ["wiki:view"])

        self._run()

        ps.refresh_from_db()
        assert "workspace:view" in ps.permissions
        assert "wiki:view" in ps.permissions

    def test_adds_project_view_to_project_scheme(self, workspace):
        ps = self._make_scheme(workspace, "project", "proj-no-view", ["workitem:edit"])

        self._run()

        ps.refresh_from_db()
        assert "project:view" in ps.permissions
        assert "workitem:edit" in ps.permissions

    def test_idempotent_when_already_present(self, workspace):
        ps = self._make_scheme(
            workspace, "project", "proj-ok", ["project:view", "workitem:edit"]
        )
        original = list(ps.permissions)

        output = self._run()

        ps.refresh_from_db()
        assert ps.permissions == original
        assert "already complete 1" in output

    def test_skips_system_schemes(self, workspace):
        from plane.db.models.permission import PermissionScheme

        system_ps = PermissionScheme.objects.create(
            workspace=None,
            namespace="workspace",
            slug="system-no-view",
            name="System No View",
            is_system=True,
            permissions=["wiki:view"],
        )

        self._run()

        system_ps.refresh_from_db()
        assert "workspace:view" not in system_ps.permissions

    def test_skips_soft_deleted_schemes(self, workspace):
        from django.utils import timezone

        ps = self._make_scheme(
            workspace, "project", "proj-deleted", ["workitem:edit"]
        )
        ps.deleted_at = timezone.now()
        ps.save(update_fields=["deleted_at"])

        self._run()

        ps.refresh_from_db()
        assert "project:view" not in ps.permissions

    def test_dry_run_does_not_write(self, workspace):
        ps = self._make_scheme(workspace, "project", "proj-dry", ["workitem:edit"])

        output = self._run(dry_run=True)

        ps.refresh_from_db()
        assert "project:view" not in ps.permissions
        assert "would backfill 1" in output

    def test_workspace_filter_scopes_updates(self, workspace, workspace_owner):
        from plane.db.models import Workspace

        with impersonate(workspace_owner):
            other_ws = Workspace.objects.create(
                slug=f"other-ws-{uuid4().hex[:8]}",
                name="Other",
                owner=workspace_owner,
            )

        in_scope = self._make_scheme(workspace, "project", "p1", ["workitem:edit"])
        out_of_scope = self._make_scheme(other_ws, "project", "p2", ["workitem:edit"])

        self._run(workspace=workspace.slug)

        in_scope.refresh_from_db()
        out_of_scope.refresh_from_db()
        assert "project:view" in in_scope.permissions
        assert "project:view" not in out_of_scope.permissions
