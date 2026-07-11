# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import IntegrityError

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiRequest,
    OpenApiParameter,
    OpenApiTypes,
)

# Module imports
from .base import BaseAPIView
from plane.api.serializers import WebhookSerializer
from plane.db.models import Webhook, Workspace
from plane.utils.permissions import WorkspaceOwnerPermission
from plane.utils.openapi import (
    WORKSPACE_SLUG_PARAMETER,
    UNAUTHORIZED_RESPONSE,
    FORBIDDEN_RESPONSE,
    WORKSPACE_NOT_FOUND_RESPONSE,
    CONFLICT_RESPONSE,
)

# Fields returned to clients everywhere except the create response — the
# server-generated ``secret_key`` is intentionally withheld here and only ever
# surfaced once, in the create response, so it is not leaked on every read.
WEBHOOK_READ_FIELDS = (
    "id",
    "url",
    "is_active",
    "created_at",
    "updated_at",
    "project",
    "issue",
    "cycle",
    "module",
    "issue_comment",
)

WEBHOOK_PK_PARAMETER = OpenApiParameter(
    name="pk",
    description="Webhook ID",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
)


class WebhookAPIEndpoint(BaseAPIView):
    """Manage workspace webhooks via the token API.

    Mirrors the internal app-API webhook endpoint: workspace-admin only,
    enforces the shared URL schema/domain validators and the SSRF /
    ``WEBHOOK_ALLOWED_IPS`` guard, and generates the signing ``secret_key``
    server-side (returned only in the create response).
    """

    permission_classes = [WorkspaceOwnerPermission]
    serializer_class = WebhookSerializer

    @extend_schema(
        operation_id="create_webhook",
        summary="Create webhook",
        description=(
            "Register a webhook for the workspace. The signing `secret_key` is "
            "generated server-side and returned only in this response. The target "
            "`url` is validated against the SSRF/URL guards (localhost, private "
            "networks and non-http(s) schemes are rejected)."
        ),
        tags=["Webhooks"],
        parameters=[WORKSPACE_SLUG_PARAMETER],
        request=OpenApiRequest(request=WebhookSerializer),
        responses={
            201: OpenApiResponse(description="Webhook created", response=WebhookSerializer),
            400: OpenApiResponse(description="Invalid or disallowed webhook URL"),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: WORKSPACE_NOT_FOUND_RESPONSE,
            409: CONFLICT_RESPONSE,
        },
    )
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        try:
            serializer = WebhookSerializer(data=request.data, context={"request": request})
            if serializer.is_valid():
                serializer.save(workspace_id=workspace.id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            # Only the unique webhook-URL violation maps to 409; any other
            # integrity error (FK / NOT NULL / ...) is re-raised so it is not
            # masked as a duplicate-URL conflict.
            if "already exists" in str(e):
                return Response(
                    {"error": "URL already exists for the workspace"},
                    status=status.HTTP_409_CONFLICT,
                )
            raise

    @extend_schema(
        operation_id="list_webhooks",
        summary="List webhooks",
        description=("List all webhooks for the workspace. The `secret_key` is never included in these responses."),
        tags=["Webhooks"],
        parameters=[WORKSPACE_SLUG_PARAMETER],
        responses={
            200: OpenApiResponse(description="Webhooks", response=WebhookSerializer(many=True)),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: WORKSPACE_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug):
        webhooks = Webhook.objects.filter(workspace__slug=slug)
        serializer = WebhookSerializer(webhooks, fields=WEBHOOK_READ_FIELDS, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WebhookDetailAPIEndpoint(BaseAPIView):
    """Retrieve, update or delete a single workspace webhook via the token API.

    Split from ``WebhookAPIEndpoint`` so the collection ``GET`` (list) and the
    detail ``GET`` (retrieve) get distinct, semantically correct OpenAPI
    ``operationId``s instead of colliding on one shared handler.
    """

    permission_classes = [WorkspaceOwnerPermission]
    serializer_class = WebhookSerializer

    @extend_schema(
        operation_id="retrieve_webhook",
        summary="Retrieve webhook",
        description="Retrieve a single webhook by ID. The `secret_key` is never included in this response.",
        tags=["Webhooks"],
        parameters=[WORKSPACE_SLUG_PARAMETER, WEBHOOK_PK_PARAMETER],
        responses={
            200: OpenApiResponse(description="Webhook", response=WebhookSerializer),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: WORKSPACE_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, pk):
        webhook = Webhook.objects.get(workspace__slug=slug, pk=pk)
        serializer = WebhookSerializer(webhook, fields=WEBHOOK_READ_FIELDS)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="update_webhook",
        summary="Update webhook",
        description=(
            "Update a webhook's target `url`, active state or entity toggles. A "
            "changed `url` is re-validated against the SSRF/URL guards. The "
            "`secret_key` cannot be changed here."
        ),
        tags=["Webhooks"],
        parameters=[WORKSPACE_SLUG_PARAMETER, WEBHOOK_PK_PARAMETER],
        request=OpenApiRequest(request=WebhookSerializer),
        responses={
            200: OpenApiResponse(description="Webhook updated", response=WebhookSerializer),
            400: OpenApiResponse(description="Invalid or disallowed webhook URL"),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: WORKSPACE_NOT_FOUND_RESPONSE,
            409: CONFLICT_RESPONSE,
        },
    )
    def patch(self, request, slug, pk):
        webhook = Webhook.objects.get(workspace__slug=slug, pk=pk)
        try:
            serializer = WebhookSerializer(
                webhook,
                data=request.data,
                context={"request": request},
                partial=True,
                fields=WEBHOOK_READ_FIELDS,
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            # Only the unique webhook-URL violation maps to 409; any other
            # integrity error is re-raised rather than masked as a conflict.
            if "already exists" in str(e):
                return Response(
                    {"error": "URL already exists for the workspace"},
                    status=status.HTTP_409_CONFLICT,
                )
            raise

    @extend_schema(
        operation_id="delete_webhook",
        summary="Delete webhook",
        description="Delete a workspace webhook by ID.",
        tags=["Webhooks"],
        parameters=[WORKSPACE_SLUG_PARAMETER, WEBHOOK_PK_PARAMETER],
        responses={
            204: OpenApiResponse(description="Webhook deleted"),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: WORKSPACE_NOT_FOUND_RESPONSE,
        },
    )
    def delete(self, request, slug, pk):
        webhook = Webhook.objects.get(workspace__slug=slug, pk=pk)
        webhook.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
