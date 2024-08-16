# Python imports
import requests

# Django imports
from django.conf import settings
from django.db.models import CharField
from django.db.models.functions import Cast
from django.utils import timezone
from django.db.models import F

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

# Module imports
from .base import BaseAPIView
from plane.app.permissions.workspace import (
    WorkspaceUserPermission,
)
from plane.db.models import WorkspaceMember, Workspace
from plane.ee.models import WorkspaceLicense
from plane.utils.exception_logger import log_exception
from plane.payment.utils.workspace_license_request import (
    fetch_workspace_license,
)


class ProductEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceUserPermission,
    ]

    """
    Get the product details for the workspace based on the number of paid users and free users
    """

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


class WebsiteUserWorkspaceEndpoint(BaseAPIView):
    """
    Get the workspaces where the user is admin
    """

    def get(self, request):
        try:
            # Get all the workspaces where the user is admin
            workspace_ids = WorkspaceMember.objects.filter(
                member=request.user,
                is_active=True,
                role=20,
            ).values_list("workspace_id", flat=True)

            # Fetch the workspaces from the workspace license
            workspace_licenses = (
                WorkspaceLicense.objects.filter(workspace_id__in=workspace_ids)
                .annotate(slug=F("workspace__slug"))
                .annotate(name=F("workspace__name"))
                .annotate(logo=F("workspace__logo"))
                .annotate(product=F("plan"))
                .values(
                    "workspace_id",
                    "slug",
                    "name",
                    "logo",
                    "product",
                    "trial_end_date",
                    "has_activated_free_trial",
                    "has_added_payment_method",
                    "current_period_end_date",
                    "is_offline_payment",
                )
            )

            # Get the workspace details
            return Response(workspace_licenses, status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as e:
            if e.response.status_code == 400:
                return Response(
                    e.response.json(), status=status.HTTP_400_BAD_REQUEST
                )
            log_exception(e)
            return Response(
                {"error": "error in fetching workspace products"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class WorkspaceProductEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceUserPermission,
    ]

    """
    Get the product details for the workspace
    """

    def get(self, request, slug):
        try:
            if settings.PAYMENT_SERVER_BASE_URL:
                workspace = Workspace.objects.get(slug=slug)

                # Check if the license is present for the workspace
                workspace_license = WorkspaceLicense.objects.filter(
                    workspace=workspace
                ).first()

                # If the license is present, then check if the last sync is more than 1 hour
                if workspace_license:
                    # If the last sync is more than 1 hour, then sync the license
                    if (
                        workspace_license.last_synced_at - timezone.now()
                    ).seconds > 3600:
                        response = fetch_workspace_license(
                            workspace_id=str(workspace.id),
                            workspace_slug=slug,
                            free_seats=WorkspaceMember.objects.filter(
                                is_active=True,
                                workspace__slug=slug,
                                member__is_bot=False,
                            ).count(),
                        )

                        # Update the last synced time
                        workspace_license.last_synced_at = timezone.now()
                        workspace_license.is_cancelled = response.get(
                            "is_cancelled", False
                        )
                        workspace_license.free_seats = response.get(
                            "free_seats", 12
                        )
                        workspace_license.purchased_seats = response.get(
                            "purchased_seats", 0
                        )
                        workspace_license.current_period_end_date = (
                            response.get("current_period_end_date")
                        )
                        workspace_license.recurring_interval = response.get(
                            "interval"
                        )
                        workspace_license.plan = response.get("plan")
                        workspace_license.is_offline_payment = response.get(
                            "is_offline_payment", False
                        )
                        workspace_license.trial_end_date = response.get(
                            "trial_end_date"
                        )
                        workspace_license.has_activated_free_trial = (
                            response.get("has_activated_free_trial", False)
                        )
                        workspace_license.has_added_payment_method = (
                            response.get("has_added_payment_method", False)
                        )
                        workspace_license.save()

                        return Response(
                            {
                                "is_cancelled": workspace_license.is_cancelled,
                                "purchased_seats": workspace_license.purchased_seats,
                                "current_period_end_date": workspace_license.current_period_end_date,
                                "interval": workspace_license.recurring_interval,
                                "product": workspace_license.plan,
                                "is_offline_payment": workspace_license.is_offline_payment,
                                "trial_end_date": workspace_license.trial_end_date,
                                "has_activated_free_trial": workspace_license.has_activated_free_trial,
                                "has_added_payment_method": workspace_license.has_added_payment_method,
                            },
                            status=status.HTTP_200_OK,
                        )
                    else:
                        return Response(
                            {
                                "is_cancelled": workspace_license.is_cancelled,
                                "purchased_seats": workspace_license.purchased_seats,
                                "current_period_end_date": workspace_license.current_period_end_date,
                                "interval": workspace_license.recurring_interval,
                                "product": workspace_license.plan,
                                "is_offline_payment": workspace_license.is_offline_payment,
                                "trial_end_date": workspace_license.trial_end_date,
                                "has_activated_free_trial": workspace_license.has_activated_free_trial,
                                "has_added_payment_method": workspace_license.has_added_payment_method,
                            },
                            status=status.HTTP_200_OK,
                        )
                # If the license is not present, then fetch the license from the payment server and create it
                else:
                    # Fetch the workspace license
                    response = fetch_workspace_license(
                        workspace_id=str(workspace.id),
                        workspace_slug=slug,
                        free_seats=WorkspaceMember.objects.filter(
                            is_active=True,
                            workspace__slug=slug,
                            member__is_bot=False,
                        ).count(),
                    )
                    # Create the workspace license
                    workspace_license = WorkspaceLicense.objects.create(
                        workspace=workspace,
                        is_cancelled=response.get("is_cancelled", False),
                        purchased_seats=response.get("purchased_seats", 0),
                        free_seats=response.get("free_seats", 12),
                        current_period_end_date=response.get(
                            "current_period_end_date"
                        ),
                        recurring_interval=response.get("interval"),
                        plan=response.get("plan"),
                        last_synced_at=timezone.now(),
                        trial_end_date=response.get("trial_end_date"),
                        has_activated_free_trial=response.get(
                            "has_activated_free_trial", False
                        ),
                        has_added_payment_method=response.get(
                            "has_added_payment_method", False
                        ),
                    )
                    # Return the workspace license
                    return Response(
                        {
                            "is_cancelled": workspace_license.is_cancelled,
                            "purchased_seats": workspace_license.purchased_seats,
                            "current_period_end_date": workspace_license.current_period_end_date,
                            "interval": workspace_license.recurring_interval,
                            "product": workspace_license.plan,
                            "is_offline_payment": workspace_license.is_offline_payment,
                            "trial_end_date": workspace_license.trial_end_date,
                            "has_activated_free_trial": workspace_license.has_activated_free_trial,
                            "has_added_payment_method": workspace_license.has_added_payment_method,
                        },
                        status=status.HTTP_200_OK,
                    )
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


class WorkspaceLicenseRefreshEndpoint(BaseAPIView):
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)

        # Check if the license is present for the workspace
        workspace_license = WorkspaceLicense.objects.filter(
            workspace=workspace
        ).first()

        # If the license is present, then fetch the license from the payment server and update it
        if workspace_license:
            # Update the values in the workspace license
            response = fetch_workspace_license(
                workspace_id=str(workspace.id),
                workspace_slug=slug,
                free_seats=WorkspaceMember.objects.filter(
                    is_active=True,
                    workspace__slug=slug,
                    member__is_bot=False,
                ).count(),
            )
            workspace_license.is_cancelled = response.get(
                "is_cancelled", False
            )
            workspace_license.free_seats = response.get("free_seats", 12)
            workspace_license.purchased_seats = response.get(
                "purchased_seats", 0
            )
            workspace_license.current_period_end_date = response.get(
                "current_period_end_date"
            )
            workspace_license.recurring_interval = response.get("interval")
            workspace_license.plan = response.get("plan")
            workspace_license.trial_end_date = response.get("trial_end_date")
            workspace_license.has_activated_free_trial = response.get(
                "has_activated_free_trial", False
            )
            workspace_license.has_added_payment_method = response.get(
                "has_added_payment_method", False
            )
            workspace_license.last_synced_at = timezone.now()
            workspace_license.save()
        # If the license is not present, then fetch the license from the payment server and create it
        else:
            # Fetch the workspace license
            response = fetch_workspace_license(
                workspace_id=str(workspace.id),
                workspace_slug=slug,
                free_seats=WorkspaceMember.objects.filter(
                    is_active=True,
                    workspace__slug=slug,
                    member__is_bot=False,
                ).count(),
            )
            # Create the workspace license
            workspace_license = WorkspaceLicense.objects.create(
                workspace=workspace,
                is_cancelled=response.get("is_cancelled", False),
                purchased_seats=response.get("purchased_seats", 0),
                free_seats=response.get("free_seats", 12),
                current_period_end_date=response.get(
                    "current_period_end_date"
                ),
                recurring_interval=response.get("interval"),
                plan=response.get("plan"),
                last_synced_at=timezone.now(),
                trial_end_date=response.get("trial_end_date"),
                has_activated_free_trial=response.get(
                    "has_activated_free_trial", False
                ),
                has_added_payment_method=response.get(
                    "has_added_payment_method", False
                ),
            )

        # Return the response
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceLicenseSyncEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        # Check if the request is authorized
        if (
            request.headers.get("x-api-key")
            != settings.PAYMENT_SERVER_AUTH_TOKEN
        ):
            return Response(
                {"error": "Unauthorized"},
                status=status.HTTP_401_UNAUTHORIZED,
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
            workspace_license.is_cancelled = request.data.get(
                "is_cancelled", False
            )
            workspace_license.purchased_seats = request.data.get(
                "purchased_seats", 0
            )
            workspace_license.free_seats = request.data.get("free_seats", 12)
            workspace_license.current_period_end_date = request.data.get(
                "current_period_end_date"
            )
            workspace_license.recurring_interval = request.data.get("interval")
            workspace_license.plan = request.data.get("plan")
            workspace_license.last_synced_at = timezone.now()
            workspace_license.trial_end_date = request.data.get(
                "trial_end_date"
            )
            workspace_license.has_activated_free_trial = request.data.get(
                "has_activated_free_trial", False
            )
            workspace_license.has_added_payment_method = request.data.get(
                "has_added_payment_method", False
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
                current_period_end_date=request.data.get(
                    "current_period_end_date"
                ),
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
            )

        # Return the response
        return Response(status=status.HTTP_204_NO_CONTENT)
