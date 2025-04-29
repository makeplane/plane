# Python imports
import json
import uuid

# Django imports
from django.conf import settings
from django.utils import timezone
from django.http import HttpResponseRedirect
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.settings.storage import S3Storage
from plane.payment.flags.flag import FeatureFlag
from plane.db.models import FileAsset, Workspace
from plane.app.permissions import allow_permission, ROLE
from plane.ee.serializers import InitiativeAttachmentSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.bgtasks.initiative_activity_task import initiative_activity
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata
from plane.payment.flags.flag_decorator import check_workspace_feature_flag


class InitiativeAttachmentEndpoint(BaseAPIView):
    serializer_class = InitiativeAttachmentSerializer
    model = FileAsset

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(
        self,
        request,
        slug,
        initiative_id,
    ):
        name = request.data.get("name")
        type = request.data.get("type", False)
        size = request.data.get("size")

        # Check if the request is valid
        if not name or not size:
            return Response(
                {
                    "error": "Invalid request.",
                    "status": False,
                },
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
                {
                    "error": "Invalid file type.",
                    "status": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)

        # asset key
        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={
                "name": name,
                "type": type,
                "size": size_limit,
            },
            asset=asset_key,
            size=size_limit,
            workspace_id=workspace.id,
            created_by=request.user,
            entity_type=FileAsset.EntityTypeContext.INITIATIVE_ATTACHMENT,
            entity_identifier=initiative_id,
        )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key,
            file_type=type,
            file_size=size_limit,
        )
        # Return the presigned URL
        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "attachment": InitiativeAttachmentSerializer(asset).data,
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission(
        [ROLE.ADMIN], creator=True, model=FileAsset, level="WORKSPACE"
    )
    def delete(self, request, slug, initiative_id, pk):
        initiative_attachment = FileAsset.objects.get(
            pk=pk, workspace__slug=slug, entity_identifier=initiative_id
        )
        initiative_attachment.is_deleted = True
        initiative_attachment.deleted_at = timezone.now()
        initiative_attachment.save()

        initiative_activity.delay(
            type="attachment.activity.deleted",
            requested_data=None,
            actor_id=str(self.request.user.id),
            initiative_id=str(initiative_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            slug=slug,
            origin=request.META.get("HTTP_ORIGIN"),
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission(
        [
            ROLE.ADMIN,
            ROLE.MEMBER,
            ROLE.GUEST,
        ],
        level="WORKSPACE",
    )
    def get(self, request, slug, initiative_id, pk=None):
        if pk:
            # Get the asset
            asset = FileAsset.objects.get(
                id=pk, workspace__slug=slug, entity_identifier=initiative_id
            )

            # Check if the asset is uploaded
            if not asset.is_uploaded:
                return Response(
                    {
                        "error": "The asset is not uploaded.",
                        "status": False,
                    },
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
        initiative_attachments = FileAsset.objects.filter(
            entity_identifier=initiative_id,
            entity_type=FileAsset.EntityTypeContext.INITIATIVE_ATTACHMENT,
            workspace__slug=slug,
            is_uploaded=True,
        )
        # Serialize the attachments
        serializer = InitiativeAttachmentSerializer(
            initiative_attachments, many=True
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @allow_permission(
        [
            ROLE.ADMIN,
            ROLE.MEMBER,
            ROLE.GUEST,
        ],
        level="WORKSPACE",
    )
    def patch(self, request, slug, initiative_id, pk):
        initiative_attachment = FileAsset.objects.get(
            pk=pk, workspace__slug=slug, entity_identifier=initiative_id
        )
        serializer = InitiativeAttachmentSerializer(initiative_attachment)

        # Send this activity only if the attachment is not uploaded before
        if not initiative_attachment.is_uploaded:
            initiative_activity.delay(
                type="attachment.activity.created",
                slug=slug,
                requested_data=None,
                actor_id=str(self.request.user.id),
                initiative_id=str(self.kwargs.get("initiative_id", None)),
                current_instance=json.dumps(
                    serializer.data,
                    cls=DjangoJSONEncoder,
                ),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )

            # Update the attachment
            initiative_attachment.is_uploaded = True
            initiative_attachment.created_by = request.user

        # Get the storage metadata
        if not initiative_attachment.storage_metadata:
            get_asset_object_metadata.delay(str(initiative_attachment.id))
        initiative_attachment.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
