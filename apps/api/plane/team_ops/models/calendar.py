# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import uuid

# Django imports
from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.core.serializers.json import DjangoJSONEncoder
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q

# Module imports
from plane.db.models.base import BaseModel

# ISO weekday numbers: Monday is 1, Sunday is 7.
ISO_WEEKDAYS = (1, 2, 3, 4, 5, 6, 7)


def default_working_weekdays():
    return [1, 2, 3, 4, 5]


class CalendarSettings(BaseModel):
    """Work calendar policy of a workspace. Created on first access with the defaults below."""

    class TeamViewAccess(models.TextChoices):
        ADMINS = "ADMINS", "Admins only"
        ADMINS_AND_LEADS = "ADMINS_AND_LEADS", "Admins and team leads"
        ALL_MEMBERS = "ALL_MEMBERS", "All members"

    class EditOthersAccess(models.TextChoices):
        NONE = "NONE", "Nobody"
        ADMINS = "ADMINS", "Admins only"
        ADMINS_AND_LEADS = "ADMINS_AND_LEADS", "Admins and team leads"

    workspace = models.OneToOneField(
        "db.Workspace", on_delete=models.CASCADE, related_name="team_ops_calendar_settings"
    )
    team_view_access = models.CharField(
        max_length=20, choices=TeamViewAccess.choices, default=TeamViewAccess.ADMINS_AND_LEADS
    )
    edit_others_access = models.CharField(
        max_length=20, choices=EditOthersAccess.choices, default=EditOthersAccess.ADMINS
    )
    # How many days back a non-admin may still change their plan; 0 means today and the future only.
    member_edit_past_days = models.PositiveSmallIntegerField(default=0, validators=[MaxValueValidator(366)])
    # ISO weekdays that count as working days when looking for days without a plan.
    working_weekdays = ArrayField(models.PositiveSmallIntegerField(), default=default_working_weekdays)
    # How many weeks ahead the weekly plan is written out as day entries.
    template_horizon_weeks = models.PositiveSmallIntegerField(
        default=8, validators=[MinValueValidator(1), MaxValueValidator(26)]
    )

    class Meta:
        verbose_name = "Calendar Settings"
        verbose_name_plural = "Calendar Settings"
        db_table = "tops_calendar_settings"

    def __str__(self):
        return f"{self.workspace_id} calendar settings"


class CalendarHoliday(BaseModel):
    """A non-working day for the whole workspace."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="team_ops_holidays")
    date = models.DateField()
    name = models.CharField(max_length=255)

    class Meta:
        verbose_name = "Calendar Holiday"
        verbose_name_plural = "Calendar Holidays"
        db_table = "tops_calendar_holiday"
        ordering = ("date",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "date"],
                condition=Q(deleted_at__isnull=True),
                name="tops_holiday_unique_workspace_date_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.date} {self.name}"


class AuditIsAppendOnly(Exception):
    """Raised when code tries to change or remove an audit row."""


class CalendarAudit(models.Model):
    """Append-only history of work calendar changes (entries, weekly plans, holidays, policy, teams)."""

    class Entity(models.TextChoices):
        ENTRY = "ENTRY", "Entry"
        TEMPLATE = "TEMPLATE", "Weekly plan"
        HOLIDAY = "HOLIDAY", "Holiday"
        SETTINGS = "SETTINGS", "Settings"
        TEAM = "TEAM", "Team"

    class Action(models.TextChoices):
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"

    id = models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="team_ops_calendar_audits")
    # Whose plan changed; empty for workspace-level changes such as holidays or settings.
    subject_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    work_date = models.DateField(null=True, blank=True)
    entity = models.CharField(max_length=20, choices=Entity.choices)
    action = models.CharField(max_length=10, choices=Action.choices)
    old_value = models.JSONField(null=True, blank=True, encoder=DjangoJSONEncoder)
    new_value = models.JSONField(null=True, blank=True, encoder=DjangoJSONEncoder)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Calendar Audit"
        verbose_name_plural = "Calendar Audit"
        db_table = "tops_calendar_audit"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["workspace", "subject_user", "created_at"], name="tops_audit_ws_subject_idx"),
            models.Index(fields=["workspace", "work_date"], name="tops_audit_ws_date_idx"),
        ]

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise AuditIsAppendOnly("Audit rows cannot be changed.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise AuditIsAppendOnly("Audit rows cannot be deleted.")

    def __str__(self):
        return f"{self.entity} {self.action} {self.created_at}"
