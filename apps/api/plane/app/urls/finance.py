# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views import (
    BudgetDetailEndpoint,
    BudgetEndpoint,
    BudgetSummaryEndpoint,
    ExpenseCategoryDetailEndpoint,
    ExpenseCategoryEndpoint,
    ExpenseDetailEndpoint,
    ExpenseDocumentEndpoint,
    ExpenseDocumentViewEndpoint,
    ExpenseEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/expense-categories/",
        ExpenseCategoryEndpoint.as_view(),
        name="expense-categories",
    ),
    path(
        "workspaces/<str:slug>/expense-categories/<uuid:category_id>/",
        ExpenseCategoryDetailEndpoint.as_view(),
        name="expense-category-detail",
    ),
    path(
        "workspaces/<str:slug>/budgets/",
        BudgetEndpoint.as_view(),
        name="budgets",
    ),
    # Budgeted vs spent per category — the whole point of the module. Declared
    # before the <uuid> route so the literal never competes with it.
    path(
        "workspaces/<str:slug>/budgets/summary/",
        BudgetSummaryEndpoint.as_view(),
        name="budget-summary",
    ),
    path(
        "workspaces/<str:slug>/budgets/<uuid:budget_id>/",
        BudgetDetailEndpoint.as_view(),
        name="budget-detail",
    ),
    path(
        "workspaces/<str:slug>/expenses/",
        ExpenseEndpoint.as_view(),
        name="expenses",
    ),
    path(
        "workspaces/<str:slug>/expenses/<uuid:expense_id>/",
        ExpenseDetailEndpoint.as_view(),
        name="expense-detail",
    ),
    # Supporting documents (invoices, receipts) — the bytes live in the library
    path(
        "workspaces/<str:slug>/expenses/<uuid:expense_id>/documents/",
        ExpenseDocumentEndpoint.as_view(),
        name="expense-documents",
    ),
    path(
        "workspaces/<str:slug>/expenses/<uuid:expense_id>/documents/<uuid:asset_id>/",
        ExpenseDocumentEndpoint.as_view(),
        name="expense-document-detail",
    ),
    path(
        "workspaces/<str:slug>/expenses/<uuid:expense_id>/documents/<uuid:asset_id>/view/",
        ExpenseDocumentViewEndpoint.as_view(),
        name="expense-document-view",
    ),
]
