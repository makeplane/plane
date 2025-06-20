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
from rest_framework.parsers import MultiPartParser, FormParser

# Module imports
from .. import BaseAPIView
from plane.app.serializers import IssueAttachmentSerializer
from plane.db.models import FileAsset, Workspace
from plane.bgtasks.issue_activities_task import issue_activity
from plane.app.permissions import allow_permission, ROLE
from plane.settings.storage import S3Storage
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata
from plane.utils.host import base_host


class IssueAttachmentEndpoint(BaseAPIView):
    serializer_class = IssueAttachmentSerializer
    model = FileAsset
    parser_classes = (MultiPartParser, FormParser)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def post(self, request, slug, project_id, issue_id):
        serializer = IssueAttachmentSerializer(data=request.data)
        workspace = Workspace.objects.get(slug=slug)
        if serializer.is_valid():
            serializer.save(
                project_id=project_id,
                issue_id=issue_id,
                workspace_id=workspace.id,
                entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            )
            issue_activity.delay(
                type="attachment.activity.created",
                requested_data=None,
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("issue_id", None)),
                project_id=str(self.kwargs.get("project_id", None)),
                current_instance=json.dumps(serializer.data, cls=DjangoJSONEncoder),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN], creator=True, model=FileAsset)
    def delete(self, request, slug, project_id, issue_id, pk):
        issue_attachment = FileAsset.objects.get(pk=pk)
        issue_attachment.asset.delete(save=False)
        issue_attachment.delete()
        issue_activity.delay(
            type="attachment.activity.deleted",
            requested_data=None,
            actor_id=str(self.request.user.id),
            issue_id=str(self.kwargs.get("issue_id", None)),
            project_id=str(self.kwargs.get("project_id", None)),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=base_host(request=request, is_app=True),
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id):
        issue_attachments = FileAsset.objects.filter(
            issue_id=issue_id, workspace__slug=slug, project_id=project_id
        )
        serializer = IssueAttachmentSerializer(issue_attachments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class IssueAttachmentV2Endpoint(BaseAPIView):
    serializer_class = IssueAttachmentSerializer
    model = FileAsset

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def post(self, request, slug, project_id, issue_id):
        name = request.data.get("name")
        type = request.data.get("type", False)
        size = int(request.data.get("size", settings.FILE_SIZE_LIMIT))

        if not type or type not in settings.ATTACHMENT_MIME_TYPES:
            return Response(
                {"error": "Invalid file type.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)

        # asset key
        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        # Get the size limit
        size_limit = min(size, settings.FILE_SIZE_LIMIT)

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={"name": name, "type": type, "size": size_limit},
            asset=asset_key,
            size=size_limit,
            workspace_id=workspace.id,
            created_by=request.user,
            issue_id=issue_id,
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
                "attachment": IssueAttachmentSerializer(asset).data,
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN], creator=True, model=FileAsset)
    def delete(self, request, slug, project_id, issue_id, pk):
        issue_attachment = FileAsset.objects.get(
            pk=pk, workspace__slug=slug, project_id=project_id
        )
        issue_attachment.is_deleted = True
        issue_attachment.deleted_at = timezone.now()
        issue_attachment.save()

        issue_activity.delay(
            type="attachment.activity.deleted",
            requested_data=None,
            actor_id=str(self.request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=base_host(request=request, is_app=True),
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id, pk=None):
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
        issue_attachments = FileAsset.objects.filter(
            issue_id=issue_id,
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            workspace__slug=slug,
            project_id=project_id,
            is_uploaded=True,
        )
        # Serialize the attachments
        serializer = IssueAttachmentSerializer(issue_attachments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def patch(self, request, slug, project_id, issue_id, pk):
        issue_attachment = FileAsset.objects.get(
            pk=pk, workspace__slug=slug, project_id=project_id
        )
        serializer = IssueAttachmentSerializer(issue_attachment)

        # Send this activity only if the attachment is not uploaded before
        if not issue_attachment.is_uploaded:
            issue_activity.delay(
                type="attachment.activity.created",
                requested_data=None,
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("issue_id", None)),
                project_id=str(self.kwargs.get("project_id", None)),
                current_instance=json.dumps(serializer.data, cls=DjangoJSONEncoder),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )

            # Update the attachment
            issue_attachment.is_uploaded = True
            issue_attachment.created_by = request.user

        # Get the storage metadata
        if not issue_attachment.storage_metadata:
            get_asset_object_metadata.delay(str(issue_attachment.id))
        issue_attachment.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
