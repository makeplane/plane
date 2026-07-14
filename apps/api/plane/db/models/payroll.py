# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Payroll: employees, their salaries over time, and what they are paid.

An Employee is deliberately *not* a Plane User. The people on payroll are not
necessarily the people with accounts (and vice versa), so tying the two would
force a login for every person paid and leak payroll into the member list.
"""

from django.db import models
from django.db.models import Q

from .base import BaseModel
from .finance import AMOUNT_DECIMAL_PLACES, AMOUNT_MAX_DIGITS, DEFAULT_CURRENCY

# LFT art. 87: at least 15 days of salary, proportional to time worked. Offices
# may grant more, never less.
LEGAL_AGUINALDO_DAYS = 15


class Office(BaseModel):
    """A company/office people are paid from (Seanalytics, Latin...).

    Someone can hold a salary in more than one office at the same time — that is
    the whole reason an employee can have several concurrent salaries.
    """

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="offices")
    name = models.CharField(max_length=255)
    # Days of salary paid as aguinaldo. Configurable per office because a company
    # may be more generous than the legal floor.
    aguinaldo_days = models.PositiveSmallIntegerField(default=LEGAL_AGUINALDO_DAYS)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(deleted_at__isnull=True),
                name="unique_office_name_when_not_deleted",
            )
        ]
        verbose_name = "Office"
        verbose_name_plural = "Offices"
        db_table = "payroll_offices"
        ordering = ("name",)

    def __str__(self):
        return self.name


class Employee(BaseModel):
    """A person on payroll. Not a Plane user account."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="employees")
    full_name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    # RFC/CURP or whatever identifier the company files them under
    national_id = models.CharField(max_length=64, blank=True)
    position = models.CharField(max_length=255, blank=True)
    hire_date = models.DateField()
    # Set when they leave; drives the proportional aguinaldo
    termination_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=Q(termination_date__isnull=True) | Q(termination_date__gte=models.F("hire_date")),
                name="employee_termination_after_hire",
            )
        ]
        verbose_name = "Employee"
        verbose_name_plural = "Employees"
        db_table = "payroll_employees"
        ordering = ("full_name",)
        indexes = [models.Index(fields=["workspace", "termination_date"], name="employee_ws_termination_idx")]

    @property
    def is_active(self):
        return self.termination_date is None

    def __str__(self):
        return self.full_name


class Salary(BaseModel):
    """What an employee earns, in one office, from a date onwards.

    A raise is never an UPDATE: it closes the running row (effective_to) and
    opens a new one. That keeps the full history — "what did they earn last
    March" stays answerable, and the aguinaldo can be computed on the salary
    that was actually in force.

    effective_to = NULL means "still in force".
    """

    class Periodicity(models.TextChoices):
        MONTHLY = "MONTHLY", "Mensual"
        BIWEEKLY = "BIWEEKLY", "Quincenal"
        WEEKLY = "WEEKLY", "Semanal"
        DAILY = "DAILY", "Diario"

    # Days each period covers, for converting any salary to a daily rate
    DAYS_PER_PERIOD = {
        Periodicity.MONTHLY: 30,
        Periodicity.BIWEEKLY: 15,
        Periodicity.WEEKLY: 7,
        Periodicity.DAILY: 1,
    }

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="salaries")
    employee = models.ForeignKey("db.Employee", on_delete=models.CASCADE, related_name="salaries")
    # CASCADE, not PROTECT: PROTECT would make deleting the whole workspace
    # fail on the office it cascades into. An office that still pays people
    # is guarded at the endpoint instead, which answers 409.
    office = models.ForeignKey("db.Office", on_delete=models.CASCADE, related_name="salaries")

    amount = models.DecimalField(max_digits=AMOUNT_MAX_DIGITS, decimal_places=AMOUNT_DECIMAL_PLACES)
    currency = models.CharField(max_length=3, default=DEFAULT_CURRENCY)
    periodicity = models.CharField(max_length=20, choices=Periodicity.choices, default=Periodicity.MONTHLY)

    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)

    class Meta:
        constraints = [
            # Postgres treats NULLs as distinct, so the "one running salary per
            # office" rule needs its own partial constraint — without it an
            # employee could hold two open salaries in the same office and every
            # total would double.
            models.UniqueConstraint(
                fields=["employee", "office"],
                condition=Q(effective_to__isnull=True, deleted_at__isnull=True),
                name="unique_open_salary_per_office_when_not_deleted",
            ),
            models.CheckConstraint(
                check=Q(effective_to__isnull=True) | Q(effective_to__gte=models.F("effective_from")),
                name="salary_effective_to_after_from",
            ),
            models.CheckConstraint(check=Q(amount__gte=0), name="salary_amount_not_negative"),
        ]
        verbose_name = "Salary"
        verbose_name_plural = "Salaries"
        db_table = "payroll_salaries"
        ordering = ("-effective_from",)
        indexes = [models.Index(fields=["employee", "effective_from"], name="salary_employee_from_idx")]

    @property
    def is_current(self):
        return self.effective_to is None

    def daily_amount(self):
        """The salary expressed per day, for aguinaldo and annual cost."""
        return self.amount / self.DAYS_PER_PERIOD[self.periodicity]

    def annual_amount(self):
        return self.daily_amount() * 365

    def __str__(self):
        return f"{self.employee_id} @ {self.office_id}: {self.amount} {self.currency}"


