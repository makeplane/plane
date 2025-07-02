# Python imports
import requests
import uuid
import logging
import json

# Django imports
from django.conf import settings
from django.db.models import F
from django.core.files.base import ContentFile
from django.http import HttpResponseRedirect

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny

# Module imports
from .base import BaseAPIView
from plane.app.permissions.workspace import WorkspaceOwnerPermission
from plane.db.models import Workspace, WorkspaceMember, FileAsset
from plane.payment.utils.workspace_license_request import resync_workspace_license
from plane.settings.storage import S3Storage

# Logger
logger = logging.getLogger("plane.api")


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

    def delete_license_files(self, slug):
        # Delete all the license files
        license_assets = FileAsset.objects.filter(
            workspace__slug=slug,
            entity_type=FileAsset.EntityTypeContext.LICENSE_FILE,
        )
        s3_storage = S3Storage(request=self.request, is_server=True)
        s3_storage.delete_files([asset.asset.name for asset in license_assets])
        license_assets.delete()
        return True

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

                # Delete the license file if in airgapped mode
                if settings.IS_AIRGAPPED:
                    # Delete all the license files
                    self.delete_license_files(slug)

                # Return the response
                return Response(response.json(), status=status.HTTP_200_OK)
            except requests.exceptions.RequestException as e:
                if (
                    hasattr(e, "response")
                    and e.response.status_code == 400
                    or e.response.status_code == 500
                ):
                    return Response(e.response.json(), status=e.response.status_code)
                return Response(
                    {"error": "Invalid license key"}, status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {"error": "Payment server is not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class LicenseActivateUploadEndpoint(BaseAPIView):
    """
    License Activate Upload Endpoint | Airgapped Mode

    This endpoint is used to upload a license file to the payment server.
    The file is uploaded to S3 and then forwarded to the payment server.
    The payment server will then activate the license and return the response.
    The response is then returned to the client.
    """

    permission_classes = [WorkspaceOwnerPermission]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, slug):
        # Check the multi-tenant environment
        if settings.IS_MULTI_TENANT:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        if not settings.IS_AIRGAPPED:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        # Get the file from request
        file = request.FILES.get("license_file")
        if not file:
            return Response(
                {"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Read file content first before any operations
        file_content = file.read()

        # Get workspace
        workspace = Workspace.objects.get(slug=slug)

        # Generate a unique file name
        file_name = f"{workspace.id}/license-{uuid.uuid4().hex}-{file.name}"

        # Create a FileAsset record
        asset = FileAsset.objects.create(
            attributes={
                "name": file.name,
                "type": file.content_type,
                "size": file.size,
            },
            asset=file_name,
            size=file.size,
            workspace=workspace,
            entity_type=FileAsset.EntityTypeContext.LICENSE_FILE,
        )

        s3_file = ContentFile(file_content, name=file.name)
        # Upload the file to S3
        s3_storage = S3Storage(request=request, is_server=True)
        is_uploaded = s3_storage.upload_file(s3_file, file_name, file.content_type)

        if not is_uploaded:
            logger.error(f"Failed to upload file to storage: {file_name}")
            return Response(
                {"error": "Failed to upload file to storage"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update the FileAsset record
        asset.is_uploaded = True
        asset.storage_metadata = {
            "file_name": file_name,
            "file_size": file.size,
            "file_type": file.content_type,
        }
        asset.save()

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

        # Prepare form data
        form_data = {
            "workspace_slug": workspace.slug,
            "workspace_id": str(workspace.id),
            "members_list": json.dumps(list(workspace_members)),
            "owner_email": workspace.owner.email,
        }

        new_file = ContentFile(file_content, name=file.name)

        # Prepare files
        files = {"activation_file": (file.name, new_file, file.content_type)}

        # Forward to payment server
        try:
            payment_response = requests.post(
                f"{settings.PAYMENT_SERVER_BASE_URL}/api/licenses/activate/upload/",
                data=form_data,
                files=files,
                headers={
                    "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
                },
            )
            payment_response.raise_for_status()

            # Force resync the workspace licenses
            resync_workspace_license(workspace_slug=slug, force=True)

            # Return the response
            return Response(payment_response.json(), status=status.HTTP_200_OK)
        except requests.exceptions.RequestException as e:
            if (
                hasattr(e, "response")
                and e.response.status_code == 400
                or e.response.status_code == 500
            ):
                return Response(e.response.json(), status=e.response.status_code)
            return Response(
                {"error": "Failed to forward file to payment server"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class LicenseFileFetchEndpoint(BaseAPIView):
    """
    License File Fetch Endpoint | Airgapped Mode

    This endpoint is used to fetch the license for a workspace from the storage
    The file url is returned to the client.
    """

    permission_classes = [
        AllowAny,
    ]

    def get(self, request, slug):
        # Check the multi-tenant environment
        if settings.IS_MULTI_TENANT:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        if not settings.IS_AIRGAPPED:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        logger.info(f"Fetching license file for workspace: {slug}")

        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)

        # Get the license file
        license_file = FileAsset.objects.filter(
            workspace=workspace, entity_type=FileAsset.EntityTypeContext.LICENSE_FILE
        ).first()

        if not license_file:
            logger.error(f"License file not found for workspace: {slug}")
            return Response(
                {"error": "License file not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Get the file from S3
        s3_storage = S3Storage(request=request, is_server=True)
        file_url = s3_storage.generate_presigned_url(
            object_name=license_file.asset.name,
            filename="license_key",
            disposition="attachment",
        )

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

        logger.info(f"License file fetched for workspace: {slug}")

        # Return the license file
        return Response(
            {
                "url": file_url,
                "members_list": workspace_members,
            },
            status=status.HTTP_200_OK,
        )
