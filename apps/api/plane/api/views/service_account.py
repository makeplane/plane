# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import IntegrityError

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse, OpenApiRequest

# Module imports
from plane.api.views.base import BaseAPIView
from plane.api.serializers.service_account import (
    ServiceAccountCreateSerializer,
    ServiceAccountSerializer,
    ServiceAccountTokenCreateSerializer,
    ServiceAccountTokenCreatedSerializer,
    ServiceAccountTokenRotateSerializer,
    ServiceAccountTokenSerializer,
)
from plane.db.models import APIToken, BotTypeEnum, User, Workspace, WorkspaceMember
from plane.middleware.logger import redact_response_body
from plane.utils.permissions import WorkspaceOwnerPermission
from plane.utils.openapi import (
    create_paginated_response,
    DELETED_RESPONSE,
    FORBIDDEN_RESPONSE,
    NOT_FOUND_RESPONSE,
    UNAUTHORIZED_RESPONSE,
)
from plane.utils.openapi.parameters import CURSOR_PARAMETER, PER_PAGE_PARAMETER, WORKSPACE_SLUG_PARAMETER
from plane.utils.service_account import (
    create_service_account,
    decommission_service_account,
    mint_service_account_token,
    rotate_service_account_token,
    ServiceAccountTokenError,
)

# Machine-readable error surfaced when a caller-chosen username is already taken.
USERNAME_CONFLICT = {"error": "A user with this username already exists.", "code": "USERNAME_ALREADY_EXISTS"}

# Path parameters shared by the service-account lifecycle endpoints.
SERVICE_ACCOUNT_ID_PARAMETER = OpenApiParameter(
    name="user_id",
    description="Service account user id",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
)
TOKEN_ID_PARAMETER = OpenApiParameter(
    name="token_id",
    description="API token id",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
)


def get_service_account_member(slug, user_id):
    """Return the WorkspaceMember for a SERVICE bot in the workspace.

    Returns ``None`` when ``user_id`` is not a service account
    (``is_bot`` + ``bot_type=SERVICE``) member of ``slug``, so callers can map
    that to a 404. The member carries the resolved ``member`` (user) and
    ``workspace``.

    Membership ``is_active`` is intentionally NOT filtered: API auth ignores
    membership (it checks only ``token.is_active`` + ``user__is_active``), so a
    merely-*deactivated* account must stay manageable — otherwise its still-live
    tokens could never be listed or revoked. A *decommissioned* account is
    soft-deleted and so excluded here by the default (soft-delete) manager.
    """
    return (
        WorkspaceMember.objects.filter(
            workspace__slug=slug,
            member_id=user_id,
            member__is_bot=True,
            member__bot_type=BotTypeEnum.SERVICE,
        )
        .select_related("member", "workspace")
        .first()
    )


class ServiceAccountAPIEndpoint(BaseAPIView):
    """Admin-scoped endpoint for provisioning workspace service accounts.

    A workspace admin can mint a machine identity — a distinct, active actor
    with its own API token — without any invite, email-verification, or
    password round-trip. This is the HTTP equivalent of the
    ``create_service_account`` management command.
    """

    permission_classes = [WorkspaceOwnerPermission]

    @extend_schema(
        summary="Create a service account",
        description=(
            "Create a machine/service account in the workspace and mint an API token for it. "
            "The account is active and email-verified, is added as a workspace member with the "
            "given role, and can authenticate only through the returned token. The token is "
            "returned once and cannot be retrieved again. Requires the caller to be a workspace admin."
        ),
        request=OpenApiRequest(request=ServiceAccountCreateSerializer),
        parameters=[WORKSPACE_SLUG_PARAMETER],
        responses={
            201: OpenApiResponse(
                description="Service account created",
                response=ServiceAccountSerializer,
            ),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
            409: OpenApiResponse(description="A user with the requested username already exists"),
        },
    )
    def post(self, request, slug):
        """Create a service account

        Provision a machine identity in the workspace and mint its first API
        token. The token value is returned once and cannot be retrieved again.
        """
        workspace = Workspace.objects.get(slug=slug)

        serializer = ServiceAccountCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        username = data.get("username")
        # Reject a taken username with a machine-readable code — never silently
        # mutate it into a unique one. The insert below is still wrapped so a
        # race between this check and the create is reported the same way.
        if username and User.objects.filter(username=username).exists():
            return Response(USERNAME_CONFLICT, status=status.HTTP_409_CONFLICT)

        try:
            service_account = create_service_account(
                workspace=workspace,
                name=data["name"],
                role=data["role"],
                # None (omitted) → generated default; an explicit "" is preserved.
                description=data.get("description"),
                username=username,
                display_name=data.get("display_name"),
            )
        except IntegrityError:
            # The only caller-controlled unique field here is the username
            # (email/token are server-generated). If it is now taken — including
            # a race that slipped past the pre-check — report the conflict. Any
            # other IntegrityError is unexpected and must not be mislabeled, so
            # let it surface via BaseAPIView.handle_exception. The helper's
            # @transaction.atomic has already rolled back, so this SELECT runs on
            # a clean connection.
            if username and User.objects.filter(username=username).exists():
                return Response(USERNAME_CONFLICT, status=status.HTTP_409_CONFLICT)
            raise

        response = ServiceAccountSerializer(
            {
                "id": service_account.user.id,
                "username": service_account.user.username,
                "email": service_account.user.email,
                "display_name": service_account.user.display_name,
                "role": service_account.member.role,
                "workspace": workspace.id,
                "token": service_account.token,
            }
        )
        # The response carries the plaintext token, so keep it out of the
        # api_activity_logs table (APITokenLogMiddleware logs response bodies).
        return redact_response_body(Response(response.data, status=status.HTTP_201_CREATED))


