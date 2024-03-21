# Python imports
import json

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponseRedirect
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ProjectEntityPermission
from plane.app.serializers import FileAssetSerializer
from plane.app.views.base import BaseAPIView
from plane.bgtasks.issue_activites_task import issue_activity
from plane.db.models import FileAsset, Workspace
from plane.utils.presigned_url_generator import generate_download_presigned_url


class IssueAttachmentEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]
    parser_classes = (
        MultiPartParser,
        FormParser,
        JSONParser,
    )

    def post(self, request, slug, project_id, issue_id):
        serializer = FileAssetSerializer(data=request.data)
        workspace = Workspace.objects.get(slug=slug)
        if serializer.is_valid():
            serializer.save(
                workspace=workspace,
                project_id=project_id,
                entity_identifier=issue_id,
            )
            issue_activity.delay(
                type="attachment.activity.created",
                requested_data=None,
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("issue_id", None)),
                project_id=str(self.kwargs.get("project_id", None)),
                current_instance=json.dumps(
                    serializer.data,
                    cls=DjangoJSONEncoder,
                ),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(
        self, request, slug, project_id, issue_id, workspace_id, asset_key
    ):
        key = f"{workspace_id}/{asset_key}"
        asset = FileAsset.objects.get(
            asset=key,
            entity_identifier=issue_id,
            entity_type="issue_attachment",
            workspace__slug=slug,
            project_id=project_id,
        )
        asset.is_deleted = True
        asset.save()
        issue_activity.delay(
            type="attachment.activity.deleted",
            requested_data=None,
            actor_id=str(self.request.user.id),
            issue_id=str(self.kwargs.get("issue_id", None)),
            project_id=str(self.kwargs.get("project_id", None)),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get(
        self,
        request,
        slug,
        project_id,
        issue_id,
        workspace_id=None,
        asset_key=None,
    ):
        if workspace_id and asset_key:
            key = f"{workspace_id}/{asset_key}"
            url = generate_download_presigned_url(
                key=key,
                host=request.get_host(),
                scheme=request.scheme,
            )
            return HttpResponseRedirect(url)

        # For listing
        issue_attachments = FileAsset.objects.filter(
            entity_type="issue_attachment",
            entity_identifier=issue_id,
            workspace__slug=slug,
            project_id=project_id,
        )
        serializer = FileAssetSerializer(issue_attachments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
