# Python imports
import requests

# Django imports
from django.conf import settings
from django.db.models import CharField
from django.db.models.functions import Cast

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from plane.app.permissions.workspace import (
    WorkspaceUserPermission,
)
from plane.db.models import WorkspaceMember, Workspace
from plane.utils.exception_logger import log_exception


class ProductEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceUserPermission,
    ]

    def get(self, request, slug):
        try:
            if settings.PAYMENT_SERVER_BASE_URL:
                # Get all the paid users in the workspace
                paid_count = WorkspaceMember.objects.filter(
                    workspace__slug=slug,
                    is_active=True,
                    member__is_bot=False,
                    role__gt=10,
                ).count()

                # Get all the viewers and guests in the workspace
                free_count = WorkspaceMember.objects.filter(
                    workspace__slug=slug,
                    is_active=True,
                    member__is_bot=False,
                    role__lte=10,
                ).count()

                # If paid users are currently the pay workspace count
                workspace_count = paid_count

                # If free users are more than 5 times the paid users, then workspace count is free users - 5 * paid users
                if free_count > 5 * paid_count:
                    workspace_count = free_count - 5 * paid_count

                # Fetch the products from the payment server
                response = requests.get(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/products/?quantity={workspace_count}",
                    headers={
                        "content-type": "application/json",
                        "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                    },
                )
                # Check if the response is successful
                response.raise_for_status()
                # Convert the response to json
                response = response.json()
                return Response(response, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "error fetching product details"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except requests.exceptions.RequestException as e:
            log_exception(e)
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
                    headers={
                        "content-type": "application/json",
                        "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                    },
                )
                response.raise_for_status()
                response = response.json()
                return Response(response, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "error fetching product details"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except requests.exceptions.RequestException as e:
            log_exception(e)
            return Response(
                {"error": "error fetching product details"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class WebsiteUserWorkspaceEndpoint(BaseAPIView):

    def get(self, request):
        # Get all the workspaces where the user is admin
        workspace_query = (
            WorkspaceMember.objects.filter(
                member=request.user,
                is_active=True,
                role=20,
            )
            .annotate(uuid_str=Cast("workspace_id", CharField()))
            .values(
                "uuid_str",
                "workspace__slug",
                "workspace__name",
                "workspace__logo",
            )
        )

        workspaces = [
            {
                "workspace_id": workspace["uuid_str"],
                "slug": workspace["workspace__slug"],
                "name": workspace["workspace__name"],
                "logo": workspace["workspace__logo"],
            }
            for workspace in workspace_query
        ]

        if settings.PAYMENT_SERVER_BASE_URL:
            response = requests.post(
                f"{settings.PAYMENT_SERVER_BASE_URL}/api/user-workspace-products/",
                headers={
                    "content-type": "application/json",
                    "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                },
                json={"workspaces": workspaces},
            )
            response.raise_for_status()
            response = response.json()
            return Response(response, status=status.HTTP_200_OK)
        else:
            return Response(
                {"error": "error fetching product details"},
                status=status.HTTP_400_BAD_REQUEST,
            )
