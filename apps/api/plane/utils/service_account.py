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
from django.db import IntegrityError, transaction
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


class ServiceAccountUsernameConflictError(Exception):
    """Raised when a requested username cannot be provisioned as a service account.

    The username belongs to an *active* account, or to a user that is not a
    reactivatable service account (a human, or a non-``SERVICE`` bot). A
    *decommissioned* (inactive ``SERVICE``) account with the same username is
    reactivated in place instead of rejected — see :func:`create_service_account`.

    Carries a machine-readable ``code`` and the ``status_code`` the HTTP layer
    surfaces, mirroring :class:`ServiceAccountTokenError`.
    """

    code = "USERNAME_ALREADY_EXISTS"
    status_code = 409


@dataclass
class ServiceAccount:
    """Result of :func:`create_service_account`.

    ``token`` is the *plaintext* API key. Plane stores API tokens verbatim (the
    authentication layer looks them up by exact match), so this is the value the
    caller must persist — it is surfaced here exactly once at creation time.

    ``reactivated`` is ``True`` when the account was revived from a decommissioned
    identity of the same username rather than freshly created; ``user.id`` is then
    the pre-existing id (see :func:`create_service_account`).
    """

    user: User
    member: WorkspaceMember
    api_token: APIToken
    reactivated: bool = False

    @property
    def token(self) -> str:
        """Return the plaintext API key minted for this account."""
        return self.api_token.token


def is_reactivatable_service_account(user: User | None, workspace: Workspace) -> bool:
    """Whether ``user`` is a decommissioned service account revivable in ``workspace``.

    True only when ``user`` is an INACTIVE ``bot_type=SERVICE`` account that was a
    member of ``workspace`` (a decommissioned seat, whose membership row survives
    soft-deleted, so it is visible via ``all_objects``). A username is GLOBALLY
    unique, so it may name a SERVICE account that belonged to a DIFFERENT workspace;
    that account is *not* revivable here — reviving it would resurrect a
    foreign-tenant identity under a shared user id (leaking its email/display_name,
    seizing its username, and conflating attribution), breaking the "a service
    account belongs to exactly one workspace" invariant. Such a cross-workspace
    collision, an *active* account, and any non-service user all return ``False`` so
    the caller treats them as a genuine conflict.
    """
    return bool(
        user is not None
        and user.is_bot
        and user.bot_type == BotTypeEnum.SERVICE
        and not user.is_active
        and WorkspaceMember.all_objects.filter(workspace=workspace, member=user).exists()
    )


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
    """Create (or reactivate) a service account in ``workspace`` and mint its API token.

    Creates, in a single transaction:

    * an ACTIVE, email-verified :class:`User` marked as a bot
      (``is_bot=True``, ``bot_type=SERVICE``) with an unusable password,
    * a :class:`WorkspaceMember` binding it to ``workspace`` at ``role``,
    * an :class:`APIToken` (``user_type=Bot``, ``is_service=True``,
      workspace-scoped) whose plaintext value is returned on the result.

    ``username`` and ``display_name`` are optional caller-chosen identity fields.
    ``username`` must be globally unique; when omitted a synthetic ``svc_<uuid>``
    value is generated. ``display_name`` is what the workspace members UI shows;
    it falls back to ``name`` when omitted. ``description`` is the token's
    description; ``None`` (omitted) applies a generated default, while an explicit
    ``""`` is preserved.

    **Reactivation.** If ``username`` is supplied and already belongs to a
    *decommissioned* service account of **this** workspace (an inactive
    ``bot_type=SERVICE`` user that was a member of ``workspace``), that identity is
    revived in place instead of colliding: the user is reactivated
    (``is_active=True``), its workspace membership is restored at ``role``, and a
    fresh token is minted and returned — all under the pre-existing user id, so a
    retired seat can be re-provisioned by its stable username. Its identity fields
    (username/email/display_name) are preserved; only the membership role and a new
    token are (re)provisioned, and the result carries ``reactivated=True``. A
    username owned by an *active* account, by any non-service user (a human or a
    non-``SERVICE`` bot), or by a service account that belonged to a *different*
    workspace is a genuine conflict and raises
    :class:`ServiceAccountUsernameConflictError` (see
    :func:`is_reactivatable_service_account` — reactivation never crosses a
    workspace boundary).

    No email is sent and no password is ever round-tripped. ``is_bot=True``
    additionally blocks the interactive login/signup flow
    (``BOT_USER_LOGIN_FORBIDDEN``), so the identity can be used *only* via its
    token.
    """
    role_value = resolve_service_account_role(role)

    # None means "omitted" → apply the generated default; an explicit "" is a
    # deliberate empty description and is preserved (do not use `or`, which would
    # conflate blank with omitted). Resolved once so the fresh-create and the
    # reactivation paths share it.
    token_description = f"Service account token for {name}" if description is None else description

    # Reactivation: a caller-chosen username that already belongs to a
    # DECOMMISSIONED service account OF THIS WORKSPACE revives that identity in
    # place rather than colliding, so a retired seat can be re-provisioned by its
    # stable username. select_for_update serializes concurrent re-provisions of
    # the same username.
    if username:
        existing = User.objects.select_for_update().filter(username=username).first()
        if existing is not None:
            if not is_reactivatable_service_account(existing, workspace):
                # Owned by an active account, a non-service user (human/other bot),
                # or a SERVICE account from a DIFFERENT workspace — none revivable
                # here. The message is intentionally generic so a cross-workspace
                # probe cannot confirm a username exists elsewhere.
                raise ServiceAccountUsernameConflictError("A user with this username already exists.")
            return _reactivate_service_account(
                user=existing,
                workspace=workspace,
                role_value=role_value,
                label=name,
                description=token_description,
            )

    # Fresh creation. A service account never logs in, so a caller-omitted
    # username/email are internal, unique identifiers rather than human contact
    # addresses. The synthetic email is always derived from a fresh uuid (never
    # the caller's username) so it stays valid and unique regardless of the
    # username.
    requested_username = username  # caller-provided (or None) — used to classify a race below
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
    # A concurrent create of the same brand-new caller-chosen username can win the
    # race between the conflict check above and this insert. Wrap the insert in a
    # savepoint so the unique-violation IntegrityError is classified at its source
    # (a username conflict) without poisoning the outer transaction; any OTHER
    # IntegrityError (e.g. a caller-supplied email collision) propagates unchanged
    # for the caller to surface.
    try:
        with transaction.atomic():
            user.save()
    except IntegrityError:
        if requested_username and User.objects.filter(username=requested_username).exists():
            raise ServiceAccountUsernameConflictError("A user with this username already exists.") from None
        raise

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
        description=token_description,
    )

    return ServiceAccount(user=user, member=member, api_token=api_token)


