# Python imports
import requests

# Django imports
from django.conf import settings
from django.utils import timezone
from django.db.models import F

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import Throttled

# Module imports
from .base import BaseAPIView
from plane.app.permissions.workspace import WorkspaceUserPermission
from plane.db.models import WorkspaceMember, Workspace, WorkspaceMemberInvite
from plane.ee.models import WorkspaceLicense
from plane.utils.exception_logger import log_exception
from plane.payment.utils.workspace_license_request import (
    resync_workspace_license,
    is_billing_active,
    is_on_trial,
)
from plane.payment.rate_limit import WorkspaceRateThrottle


class ProductEndpoint(BaseAPIView):
    permission_classes = [WorkspaceUserPermission]

    """
    Get the product details for the workspace based on the number of paid users and free users
    """

    def get(self, request, slug):
        try:
            if settings.PAYMENT_SERVER_BASE_URL:
                # Get all the paid users in the workspace
                paid_count = (
                    WorkspaceMember.objects.filter(
                        workspace__slug=slug,
                        is_active=True,
                        member__is_bot=False,
                        role__gt=10,
                    ).count()
                    + WorkspaceMemberInvite.objects.filter(
                        workspace__slug=slug, role__gt=10
                    ).count()
                )

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
            if hasattr(e, "response") and e.response.status_code == 400:
                return Response(e.response.json(), status=status.HTTP_400_BAD_REQUEST)
            log_exception(e)
            return Response(
                {"error": "error fetching product details"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class WorkspaceProductEndpoint(BaseAPIView):
    permission_classes = [WorkspaceUserPermission]

    """
    Get the product details for the workspace
    """

    def get(self, request, slug):
        try:
            if settings.PAYMENT_SERVER_BASE_URL:
                # Resync the workspace license
                response = resync_workspace_license(workspace_slug=slug)
                return Response(response, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "error fetching product details"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except requests.exceptions.RequestException as e:
            if hasattr(e, "response") and e.response.status_code == 400:
                return Response(e.response.json(), status=status.HTTP_400_BAD_REQUEST)
            log_exception(e)
            return Response(
                {"error": "error fetching product details"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class WorkspaceLicenseRefreshEndpoint(BaseAPIView):
    # Throttle classes
    throttle_classes = [WorkspaceRateThrottle]

    # Throttle rate
    def throttled(self, request, wait):
        raise Throttled(
            detail={
                "message": f"Rate limit exceeded. Please try again in {int(wait)} seconds.",
                "wait_seconds": int(wait),
            }
        )

    def post(self, request, slug):
        # On the multi-tenant version, the workspace license is synced from the payment server
        if settings.IS_MULTI_TENANT:
            # Resync the workspace license
            _ = resync_workspace_license(workspace_slug=slug, force=True)

            # Return the response
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            workspace = Workspace.objects.get(slug=slug)
            workspace_members = (
                WorkspaceMember.objects.filter(
                    workspace__slug=slug, is_active=True, member__is_bot=False
                )
                .annotate(
                    user_email=F("member__email"),
                    user_id=F("member__id"),
                    user_role=F("role"),
                )
                .values("user_email", "user_id", "user_role")
            )

            for member in workspace_members:
                member["user_id"] = str(member["user_id"])

            try:
                # Request to payment server to resync the workspace licenses and feature flags
                response = requests.post(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/workspaces/{str(workspace.id)}/sync/",
                    headers={
                        "content-type": "application/json",
                        "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                    },
                    json={
                        "workspace_slug": str(workspace.slug),
                        "workspace_id": str(workspace.id),
                        "members_list": list(workspace_members),
                    },
                )

                # Check if the request was successful
                response.raise_for_status()

                # Resync the workspace license
                resync_workspace_license(workspace_slug=slug, force=True)

                # Return the response
                return Response(status=status.HTTP_204_NO_CONTENT)
            except requests.exceptions.RequestException as e:
                if hasattr(e, "response") and e.response.status_code == 400:
                    return Response(
                        e.response.json(), status=status.HTTP_400_BAD_REQUEST
                    )
                return Response(
                    {"error": "error in syncing workspace license"},
                    status=status.HTTP_400_BAD_REQUEST,
                )


class WorkspaceLicenseSyncEndpoint(BaseAPIView):
    """This endpoint is used to sync the workspace license from the payment server: - This is used by the payment server"""

    permission_classes = [AllowAny]

    def post(self, request):
        # Check if the request is authorized
        if request.headers.get("x-api-key") != settings.PAYMENT_SERVER_AUTH_TOKEN:
            return Response(
                {"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED
            )

        # Get the workspace ID from the request
        workspace_id = request.data.get("workspace_id")

        # Return an error if the workspace ID is not present
        if not workspace_id:
            return Response(
                {"error": "Workspace ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the workspace license is present
        workspace_license = WorkspaceLicense.objects.filter(
            workspace_id=workspace_id
        ).first()

        # If the workspace license is present, then fetch the license from the payment server and update it
        if workspace_license:
            workspace_license.is_cancelled = request.data.get("is_cancelled", False)
            workspace_license.purchased_seats = request.data.get("purchased_seats", 0)
            workspace_license.free_seats = request.data.get("free_seats", 12)
            workspace_license.current_period_end_date = request.data.get(
                "current_period_end_date"
            )
            workspace_license.recurring_interval = request.data.get("interval")
            workspace_license.plan = request.data.get("plan")
            workspace_license.last_synced_at = timezone.now()
            workspace_license.trial_end_date = request.data.get("trial_end_date")
            workspace_license.has_activated_free_trial = request.data.get(
                "has_activated_free_trial", False
            )
            workspace_license.has_added_payment_method = request.data.get(
                "has_added_payment_method", False
            )
            workspace_license.subscription = request.data.get("subscription")
            workspace_license.current_period_start_date = request.data.get(
                "current_period_start_date"
            )
            workspace_license.save()
        # If the workspace license is not present, then fetch the license from the payment server and create it
        else:
            # Create the workspace license
            workspace_license = WorkspaceLicense.objects.create(
                workspace_id=workspace_id,
                is_cancelled=request.data.get("is_cancelled", False),
                purchased_seats=request.data.get("purchased_seats", 0),
                free_seats=request.data.get("free_seats", 12),
                current_period_end_date=request.data.get("current_period_end_date"),
                recurring_interval=request.data.get("interval"),
                plan=request.data.get("plan"),
                last_synced_at=timezone.now(),
                trial_end_date=request.data.get("trial_end_date"),
                has_activated_free_trial=request.data.get(
                    "has_activated_free_trial", False
                ),
                has_added_payment_method=request.data.get(
                    "has_added_payment_method", False
                ),
                subscription=request.data.get("subscription"),
                current_period_start_date=request.data.get("current_period_start_date"),
            )

        # Return the response
        return Response(status=status.HTTP_204_NO_CONTENT)
