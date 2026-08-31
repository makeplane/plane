# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third-party imports
from rest_framework import status
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import (
    ProjectCustomFieldOptionSerializer,
    ProjectCustomFieldSerializer,
    ProjectCustomFieldValueSerializer,
)
from plane.db.models import ProjectCustomField, ProjectCustomFieldOption, ProjectCustomFieldValue, ProjectMember
from .base import BaseViewSet


class ProjectCustomFieldAccessPermission(BasePermission):
    """Custom field names and values can hold financial data (contract value, budget,
    payment collected). Unlike ProjectMemberPermission/ProjectBasePermission, GUEST-role
    members must not read this data, so every method (including GET) requires
    ADMIN/MEMBER project membership rather than just active membership."""

    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False
        return ProjectMember.objects.filter(
            workspace__slug=view.workspace_slug,
            member=request.user,
            project_id=view.project_id,
            role__in=[ROLE.ADMIN.value, ROLE.MEMBER.value],
            is_active=True,
        ).exists()


class ProjectCustomFieldViewSet(BaseViewSet):
    serializer_class = ProjectCustomFieldSerializer
    model = ProjectCustomField
    permission_classes = [ProjectCustomFieldAccessPermission]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project", "workspace")
            .distinct()
            .order_by("sort_order")
        )

    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id):
        serializer = ProjectCustomFieldSerializer(data=request.data, context={"project_id": project_id})
        if serializer.is_valid():
            serializer.save(project_id=project_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN])
    def partial_update(self, request, *args, **kwargs):
        custom_field = self.get_object()
        serializer = ProjectCustomFieldSerializer(
            custom_field, data=request.data, partial=True, context={"project_id": self.kwargs.get("project_id")}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class ProjectCustomFieldOptionViewSet(BaseViewSet):
    serializer_class = ProjectCustomFieldOptionSerializer
    model = ProjectCustomFieldOption
    permission_classes = [ProjectCustomFieldAccessPermission]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(custom_field_id=self.kwargs.get("custom_field_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project", "workspace", "custom_field")
            .distinct()
            .order_by("sort_order")
        )

    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id, custom_field_id):
        custom_field = ProjectCustomField.objects.filter(
            pk=custom_field_id, project_id=project_id, workspace__slug=slug
        ).first()
        if custom_field is None:
            return Response(
                {"error": "Custom field not found in this project"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = ProjectCustomFieldOptionSerializer(
            data=request.data, context={"custom_field_id": custom_field_id}
        )
        if serializer.is_valid():
            serializer.save(project_id=project_id, custom_field=custom_field)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN])
    def partial_update(self, request, *args, **kwargs):
        option = self.get_object()
        serializer = ProjectCustomFieldOptionSerializer(
            option, data=request.data, partial=True, context={"custom_field_id": self.kwargs.get("custom_field_id")}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class ProjectCustomFieldValueViewSet(BaseViewSet):
    serializer_class = ProjectCustomFieldValueSerializer
    model = ProjectCustomFieldValue
    permission_classes = [ProjectCustomFieldAccessPermission]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project", "workspace", "custom_field")
            .distinct()
        )

    def partial_update(self, request, slug, project_id, custom_field_id):
        # Not routed through get_queryset()/get_object(): this action needs
        # upsert semantics (create the value row on first write), which DRF's
        # get_object() doesn't support. The filter below still mirrors
        # get_queryset()'s workspace/project scoping for consistency.
        custom_field = ProjectCustomField.objects.filter(
            pk=custom_field_id, project_id=project_id, workspace__slug=slug
        ).first()
        if custom_field is None:
            return Response(
                {"error": "Custom field not found in this project"}, status=status.HTTP_404_NOT_FOUND
            )
        value, _ = ProjectCustomFieldValue.objects.get_or_create(project_id=project_id, custom_field=custom_field)
        serializer = ProjectCustomFieldValueSerializer(
            value, data=request.data, partial=True, context={"project_id": project_id}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
