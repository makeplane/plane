# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models
from django.db.models import Q

from .base import BaseModel

# Money is always Decimal, never float: 0.1 + 0.2 != 0.3 in binary floating
# point, and a ledger that drifts by cents is worse than no ledger. 14 digits
# holds up to 999,999,999,999.99 in any currency.
AMOUNT_MAX_DIGITS = 14
AMOUNT_DECIMAL_PLACES = 2

# ISO 4217 code stored per row. Amounts in different currencies are never summed
# — every total is grouped by currency.
DEFAULT_CURRENCY = "MXN"


class ExpenseCategory(BaseModel):
    """A spending bucket for the workspace (Oficina, Viajes, Artistas...).

    Budgets are assigned per category and expenses are filed against one, which
    is what makes "budgeted vs spent" answerable.
    """

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="expense_categories")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=255, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(deleted_at__isnull=True),
                name="unique_expense_category_name_when_not_deleted",
            )
        ]
        verbose_name = "Expense Category"
        verbose_name_plural = "Expense Categories"
        db_table = "expense_categories"
        ordering = ("name",)

    def __str__(self):
        return self.name


class Budget(BaseModel):
    """An amount allocated to a category for a period.

    The spent side is never stored here — it is aggregated from Expense on
    read. A stored counter drifts away from the ledger the first time an
    expense is edited or soft-deleted.
    """

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="budgets")
    # Always bucketed: a budget with no category can't be compared against
    # anything, since expenses are filed by category
    category = models.ForeignKey("db.ExpenseCategory", on_delete=models.CASCADE, related_name="budgets")
    # Null = the whole workspace rather than a single project
    project = models.ForeignKey(
        "db.Project", on_delete=models.CASCADE, null=True, blank=True, related_name="budgets"
    )
    period_start = models.DateField()
    period_end = models.DateField()
    amount = models.DecimalField(max_digits=AMOUNT_MAX_DIGITS, decimal_places=AMOUNT_DECIMAL_PLACES)
    currency = models.CharField(max_length=3, default=DEFAULT_CURRENCY)
    notes = models.TextField(blank=True)

    class Meta:
        constraints = [
            # One allocation per (category, project, period) — a duplicate row
            # would silently double the budget the summary reports.
            #
            # Two constraints, not one: Postgres treats NULLs as distinct, so a
            # single constraint spanning the nullable `project` would let two
            # workspace-level budgets for the same category and period both
            # through. The partial constraints cover each case explicitly.
            models.UniqueConstraint(
                fields=["workspace", "category", "project", "period_start", "period_end"],
                condition=Q(deleted_at__isnull=True, project__isnull=False),
                name="unique_project_budget_when_not_deleted",
            ),
            models.UniqueConstraint(
                fields=["workspace", "category", "period_start", "period_end"],
                condition=Q(deleted_at__isnull=True, project__isnull=True),
                name="unique_workspace_budget_when_not_deleted",
            ),
            models.CheckConstraint(
                check=Q(period_end__gte=models.F("period_start")),
                name="budget_period_end_after_start",
            ),
            models.CheckConstraint(check=Q(amount__gte=0), name="budget_amount_not_negative"),
        ]
        verbose_name = "Budget"
        verbose_name_plural = "Budgets"
        db_table = "budgets"
        ordering = ("-period_start",)
        indexes = [models.Index(fields=["workspace", "period_start", "period_end"], name="budget_ws_period_idx")]

    def __str__(self):
        return f"{self.category or 'workspace'} {self.period_start}..{self.period_end}: {self.amount}"


class Expense(BaseModel):
    """One recorded outgoing payment — an office invoice, a supplier, a fee.

    Internal ledger only: nothing here moves real money. Supporting documents
    (invoices, receipts) hang off ExpenseDocument as library FileAssets, so they
    reuse the existing bucket upload and the PDF/image viewers instead of living
    in a parallel upload path.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pendiente"
        PAID = "PAID", "Pagado"
        CANCELLED = "CANCELLED", "Cancelado"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="expenses")
    # Deleting a category must not delete the ledger rows filed under it
    category = models.ForeignKey(
        "db.ExpenseCategory", on_delete=models.SET_NULL, null=True, blank=True, related_name="expenses"
    )
    project = models.ForeignKey(
        "db.Project", on_delete=models.SET_NULL, null=True, blank=True, related_name="expenses"
    )

    amount = models.DecimalField(max_digits=AMOUNT_MAX_DIGITS, decimal_places=AMOUNT_DECIMAL_PLACES)
    currency = models.CharField(max_length=3, default=DEFAULT_CURRENCY)
    # When the money was spent — not when the row was created
    expense_date = models.DateField()
    vendor = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    # Invoice folio / reference from the supplier
    reference = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    paid_at = models.DateField(null=True, blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(check=Q(amount__gte=0), name="expense_amount_not_negative"),
        ]
        verbose_name = "Expense"
        verbose_name_plural = "Expenses"
        db_table = "expenses"
        ordering = ("-expense_date", "-created_at")
        indexes = [
            models.Index(fields=["workspace", "expense_date"], name="expense_ws_date_idx"),
            models.Index(fields=["workspace", "status"], name="expense_ws_status_idx"),
        ]

    def __str__(self):
        return f"{self.vendor or self.reference or 'expense'}: {self.amount} {self.currency}"


class ExpenseDocument(BaseModel):
    """A supporting document attached to an expense — an invoice, a receipt.

    The file itself is an ordinary library FileAsset: it lands in the same
    bucket through the same presigned upload, and the existing PDF/image viewers
    render it unchanged. This model only records that the document backs this
    expense, which is what lets one expense carry several of them.
    """

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="expense_documents")
    expense = models.ForeignKey("db.Expense", on_delete=models.CASCADE, related_name="documents")
    asset = models.ForeignKey("db.FileAsset", on_delete=models.CASCADE, related_name="expense_documents")

    class Meta:
        constraints = [
            # Attaching the same file twice is an accident, not two documents
            models.UniqueConstraint(
                fields=["expense", "asset"],
                condition=Q(deleted_at__isnull=True),
                name="unique_expense_document_when_not_deleted",
            )
        ]
        verbose_name = "Expense Document"
        verbose_name_plural = "Expense Documents"
        db_table = "expense_documents"
        ordering = ("created_at",)

    def __str__(self):
        return f"{self.expense_id} -> {self.asset_id}"
