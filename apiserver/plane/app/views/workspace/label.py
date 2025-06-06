# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers import LabelSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import Label, Workspace
from plane.app.permissions import WorkspaceViewerPermission
from plane.utils.cache import cache_response
from plane.app.permissions import allow_permission, ROLE

# Django imports
from django.db import IntegrityError


class WorkspaceLabelsEndpoint(BaseAPIView):
    permission_classes = [WorkspaceViewerPermission]

    @cache_response(60 * 60 * 2)
    def get(self, request, slug):
        labels = Label.objects.filter(
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
        )
        serializer = LabelSerializer(labels, many=True).data
        return Response(serializer, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug):
        try:
            workspace = Workspace.objects.get(slug=slug)
            serializer = LabelSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(workspace_id=workspace.id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response(
                {"error": "Label with the same name already exists in the project"},
                status=status.HTTP_400_BAD_REQUEST,
            )
