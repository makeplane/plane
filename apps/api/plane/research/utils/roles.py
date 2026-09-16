# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Instance level administrator tags (SYS-ROLE-01 ~ SYS-ROLE-06).

Three tags are handed out by the default instance administrator:
``DEV_ADMIN``, ``OPS_ADMIN`` and ``MAIN_PI``. Holding any of them opens the
whole research configuration surface of every workspace. Business data keeps
using the organisation ACL, so a tag never widens what a user may read: that
separation is what keeps "configuration everywhere, data by org tree" true.
"""

from plane.db.models import Workspace, WorkspaceMember

DEV_ADMIN = "DEV_ADMIN"
OPS_ADMIN = "OPS_ADMIN"
MAIN_PI = "MAIN_PI"

ADMIN_ROLES = (DEV_ADMIN, OPS_ADMIN, MAIN_PI)

# The two workspaces of the deployment: the public workspace serves everybody,
# the main PI workspace serves the PIs and the administrators.
PUBLIC_WORKSPACE_SLUG = "public"
PI_WORKSPACE_SLUG = "pi"
WORKSPACE_SLUGS = (PUBLIC_WORKSPACE_SLUG, PI_WORKSPACE_SLUG)

WORKSPACE_MEMBER_ROLE = 15
WORKSPACE_ADMIN_ROLE = 20


def _assignment_model():
    """Resolve the tag model lazily to keep the app registry happy."""
    from plane.license.models import InstanceRoleAssignment

    return InstanceRoleAssignment


def admin_roles(user):
    """Return the administrator tags held by ``user`` (possibly empty)."""
    if user is None or not getattr(user, "is_authenticated", False):
        return []
    model = _assignment_model()
    return list(
        model.objects.filter(user=user, deleted_at__isnull=True)
        .order_by("role")
        .values_list("role", flat=True)
    )


def is_system_admin(user) -> bool:
    """True when the user holds at least one administrator tag."""
    return bool(admin_roles(user))


def _workspace_id(workspace):
    if workspace is None:
        return None
    return getattr(workspace, "id", workspace)


def is_research_admin(user, workspace) -> bool:
    """Configuration rights: administrator tag or workspace administrator.

    This is the gate for the six administrator surfaces (organisation,
    report templates, identity mappings, platform configuration, audit and
    the account lifecycle pages). It deliberately does **not** grant access
    to research business data - that stays with the organisation ACL.
    """
    if user is None or not getattr(user, "is_authenticated", False):
        return False
    if is_system_admin(user):
        return True
    workspace_id = _workspace_id(workspace)
    if workspace_id is None:
        return False
    return WorkspaceMember.objects.filter(
        workspace_id=workspace_id,
        member=user,
        role=WORKSPACE_ADMIN_ROLE,
        is_active=True,
    ).exists()


def admin_workspaces():
    """The workspaces an administrator tag grants membership to."""
    return Workspace.objects.filter(slug__in=WORKSPACE_SLUGS)


def sync_admin_workspace_membership(user, actor=None):
    """Ensure a tagged user is a member of both workspaces.

    Tag holders are plain members (role 15): being a workspace administrator
    would widen data visibility beyond the organisation ACL.
    """
    memberships = []
    for workspace in admin_workspaces():
        member, created = WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=user,
            defaults={
                "role": WORKSPACE_MEMBER_ROLE,
                "created_by": actor or user,
            },
        )
        if not created and not member.is_active:
            member.is_active = True
            member.save(update_fields=["is_active", "updated_at"])
        memberships.append(member)
    return memberships


def demote_admin_workspace_membership(user):
    """Drop the main PI workspace seat once the last tag is revoked.

    The public workspace keeps the account: it serves every registered user
    regardless of tags. Only the main PI workspace seat is tag-driven.
    """
    if is_system_admin(user):
        return 0
    return WorkspaceMember.objects.filter(
        workspace__slug=PI_WORKSPACE_SLUG,
        member=user,
        is_active=True,
    ).update(is_active=False)


def sync_main_pi_workspace_seat(user, actor=None):
    """Give organisation owners and main PIs a seat in the main PI workspace.

    The main PI workspace serves the PIs of the institute: whoever owns a node
    or is its principal investigator belongs there, whether or not they also
    hold an administrator tag.
    """
    from plane.db.models import OrgUnitMember

    if user is None or not getattr(user, "is_authenticated", False):
        return None
    is_pi = OrgUnitMember.objects.filter(
        user=user,
        deleted_at__isnull=True,
        org_role__in=(OrgUnitMember.OrgRole.OWNER, OrgUnitMember.OrgRole.PI),
        workspace__slug=PUBLIC_WORKSPACE_SLUG,
    ).exists()
    if not is_pi:
        return None
    workspace = Workspace.objects.filter(slug=PI_WORKSPACE_SLUG, deleted_at__isnull=True).first()
    if workspace is None:
        return None
    membership, created = WorkspaceMember.objects.get_or_create(
        workspace=workspace,
        member=user,
        defaults={"role": WORKSPACE_MEMBER_ROLE, "created_by": actor or user},
    )
    if not created and not membership.is_active:
        membership.is_active = True
        membership.save(update_fields=["is_active", "updated_at"])
    return membership
