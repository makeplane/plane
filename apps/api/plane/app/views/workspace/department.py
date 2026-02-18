# Django imports
from django.db import transaction
from django.db.models import Count, Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import WorkSpaceAdminPermission, WorkspaceEntityPermission
from plane.app.serializers.department import DepartmentSerializer, DepartmentTreeSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import Department, Project, ProjectMember, Workspace
from plane.utils.exception_logger import log_exception


class DepartmentEndpoint(BaseAPIView):
    """List and create departments (flat)."""

    def get_permissions(self):
        if self.request.method == "GET":
            self.permission_classes = [WorkspaceEntityPermission]
        else:
            self.permission_classes = [WorkSpaceAdminPermission]
        return super().get_permissions()

    def get(self, request, slug):
        departments = (
            Department.objects.filter(
                workspace__slug=slug,
                deleted_at__isnull=True,
            )
            .select_related("manager", "linked_project")
            .annotate(
                staff_count=Count(
                    "staff_members",
                    filter=Q(staff_members__deleted_at__isnull=True),
                )
            )
        )

        # Optional filters
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

    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = DepartmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace=workspace)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DepartmentDetailEndpoint(BaseAPIView):
    """Retrieve, update, delete a department."""

    def get_permissions(self):
        if self.request.method == "GET":
            self.permission_classes = [WorkspaceEntityPermission]
        else:
            self.permission_classes = [WorkSpaceAdminPermission]
        return super().get_permissions()

    def get(self, request, slug, pk):
        department = (
            Department.objects.filter(
                workspace__slug=slug,
                pk=pk,
                deleted_at__isnull=True,
            )
            .select_related("manager", "linked_project")
            .annotate(
                staff_count=Count(
                    "staff_members",
                    filter=Q(staff_members__deleted_at__isnull=True),
                )
            )
            .first()
        )
        if not department:
            return Response(
                {"error": "Department not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = DepartmentSerializer(department)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, slug, pk):
        department = Department.objects.filter(
            workspace__slug=slug, pk=pk, deleted_at__isnull=True
        ).first()
        if not department:
            return Response(
                {"error": "Department not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = DepartmentSerializer(department, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, pk):
        department = Department.objects.filter(
            workspace__slug=slug, pk=pk, deleted_at__isnull=True
        ).first()
        if not department:
            return Response(
                {"error": "Department not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        # Soft delete
        department.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DepartmentTreeEndpoint(BaseAPIView):
    """Full nested tree of departments."""

    permission_classes = [WorkspaceEntityPermission]

    def get(self, request, slug):
        # Get only root departments (no parent)
        root_departments = (
            Department.objects.filter(
                workspace__slug=slug,
                parent__isnull=True,
                deleted_at__isnull=True,
            )
            .select_related("manager", "linked_project")
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


class DepartmentStaffEndpoint(BaseAPIView):
    """List staff in a department."""

    permission_classes = [WorkspaceEntityPermission]

    def get(self, request, slug, pk):
        from plane.app.serializers.staff import StaffProfileSerializer
        from plane.db.models import StaffProfile

        staff = (
            StaffProfile.objects.filter(
                workspace__slug=slug,
                department_id=pk,
                deleted_at__isnull=True,
            )
            .select_related("user", "department")
        )
        serializer = StaffProfileSerializer(staff, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DepartmentLinkProjectEndpoint(BaseAPIView):
    """Link/unlink a department to a project with auto-sync members."""

    permission_classes = [WorkSpaceAdminPermission]

    def post(self, request, slug, pk):
        """Link department to project — auto-add all staff as ProjectMembers."""
        department = Department.objects.filter(
            workspace__slug=slug, pk=pk, deleted_at__isnull=True
        ).first()
        if not department:
            return Response(
                {"error": "Department not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        project_id = request.data.get("project_id")
        if not project_id:
            return Response(
                {"error": "project_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        project = Project.objects.filter(
            workspace__slug=slug, pk=project_id, deleted_at__isnull=True
        ).first()
        if not project:
            return Response(
                {"error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        with transaction.atomic():
            department.linked_project = project
            department.save(update_fields=["linked_project"])

            # Auto-sync: add all active staff as ProjectMembers
            self._sync_members_to_project(department, project)

        serializer = DepartmentSerializer(department)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, slug, pk):
        """Unlink department from project (does NOT remove members)."""
        department = Department.objects.filter(
            workspace__slug=slug, pk=pk, deleted_at__isnull=True
        ).first()
        if not department:
            return Response(
                {"error": "Department not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        department.linked_project = None
        department.save(update_fields=["linked_project"])

        return Response(status=status.HTTP_204_NO_CONTENT)

    def _sync_members_to_project(self, department, project):
        """Add all active staff in department to the linked project."""
        from plane.db.models import StaffProfile

        staff_list = StaffProfile.objects.filter(
            department=department,
            employment_status="active",
            deleted_at__isnull=True,
        ).select_related("user")

        for staff in staff_list:
            role = 20 if staff.is_department_manager else 15
            ProjectMember.objects.get_or_create(
                project=project,
                member=staff.user,
                defaults={"role": role},
            )

        # Also add managers from parent departments
        parent = department.parent
        while parent:
            if parent.manager:
                ProjectMember.objects.get_or_create(
                    project=project,
                    member=parent.manager,
                    defaults={"role": 15},
                )
            parent = parent.parent
