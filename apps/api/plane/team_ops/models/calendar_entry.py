# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models
from django.db.models import F, Q

# Module imports
from plane.db.models.base import BaseModel


class WorkMode(models.TextChoices):
    """How a person plans to work on a day. A plan, not proof of presence or of hours worked."""

    ONSITE = "ONSITE", "Onsite"
    REMOTE = "REMOTE", "Remote"
    OFF = "OFF", "Day off"
    LEAVE = "LEAVE", "Leave"


class LeaveType(models.TextChoices):
    ANNUAL = "ANNUAL", "Annual leave"
    SICK = "SICK", "Sick leave"
    UNPAID = "UNPAID", "Unpaid leave"
    OTHER = "OTHER", "Other"


# Only these modes describe working hours.
WORKING_MODES = (WorkMode.ONSITE, WorkMode.REMOTE)


def _times_are_paired_and_ordered(prefix=""):
    start, end = f"{prefix}planned_start_time", f"{prefix}planned_end_time"
    return Q(**{f"{start}__isnull": True, f"{end}__isnull": True}) | Q(
        **{f"{start}__isnull": False, f"{end}__isnull": False, f"{end}__gt": F(start)}
    )


class CalendarEntry(BaseModel):
    """One person's plan for one day. At most one row per user and day."""

    class Source(models.TextChoices):
        MANUAL = "MANUAL", "Set by hand"
        TEMPLATE = "TEMPLATE", "From the weekly plan"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="team_ops_calendar_entries")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="team_ops_calendar_entries"
    )
    # The person's own calendar day: a date with no timezone.
    work_date = models.DateField()
    work_mode = models.CharField(max_length=10, choices=WorkMode.choices)
    planned_start_time = models.TimeField(null=True, blank=True)
    planned_end_time = models.TimeField(null=True, blank=True)
    description = models.TextField(blank=True, default="")
    leave_type = models.CharField(max_length=10, choices=LeaveType.choices, null=True, blank=True)
    source = models.CharField(max_length=10, choices=Source.choices, default=Source.MANUAL)

    class Meta:
        verbose_name = "Calendar Entry"
        verbose_name_plural = "Calendar Entries"
        db_table = "tops_calendar_entry"
        ordering = ("work_date",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "user", "work_date"],
                condition=Q(deleted_at__isnull=True),
                name="tops_entry_unique_user_date_when_deleted_at_null",
            ),
            models.CheckConstraint(condition=_times_are_paired_and_ordered(), name="tops_entry_times_paired_ordered"),
            models.CheckConstraint(
                condition=Q(work_mode__in=[WorkMode.ONSITE, WorkMode.REMOTE]) | Q(planned_start_time__isnull=True),
                name="tops_entry_times_only_working_modes",
            ),
            models.CheckConstraint(
                condition=(Q(work_mode=WorkMode.LEAVE) & Q(leave_type__isnull=False))
                | (~Q(work_mode=WorkMode.LEAVE) & Q(leave_type__isnull=True)),
                name="tops_entry_leave_type_only_for_leave",
            ),
        ]
        indexes = [models.Index(fields=["workspace", "work_date"], name="tops_ce_ws_date_idx")]

    def __str__(self):
        return f"{self.user_id} {self.work_date} {self.work_mode}"


class CalendarTemplate(BaseModel):
    """One weekday of a person's recurring weekly plan."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="team_ops_calendar_templates")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="team_ops_calendar_templates"
    )
    # ISO weekday: Monday is 1, Sunday is 7.
    weekday = models.PositiveSmallIntegerField()
    work_mode = models.CharField(max_length=10, choices=WorkMode.choices)
    planned_start_time = models.TimeField(null=True, blank=True)
    planned_end_time = models.TimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Calendar Weekly Plan Day"
        verbose_name_plural = "Calendar Weekly Plan Days"
        db_table = "tops_calendar_template"
        ordering = ("weekday",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "user", "weekday"],
                condition=Q(deleted_at__isnull=True),
                name="tops_template_unique_user_weekday_when_deleted_at_null",
            ),
            models.CheckConstraint(
                condition=Q(weekday__gte=1, weekday__lte=7), name="tops_template_weekday_between_1_and_7"
            ),
            models.CheckConstraint(
                condition=Q(work_mode__in=[WorkMode.ONSITE, WorkMode.REMOTE, WorkMode.OFF]),
                name="tops_template_no_leave",
            ),
            models.CheckConstraint(
                condition=_times_are_paired_and_ordered(), name="tops_template_times_paired_ordered"
            ),
            models.CheckConstraint(
                condition=Q(work_mode__in=[WorkMode.ONSITE, WorkMode.REMOTE]) | Q(planned_start_time__isnull=True),
                name="tops_template_times_only_working_modes",
            ),
        ]

    def __str__(self):
        return f"{self.user_id} weekday {self.weekday} {self.work_mode}"
