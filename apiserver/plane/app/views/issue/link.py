# Python imports
import json

# Django imports
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseViewSet
from plane.app.serializers import IssueLinkSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import IssueLink
from plane.bgtasks.issue_activities_task import issue_activity


class IssueLinkViewSet(BaseViewSet):
    permission_classes = [
        ProjectEntityPermission,
    ]

    model = IssueLink
    serializer_class = IssueLinkSerializer

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .order_by("-created_at")
            .distinct()
        )

    def create(self, request, slug, project_id, issue_id):
        serializer = IssueLinkSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                project_id=project_id,
                issue_id=issue_id,
            )
            issue_activity.delay(
                type="link.activity.created",
                requested_data=json.dumps(
                    serializer.data, cls=DjangoJSONEncoder
                ),
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("issue_id")),
                project_id=str(self.kwargs.get("project_id")),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, slug, project_id, issue_id, pk):
        issue_link = IssueLink.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            pk=pk,
        )
        requested_data = json.dumps(request.data, cls=DjangoJSONEncoder)
        current_instance = json.dumps(
            IssueLinkSerializer(issue_link).data,
            cls=DjangoJSONEncoder,
        )
        serializer = IssueLinkSerializer(
            issue_link, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            issue_activity.delay(
                type="link.activity.updated",
                requested_data=requested_data,
                actor_id=str(request.user.id),
                issue_id=str(issue_id),
                project_id=str(project_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, slug, project_id, issue_id, pk):
        issue_link = IssueLink.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            pk=pk,
        )
        current_instance = json.dumps(
            IssueLinkSerializer(issue_link).data,
            cls=DjangoJSONEncoder,
        )
        issue_activity.delay(
            type="link.activity.deleted",
            requested_data=json.dumps({"link_id": str(pk)}),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        issue_link.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