def _reactivate_service_account(
    *, user: User, workspace: Workspace, role_value: int, label: str, description: str
) -> ServiceAccount:
    """Revive a decommissioned service account in place.

    Reactivates the ``User`` (``is_active=True``), restores its workspace
    membership at ``role_value``, and mints a fresh token. Identity fields
    (username/email/display_name) are preserved — reactivation is keyed on the
    stable username. Previously-deactivated tokens stay inactive; the new one is
    returned. Called only from :func:`create_service_account` inside its
    transaction.
    """
    user.is_active = True
    user.save(update_fields=["is_active"])

    member = _provision_workspace_membership(workspace=workspace, user=user, role_value=role_value)

    api_token = mint_service_account_token(
        user=user,
        workspace=workspace,
        label=label,
        description=description,
    )
    return ServiceAccount(user=user, member=member, api_token=api_token, reactivated=True)


def _provision_workspace_membership(*, workspace: Workspace, user: User, role_value: int) -> WorkspaceMember:
    """Bind ``user`` to ``workspace`` at ``role_value``, restoring a prior membership.

    Decommissioning SOFT-deletes the ``WorkspaceMember`` (sets ``deleted_at``), so
    a reactivated account has a soft-deleted membership row. The partial unique
    index on ``(workspace, member) WHERE deleted_at IS NULL`` permits only one
    live row, so restore the existing row in place rather than inserting a
    duplicate:

    * a live row (never soft-deleted) is reactivated at the requested role;
    * otherwise a soft-deleted row is restored (``deleted_at`` cleared);
    * otherwise a new membership is created.
    """
    live = WorkspaceMember.objects.filter(workspace=workspace, member=user).first()
    if live is not None:
        live.role = role_value
        live.is_active = True
        live.save()
        return live

    removed = WorkspaceMember.all_objects.filter(workspace=workspace, member=user).order_by("-created_at").first()
    if removed is not None:
        removed.deleted_at = None
        removed.is_active = True
        removed.role = role_value
        removed.save()
        return removed

    return WorkspaceMember.objects.create(workspace=workspace, member=user, role=role_value, company_role="")


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
