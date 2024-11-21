# Django imports
from django.db import models
from django.conf import settings
from django.utils import timezone

# Module imports
from plane.db.models.base import BaseModel
from plane.db.models.workspace import WorkspaceBaseModel


class WorkspaceFeature(BaseModel):
    workspace = models.OneToOneField(
        "db.Workspace", on_delete=models.CASCADE, related_name="features"
    )
    is_project_grouping_enabled = models.BooleanField(default=False)
    is_initiative_enabled = models.BooleanField(default=False)

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
    current_period_start_date = models.DateTimeField(null=True, blank=True)
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
    # subscription
    subscription = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        verbose_name = "Workspace License"
        verbose_name_plural = "Workspace Licenses"
        db_table = "workspace_licenses"
        ordering = ("-created_at",)


class WorkspaceActivity(WorkspaceBaseModel):
    verb = models.CharField(
        max_length=255, verbose_name="Action", default="created"
    )
    field = models.CharField(
        max_length=255, verbose_name="Field Name", blank=True, null=True
    )
    old_value = models.TextField(
        verbose_name="Old Value", blank=True, null=True
    )
    new_value = models.TextField(
        verbose_name="New Value", blank=True, null=True
    )
    comment = models.TextField(verbose_name="Comment", blank=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="workspace_activities",
    )
    old_identifier = models.UUIDField(null=True)
    new_identifier = models.UUIDField(null=True)
    epoch = models.FloatField(null=True)

    class Meta:
        verbose_name = "Workspace Activity"
        verbose_name_plural = "Workspace Activities"
        db_table = "workspace_activities"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.project.name} {self.verb}"
