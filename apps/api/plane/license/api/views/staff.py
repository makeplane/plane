# Python imports
import csv
import io
import secrets

# Django imports
from django.db import transaction
from django.db.models import Count, Q
from django.http import HttpResponse

# Third party imports
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

# Module imports
from plane.app.serializers.staff import (
    StaffProfileCreateSerializer,
    StaffProfileSerializer,
)
from plane.db.models import Department, StaffProfile, User, WorkspaceMember
from plane.license.api.views.base import BaseAPIView
from plane.utils.exception_logger import log_exception


class InstanceStaffEndpoint(BaseAPIView):
    """List all staff (instance-level) and create new staff profiles."""

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

    def get(self, request):
        staff = (
            StaffProfile.objects.filter(deleted_at__isnull=True)
            .select_related("user", "department")
        )

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

        ordering = request.query_params.get("ordering", "staff_id")
        if ordering not in self.ALLOWED_ORDERINGS:
            ordering = "staff_id"

        return self.paginate(
            request=request,
            queryset=staff,
            on_results=lambda results: StaffProfileSerializer(results, many=True).data,
            default_per_page=50,
            max_per_page=200,
            order_by=ordering,
        )

    def post(self, request):
        create_serializer = StaffProfileCreateSerializer(data=request.data)
        if not create_serializer.is_valid():
            return Response(create_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = create_serializer.validated_data

        if StaffProfile.objects.filter(staff_id=data["staff_id"], deleted_at__isnull=True).exists():
            return Response(
                {"error": f"Staff ID {data['staff_id']} already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        department = None
        if data.get("department"):
            department = Department.objects.filter(
                pk=data["department"], deleted_at__isnull=True
            ).first()
            if not department:
                return Response({"error": "Department not found"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                staff_profile = _create_staff(department, data)
        except Exception as e:
            log_exception(e)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = StaffProfileSerializer(staff_profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class InstanceStaffDetailEndpoint(BaseAPIView):
    """Retrieve, update, delete a staff profile by pk."""

    def get(self, request, pk):
        staff = (
            StaffProfile.objects.filter(pk=pk, deleted_at__isnull=True)
            .select_related("user", "department")
            .first()
        )
        if not staff:
            return Response({"error": "Staff not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = StaffProfileSerializer(staff)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        staff = StaffProfile.objects.select_related("user").filter(pk=pk, deleted_at__isnull=True).first()
        if not staff:
            return Response({"error": "Staff not found"}, status=status.HTTP_404_NOT_FOUND)

        # Update user-level fields that are read-only on the serializer
        user_fields = {}
        if "display_name" in request.data:
            user_fields["display_name"] = request.data["display_name"]
        if "first_name" in request.data:
            user_fields["first_name"] = request.data["first_name"]
        if "last_name" in request.data:
            user_fields["last_name"] = request.data["last_name"]
        if user_fields:
            for field, value in user_fields.items():
                setattr(staff.user, field, value)
            staff.user.save(update_fields=list(user_fields.keys()))

        serializer = StaffProfileSerializer(staff, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        staff = StaffProfile.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not staff:
            return Response({"error": "Staff not found"}, status=status.HTTP_404_NOT_FOUND)
        staff.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InstanceStaffTransferEndpoint(BaseAPIView):
    """Transfer staff to another department, updating workspace membership."""

    def post(self, request, pk):
        new_dept_id = request.data.get("department_id")
        if not new_dept_id:
            return Response({"error": "department_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        new_dept = Department.objects.filter(pk=new_dept_id, deleted_at__isnull=True).first()
        if not new_dept:
            return Response({"error": "Department not found"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            staff = (
                StaffProfile.objects.select_for_update()
                .filter(pk=pk, deleted_at__isnull=True)
                .select_related("department", "user")
                .first()
            )
            if not staff:
                return Response({"error": "Staff not found"}, status=status.HTTP_404_NOT_FOUND)

            old_dept = staff.department
            user = staff.user
            old_ws = old_dept.linked_workspace if old_dept else None
            new_ws = new_dept.linked_workspace

            # Skip membership changes if same workspace
            if old_ws != new_ws:
                # Remove from old workspace (role=15 only, never remove admins)
                if old_ws:
                    WorkspaceMember.objects.filter(
                        workspace=old_ws, member=user, role=15
                    ).delete()
                # Add to new workspace
                if new_ws:
                    WorkspaceMember.objects.get_or_create(
                        workspace=new_ws,
                        member=user,
                        defaults={"role": 15},
                    )

            staff.department = new_dept
            staff.save(update_fields=["department"])

            # If manager in new dept, join descendant workspaces
            if staff.is_department_manager:
                from plane.license.api.views.department import _join_descendant_workspaces
                _join_descendant_workspaces(new_dept, user)

        serializer = StaffProfileSerializer(staff)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InstanceStaffDeactivateEndpoint(BaseAPIView):
    """Deactivate staff: remove role=15 workspace memberships, disable user account."""

    def post(self, request, pk):
        staff = (
            StaffProfile.objects.filter(pk=pk, deleted_at__isnull=True)
            .select_related("user")
            .first()
        )
        if not staff:
            return Response({"error": "Staff not found"}, status=status.HTTP_404_NOT_FOUND)

        user = staff.user

        with transaction.atomic():
            # Remove role=15 WorkspaceMember(s) across all workspaces (never remove admins)
            WorkspaceMember.objects.filter(member=user, role=15).delete()

            # Deactivate user account
            User.objects.filter(pk=user.pk).update(is_active=False)

            # Update staff status
            staff.employment_status = "resigned"
            staff.save(update_fields=["employment_status"])

        serializer = StaffProfileSerializer(staff)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InstanceStaffBulkImportEndpoint(BaseAPIView):
    """Bulk import staff from CSV file."""

    parser_classes = [MultiPartParser, FormParser]

    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
    MAX_ROWS = 5000

    def post(self, request):
        csv_file = request.FILES.get("file")
        if not csv_file:
            return Response({"error": "CSV file is required"}, status=status.HTTP_400_BAD_REQUEST)

        if csv_file.size > self.MAX_FILE_SIZE:
            return Response(
                {"error": f"File too large. Maximum size is {self.MAX_FILE_SIZE // (1024 * 1024)}MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        default_password = request.data.get("default_password")
        if not default_password:
            return Response({"error": "default_password is required"}, status=status.HTTP_400_BAD_REQUEST)

        skip_existing = request.data.get("skip_existing", "true").lower() == "true"
        update_existing = request.data.get("update_existing", "false").lower() == "true"

        try:
            decoded = csv_file.read().decode("utf-8-sig")
            reader = csv.DictReader(io.StringIO(decoded))
            # Strip whitespace from header column names to handle "col1, col2" style headers
            if reader.fieldnames:
                reader.fieldnames = [f.strip() for f in reader.fieldnames]
        except Exception as e:
            return Response({"error": f"Failed to parse CSV: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        created = 0
        updated = 0
        skipped = 0
        errors = []

        for row_num, row in enumerate(reader, start=2):
            if row_num > self.MAX_ROWS + 1:
                errors.append(f"Import stopped: exceeded maximum of {self.MAX_ROWS} rows.")
                break

            staff_id = row.get("staff_id", "").strip()
            if not staff_id:
                errors.append(f"Row {row_num}: missing staff_id")
                continue

            existing_profile = StaffProfile.objects.filter(staff_id=staff_id, deleted_at__isnull=True).first()

            if existing_profile:
                if update_existing:
                    dept_code = row.get("department_code", "").strip()
                    department = None
                    if dept_code:
                        department = Department.objects.filter(code=dept_code, deleted_at__isnull=True).first()

                    data = {
                        "first_name": row.get("first_name", "").strip(),
                        "last_name": row.get("last_name", "").strip(),
                        "display_name": row.get("display_name", "").strip(),
                        "position": row.get("position", "").strip(),
                        "job_grade": row.get("job_grade", "").strip(),
                        "phone": row.get("phone", "").strip(),
                        "date_of_joining": row.get("date_of_joining", "").strip() or None,
                    }

                    try:
                        with transaction.atomic():
                            _update_staff(existing_profile, department, data)
                        updated += 1
                    except Exception as e:
                        errors.append(f"Row {row_num} ({staff_id}): {str(e)}")
                elif skip_existing:
                    skipped += 1
                continue

            dept_code = row.get("department_code", "").strip()
            department = None
            if dept_code:
                department = Department.objects.filter(code=dept_code, deleted_at__isnull=True).first()

            data = {
                "staff_id": staff_id,
                "first_name": row.get("first_name", "").strip(),
                "last_name": row.get("last_name", "").strip(),
                "display_name": row.get("display_name", "").strip(),
                "position": row.get("position", "").strip(),
                "job_grade": row.get("job_grade", "").strip(),
                "phone": row.get("phone", "").strip(),
                "date_of_joining": row.get("date_of_joining", "").strip() or None,
                "is_department_manager": False,
                "password": default_password,
            }

            try:
                with transaction.atomic():
                    _create_staff(department, data)
                created += 1
            except Exception as e:
                errors.append(f"Row {row_num} ({staff_id}): {str(e)}")

        return Response({"created": created, "updated": updated, "skipped": skipped, "errors": errors}, status=status.HTTP_200_OK)


class InstanceStaffBulkActionEndpoint(BaseAPIView):
    """Bulk operations: transfer, change status, or delete multiple staff."""

    def post(self, request):
        action = request.data.get("action")
        staff_ids = request.data.get("staff_ids", [])

        if not staff_ids or not isinstance(staff_ids, list):
            return Response({"error": "staff_ids must be a non-empty list"}, status=status.HTTP_400_BAD_REQUEST)

        if len(staff_ids) > 100:
            return Response({"error": "Cannot process more than 100 staff at a time"}, status=status.HTTP_400_BAD_REQUEST)

        staff_qs = StaffProfile.objects.filter(
            id__in=staff_ids, deleted_at__isnull=True
        ).select_related("user", "department")

        if action == "transfer":
            return self._bulk_transfer(request, staff_qs)
        elif action == "status":
            return self._bulk_status(request, staff_qs)
        elif action == "delete":
            return self._bulk_delete(staff_qs)
        else:
            return Response(
                {"error": "Invalid action. Must be 'transfer', 'status', or 'delete'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def _bulk_transfer(self, request, staff_qs):
        department_id = request.data.get("department_id")
        if not department_id:
            return Response({"error": "department_id is required for transfer"}, status=status.HTTP_400_BAD_REQUEST)

        new_dept = Department.objects.filter(pk=department_id, deleted_at__isnull=True).first()
        if not new_dept:
            return Response({"error": "Department not found"}, status=status.HTTP_400_BAD_REQUEST)

        new_ws = new_dept.linked_workspace

        with transaction.atomic():
            for staff in staff_qs:
                old_dept = staff.department
                user = staff.user
                old_ws = old_dept.linked_workspace if old_dept else None

                if old_ws != new_ws:
                    if old_ws:
                        WorkspaceMember.objects.filter(workspace=old_ws, member=user, role=15).delete()
                    if new_ws:
                        WorkspaceMember.objects.get_or_create(
                            workspace=new_ws, member=user, defaults={"role": 15}
                        )

                staff.department = new_dept
                staff.save(update_fields=["department"])

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


class InstanceStaffExportEndpoint(BaseAPIView):
    """Export all staff as CSV (instance-level)."""

    def get(self, request):
        staff_list = (
            StaffProfile.objects.filter(deleted_at__isnull=True)
            .select_related("user", "department")
            .order_by("staff_id")
        )

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="staff_export.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "staff_id", "last_name", "first_name", "display_name", "email",
            "department_code", "department_name", "position",
            "job_grade", "phone", "date_of_joining", "employment_status",
            "is_department_manager",
        ])

        for staff in staff_list:
            writer.writerow([
                staff.staff_id,
                staff.user.last_name,
                staff.user.first_name,
                staff.user.display_name,
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


class InstanceStaffStatsEndpoint(BaseAPIView):
    """Staff statistics: total, by department, by status (instance-level)."""

    def get(self, request):
        base_qs = StaffProfile.objects.filter(deleted_at__isnull=True)
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


def _update_staff(staff_profile, department, data):
    """Update User + StaffProfile fields for an existing staff member."""
    user = staff_profile.user

    # Update User name fields
    user.first_name = data.get("first_name", user.first_name)
    user.last_name = data.get("last_name", user.last_name)
    display_name = data.get("display_name")
    if display_name:
        user.display_name = display_name
    user.save(update_fields=["first_name", "last_name", "display_name"])

    # Update StaffProfile fields
    if department is not None:
        staff_profile.department = department
    staff_profile.position = data.get("position", staff_profile.position)
    staff_profile.job_grade = data.get("job_grade", staff_profile.job_grade)
    staff_profile.phone = data.get("phone", staff_profile.phone)
    if data.get("date_of_joining") is not None:
        staff_profile.date_of_joining = data["date_of_joining"]
    staff_profile.save(update_fields=["department_id", "position", "job_grade", "phone", "date_of_joining"])

    return staff_profile


def _create_staff(department, data):
    """Create User + WorkspaceMember (if dept has linked_workspace) + StaffProfile."""
    email = f"sh{data['staff_id']}@swing.shinhan.com"

    user, user_created = User.objects.get_or_create(
        email=email,
        defaults={
            "username": email,
            "first_name": data.get("first_name", ""),
            "last_name": data.get("last_name", ""),
            "display_name": data.get("display_name") or f"{data.get('last_name', '')} {data.get('first_name', '')}".strip(),
        },
    )
    if user_created:
        password = data.get("password") or secrets.token_urlsafe(16)
        user.set_password(password)
        user.save(update_fields=["password"])

    # Auto-join linked_workspace if department has one
    if department and department.linked_workspace:
        WorkspaceMember.objects.get_or_create(
            workspace=department.linked_workspace,
            member=user,
            defaults={"role": 15},
        )

    staff_profile = StaffProfile.objects.create(
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

    # If manager, join all descendant linked_workspaces
    if staff_profile.is_department_manager and department:
        from plane.license.api.views.department import _join_descendant_workspaces
        _join_descendant_workspaces(department, user)

    return staff_profile
