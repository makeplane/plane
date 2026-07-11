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
from plane.db.models import APIToken, BotTypeEnum, User, Workspace, WorkspaceMember

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
) -> ServiceAccount:
    """Create a service account in ``workspace`` and mint its API token.

    Creates, in a single transaction:

    * an ACTIVE, email-verified :class:`User` marked as a bot
      (``is_bot=True``, ``bot_type=SERVICE``) with an unusable password,
    * a :class:`WorkspaceMember` binding it to ``workspace`` at ``role``,
    * an :class:`APIToken` (``user_type=Bot``, ``is_service=True``,
      workspace-scoped) whose plaintext value is returned on the result.

    No email is sent and no password is ever round-tripped. ``is_bot=True``
    additionally blocks the interactive login/signup flow
    (``BOT_USER_LOGIN_FORBIDDEN``), so the identity can be used *only* via its
    token.
    """
    role_value = resolve_service_account_role(role)

    # A service account never logs in, so username/email are internal, unique
    # identifiers rather than human contact addresses.
    unique = uuid.uuid4().hex
    username = f"svc_{unique}"
    if not email:
        email = f"{username}@service.plane.local"

    user = User(
        username=username,
        email=email,
        display_name=name,
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

    api_token = APIToken.objects.create(
        label=name,
        description=description or f"Service account token for {name}",
        user=user,
        # 1 == Bot (see APIToken.user_type choices).
        user_type=1,
        workspace=workspace,
        is_service=True,
    )

    return ServiceAccount(user=user, member=member, api_token=api_token)
