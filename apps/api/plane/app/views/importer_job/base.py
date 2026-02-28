# [FA-CUSTOM] File-based CSV/XLSX import endpoints

from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import ImportJobSerializer
from plane.db.models import (
    ImportJob,
    Project,
    ProjectMember,
    State,
    WorkspaceMember,
    WorkspaceMemberInvite,
)

from .. import BaseAPIView


class ImportUploadEndpoint(BaseAPIView):
    """
    POST: Upload CSV/XLSX, parse on server, create ImportJob,
    return preview + detected columns + auto-mappings + fuzzy suggestions.
    """

    parser_classes = (MultiPartParser, FormParser)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def post(self, request, slug, project_id):
        file = request.FILES.get("file")
        if not file:
            return Response(
                {"error": "No file provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Determine format
        file_name = file.name
        if file_name.lower().endswith(".csv"):
            file_format = "csv"
        elif file_name.lower().endswith(".xlsx"):
            file_format = "xlsx"
        else:
            return Response(
                {"error": "Unsupported file format. Use .csv or .xlsx."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Parse the file
        from plane.utils.importers.parser import parse_import_file
        from plane.utils.importers.presets import detect_preset, get_auto_mapping

        try:
            headers, rows = parse_import_file(file, file_format)
        except Exception as e:
            return Response(
                {"error": f"Failed to parse file: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not rows:
            return Response(
                {"error": "File contains no data rows"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Detect source tool preset
        preset_key = detect_preset(headers)

        # Get auto-mapped columns
        auto_mapping = get_auto_mapping(preset_key, headers)

        # Extract unique statuses and assignees from the full file
        status_col = auto_mapping.get("status")
        assignee_col = auto_mapping.get("assignee")

        unique_statuses = []
        unique_assignees = []
        if status_col and status_col in headers:
            col_idx = headers.index(status_col)
            unique_statuses = sorted(
                set(
                    row[col_idx]
                    for row in rows
                    if col_idx < len(row) and row[col_idx].strip()
                )
            )
        if assignee_col and assignee_col in headers:
            col_idx = headers.index(assignee_col)
            # Case-insensitive dedup: normalized_key -> first-seen original form
            assignee_seen = {}
            for row in rows:
                if col_idx < len(row) and row[col_idx].strip():
                    for name in row[col_idx].split(","):
                        name = name.strip()
                        if name:
                            normalized = " ".join(name.lower().split())
                            if normalized not in assignee_seen:
                                assignee_seen[normalized] = name
            unique_assignees = sorted(assignee_seen.values(), key=str.lower)

        # Create ImportJob
        project = Project.objects.get(pk=project_id)
        import_job = ImportJob.objects.create(
            project=project,
            workspace=project.workspace,
            initiated_by=request.user,
            file_name=file_name,
            file_format=file_format,
            total_rows=len(rows),
            detected_preset=preset_key,
            detected_columns=headers,
            column_mapping=auto_mapping,
            unique_statuses=unique_statuses,
            unique_assignees=unique_assignees,
            preview_rows=[dict(zip(headers, row)) for row in rows[:5]],
            parsed_data=[dict(zip(headers, row)) for row in rows],
            status="mapping",
            created_by=request.user,
        )

        # Get fuzzy-matched suggestions
        from plane.utils.importers.fuzzy_match import (
            suggest_assignee_mapping,
            suggest_status_mapping,
        )

        project_states = list(
            State.objects.filter(project_id=project_id).values(
                "id", "name", "group", "color"
            )
        )

        project_members = list(
            ProjectMember.objects.filter(
                project_id=project_id,
                is_active=True,
                role__gte=15,
            )
            .select_related("member")
            .values("member__id", "member__display_name", "member__email")
        )
        project_member_ids = set(
            pm["member__id"] for pm in project_members
        )

        # Workspace members who are NOT yet project members
        workspace_only_members = list(
            WorkspaceMember.objects.filter(
                workspace_id=project.workspace_id,
                is_active=True,
                role__gte=15,
            )
            .exclude(member__id__in=project_member_ids)
            .select_related("member")
            .values("member__id", "member__display_name", "member__email")
        )

        # Pending workspace invitations (display-only, no user ID yet)
        pending_invites = list(
            WorkspaceMemberInvite.objects.filter(
                workspace_id=project.workspace_id,
                accepted=False,
            ).values("email", "role")
        )

        status_suggestions = suggest_status_mapping(
            unique_statuses, project_states
        )
        # Include workspace members in fuzzy matching
        all_members = project_members + workspace_only_members
        assignee_suggestions = suggest_assignee_mapping(
            unique_assignees, all_members
        )

        return Response(
            {
                "token": import_job.token,
                "file_name": file_name,
                "file_format": file_format,
                "total_rows": len(rows),
                "detected_preset": preset_key,
                "detected_columns": headers,
                "column_mapping": auto_mapping,
                "preview_rows": import_job.preview_rows,
                "unique_statuses": unique_statuses,
                "unique_assignees": unique_assignees,
                "status_suggestions": status_suggestions,
                "assignee_suggestions": assignee_suggestions,
                "project_states": project_states,
                "project_members": project_members,
                "workspace_members": workspace_only_members,
                "pending_invites": pending_invites,
            },
            status=status.HTTP_201_CREATED,
        )


class ImportJobDetailEndpoint(BaseAPIView):
    """
    GET:   Get import job status, progress, and results.
    PATCH: Update column_mapping, status_mapping, assignee_mapping.
    """

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def get(self, request, slug, project_id, token):
        try:
            import_job = ImportJob.objects.get(
                project_id=project_id, token=token
            )
        except ImportJob.DoesNotExist:
            return Response(
                {"error": "Import job not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ImportJobSerializer(import_job)
        return Response(serializer.data)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def patch(self, request, slug, project_id, token):
        try:
            import_job = ImportJob.objects.get(
                project_id=project_id, token=token
            )
        except ImportJob.DoesNotExist:
            return Response(
                {"error": "Import job not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if import_job.status not in ("mapping", "uploading"):
            return Response(
                {"error": "Import job cannot be modified in current state"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        update_fields = []
        for field in ("column_mapping", "status_mapping", "assignee_mapping"):
            if field in request.data:
                setattr(import_job, field, request.data[field])
                update_fields.append(field)

        if update_fields:
            import_job.save(update_fields=update_fields)

        return Response({"message": "Mapping updated"}, status=status.HTTP_200_OK)


class ImportStartEndpoint(BaseAPIView):
    """
    POST: Validate mappings and queue the Celery import task.
    """

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def post(self, request, slug, project_id, token):
        try:
            import_job = ImportJob.objects.get(
                project_id=project_id, token=token
            )
        except ImportJob.DoesNotExist:
            return Response(
                {"error": "Import job not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if import_job.status != "mapping":
            return Response(
                {"error": "Import job is not ready to start"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate title column is mapped
        if not import_job.column_mapping.get("title"):
            return Response(
                {"error": "Title column must be mapped"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mark as queued
        import_job.status = "queued"
        import_job.save(update_fields=["status"])

        # Dispatch Celery task
        from plane.bgtasks.import_task import issue_import_task

        issue_import_task.delay(
            import_job_id=str(import_job.id),
            actor_id=str(request.user.id),
        )

        return Response(
            {"message": "Import queued", "token": import_job.token},
            status=status.HTTP_200_OK,
        )


class ImportHistoryEndpoint(BaseAPIView):
    """
    GET: List all import jobs for a project.
    """

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="PROJECT")
    def get(self, request, slug, project_id):
        import_jobs = ImportJob.objects.filter(
            project_id=project_id,
        ).select_related("initiated_by")

        serializer = ImportJobSerializer(import_jobs, many=True)
        return Response(serializer.data)
