# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import transaction
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from plane.api.serializers import (
    IssuePropertySerializer,
    IssuePropertyOptionSerializer,
    IssuePropertyValueSerializer,
)
from plane.app.permissions import ProjectEntityPermission, ROLE
from plane.db.models import (
    Issue,
    IssueType,
    IssueProperty,
    IssuePropertyOption,
    IssuePropertyValue,
    ProjectMember,
    PropertyTypeEnum,
)
from plane.utils.issue_property import cast_property_values, validate_required_value
from plane.bgtasks.issue_activities_task import issue_property_value_activity


def _is_project_admin(user_id, project_id):
    """True when the user is an active admin of the project."""
    return ProjectMember.objects.filter(
        project_id=project_id, member_id=user_id, role=ROLE.ADMIN.value, is_active=True
    ).exists()


def _can_edit_work_item(user_id, project_id, issue=None):
    """Edit rights on a work item: admin/member of the project, or its creator."""
    if issue is not None and issue.created_by_id == user_id:
        return True
    return ProjectMember.objects.filter(
        project_id=project_id,
        member_id=user_id,
        role__in=[ROLE.ADMIN.value, ROLE.MEMBER.value],
        is_active=True,
    ).exists()


def _value_display(value):
    if value.value_option_id is not None:
        return str(value.value_option_id)
    if value.value_uuid is not None:
        return str(value.value_uuid)
    if value.value_datetime is not None:
        return value.value_datetime.isoformat()
    if value.value_decimal is not None:
        return str(value.value_decimal)
    if value.value_boolean is not None:
        return str(value.value_boolean)
    if value.value_text is not None:
        return value.value_text
    return ""


def _values_display(values):
    return ", ".join(_value_display(value) for value in values)


