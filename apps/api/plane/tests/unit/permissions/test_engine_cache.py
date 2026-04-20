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
Tests for caching and invalidation in PermissionEngine.
"""

import pytest
from uuid import uuid4

from django.core.cache import cache

from plane.permissions.engine import PERMISSION_CACHE_TTL
from plane.permissions.grants import Grant
from plane.permissions.cache import invalidate_cache_for_user
from plane.permissions.context import AccessResult
from plane.permissions.context import PermissionContext
from plane.permissions.definitions import WorkitemPermissions
from plane.db.models import Role
from plane.db.models.permission import RoleNamespace, PermissionScheme, RolePermissionScheme


@pytest.mark.django_db
class TestPermissionCache:
    """Test caching behavior of the permission engine."""

    def setup_method(self):
        """Clear cache before each test."""
        cache.clear()

    def test_cache_hit_returns_same_result(
        self, cached_engine, perm_project, perm_workspace, admin_user, project_admin
    ):
        """Second check() call returns cached result."""
        result1 = cached_engine.check(
            user=admin_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        result2 = cached_engine.check(
            user=admin_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result1.allowed == result2.allowed
        assert result1.conditions == result2.conditions

    def test_cache_stores_result_on_miss(
        self, cached_engine, perm_project, perm_workspace, admin_user, project_admin
    ):
        """After check(), result is in cache."""
        cached_engine.check(
            user=admin_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )

        cache_key = cached_engine._get_cache_key(
            admin_user.id,
            "workitem:view",
            PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        cached = cache.get(cache_key)
        assert cached is not None

    def test_cache_invalidation_on_grant(
        self, cached_engine, perm_project, perm_workspace, admin_user, project_admin
    ):
        """After grant(), cached result is invalidated (version incremented)."""
        # Populate cache
        cached_engine.check(
            user=admin_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        old_key = cached_engine._get_cache_key(
            admin_user.id,
            "workitem:view",
            PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )

        # Grant triggers invalidation (version increment)
        cached_engine.grant(
            granter=admin_user,
            grant=Grant(
                subject_type="user",
                subject_id=admin_user.id,
                relation="admin",
                resource_type="project",
                resource_id=perm_project.id,
                workspace_id=perm_workspace.id,
            ),
        )

        # Old cache key should be orphaned (new version)
        new_key = cached_engine._get_cache_key(
            admin_user.id,
            "workitem:view",
            PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert old_key != new_key

    def test_cache_invalidation_on_revoke(
        self, cached_engine, perm_project, perm_workspace, admin_user, project_admin
    ):
        """After revoke(), cached result is invalidated."""
        cached_engine.check(
            user=admin_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        old_key = cached_engine._get_cache_key(
            admin_user.id,
            "workitem:view",
            PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )

        cached_engine.revoke(
            revoker=admin_user,
            subject_type="user",
            subject_id=admin_user.id,
            resource_type="project",
            resource_id=perm_project.id,
            workspace_id=perm_workspace.id,
        )

        new_key = cached_engine._get_cache_key(
            admin_user.id,
            "workitem:view",
            PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert old_key != new_key

    def test_defer_conditions_separate_cache_key(
        self, cached_engine, perm_project, perm_workspace, member_user, project_contributor
    ):
        """defer_conditions=True uses different cache key than False."""
        # Normal check
        cached_engine.check(
            user=member_user,
            permission=WorkitemPermissions.DELETE,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        normal_key = cached_engine._get_cache_key(
            member_user.id,
            "workitem:delete",
            PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )

        deferred_key = cached_engine._get_cache_key(
            member_user.id,
            "workitem:delete",
            PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
            defer_conditions=True,
        )

        # Both should be distinct
        assert normal_key != deferred_key

    def test_cache_disabled_engine_always_resolves(
        self, engine, perm_project, perm_workspace, admin_user, project_admin
    ):
        """PermissionEngine(use_cache=False) always queries (no cache read/write)."""
        # engine fixture has use_cache=False
        result = engine.check(
            user=admin_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is True

        # Verify nothing was cached
        cache_key = engine._get_cache_key(
            admin_user.id,
            "workitem:view",
            PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert cache.get(cache_key) is None

    def test_version_increment_orphans_old_cache(self, cached_engine, admin_user):
        """Old cache key with old version is not used after version increment."""
        user_id = admin_user.id
        perm_str = "workitem:view"
        resource_id = uuid4()

        # Set a cached value at current version
        key_v0 = cached_engine._get_cache_key(
            user_id,
            perm_str,
            PermissionContext.resource(scope_id=resource_id),
        )
        cache.set(key_v0, {"allowed": True, "conditions": []}, PERMISSION_CACHE_TTL)

        # Increment version
        invalidate_cache_for_user(user_id)

        # New key should be different (new version)
        key_v1 = cached_engine._get_cache_key(
            user_id,
            perm_str,
            PermissionContext.resource(scope_id=resource_id),
        )
        assert key_v0 != key_v1

        # New key should be empty (cache miss)
        assert cache.get(key_v1) is None

    def test_access_result_cache_roundtrip(self):
        """AccessResult serializes to and deserializes from cache correctly."""
        original = AccessResult(allowed=True, conditions=("creator",))
        cached_data = original.to_cache()
        restored = AccessResult.from_cache(cached_data)
        assert restored.allowed == original.allowed
        assert restored.conditions == original.conditions

        # Also test unconditional
        original2 = AccessResult(allowed=True)
        restored2 = AccessResult.from_cache(original2.to_cache())
        assert restored2.allowed is True
        assert restored2.conditions == ()

        # Also test denied
        original3 = AccessResult(allowed=False)
        restored3 = AccessResult.from_cache(original3.to_cache())
        assert restored3.allowed is False

    def test_from_cache_missing_allowed_key(self):
        """Corrupted dict without 'allowed' fails closed."""
        assert AccessResult.from_cache({"conditions": ["creator"]}).allowed is False

    def test_from_cache_non_iterable_conditions(self):
        """Corrupted dict with non-iterable conditions fails closed."""
        assert AccessResult.from_cache({"allowed": True, "conditions": 42}).allowed is False

    def test_from_cache_garbage_type(self):
        """Non-dict, non-bool cache data fails closed."""
        assert AccessResult.from_cache("garbage").allowed is False
        assert AccessResult.from_cache(42).allowed is False
        assert AccessResult.from_cache(None).allowed is False

    def test_role_permission_change_invalidates_user_cache(
        self, cached_engine, perm_project, perm_workspace, guest_user, ws_guest
    ):
        """When a custom role's permissions change, affected users' caches are invalidated."""
        # Use guest_user who has ws_guest (workspace guest) but NO project membership.
        # Grant them a custom project role so custom role is the ONLY source of
        # workitem:view — this ensures the test isolates custom role resolution.

        # Create a custom role with workitem:view permission via PS
        custom_ps = PermissionScheme.objects.create(
            workspace=perm_workspace,
            namespace=RoleNamespace.PROJECT,
            slug="custom-viewer-ps",
            name="Custom Viewer PS",
            permissions=["workitem:view"],
        )
        custom_role = Role.objects.create(
            workspace=perm_workspace,
            namespace=RoleNamespace.PROJECT,
            name="Custom Viewer",
            slug="custom-viewer",
            level=10,
            is_system=False,
        )
        RolePermissionScheme.objects.create(role=custom_role, permission_scheme=custom_ps)

        # Grant guest_user the custom role on the project (bypasses system roles)
        cached_engine.grant(
            granter=guest_user,
            grant=Grant(
                subject_type="user",
                subject_id=guest_user.id,
                relation="custom-viewer",
                resource_type="project",
                resource_id=perm_project.id,
                workspace_id=perm_workspace.id,
            ),
        )

        # Verify check() returns True (populates user cache)
        result = cached_engine.check(
            user=guest_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is True

        # Capture the cache key before role change
        old_key = cached_engine._get_cache_key(
            guest_user.id,
            "workitem:view",
            PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )

        # Update PS to remove workitem:view — then invalidate role cache
        custom_ps.permissions = ["workitem:create"]
        custom_ps.save()
        from plane.permissions.cache import invalidate_caches_for_permission_scheme
        invalidate_caches_for_permission_scheme(custom_ps.id)

        # User cache version should have been incremented, orphaning the old key
        new_key = cached_engine._get_cache_key(
            guest_user.id,
            "workitem:view",
            PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert old_key != new_key

        # Verify check() now returns False (fresh resolution, role no longer grants workitem:view)
        result = cached_engine.check(
            user=guest_user,
            permission=WorkitemPermissions.VIEW,
            context=PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id),
        )
        assert result.allowed is False

    def test_role_permission_change_does_not_invalidate_other_workspace_users(
        self,
        cached_engine,
        perm_project,
        perm_workspace,
        other_project,
        other_workspace,
        guest_user,
        outsider_user,
    ):
        """Role update invalidates only users in the role's workspace."""
        role_slug = "shared-custom-viewer"
        ps_a = PermissionScheme.objects.create(
            workspace=perm_workspace, namespace=RoleNamespace.PROJECT,
            slug="viewer-a-ps", name="Viewer A PS",
            permissions=["workitem:view"],
        )
        role_a = Role.objects.create(
            workspace=perm_workspace,
            namespace=RoleNamespace.PROJECT,
            name="Viewer A",
            slug=role_slug,
            level=10,
            is_system=False,
        )
        RolePermissionScheme.objects.create(role=role_a, permission_scheme=ps_a)
        ps_b = PermissionScheme.objects.create(
            workspace=other_workspace, namespace=RoleNamespace.PROJECT,
            slug="viewer-b-ps", name="Viewer B PS",
            permissions=["workitem:view"],
        )
        role_b = Role.objects.create(
            workspace=other_workspace,
            namespace=RoleNamespace.PROJECT,
            name="Viewer B",
            slug=role_slug,
            level=10,
            is_system=False,
        )
        RolePermissionScheme.objects.create(role=role_b, permission_scheme=ps_b)

        cached_engine.grant(
            granter=guest_user,
            grant=Grant(
                subject_type="user",
                subject_id=guest_user.id,
                relation=role_slug,
                resource_type="project",
                resource_id=perm_project.id,
                workspace_id=perm_workspace.id,
            ),
        )
        cached_engine.grant(
            granter=outsider_user,
            grant=Grant(
                subject_type="user",
                subject_id=outsider_user.id,
                relation=role_slug,
                resource_type="project",
                resource_id=other_project.id,
                workspace_id=other_workspace.id,
            ),
        )

        context_a = PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id)
        context_b = PermissionContext.project(project_id=other_project.id, workspace_id=other_workspace.id)

        assert cached_engine.check(
            user=guest_user,
            permission=WorkitemPermissions.VIEW,
            context=context_a,
        ).allowed is True
        assert cached_engine.check(
            user=outsider_user,
            permission=WorkitemPermissions.VIEW,
            context=context_b,
        ).allowed is True

        old_key_a = cached_engine._get_cache_key(guest_user.id, "workitem:view", context_a)
        old_key_b = cached_engine._get_cache_key(outsider_user.id, "workitem:view", context_b)

        ps_a.permissions = ["workitem:create"]
        ps_a.save()
        from plane.permissions.cache import invalidate_caches_for_permission_scheme
        invalidate_caches_for_permission_scheme(ps_a.id)

        new_key_a = cached_engine._get_cache_key(guest_user.id, "workitem:view", context_a)
        new_key_b = cached_engine._get_cache_key(outsider_user.id, "workitem:view", context_b)

        assert old_key_a != new_key_a
        assert old_key_b == new_key_b
        assert cached_engine.check(
            user=outsider_user,
            permission=WorkitemPermissions.VIEW,
            context=context_b,
        ).allowed is True

    def test_cache_invalidation_on_teamspace_project_grant(
        self,
        cached_engine,
        perm_teamspace,
        perm_project,
        perm_workspace,
        member_user,
        teamspace_member_fixture,
    ):
        """After granting a teamspace access to a project, member users' caches are invalidated."""
        context = PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id)

        # Populate member_user's permission cache
        cached_engine.check(
            user=member_user,
            permission=WorkitemPermissions.VIEW,
            context=context,
        )
        old_key = cached_engine._get_cache_key(member_user.id, "workitem:view", context)

        # Grant teamspace access to project (subject_type="teamspace")
        cached_engine.grant(
            granter=member_user,
            grant=Grant(
                subject_type="teamspace",
                subject_id=perm_teamspace.id,
                relation="contributor",
                resource_type="project",
                resource_id=perm_project.id,
                workspace_id=perm_workspace.id,
            ),
        )

        # member_user's cache version should be incremented (old key orphaned)
        new_key = cached_engine._get_cache_key(member_user.id, "workitem:view", context)
        assert old_key != new_key

    def test_cache_invalidation_on_teamspace_project_revoke(
        self,
        cached_engine,
        perm_teamspace,
        perm_project,
        perm_workspace,
        member_user,
        teamspace_member_fixture,
        teamspace_project_link,
    ):
        """After revoking a teamspace's project access, member users' caches are invalidated."""
        context = PermissionContext.project(project_id=perm_project.id, workspace_id=perm_workspace.id)

        # Populate member_user's permission cache
        cached_engine.check(
            user=member_user,
            permission=WorkitemPermissions.VIEW,
            context=context,
        )
        old_key = cached_engine._get_cache_key(member_user.id, "workitem:view", context)

        # Revoke teamspace-project link
        cached_engine.revoke(
            revoker=member_user,
            subject_type="teamspace",
            subject_id=perm_teamspace.id,
            resource_type="project",
            resource_id=perm_project.id,
            workspace_id=perm_workspace.id,
        )

        # member_user's cache version should be incremented (old key orphaned)
        new_key = cached_engine._get_cache_key(member_user.id, "workitem:view", context)
        assert old_key != new_key
