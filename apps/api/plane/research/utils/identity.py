# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Identity resolution chain for AI4MS single sign-on (P0-ID-02 ~ P0-ID-05).

Resolution order is ``subject`` > ``email`` > ``employee_id``. The chain never
merges two existing accounts: whenever the incoming identifiers point at
different local users the login is rejected and an audit event is written.
"""

import uuid

from django.db import IntegrityError, transaction
from django.utils import timezone

from plane.db.models import IdentityMapping, User
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.utils.ip_address import get_client_ip


class IdentityResolutionError(Exception):
    """Raised when an SSO identity cannot be mapped to exactly one account."""

    def __init__(self, error_code, message, metadata=None):
        self.error_code = error_code
        self.message = message
        self.metadata = metadata or {}
        super().__init__(message)


def _audit_identity(*, action, user=None, workspace=None, request=None, resource_id=None, metadata=None, org_unit=None):
    return record_audit_event(
        workspace=workspace,
        action=action,
        resource_type=ResearchResourceType.IDENTITY_MAPPING if resource_id else ResearchResourceType.USER,
        resource_id=resource_id or (user.id if user else None),
        actor=user,
        org_unit=org_unit,
        metadata=metadata or {},
        request=request,
    )


def resolve_identity(
    *,
    provider,
    subject,
    email=None,
    employee_id=None,
    workspace=None,
    request=None,
    allow_auto_provision=False,
):
    """Resolve an external identity to a local account.

    Returns ``(user, is_signup, mapping)``. Raises ``IdentityResolutionError``
    for conflicts and for unknown identities when auto provisioning is off.
    """
    if not subject:
        raise IdentityResolutionError(
            "identity_subject_missing",
            "The identity provider did not return a subject claim.",
        )

    subject = str(subject).strip()
    email = (email or "").strip().lower() or None
    employee_id = (employee_id or "").strip() or None

    mapping = IdentityMapping.objects.filter(provider=provider, subject=subject).first()
    email_user = None
    if email:
        email_candidates = list(User.objects.filter(email__iexact=email))
        if len(email_candidates) > 1:
            _audit_identity(
                action=ResearchAuditAction.IDENTITY_CONFLICT,
                workspace=workspace,
                request=request,
                metadata={"reason": "email_ambiguous", "email": email, "provider": provider},
            )
            raise IdentityResolutionError(
                "identity_email_ambiguous",
                "Several accounts share this email address. An administrator must resolve the mapping.",
                {"email": email},
            )
        email_user = email_candidates[0] if email_candidates else None

    user = None
    is_signup = False

    if mapping is not None:
        if mapping.status != IdentityMapping.Status.ACTIVE:
            _audit_identity(
                action=ResearchAuditAction.IDENTITY_SUSPENDED,
                user=mapping.user,
                workspace=workspace,
                request=request,
                resource_id=mapping.id,
                metadata={"status": mapping.status, "provider": provider},
            )
            raise IdentityResolutionError(
                "identity_mapping_inactive",
                "This identity mapping is not active. Please contact an administrator.",
                {"status": mapping.status},
            )
        user = mapping.user
        # sub and email must not point at different accounts
        if email_user is not None and email_user.id != user.id:
            _audit_identity(
                action=ResearchAuditAction.IDENTITY_CONFLICT,
                user=user,
                workspace=workspace,
                request=request,
                resource_id=mapping.id,
                metadata={
                    "reason": "subject_email_mismatch",
                    "provider": provider,
                    "email_user": str(email_user.id),
                },
            )
            raise IdentityResolutionError(
                "identity_subject_email_conflict",
                "The sign-in subject and email address point at different accounts.",
            )
    elif email_user is not None:
        existing_for_user = IdentityMapping.objects.filter(provider=provider, user=email_user).first()
        if existing_for_user is not None and existing_for_user.subject != subject:
            _audit_identity(
                action=ResearchAuditAction.IDENTITY_CONFLICT,
                user=email_user,
                workspace=workspace,
                request=request,
                resource_id=existing_for_user.id,
                metadata={"reason": "subject_already_bound", "provider": provider},
            )
            raise IdentityResolutionError(
                "identity_subject_email_conflict",
                "This account is already bound to a different sign-in subject.",
            )
        user = email_user

        if not user.is_active:
            raise IdentityResolutionError(
                "identity_user_inactive",
                "This account has been deactivated.",
            )
    elif employee_id:
        candidates = list(
            IdentityMapping.objects.filter(
                provider=provider,
                employee_id=employee_id,
                status=IdentityMapping.Status.ACTIVE,
            )
        )
        if len(candidates) > 1:
            _audit_identity(
                action=ResearchAuditAction.IDENTITY_CONFLICT,
                workspace=workspace,
                request=request,
                metadata={"reason": "employee_id_ambiguous", "provider": provider},
            )
            raise IdentityResolutionError(
                "identity_employee_id_ambiguous",
                "Several accounts share this employee id. An administrator must resolve the mapping.",
            )
        if len(candidates) == 1:
            user = candidates[0].user

    if user is None:
        if not allow_auto_provision:
            _audit_identity(
                action=ResearchAuditAction.IDENTITY_CONFLICT,
                workspace=workspace,
                request=request,
                metadata={"reason": "auto_provision_disabled", "provider": provider, "email": email},
            )
            raise IdentityResolutionError(
                "identity_not_provisioned",
                "No account is linked to this identity and automatic provisioning is disabled.",
            )
        if not email:
            raise IdentityResolutionError(
                "identity_email_missing",
                "The identity provider did not return an email address.",
            )
        user, mapping = _provision_user(
            provider=provider,
            subject=subject,
            email=email,
            employee_id=employee_id,
            workspace=workspace,
            request=request,
        )
        return user, True, mapping

    mapping = _upsert_mapping(
        provider=provider,
        subject=subject,
        user=user,
        email=email,
        employee_id=employee_id,
        request=request,
        is_new=mapping is None,
    )
    return user, is_signup, mapping


def _provision_user(*, provider, subject, email, employee_id, workspace, request):
    """Create a local account for a first-time SSO user.

    Newly provisioned accounts carry no research role: an administrator or a
    principal investigator has to assign an organisation relation before any
    research data becomes visible (P0-ID-03).
    """
    from django.db.models import Q

    from plane.db.models import Profile

    username_base = email.split("@")[0][:30] or "ai4ms-user"
    user = User(email=email, username=uuid.uuid4().hex)
    user.set_unusable_password()
    user.is_password_autoset = True
    user.is_email_verified = True
    user.is_active = True
    user.first_name = ""
    user.last_name = ""
    try:
        with transaction.atomic():
            user.save()
            Profile.objects.create(user=user)
    except IntegrityError:
        existing = User.objects.filter(Q(email__iexact=email)).first()
        if existing is None:
            raise
        user = existing

    mapping = IdentityMapping.objects.create(
        provider=provider,
        subject=subject,
        user=user,
        email_snapshot=email,
        employee_id=employee_id,
        status=IdentityMapping.Status.ACTIVE,
        last_login_at=timezone.now(),
        last_login_ip=get_client_ip(request=request) if request else None,
    )
    _audit_identity(
        action=ResearchAuditAction.IDENTITY_PROVISION,
        user=user,
        workspace=workspace,
        request=request,
        resource_id=mapping.id,
        metadata={"provider": provider, "email": email, "username": username_base},
    )
    return user, mapping


def _upsert_mapping(*, provider, subject, user, email, employee_id, request, is_new):
    mapping = IdentityMapping.objects.filter(provider=provider, subject=subject).first()
    if mapping is None:
        # the subject rotated for an already mapped account (e.g. the identity
        # provider was reinstalled) - reuse the existing row instead of
        # creating a second mapping for the same user
        mapping = IdentityMapping.objects.filter(provider=provider, user=user).first()
    previous_email = mapping.email_snapshot if mapping else None
    if mapping is None:
        mapping = IdentityMapping(provider=provider, subject=subject, user=user)
    mapping.subject = subject
    mapping.email_snapshot = email or mapping.email_snapshot
    mapping.employee_id = employee_id or mapping.employee_id
    mapping.status = IdentityMapping.Status.ACTIVE
    mapping.last_login_at = timezone.now()
    mapping.last_login_ip = get_client_ip(request=request) if request else None
    mapping.save()

    action = ResearchAuditAction.IDENTITY_BIND if is_new else ResearchAuditAction.IDENTITY_LOGIN
    _audit_identity(
        action=action,
        user=user,
        request=request,
        resource_id=mapping.id,
        metadata={
            "provider": provider,
            "email_changed": bool(previous_email and email and previous_email != email),
        },
    )
    return mapping
