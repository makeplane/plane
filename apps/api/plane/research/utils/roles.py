# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Research administrator duties and PI-private workspace admission.

``DEV_ADMIN`` and ``OPS_ADMIN`` describe technical duties in workspaces where
the account already has a Plane seat. ``MAIN_PI`` is retained only as a legacy
label. None of these labels grants workspace admission or research content;
the authoritative system administrator is ``InstanceAdmin`` and the business
principal is ``WorkspaceResearchSetting.main_pi``.
"""

from plane.db.models import WorkspaceMember, WorkspaceResearchSetting

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


def is_instance_admin(user) -> bool:
    """The authoritative platform administrator identity."""
    if user is None or not getattr(user, "is_authenticated", False):
        return False
    from plane.license.models import InstanceAdmin

    return InstanceAdmin.objects.filter(user=user, role__gte=15).exists()


def is_system_admin(user) -> bool:
    """Backward-compatible name for the authoritative instance administrator."""
    return is_instance_admin(user)


def _workspace_id(workspace):
    if workspace is None:
        return None
    return getattr(workspace, "id", workspace)


def is_research_admin(user, workspace) -> bool:
    """Configuration rights: instance or workspace administrator.

    This is the gate for the six administrator surfaces (organisation,
    report templates, identity mappings, platform configuration, audit and
    the account lifecycle pages). It deliberately does **not** grant access
    to research business data - that stays with the organisation ACL.
    """
    if user is None or not getattr(user, "is_authenticated", False):
        return False
    if is_instance_admin(user):
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


def has_admin_duty(user, role) -> bool:
    return role in admin_roles(user)


def can_configure_integrations(user, workspace) -> bool:
    return is_instance_admin(user) or has_admin_duty(user, DEV_ADMIN) or is_research_admin(user, workspace)


def can_operate_workspace(user, workspace) -> bool:
    return is_instance_admin(user) or has_admin_duty(user, OPS_ADMIN) or is_research_admin(user, workspace)


def is_account_compat_admin(user, workspace) -> bool:
    """Temporary compatibility gate used only by invite/import account flows."""
    return bool(admin_roles(user)) or is_research_admin(user, workspace)


def private_workspace_settings():
    return WorkspaceResearchSetting.objects.filter(
        purpose=WorkspaceResearchSetting.Purpose.PI_PRIVATE,
        deleted_at__isnull=True,
    ).select_related("workspace", "main_pi")


def user_can_access_private_workspace(user, setting):
    if is_instance_admin(user) or setting.main_pi_id == getattr(user, "id", None):
        return True
    from plane.db.models import ResearchWorkspaceAccessGrant

    return ResearchWorkspaceAccessGrant.objects.filter(
        setting=setting,
        user=user,
        deleted_at__isnull=True,
    ).exists()


def sync_admin_workspace_membership(user, actor=None):
    """Reconcile explicit private workspace admission for one account."""
    memberships = []
    for setting in private_workspace_settings():
        allowed = user_can_access_private_workspace(user, setting)
        member = WorkspaceMember.objects.filter(
            workspace=setting.workspace,
            member=user,
            deleted_at__isnull=True,
        ).first()
        if allowed and member is None:
            member = WorkspaceMember.objects.create(
                workspace=setting.workspace,
                member=user,
                role=WORKSPACE_MEMBER_ROLE,
                created_by=actor or user,
            )
        elif allowed and not member.is_active:
            member.is_active = True
            member.save(update_fields=["is_active", "updated_at"])
        elif not allowed and member is not None and member.is_active:
            member.is_active = False
            member.save(update_fields=["is_active", "updated_at"])
        if allowed and member is not None:
            memberships.append(member)
    return memberships


def demote_admin_workspace_membership(user):
    """Reconcile a private workspace seat after an authority is revoked."""
    before = WorkspaceMember.objects.filter(
        workspace__research_setting__purpose=WorkspaceResearchSetting.Purpose.PI_PRIVATE,
        member=user,
        is_active=True,
    ).count()
    sync_admin_workspace_membership(user)
    after = WorkspaceMember.objects.filter(
        workspace__research_setting__purpose=WorkspaceResearchSetting.Purpose.PI_PRIVATE,
        member=user,
        is_active=True,
    ).count()
    return max(before - after, 0)


def sync_main_pi_workspace_seat(user, actor=None):
    """Compatibility hook: an organisation PI role never implies admission."""
    memberships = sync_admin_workspace_membership(user, actor=actor)
    return memberships[0] if memberships else None
