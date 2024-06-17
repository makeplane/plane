# Python imports
import requests

# Django imports
from django.conf import settings

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from plane.app.permissions.workspace import (
    WorkSpaceAdminPermission,
    WorkspaceUserPermission,
)
from plane.db.models import WorkspaceMember, Workspace


class ProductEndpoint(BaseAPIView):

    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def get(self, request, slug):
        try:
            if settings.PAYMENT_SERVER_BASE_URL:
                count = WorkspaceMember.objects.filter(
                    workspace__slug=slug
                ).count()
                response = requests.get(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/products/?quantity={count}",
                    headers={"content-type": "application/json"},
                )
                response = response.json()
                return Response(response, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "error fetching product details"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except requests.exceptions.RequestException:
            return Response(
                {"error": "error fetching product details"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class WorkspaceProductEndpoint(BaseAPIView):

    permission_classes = [
        WorkspaceUserPermission,
    ]

    def get(self, request, slug):
        try:
            if settings.PAYMENT_SERVER_BASE_URL:
                workspace = Workspace.objects.get(slug=slug)
                response = requests.get(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/products/workspace-products/{str(workspace.id)}/",
                    headers={"content-type": "application/json"},
                )
                response = response.json()
                return Response(response, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "error fetching product details"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except requests.exceptions.RequestException:
            return Response(
                {"error": "error fetching product details"},
                status=status.HTTP_400_BAD_REQUEST,
            )
