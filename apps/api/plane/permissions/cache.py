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
Permission Cache Invalidation

Centralized cache invalidation for the permission system. Both the permission
engine (cache reads) and grant operations (cache writes) use these functions.

Cache strategy:
- Versioned per-user keys: perm_v:{user_id} stores the current version
- Permission checks include the version in their cache key
- Invalidation increments the version, orphaning all previous entries
- Orphaned entries expire naturally via PERMISSION_CACHE_TTL
"""

import logging
from typing import Iterable
from uuid import UUID

from django.core.cache import cache

logger = logging.getLogger(__name__)

# TTL for version counter keys — bounds Redis memory growth from churned users.
# Must be longer than PERMISSION_CACHE_TTL (300s) to avoid orphaned entries
# being read before the version key expires.
VERSION_KEY_TTL = 86400  # 24 hours


def invalidate_cache_for_user(user_id: UUID) -> None:
    """
    Invalidate all cached permissions for a user via version increment.

    Uses raw Redis INCR (atomic, auto-creates at 1 for missing keys)
    instead of Django's cache.incr() to avoid the race condition where
    two concurrent callers both set the version to 1.
    """
    version_key = f"perm_v:{user_id}"
    try:
        from django_redis import get_redis_connection

        client = get_redis_connection("default")
        raw_key = cache.make_key(version_key)
        client.incr(raw_key)
        client.expire(raw_key, VERSION_KEY_TTL)
    except Exception:
        logger.warning("[PERM] Cache invalidation failed for user %s", user_id)


def bulk_invalidate_cache_for_users(user_ids: Iterable[UUID]) -> None:
    """
    Invalidate cached permissions for multiple users in a single Redis round-trip.

    Uses a Redis pipeline to batch all INCR operations. Falls back to
    sequential invalidation if pipelining is unavailable.
    """
    user_ids = list(user_ids)
    if not user_ids:
        return

    # Single user — no pipeline overhead needed
    if len(user_ids) == 1:
        invalidate_cache_for_user(user_ids[0])
        return

    try:
        from django_redis import get_redis_connection

        client = get_redis_connection("default")
        pipe = client.pipeline(transaction=False)
        for user_id in user_ids:
            # make_key applies the Django cache key prefix (e.g., ":1:")
            raw_key = cache.make_key(f"perm_v:{user_id}")
            pipe.incr(raw_key)
            pipe.expire(raw_key, VERSION_KEY_TTL)

        pipe.execute()
        # INCR on a non-existent key returns 1 in Redis (auto-creates it),
        # so no fallback to SET is needed when using the raw client.
        logger.debug("[CACHE] Bulk-invalidated %d user caches via pipeline", len(user_ids))
    except Exception:
        logger.debug("[CACHE] Pipeline unavailable, falling back to sequential invalidation", exc_info=True)
        for user_id in user_ids:
            invalidate_cache_for_user(user_id)


def invalidate_cache_for_resource(resource_type: str, resource_id: UUID) -> None:
    """
    Resource-level invalidation stub. No action needed here because:
    - User permission changes (grant/revoke): handled by invalidate_cache_for_user()
    - Role permission changes: handled by Role._invalidate_role_cache() which
      deletes the role cache AND invalidates all affected user caches.
    """
    pass


def invalidate_caches_for_subject(subject_type: str, subject_id: UUID) -> None:
    """
    Invalidate all user-level caches affected by a permission change on the given subject.

    For user subjects: directly invalidates the user's cache.
    For non-user subjects (e.g., teamspace): fans out to invalidate all member users'
    caches by querying the ResourcePermission table for user->subject memberships.
    """
    if subject_type == "user":
        invalidate_cache_for_user(subject_id)
        return

    from plane.db.models import ResourcePermission

    # Fan-out: find all users who are members of this subject
    # Covered by index: idx_rp_res_subjtype_active (resource_type, resource_id, subject_type)
    user_ids = ResourcePermission.objects.filter(
        resource_type=subject_type,
        resource_id=subject_id,
        subject_type="user",
        deleted_at__isnull=True,
    ).values_list("subject_id", flat=True)

    bulk_invalidate_cache_for_users(user_ids)


def invalidate_caches_for_permission_scheme(permission_scheme_id):
    """
    Invalidate caches when a PermissionScheme's permissions change.

    Finds all roles referencing this PS, deletes their role-level cache keys,
    then invalidates all affected users' permission caches (scoped per workspace).
    """
    from django.db.models import Q
    from plane.db.models.permission import ResourcePermission, Role

    role_rows = list(
        Role.objects.filter(
            role_permission_schemes__permission_scheme_id=permission_scheme_id,
            role_permission_schemes__deleted_at__isnull=True,
            deleted_at__isnull=True,
        ).values_list("slug", "namespace", "workspace_id").distinct()
    )

    if not role_rows:
        return

    # Delete role-level caches
    role_keys = []
    for slug, namespace, ws_id in role_rows:
        if ws_id:
            role_keys.append(f"role_perms:{ws_id}:{namespace}:{slug}")
        else:
            role_keys.append(f"role_perms:instance:{namespace}:{slug}")
    cache.delete_many(role_keys)

    # Batch user lookup: single query with OR'd conditions per (slug, workspace)
    user_filter = Q()
    for slug, _namespace, ws_id in role_rows:
        if ws_id:
            user_filter |= Q(relation=slug, workspace_id=ws_id)
        else:
            user_filter |= Q(relation=slug, workspace_id__isnull=True)

    affected_user_ids = (
        ResourcePermission.objects.filter(
            user_filter, subject_type="user", deleted_at__isnull=True,
        ).values_list("subject_id", flat=True).distinct()
    )
    bulk_invalidate_cache_for_users(affected_user_ids)


def invalidate_caches_for_role_composition_change(role):
    """
    Invalidate caches when a role's PS composition changes (add/remove PS).
    Delegates to the role's existing _invalidate_role_cache() method.
    """
    role._invalidate_role_cache()
