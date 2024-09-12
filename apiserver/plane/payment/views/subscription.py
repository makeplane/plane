# Python imports
import requests
import os

# Django imports
from django.conf import settings

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from plane.app.permissions.workspace import WorkspaceOwnerPermission
from plane.db.models import Workspace, WorkspaceMember, WorkspaceMemberInvite
from plane.ee.models import WorkspaceLicense
from plane.utils.exception_logger import log_exception
from plane.payment.utils.workspace_license_request import (
    resync_workspace_license,
)


class SubscriptionEndpoint(BaseAPIView):

    permission_classes = [
        WorkspaceOwnerPermission,
    ]

    def post(self, request, slug):
        try:
            # Get the workspace
            workspace = Workspace.objects.get(slug=slug)

            # Fetch the workspace subcription
            if settings.PAYMENT_SERVER_BASE_URL:
                # Make a cancel request to the payment server
                response = requests.post(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/subscriptions/check/",
                    headers={
                        "content-type": "application/json",
                        "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                    },
                    json={"workspace_id": str(workspace.id)},
                )
                # Check if the response is successful
                response.raise_for_status()
                # Return the response
                response = response.json()
                # Check if the response contains the product key
                return Response(response, status=status.HTTP_200_OK)
            return Response(
                {"error": "error in checking workspace subscription"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except requests.exceptions.RequestException as e:
            if e.response.status_code == 400:
                return Response(
                    e.response.json(), status=status.HTTP_400_BAD_REQUEST
                )
            log_exception(e)
            return Response(
                {"error": "error in checking workspace subscription"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UpgradeSubscriptionEndpoint(BaseAPIView):

    permission_classes = [
        WorkspaceOwnerPermission,
    ]

    def post(self, request, slug):
        try:
            # Get the workspace
            workspace = Workspace.objects.get(slug=slug)
            price_id = request.data.get("price_id", False)
            product_id = request.data.get("product_id", False)

            if not price_id or not product_id:
                return Response(
                    {"error": "price_id and product_id are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Fetch the workspace subcription
            if settings.PAYMENT_SERVER_BASE_URL:
                # Make a cancel request to the payment server
                response = requests.post(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/subscriptions/upgrade/",
                    headers={
                        "content-type": "application/json",
                        "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                    },
                    json={
                        "workspace_id": str(workspace.id),
                        "price_id": price_id,
                        "product_id": product_id,
                    },
                )
                # Check if the response is successful
                response.raise_for_status()

                # Refetch the workspace license
                resync_workspace_license(workspace_slug=workspace.slug)
                # Return the response
                return Response(status=status.HTTP_204_NO_CONTENT)
            return Response(
                {"error": "error in checking workspace subscription"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except requests.exceptions.RequestException as e:
            if e.response and e.response.status_code == 400:
                return Response(
                    e.response.json(), status=status.HTTP_400_BAD_REQUEST
                )
            log_exception(e)
            return Response(
                {"error": "error in upgrading workspace subscription"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class PurchaseSubscriptionSeatEndpoint(BaseAPIView):

    permission_classes = [
        WorkspaceOwnerPermission,
    ]

    def post(self, request, slug):
        try:

            if os.environ.get("IS_MULTI_TENANT", "0") == "1":
                return Response(
                    {"error": "Forbidden"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            workspace = Workspace.objects.get(slug=slug)

            quantity = request.data.get(
                "quantity",
                WorkspaceMember.objects.filter(
                    workspace__slug=slug,
                    is_active=True,
                    member__is_bot=False,
                    role__lte=10,
                ).count(),
            )

            # Check the active paid users in the workspace
            workspace_member_count = WorkspaceMember.objects.filter(
                workspace__slug=slug,
                is_active=True,
                member__is_bot=False,
                member__gt=10,
            ).count()

            invited_member_count = WorkspaceMemberInvite.objects.filter(
                workspace__slug=slug,
                role__gt=10,
            )

            # Check if the quantity is less than the active paid users in the workspace
            if quantity < (workspace_member_count + invited_member_count):
                # Return an error response
                return Response(
                    {
                        "error": "The number of seats cannot be less than the number of active paid users in the workspace including the invites"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Fetch the workspace subcription
            if settings.PAYMENT_SERVER_BASE_URL:
                # Make a cancel request to the payment server
                response = requests.post(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/licenses/modify-seats/",
                    headers={
                        "content-type": "application/json",
                        "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                    },
                    json={
                        "workspace_id": str(workspace.id),
                        "quantity": quantity,
                        "workspace_slug": slug,
                    },
                )
                # Check if the response is successful
                response.raise_for_status()

                response = response.json()

                # Fetch the workspace subcription
                workspace_license = WorkspaceLicense.objects.filter(
                    workspace=workspace
                ).first()

                # Update the seat count
                if workspace_license:
                    # Update the seat count
                    workspace_license.purchased_seats = response["seats"]
                    workspace_license.save()

                # Return the response
                return Response(
                    {"seats": response["seats"]}, status=status.HTTP_200_OK
                )
            return Response(
                {"error": "error in checking workspace subscription"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except requests.exceptions.RequestException as e:
            if e.response and e.response.status_code == 400:
                return Response(
                    e.response.json(), status=status.HTTP_400_BAD_REQUEST
                )
            log_exception(e)
            return Response(
                {"error": "Error in purchasing workspace subscription"},
                status=status.HTTP_400_BAD_REQUEST,
            )
