# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import io
import json
import zipfile

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import ExporterHistorySerializer
from plane.db.models import ExporterHistory, Project, ProjectMember, Workspace
from plane.utils.community_work_item_import import import_community_work_items_into_project
from plane.utils.porters.importer import DataImporter
from plane.utils.project_work_item_import import MAX_WORK_ITEMS_IMPORT, WorkItemImportOptions

from .. import BaseAPIView

# Matches MAX_PROJECT_CSV_SIZE_BYTES in the web app so the browser and the server agree
MAX_UPLOAD_BYTES = 15 * 1024 * 1024


def _detect_format(filename: str, content: bytes) -> str:
    lower = (filename or "").lower()
    if lower.endswith(".json"):
        return "json"
    if lower.endswith(".xlsx") or content[:2] == b"PK":
        if content[:2] == b"PK":
            try:
                with zipfile.ZipFile(io.BytesIO(content)) as archive:
                    names = set(archive.namelist())
                    if "[Content_Types].xml" in names or any(name.startswith("xl/") for name in names):
                        return "xlsx"
            except zipfile.BadZipFile:
                pass
        if lower.endswith(".xlsx"):
            return "xlsx"
    return "csv"


class ImportWorkItemsEndpoint(BaseAPIView):
    model = ExporterHistory
    serializer_class = ExporterHistorySerializer

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        upload = request.FILES.get("file")
        project_id = request.data.get("project_id") or request.data.get("project")
        provider = (request.data.get("provider") or "").strip().lower()
        options = WorkItemImportOptions.from_request_data(request.data)

        if not upload:
            return Response({"error": "file is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not project_id:
            return Response({"error": "project_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        workspace = Workspace.objects.filter(slug=slug).first()
        if workspace is None:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        project = Project.objects.filter(
            id=project_id,
            workspace=workspace,
            deleted_at__isnull=True,
        ).first()
        if project is None:
            return Response({"error": "Project not found in this workspace"}, status=status.HTTP_404_NOT_FOUND)

        is_member = ProjectMember.objects.filter(
            project_id=project.id,
            member_id=request.user.id,
            is_active=True,
            deleted_at__isnull=True,
        ).exists()
        if not is_member and not request.user.is_superuser:
            return Response(
                {"error": "You must be a member of the target project to import work items."},
                status=status.HTTP_403_FORBIDDEN,
            )

        history = ExporterHistory.objects.create(
            workspace=workspace,
            project=[project.id],
            initiated_by=request.user,
            provider=provider if provider in {"csv", "xlsx", "json"} else "csv",
            type="project_imports",
            status="processing",
            name=f"Work items → {project.identifier} ({upload.name})",
            # An import is bulk and cannot be undone; the history row is the only record of
            # which parts of the file the run was allowed to bring in
            filters=options.as_dict(),
        )

        try:
            content = upload.read()
            if len(content) > MAX_UPLOAD_BYTES:
                history.status = "failed"
                history.reason = "File too large."
                history.save(update_fields=["status", "reason", "updated_at"])
                return Response(
                    {"error": f"File must be smaller than {MAX_UPLOAD_BYTES // (1024 * 1024)} MB."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            format_type = provider if provider in {"csv", "xlsx", "json"} else _detect_format(upload.name, content)
            history.provider = format_type
            history.save(update_fields=["provider", "updated_at"])

            rows = DataImporter(format_type=format_type).decode(content)
            if not rows:
                history.status = "failed"
                history.reason = "File is empty."
                history.save(update_fields=["status", "reason", "updated_at"])
                return Response({"error": "File is empty."}, status=status.HTTP_400_BAD_REQUEST)

            if len(rows) > MAX_WORK_ITEMS_IMPORT:
                history.status = "failed"
                history.reason = f"File exceeds {MAX_WORK_ITEMS_IMPORT} work item rows."
                history.save(update_fields=["status", "reason", "updated_at"])
                return Response(
                    {"error": f"File cannot contain more than {MAX_WORK_ITEMS_IMPORT} work items."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            warnings: list[str] = []
            result = import_community_work_items_into_project(
                project=project,
                user=request.user,
                rows=rows,
                warnings=warnings,
                options=options,
            )

            history.status = "completed"
            history.reason = ""
            history.save(update_fields=["status", "reason", "updated_at"])

            return Response(
                {
                    "message": "Work items import completed.",
                    "project_id": str(project.id),
                    "project_identifier": project.identifier,
                    "project_name": project.name,
                    "created_work_items": result["created_work_items"],
                    "warnings": result.get("warnings") or [],
                    "history_id": str(history.id),
                },
                status=status.HTTP_201_CREATED,
            )
        except ValueError as exc:
            detail = exc.args[0] if exc.args else "Import failed."
            history.status = "failed"
            history.reason = json.dumps(detail) if not isinstance(detail, str) else detail
            history.save(update_fields=["status", "reason", "updated_at"])
            if isinstance(detail, dict):
                return Response(detail, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            history.status = "failed"
            history.reason = str(exc)
            history.save(update_fields=["status", "reason", "updated_at"])
            return Response(
                {
                    "error": (
                        "Could not read the file. Upload a CSV, Excel, or JSON file "
                        "produced by “Export work items”."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        importer_history = ExporterHistory.objects.filter(
            workspace__slug=slug,
            type="project_imports",
        ).select_related("workspace", "initiated_by")

        if request.GET.get("per_page", False) and request.GET.get("cursor", False):
            return self.paginate(
                order_by=request.GET.get("order_by", "-created_at"),
                request=request,
                queryset=importer_history,
                on_results=lambda rows: ExporterHistorySerializer(rows, many=True).data,
            )

        return Response(
            {"error": "per_page and cursor are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
