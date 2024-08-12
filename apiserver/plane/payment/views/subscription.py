# Python imports
import requests

# Django imports
from django.conf import settings
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from plane.app.permissions.workspace import WorkspaceOwnerPermission
from plane.db.models import Workspace, WorkspaceMember
from plane.ee.models import WorkspaceLicense
from plane.utils.exception_logger import log_exception
from plane.payment.utils.workspace_license_request import (
    fetch_workspace_license,
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
                workspace_license = WorkspaceLicense.objects.filter(
                    workspace=workspace
                ).first()

                # Refetch the workspace license
                workspace_license_response = fetch_workspace_license(
                    workspace_id=str(workspace.id),
                    workspace_slug=slug,
                    free_seats=WorkspaceMember.objects.filter(
                        is_active=True,
                        workspace__slug=slug,
                        member__is_bot=False,
                    ).count(),
                )

                if workspace_license:
                    # Update the last synced time
                    workspace_license.last_synced_at = timezone.now()
                    workspace_license.is_cancelled = (
                        workspace_license_response.get("is_cancelled", False)
                    )
                    workspace_license.purchased_seats = (
                        workspace_license_response.get("purchased_seats", 0)
                    )
                    workspace_license.free_seats = (
                        workspace_license_response.get("free_seats", 12)
                    )
                    workspace_license.current_period_end_date = (
                        workspace_license_response.get(
                            "current_period_end_date"
                        )
                    )
                    workspace_license.recurring_interval = (
                        workspace_license_response.get("interval")
                    )
                    workspace_license.plan = workspace_license_response.get(
                        "plan"
                    )
                    workspace_license.save()
                else:
                    # Create a new workspace license
                    WorkspaceLicense.objects.create(
                        workspace=workspace,
                        last_synced_at=timezone.now(),
                        is_cancelled=workspace_license_response.get(
                            "is_cancelled", False
                        ),
                        purchased_seats=workspace_license_response.get(
                            "purchased_seats", 0
                        ),
                        free_seats=workspace_license_response.get(
                            "free_seats", 12
                        ),
                        current_period_end_date=workspace_license_response.get(
                            "current_period_end_date"
                        ),
                        recurring_interval=workspace_license_response.get(
                            "interval"
                        ),
                        plan=workspace_license_response.get("plan"),
                    )

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
