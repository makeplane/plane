# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .. import BaseViewSet, BaseAPIView
from plane.app.serializers import (
    IssueTypeSerializer,
    IssuePropertySerializer,
    IssuePropertyOptionSerializer,
    IssuePropertyValueSerializer,
)
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import (
    IssueType,
    ProjectIssueType,
    IssueProperty,
    IssuePropertyOption,
    IssuePropertyValue,
    Project,
    Issue,
)
from plane.utils.issue_property_validator import (
    validate_property_values,
    build_property_value,
)


class IssueTypeViewSet(BaseViewSet):
    serializer_class = IssueTypeSerializer
    model = IssueType

    def get_queryset(self):
        return (
            IssueType.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_issue_types__project_id=self.kwargs.get("project_id"))
            .filter(
                project_issue_types__project__project_projectmember__member=self.request.user,
                project_issue_types__project__project_projectmember__is_active=True,
            )
            .distinct()
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        return Response(
            IssueTypeSerializer(self.get_queryset(), many=True).data,
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def retrieve(self, request, slug, project_id, pk):
        issue_type = self.get_queryset().get(pk=pk)
        return Response(IssueTypeSerializer(issue_type).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        serializer = IssueTypeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        issue_type = serializer.save(workspace_id=project.workspace_id)
        ProjectIssueType.objects.create(
            project_id=project_id,
            issue_type=issue_type,
            level=request.data.get("level", 0),
            is_default=issue_type.is_default,
        )
        return Response(IssueTypeSerializer(issue_type).data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN])
    def partial_update(self, request, slug, project_id, pk):
        issue_type = self.get_queryset().get(pk=pk)
        serializer = IssueTypeSerializer(issue_type, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def destroy(self, request, slug, project_id, pk):
        issue_type = self.get_queryset().get(pk=pk)
        if issue_type.is_default:
            return Response(
                {"error": "The default work item type cannot be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Unlink from this project and remove the (project-scoped) type
        ProjectIssueType.objects.filter(project_id=project_id, issue_type=issue_type).delete()
        issue_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN])
    def enable(self, request, slug, project_id):
        """Enable Work Item Types on a project and seed default Task + Epic types."""
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        project.is_issue_type_enabled = True
        project.save(update_fields=["is_issue_type_enabled"])

        # Seed a default Task type
        if not ProjectIssueType.objects.filter(project_id=project_id, is_default=True).exists():
            task_type = IssueType.objects.create(
                workspace_id=project.workspace_id,
                name="Task",
                is_default=True,
                level=0,
                logo_props={"in_use": "icon", "icon": {"name": "LayoutGrid", "color": "#6b7280"}},
            )
            ProjectIssueType.objects.create(
                project_id=project_id, issue_type=task_type, is_default=True, level=0
            )

        # Seed an Epic type (matching Plane cloud's enable behaviour)
        if not ProjectIssueType.objects.filter(project_id=project_id, issue_type__is_epic=True).exists():
            epic_type = IssueType.objects.create(
                workspace_id=project.workspace_id,
                name="Epic",
                is_epic=True,
                level=1,
                logo_props={"in_use": "icon", "icon": {"name": "Layers", "color": "#6366f1"}},
            )
            ProjectIssueType.objects.create(
                project_id=project_id, issue_type=epic_type, is_default=False, level=1
            )
        return Response({"message": "Work item types enabled"}, status=status.HTTP_200_OK)


class IssuePropertyViewSet(BaseViewSet):
    serializer_class = IssuePropertySerializer
    model = IssueProperty

    def get_queryset(self):
        return (
            IssueProperty.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_type_id=self.kwargs.get("issue_type_id"))
            .prefetch_related("options")
            .distinct()
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id, issue_type_id):
        return Response(
            IssuePropertySerializer(self.get_queryset(), many=True).data,
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id, issue_type_id):
        serializer = IssuePropertySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        issue_property = serializer.save(project_id=project_id, issue_type_id=issue_type_id)

        # Eagerly create any dropdown options sent in the payload
        for option in request.data.get("options", []) or []:
            IssuePropertyOption.objects.create(
                property=issue_property,
                project_id=project_id,
                name=option.get("name", ""),
                description=option.get("description", ""),
                logo_props=option.get("logo_props", {}),
                is_default=option.get("is_default", False),
            )
        issue_property = self.get_queryset().get(pk=issue_property.id)
        return Response(IssuePropertySerializer(issue_property).data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN])
    def partial_update(self, request, slug, project_id, issue_type_id, pk):
        issue_property = self.get_queryset().get(pk=pk)
        serializer = IssuePropertySerializer(issue_property, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def destroy(self, request, slug, project_id, issue_type_id, pk):
        issue_property = self.get_queryset().get(pk=pk)
        issue_property.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssuePropertyOptionViewSet(BaseViewSet):
    serializer_class = IssuePropertyOptionSerializer
    model = IssuePropertyOption

    def get_queryset(self):
        return (
            IssuePropertyOption.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(property_id=self.kwargs.get("issue_property_id"))
            .distinct()
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id, issue_property_id):
        return Response(
            IssuePropertyOptionSerializer(self.get_queryset(), many=True).data,
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id, issue_property_id):
        serializer = IssuePropertyOptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(project_id=project_id, property_id=issue_property_id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN])
    def partial_update(self, request, slug, project_id, issue_property_id, pk):
        option = self.get_queryset().get(pk=pk)
        serializer = IssuePropertyOptionSerializer(option, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def destroy(self, request, slug, project_id, issue_property_id, pk):
        option = self.get_queryset().get(pk=pk)
        option.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssuePropertyValueEndpoint(BaseAPIView):
    """Read and bulk-upsert custom field values for a single work item."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id):
        values = IssuePropertyValue.objects.filter(
            workspace__slug=slug, project_id=project_id, issue_id=issue_id
        )
        grouped: dict = {}
        for value in values:
            grouped.setdefault(str(value.property_id), []).append(IssuePropertyValueSerializer(value).data)
        return Response(grouped, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, issue_id):
        # Payload shape: { "<property_id>": ["value", ...], ... }
        issue = Issue.objects.get(pk=issue_id, workspace__slug=slug, project_id=project_id)
        values_map = request.data if isinstance(request.data, dict) else {}

        # Validate against ALL active properties of the work item type (not just the
        # ones present in the payload) so required fields cannot be bypassed by omission.
        properties = IssueProperty.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_type_id=issue.type_id,
            is_active=True,
        ).prefetch_related("options")

        errors = validate_property_values(properties, values_map)
        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            for prop in properties:
                # Only upsert properties explicitly present in the payload.
                if str(prop.id) not in values_map:
                    continue
                raw_values = values_map.get(str(prop.id))
                # Replace this property's existing values for the work item
                IssuePropertyValue.objects.filter(issue_id=issue_id, property_id=prop.id).delete(soft=False)
                if raw_values in (None, "", []):
                    continue
                if not isinstance(raw_values, (list, tuple)):
                    raw_values = [raw_values]
                for raw in raw_values:
                    if raw in (None, ""):
                        continue
                    build_property_value(prop, issue, project_id, raw).save()

        return self.get(request, slug, project_id, issue_id)