class IssuePropertyListCreateAPIEndpoint(BaseAPIView):
    """List and create custom property definitions for a work item type (v1)."""

    serializer_class = IssuePropertySerializer
    model = IssueProperty
    permission_classes = [ProjectEntityPermission]

    def get_queryset(self):
        return (
            IssueProperty.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
                issue_type_id=self.kwargs.get("type_id"),
            )
            .prefetch_related("options")
            .order_by("sort_order")
        )

    def get(self, request, slug, project_id, type_id):
        return self.paginate(
            request=request,
            queryset=self.get_queryset(),
            on_results=lambda properties: IssuePropertySerializer(properties, many=True).data,
        )

    def post(self, request, slug, project_id, type_id):
        if not _is_project_admin(request.user.id, project_id):
            return Response(
                {"error": "Only project admins can manage properties."},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Isolation: the work item type must belong to this workspace.
        if not IssueType.objects.filter(id=type_id, workspace__slug=slug).exists():
            return Response({"error": "The work item type does not exist."}, status=status.HTTP_404_NOT_FOUND)

        serializer = IssuePropertySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id, issue_type_id=type_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IssuePropertyDetailAPIEndpoint(BaseAPIView):
    """Retrieve, update and delete a custom property definition (v1)."""

    serializer_class = IssuePropertySerializer
    model = IssueProperty
    permission_classes = [ProjectEntityPermission]

    def get_queryset(self):
        return IssueProperty.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
            project_id=self.kwargs.get("project_id"),
            issue_type_id=self.kwargs.get("type_id"),
        ).prefetch_related("options")

    def get(self, request, slug, project_id, type_id, property_id):
        issue_property = self.get_queryset().get(pk=property_id)
        return Response(IssuePropertySerializer(issue_property).data, status=status.HTTP_200_OK)

    def patch(self, request, slug, project_id, type_id, property_id):
        if not _is_project_admin(request.user.id, project_id):
            return Response(
                {"error": "Only project admins can manage properties."},
                status=status.HTTP_403_FORBIDDEN,
            )
        issue_property = self.get_queryset().get(pk=property_id)
        serializer = IssuePropertySerializer(issue_property, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, project_id, type_id, property_id):
        if not _is_project_admin(request.user.id, project_id):
            return Response(
                {"error": "Only project admins can manage properties."},
                status=status.HTTP_403_FORBIDDEN,
            )
        issue_property = self.get_queryset().get(pk=property_id)
        issue_property.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssuePropertyOptionListCreateAPIEndpoint(BaseAPIView):
    """List and create options of an OPTION property (v1)."""

    serializer_class = IssuePropertyOptionSerializer
    model = IssuePropertyOption
    permission_classes = [ProjectEntityPermission]

    def get_property(self, slug, project_id, property_id):
        return IssueProperty.objects.filter(
            workspace__slug=slug, project_id=project_id, id=property_id
        ).first()

    def get_queryset(self):
        return IssuePropertyOption.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
            project_id=self.kwargs.get("project_id"),
            property_id=self.kwargs.get("property_id"),
        ).order_by("sort_order")

    def get(self, request, slug, project_id, property_id):
        if not self.get_property(slug, project_id, property_id):
            return Response({"error": "The property does not exist."}, status=status.HTTP_404_NOT_FOUND)
        return self.paginate(
            request=request,
            queryset=self.get_queryset(),
            on_results=lambda options: IssuePropertyOptionSerializer(options, many=True).data,
        )

    def post(self, request, slug, project_id, property_id):
        if not _is_project_admin(request.user.id, project_id):
            return Response(
                {"error": "Only project admins can manage property options."},
                status=status.HTTP_403_FORBIDDEN,
            )
        issue_property = self.get_property(slug, project_id, property_id)
        if not issue_property:
            return Response({"error": "The property does not exist."}, status=status.HTTP_404_NOT_FOUND)
        if issue_property.property_type != PropertyTypeEnum.OPTION.value:
            return Response(
                {"error": "Options can only be added to an OPTION property."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = IssuePropertyOptionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id, property_id=property_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IssuePropertyOptionDetailAPIEndpoint(BaseAPIView):
    """Retrieve, update and delete a property option (v1)."""

    serializer_class = IssuePropertyOptionSerializer
    model = IssuePropertyOption
    permission_classes = [ProjectEntityPermission]

    def get_property(self, slug, project_id, property_id):
        return IssueProperty.objects.filter(
            workspace__slug=slug, project_id=project_id, id=property_id
        ).first()

    def get_queryset(self):
        return IssuePropertyOption.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
            project_id=self.kwargs.get("project_id"),
            property_id=self.kwargs.get("property_id"),
        )

    def get(self, request, slug, project_id, property_id, option_id):
        if not self.get_property(slug, project_id, property_id):
            return Response({"error": "The property does not exist."}, status=status.HTTP_404_NOT_FOUND)
        option = self.get_queryset().get(pk=option_id)
        return Response(IssuePropertyOptionSerializer(option).data, status=status.HTTP_200_OK)

    def patch(self, request, slug, project_id, property_id, option_id):
        if not _is_project_admin(request.user.id, project_id):
            return Response(
                {"error": "Only project admins can manage property options."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not self.get_property(slug, project_id, property_id):
            return Response({"error": "The property does not exist."}, status=status.HTTP_404_NOT_FOUND)
        option = self.get_queryset().get(pk=option_id)
        serializer = IssuePropertyOptionSerializer(option, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, project_id, property_id, option_id):
        if not _is_project_admin(request.user.id, project_id):
            return Response(
                {"error": "Only project admins can manage property options."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not self.get_property(slug, project_id, property_id):
            return Response({"error": "The property does not exist."}, status=status.HTTP_404_NOT_FOUND)
        option = self.get_queryset().get(pk=option_id)
        option.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssuePropertyValueListAPIEndpoint(BaseAPIView):
    """List all typed custom property values of a work item (v1)."""

    serializer_class = IssuePropertyValueSerializer
    model = IssuePropertyValue
    permission_classes = [ProjectEntityPermission]

    def get(self, request, slug, project_id, issue_id):
        if not Issue.objects.filter(workspace__slug=slug, project_id=project_id, id=issue_id).exists():
            return Response({"error": "The work item does not exist."}, status=status.HTTP_404_NOT_FOUND)
        queryset = IssuePropertyValue.objects.filter(
            workspace__slug=slug, project_id=project_id, issue_id=issue_id
        )
        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda values: IssuePropertyValueSerializer(values, many=True).data,
        )


class IssuePropertyValueSetAPIEndpoint(BaseAPIView):
    """Get and set the typed values of a single property on a work item (v1)."""

    serializer_class = IssuePropertyValueSerializer
    model = IssuePropertyValue
    permission_classes = [ProjectEntityPermission]

    def get_issue(self, slug, project_id, issue_id):
        return Issue.objects.filter(workspace__slug=slug, project_id=project_id, id=issue_id).first()

    def get_property(self, slug, project_id, property_id):
        return IssueProperty.objects.filter(
            workspace__slug=slug, project_id=project_id, id=property_id
        ).first()

    def get(self, request, slug, project_id, issue_id, property_id):
        if not self.get_issue(slug, project_id, issue_id):
            return Response({"error": "The work item does not exist."}, status=status.HTTP_404_NOT_FOUND)
        queryset = IssuePropertyValue.objects.filter(
            workspace__slug=slug, project_id=project_id, issue_id=issue_id, property_id=property_id
        )
        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda values: IssuePropertyValueSerializer(values, many=True).data,
        )

    def post(self, request, slug, project_id, issue_id, property_id):
        return self._set_values(request, slug, project_id, issue_id, property_id)

    def patch(self, request, slug, project_id, issue_id, property_id):
        return self._set_values(request, slug, project_id, issue_id, property_id)

    def _set_values(self, request, slug, project_id, issue_id, property_id):
        issue = self.get_issue(slug, project_id, issue_id)
        if not issue:
            return Response({"error": "The work item does not exist."}, status=status.HTTP_404_NOT_FOUND)

        if not _can_edit_work_item(request.user.id, project_id, issue):
            return Response(
                {"error": "You are not allowed to edit this work item."},
                status=status.HTTP_403_FORBIDDEN,
            )

        issue_property = self.get_property(slug, project_id, property_id)
        if not issue_property:
            return Response({"error": "The property does not exist."}, status=status.HTTP_404_NOT_FOUND)

        # Isolation: the property must apply to this work item's type.
        if issue.type_id != issue_property.issue_type_id:
            return Response(
                {"error": "This property does not apply to this work item's type."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        raw_values = request.data.get("values", request.data.get("value"))
        validate_required_value(issue_property, raw_values)
        rows = cast_property_values(issue_property, raw_values, project_id)

        existing = list(
            IssuePropertyValue.objects.filter(
                project_id=project_id, issue_id=issue_id, property_id=property_id
            )
        )
        old_display = _values_display(existing)
        verb = "updated" if existing else "created"

        created = []
        with transaction.atomic():
            IssuePropertyValue.objects.filter(
                project_id=project_id, issue_id=issue_id, property_id=property_id
            ).delete()

            for row in rows:
                value = IssuePropertyValue(
                    issue_id=issue_id,
                    property_id=property_id,
                    project_id=project_id,
                    **row,
                )
                value.save()
                created.append(value)

        issue_property_value_activity.delay(
            property_id=str(property_id),
            display_name=issue_property.display_name,
            verb=verb,
            issue_id=str(issue_id),
            project_id=str(project_id),
            workspace_id=str(issue.workspace_id),
            actor_id=str(request.user.id),
            old_value=old_display,
            new_value=_values_display(created),
            epoch=int(timezone.now().timestamp()),
        )

        return Response(IssuePropertyValueSerializer(created, many=True).data, status=status.HTTP_200_OK)

    def delete(self, request, slug, project_id, issue_id, property_id):
        issue = self.get_issue(slug, project_id, issue_id)
        if not issue:
            return Response({"error": "The work item does not exist."}, status=status.HTTP_404_NOT_FOUND)

        if not _can_edit_work_item(request.user.id, project_id, issue):
            return Response(
                {"error": "You are not allowed to edit this work item."},
                status=status.HTTP_403_FORBIDDEN,
            )

        existing = list(
            IssuePropertyValue.objects.filter(
                project_id=project_id, issue_id=issue_id, property_id=property_id
            )
        )
        if not existing:
            return Response(status=status.HTTP_204_NO_CONTENT)

        issue_property = self.get_property(slug, project_id, property_id)
        old_display = _values_display(existing)

        IssuePropertyValue.objects.filter(
            project_id=project_id, issue_id=issue_id, property_id=property_id
        ).delete()

        issue_property_value_activity.delay(
            property_id=str(property_id),
            display_name=issue_property.display_name if issue_property else "",
            verb="deleted",
            issue_id=str(issue_id),
            project_id=str(project_id),
            workspace_id=str(issue.workspace_id),
            actor_id=str(request.user.id),
            old_value=old_display,
            new_value="",
            epoch=int(timezone.now().timestamp()),
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
