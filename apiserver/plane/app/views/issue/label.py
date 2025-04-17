# Python imports
import random

# Django imports
from django.db import IntegrityError

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseAPIView
from plane.app.serializers import LabelSerializer
from plane.app.permissions import allow_permission, WorkSpaceBasePermission, ROLE
from plane.db.models import Project, Label, Workspace
from plane.utils.cache import invalidate_cache


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
