# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Permission mapping and caching for external references (P1-INT-05, P1-INT-07).

Visibility is the intersection of the Plane object ACL and the source system's
ACL hint. When the source cannot decide, the reference is denied - failing open
would leak another system's data.
"""

import hashlib

from django.core.cache import cache

from plane.research.utils.acl import build_actor_context

REFERENCE_CACHE_TTL = 300
DEGRADED_CACHE_TTL = 30


def actor_acl_dimension(actor, workspace_id):
    """Compact description of the caller's ACL inputs, part of every cache key."""
    context = build_actor_context(actor, workspace_id)
    parts = [
        str(context.user_id),
        "admin" if context.is_workspace_admin else "member",
        ",".join(sorted(str(unit) for unit in context.unit_ids)),
        ",".join(sorted(str(unit) for unit in context.managing_unit_ids)),
        ",".join(sorted(str(mentee) for mentee in context.advises)),
    ]
    digest = hashlib.sha256("|".join(parts).encode()).hexdigest()
    return digest[:16]


def cache_key(workspace_id, system, operation, query, actor, *, page=None, extra=""):
    dimension = actor_acl_dimension(actor, workspace_id)
    digest = hashlib.sha256(f"{query}|{page}|{extra}".encode()).hexdigest()[:24]
    return f"research:integration:{workspace_id}:{system}:{operation}:{dimension}:{digest}"


def get_cached(key):
    return cache.get(key)


def set_cached(key, value, *, degraded=False, ttl=None):
    ttl = ttl or (DEGRADED_CACHE_TTL if degraded else REFERENCE_CACHE_TTL)
    cache.set(key, value, ttl)
    return value


def reference_allowed(reference, actor, workspace_id) -> bool:
    """Source side of the visibility intersection."""
    hint = reference.acl_hint or {}
    if hint.get("public") is True:
        return True
    context = build_actor_context(actor, workspace_id)
    users = {str(user) for user in hint.get("users", [])}
    units = {str(unit) for unit in hint.get("org_units", [])}
    if not users and not units:
        # the source system gave us nothing to decide on: default deny
        return False
    if str(context.user_id) in users:
        return True
    return bool(units & {str(unit) for unit in context.unit_ids | context.managing_unit_ids})


def filter_references(references, actor, workspace_id):
    return [reference for reference in references if reference_allowed(reference, actor, workspace_id)]


def filter_source_items(items, actor, workspace_id, *, plane_resource=None):
    """Filter source items by the intersection of both ACL sides."""
    context = build_actor_context(actor, workspace_id)
    allowed = []
    for item in items:
        if plane_resource is not None:
            from plane.research.utils.acl import check_access

            if not check_access(actor, "view", plane_resource, context=context):
                continue
        hint = item.get("acl_hint") or {}
        if hint.get("public") is True:
            allowed.append(item)
            continue
        users = {str(user) for user in hint.get("users", [])}
        units = {str(unit) for unit in hint.get("org_units", [])}
        if not users and not units:
            continue
        if str(context.user_id) in users:
            allowed.append(item)
            continue
        if units & {str(unit) for unit in context.unit_ids | context.managing_unit_ids}:
            allowed.append(item)
    return allowed
