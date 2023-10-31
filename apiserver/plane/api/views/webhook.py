# Django imports
from django.db import IntegrityError

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import Webhook, WebhookLog, Workspace
from .base import BaseAPIView
from plane.api.permissions import WorkspaceUserPermission
from plane.api.serializers import WebhookSerializer, WebhookLogSerializer


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
                return Response(
                    {"error": "URL already exists for the workspace"},
                    status=status.HTTP_410_GONE,
                )
            raise IntegrityError

    def get(self, request, slug, pk=None):
        if pk == None:
            webhooks = Webhook.objects.filter(workspace__slug=slug)
            serializer = WebhookSerializer(
                webhooks,
                fields=(
                    "id",
                    "url",
                    "secret_key",
                    "is_active",
                    "created_at",
                    "updated_at",
                    "project",
                    "issue",
                    "cycle",
                    "module",
                    "issue_comment",
                ),
                many=True,
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            webhook = Webhook.objects.get(workspace__slug=slug, pk=pk)
            serializer = WebhookSerializer(webhook)
            return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, slug, pk):
        webhook = Webhook.objects.get(workspace__slug=slug, pk=pk)
        serializer = WebhookSerializer(webhook, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, pk):
        webhook = Webhook.objects.get(pk=pk, workspace__slug=slug)
        webhook.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WebhookLogsEndpoint(BaseAPIView):

    permission_classes = [
        WorkspaceUserPermission,
    ]

    def get(self, request, slug, webhook_id):
        webhook_logs = WebhookLog.objects.filter(workspace__slug=slug, webhook_id=webhook_id)
        serializer = WebhookLogSerializer(webhook_logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    