# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.serializers import IssueTypeSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import IssueType, ProjectIssueType, Project, ProjectMember
from plane.db.models.project import ROLE
from .base import BaseAPIView


def _is_project_admin(user, slug, project_id):
    return ProjectMember.objects.filter(
        workspace__slug=slug,
        project_id=project_id,
        member=user,
        role=ROLE.ADMIN.value,
        is_active=True,
    ).exists()


def _set_as_default(project_id, issue_type):
    # Ensure only a single default work item type exists per project
    IssueType.objects.filter(project_issue_types__project_id=project_id, is_default=True).exclude(
        pk=issue_type.id
    ).update(is_default=False)
    ProjectIssueType.objects.filter(project_id=project_id, is_default=True).exclude(issue_type=issue_type).update(
        is_default=False
    )


class WorkItemTypeListCreateAPIEndpoint(BaseAPIView):
    """Work Item Type List and Create Endpoint"""

    serializer_class = IssueTypeSerializer
    model = IssueType
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            IssueType.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_issue_types__project_id=self.kwargs.get("project_id"))
            .filter(
                project_issue_types__project__project_projectmember__member=self.request.user,
                project_issue_types__project__project_projectmember__is_active=True,
            )
            .filter(project_issue_types__project__archived_at__isnull=True)
            .prefetch_related("project_issue_types")
            .select_related("workspace")
            .distinct()
        )

    def get(self, request, slug, project_id):
        # Resolve a work item type by name within the project
        name = request.GET.get("name", None)
        if name:
            issue_type = self.get_queryset().filter(name__iexact=name).first()
            if not issue_type:
                return Response(
                    {"error": "The requested resource does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return Response(IssueTypeSerializer(issue_type).data, status=status.HTTP_200_OK)

        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda issue_types: IssueTypeSerializer(
                issue_types, many=True, fields=self.fields, expand=self.expand
            ).data,
        )

    def post(self, request, slug, project_id):
        if not _is_project_admin(request.user, slug, project_id):
            return Response(
                {"error": "You don't have the required permissions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        serializer = IssueTypeSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                issue_type = serializer.save(workspace_id=project.workspace_id)
                if issue_type.is_epic and issue_type.is_default:
                    issue_type.is_default = False
                    issue_type.save()
                ProjectIssueType.objects.create(
                    project_id=project_id,
                    issue_type=issue_type,
                    level=issue_type.level,
                    is_default=issue_type.is_default,
                )
                if issue_type.is_default:
                    _set_as_default(project_id, issue_type)
            return Response(IssueTypeSerializer(issue_type).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkItemTypeDetailAPIEndpoint(WorkItemTypeListCreateAPIEndpoint):
    """Work Item Type Detail Endpoint"""

    def get(self, request, slug, project_id, type_id):
        issue_type = self.get_queryset().get(pk=type_id)
        return Response(IssueTypeSerializer(issue_type).data, status=status.HTTP_200_OK)

    def patch(self, request, slug, project_id, type_id):
        if not _is_project_admin(request.user, slug, project_id):
            return Response(
                {"error": "You don't have the required permissions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        issue_type = self.get_queryset().get(pk=type_id)

        # is_epic is immutable after creation
        data = {key: value for key, value in request.data.items() if key != "is_epic"}

        serializer = IssueTypeSerializer(issue_type, data=data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Evaluate the guards against the serializer-coerced booleans (raw request.data
        # could carry strings like "false" that would bypass an `is False` comparison)
        validated = serializer.validated_data

        if issue_type.is_default:
            if validated.get("is_active") is False:
                return Response(
                    {"error": "The default work item type cannot be deactivated"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if validated.get("is_default") is False:
                return Response(
                    {"error": "A default work item type is required, set another type as default instead"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # An epic type can never be the project default
        if issue_type.is_epic and validated.get("is_default") is True:
            return Response(
                {"error": "An epic work item type cannot be set as default"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            issue_type = serializer.save()
            ProjectIssueType.objects.filter(project_id=project_id, issue_type=issue_type).update(
                is_default=issue_type.is_default, level=issue_type.level
            )
            if issue_type.is_default:
                _set_as_default(project_id, issue_type)
        return Response(IssueTypeSerializer(issue_type).data, status=status.HTTP_200_OK)

    def delete(self, request, slug, project_id, type_id):
        if not _is_project_admin(request.user, slug, project_id):
            return Response(
                {"error": "You don't have the required permissions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        issue_type = self.get_queryset().get(pk=type_id)

        if issue_type.is_default:
            return Response(
                {"error": "The default work item type cannot be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            ProjectIssueType.objects.filter(project_id=project_id, issue_type=issue_type).delete()
            issue_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
