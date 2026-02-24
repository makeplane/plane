# Python imports
import csv
import io
import json

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.db.models import Count, Q
from django.http import HttpResponse

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

# Module imports
from plane.app.permissions import WorkSpaceAdminPermission, WorkspaceEntityPermission
from plane.app.serializers.staff import StaffProfileSerializer, StaffProfileCreateSerializer, MyStaffProfileSerializer
from plane.app.views.base import BaseAPIView
from plane.bgtasks.webhook_task import model_activity
from plane.db.models import (
    Department,
    ProjectMember,
    StaffProfile,
    User,
    Workspace,
    WorkspaceMember,
)
from plane.utils.exception_logger import log_exception
from plane.utils.host import base_host


class MyStaffProfileEndpoint(BaseAPIView):
    """Current user's own staff profile — read-only, no admin required."""

    permission_classes = [WorkspaceEntityPermission]

    def get(self, request, slug):
        try:
            staff = StaffProfile.objects.select_related("department").get(
                workspace__slug=slug,
                user=request.user,
                deleted_at__isnull=True,
            )
        except StaffProfile.DoesNotExist:
            return Response(
                {"detail": "Staff profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = MyStaffProfileSerializer(staff)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StaffEndpoint(BaseAPIView):
    """List and create staff profiles."""

    permission_classes = [WorkSpaceAdminPermission]

    ALLOWED_ORDERINGS = {
        "staff_id", "-staff_id",
        "display_name", "-display_name",
        "department__name", "-department__name",
        "employment_status", "-employment_status",
        "position", "-position",
        "job_grade", "-job_grade",
        "date_of_joining", "-date_of_joining",
        "created_at", "-created_at",
    }

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
                | Q(phone__icontains=search)
            )

        # Ordering
        ordering = request.query_params.get("ordering", "staff_id")
        if ordering not in self.ALLOWED_ORDERINGS:
            ordering = "staff_id"

        # Use cursor-based pagination from BasePaginator
        return self.paginate(
            request=request,
            queryset=staff,
            on_results=lambda results: StaffProfileSerializer(results, many=True).data,
            default_per_page=50,
            max_per_page=200,
            order_by=ordering,
        )

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
        model_activity.delay(
            model_name="staff",
            model_id=str(staff_profile.id),
            requested_data=request.data,
            current_instance=None,
            actor_id=request.user.id,
            slug=slug,
            origin=base_host(request=request, is_app=True),
        )
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
        current_instance = json.dumps(
            StaffProfileSerializer(staff).data, cls=DjangoJSONEncoder
        )
        serializer = StaffProfileSerializer(staff, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            model_activity.delay(
                model_name="staff",
                model_id=str(staff.id),
                requested_data=request.data,
                current_instance=current_instance,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )
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
        current_instance = json.dumps(
            StaffProfileSerializer(staff).data, cls=DjangoJSONEncoder
        )
        staff.delete()
        model_activity.delay(
            model_name="staff",
            model_id=str(pk),
            requested_data=None,
            current_instance=current_instance,
            actor_id=request.user.id,
            slug=slug,
            origin=base_host(request=request, is_app=True),
        )
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
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
        MAX_ROWS = 5000

        csv_file = request.FILES.get("file")
        if not csv_file:
            return Response(
                {"error": "CSV file is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if csv_file.size > MAX_FILE_SIZE:
            return Response(
                {"error": f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)}MB."},
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
            if row_num > MAX_ROWS + 1:
                errors.append(f"Import stopped: exceeded maximum of {MAX_ROWS} rows.")
                break

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

        if created > 0:
            model_activity.delay(
                model_name="staff",
                model_id=None,
                requested_data={"action": "bulk_import", "created": created, "skipped": skipped},
                current_instance=None,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )

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


class StaffBulkActionEndpoint(BaseAPIView):
    """Bulk operations on staff: transfer, change status, delete."""

    permission_classes = [WorkSpaceAdminPermission]

    def post(self, request, slug):
        action = request.data.get("action")
        staff_ids = request.data.get("staff_ids", [])

        if not staff_ids or not isinstance(staff_ids, list):
            return Response(
                {"error": "staff_ids must be a non-empty list"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(staff_ids) > 100:
            return Response(
                {"error": "Cannot process more than 100 staff at a time"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.get(slug=slug)
        staff_qs = StaffProfile.objects.filter(
            workspace=workspace,
            id__in=staff_ids,
            deleted_at__isnull=True,
        ).select_related("user", "department")

        if action == "transfer":
            return self._bulk_transfer(request, workspace, staff_qs)
        elif action == "status":
            return self._bulk_status(request, staff_qs)
        elif action == "delete":
            return self._bulk_delete(staff_qs)
        else:
            return Response(
                {"error": "Invalid action. Must be 'transfer', 'status', or 'delete'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def _bulk_transfer(self, request, workspace, staff_qs):
        department_id = request.data.get("department_id")
        if not department_id:
            return Response(
                {"error": "department_id is required for transfer"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_dept = Department.objects.filter(
            pk=department_id,
            workspace=workspace,
            deleted_at__isnull=True,
        ).first()
        if not new_dept:
            return Response(
                {"error": "Department not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            for staff in staff_qs:
                old_dept = staff.department
                user = staff.user
                # Remove from old project
                if old_dept and old_dept.linked_project:
                    ProjectMember.objects.filter(
                        project=old_dept.linked_project, member=user
                    ).delete()
                # Update department
                staff.department = new_dept
                staff.save(update_fields=["department"])
                # Add to new project
                if new_dept.linked_project:
                    role = 20 if staff.is_department_manager else 15
                    ProjectMember.objects.get_or_create(
                        project=new_dept.linked_project,
                        member=user,
                        defaults={"role": role},
                    )

        return Response({"updated": staff_qs.count()}, status=status.HTTP_200_OK)

    def _bulk_status(self, request, staff_qs):
        new_status = request.data.get("employment_status")
        valid_statuses = ["active", "probation", "resigned", "suspended", "transferred"]
        if new_status not in valid_statuses:
            return Response(
                {"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated = staff_qs.update(employment_status=new_status)
        return Response({"updated": updated}, status=status.HTTP_200_OK)

    def _bulk_delete(self, staff_qs):
        count = staff_qs.count()
        staff_qs.delete()
        return Response({"deleted": count}, status=status.HTTP_204_NO_CONTENT)


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
