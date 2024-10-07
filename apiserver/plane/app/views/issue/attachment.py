# Python imports
import json

# Django imports
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

# Module imports
from .. import BaseAPIView
from plane.app.serializers import IssueAttachmentSerializer
from plane.db.models import IssueAttachment
from plane.bgtasks.issue_activities_task import issue_activity
from plane.app.permissions import allow_permission, ROLE


class IssueAttachmentEndpoint(BaseAPIView):
    serializer_class = IssueAttachmentSerializer
    model = IssueAttachment
    parser_classes = (MultiPartParser, FormParser)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def post(self, request, slug, project_id, issue_id):
        serializer = IssueAttachmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id, issue_id=issue_id)
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

    @allow_permission([ROLE.ADMIN], creator=True, model=IssueAttachment)
    def delete(self, request, slug, project_id, issue_id, pk):
        issue_attachment = IssueAttachment.objects.get(pk=pk)
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
            origin=request.META.get("HTTP_ORIGIN"),
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission(
        [
            ROLE.ADMIN,
            ROLE.MEMBER,
            ROLE.GUEST,
        ]
    )
    def get(self, request, slug, project_id, issue_id):
        issue_attachments = IssueAttachment.objects.filter(
            issue_id=issue_id, workspace__slug=slug, project_id=project_id
        )
        serializer = IssueAttachmentSerializer(issue_attachments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
