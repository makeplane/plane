# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import (
    AdjustmentDetailEndpoint,
    AdjustmentEndpoint,
    AguinaldoEndpoint,
    AnnualCostEndpoint,
    EmployeeDetailEndpoint,
    EmployeeEndpoint,
    OfficeDetailEndpoint,
    OfficeEndpoint,
    PayrollAccessEndpoint,
    PayrollPaymentDetailEndpoint,
    PayrollPaymentEndpoint,
    SalaryDetailEndpoint,
    SalaryEndpoint,
)

urlpatterns = [
    path("workspaces/<str:slug>/payroll/offices/", OfficeEndpoint.as_view(), name="payroll-offices"),
    path(
        "workspaces/<str:slug>/payroll/offices/<uuid:office_id>/",
        OfficeDetailEndpoint.as_view(),
        name="payroll-office-detail",
    ),
    path("workspaces/<str:slug>/payroll/employees/", EmployeeEndpoint.as_view(), name="payroll-employees"),
    path(
        "workspaces/<str:slug>/payroll/employees/<uuid:employee_id>/",
        EmployeeDetailEndpoint.as_view(),
        name="payroll-employee-detail",
    ),
    # Salary history — a raise appends a row, it never edits one
    path(
        "workspaces/<str:slug>/payroll/employees/<uuid:employee_id>/salaries/",
        SalaryEndpoint.as_view(),
        name="payroll-salaries",
    ),
    path(
        "workspaces/<str:slug>/payroll/employees/<uuid:employee_id>/salaries/<uuid:salary_id>/",
        SalaryDetailEndpoint.as_view(),
        name="payroll-salary-detail",
    ),
    path(
        "workspaces/<str:slug>/payroll/employees/<uuid:employee_id>/adjustments/",
        AdjustmentEndpoint.as_view(),
        name="payroll-adjustments",
    ),
    path(
        "workspaces/<str:slug>/payroll/employees/<uuid:employee_id>/adjustments/<uuid:adjustment_id>/",
        AdjustmentDetailEndpoint.as_view(),
        name="payroll-adjustment-detail",
    ),
    path("workspaces/<str:slug>/payroll/payments/", PayrollPaymentEndpoint.as_view(), name="payroll-payments"),
    path(
        "workspaces/<str:slug>/payroll/payments/<uuid:payment_id>/",
        PayrollPaymentDetailEndpoint.as_view(),
        name="payroll-payment-detail",
    ),
    path("workspaces/<str:slug>/payroll/aguinaldo/", AguinaldoEndpoint.as_view(), name="payroll-aguinaldo"),
    # What the caller may see; there is no endpoint to change it
    path("workspaces/<str:slug>/payroll/access/", PayrollAccessEndpoint.as_view(), name="payroll-access"),
    path("workspaces/<str:slug>/payroll/annual-cost/", AnnualCostEndpoint.as_view(), name="payroll-annual-cost"),
]
