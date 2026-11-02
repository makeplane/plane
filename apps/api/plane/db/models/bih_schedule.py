# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models
from django.db.models import Q

# Module imports
from .base import BaseModel


def default_working_weekdays():
    # ISO weekdays: 1 = Monday ... 7 = Sunday
    return [1, 2, 3, 4, 5]


class WorkspaceScheduleSetting(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="schedule_settings")
    working_weekdays = models.JSONField(default=default_working_weekdays)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace"],
                condition=Q(deleted_at__isnull=True),
                name="workspace_schedule_setting_unique_workspace_when_deleted_at_null",
            )
        ]
        verbose_name = "Workspace Schedule Setting"
        verbose_name_plural = "Workspace Schedule Settings"
        db_table = "workspace_schedule_settings"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.workspace_id} {self.working_weekdays}"


class WorkspaceHoliday(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="holidays")
    date = models.DateField()
    name = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "date"],
                condition=Q(deleted_at__isnull=True),
                name="workspace_holiday_unique_workspace_date_when_deleted_at_null",
            )
        ]
        verbose_name = "Workspace Holiday"
        verbose_name_plural = "Workspace Holidays"
        db_table = "workspace_holidays"
        ordering = ("date",)

    def __str__(self):
        return f"{self.workspace_id} {self.date}"
