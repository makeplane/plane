# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

from django.db import models
from django.db.models import Q

from plane.db.models.base import BaseModel

from .config import ReportVisibility


class PeriodicReport(BaseModel):
    """Weekly / monthly report (P0-RPT-01 ~ P0-RPT-12).

    The body always lives in a Plane ``Page``: the report object only carries
    the period, the workflow state and the visibility policy.
    """

    class ReportType(models.TextChoices):
        WEEKLY = "WEEKLY", "Weekly"
        MONTHLY = "MONTHLY", "Monthly"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        NEEDS_REVISION = "NEEDS_REVISION", "Needs revision"
        ACCEPTED = "ACCEPTED", "Accepted"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="research_reports",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="research_reports",
    )
    owner = models.ForeignKey(
        "db.User",
        on_delete=models.CASCADE,
        related_name="research_reports",
    )
    org_unit = models.ForeignKey(
        "db.OrgUnit",
        on_delete=models.SET_NULL,
        related_name="research_reports",
        null=True,
        blank=True,
    )
    page = models.OneToOneField(
        "db.Page",
        on_delete=models.CASCADE,
        related_name="research_report",
    )
    report_type = models.CharField(max_length=16, choices=ReportType.choices)
    period_key = models.CharField(max_length=16, db_index=True)
    period_start = models.DateField()
    period_end = models.DateField()
    timezone = models.CharField(max_length=255, default="UTC")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    visibility = models.CharField(
        max_length=32,
        choices=ReportVisibility.choices,
        default=ReportVisibility.DIRECT_ADVISOR,
    )
    is_backfill = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    reviewer = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="research_reviewed_reports",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Periodic Report"
        verbose_name_plural = "Periodic Reports"
        db_table = "research_periodic_reports"
        ordering = ("-period_start", "-created_at")
        constraints = [
            # one official report per owner / period / type (P0-RPT-03)
            models.UniqueConstraint(
                fields=["workspace", "owner", "report_type", "period_key"],
                condition=Q(deleted_at__isnull=True),
                name="rsch_report_uq_owner_period",
            ),
        ]
        indexes = [
            models.Index(fields=["workspace", "status", "period_key"], name="rsch_report_ws_status_idx"),
            models.Index(fields=["org_unit", "period_key"], name="rsch_report_unit_period_idx"),
            models.Index(fields=["owner", "report_type", "period_start"], name="rsch_report_owner_type_idx"),
        ]

    def __str__(self):
        return f"{self.report_type} <{self.period_key}>"


class ReportReviewLog(models.Model):
    """Append-only review trail: submit / return / accept (P0-RPT-11)."""

    class Action(models.TextChoices):
        SUBMIT = "SUBMIT", "Submit"
        RETURN = "RETURN", "Return"
        ACCEPT = "ACCEPT", "Accept"
        REOPEN = "REOPEN", "Reopen"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(
        PeriodicReport,
        on_delete=models.CASCADE,
        related_name="review_logs",
    )
    actor = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="research_report_review_logs",
        null=True,
    )
    action = models.CharField(max_length=16, choices=Action.choices)
    from_status = models.CharField(max_length=16, choices=PeriodicReport.Status.choices)
    to_status = models.CharField(max_length=16, choices=PeriodicReport.Status.choices)
    comment = models.TextField(blank=True, default="")
    snapshot_version = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Report Review Log"
        verbose_name_plural = "Report Review Logs"
        db_table = "research_report_review_logs"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["report", "created_at"], name="rsch_review_log_report_idx"),
        ]

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise TypeError("Report review logs are append-only and cannot be updated.")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise TypeError("Report review logs are append-only and cannot be deleted.")

    def __str__(self):
        return f"{self.action} <{self.report_id}>"


class ReportAccessGrant(BaseModel):
    """Custom grant extending a report's visibility within the default policy."""

    report = models.ForeignKey(
        PeriodicReport,
        on_delete=models.CASCADE,
        related_name="access_grants",
    )
    grantee_user = models.ForeignKey(
        "db.User",
        on_delete=models.CASCADE,
        related_name="research_report_grants",
        null=True,
        blank=True,
    )
    grantee_org_unit = models.ForeignKey(
        "db.OrgUnit",
        on_delete=models.CASCADE,
        related_name="research_report_grants",
        null=True,
        blank=True,
    )
    granted_by = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="research_report_grants_given",
        null=True,
    )
    expires_at = models.DateTimeField(null=True, blank=True)
    is_revoked = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Report Access Grant"
        verbose_name_plural = "Report Access Grants"
        db_table = "research_report_access_grants"
        ordering = ("-created_at",)
        constraints = [
            # exactly one grantee target
            models.CheckConstraint(
                condition=(
                    Q(grantee_user__isnull=False, grantee_org_unit__isnull=True)
                    | Q(grantee_user__isnull=True, grantee_org_unit__isnull=False)
                ),
                name="rsch_grant_exactly_one_target",
            ),
        ]
        indexes = [
            models.Index(fields=["report", "is_revoked"], name="rsch_grant_report_idx"),
        ]

    def __str__(self):
        return f"grant <{self.report_id}>"
