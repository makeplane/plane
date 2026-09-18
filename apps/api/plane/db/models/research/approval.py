# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

from django.db import models
from django.db.models import Q

from plane.db.models.base import BaseModel

APPROVAL_TYPES = (("TASK", "Task"), ("PURCHASE", "Purchase"), ("CUSTOM", "Custom"))


class ApprovalFlow(BaseModel):
    """Approval flow definition bound to an organisation node (P0-APR-03)."""

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="research_approval_flows",
    )
    org_unit = models.ForeignKey(
        "db.OrgUnit",
        on_delete=models.SET_NULL,
        related_name="approval_flows",
        null=True,
        blank=True,
    )
    approval_type = models.CharField(max_length=16, choices=APPROVAL_TYPES, default="TASK")
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    version = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name = "Approval Flow"
        verbose_name_plural = "Approval Flows"
        db_table = "research_approval_flows"
        ordering = ("approval_type", "name")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "org_unit", "approval_type", "name", "version"],
                condition=Q(deleted_at__isnull=True),
                name="rsch_flow_uq_ws_unit_type_name",
            ),
        ]
        indexes = [
            models.Index(fields=["workspace", "approval_type"], name="rsch_flow_ws_type_idx"),
        ]

    def __str__(self):
        return f"{self.approval_type} <{self.name}> v{self.version}"


class ApprovalFlowStep(BaseModel):
    """One ordered step of a flow; steps advance in ``order`` (P0-APR-03)."""

    class ApproverMode(models.TextChoices):
        ANY = "ANY", "Any approver"
        ALL = "ALL", "All approvers"

    flow = models.ForeignKey(
        ApprovalFlow,
        on_delete=models.CASCADE,
        related_name="steps",
    )
    order = models.PositiveSmallIntegerField(default=1)
    approver_mode = models.CharField(max_length=8, choices=ApproverMode.choices, default=ApproverMode.ANY)
    approver_org_role = models.CharField(
        max_length=20,
        choices=(
            ("OWNER", "Owner"),
            ("PI", "Principal investigator"),
            ("ADVISOR", "Advisor"),
            ("REVIEWER", "Reviewer"),
            ("UNIT_ADMIN", "Unit admin"),
        ),
        null=True,
        blank=True,
    )
    approver_user = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="research_approval_steps",
        null=True,
        blank=True,
    )
    is_required = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Approval Flow Step"
        verbose_name_plural = "Approval Flow Steps"
        db_table = "research_approval_flow_steps"
        ordering = ("order",)
        constraints = [
            models.UniqueConstraint(
                fields=["flow", "order"],
                condition=Q(deleted_at__isnull=True),
                name="rsch_flow_step_uq_flow_order",
            ),
        ]

    def __str__(self):
        return f"{self.flow_id}#{self.order}"


class ApprovalRequest(BaseModel):
    """Research extension of a Plane ``Issue`` (P0-APR-01, P0-APR-05)."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        WITHDRAWN = "WITHDRAWN", "Withdrawn"
        CANCELLED = "CANCELLED", "Cancelled"

    issue = models.OneToOneField(
        "db.Issue",
        on_delete=models.CASCADE,
        related_name="research_approval_request",
    )
    flow = models.ForeignKey(
        ApprovalFlow,
        on_delete=models.PROTECT,
        related_name="requests",
    )
    flow_version = models.PositiveIntegerField(default=1)
    approval_type = models.CharField(max_length=16, choices=APPROVAL_TYPES, default="TASK")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    current_step_order = models.PositiveSmallIntegerField(default=1)
    requested_by = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="research_approval_requests",
        null=True,
    )
    org_unit = models.ForeignKey(
        "db.OrgUnit",
        on_delete=models.SET_NULL,
        related_name="approval_requests",
        null=True,
        blank=True,
    )
    research_project = models.ForeignKey(
        "db.Project",
        on_delete=models.SET_NULL,
        related_name="research_approval_requests",
        null=True,
        blank=True,
    )
    report = models.ForeignKey(
        "db.PeriodicReport",
        on_delete=models.SET_NULL,
        related_name="approval_requests",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Approval Request"
        verbose_name_plural = "Approval Requests"
        db_table = "research_approval_requests"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["status", "current_step_order"], name="rsch_request_status_step_idx"),
            models.Index(fields=["org_unit", "status"], name="rsch_request_unit_status_idx"),
        ]

    def __str__(self):
        return f"request <{self.issue_id}>"


class ApprovalAction(models.Model):
    """Append-only approval action trail (P0-APR-04)."""

    class Action(models.TextChoices):
        APPROVE = "APPROVE", "Approve"
        REJECT = "REJECT", "Reject"
        WITHDRAW = "WITHDRAW", "Withdraw"
        CANCEL = "CANCEL", "Cancel"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey(
        ApprovalRequest,
        on_delete=models.CASCADE,
        related_name="actions",
    )
    step = models.ForeignKey(
        ApprovalFlowStep,
        on_delete=models.SET_NULL,
        related_name="actions",
        null=True,
        blank=True,
    )
    actor = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="research_approval_actions",
        null=True,
    )
    action = models.CharField(max_length=16, choices=Action.choices)
    comment = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Approval Action"
        verbose_name_plural = "Approval Actions"
        db_table = "research_approval_actions"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["request", "created_at"], name="rsch_action_request_idx"),
        ]

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise TypeError("Approval actions are append-only and cannot be updated.")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise TypeError("Approval actions are append-only and cannot be deleted.")

    def __str__(self):
        return f"{self.action} <{self.request_id}>"
