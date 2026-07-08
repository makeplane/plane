# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import transaction

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseViewSet, BaseAPIView
from plane.app.serializers import IssueTypeSerializer
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import IssueType, ProjectIssueType, Project
from plane.utils.issue_type import create_default_issue_types


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
                project_issue_types__project__archived_at__isnull=True,
            )
            .prefetch_related("project_issue_types")
            .select_related("workspace")
            .distinct()
        )

    def _set_as_default(self, project_id, issue_type):
        # Ensure only a single default issue type exists per project
        IssueType.objects.filter(
            project_issue_types__project_id=project_id, is_default=True
        ).exclude(pk=issue_type.id).update(is_default=False)
        ProjectIssueType.objects.filter(project_id=project_id, is_default=True).exclude(
            issue_type=issue_type
        ).update(is_default=False)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        issue_types = IssueTypeSerializer(self.get_queryset(), many=True).data
        return Response(issue_types, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def retrieve(self, request, slug, project_id, pk):
        issue_type = self.get_queryset().get(pk=pk)
        return Response(IssueTypeSerializer(issue_type).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        serializer = IssueTypeSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                issue_type = serializer.save(workspace_id=project.workspace_id)
                # Epics can never be the default work item type
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
                    self._set_as_default(project_id, issue_type)
            return Response(IssueTypeSerializer(issue_type).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN])
    def partial_update(self, request, slug, project_id, pk):
        issue_type = self.get_queryset().get(pk=pk)

        # is_epic is immutable after creation
        data = {key: value for key, value in request.data.items() if key != "is_epic"}

        serializer = IssueTypeSerializer(issue_type, data=data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Evaluate the guards against the serializer-coerced booleans (raw request.data
        # could carry strings like "false" that would bypass an `is False` comparison)
        validated = serializer.validated_data

        # The default work item type cannot be deactivated or unset as default
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
                self._set_as_default(project_id, issue_type)
        return Response(IssueTypeSerializer(issue_type).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def destroy(self, request, slug, project_id, pk):
        issue_type = self.get_queryset().get(pk=pk)

        if issue_type.is_default:
            return Response(
                {"error": "The default work item type cannot be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            ProjectIssueType.objects.filter(project_id=project_id, issue_type=issue_type).delete()
            issue_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueTypeEnableEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)

        with transaction.atomic():
            if not project.is_issue_type_enabled:
                project.is_issue_type_enabled = True
                project.save()
            create_default_issue_types(project)

        issue_types = (
            IssueType.objects.filter(workspace__slug=slug, project_issue_types__project_id=project_id)
            .prefetch_related("project_issue_types")
            .distinct()
        )
        return Response(IssueTypeSerializer(issue_types, many=True).data, status=status.HTTP_200_OK)
