# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import random
import json

# Django imports
from django.db import IntegrityError
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseViewSet, BaseAPIView
from plane.app.serializers import LabelSerializer
from plane.permissions import can, LabelPermissions
from plane.db.models import Project, Label
from plane.utils.cache import invalidate_cache
from plane.ee.bgtasks.project_activites_task import project_activity


class LabelViewSet(BaseViewSet):
    serializer_class = LabelSerializer
    model = Label

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .select_related("project")
            .select_related("workspace")
            .select_related("parent")
            .distinct()
            .accessible_to(self.request.user.id, self.kwargs["slug"])
            .order_by("sort_order")
        )

    @can(LabelPermissions.VIEW, resource_param="project_id")
    def list(self, request, slug, project_id):
        return super().list(request, slug, project_id)

    @can(LabelPermissions.VIEW, resource_param="pk")
    def retrieve(self, request, slug, project_id, pk=None):
        return super().retrieve(request, slug, project_id, pk=pk)

    @invalidate_cache(path="/api/workspaces/:slug/labels/", url_params=True, user=False, multiple=True)
    @can(LabelPermissions.CREATE, resource_param="project_id")
    def create(self, request, slug, project_id):
        try:
            serializer = LabelSerializer(data=request.data, context={"project_id": project_id})
            if serializer.is_valid():
                serializer.save(project_id=project_id)
                project_activity.delay(
                    type="project.activity.updated",
                    requested_data=json.dumps({"label": serializer.data.get("id")}, cls=DjangoJSONEncoder),
                    actor_id=str(request.user.id),
                    project_id=str(project_id),
                    current_instance=json.dumps({"label": None}, cls=DjangoJSONEncoder),
                    epoch=int(timezone.now().timestamp()),
                    notification=True,
                    origin=request.META.get("HTTP_ORIGIN"),
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response(
                {"error": "Label with the same name already exists in the project"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @invalidate_cache(path="/api/workspaces/:slug/labels/", url_params=True, user=False)
    @can(LabelPermissions.EDIT, resource_param="pk")
    def partial_update(self, request, *args, **kwargs):
        # Check if the label name is unique within the project
        if (
            "name" in request.data
            and Label.objects.filter(project_id=kwargs["project_id"], name=request.data["name"])
            .exclude(pk=kwargs["pk"])
            .exists()
        ):
            return Response(
                {"error": "Label with the same name already exists in the project"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = LabelSerializer(
            instance=self.get_object(),
            data=request.data,
            context={"project_id": kwargs["project_id"]},
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @invalidate_cache(path="/api/workspaces/:slug/labels/", url_params=True, user=False)
    @can(LabelPermissions.DELETE, resource_param="pk")
    def destroy(self, request, slug, project_id, pk):
        label = Label.objects.get(pk=pk, project_id=project_id, workspace__slug=slug)
        project_activity.delay(
            type="project.activity.updated",
            requested_data=json.dumps({"label": None}, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            project_id=str(project_id),
            current_instance=json.dumps({"label": pk, "label_name": label.name}, cls=DjangoJSONEncoder),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        label.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class BulkCreateIssueLabelsEndpoint(BaseAPIView):
    @can(LabelPermissions.CREATE, resource_param="project_id")
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
