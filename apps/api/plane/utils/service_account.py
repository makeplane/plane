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
from django.utils import timezone

# Third party imports
from crum import get_current_user

# Module imports
from plane.db.models import APIToken, BotTypeEnum, ProjectMember, User, Workspace, WorkspaceMember

# Human-friendly role name -> WorkspaceMember.role value.
# Mirrors ROLE_CHOICES in plane/db/models/workspace.py ((20, Admin), (15, Member), (5, Guest)).
SERVICE_ACCOUNT_ROLES: dict[str, int] = {"admin": 20, "member": 15, "guest": 5}

# Service accounts exist to provision a workspace end to end over the API, so an
# admin seat is the justified default. Narrow it with --role when a service
# account only needs member/guest scope.
DEFAULT_SERVICE_ACCOUNT_ROLE = "admin"

# Sentinel for "the caller supplied no expiry" on rotation — distinct from an
# explicit None, which means "the replacement never expires".
INHERIT_EXPIRY = object()


def _audit_fields() -> dict:
    """Audit fields for a bulk ``QuerySet.update()``.

    ``QuerySet.update()`` bypasses ``Model.save()``, so ``updated_at`` (auto_now)
    and ``updated_by`` are not set automatically. Set them explicitly, mirroring
    what ``BaseModel.save()`` would do — ``updated_by`` is the current actor, or
    ``None`` when there is no authenticated user.
    """
    actor = get_current_user()
    return {
        "updated_at": timezone.now(),
        "updated_by_id": actor.id if (actor is not None and not actor.is_anonymous) else None,
    }


class ServiceAccountTokenError(Exception):
    """Base for token-rotation preconditions the caller has to resolve.

    Subclasses carry a machine-readable ``code`` and the ``status_code`` the HTTP
    layer should surface, so a view can map the whole family in one ``except``.
    """

    code = "SERVICE_ACCOUNT_TOKEN_ERROR"
    status_code = 400


class TokenNotActiveError(ServiceAccountTokenError):
    """Raised when rotating a token that is not active."""

    code = "TOKEN_NOT_ACTIVE"
    status_code = 409


class SourceExpiryElapsedError(ServiceAccountTokenError):
    """Raised when inheriting the source token's expiry would mint an already-expired token."""

    code = "SOURCE_TOKEN_EXPIRY_ELAPSED"
    status_code = 400


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
        """Return the plaintext API key minted for this account."""
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
        # `from None` so the user-facing validation error isn't buried under a
        # noisy KeyError chain.
        raise ValueError(f"Invalid role '{role}'. Choose one of: {valid}.") from None


@transaction.atomic
def create_service_account(
    *,
    workspace: Workspace,
    name: str,
    role: str | int = DEFAULT_SERVICE_ACCOUNT_ROLE,
    email: str | None = None,
    description: str | None = None,
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
    ``name`` when omitted. ``description`` is the token's description; ``None``
    (omitted) applies a generated default, while an explicit ``""`` is preserved.

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

    # None means "omitted" → apply the generated default; an explicit "" is a
    # deliberate empty description and is preserved (do not use `or`, which would
    # conflate blank with omitted).
    if description is None:
        description = f"Service account token for {name}"

    api_token = mint_service_account_token(
        user=user,
        workspace=workspace,
        label=name,
        description=description,
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
def rotate_service_account_token(*, token: APIToken, expired_at=INHERIT_EXPIRY) -> APIToken:
    """Atomically mint a replacement token and deactivate the old one.

    The replacement inherits the source token's label, description, workspace
    and — unless the caller says otherwise — its ``expired_at``, so rotating a
    bounded-lifetime credential never silently produces a never-expiring one.
    Pass a datetime to set a new expiry, or an explicit ``None`` to clear it.

    Raises :class:`TokenNotActiveError` if the source token is not active (an
    already-rotated or deactivated token cannot be used to mint further
    replacements), and :class:`SourceExpiryElapsedError` if inheriting would
    produce a token that is already expired — the caller must state its intent
    instead of receiving a credential that can never authenticate.

    The old token is deactivated (``is_active=False``) so authenticating with it
    fails immediately.
    """
    inherited = expired_at is INHERIT_EXPIRY
    new_expired_at = token.expired_at if inherited else expired_at

    # When inheriting, the replacement copies the source's ABSOLUTE expiry instant
    # (its remaining lifetime), never a fresh window. If that instant has already
    # elapsed, inheriting would hand back a token that can never authenticate
    # (auth requires expired_at > now), so make the caller state its intent. An
    # explicitly-supplied expiry is validated for future-ness at the serializer,
    # so it is trusted here.
    if inherited and new_expired_at is not None and new_expired_at <= timezone.now():
        raise SourceExpiryElapsedError(
            "The source token's expiry has already elapsed; pass expired_at explicitly (a future timestamp or null)."
        )

    # Deactivate FIRST, conditionally on the row still being active: a plain
    # read-then-write is racy, so two concurrent rotations of the same token
    # would each mint an active replacement. Only the caller whose UPDATE
    # actually matched a row proceeds. .update() bypasses save(), so updated_at
    # (auto_now) and the acting user are set explicitly via _audit_fields.
    if not APIToken.objects.filter(pk=token.pk, is_active=True).update(is_active=False, **_audit_fields()):
        raise TokenNotActiveError("The token is not active and cannot be rotated.")

    replacement = mint_service_account_token(
        user=token.user,
        workspace=token.workspace,
        label=token.label,
        description=token.description,
        expired_at=new_expired_at,
    )
    token.is_active = False
    return replacement


@transaction.atomic
def decommission_service_account(*, user: User, workspace: Workspace) -> None:
    """Retire a service account: revoke access and remove its memberships.

    Deactivates every token, removes (soft-deletes) the account's ProjectMember
    and WorkspaceMember rows, and deactivates the User. The User row is kept (not
    deleted) so historical attribution (``created_by``/``updated_by`` on
    everything it created) survives; ``is_active=False`` alone revokes API access
    (``APIKeyAuthentication`` requires ``user__is_active``).

    Token deactivation and membership removal are scoped to ``workspace`` (tokens
    are workspace-scoped via ``APIToken.workspace``), so decommissioning in one
    workspace never touches tokens or memberships in another. The User is then
    deactivated to retire the identity — a service account belongs to exactly one
    workspace, so this completes the revocation.
    """
    # .update() bypasses save(), so set the audit fields (updated_at/updated_by)
    # explicitly, consistent with rotation.
    APIToken.objects.filter(user=user, workspace=workspace).update(is_active=False, **_audit_fields())
    ProjectMember.objects.filter(member=user, workspace=workspace).delete()
    WorkspaceMember.objects.filter(member=user, workspace=workspace).delete()
    user.is_active = False
    user.save(update_fields=["is_active"])
