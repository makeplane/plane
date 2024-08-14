# Django imports
from django.db import models
from django.utils import timezone

# Module imports
from plane.db.models.base import BaseModel


class WorkspaceFeature(BaseModel):
    workspace = models.OneToOneField(
        "db.Workspace", on_delete=models.CASCADE, related_name="features"
    )
    is_project_grouping_enabled = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Workspace Feature"
        verbose_name_plural = "Workspace Features"
        db_table = "workspace_features"
        ordering = ("-created_at",)


class WorkspaceLicense(BaseModel):
    class PlanChoice(models.TextChoices):
        FREE = "FREE", "Free"
        PRO = "PRO", "Pro"
        ONE = "ONE", "One"
        ENTERPRISE = "ENTERPRISE", "Enterprise"

    class RecurringIntervalChoice(models.TextChoices):
        MONTHLY = "MONTHLY", "Monthly"
        YEARLY = "YEARLY", "Yearly"
        QUARTERLY = "QUARTERLY", "Quarterly"

    # The workspace that this license is for
    workspace = models.OneToOneField(
        "db.Workspace", on_delete=models.CASCADE, related_name="license"
    )
    recurring_interval = models.CharField(
        choices=RecurringIntervalChoice.choices,
        max_length=255,
        blank=True,
        null=True,
    )
    current_period_end_date = models.DateTimeField(null=True, blank=True)
    purchased_seats = models.IntegerField(default=0)
    free_seats = models.IntegerField(default=12)
    plan = models.CharField(choices=PlanChoice.choices, max_length=255)
    is_cancelled = models.BooleanField(default=False)
    is_offline_payment = models.BooleanField(default=False)
    # When this information was last synced from the payment gateway
    last_synced_at = models.DateTimeField(default=timezone.now)
    # trial end date
    trial_end_date = models.DateTimeField(null=True, blank=True)
    # has activated free trial
    has_activated_free_trial = models.BooleanField(default=False)
    # is payment method added
    has_added_payment_method = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Workspace License"
        verbose_name_plural = "Workspace Licenses"
        db_table = "workspace_licenses"
        ordering = ("-created_at",)
