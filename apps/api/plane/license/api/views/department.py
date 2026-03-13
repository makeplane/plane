# Python imports
import json

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.db.models import Count, Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers.department import DepartmentSerializer, DepartmentTreeSerializer
from plane.db.models import Department, Workspace, WorkspaceMember
from plane.license.api.views.base import BaseAPIView
from plane.utils.exception_logger import log_exception


class InstanceDepartmentEndpoint(BaseAPIView):
    """List all departments (instance-level) and create new departments."""

    def get(self, request):
        departments = (
            Department.objects.filter(deleted_at__isnull=True)
            .select_related("manager", "linked_workspace")
            .annotate(
                staff_count=Count(
                    "staff_members",
                    filter=Q(staff_members__deleted_at__isnull=True),
                )
            )
        )

        parent = request.query_params.get("parent")
        if parent:
            departments = departments.filter(parent_id=parent)

        level = request.query_params.get("level")
        if level:
            try:
                departments = departments.filter(level=int(level))
            except (ValueError, TypeError):
                pass

        is_active = request.query_params.get("is_active")
        if is_active is not None:
            departments = departments.filter(is_active=is_active.lower() == "true")

        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = DepartmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InstanceDepartmentDetailEndpoint(BaseAPIView):
    """Retrieve, update, delete a department by pk."""

    def get(self, request, pk):
        department = (
            Department.objects.filter(pk=pk, deleted_at__isnull=True)
            .select_related("manager", "linked_workspace")
            .annotate(
                staff_count=Count(
                    "staff_members",
                    filter=Q(staff_members__deleted_at__isnull=True),
                )
            )
            .first()
        )
        if not department:
            return Response({"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = DepartmentSerializer(department)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        department = Department.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not department:
            return Response({"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND)

        old_manager_id = department.manager_id
        serializer = DepartmentSerializer(department, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            # When manager changes, new manager joins this dept's linked_workspace + descendants
            new_manager_id = updated.manager_id
            if new_manager_id and new_manager_id != old_manager_id:
                _join_descendant_workspaces(updated, updated.manager)
                if updated.linked_workspace:
                    # New manager gets Admin role in their own workspace (soft-delete-safe)
                    existing = WorkspaceMember.objects.filter(
                        workspace=updated.linked_workspace,
                        member=updated.manager,
                        deleted_at__isnull=True,
                    ).first()
                    if existing:
                        if existing.role < 20:
                            existing.role = 20
                            existing.save(update_fields=["role"])
                    else:
                        WorkspaceMember.objects.create(
                            workspace=updated.linked_workspace, member=updated.manager, role=20, is_active=True
                        )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        department = Department.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not department:
            return Response({"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND)
        department.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InstanceDepartmentTreeEndpoint(BaseAPIView):
    """Full nested tree of all departments (instance-level)."""

    def get(self, request):
        root_departments = (
            Department.objects.filter(parent__isnull=True, deleted_at__isnull=True)
            .select_related("manager", "linked_workspace")
            .annotate(
                staff_count=Count(
                    "staff_members",
                    filter=Q(staff_members__deleted_at__isnull=True),
                )
            )
            .order_by("sort_order", "name")
        )
        serializer = DepartmentTreeSerializer(root_departments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InstanceDepartmentStaffEndpoint(BaseAPIView):
    """List staff members for a given department."""

    def get(self, request, pk):
        from plane.app.serializers.staff import StaffProfileSerializer
        from plane.db.models import StaffProfile

        staff = (
            StaffProfile.objects.filter(department_id=pk, deleted_at__isnull=True)
            .select_related("user", "department")
        )
        serializer = StaffProfileSerializer(staff, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InstanceDepartmentLinkWorkspaceEndpoint(BaseAPIView):
    """Link or unlink a department to a workspace. Always auto-joins all active staff."""

    def post(self, request, pk):
        """Link department to workspace — auto-add all active staff as WorkspaceMembers."""
        department = Department.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not department:
            return Response({"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND)

        workspace_id = request.data.get("workspace_id")
        if not workspace_id:
            return Response({"error": "workspace_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        workspace = Workspace.objects.filter(pk=workspace_id).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        # Verify workspace is not already linked to another department
        if hasattr(workspace, "linked_department") and workspace.linked_department and workspace.linked_department.pk != department.pk:
            return Response(
                {"error": "Workspace is already linked to another department"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            department.linked_workspace = workspace
            department.save(update_fields=["linked_workspace"])

        # Count active staff for async decision
        from plane.db.models import StaffProfile

        staff_count = StaffProfile.objects.filter(
            department=department,
            employment_status="active",
            deleted_at__isnull=True,
        ).count()

        # Always sync managers (own dept + ancestors) with Admin role — fast regardless of staff count
        managers_added = _add_managers_to_workspace(department, workspace)

        if staff_count > 10:
            # Offload staff sync to Celery for large departments
            try:
                from plane.bgtasks.department_membership_task import sync_department_workspace_members
                sync_department_workspace_members.delay(str(department.id), str(workspace.id))
            except Exception:
                log_exception(Exception("Celery task dispatch failed, falling back to sync"))
                _sync_members_to_workspace(department, workspace)
            return Response(
                {
                    "detail": "Staff are being added to workspace",
                    "async": True,
                    "staff_count": staff_count,
                    "managers_added": managers_added,
                },
                status=status.HTTP_202_ACCEPTED,
            )
        else:
            _sync_members_to_workspace(department, workspace)

        serializer = DepartmentSerializer(department)
        return Response({**serializer.data, "managers_added": managers_added}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        """Unlink department from workspace (does NOT remove existing workspace members)."""
        department = Department.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not department:
            return Response({"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND)

        department.linked_workspace = None
        department.save(update_fields=["linked_workspace"])
        return Response(status=status.HTTP_204_NO_CONTENT)


def _add_managers_to_workspace(department, workspace):
    """Add dept managers from the current dept + all ancestors as Admin (role=20) to workspace.

    Collects managers from two sources per dept in the ancestor chain:
      1. StaffProfile records with is_department_manager=True (primary source)
      2. Department.manager FK (fallback/secondary source)

    Returns list of added manager info dicts for API response.
    """
    from plane.db.models import StaffProfile

    managers_added = []
    seen_ids = set()

    def _ensure_admin(user):
        """Ensure user is an active Admin WorkspaceMember; create or upgrade as needed."""
        if user.id in seen_ids:
            return
        seen_ids.add(user.id)

        # Use deleted_at__isnull=True to avoid matching soft-deleted records
        existing = WorkspaceMember.objects.filter(
            workspace=workspace, member=user, deleted_at__isnull=True
        ).first()

        if existing:
            fields = []
            if existing.role < 20:
                existing.role = 20
                fields.append("role")
            if not existing.is_active:
                existing.is_active = True
                fields.append("is_active")
            if fields:
                existing.save(update_fields=fields)
        else:
            WorkspaceMember.objects.create(workspace=workspace, member=user, role=20, is_active=True)

        managers_added.append(
            {
                "id": str(user.id),
                "display_name": getattr(user, "display_name", None) or user.email,
                "email": user.email,
            }
        )

    current = department
    while current:
        # Source 1: StaffProfile.is_department_manager=True (active staff flagged as managers)
        dept_managers = StaffProfile.objects.filter(
            department=current,
            is_department_manager=True,
            employment_status="active",
            deleted_at__isnull=True,
        ).select_related("user")
        for staff in dept_managers:
            _ensure_admin(staff.user)

        # Source 2: Department.manager FK (if set)
        if current.manager_id:
            _ensure_admin(current.manager)

        current = current.parent

    return managers_added


def _sync_members_to_workspace(department, workspace):
    """Add all active staff in department as WorkspaceMembers (role=15 member).

    Managers are handled separately by _add_managers_to_workspace with role=20.
    This only handles regular staff (role=15).
    """
    from plane.db.models import StaffProfile

    staff_list = StaffProfile.objects.filter(
        department=department,
        employment_status="active",
        deleted_at__isnull=True,
    ).select_related("user")

    for staff in staff_list:
        # Only create if no active record exists — avoid matching soft-deleted records
        if not WorkspaceMember.objects.filter(workspace=workspace, member=staff.user, deleted_at__isnull=True).exists():
            WorkspaceMember.objects.create(workspace=workspace, member=staff.user, role=15, is_active=True)


def _join_descendant_workspaces(department, user, depth=0):
    """Recursively join user to all descendant departments' linked workspaces (max 6 levels)."""
    if depth >= 6:
        return
    children = Department.objects.filter(parent=department, deleted_at__isnull=True)
    for child in children:
        if child.linked_workspace:
            if not WorkspaceMember.objects.filter(workspace=child.linked_workspace, member=user, deleted_at__isnull=True).exists():
                WorkspaceMember.objects.create(workspace=child.linked_workspace, member=user, role=15, is_active=True)
        _join_descendant_workspaces(child, user, depth + 1)
