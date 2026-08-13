# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import ImporterSerializer
from plane.app.views.base import BaseAPIView
from plane.bgtasks.jira_import_task import jira_import_task
from plane.db.models import APIToken, Importer, Project, Workspace
from plane.utils.jira_importer import JiraClient, JiraImporterError, redact_jira_metadata


class ImporterServiceEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        importers = Importer.objects.filter(workspace__slug=slug).select_related("initiated_by", "project", "workspace")
        serializer = ImporterSerializer(importers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ImporterDeleteEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, service, importer_id):
        importer = Importer.objects.filter(workspace__slug=slug, service=service, id=importer_id).first()
        if importer is None:
            return Response({"error": "Importer not found."}, status=status.HTTP_404_NOT_FOUND)
        if importer.status in {"queued", "processing"}:
            importer.status = "cancelled"
            importer.save(update_fields=["status"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class JiraImporterMetadataEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        try:
            summary = JiraClient(request.GET).get_project_summary()
            return Response(summary, status=status.HTTP_200_OK)
        except JiraImporterError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class JiraImporterCreateEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        project_id = request.data.get("project_id")
        metadata = request.data.get("metadata") or {}
        if not project_id:
            return Response({"error": "Project is required."}, status=status.HTTP_400_BAD_REQUEST)
        project = Project.objects.filter(
            id=project_id,
            workspace__slug=slug,
            project_projectmember__member=request.user,
            project_projectmember__role__in=[ROLE.ADMIN.value, ROLE.MEMBER.value],
            project_projectmember__is_active=True,
            archived_at__isnull=True,
        ).first()
        if not project:
            return Response({"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            redacted_metadata = redact_jira_metadata(metadata)
            JiraClient(metadata).get_project_summary()
        except JiraImporterError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        workspace = Workspace.objects.get(slug=slug)
        token = APIToken.objects.create(
            label="Jira importer service token",
            user=request.user,
            user_type=0,
            workspace=workspace,
            is_service=True,
        )
        importer = Importer.objects.create(
            service="jira",
            status="queued",
            initiated_by=request.user,
            workspace=workspace,
            project=project,
            token=token,
            metadata=redacted_metadata,
            config=request.data.get("config") or {},
            data=request.data.get("data") or {},
            imported_data={"processed": 0, "created": 0, "updated": 0, "failed": 0},
        )
        jira_import_task.delay(str(importer.id), metadata)
        serializer = ImporterSerializer(importer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