class Adjustment(BaseModel):
    """Anything added to or subtracted from what an employee is owed.

    BONUS and SUPPORT add; DEBT subtracts. Kept as signed intent rather than a
    signed amount so a mistyped minus can't silently flip a bonus into a debt.
    """

    class Kind(models.TextChoices):
        BONUS = "BONUS", "Bono"
        DEBT = "DEBT", "Adeudo"
        SUPPORT = "SUPPORT", "Apoyo"

    # Debts are owed *by* the employee, so they come off the total
    SUBTRACTED = {Kind.DEBT}

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="payroll_adjustments")
    employee = models.ForeignKey("db.Employee", on_delete=models.CASCADE, related_name="adjustments")
    office = models.ForeignKey(
        "db.Office", on_delete=models.SET_NULL, null=True, blank=True, related_name="adjustments"
    )

    kind = models.CharField(max_length=20, choices=Kind.choices)
    amount = models.DecimalField(max_digits=AMOUNT_MAX_DIGITS, decimal_places=AMOUNT_DECIMAL_PLACES)
    currency = models.CharField(max_length=3, default=DEFAULT_CURRENCY)
    effective_date = models.DateField()
    description = models.TextField(blank=True)

    class Meta:
        constraints = [models.CheckConstraint(check=Q(amount__gte=0), name="adjustment_amount_not_negative")]
        verbose_name = "Payroll Adjustment"
        verbose_name_plural = "Payroll Adjustments"
        db_table = "payroll_adjustments"
        ordering = ("-effective_date",)
        indexes = [models.Index(fields=["workspace", "effective_date"], name="adjustment_ws_date_idx")]

    @property
    def signed_amount(self):
        return -self.amount if self.kind in self.SUBTRACTED else self.amount

    def __str__(self):
        return f"{self.kind} {self.amount} ({self.employee_id})"


class PayrollPayment(BaseModel):
    """One payroll disbursement — already paid, or scheduled to be.

    The upcoming-payments view is just the PENDING rows: there is no separate
    "schedule" table, so a payment can't drift from its own plan.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pendiente"
        PAID = "PAID", "Pagado"
        CANCELLED = "CANCELLED", "Cancelado"

    class Concept(models.TextChoices):
        SALARY = "SALARY", "Sueldo"
        AGUINALDO = "AGUINALDO", "Aguinaldo"
        BONUS = "BONUS", "Bono"
        OTHER = "OTHER", "Otro"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="payroll_payments")
    employee = models.ForeignKey("db.Employee", on_delete=models.CASCADE, related_name="payments")
    office = models.ForeignKey("db.Office", on_delete=models.CASCADE, related_name="payments")

    concept = models.CharField(max_length=20, choices=Concept.choices, default=Concept.SALARY)
    amount = models.DecimalField(max_digits=AMOUNT_MAX_DIGITS, decimal_places=AMOUNT_DECIMAL_PLACES)
    currency = models.CharField(max_length=3, default=DEFAULT_CURRENCY)

    # The pay period this covers
    period_start = models.DateField()
    period_end = models.DateField()
    # When it is due — this is what "upcoming payments" sorts by
    scheduled_date = models.DateField()

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    paid_at = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(check=Q(amount__gte=0), name="payroll_payment_amount_not_negative"),
            models.CheckConstraint(
                check=Q(period_end__gte=models.F("period_start")), name="payroll_payment_period_end_after_start"
            ),
        ]
        verbose_name = "Payroll Payment"
        verbose_name_plural = "Payroll Payments"
        db_table = "payroll_payments"
        ordering = ("-scheduled_date",)
        indexes = [
            models.Index(fields=["workspace", "status", "scheduled_date"], name="payroll_pay_ws_status_idx"),
            models.Index(fields=["employee", "scheduled_date"], name="payroll_pay_employee_idx"),
        ]

    def __str__(self):
        return f"{self.employee_id} {self.concept} {self.amount} {self.status}"


class PayrollAccess(BaseModel):
    """Who may see the annual payroll cost.

    Deliberately has no create/update endpoint: workspace admins cannot grant it,
    not even to themselves. The people it must be hidden from are admins, so an
    in-app toggle any admin could flip would be decoration, not a restriction.
    Grant it from the instance shell (documented in the README).
    """

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="payroll_access")
    user = models.ForeignKey("db.User", on_delete=models.CASCADE, related_name="payroll_access")
    can_view_annual_cost = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "user"],
                condition=Q(deleted_at__isnull=True),
                name="unique_payroll_access_when_not_deleted",
            )
        ]
        verbose_name = "Payroll Access"
        verbose_name_plural = "Payroll Access"
        db_table = "payroll_access"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.user_id} annual_cost={self.can_view_annual_cost}"
