# Python imports
import json
import uuid

# Django imports
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder
from django.conf import settings
from django.http import HttpResponseRedirect

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.serializers import EpicAttachmentSerializer
from plane.db.models import FileAsset, Workspace
from plane.bgtasks.issue_activities_task import issue_activity
from plane.app.permissions import allow_permission, ROLE
from plane.settings.storage import S3Storage
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata
from plane.payment.flags.flag_decorator import (
    check_workspace_feature_flag,
    check_feature_flag,
)
from plane.payment.flags.flag import FeatureFlag


class EpicAttachmentEndpoint(BaseAPIView):
    serializer_class = EpicAttachmentSerializer
    model = FileAsset

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    @check_feature_flag(FeatureFlag.EPICS)
    def post(self, request, slug, project_id, epic_id):
        name = request.data.get("name")
        type = request.data.get("type", False)
        size = request.data.get("size")

        # Check if the request is valid
        if not name or not size:
            return Response(
                {"error": "Invalid request.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the file size is greater than the limit
        if check_workspace_feature_flag(
            feature_key=FeatureFlag.FILE_SIZE_LIMIT_PRO,
            slug=slug,
            user_id=str(request.user.id),
        ):
            size_limit = min(size, settings.PRO_FILE_SIZE_LIMIT)
        else:
            size_limit = min(size, settings.FILE_SIZE_LIMIT)

        if not type or type not in settings.ATTACHMENT_MIME_TYPES:
            return Response(
                {"error": "Invalid file type.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)

        # asset key
        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={"name": name, "type": type, "size": size_limit},
            asset=asset_key,
            size=size_limit,
            workspace_id=workspace.id,
            created_by=request.user,
            issue_id=epic_id,
            project_id=project_id,
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
        )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key, file_type=type, file_size=size_limit
        )
        # Return the presigned URL
        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "attachment": EpicAttachmentSerializer(asset).data,
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN], creator=True, model=FileAsset)
    @check_feature_flag(FeatureFlag.EPICS)
    def delete(self, request, slug, project_id, epic_id, pk):
        epic_attachment = FileAsset.objects.get(
            pk=pk, workspace__slug=slug, project_id=project_id
        )
        epic_attachment.is_deleted = True
        epic_attachment.deleted_at = timezone.now()
        epic_attachment.save()

        issue_activity.delay(
            type="attachment.activity.deleted",
            requested_data=None,
            actor_id=str(self.request.user.id),
            issue_id=str(epic_id),
            project_id=str(project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    @check_feature_flag(FeatureFlag.EPICS)
    def get(self, request, slug, project_id, epic_id, pk=None):
        if pk:
            # Get the asset
            asset = FileAsset.objects.get(
                id=pk, workspace__slug=slug, project_id=project_id
            )

            # Check if the asset is uploaded
            if not asset.is_uploaded:
                return Response(
                    {"error": "The asset is not uploaded.", "status": False},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            storage = S3Storage(request=request)
            presigned_url = storage.generate_presigned_url(
                object_name=asset.asset.name,
                disposition="attachment",
                filename=asset.attributes.get("name"),
            )
            return HttpResponseRedirect(presigned_url)

        # Get all the attachments
        epic_attachments = FileAsset.objects.filter(
            issue_id=epic_id,
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            workspace__slug=slug,
            project_id=project_id,
            is_uploaded=True,
        )
        # Serialize the attachments
        serializer = EpicAttachmentSerializer(epic_attachments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    @check_feature_flag(FeatureFlag.EPICS)
    def patch(self, request, slug, project_id, epic_id, pk):
        epic_attachment = FileAsset.objects.get(
            pk=pk, workspace__slug=slug, project_id=project_id
        )
        serializer = EpicAttachmentSerializer(epic_attachment)

        # Send this activity only if the attachment is not uploaded before
        if not epic_attachment.is_uploaded:
            issue_activity.delay(
                type="attachment.activity.created",
                requested_data=None,
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("epic_id", None)),
                project_id=str(self.kwargs.get("project_id", None)),
                current_instance=json.dumps(serializer.data, cls=DjangoJSONEncoder),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )

            # Update the attachment
            epic_attachment.is_uploaded = True
            epic_attachment.created_by = request.user

        # Get the storage metadata
        if not epic_attachment.storage_metadata:
            get_asset_object_metadata.delay(str(epic_attachment.id))
        epic_attachment.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
