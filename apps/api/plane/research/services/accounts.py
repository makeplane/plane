# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Account lifecycle service: invite codes and the public workspace seat.

A new account never creates a workspace. It joins the public workspace with a
research role that the administrator encoded in the invite code, so the same
act that proves "this person may register" also places the person in the
organisation tree.
"""

from datetime import timedelta

from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone

from plane.db.models import (
    MentorBinding,
    OrgUnit,
    OrgUnitMember,
    ResearchInviteCode,
    ResearchUserProfile,
    Workspace,
    WorkspaceMember,
)
from plane.research.utils.audit import ResearchAuditAction, ResearchResourceType, record_audit_event
from plane.research.utils.errors import ResearchErrorCode
from plane.research.utils.roles import PUBLIC_WORKSPACE_SLUG, WORKSPACE_MEMBER_ROLE

DEFAULT_INVITE_DAYS = 7
MAX_INVITE_USES = 100

# Students are ordinary organisation members: REVIEWER grants no management
# rights over the node, which is exactly what a research owner should have.
DEFAULT_INVITE_ORG_ROLE = OrgUnitMember.OrgRole.REVIEWER


class AccountError(Exception):
    """A rule violation the API layer turns into the research error envelope."""

    def __init__(self, error_code, message):
        self.error_code = error_code
        self.message = message
        super().__init__(message)


def public_workspace():
    """The workspace every registered account belongs to."""
    return Workspace.objects.filter(slug=PUBLIC_WORKSPACE_SLUG).first()


def public_workspace_or_error():
    workspace = public_workspace()
    if workspace is None:
        raise AccountError(
            ResearchErrorCode.PUBLIC_WORKSPACE_MISSING,
            "The public workspace does not exist yet.",
        )
    return workspace


def issue_invite_code(
    workspace,
    actor,
    *,
    org_role="",
    org_unit=None,
    max_uses=1,
    expires_in_days=DEFAULT_INVITE_DAYS,
    expires_at=None,
    note="",
    provisioning_version=1,
    profile_category="",
    primary_advisor=None,
):
    """Create an invite code scoped to a workspace (the public one in practice)."""
    org_role = str(org_role or "").strip().upper()
    if org_role and org_role not in OrgUnitMember.OrgRole.values:
        raise AccountError(
            ResearchErrorCode.INVITE_CODE_ORG_ROLE_INVALID,
            f"org_role must be one of {', '.join(OrgUnitMember.OrgRole.values)}",
        )
    if org_unit is not None and org_unit.workspace_id != workspace.id:
        raise AccountError(
            ResearchErrorCode.INVITE_CODE_ORG_ROLE_INVALID,
            "The org unit does not belong to this workspace.",
        )

    try:
        max_uses = int(max_uses or 1)
    except (TypeError, ValueError):
        raise AccountError(ResearchErrorCode.INVITE_CODE_INVALID, "max_uses must be a number.")
    if max_uses < 1 or max_uses > MAX_INVITE_USES:
        raise AccountError(
            ResearchErrorCode.INVITE_CODE_INVALID,
            f"max_uses must be between 1 and {MAX_INVITE_USES}.",
        )

    if expires_at is None and expires_in_days:
        try:
            days = int(expires_in_days)
        except (TypeError, ValueError):
            raise AccountError(ResearchErrorCode.INVITE_CODE_INVALID, "expires_in_days must be a number.")
        expires_at = timezone.now() + timedelta(days=days)

    code = ResearchInviteCode.objects.create(
        workspace=workspace,
        provisioning_version=provisioning_version,
        org_role=org_role,
        org_unit=org_unit,
        profile_category=profile_category,
        primary_advisor=primary_advisor,
        max_uses=max_uses,
        expires_at=expires_at,
        note=str(note or "")[:255],
        created_by=actor,
    )
    record_audit_event(
        workspace=workspace,
        action=ResearchAuditAction.INVITE_CODE_CREATE,
        resource_type=ResearchResourceType.INVITE_CODE,
        resource_id=code.id,
        actor=actor,
        org_unit=org_unit,
        metadata={
            "org_role": org_role,
            "max_uses": max_uses,
            "expires_at": expires_at.isoformat() if expires_at else None,
        },
    )
    return code


def invite_code_status(code):
    """Effective status of ``code`` as a string (ACTIVE / DISABLED / ...)."""
    if code is None:
        return None
    return code.status_for(timezone.now())


def resolve_invite_code(code, now=None):
    """Look a code up and validate it, raising :class:`AccountError` when unusable."""
    raw = str(code or "").strip()
    if not raw:
        raise AccountError(ResearchErrorCode.INVITE_CODE_REQUIRED, "An invite code is required.")

    invite = ResearchInviteCode.objects.filter(code=raw, deleted_at__isnull=True).first()
    if invite is None:
        raise AccountError(ResearchErrorCode.INVITE_CODE_INVALID, "The invite code is not valid.")

    status = invite.status_for(now or timezone.now())
    if status == ResearchInviteCode.EffectiveStatus.DISABLED:
        raise AccountError(ResearchErrorCode.INVITE_CODE_DISABLED, "The invite code was disabled.")
    if status == ResearchInviteCode.EffectiveStatus.EXPIRED:
        raise AccountError(ResearchErrorCode.INVITE_CODE_EXPIRED, "The invite code expired.")
    if status == ResearchInviteCode.EffectiveStatus.EXHAUSTED:
        raise AccountError(ResearchErrorCode.INVITE_CODE_EXHAUSTED, "The invite code was used up.")
    return invite


def invite_code_is_usable(code, now=None) -> bool:
    """Boolean variant used by the signup gate, which must not raise."""
    try:
        resolve_invite_code(code, now=now)
    except AccountError:
        return False
    return True


@transaction.atomic
def consume_invite_code(code, now=None):
    """Atomically consume one use, or raise when the code is not usable."""
    invite = resolve_invite_code(code, now=now)
    updated = ResearchInviteCode.objects.filter(
        pk=invite.pk,
        status=ResearchInviteCode.Status.ACTIVE,
        used_count__lt=F("max_uses"),
    ).update(used_count=F("used_count") + 1, updated_at=timezone.now())
    if not updated:
        raise AccountError(ResearchErrorCode.INVITE_CODE_EXHAUSTED, "The invite code was used up.")
    invite.refresh_from_db()
    return invite


def join_public_workspace(user, actor=None):
    """Add ``user`` to the public workspace as a plain member."""
    workspace = public_workspace_or_error()
    membership, created = WorkspaceMember.objects.get_or_create(
        workspace=workspace,
        member=user,
        defaults={"role": WORKSPACE_MEMBER_ROLE, "created_by": actor or user},
    )
    if not created and not membership.is_active:
        membership.is_active = True
        membership.save(update_fields=["is_active", "updated_at"])
    return workspace, membership


def attach_invite_bindings(user, invite, actor=None, request=None):
    """Give the new account the organisation seat the code was issued for."""
    org_member = None
    org_unit = invite.org_unit if invite is not None and invite.org_unit_id else None
    org_role = (invite.org_role if invite is not None else "") or ""
    is_v2 = invite is not None and invite.provisioning_version >= 2
    if org_unit is None and org_role:
        # Fall back to the root node so the account is never left outside the
        # organisation tree when a code carries a role but no explicit node.
        org_unit = (
            OrgUnit.objects.filter(workspace=invite.workspace, unit_type=OrgUnit.UnitType.ROOT)
            .order_by("created_at")
            .first()
        )
    if org_unit is not None and org_role:
        try:
            org_member = OrgUnitMember.objects.create(
                workspace=org_unit.workspace,
                org_unit=org_unit,
                user=user,
                org_role=org_role,
                is_primary=is_v2,
                effective_from=timezone.localdate(),
                created_by=actor or user,
            )
            record_audit_event(
                workspace=org_unit.workspace,
                action=ResearchAuditAction.ORG_MEMBER_ADD,
                resource_type=ResearchResourceType.ORG_UNIT_MEMBER,
                resource_id=org_member.id,
                actor=actor or user,
                org_unit=org_unit,
                metadata={
                    "user": str(user.id),
                    "org_role": org_role,
                    "invite_code": str(invite.id) if invite is not None else None,
                },
                request=request,
            )
        except IntegrityError:
            org_member = OrgUnitMember.objects.filter(org_unit=org_unit, user=user, org_role=org_role).first()

    profile_category = (
        invite.profile_category
        if is_v2 and invite.profile_category in ResearchUserProfile.Category.values
        else (
            ResearchUserProfile.Category.ADVISOR
            if org_role == OrgUnitMember.OrgRole.ADVISOR
            else ResearchUserProfile.Category.STUDENT
        )
    )
    ResearchUserProfile.objects.get_or_create(
        user=user,
        defaults={
            "category": profile_category,
            "created_by": actor or user,
        },
    )
    if is_v2 and invite.primary_advisor_id:
        MentorBinding.objects.get_or_create(
            workspace=invite.workspace,
            mentee=user,
            mentor=invite.primary_advisor,
            defaults={
                "org_unit": org_unit,
                "is_primary_advisor": True,
                "effective_from": timezone.localdate(),
                "created_by": actor or user,
            },
        )
    return org_member


@transaction.atomic
def redeem_invite_code(user, code, actor=None, request=None):
    """Consume ``code`` and place ``user`` inside the public workspace."""
    invite = consume_invite_code(code)
    workspace, membership = join_public_workspace(user, actor=actor or user)
    org_member = attach_invite_bindings(user, invite, actor=actor or user, request=request)
    record_audit_event(
        workspace=workspace,
        action=ResearchAuditAction.INVITE_CODE_REDEEM,
        resource_type=ResearchResourceType.INVITE_CODE,
        resource_id=invite.id,
        actor=user,
        metadata={"user": str(user.id), "org_role": invite.org_role},
        request=request,
    )
    return {"invite": invite, "workspace": workspace, "membership": membership, "org_member": org_member}


def register_with_invite_code(user, code, request=None):
    """Signup hook: best effort, never blocks the freshly created account.

    The gate in the authentication adapter already refused unusable codes; a
    race (two signups for the last use of one code) is logged through the
    return value instead of raising, because the account itself is valid.
    """
    try:
        return redeem_invite_code(user, code, request=request)
    except AccountError as error:
        return {"error": error.error_code, "message": error.message}
