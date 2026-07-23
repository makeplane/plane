# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Shared provisioning logic for workspace service (machine) accounts.

A service account is a machine identity that acts *only* through an API token.
It is created directly (no invite, no email-verification, no password
round-trip) so it can be provisioned entirely programmatically, yet it is a
valid, distinct actor: it authenticates with its own token and its writes are
attributed to it via ``created_by``/``updated_by``.

This module is the single source of truth for that flow. It is reused by both
the ``create_service_account`` management command and the admin-scoped
``/api/v1`` HTTP endpoint so the two can never drift.
"""

# Python imports
import uuid
from dataclasses import dataclass

# Django imports
from django.db import transaction

# Module imports
from plane.db.models import APIToken, BotTypeEnum, ProjectMember, User, Workspace, WorkspaceMember

# Human-friendly role name -> WorkspaceMember.role value.
# Mirrors ROLE_CHOICES in plane/db/models/workspace.py ((20, Admin), (15, Member), (5, Guest)).
SERVICE_ACCOUNT_ROLES: dict[str, int] = {"admin": 20, "member": 15, "guest": 5}

# Service accounts exist to provision a workspace end to end over the API, so an
# admin seat is the justified default. Narrow it with --role when a service
# account only needs member/guest scope.
DEFAULT_SERVICE_ACCOUNT_ROLE = "admin"


@dataclass
class ServiceAccount:
    """Result of :func:`create_service_account`.

    ``token`` is the *plaintext* API key. Plane stores API tokens verbatim (the
    authentication layer looks them up by exact match), so this is the value the
    caller must persist — it is surfaced here exactly once at creation time.
    """

    user: User
    member: WorkspaceMember
    api_token: APIToken

    @property
    def token(self) -> str:
        return self.api_token.token


def resolve_service_account_role(role: str | int) -> int:
    """Coerce a role name (or raw value) to a WorkspaceMember.role integer."""
    if isinstance(role, int):
        if role in SERVICE_ACCOUNT_ROLES.values():
            return role
        valid = ", ".join(str(v) for v in SERVICE_ACCOUNT_ROLES.values())
        raise ValueError(f"Invalid role '{role}'. Choose one of: {valid}.")
    try:
        return SERVICE_ACCOUNT_ROLES[role]
    except KeyError:
        valid = ", ".join(SERVICE_ACCOUNT_ROLES)
        raise ValueError(f"Invalid role '{role}'. Choose one of: {valid}.")


@transaction.atomic
def create_service_account(
    *,
    workspace: Workspace,
    name: str,
    role: str | int = DEFAULT_SERVICE_ACCOUNT_ROLE,
    email: str | None = None,
    description: str = "",
    username: str | None = None,
    display_name: str | None = None,
) -> ServiceAccount:
    """Create a service account in ``workspace`` and mint its API token.

    Creates, in a single transaction:

    * an ACTIVE, email-verified :class:`User` marked as a bot
      (``is_bot=True``, ``bot_type=SERVICE``) with an unusable password,
    * a :class:`WorkspaceMember` binding it to ``workspace`` at ``role``,
    * an :class:`APIToken` (``user_type=Bot``, ``is_service=True``,
      workspace-scoped) whose plaintext value is returned on the result.

    ``username`` and ``display_name`` are optional caller-chosen identity fields.
    ``username`` must be globally unique (a collision raises ``IntegrityError``
    from the DB insert — the caller is expected to check for it and surface a
    readable error); when omitted a synthetic ``svc_<uuid>`` value is generated.
    ``display_name`` is what the workspace members UI shows; it falls back to
    ``name`` when omitted.

    No email is sent and no password is ever round-tripped. ``is_bot=True``
    additionally blocks the interactive login/signup flow
    (``BOT_USER_LOGIN_FORBIDDEN``), so the identity can be used *only* via its
    token.
    """
    role_value = resolve_service_account_role(role)

    # A service account never logs in, so a caller-omitted username/email are
    # internal, unique identifiers rather than human contact addresses. The
    # synthetic email is always derived from a fresh uuid (never the caller's
    # username) so it stays valid and unique regardless of the username.
    unique = uuid.uuid4().hex
    if not username:
        username = f"svc_{unique}"
    if not email:
        email = f"svc_{unique}@service.plane.local"
    if not display_name:
        display_name = name

    user = User(
        username=username,
        email=email,
        display_name=display_name,
        first_name=name,
        last_name="",
        # Machine identity that acts only through API tokens (mirrors the
        # WORKSPACE_SEED bot). is_bot=True forbids interactive login/signup.
        is_bot=True,
        bot_type=BotTypeEnum.SERVICE,
        # Active + email verified so it is a valid actor with no accept flow:
        # APIKeyAuthentication requires user__is_active, and downstream code
        # treats a verified email as a fully onboarded account.
        is_active=True,
        is_email_verified=True,
        is_email_valid=True,
        is_password_autoset=True,
    )
    # No password round-trip: the account authenticates only via its API token,
    # so give it an unusable password that can never be used to log in.
    user.set_unusable_password()
    user.save()

    member = WorkspaceMember.objects.create(
        workspace=workspace,
        member=user,
        role=role_value,
        company_role="",
    )

    api_token = mint_service_account_token(
        user=user,
        workspace=workspace,
        label=name,
        description=description or f"Service account token for {name}",
    )

    return ServiceAccount(user=user, member=member, api_token=api_token)


def mint_service_account_token(*, user, workspace, label=None, description="", expired_at=None) -> APIToken:
    """Mint an additional workspace-scoped bot token for a service account.

    ``is_service=True`` + ``user_type=Bot`` mark it as a machine token; when
    ``label`` is omitted the model's default (a random handle) is used.
    """
    fields = {
        "description": description,
        "user": user,
        # 1 == Bot (see APIToken.user_type choices).
        "user_type": 1,
        "workspace": workspace,
        "is_service": True,
        "expired_at": expired_at,
    }
    if label:
        fields["label"] = label
    return APIToken.objects.create(**fields)


@transaction.atomic
def rotate_service_account_token(*, token: APIToken, expired_at=None) -> APIToken:
    """Atomically mint a replacement token and deactivate the old one.

    The replacement inherits the old token's label/description/workspace so the
    rotation is transparent to consumers; ``expired_at`` may be set anew. The old
    token is deactivated (``is_active=False``) so authenticating with it fails
    immediately.
    """
    replacement = mint_service_account_token(
        user=token.user,
        workspace=token.workspace,
        label=token.label,
        description=token.description,
        expired_at=expired_at,
    )
    token.is_active = False
    token.save(update_fields=["is_active", "updated_at"])
    return replacement


@transaction.atomic
def decommission_service_account(*, user: User, workspace: Workspace) -> None:
    """Retire a service account: revoke access and remove its memberships.

    Deactivates every token, removes (soft-deletes) the account's ProjectMember
    and WorkspaceMember rows, and deactivates the User. The User row is kept (not
    deleted) so historical attribution (``created_by``/``updated_by`` on
    everything it created) survives; ``is_active=False`` alone revokes API access
    (``APIKeyAuthentication`` requires ``user__is_active``).

    The token/user deactivation is global while membership removal is scoped to
    ``workspace``; this is consistent because a service account belongs to
    exactly one workspace (it is created for one workspace and there is no API to
    add it to another), so "retire the user" == "retire it in this workspace".
    """
    APIToken.objects.filter(user=user).update(is_active=False)
    ProjectMember.objects.filter(member=user, workspace=workspace).delete()
    WorkspaceMember.objects.filter(member=user, workspace=workspace).delete()
    user.is_active = False
    user.save(update_fields=["is_active"])
