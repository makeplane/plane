# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Payroll: employees, salary history, adjustments, disbursements.

Admin-only, all of it. The annual cost sits behind a second gate — a PayrollAccess
row that no endpoint here can create, because the people it must be hidden from
are themselves admins. See PayrollAccess and the README.
"""

# Python imports
from datetime import date, timedelta

# Django imports
from django.db.models import Count, Prefetch, Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import (
    AdjustmentSerializer,
    EmployeeSerializer,
    OfficeSerializer,
    PayrollPaymentSerializer,
    SalarySerializer,
)
from plane.db.models import (
    Adjustment,
    Employee,
    Office,
    PayrollAccess,
    PayrollPayment,
    Salary,
    Workspace,
    WorkspaceFeature,
)
from plane.utils.payroll import aguinaldo_for, annual_cost
from plane.utils.workspace_feature import is_workspace_feature_enabled

from ..base import BaseAPIView

# Salaries carry their office everywhere: the aguinaldo days live on it
SALARIES = Prefetch("salaries", queryset=Salary.objects.select_related("office"))


class PayrollBaseView(BaseAPIView):
    """Payroll is gated by the payments feature flag *and* is admin-only.

    The role check is enforced per-handler by @allow_permission; this base only
    guards the module itself.
    """

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        slug = kwargs.get("slug")
        if slug and not is_workspace_feature_enabled(WorkspaceFeature.FeatureKey.PAYMENTS, slug=slug):
            self.permission_denied(request, message="Payments are not enabled for this workspace")


class OfficeEndpoint(PayrollBaseView):
    serializer_class = OfficeSerializer
    model = Office

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        offices = Office.objects.filter(workspace__slug=slug).annotate(
            employee_count=Count("salaries__employee", distinct=True, filter=Q(salaries__deleted_at__isnull=True))
        )
        return Response(OfficeSerializer(offices, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = OfficeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        if Office.objects.filter(workspace=workspace, name__iexact=serializer.validated_data["name"]).exists():
            return Response({"name": ["An office with this name already exists"]}, status=status.HTTP_409_CONFLICT)
        serializer.save(workspace_id=workspace.id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class OfficeDetailEndpoint(PayrollBaseView):
    serializer_class = OfficeSerializer
    model = Office

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, office_id):
        office = Office.objects.get(id=office_id, workspace__slug=slug)
        serializer = OfficeSerializer(office, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, office_id):
        office = Office.objects.get(id=office_id, workspace__slug=slug)
        # Salaries and payments PROTECT their office: deleting one that still
        # pays people would orphan the money trail
        if office.salaries.exists() or office.payments.exists():
            return Response(
                {"error": "This office still has salaries or payments; it cannot be deleted"},
                status=status.HTTP_409_CONFLICT,
            )
        office.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EmployeeEndpoint(PayrollBaseView):
    serializer_class = EmployeeSerializer
    model = Employee

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        employees = Employee.objects.filter(workspace__slug=slug).prefetch_related(SALARIES)

        if request.query_params.get("active") == "1":
            employees = employees.filter(termination_date__isnull=True)
        office_id = request.query_params.get("office")
        if office_id:
            employees = employees.filter(salaries__office_id=office_id).distinct()
        search = request.query_params.get("search")
        if search:
            employees = employees.filter(
                Q(full_name__icontains=search) | Q(email__icontains=search) | Q(position__icontains=search)
            )
        return Response(EmployeeSerializer(employees, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = EmployeeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(workspace_id=workspace.id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EmployeeDetailEndpoint(PayrollBaseView):
    serializer_class = EmployeeSerializer
    model = Employee

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug, employee_id):
        employee = Employee.objects.prefetch_related(SALARIES).get(id=employee_id, workspace__slug=slug)
        return Response(EmployeeSerializer(employee).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, employee_id):
        employee = Employee.objects.get(id=employee_id, workspace__slug=slug)
        serializer = EmployeeSerializer(employee, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(EmployeeSerializer(employee).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, employee_id):
        Employee.objects.get(id=employee_id, workspace__slug=slug).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SalaryEndpoint(PayrollBaseView):
    """An employee's salaries — the full history, and how a raise is recorded."""

    serializer_class = SalarySerializer
    model = Salary

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug, employee_id):
        salaries = Salary.objects.filter(employee_id=employee_id, workspace__slug=slug).select_related("office")
        return Response(SalarySerializer(salaries, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug, employee_id):
        employee = Employee.objects.get(id=employee_id, workspace__slug=slug)
        serializer = SalarySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        office = serializer.validated_data["office"]
        if office.workspace_id != employee.workspace_id:
            return Response({"office": ["Unknown office"]}, status=status.HTTP_400_BAD_REQUEST)

        effective_from = serializer.validated_data["effective_from"]

        # A raise is not an edit: close the running salary for this office the
        # day before the new one starts, and open a new row. That is what keeps
        # the history — and lets the aguinaldo use the rate actually in force.
        running = Salary.objects.filter(
            employee=employee, office=office, effective_to__isnull=True
        ).first()
        if running is not None:
            if effective_from <= running.effective_from:
                return Response(
                    {"effective_from": ["Must be after the current salary started"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            running.effective_to = effective_from - timedelta(days=1)
            running.save(update_fields=["effective_to"])

        serializer.save(workspace_id=employee.workspace_id, employee=employee)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SalaryDetailEndpoint(PayrollBaseView):
    model = Salary

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, employee_id, salary_id):
        salary = Salary.objects.get(id=salary_id, employee_id=employee_id, workspace__slug=slug)
        salary.delete()
        # Reopen the previous row, or the employee silently drops off payroll
        # for that office with no salary in force at all
        previous = (
            Salary.objects.filter(employee_id=employee_id, office_id=salary.office_id)
            .exclude(id=salary.id)
            .order_by("-effective_from")
            .first()
        )
        if previous is not None and previous.effective_to is not None:
            previous.effective_to = None
            previous.save(update_fields=["effective_to"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdjustmentEndpoint(PayrollBaseView):
    """Bonuses, debts and support payments attached to an employee."""

    serializer_class = AdjustmentSerializer
    model = Adjustment

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug, employee_id):
        adjustments = Adjustment.objects.filter(employee_id=employee_id, workspace__slug=slug).select_related(
            "office"
        )
        kinds = request.query_params.getlist("kind")
        if kinds:
            adjustments = adjustments.filter(kind__in=kinds)
        return Response(AdjustmentSerializer(adjustments, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug, employee_id):
        employee = Employee.objects.get(id=employee_id, workspace__slug=slug)
        serializer = AdjustmentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(workspace_id=employee.workspace_id, employee=employee)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdjustmentDetailEndpoint(PayrollBaseView):
    model = Adjustment

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, employee_id, adjustment_id):
        Adjustment.objects.get(id=adjustment_id, employee_id=employee_id, workspace__slug=slug).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PayrollPaymentEndpoint(PayrollBaseView):
    """Payments already made and the ones still due.

    "Upcoming" is not a separate table — it is the PENDING rows, so a scheduled
    payment and the payment it becomes are the same record and cannot disagree.
    """

    serializer_class = PayrollPaymentSerializer
    model = PayrollPayment

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        payments = PayrollPayment.objects.filter(workspace__slug=slug).select_related("employee", "office")

        statuses = request.query_params.getlist("status")
        if statuses:
            payments = payments.filter(status__in=statuses)
        employee_id = request.query_params.get("employee")
        if employee_id:
            payments = payments.filter(employee_id=employee_id)
        office_id = request.query_params.get("office")
        if office_id:
            payments = payments.filter(office_id=office_id)

        # upcoming=1 → still owed, soonest first
        if request.query_params.get("upcoming") == "1":
            payments = payments.filter(status=PayrollPayment.Status.PENDING).order_by("scheduled_date")

        date_from = request.query_params.get("from")
        if date_from:
            payments = payments.filter(scheduled_date__gte=date_from)
        date_to = request.query_params.get("to")
        if date_to:
            payments = payments.filter(scheduled_date__lte=date_to)

        return Response(PayrollPaymentSerializer(payments, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = PayrollPaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(workspace_id=workspace.id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PayrollPaymentDetailEndpoint(PayrollBaseView):
    serializer_class = PayrollPaymentSerializer
    model = PayrollPayment

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, payment_id):
        payment = PayrollPayment.objects.get(id=payment_id, workspace__slug=slug)
        serializer = PayrollPaymentSerializer(payment, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        payment = serializer.save()

        # Marking it paid without a date leaves the ledger unable to say when
        if payment.status == PayrollPayment.Status.PAID and payment.paid_at is None:
            payment.paid_at = date.today()
            payment.save(update_fields=["paid_at"])
        return Response(PayrollPaymentSerializer(payment).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, payment_id):
        PayrollPayment.objects.get(id=payment_id, workspace__slug=slug).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AguinaldoEndpoint(PayrollBaseView):
    """Aguinaldo owed per employee for a year — computed, never stored."""

    model = Employee

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        year = int(request.query_params.get("year", date.today().year))
        employees = Employee.objects.filter(workspace__slug=slug).prefetch_related(SALARIES)

        results = []
        for employee in employees:
            rows = aguinaldo_for(employee, list(employee.salaries.all()), year)
            if not rows:
                continue
            results.append(
                {
                    "employee_id": str(employee.id),
                    "employee_name": employee.full_name,
                    "hire_date": employee.hire_date,
                    "termination_date": employee.termination_date,
                    "entries": rows,
                }
            )
        return Response({"year": year, "results": results}, status=status.HTTP_200_OK)


class PayrollAccessEndpoint(PayrollBaseView):
    """What the caller is allowed to see. Read-only by design.

    There is no POST: an admin cannot grant themselves the annual cost, which is
    the entire point — the person it is hidden from is an admin too.
    """

    model = PayrollAccess

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        granted = PayrollAccess.objects.filter(
            workspace__slug=slug, user=request.user, can_view_annual_cost=True
        ).exists()
        return Response({"can_view_annual_cost": granted}, status=status.HTTP_200_OK)


class AnnualCostEndpoint(PayrollBaseView):
    """What the workforce costs per year. Behind the second gate."""

    model = Employee

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        granted = PayrollAccess.objects.filter(
            workspace__slug=slug, user=request.user, can_view_annual_cost=True
        ).exists()
        if not granted:
            # 404, not 403: a 403 confirms the report exists, which is itself
            # the thing being kept quiet
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        year = int(request.query_params.get("year", date.today().year))
        employees = Employee.objects.filter(workspace__slug=slug).prefetch_related(SALARIES)
        adjustments = Adjustment.objects.filter(
            workspace__slug=slug, effective_date__year=year
        ).select_related("office")

        results = annual_cost(
            [(employee, list(employee.salaries.all())) for employee in employees],
            list(adjustments),
            year,
        )
        return Response({"year": year, "results": results}, status=status.HTTP_200_OK)
