# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import IntegrityError

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiRequest

# Module imports
from plane.api.views.base import BaseAPIView
from plane.api.serializers.service_account import (
    ServiceAccountCreateSerializer,
    ServiceAccountSerializer,
)
from plane.db.models import User, Workspace
from plane.middleware.logger import redact_response_body
from plane.utils.permissions import WorkspaceOwnerPermission
from plane.utils.openapi.parameters import WORKSPACE_SLUG_PARAMETER
from plane.utils.service_account import create_service_account

# Machine-readable error surfaced when a caller-chosen username is already taken.
USERNAME_CONFLICT = {"error": "A user with this username already exists.", "code": "USERNAME_ALREADY_EXISTS"}


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
            409: OpenApiResponse(description="A user with the requested username already exists"),
        },
    )
    def post(self, request, slug):
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
                description=data.get("description", ""),
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
