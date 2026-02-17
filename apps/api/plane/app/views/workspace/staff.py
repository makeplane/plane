# Python imports
import csv
import io

# Django imports
from django.db import transaction
from django.db.models import Count, Q
from django.http import HttpResponse

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

# Module imports
from plane.app.permissions import WorkSpaceAdminPermission
from plane.app.serializers.staff import StaffProfileSerializer, StaffProfileCreateSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import (
    Department,
    ProjectMember,
    StaffProfile,
    User,
    Workspace,
    WorkspaceMember,
)
from plane.utils.exception_logger import log_exception


class StaffEndpoint(BaseAPIView):
    """List and create staff profiles."""

    permission_classes = [WorkSpaceAdminPermission]

    def get(self, request, slug):
        staff = (
            StaffProfile.objects.filter(
                workspace__slug=slug,
                deleted_at__isnull=True,
            )
            .select_related("user", "department")
        )

        # Filters
        department = request.query_params.get("department")
        if department:
            staff = staff.filter(department_id=department)

        emp_status = request.query_params.get("status")
        if emp_status:
            staff = staff.filter(employment_status=emp_status)

        search = request.query_params.get("search")
        if search:
            staff = staff.filter(
                Q(staff_id__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(user__display_name__icontains=search)
            )

        serializer = StaffProfileSerializer(staff, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug):
        """Create staff: auto-create User + WorkspaceMember + ProjectMember."""
        create_serializer = StaffProfileCreateSerializer(data=request.data)
        if not create_serializer.is_valid():
            return Response(create_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = create_serializer.validated_data
        workspace = Workspace.objects.get(slug=slug)

        # Check duplicate staff_id
        if StaffProfile.objects.filter(
            workspace=workspace, staff_id=data["staff_id"], deleted_at__isnull=True
        ).exists():
            return Response(
                {"error": f"Staff ID {data['staff_id']} already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        department = None
        if data.get("department_id"):
            department = Department.objects.filter(
                pk=data["department_id"], workspace=workspace, deleted_at__isnull=True
            ).first()
            if not department:
                return Response(
                    {"error": "Department not found"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            with transaction.atomic():
                staff_profile = _create_staff(workspace, department, data, request.user)
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = StaffProfileSerializer(staff_profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class StaffDetailEndpoint(BaseAPIView):
    """Retrieve, update, delete a staff profile."""

    permission_classes = [WorkSpaceAdminPermission]

    def get(self, request, slug, pk):
        staff = (
            StaffProfile.objects.filter(
                workspace__slug=slug, pk=pk, deleted_at__isnull=True
            )
            .select_related("user", "department")
            .first()
        )
        if not staff:
            return Response(
                {"error": "Staff not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = StaffProfileSerializer(staff)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, slug, pk):
        staff = StaffProfile.objects.filter(
            workspace__slug=slug, pk=pk, deleted_at__isnull=True
        ).first()
        if not staff:
            return Response(
                {"error": "Staff not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = StaffProfileSerializer(staff, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, pk):
        staff = StaffProfile.objects.filter(
            workspace__slug=slug, pk=pk, deleted_at__isnull=True
        ).first()
        if not staff:
            return Response(
                {"error": "Staff not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        staff.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StaffTransferEndpoint(BaseAPIView):
    """Transfer staff to another department."""

    permission_classes = [WorkSpaceAdminPermission]

    def post(self, request, slug, pk):
        new_dept_id = request.data.get("department_id")
        if not new_dept_id:
            return Response(
                {"error": "department_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_dept = Department.objects.filter(
            pk=new_dept_id,
            workspace__slug=slug,
            deleted_at__isnull=True,
        ).first()
        if not new_dept:
            return Response(
                {"error": "Department not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # Lock staff row to prevent race conditions
            staff = StaffProfile.objects.select_for_update().filter(
                workspace__slug=slug, pk=pk, deleted_at__isnull=True
            ).select_related("department", "user").first()
            if not staff:
                return Response(
                    {"error": "Staff not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            old_dept = staff.department
            user = staff.user
            # Remove from old department's linked project (if any)
            if old_dept and old_dept.linked_project:
                ProjectMember.objects.filter(
                    project=old_dept.linked_project, member=user
                ).delete()

            # Update department
            staff.department = new_dept
            staff.save(update_fields=["department"])

            # Add to new department's linked project (if any)
            if new_dept.linked_project:
                role = 20 if staff.is_department_manager else 15
                ProjectMember.objects.get_or_create(
                    project=new_dept.linked_project,
                    member=user,
                    defaults={"role": role},
                )

        serializer = StaffProfileSerializer(staff)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StaffDeactivateEndpoint(BaseAPIView):
    """Deactivate staff: remove all memberships, disable user."""

    permission_classes = [WorkSpaceAdminPermission]

    def post(self, request, slug, pk):
        staff = StaffProfile.objects.filter(
            workspace__slug=slug, pk=pk, deleted_at__isnull=True
        ).select_related("user").first()
        if not staff:
            return Response(
                {"error": "Staff not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = staff.user

        workspace = Workspace.objects.get(slug=slug)

        with transaction.atomic():
            # Remove ProjectMember entries within this workspace only
            ProjectMember.objects.filter(
                member=user,
                project__workspace=workspace,
            ).delete()

            # Deactivate WorkspaceMember in this workspace only
            WorkspaceMember.objects.filter(
                member=user,
                workspace=workspace,
            ).update(is_active=False)

            # Deactivate user
            user.is_active = False
            user.save(update_fields=["is_active"])

            # Update staff status
            staff.employment_status = "resigned"
            staff.save(update_fields=["employment_status"])

        serializer = StaffProfileSerializer(staff)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StaffBulkImportEndpoint(BaseAPIView):
    """Bulk import staff from CSV."""

    permission_classes = [WorkSpaceAdminPermission]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, slug):
        csv_file = request.FILES.get("file")
        if not csv_file:
            return Response(
                {"error": "CSV file is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        default_password = request.data.get("default_password")
        if not default_password:
            return Response(
                {"error": "default_password is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        skip_existing = request.data.get("skip_existing", "true").lower() == "true"

        workspace = Workspace.objects.get(slug=slug)

        try:
            decoded = csv_file.read().decode("utf-8")
            reader = csv.DictReader(io.StringIO(decoded))
        except Exception as e:
            return Response(
                {"error": f"Failed to parse CSV: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = 0
        skipped = 0
        errors = []

        for row_num, row in enumerate(reader, start=2):
            staff_id = row.get("staff_id", "").strip()
            if not staff_id:
                errors.append(f"Row {row_num}: missing staff_id")
                continue

            # Skip existing
            if skip_existing and StaffProfile.objects.filter(
                workspace=workspace, staff_id=staff_id, deleted_at__isnull=True
            ).exists():
                skipped += 1
                continue

            dept_code = row.get("department_code", "").strip()
            department = None
            if dept_code:
                department = Department.objects.filter(
                    workspace=workspace, code=dept_code, deleted_at__isnull=True
                ).first()

            data = {
                "staff_id": staff_id,
                "first_name": row.get("first_name", "").strip(),
                "last_name": row.get("last_name", "").strip(),
                "position": row.get("position", "").strip(),
                "job_grade": row.get("job_grade", "").strip(),
                "phone": row.get("phone", "").strip(),
                "date_of_joining": row.get("date_of_joining", "").strip() or None,
                "is_department_manager": False,
                "password": default_password,
            }

            try:
                with transaction.atomic():
                    _create_staff(workspace, department, data, request.user)
                created += 1
            except Exception as e:
                errors.append(f"Row {row_num} ({staff_id}): {str(e)}")

        return Response(
            {
                "created": created,
                "skipped": skipped,
                "errors": errors,
            },
            status=status.HTTP_200_OK,
        )


class StaffExportEndpoint(BaseAPIView):
    """Export staff list as CSV."""

    permission_classes = [WorkSpaceAdminPermission]

    def get(self, request, slug):
        staff_list = (
            StaffProfile.objects.filter(
                workspace__slug=slug,
                deleted_at__isnull=True,
            )
            .select_related("user", "department")
            .order_by("staff_id")
        )

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="staff_export.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "staff_id", "last_name", "first_name", "email",
            "department_code", "department_name", "position",
            "job_grade", "phone", "date_of_joining", "employment_status",
            "is_department_manager",
        ])

        for staff in staff_list:
            writer.writerow([
                staff.staff_id,
                staff.user.last_name,
                staff.user.first_name,
                staff.user.email,
                staff.department.code if staff.department else "",
                staff.department.name if staff.department else "",
                staff.position,
                staff.job_grade,
                staff.phone,
                staff.date_of_joining or "",
                staff.employment_status,
                staff.is_department_manager,
            ])

        return response


class StaffStatsEndpoint(BaseAPIView):
    """Staff statistics: total, by department, by status."""

    permission_classes = [WorkSpaceAdminPermission]

    def get(self, request, slug):
        base_qs = StaffProfile.objects.filter(
            workspace__slug=slug,
            deleted_at__isnull=True,
        )

        total = base_qs.count()

        by_status = {}
        for row in base_qs.values("employment_status").annotate(count=Count("id")):
            by_status[row["employment_status"]] = row["count"]

        by_department = []
        for row in (
            base_qs.values("department__id", "department__name", "department__code")
            .annotate(count=Count("id"))
            .order_by("department__name")
        ):
            by_department.append({
                "department_id": str(row["department__id"]) if row["department__id"] else None,
                "department_name": row["department__name"] or "Unassigned",
                "department_code": row["department__code"] or "",
                "count": row["count"],
            })

        return Response(
            {
                "total": total,
                "active": by_status.get("active", 0),
                "probation": by_status.get("probation", 0),
                "resigned": by_status.get("resigned", 0),
                "suspended": by_status.get("suspended", 0),
                "transferred": by_status.get("transferred", 0),
                "by_status": by_status,
                "by_department": by_department,
            },
            status=status.HTTP_200_OK,
        )


def _create_staff(workspace, department, data, created_by):
    """Helper: create User + WorkspaceMember + StaffProfile + ProjectMember."""
    email = f"sh{data['staff_id']}@swing.shinhan.com"

    # Create or get user
    user, user_created = User.objects.get_or_create(
        email=email,
        defaults={
            "username": email,
            "first_name": data.get("first_name", ""),
            "last_name": data.get("last_name", ""),
            "display_name": f"{data.get('last_name', '')} {data.get('first_name', '')}".strip(),
        },
    )
    if user_created and data.get("password"):
        user.set_password(data["password"])
        user.save(update_fields=["password"])

    # Create WorkspaceMember
    WorkspaceMember.objects.get_or_create(
        workspace=workspace,
        member=user,
        defaults={"role": 15},
    )

    # Create StaffProfile
    staff_profile = StaffProfile.objects.create(
        workspace=workspace,
        user=user,
        staff_id=data["staff_id"],
        department=department,
        position=data.get("position", ""),
        job_grade=data.get("job_grade", ""),
        phone=data.get("phone", ""),
        date_of_joining=data.get("date_of_joining"),
        is_department_manager=data.get("is_department_manager", False),
        notes=data.get("notes", ""),
    )

    # Auto-add to linked project
    if department and department.linked_project:
        role = 20 if staff_profile.is_department_manager else 15
        ProjectMember.objects.get_or_create(
            project=department.linked_project,
            member=user,
            defaults={"role": role},
        )

    # If manager, auto-join children projects
    if staff_profile.is_department_manager and department:
        _join_children_projects(department, user)

    return staff_profile


def _join_children_projects(department, user):
    """Recursively join all descendant linked projects."""
    children = Department.objects.filter(
        parent=department, deleted_at__isnull=True
    )
    for child in children:
        if child.linked_project:
            ProjectMember.objects.get_or_create(
                project=child.linked_project,
                member=user,
                defaults={"role": 15},
            )
        _join_children_projects(child, user)
