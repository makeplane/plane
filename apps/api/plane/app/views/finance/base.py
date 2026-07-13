# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workspace-level budgets and the expense ledger.

Internal bookkeeping only — nothing here moves money. Budgets allocate an amount
to a category for a period; expenses record what was actually spent, with the
invoice kept as a library FileAsset. "Spent" is always aggregated from the
ledger, never stored, so it cannot drift away from the rows it summarizes.
"""

# Python imports
from decimal import Decimal

# Django imports
from django.db.models import Count, Q, Sum

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import (
    BudgetSerializer,
    ExpenseCategorySerializer,
    ExpenseSerializer,
)
from plane.db.models import (
    Budget,
    Expense,
    ExpenseCategory,
    ExpenseDocument,
    FileAsset,
    Workspace,
    WorkspaceFeature,
)
from plane.settings.storage import S3Storage
from plane.utils.workspace_feature import is_workspace_feature_enabled

from ..base import BaseAPIView

CENTS = Decimal("0.01")


class FinanceBaseView(BaseAPIView):
    """Base view enforcing the per-workspace payments feature flag."""

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        slug = kwargs.get("slug")
        if slug and not is_workspace_feature_enabled(WorkspaceFeature.FeatureKey.PAYMENTS, slug=slug):
            self.permission_denied(request, message="Payments are not enabled for this workspace")


class ExpenseCategoryEndpoint(FinanceBaseView):
    serializer_class = ExpenseCategorySerializer
    model = ExpenseCategory

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        categories = ExpenseCategory.objects.filter(workspace__slug=slug).annotate(
            expense_count=Count("expenses", filter=Q(expenses__deleted_at__isnull=True))
        )
        return Response(ExpenseCategorySerializer(categories, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = ExpenseCategorySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        if ExpenseCategory.objects.filter(workspace=workspace, name__iexact=serializer.validated_data["name"]).exists():
            return Response(
                {"name": ["A category with this name already exists"]}, status=status.HTTP_409_CONFLICT
            )
        serializer.save(workspace_id=workspace.id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ExpenseCategoryDetailEndpoint(FinanceBaseView):
    serializer_class = ExpenseCategorySerializer
    model = ExpenseCategory

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, category_id):
        category = ExpenseCategory.objects.get(id=category_id, workspace__slug=slug)
        serializer = ExpenseCategorySerializer(category, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, category_id):
        category = ExpenseCategory.objects.get(id=category_id, workspace__slug=slug)
        # Expenses keep their history (category goes NULL); budgets are the
        # allocation for a bucket that no longer exists, so they go with it.
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BudgetEndpoint(FinanceBaseView):
    serializer_class = BudgetSerializer
    model = Budget

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        budgets = Budget.objects.filter(workspace__slug=slug)
        category_id = request.query_params.get("category")
        if category_id:
            budgets = budgets.filter(category_id=category_id)
        project_id = request.query_params.get("project")
        if project_id == "none":
            budgets = budgets.filter(project__isnull=True)
        elif project_id:
            budgets = budgets.filter(project_id=project_id)
        # Budgets overlapping the requested window, not only those inside it
        active_on = request.query_params.get("active_on")
        if active_on:
            budgets = budgets.filter(period_start__lte=active_on, period_end__gte=active_on)
        return Response(BudgetSerializer(budgets, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = BudgetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Surface the "already budgeted" case as a 409 instead of letting the
        # unique constraint raise a 500
        duplicate = Budget.objects.filter(
            workspace=workspace,
            category=serializer.validated_data["category"],
            project=serializer.validated_data.get("project"),
            period_start=serializer.validated_data["period_start"],
            period_end=serializer.validated_data["period_end"],
        ).exists()
        if duplicate:
            return Response(
                {"error": "This category already has a budget for that period"},
                status=status.HTTP_409_CONFLICT,
            )

        serializer.save(workspace_id=workspace.id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BudgetDetailEndpoint(FinanceBaseView):
    serializer_class = BudgetSerializer
    model = Budget

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, budget_id):
        budget = Budget.objects.get(id=budget_id, workspace__slug=slug)
        serializer = BudgetSerializer(budget, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, budget_id):
        Budget.objects.get(id=budget_id, workspace__slug=slug).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ExpenseEndpoint(FinanceBaseView):
    serializer_class = ExpenseSerializer
    model = Expense

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        # Documents are serialized inline; prefetching keeps the list one query
        # instead of one per expense
        expenses = (
            Expense.objects.filter(workspace__slug=slug)
            .select_related("category")
            .prefetch_related("documents__asset")
        )

        category_ids = request.query_params.getlist("category")
        if "none" in category_ids:
            expenses = expenses.filter(category__isnull=True)
        elif category_ids:
            expenses = expenses.filter(category_id__in=category_ids)

        statuses = request.query_params.getlist("status")
        if statuses:
            expenses = expenses.filter(status__in=statuses)

        project_id = request.query_params.get("project")
        if project_id:
            expenses = expenses.filter(project_id=project_id)

        date_from = request.query_params.get("from")
        if date_from:
            expenses = expenses.filter(expense_date__gte=date_from)
        date_to = request.query_params.get("to")
        if date_to:
            expenses = expenses.filter(expense_date__lte=date_to)

        search = request.query_params.get("search")
        if search:
            expenses = expenses.filter(
                Q(vendor__icontains=search) | Q(description__icontains=search) | Q(reference__icontains=search)
            )
        return Response(ExpenseSerializer(expenses, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = ExpenseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(workspace_id=workspace.id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ExpenseDetailEndpoint(FinanceBaseView):
    serializer_class = ExpenseSerializer
    model = Expense

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, expense_id):
        expense = (
            Expense.objects.select_related("category")
            .prefetch_related("documents__asset")
            .get(id=expense_id, workspace__slug=slug)
        )
        return Response(ExpenseSerializer(expense).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, expense_id):
        expense = Expense.objects.get(id=expense_id, workspace__slug=slug)
        serializer = ExpenseSerializer(expense, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, expense_id):
        Expense.objects.get(id=expense_id, workspace__slug=slug).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ExpenseDocumentEndpoint(FinanceBaseView):
    """Attaches library files to an expense as supporting documents.

    The upload itself goes through the file library's presigned POST, so by the
    time we get here the bytes are already in the bucket and the asset exists.
    This only records the link — which is what lets one expense carry several
    invoices.
    """

    model = ExpenseDocument

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, expense_id):
        expense = Expense.objects.get(id=expense_id, workspace__slug=slug)
        asset_ids = request.data.get("asset_ids") or []
        if not isinstance(asset_ids, list) or not asset_ids:
            return Response({"error": "asset_ids is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Only the workspace's own uploaded assets — never a raw id from the
        # client pointing at someone else's file
        assets = FileAsset.objects.filter(
            id__in=asset_ids,
            workspace_id=expense.workspace_id,
            is_uploaded=True,
            is_deleted=False,
        )
        for asset in assets:
            ExpenseDocument.objects.get_or_create(
                expense=expense,
                asset=asset,
                defaults={"workspace_id": expense.workspace_id},
            )

        expense.refresh_from_db()
        return Response(ExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, expense_id, asset_id):
        # Detaches the document from the expense; the file itself stays in the
        # library, since it may be linked elsewhere or wanted on its own
        ExpenseDocument.objects.filter(
            expense_id=expense_id, asset_id=asset_id, workspace__slug=slug
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ExpenseDocumentViewEndpoint(FinanceBaseView):
    """Presigned URL for one of an expense's documents, for the viewer.

    Payments resolves its own URLs instead of borrowing the file library's
    download route: that route is gated by the library's feature flag, so a
    workspace running payments without it would find every invoice unviewable.
    Going through the link table also means only a document actually attached to
    an expense in this workspace resolves.
    """

    model = ExpenseDocument

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, expense_id, asset_id):
        document = (
            ExpenseDocument.objects.select_related("asset")
            .filter(expense_id=expense_id, asset_id=asset_id, workspace__slug=slug)
            .first()
        )
        if document is None or document.asset_id is None:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

        storage = S3Storage(request=request)
        # inline: the viewer renders it in place; ?download=1 forces attachment
        disposition = "attachment" if request.query_params.get("download") else "inline"
        url = storage.generate_presigned_url(
            object_name=document.asset.asset.name,
            disposition=disposition,
            filename=(document.asset.attributes or {}).get("name"),
        )
        return Response({"url": url}, status=status.HTTP_200_OK)


class BudgetSummaryEndpoint(FinanceBaseView):
    """Budgeted vs spent per category for a period.

    Both sides are grouped by currency and never added across currencies — a
    total of "10,000" that silently mixes MXN and USD is a wrong number, not a
    rounding detail. Cancelled expenses are excluded; pending ones are reported
    separately so a category can show what is already committed but unpaid.
    """

    model = Budget

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")
        if not date_from or not date_to:
            return Response(
                {"error": "from and to are required (YYYY-MM-DD)"}, status=status.HTTP_400_BAD_REQUEST
            )

        budgets = Budget.objects.filter(
            workspace__slug=slug, period_start__lte=date_to, period_end__gte=date_from
        ).select_related("category")

        expenses = Expense.objects.filter(
            workspace__slug=slug, expense_date__gte=date_from, expense_date__lte=date_to
        ).exclude(status=Expense.Status.CANCELLED)

        # (category_id, currency) -> amounts
        rows = {}

        def row_for(category_id, category_name, currency):
            key = (str(category_id) if category_id else None, currency)
            if key not in rows:
                rows[key] = {
                    "category_id": str(category_id) if category_id else None,
                    "category_name": category_name,
                    "currency": currency,
                    "budgeted": 0,
                    "spent": 0,
                    "pending": 0,
                }
            return rows[key]

        for budget in budgets.values("category_id", "category__name", "currency").annotate(total=Sum("amount")):
            entry = row_for(budget["category_id"], budget["category__name"], budget["currency"])
            entry["budgeted"] = budget["total"]

        paid_or_pending = expenses.values("category_id", "category__name", "currency", "status").annotate(
            total=Sum("amount")
        )
        for expense in paid_or_pending:
            entry = row_for(expense["category_id"], expense["category__name"], expense["currency"])
            if expense["status"] == Expense.Status.PAID:
                entry["spent"] += expense["total"]
            else:
                entry["pending"] += expense["total"]

        results = []
        for entry in rows.values():
            entry["remaining"] = entry["budgeted"] - entry["spent"]
            # Emit money as strings. Handing a raw Decimal to the JSON renderer
            # turns it into a float, which is both lossy and inconsistent with
            # the serializers (DRF renders DecimalField as a string).
            for field in ("budgeted", "spent", "pending", "remaining"):
                entry[field] = str(Decimal(entry[field]).quantize(CENTS))
            results.append(entry)

        results.sort(key=lambda item: (item["category_name"] or "", item["currency"]))
        return Response(
            {"from": date_from, "to": date_to, "results": results},
            status=status.HTTP_200_OK,
        )
