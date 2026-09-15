# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Single research access-control entry point (P0-ACL-01 ~ P0-ACL-10).

Every research object resolves its visibility through ``check_access``. The
service is deliberately independent from the Django views so the same decision
is reused by list filtering, detail views, attachment downloads and summaries -
there is exactly one answer to "may this actor do this to this object".

Objects without research metadata never reach this module: callers short
circuit them to the upstream permission chain (P0-ACL-10).
"""

from dataclasses import dataclass, field
from datetime import date

from django.utils import timezone

from plane.db.models import (
    MentorBinding,
    OrgUnit,
    OrgUnitMember,
    WorkspaceMember,
)
from plane.research.utils.config import research_module_enabled

WORKSPACE_ADMIN_ROLE = 20

# Breadth order used for the "authors may only narrow" rule (P0-ACL-04).
VISIBILITY_BREADTH = {
    "PRIVATE": 0,
    "DIRECT_ADVISOR": 1,
    "UNIT": 2,
    "ANCESTRY": 3,
    "WORKSPACE": 4,
    "CUSTOM": 5,
}

MANAGING_ORG_ROLES = ("OWNER", "UNIT_ADMIN", "PI")


class ResearchAccessDenied(Exception):
    """Raised when an actor may not perform an action on a research object."""


@dataclass
class ResearchResource:
    """Minimal projection of a research object needed for an ACL decision."""

    kind: str
    workspace_id: object
    owner_id: object = None
    org_unit_id: object = None
    visibility: str = "PRIVATE"
    state: str | None = None
    grants: list = field(default_factory=list)


@dataclass
class ActorContext:
    user_id: object
    workspace_id: object
    is_workspace_admin: bool = False
    is_workspace_member: bool = False
    unit_ids: frozenset = frozenset()
    managing_unit_ids: frozenset = frozenset()
    advises: frozenset = frozenset()
    advised_by: frozenset = frozenset()


def visibility_breadth(visibility):
    return VISIBILITY_BREADTH.get(visibility, 0)


def can_narrow(default_visibility, requested_visibility) -> bool:
    """Only narrowing is allowed; widening beyond the policy is rejected."""
    return visibility_breadth(requested_visibility) <= visibility_breadth(default_visibility)


def visibility_is_within(default_visibility, requested_visibility) -> bool:
    return can_narrow(default_visibility, requested_visibility)


def active_org_units_for(user, workspace_id, on_date=None):
    """Org unit ids the user belongs to (effective relations only)."""
    on_date = on_date or timezone.localdate()
    return set(
        OrgUnitMember.objects.filter(
            deleted_at__isnull=True,
            workspace_id=workspace_id,
            user=user,
            effective_from__lte=on_date,
        )
        .filter(models_q_expired(on_date))
        .values_list("org_unit_id", flat=True)
    )


def models_q_expired(on_date):
    from django.db.models import Q

    return Q(effective_to__isnull=True) | Q(effective_to__gte=on_date)


def managing_org_units_for(user, workspace_id, on_date=None):
    """Units the user manages, including everything below their own nodes."""
    on_date = on_date or timezone.localdate()
    paths = list(
        OrgUnitMember.objects.filter(
            deleted_at__isnull=True,
            workspace_id=workspace_id,
            user=user,
            org_role__in=MANAGING_ORG_ROLES,
            effective_from__lte=on_date,
        )
        .filter(models_q_expired(on_date))
        .values_list("org_unit__path", flat=True)
        .distinct()
    )
    if not paths:
        return set()
    from django.db.models import Q

    query = Q()
    for path in paths:
        query |= Q(path__startswith=path)
    return set(
        OrgUnit.objects.filter(workspace_id=workspace_id, deleted_at__isnull=True).filter(query).values_list("id", flat=True)
    )


def build_actor_context(actor, workspace_id, on_date=None) -> ActorContext:
    """Collect every relation the visibility matrix needs, in one pass."""
    on_date = on_date or timezone.localdate()
    membership = WorkspaceMember.objects.filter(
        workspace_id=workspace_id,
        member=actor,
        is_active=True,
    ).first()

    advises = set(
        MentorBinding.objects.filter(
            deleted_at__isnull=True,
            workspace_id=workspace_id,
            mentor_id=actor.id,
            effective_from__lte=on_date,
        )
        .filter(models_q_expired(on_date))
        .values_list("mentee_id", flat=True)
    )
    advised_by = set(
        MentorBinding.objects.filter(
            deleted_at__isnull=True,
            workspace_id=workspace_id,
            mentee_id=actor.id,
            effective_from__lte=on_date,
        )
        .filter(models_q_expired(on_date))
        .values_list("mentor_id", flat=True)
    )

    return ActorContext(
        user_id=actor.id,
        workspace_id=workspace_id,
        is_workspace_admin=bool(membership and membership.role == WORKSPACE_ADMIN_ROLE),
        is_workspace_member=bool(membership),
        unit_ids=frozenset(active_org_units_for(actor, workspace_id, on_date)),
        managing_unit_ids=frozenset(managing_org_units_for(actor, workspace_id, on_date)),
        advises=frozenset(advises),
        advised_by=frozenset(advised_by),
    )


def org_unit_ancestry(org_unit_id, workspace_id):
    """Ordered list of ancestor unit ids, from the parent upwards."""
    if not org_unit_id:
        return []
    unit = OrgUnit.objects.filter(workspace_id=workspace_id, pk=org_unit_id).first()
    if unit is None or not unit.path:
        return []
    segments = [segment for segment in unit.path.strip("/").split("/") if segment]
    # the last segment is the unit itself
    ancestor_hex = segments[:-1]
    if not ancestor_hex:
        return []
    ancestors = []
    for hex_id in ancestor_hex:
        ancestors.append(hex_id)
    matched = {
        str(candidate.id).replace("-", ""): candidate.id
        for candidate in OrgUnit.objects.filter(workspace_id=workspace_id, deleted_at__isnull=True)
    }
    return [matched[hex_id] for hex_id in ancestors if hex_id in matched]


def org_unit_scope_ids(org_unit_id, workspace_id):
    """The node itself plus every descendant node."""
    if not org_unit_id:
        return set()
    unit = OrgUnit.objects.filter(workspace_id=workspace_id, pk=org_unit_id).first()
    if unit is None:
        return set()
    return set(
        OrgUnit.objects.filter(workspace_id=workspace_id, deleted_at__isnull=True, path__startswith=unit.path)
        .values_list("id", flat=True)
    )


def direct_advisor_ids(owner_id, workspace_id, org_unit_id=None, on_date=None):
    """Direct advisors of the owner, plus advisors registered on the node."""
    on_date = on_date or timezone.localdate()
    advisors = set(
        MentorBinding.objects.filter(
            deleted_at__isnull=True,
            workspace_id=workspace_id,
            mentee_id=owner_id,
            effective_from__lte=on_date,
        )
        .filter(models_q_expired(on_date))
        .values_list("mentor_id", flat=True)
    )
    if org_unit_id:
        advisors |= set(
            OrgUnitMember.objects.filter(
                deleted_at__isnull=True,
                workspace_id=workspace_id,
                org_unit_id=org_unit_id,
                org_role="ADVISOR",
                effective_from__lte=on_date,
            )
            .filter(models_q_expired(on_date))
            .values_list("user_id", flat=True)
        )
    return advisors


def visibility_allows(context: ActorContext, resource: ResearchResource, on_date=None) -> bool:
    """Pure visibility matrix: six levels by the six subject classes."""
    if resource.workspace_id != context.workspace_id:
        return False
    if context.is_workspace_admin:
        # Workspace administrators see every research object (P0-ACL-03 default
        # policy is a floor for authors, not a restriction on platform admins).
        return True
    if not context.is_workspace_member:
        return False

    visibility = resource.visibility or "PRIVATE"
    owner_id = resource.owner_id

    if owner_id == context.user_id:
        return True

    if visibility == "PRIVATE":
        return False

    if visibility == "DIRECT_ADVISOR":
        return context.user_id in direct_advisor_ids(owner_id, resource.workspace_id, resource.org_unit_id, on_date)

    if visibility == "UNIT":
        return bool(context.unit_ids & org_unit_scope_ids(resource.org_unit_id, resource.workspace_id))

    if visibility == "ANCESTRY":
        ancestors = org_unit_ancestry(resource.org_unit_id, resource.workspace_id)
        if not ancestors:
            return False
        if context.managing_unit_ids & set(ancestors):
            return True
        return bool(context.unit_ids & set(ancestors))

    if visibility == "WORKSPACE":
        return context.is_workspace_member

    if visibility == "CUSTOM":
        if owner_id == context.user_id or context.is_workspace_admin:
            return True
        for grant in resource.grants or []:
            grantee_user = grant.get("grantee_user")
            if grantee_user and str(grantee_user) == str(context.user_id):
                return True
            grantee_unit = grant.get("grantee_org_unit")
            if grantee_unit and any(str(grantee_unit) == str(unit_id) for unit_id in context.unit_ids):
                return True
        return False

    return False


def check_access(actor, action, resource, context: ActorContext | None = None, on_date=None) -> bool:
    """Single decision point: may ``actor`` do ``action`` on ``resource``?"""
    if resource is None:
        return False
    if not research_module_enabled():
        # module off: research objects are unreachable, callers must have
        # already short circuited non research objects to the legacy chain
        return False
    if actor is None or not getattr(actor, "is_authenticated", False):
        return False

    context = context or build_actor_context(actor, resource.workspace_id, on_date)

    if action in ("view", "download", "export"):
        return visibility_allows(context, resource, on_date)

    if action in ("edit", "submit", "delete"):
        return resource.owner_id == context.user_id or context.is_workspace_admin

    if action in ("review", "accept", "return"):
        if context.is_workspace_admin:
            return True
        if resource.owner_id == context.user_id:
            return False
        if context.user_id in direct_advisor_ids(
            resource.owner_id, resource.workspace_id, resource.org_unit_id, on_date
        ):
            return True
        scope = org_unit_scope_ids(resource.org_unit_id, resource.workspace_id)
        return bool(context.managing_unit_ids & scope)

    if action == "manage_access":
        return resource.owner_id == context.user_id or context.is_workspace_admin

    return False


def require_access(actor, action, resource, context=None, on_date=None) -> None:
    if not check_access(actor, action, resource, context=context, on_date=on_date):
        raise ResearchAccessDenied("You do not have permission to access this research object.")


def visible_object_ids(actor, resources, action="view", on_date=None) -> list:
    """Filter any iterable of ``ResearchResource`` down to the visible ones."""
    contexts = {}
    visible = []
    for resource in resources:
        key = resource.workspace_id
        if key not in contexts:
            contexts[key] = build_actor_context(actor, key, on_date)
        if check_access(actor, action, resource, context=contexts[key], on_date=on_date):
            visible.append(resource)
    return visible


def allowed_grants_boundary(default_visibility) -> set:
    """Levels a custom grant may extend within (P0-ACL-05)."""
    return {
        level
        for level, breadth in VISIBILITY_BREADTH.items()
        if breadth <= visibility_breadth(default_visibility)
    }


def as_of_today(value=None) -> date:
    return value or timezone.localdate()
