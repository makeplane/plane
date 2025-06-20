# Python imports
import random

# Django imports
from django.db import IntegrityError

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseViewSet, BaseAPIView
from plane.app.serializers import LabelSerializer
from plane.app.permissions import allow_permission, ProjectBasePermission, ROLE
from plane.db.models import Project, Label
from plane.utils.cache import invalidate_cache


class LabelViewSet(BaseViewSet):
    serializer_class = LabelSerializer
    model = Label
    permission_classes = [ProjectBasePermission]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project")
            .select_related("workspace")
            .select_related("parent")
            .distinct()
            .order_by("sort_order")
        )

    @invalidate_cache(
        path="/api/workspaces/:slug/labels/", url_params=True, user=False, multiple=True
    )
    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id):
        try:
            serializer = LabelSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(project_id=project_id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response(
                {"error": "Label with the same name already exists in the project"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @invalidate_cache(path="/api/workspaces/:slug/labels/", url_params=True, user=False)
    @allow_permission([ROLE.ADMIN])
    def partial_update(self, request, *args, **kwargs):
        # Check if the label name is unique within the project
        if (
            "name" in request.data
            and Label.objects.filter(
                project_id=kwargs["project_id"], name=request.data["name"]
            )
            .exclude(pk=kwargs["pk"])
            .exists()
        ):
            return Response(
                {"error": "Label with the same name already exists in the project"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # call the parent method to perform the update
        return super().partial_update(request, *args, **kwargs)

    @invalidate_cache(path="/api/workspaces/:slug/labels/", url_params=True, user=False)
    @allow_permission([ROLE.ADMIN])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class BulkCreateIssueLabelsEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug, project_id):
        label_data = request.data.get("label_data", [])
        project = Project.objects.get(pk=project_id)

        labels = Label.objects.bulk_create(
            [
                Label(
                    name=label.get("name", "Migrated"),
                    description=label.get("description", "Migrated Issue"),
                    color=f"#{random.randint(0, 0xFFFFFF + 1):06X}",
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                    created_by=request.user,
                    updated_by=request.user,
                )
                for label in label_data
            ],
            batch_size=50,
            ignore_conflicts=True,
        )

        return Response(
            {"labels": LabelSerializer(labels, many=True).data},
            status=status.HTTP_201_CREATED,
        )
