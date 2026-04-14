from django.conf import settings
from django.db import models

from plane.db.models.base import BaseModel


class Company(BaseModel):
    """
    A legal entity used for HR, finance, and contracts.
    Deliberately independent of Plane Workspaces — one workspace can
    span multiple companies; one company can span multiple workspaces.
    """

    # ── Identity ──────────────────────────────────────────────────────────────
    name                = models.CharField(max_length=255)
    trading_name        = models.CharField(max_length=255, blank=True)
    registration_number = models.CharField(max_length=100, blank=True)
    tax_id              = models.CharField(max_length=100, blank=True)
    vat_number          = models.CharField(max_length=100, blank=True)
    company_type        = models.CharField(max_length=100, blank=True)  # LLC, Ltd, d.o.o.
    logo                = models.URLField(blank=True)

    # ── Location ──────────────────────────────────────────────────────────────
    country              = models.CharField(max_length=100, blank=True)
    city                 = models.CharField(max_length=100, blank=True)
    registered_address   = models.TextField(blank=True)
    billing_address      = models.TextField(blank=True)

    # ── Status ────────────────────────────────────────────────────────────────
    class StatusChoices(models.TextChoices):
        ACTIVE    = "active",    "Active"
        INACTIVE  = "inactive",  "Inactive"
        DISSOLVED = "dissolved", "Dissolved"

    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.ACTIVE,
    )

    # ── Defaults ──────────────────────────────────────────────────────────────
    default_currency = models.CharField(max_length=10, default="EUR")
    default_timezone = models.CharField(max_length=63, default="Europe/Belgrade")

    # ── Workspace linkage (informational, not access-controlling) ─────────────
    workspaces = models.ManyToManyField(
        "db.Workspace",
        through="CompanyWorkspace",
        related_name="companies",
        blank=True,
    )

    class Meta:
        db_table            = "work_around_companies"
        ordering            = ["name"]
        verbose_name        = "Company"
        verbose_name_plural = "Companies"

    def __str__(self):
        return self.name


class CompanyWorkspace(BaseModel):
    """
    Links a Company to a Workspace. Informational — does not affect
    Plane's native access control.
    """
    company   = models.ForeignKey(Company,        on_delete=models.CASCADE, related_name="company_workspaces")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="company_links")

    class Meta:
        db_table        = "work_around_company_workspaces"
        unique_together = [["company", "workspace"]]


class CompanySettings(BaseModel):
    """HR and payroll configuration for a company. One record per company."""
    company = models.OneToOneField(Company, on_delete=models.CASCADE, related_name="settings")

    # ── Leave ─────────────────────────────────────────────────────────────────
    annual_leave_days        = models.PositiveIntegerField(default=25)
    sick_leave_days          = models.PositiveIntegerField(default=10)
    carry_over_max_days      = models.PositiveIntegerField(default=5)
    carry_over_expiry_months = models.PositiveIntegerField(default=3)

    class LeaveYearStart(models.TextChoices):
        CALENDAR    = "calendar",    "Calendar year (Jan 1)"
        ANNIVERSARY = "anniversary", "Contract / hire date anniversary"

    leave_year_start = models.CharField(
        max_length=20, choices=LeaveYearStart.choices, default=LeaveYearStart.CALENDAR
    )

    class WeekendPolicy(models.TextChoices):
        EXCLUDE = "exclude", "Exclude Sat & Sun"
        INCLUDE = "include", "Count all days"

    weekend_policy         = models.CharField(max_length=10, choices=WeekendPolicy.choices, default=WeekendPolicy.EXCLUDE)
    public_holiday_region  = models.CharField(max_length=10, default="RS")

    # ── Payroll ───────────────────────────────────────────────────────────────
    class PayCycle(models.TextChoices):
        MONTHLY    = "monthly",    "Monthly"
        BI_MONTHLY = "bi_monthly", "Bi-Monthly"
        WEEKLY     = "weekly",     "Weekly"

    pay_cycle                  = models.CharField(max_length=20, choices=PayCycle.choices, default=PayCycle.MONTHLY)
    pay_day                    = models.PositiveIntegerField(default=28)
    probation_period_days      = models.PositiveIntegerField(default=90)
    default_notice_period_days = models.PositiveIntegerField(default=30)

    class Meta:
        db_table = "work_around_company_settings"


class CompanyMemberRole(BaseModel):
    """
    Company-scoped role for a workspace member.
    Separate from Plane's native WorkspaceMember role.
    A member can hold roles in multiple companies.
    """

    class RoleChoices(models.TextChoices):
        HR_MANAGER      = "hr_manager",      "HR Manager"
        FINANCE_MANAGER = "finance_manager",  "Finance Manager"
        DIRECTOR        = "director",         "Director (read-only)"

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="member_roles")
    member  = models.ForeignKey(
        "db.WorkspaceMember",
        on_delete=models.CASCADE,
        related_name="company_roles",
    )
    role = models.CharField(max_length=30, choices=RoleChoices.choices)

    class Meta:
        db_table        = "work_around_company_member_roles"
        unique_together = [["company", "member", "role"]]

    def __str__(self):
        return f"{self.role} @ {self.company.name}"