# Machine-readable error surfaced when the decommission guard rejects a non-service user.
NOT_A_SERVICE_ACCOUNT = {"error": "This user is not a service account.", "code": "NOT_A_SERVICE_ACCOUNT"}


class ServiceAccountDetailAPIEndpoint(BaseAPIView):
    """Decommission a service account."""

    permission_classes = [WorkspaceOwnerPermission]

    @extend_schema(
        summary="Decommission a service account",
        description=(
            "Retire a service account: deactivate all its API tokens, remove its project and "
            "workspace memberships, and deactivate the user. The user row is preserved so historical "
            "attribution (created_by/updated_by) survives. Only valid for service accounts "
            "(is_bot + bot_type=SERVICE); a human or other bot returns 400. Requires workspace admin."
        ),
        parameters=[WORKSPACE_SLUG_PARAMETER, SERVICE_ACCOUNT_ID_PARAMETER],
        responses={
            204: DELETED_RESPONSE,
            400: OpenApiResponse(description="The user is not a service account"),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def delete(self, request, slug, user_id):
        """Decommission a service account

        Deactivate every token, remove the account's project and workspace
        memberships, and deactivate the user. The user row is preserved so
        historical attribution survives.
        """
        # is_active is not filtered so a deactivated (but not yet decommissioned)
        # account can still be retired; a decommissioned one is soft-deleted and
        # excluded by the default manager (→ 404, idempotent).
        member = (
            WorkspaceMember.objects.filter(workspace__slug=slug, member_id=user_id)
            .select_related("member", "workspace")
            .first()
        )
        if member is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        user = member.member
        # Hard guard: only a genuine service account may be decommissioned this way.
        if not (user.is_bot and user.bot_type == BotTypeEnum.SERVICE):
            return Response(NOT_A_SERVICE_ACCOUNT, status=status.HTTP_400_BAD_REQUEST)

        decommission_service_account(user=user, workspace=member.workspace)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ServiceAccountTokenAPIEndpoint(BaseAPIView):
    """List and mint a service account's API tokens."""

    permission_classes = [WorkspaceOwnerPermission]

    @extend_schema(
        summary="List service account tokens",
        description=(
            "List a service account's API tokens with metadata (label, timestamps, expiry, "
            "is_active). The secret token value is always withheld. Requires workspace admin."
        ),
        parameters=[WORKSPACE_SLUG_PARAMETER, SERVICE_ACCOUNT_ID_PARAMETER, CURSOR_PARAMETER, PER_PAGE_PARAMETER],
        responses={
            200: create_paginated_response(
                ServiceAccountTokenSerializer,
                "PaginatedServiceAccountTokenResponse",
                "Paginated list of service account tokens",
                "Paginated Service Account Tokens",
            ),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, user_id):
        """List service account tokens

        Retrieve the account's API tokens with their metadata. The secret token
        value is always withheld.
        """
        member = get_service_account_member(slug, user_id)
        if member is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        queryset = APIToken.objects.filter(user_id=user_id, workspace=member.workspace, is_service=True).order_by(
            "-created_at"
        )
        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda tokens: ServiceAccountTokenSerializer(tokens, many=True).data,
        )

    @extend_schema(
        summary="Mint a service account token",
        description=(
            "Mint an additional workspace-scoped bot token for the service account. The token value "
            "is returned once and cannot be retrieved again. Requires workspace admin."
        ),
        request=OpenApiRequest(request=ServiceAccountTokenCreateSerializer),
        parameters=[WORKSPACE_SLUG_PARAMETER, SERVICE_ACCOUNT_ID_PARAMETER],
        responses={
            201: OpenApiResponse(description="Token created", response=ServiceAccountTokenCreatedSerializer),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def post(self, request, slug, user_id):
        """Mint a service account token

        Create an additional workspace-scoped bot token for the account. The
        token value is returned once and cannot be retrieved again.
        """
        member = get_service_account_member(slug, user_id)
        if member is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = ServiceAccountTokenCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        token = mint_service_account_token(
            user=member.member,
            workspace=member.workspace,
            label=data.get("label"),
            description=data.get("description", ""),
            expired_at=data.get("expired_at"),
        )
        return redact_response_body(Response(_token_created_payload(token), status=status.HTTP_201_CREATED))


class ServiceAccountTokenDetailAPIEndpoint(BaseAPIView):
    """Revoke a single service account token."""

    permission_classes = [WorkspaceOwnerPermission]

    @extend_schema(
        summary="Revoke a service account token",
        description=(
            "Revoke (soft-delete) a single API token so authenticating with it fails. Requires workspace admin."
        ),
        parameters=[WORKSPACE_SLUG_PARAMETER, SERVICE_ACCOUNT_ID_PARAMETER, TOKEN_ID_PARAMETER],
        responses={
            204: DELETED_RESPONSE,
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def delete(self, request, slug, user_id, token_id):
        """Revoke a service account token

        Revoke a single API token so authenticating with it fails immediately.
        """
        member = get_service_account_member(slug, user_id)
        if member is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        token = APIToken.objects.filter(
            id=token_id, user_id=user_id, workspace=member.workspace, is_service=True
        ).first()
        if token is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ServiceAccountTokenRotateAPIEndpoint(BaseAPIView):
    """Rotate a service account token."""

    permission_classes = [WorkspaceOwnerPermission]

    @extend_schema(
        summary="Rotate a service account token",
        description=(
            "Atomically mint a replacement token and deactivate the old one. The replacement value "
            "is returned once. Authenticating with the old token fails immediately. Requires workspace admin."
        ),
        request=OpenApiRequest(request=ServiceAccountTokenRotateSerializer),
        parameters=[WORKSPACE_SLUG_PARAMETER, SERVICE_ACCOUNT_ID_PARAMETER, TOKEN_ID_PARAMETER],
        responses={
            201: OpenApiResponse(
                description="Replacement token created", response=ServiceAccountTokenCreatedSerializer
            ),
            400: OpenApiResponse(description="Invalid request body, or the source token's expiry has already elapsed"),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
            409: OpenApiResponse(description="The token is not active and cannot be rotated"),
        },
    )
    def post(self, request, slug, user_id, token_id):
        """Rotate a service account token

        Atomically mint a replacement token and deactivate the old one. The
        replacement value is returned once and inherits the source token's
        expiry unless the request overrides it.
        """
        member = get_service_account_member(slug, user_id)
        if member is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        token = APIToken.objects.filter(
            id=token_id, user_id=user_id, workspace=member.workspace, is_service=True
        ).first()
        if token is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = ServiceAccountTokenRotateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Only forward expired_at when the caller actually sent the key, so the
        # helper can tell "inherit the source expiry" from an explicit null.
        overrides = {"expired_at": data["expired_at"]} if "expired_at" in data else {}

        try:
            replacement = rotate_service_account_token(token=token, **overrides)
        except ServiceAccountTokenError as exc:
            return Response({"error": str(exc), "code": exc.code}, status=exc.status_code)

        return redact_response_body(Response(_token_created_payload(replacement), status=status.HTTP_201_CREATED))


def _token_created_payload(token):
    """Serialize a freshly minted/rotated token, including its value (shown once)."""
    return ServiceAccountTokenCreatedSerializer(
        {
            "id": token.id,
            "label": token.label,
            "is_active": token.is_active,
            "created_at": token.created_at,
            "expired_at": token.expired_at,
            "token": token.token,
        }
    ).data
