# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Organisation tree helpers: materialised path maintenance and access rules."""

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone

from plane.db.models import MentorBinding, OrgUnit, OrgUnitMember, WorkspaceMember

WORKSPACE_ADMIN_ROLE = 20
WORKSPACE_MEMBER_ROLE = 15
READABLE_WORKSPACE_ROLES = (WORKSPACE_ADMIN_ROLE, WORKSPACE_MEMBER_ROLE)

# Organisation roles that grant management rights over a node and its subtree.
MANAGING_ORG_ROLES = (
    OrgUnitMember.OrgRole.OWNER,
    OrgUnitMember.OrgRole.UNIT_ADMIN,
    OrgUnitMember.OrgRole.PI,
)


def build_path(unit_id, parent_path):
    """Return the materialised path for a unit placed under ``parent_path``."""
    prefix = parent_path or "/"
    if not prefix.endswith("/"):
        prefix = f"{prefix}/"
    return f"{prefix}{str(unit_id).replace('-', '')}/"


def is_workspace_admin(user, workspace_id) -> bool:
    if user is None or not getattr(user, "is_authenticated", False):
        return False
    return WorkspaceMember.objects.filter(
        workspace_id=workspace_id,
        member=user,
        role=WORKSPACE_ADMIN_ROLE,
        is_active=True,
    ).exists()


def is_workspace_member(user, workspace_id) -> bool:
    if user is None or not getattr(user, "is_authenticated", False):
        return False
    return WorkspaceMember.objects.filter(
        workspace_id=workspace_id,
        member=user,
        is_active=True,
    ).exists()


def active_membership_q(on_date=None):
    on_date = on_date or timezone.localdate()
    return Q(deleted_at__isnull=True, effective_from__lte=on_date) & (
        Q(effective_to__isnull=True) | Q(effective_to__gte=on_date)
    )


def managing_unit_ids(user, workspace_id, on_date=None):
    """Org unit ids the user can manage, including inherited ancestor rights."""
    if user is None or not getattr(user, "is_authenticated", False):
        return set()
    paths = list(
        OrgUnitMember.objects.filter(
            active_membership_q(on_date),
            workspace_id=workspace_id,
            user=user,
            org_role__in=MANAGING_ORG_ROLES,
        )
        .values_list("org_unit__path", flat=True)
        .distinct()
    )
    if not paths:
        return set()
    query = Q()
    for path in paths:
        query |= Q(path__startswith=path)
    return set(
        OrgUnit.objects.filter(workspace_id=workspace_id, deleted_at__isnull=True)
        .filter(query)
        .values_list("id", flat=True)
    )


def user_can_manage_org_unit(user, workspace, unit=None, on_date=None) -> bool:
    """Administrators manage everything; org roles manage their subtree.

    Administrators are either workspace administrators or holders of one of
    the three instance administrator tags (dev / ops / main PI), so a tag
    holder can curate the tree without a workspace administrator seat.
    """
    from plane.research.utils.roles import is_research_admin

    workspace_id = getattr(workspace, "id", workspace)
    if is_research_admin(user, workspace_id):
        return True
    if unit is None:
        return False
    unit_id = getattr(unit, "id", unit)
    return unit_id in managing_unit_ids(user, workspace_id, on_date)


def descendants_queryset(unit):
    return OrgUnit.objects.filter(workspace=unit.workspace, path__startswith=unit.path).exclude(id=unit.id)


def is_descendant_of(candidate, unit) -> bool:
    """True when ``candidate`` is a strict descendant of ``unit``."""
    if candidate is None or unit is None:
        return False
    return bool(candidate.path) and candidate.path.startswith(unit.path) and candidate.id != unit.id


def subtree_ids(unit):
    return [*descendants_queryset(unit).values_list("id", flat=True), unit.id]


@transaction.atomic
def move_subtree(unit, new_parent):
    """Re-parent ``unit`` and rewrite the materialised path of its subtree."""
    old_path = unit.path
    new_path = build_path(unit.id, new_parent.path if new_parent else None)
    new_depth = (new_parent.depth + 1) if new_parent else 0
    depth_delta = new_depth - unit.depth

    unit.parent = new_parent
    unit.path = new_path
    unit.depth = new_depth
    unit.save(update_fields=["parent", "path", "depth", "updated_at"])

    descendants = list(
        OrgUnit.objects.filter(workspace=unit.workspace, path__startswith=old_path).exclude(id=unit.id)
    )
    for descendant in descendants:
        descendant.path = new_path + descendant.path[len(old_path) :]
        descendant.depth = max(descendant.depth + depth_delta, 0)
        descendant.save(update_fields=["path", "depth", "updated_at"])

    return unit


def ensure_root_org_unit(workspace, actor=None):
    """Guarantee every workspace has exactly one ROOT node (P0-ORG-01)."""
    existing = OrgUnit.objects.filter(workspace=workspace, unit_type=OrgUnit.UnitType.ROOT).first()
    if existing:
        return existing

    try:
        with transaction.atomic():
            unit = OrgUnit(
                workspace=workspace,
                name=workspace.name,
                parent=None,
                unit_type=OrgUnit.UnitType.ROOT,
                depth=0,
                path="",
                created_by=actor,
            )
            unit.path = build_path(unit.id, None)
            unit.save()
            return unit
    except IntegrityError:
        return OrgUnit.objects.filter(workspace=workspace, unit_type=OrgUnit.UnitType.ROOT).first()


def effective_mentor_ids(user, workspace_id, on_date=None):
    """Direct advisors bound to ``user`` (P0-ORG-06)."""
    on_date = on_date or timezone.localdate()
    return set(
        MentorBinding.objects.filter(
            deleted_at__isnull=True,
            workspace_id=workspace_id,
            mentee=user,
        )
        .filter(effective_from__lte=on_date)
        .filter(Q(effective_to__isnull=True) | Q(effective_to__gte=on_date))
        .values_list("mentor_id", flat=True)
    )


def effective_mentee_ids(user, workspace_id, on_date=None):
    on_date = on_date or timezone.localdate()
    return set(
        MentorBinding.objects.filter(
            deleted_at__isnull=True,
            workspace_id=workspace_id,
            mentor=user,
        )
        .filter(effective_from__lte=on_date)
        .filter(Q(effective_to__isnull=True) | Q(effective_to__gte=on_date))
        .values_list("mentee_id", flat=True)
    )
