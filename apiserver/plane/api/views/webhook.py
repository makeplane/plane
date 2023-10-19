# Python imports
from uuid import uuid4

# Django imports
from django.db import IntegrityError

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import Webhook, WebhookLog, Workspace
from .base import BaseAPIView
from plane.api.permissions import WorkspaceUserPermission
from plane.api.serializers import WebhookSerializer


class WebhookEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceUserPermission,
    ]

    def post(self, request, slug):
            workspace = Workspace.objects.get(slug=slug)

            try:
                serializer = WebhookSerializer(data=request.data)
                if serializer.is_valid():
                    serializer.save(workspace_id=workspace.id)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            except IntegrityError as e:
                if "already exists" in str(e):
                     return Response({"error": "URL already exists for the workspace"}, status=status.HTTP_410_GONE)
                raise IntegrityError

    def get(self, request, slug):
        webhooks = Webhook.objects.filter(workspace__slug=slug)
        serializer = WebhookSerializer(
            webhooks,
            fields=(
                "url",
                "content_type",
                "secret_key",
                "is_active",
                "created_at",
                "updated_at",
            ),
            many=True,
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
