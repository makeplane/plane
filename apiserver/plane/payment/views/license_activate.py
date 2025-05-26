# Python imports
import requests

# Django imports
from django.conf import settings
from django.db.models import F

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from plane.app.permissions.workspace import WorkspaceOwnerPermission
from plane.db.models import Workspace, WorkspaceMember
from plane.payment.utils.workspace_license_request import resync_workspace_license


class WorkspaceLicenseEndpoint(BaseAPIView):
    permission_classes = [WorkspaceOwnerPermission]

    def get(self, request, slug):
        try:
            # Check the multi-tenant environment
            if settings.IS_MULTI_TENANT:
                return Response(
                    {"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN
                )

            workspace = Workspace.objects.get(slug=slug)
            response = requests.get(
                f"{settings.PAYMENT_SERVER_BASE_URL}/api/workspaces/{str(workspace.id)}/licenses/",
                headers={
                    "content-type": "application/json",
                    "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                },
            )
            # Check if the request was successful
            response.raise_for_status()
            # Return the response
            return Response(response.json(), status=status.HTTP_200_OK)
        except requests.exceptions.RequestException as e:
            if hasattr(e, "response") and e.response.status_code == 400:
                return Response(e.response.json(), status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, slug):
        # Check the multi-tenant environment
        if settings.IS_MULTI_TENANT:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        license_key = request.data.get("license_key", False)

        if not license_key:
            return Response(
                {"error": "license_key is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        if settings.PAYMENT_SERVER_BASE_URL:
            # Send request to payment server to activate the license
            workspace = Workspace.objects.get(slug=slug)

            # Get all active workspace members
            workspace_members = (
                WorkspaceMember.objects.filter(
                    workspace_id=workspace.id, is_active=True, member__is_bot=False
                )
                .annotate(
                    user_email=F("member__email"),
                    user_id=F("member__id"),
                    user_role=F("role"),
                )
                .values("user_email", "user_id", "user_role")
            )

            # Convert user_id to string
            for member in workspace_members:
                member["user_id"] = str(member["user_id"])

            try:
                response = requests.post(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/licenses/activate/",
                    json={
                        "workspace_slug": workspace.slug,
                        "workspace_id": str(workspace.id),
                        "license_key": license_key,
                        "members_list": list(workspace_members),
                        "owner_email": workspace.owner.email,
                    },
                    headers={
                        "content-type": "application/json",
                        "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                    },
                )
                # Check if the request was successful
                response.raise_for_status()

                # Force resync the workspace licenses
                resync_workspace_license(workspace_slug=slug, force=True)

                # Return the response
                return Response(response.json(), status=status.HTTP_200_OK)
            except requests.exceptions.RequestException as e:

                if hasattr(e, "response") and e.response.status_code == 400:
                    return Response(
                        e.response.json(), status=status.HTTP_400_BAD_REQUEST
                    )
                return Response(
                    {"error": "Invalid license key"}, status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {"error": "Payment server is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class LicenseDeActivateEndpoint(BaseAPIView):
    permission_classes = [WorkspaceOwnerPermission]

    def post(self, request, slug):
        # Check the multi-tenant environment
        if settings.IS_MULTI_TENANT:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        if settings.PAYMENT_SERVER_BASE_URL:
            # Send request to payment server to activate the license
            workspace = Workspace.objects.get(slug=slug)

            try:
                response = requests.post(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/licenses/deactivate/",
                    json={
                        "workspace_slug": workspace.slug,
                        "workspace_id": str(workspace.id),
                    },
                    headers={
                        "content-type": "application/json",
                        "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                    },
                )
                # Check if the request was successful
                response.raise_for_status()

                # Force resync the workspace licenses
                resync_workspace_license(workspace_slug=slug, force=True)

                # Return the response
                return Response(response.json(), status=status.HTTP_200_OK)
            except requests.exceptions.RequestException as e:
                if e.response.status_code == 400:
                    return Response(
                        e.response.json(), status=status.HTTP_400_BAD_REQUEST
                    )
                return Response(
                    {"error": "Invalid license key"}, status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {"error": "Payment server is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )
