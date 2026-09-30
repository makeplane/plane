# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

from django.db import transaction
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import IssueTypeSerializer, ProjectIssueTypeSerializer
from plane.app.views.base import BaseAPIView, BaseViewSet
from plane.db.models import IssueType, Project, ProjectIssueType


class ProjectIssueTypeViewSet(BaseViewSet):
    serializer_class = ProjectIssueTypeSerializer
    model = ProjectIssueType
    use_read_replica = True

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(
                project_id=self.kwargs.get("project_id"),
                workspace__slug=self.kwargs.get("slug"),
                issue_type__is_active=True,
                issue_type__deleted_at__isnull=True,
            )
            .select_related("issue_type", "project", "workspace")
            .order_by("level", "issue_type__name")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def list(self, request, slug, project_id):
        qs = self.filter_queryset(self.get_queryset())
        return self.paginate(
            request=request,
            queryset=qs,
            on_results=lambda rows: ProjectIssueTypeSerializer(rows, many=True).data,
            default_per_page=100,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def create(self, request, slug, project_id):
        issue_type_id = request.data.get("issue_type_id")
        if not issue_type_id:
            return Response({"error": "issue_type_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            parsed_type_id = uuid.UUID(str(issue_type_id))
        except (ValueError, TypeError, AttributeError):
            return Response({"error": "Invalid issue_type_id"}, status=status.HTTP_400_BAD_REQUEST)

        project = Project.objects.filter(id=project_id, workspace__slug=slug, deleted_at__isnull=True).first()
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        issue_type = IssueType.objects.filter(
            id=parsed_type_id,
            workspace_id=project.workspace_id,
            deleted_at__isnull=True,
        ).first()
        if not issue_type:
            return Response({"error": "Issue type not found"}, status=status.HTTP_404_NOT_FOUND)

        existing = ProjectIssueType.objects.filter(
            project_id=project_id,
            issue_type_id=parsed_type_id,
            deleted_at__isnull=True,
        ).first()
        if existing:
            return Response(ProjectIssueTypeSerializer(existing).data, status=status.HTTP_200_OK)

        is_default = bool(request.data.get("is_default", False))
        level = request.data.get("level")
        try:
            level = int(level) if level is not None else issue_type.level
        except (TypeError, ValueError):
            level = issue_type.level

        with transaction.atomic():
            if is_default:
                ProjectIssueType.objects.filter(project_id=project_id, deleted_at__isnull=True).update(is_default=False)
            link = ProjectIssueType.objects.create(
                project_id=project_id,
                issue_type_id=parsed_type_id,
                workspace_id=project.workspace_id,
                level=level,
                is_default=is_default,
            )

        return Response(ProjectIssueTypeSerializer(link).data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def partial_update(self, request, slug, project_id, pk):
        link = self.get_queryset().filter(pk=pk).first()
        if not link:
            return Response({"error": "Project issue type not found"}, status=status.HTTP_404_NOT_FOUND)

        is_default = request.data.get("is_default")
        level = request.data.get("level")

        with transaction.atomic():
            if is_default is True:
                ProjectIssueType.objects.filter(project_id=project_id, deleted_at__isnull=True).exclude(pk=pk).update(
                    is_default=False
                )
                link.is_default = True
            if level is not None:
                try:
                    link.level = int(level)
                except (TypeError, ValueError):
                    pass
            link.save()

        return Response(ProjectIssueTypeSerializer(link).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def destroy(self, request, slug, project_id, pk):
        return super().destroy(request, slug, project_id, pk)


class ProjectIssueTypeBulkAssignEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def post(self, request, slug, project_id):
        issue_type_ids = request.data.get("issue_type_ids")
        if not isinstance(issue_type_ids, list):
            return Response({"error": "issue_type_ids must be an array"}, status=status.HTTP_400_BAD_REQUEST)

        project = Project.objects.filter(id=project_id, workspace__slug=slug, deleted_at__isnull=True).first()
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        parsed_ids = []
        for raw in issue_type_ids:
            try:
                parsed_ids.append(uuid.UUID(str(raw)))
            except (ValueError, TypeError, AttributeError):
                continue

        valid_types = list(
            IssueType.objects.filter(
                workspace_id=project.workspace_id,
                id__in=parsed_ids,
                deleted_at__isnull=True,
                is_active=True,
            )
        )

        default_type_id = request.data.get("default_type_id")
        default_uuid = None
        if default_type_id:
            try:
                default_uuid = uuid.UUID(str(default_type_id))
            except (ValueError, TypeError, AttributeError):
                default_uuid = None

        with transaction.atomic():
            existing = {
                str(row.issue_type_id): row
                for row in ProjectIssueType.objects.filter(project_id=project_id, deleted_at__isnull=True)
            }
            keep = set()
            for issue_type in valid_types:
                keep.add(str(issue_type.id))
                if str(issue_type.id) not in existing:
                    ProjectIssueType.objects.create(
                        project_id=project_id,
                        issue_type=issue_type,
                        workspace_id=project.workspace_id,
                        level=issue_type.level,
                        is_default=default_uuid == issue_type.id,
                    )
                elif default_uuid == issue_type.id:
                    existing[str(issue_type.id)].is_default = True
                    existing[str(issue_type.id)].save()
            for key, row in existing.items():
                if key not in keep:
                    row.delete()

            if default_uuid:
                ProjectIssueType.objects.filter(project_id=project_id, deleted_at__isnull=True).update(is_default=False)
                ProjectIssueType.objects.filter(
                    project_id=project_id,
                    issue_type_id=default_uuid,
                    deleted_at__isnull=True,
                ).update(is_default=True)

        rows = self._get_links(project_id)
        return Response(
            {
                "results": [
                    IssueTypeSerializer(row.issue_type, context={"slug": slug}).data for row in rows
                ]
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    def _get_links(project_id):
        return ProjectIssueType.objects.filter(
            project_id=project_id,
            deleted_at__isnull=True,
            issue_type__deleted_at__isnull=True,
            issue_type__is_active=True,
        ).select_related("issue_type")
