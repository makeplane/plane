# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models
from django.db.models import F

# Module imports
from plane.db.models.base import BaseModel
from plane.team_ops.models.calendar_entry import LeaveType


class LeaveRequest(BaseModel):
    """A request for leave that a manager approves or rejects. Approval writes the leave days into the calendar."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        CANCELLED = "CANCELLED", "Cancelled"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="team_ops_leave_requests")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="team_ops_leave_requests")
    start_date = models.DateField()
    end_date = models.DateField()
    leave_type = models.CharField(max_length=10, choices=LeaveType.choices)
    note = models.TextField(blank=True, default="")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    decided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    decided_at = models.DateTimeField(null=True, blank=True)
    decision_note = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "Leave Request"
        verbose_name_plural = "Leave Requests"
        db_table = "tops_leave_request"
        ordering = ("-start_date",)
        constraints = [
            models.CheckConstraint(condition=models.Q(end_date__gte=F("start_date")), name="tops_leave_end_after_start")
        ]
        indexes = [models.Index(fields=["workspace", "status", "start_date"], name="tops_lr_ws_status_idx")]

    def __str__(self):
        return f"{self.user_id} {self.start_date}..{self.end_date} {self.status}"
