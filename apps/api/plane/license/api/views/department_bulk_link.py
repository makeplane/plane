# Django imports
from django.db import transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import Department, Workspace
from plane.license.api.views.base import BaseAPIView
from plane.license.api.views.department import _add_managers_to_workspace, _sync_members_to_workspace
from plane.utils.exception_logger import log_exception


class DepartmentBulkLinkWorkspaceView(BaseAPIView):
    """Bulk-link departments to workspaces via workspace slug from Excel data."""

    def post(self, request):
        links = request.data.get("links")
        if not isinstance(links, list):
            return Response({"error": "links must be a list"}, status=status.HTTP_400_BAD_REQUEST)
        if len(links) > 500:
            return Response({"error": "Maximum 500 rows per request"}, status=status.HTTP_400_BAD_REQUEST)

        linked = []
        skipped = []

        for i, row in enumerate(links):
            code = (row.get("code") or "").strip()
            workspace_slug = (row.get("workspace_slug") or "").strip()

            if not code:
                skipped.append({"row": i + 1, "reason": "Missing department code"})
                continue
            if not workspace_slug:
                skipped.append({"row": i + 1, "code": code, "reason": "Missing workspace_slug"})
                continue

            dept = Department.objects.select_related("linked_workspace").filter(
                code=code, deleted_at__isnull=True
            ).first()
            if not dept:
                skipped.append({"row": i + 1, "code": code, "reason": "Department not found"})
                continue

            workspace = Workspace.objects.filter(slug=workspace_slug).first()
            if not workspace:
                skipped.append({"row": i + 1, "code": code, "reason": "Workspace not found"})
                continue

            if dept.linked_workspace_id is not None:
                ws_name = dept.linked_workspace.name if dept.linked_workspace else str(dept.linked_workspace_id)
                skipped.append({"row": i + 1, "code": code, "reason": f"Already linked to workspace {ws_name}"})
                continue

            with transaction.atomic():
                dept.linked_workspace = workspace
                dept.save(update_fields=["linked_workspace"])

            # Count active staff for async decision (same pattern as link-workspace endpoint)
            from plane.db.models import StaffProfile

            staff_count = StaffProfile.objects.filter(
                department=dept,
                employment_status="active",
                deleted_at__isnull=True,
            ).count()

            _add_managers_to_workspace(dept, workspace)

            if staff_count > 10:
                try:
                    from plane.bgtasks.department_membership_task import sync_department_workspace_members

                    sync_department_workspace_members.delay(str(dept.id), str(workspace.id))
                except Exception:
                    log_exception(Exception("Celery task dispatch failed, falling back to sync"))
                    _sync_members_to_workspace(dept, workspace)
            else:
                _sync_members_to_workspace(dept, workspace)

            linked.append({"code": code, "name": dept.name, "workspace": workspace.name})

        return Response(
            {
                "linked": linked,
                "skipped": skipped,
                "total_linked": len(linked),
                "total_skipped": len(skipped),
            },
            status=status.HTTP_200_OK,
        )
