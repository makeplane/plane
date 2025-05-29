# Django imports
from django.db import IntegrityError
from django.shortcuts import get_object_or_404

# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers import LabelSerializer
from plane.app.views.base import BaseAPIView, BaseViewSet
from plane.db.models import Label
from plane.utils.cache import cache_response, invalidate_cache
from plane.app.permissions.workspace import WorkSpaceBasePermission, WorkspaceViewerPermission
from plane.app.permissions.base import allow_permission, ROLE
from plane.db.models.workspace import Workspace


class WorkspaceLabelsEndpoint(BaseAPIView):
    permission_classes = [WorkspaceViewerPermission]

    @cache_response(60 * 60 * 2)
    def get(self, request, slug):
        labels = Label.objects.filter(
            workspace__slug=slug,
        )
        serializer = LabelSerializer(labels, many=True).data
        return Response(serializer, status=status.HTTP_200_OK)


class WorkspaceLabelViewSet(BaseViewSet):
    serializer_class = LabelSerializer
    model = Label
    permission_classes = [WorkSpaceBasePermission]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"), project=None)
            .select_related("workspace")
            .select_related("parent")
            .distinct()
            .order_by("sort_order")
        )

    @invalidate_cache(
        path="/api/workspaces/:slug/labels/", url_params=True, user=False, multiple=True
    )
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        ws = get_object_or_404(Workspace, slug=slug)
        try:
            serializer = LabelSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(workspace=ws)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response(
                {"error": "Label with the same name already exists in the project"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @invalidate_cache(path="/api/workspaces/:slug/labels/", url_params=True, user=False)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def partial_update(self, request, *args, **kwargs):
        # Check if the label name is unique within the project
        if (
            "name" in request.data
            and Label.objects.filter(
                workspace__slug=kwargs['slug'],
                name=request.data["name"],
                project__isnull=True,
            )
            .exclude(pk=kwargs["pk"])
            .exists()
        ):
            return Response(
                {"error": "Label with the same name already exists in the workspace"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # call the parent method to perform the update
        return super().partial_update(request, *args, **kwargs)

    @invalidate_cache(path="/api/workspaces/:slug/labels/", url_params=True, user=False)
    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)