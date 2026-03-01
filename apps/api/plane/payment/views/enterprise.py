# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import requests
import uuid
import logging
import json

# Django imports
from django.conf import settings
from django.db.models import F, Value
from django.core.files.base import ContentFile

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

# Module imports
from plane.license.api.views.base import BaseAPIView
from plane.utils.exception_logger import log_exception
from plane.license.api.permissions import InstanceAdminPermission
from plane.db.models import WorkspaceMember, User
from plane.ee.models import WorkspaceLicense
from plane.settings.storage import S3Storage


logger = logging.getLogger("plane.payments")


class EnterpriseLicenseActivateEndpoint(BaseAPIView):
    """
    Enterprise License Activate Endpoint

    This endpoint is used to activate the enterprise license for the instance.
    The license key is sent in the request body.
    The request is sent to the payment server to activate the license.
    The response is returned to the client.
    """

    permission_classes = [InstanceAdminPermission]

    def post(self, request):
        try:
            if not settings.IS_SELF_MANAGED:
                return Response(
                    {"error": "Forbidden"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            license_key = request.data.get("license_key", False)
            if not license_key:
                return Response(
                    {"error": "license_key is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            users = (
                User.objects.filter(is_active=True, is_bot=False)
                .annotate(
                    user_email=F("email"),
                    user_id=F("id"),
                    user_role=Value(20),
                )
                .values("user_email", "user_id", "user_role")
            )

            # Convert user_id to string
            for user in users:
                user["user_id"] = str(user["user_id"])

            if settings.PAYMENT_SERVER_BASE_URL:
                # Send request to payment server to activate the license
                response = requests.post(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/licenses/enterprise/activate/",
                    headers={
                        "content-type": "application/json",
                        "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                    },
                    json={
                        "license_key": license_key,
                        "members_list": list(users),
                    },
                )
                response.raise_for_status()

                # If the request was successful, return the response
                # Let's delete all the workspace licenses
                # This will recreate the workspace licenses when the current plan is requested
                WorkspaceLicense.all_objects.all().delete()

                return Response(response.json(), status=response.status_code)
            return Response(
                {"error": "Payment server is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except requests.exceptions.RequestException as e:
            if hasattr(e, "response") and e.response.status_code == 400:
                return Response(e.response.json(), status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": "Invalid license key"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class EnterpriseLicenseDeactivateEndpoint(BaseAPIView):
    """
    Enterprise License Deactivate Endpoint

    This endpoint is used to deactivate the enterprise license for the instance.
    The request is sent to the payment server to deactivate the license.
    The response is returned to the client.
    """

    permission_classes = [InstanceAdminPermission]

    def post(self, request):
        try:
            # Check if the environment is not self-managed
            if not settings.IS_SELF_MANAGED:
                return Response(
                    {"error": "Forbidden"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if settings.PAYMENT_SERVER_BASE_URL:
                try:
                    response = requests.post(
                        f"{settings.PAYMENT_SERVER_BASE_URL}/api/licenses/enterprise/deactivate/",
                        headers={
                            "content-type": "application/json",
                            "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                        },
                    )
                    # Check if the request was successful
                    response.raise_for_status()

                    # Force resync the workspace licenses
                    WorkspaceLicense.all_objects.all().delete()

                    # Return the response
                    return Response(response.json(), status=status.HTTP_200_OK)
                except requests.exceptions.RequestException as e:
                    if hasattr(e, "response") and e.response.status_code == 400 or e.response.status_code == 500:
                        return Response(e.response.json(), status=e.response.status_code)
                    return Response(
                        {"error": "Invalid license key"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                return Response(
                    {"error": "Payment server is not configured"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except requests.exceptions.RequestException as e:
            if (
                hasattr(e, "response")
                and hasattr(e.response, "status_code")
                and e.response.status_code == 400
                or e.response.status_code == 500
            ):
                return Response(e.response.json(), status=e.response.status_code)
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class InstanceLicenseSyncEndpoint(BaseAPIView):
    """
    This endpoint is used to sync the workspace license from the payment server:
    """

    permission_classes = [
        InstanceAdminPermission,
    ]

    def post(self, request):
        # Check if the request is authorized
        if settings.PAYMENT_SERVER_BASE_URL:
            # Get all active users (enterprise is instance-wide)
            users = (
                User.objects.filter(is_active=True, is_bot=False)
                .annotate(
                    user_email=F("email"),
                    user_id=F("id"),
                    user_role=Value(20),  # Default role for enterprise users
                )
                .values("user_email", "user_id", "user_role")
            )

            # Convert user_id to string
            for user in users:
                user["user_id"] = str(user["user_id"])

            try:
                response = requests.post(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/licenses/enterprise/sync/",
                    headers={
                        "content-type": "application/json",
                        "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                    },
                    json={
                        "members_list": list(users),
                    },
                )
                # raise an exception if the request is not successful
                response.raise_for_status()

                # if the request is successful, then let's clear all the workspace licenses
                WorkspaceLicense.all_objects.all().delete()

                return Response(response.json(), status=response.status_code)
            except requests.exceptions.RequestException as e:
                if hasattr(e, "response") and e.response.status_code == 400:
                    return Response(e.response.json(), status=status.HTTP_400_BAD_REQUEST)
                return Response({"error": "Invalid license key"}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                log_exception(e)
                return Response(
                    {"error": "Internal server error"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        else:
            return Response(
                {"error": "Payment server is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class EnterpriseModifySeatsEndpoint(BaseAPIView):
    """
    Enterprise Modify Seats Endpoint

    This endpoint is used to modify the seats for the enterprise license.
    The request is sent to the payment server to modify the seats.
    The response is returned to the client.
    """

    permission_classes = [InstanceAdminPermission]

    def post(self, request):
        try:
            # Check if the environment is not self-managed
            if not settings.IS_SELF_MANAGED:
                return Response(
                    {"error": "Forbidden"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get the quantity
            quantity = request.data.get(
                "quantity",
                WorkspaceMember.objects.filter(
                    is_active=True,
                    member__is_bot=False,
                ).count(),
            )

            # Get the total users
            user_count = User.objects.filter(
                is_active=True,
                is_bot=False,
            ).count()

            # Check if the quantity is less than the active paid users in the workspace
            if quantity < user_count:
                # Return an error response
                return Response(
                    {
                        "error": "The number of seats cannot be less than the number of active paid users in the workspace including the invites",  # noqa: E501
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if settings.PAYMENT_SERVER_BASE_URL:
                response = requests.post(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/licenses/enterprise/modify-seats/",
                    headers={
                        "content-type": "application/json",
                        "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                    },
                    json={
                        "quantity": quantity,
                    },
                )
                response.raise_for_status()

                response = response.json()
                purchased_seats = response["seats"]
                # Update the seat count for all the workspace licenses
                WorkspaceLicense.objects.all().update(purchased_seats=purchased_seats)

                return Response({"seats": purchased_seats}, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "Payment server is not configured"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except requests.exceptions.RequestException as e:
            if (
                hasattr(e, "response")
                and hasattr(e.response, "status_code")
                and e.response.status_code == 400
                or e.response.status_code == 500
            ):
                return Response(e.response.json(), status=e.response.status_code)
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class EnterpriseSubscriptionPortalEndpoint(BaseAPIView):
    """
    Enterprise Subscription Portal Endpoint

    This endpoint is used to get the enterprise subscription portal.
    The request is sent to the payment server to get the enterprise subscription portal.
    The response is returned to the client.
    """

    permission_classes = [InstanceAdminPermission]

    def post(self, request):
        try:
            if settings.PAYMENT_SERVER_BASE_URL:
                response = requests.post(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/licenses/enterprise/subscription-portal/",
                    headers={
                        "content-type": "application/json",
                        "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                    },
                )
                response.raise_for_status()
                return Response(response.json(), status=response.status_code)
            else:
                return Response(
                    {"error": "Payment server is not configured"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except requests.exceptions.RequestException as e:
            if (
                hasattr(e, "response")
                and hasattr(e.response, "status_code")
                and e.response.status_code == 400
                or e.response.status_code == 500
            ):
                return Response(e.response.json(), status=e.response.status_code)
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class EnterpriseSubscriptionProrationPreviewEndpoint(BaseAPIView):
    """
    Enterprise Subscription Proration Preview Endpoint

    This endpoint is used to get the enterprise subscription proration preview.
    The request is sent to the payment server to get the enterprise subscription proration preview.
    The response is returned to the client.
    """

    permission_classes = [InstanceAdminPermission]

    def post(self, request):
        try:
            # Get the quantity
            quantity = request.data.get("quantity")
            if not quantity:
                return Response(
                    {"error": "Quantity is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get the total users
            user_count = User.objects.filter(is_active=True, is_bot=False).count()

            # Fetch the workspace subscription
            if settings.PAYMENT_SERVER_BASE_URL:
                response = requests.post(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/licenses/enterprise/subscription-proration-preview/",
                    headers={
                        "content-type": "application/json",
                        "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                    },
                    json={
                        "quantity": (quantity + user_count),
                    },
                )

                # Check if the response is successful
                response.raise_for_status()

                # Return the response
                return Response(response.json(), status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "Payment server is not configured"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except requests.exceptions.RequestException as e:
            if hasattr(e, "response") and e.response.status_code == 400:
                return Response(e.response.json(), status=status.HTTP_400_BAD_REQUEST)
            log_exception(e)
            return Response(
                {"error": "Error in proration preview"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class EnterpriseLicenseActivateUploadEndpoint(BaseAPIView):
    """
    Enterprise License Activate Upload Endpoint | Airgapped Mode

    This endpoint is used to upload a license file to activate the enterprise license.
    The file is uploaded to S3 and then forwarded to the payment server.
    The payment server will then activate the license and return the response.
    The response is then returned to the client.
    """

    permission_classes = [
        InstanceAdminPermission,
    ]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        try:
            # Check if the environment is not self-managed
            if not settings.IS_SELF_MANAGED:
                return Response(
                    {"error": "Forbidden"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if not settings.IS_AIRGAPPED:
                return Response(
                    {"error": "Forbidden"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get the file from request
            file = request.FILES.get("license_file")
            if not file:
                return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

            # Read file content first before any operations
            file_content = file.read()

            # Generate a unique file name
            file_name = f"enterprise/license-{uuid.uuid4().hex}-{file.name}"

            # Upload the file to S3
            s3_file = ContentFile(file_content, name=file.name)
            s3_storage = S3Storage(request=request, is_server=True)
            is_uploaded = s3_storage.upload_file(s3_file, file_name, file.content_type)

            if not is_uploaded:
                logger.error("Failed to upload enterprise license file to storage")
                return Response(
                    {"error": "Failed to upload file to storage"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get all active workspace members
            users = (
                User.objects.filter(is_active=True, is_bot=False)
                .annotate(
                    user_email=F("email"),
                    user_id=F("id"),
                    user_role=Value(20),
                )
                .values("user_email", "user_id", "user_role")
            )

            # Convert user_id to string
            for user in users:
                user["user_id"] = str(user["user_id"])

            # Prepare form data
            form_data = {
                "members_list": json.dumps(list(users)),
            }

            new_file = ContentFile(file_content, name=file.name)

            # Prepare files
            files = {"activation_file": (file.name, new_file, file.content_type)}

            # Forward to payment server
            if settings.PAYMENT_SERVER_BASE_URL:
                try:
                    payment_response = requests.post(
                        f"{settings.PAYMENT_SERVER_BASE_URL}/api/licenses/enterprise/activate/upload/",
                        data=form_data,
                        files=files,
                        headers={
                            "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                        },
                    )
                    payment_response.raise_for_status()

                    # Delete all the workspace licenses
                    WorkspaceLicense.all_objects.all().delete()

                    # Return the response
                    return Response(payment_response.json(), status=status.HTTP_200_OK)
                except requests.exceptions.RequestException as e:
                    if hasattr(e, "response") and e.response.status_code == 400 or e.response.status_code == 500:
                        return Response(e.response.json(), status=e.response.status_code)
                    return Response(
                        {"error": "Failed to forward file to payment server"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                return Response(
                    {"error": "Payment server is not configured"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class InstanceLicenseEndpoint(BaseAPIView):
    """
    Instance License Endpoint

    This endpoint is used to get the instance license.
    The request is sent to the payment server to get the instance license.
    The response is returned to the client.
    """

    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        try:
            if settings.PAYMENT_SERVER_BASE_URL:
                response = requests.get(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/licenses/enterprise/current-plan/",
                    headers={
                        "content-type": "application/json",
                        "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                    },
                )
                response.raise_for_status()

                data = response.json()
                member_count = User.objects.filter(
                    is_active=True,
                    is_bot=False,
                ).count()
                data["billable_members"] = member_count
                data["occupied_seats"] = member_count
                return Response(response.json(), status=response.status_code)
            else:
                return Response(
                    {"error": "Payment server is not configured"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except requests.exceptions.RequestException as e:
            if hasattr(e, "response") and e.response.status_code == 400:
                return Response(e.response.json(), status=status.HTTP_400_BAD_REQUEST)
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class EnterpriseLicenseRemoveUnusedSeatsEndpoint(BaseAPIView):
    """
    Enterprise License Remove Unused Seats Endpoint

    This endpoint is used to remove the unused seats from the enterprise license.
    The request is sent to the payment server to remove the unused seats.
    The response is returned to the client.
    """

    permission_classes = [
        InstanceAdminPermission,
    ]

    def post(self, request):
        try:
            # Check if the environment is not self-managed
            if not settings.IS_SELF_MANAGED:
                return Response(
                    {"error": "Forbidden"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Get the total users
            user_count = User.objects.filter(
                is_active=True,
                is_bot=False,
            ).count()

            if settings.PAYMENT_SERVER_BASE_URL:
                response = requests.post(
                    f"{settings.PAYMENT_SERVER_BASE_URL}/api/licenses/enterprise/modify-seats/",
                    headers={
                        "content-type": "application/json",
                        "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                    },
                    json={
                        "quantity": user_count,
                    },
                )
                response.raise_for_status()

                response = response.json()
                purchased_seats = response["seats"]
                # Update the seat count for all the workspace licenses
                WorkspaceLicense.objects.all().update(purchased_seats=purchased_seats)

                return Response({"seats": purchased_seats}, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "Payment server is not configured"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except requests.exceptions.RequestException as e:
            if (
                hasattr(e, "response")
                and hasattr(e.response, "status_code")
                and e.response.status_code == 400
                or e.response.status_code == 500
            ):
                return Response(e.response.json(), status=e.response.status_code)
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
