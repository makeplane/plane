# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models
from django.db.models import Q

# Module imports
from .project import ProjectBaseModel


class WorkflowFlowType(models.TextChoices):
    TRANSITION = "transition", "Transition"
    APPROVAL = "approval", "Approval"


class WorkflowApprovalStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class Workflow(ProjectBaseModel):
    name = models.CharField(max_length=255, verbose_name="Workflow Name")
    description = models.TextField(blank=True)
    is_default = models.BooleanField(default=False)
    is_enabled = models.BooleanField(default=True)
    is_paused = models.BooleanField(default=False)
    issue_type = models.ForeignKey(
        "db.IssueType",
        on_delete=models.CASCADE,
        related_name="workflows",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Workflow"
        verbose_name_plural = "Workflows"
        db_table = "workflows"
        ordering = ("-is_default", "name")
        constraints = [
            models.UniqueConstraint(
                fields=["project", "issue_type"],
                condition=Q(deleted_at__isnull=True, issue_type__isnull=False),
                name="workflow_unique_project_issue_type_when_deleted_at_null",
            ),
            models.UniqueConstraint(
                fields=["project"],
                condition=Q(deleted_at__isnull=True, is_default=True),
                name="workflow_unique_default_per_project_when_deleted_at_null",
            ),
        ]

    def __str__(self):
        return f"{self.name} <{self.project.name}>"


class WorkflowStateConfig(ProjectBaseModel):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name="state_configs")
    state = models.ForeignKey("db.State", on_delete=models.CASCADE, related_name="workflow_state_configs")
    allow_work_item_creation = models.BooleanField(default=True)
    sequence = models.FloatField(default=65535)

    class Meta:
        verbose_name = "Workflow State Config"
        verbose_name_plural = "Workflow State Configs"
        db_table = "workflow_state_configs"
        ordering = ("sequence",)
        constraints = [
            models.UniqueConstraint(
                fields=["workflow", "state"],
                condition=Q(deleted_at__isnull=True),
                name="workflow_state_config_unique_workflow_state_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.workflow.name} - {self.state.name}"


class WorkflowFlow(ProjectBaseModel):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name="flows")
    source_state = models.ForeignKey(
        "db.State",
        on_delete=models.CASCADE,
        related_name="workflow_outgoing_flows",
    )
    flow_type = models.CharField(max_length=20, choices=WorkflowFlowType.choices, default=WorkflowFlowType.TRANSITION)
    target_state = models.ForeignKey(
        "db.State",
        on_delete=models.CASCADE,
        related_name="workflow_target_flows",
    )
    reject_state = models.ForeignKey(
        "db.State",
        on_delete=models.SET_NULL,
        related_name="workflow_reject_flows",
        null=True,
        blank=True,
    )
    allowed_roles = models.JSONField(default=list, blank=True)
    allowed_members = models.JSONField(default=list, blank=True)
    sequence = models.FloatField(default=65535)

    class Meta:
        verbose_name = "Workflow Flow"
        verbose_name_plural = "Workflow Flows"
        db_table = "workflow_flows"
        ordering = ("sequence",)

    def __str__(self):
        return f"{self.source_state.name} -> {self.target_state.name} ({self.flow_type})"


class WorkflowApproval(ProjectBaseModel):
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="workflow_approvals")
    flow = models.ForeignKey(WorkflowFlow, on_delete=models.CASCADE, related_name="approvals")
    status = models.CharField(
        max_length=20,
        choices=WorkflowApprovalStatus.choices,
        default=WorkflowApprovalStatus.PENDING,
    )
    source_state = models.ForeignKey(
        "db.State",
        on_delete=models.CASCADE,
        related_name="approval_source_states",
    )
    approve_state = models.ForeignKey(
        "db.State",
        on_delete=models.CASCADE,
        related_name="approval_target_states",
    )
    reject_state = models.ForeignKey(
        "db.State",
        on_delete=models.SET_NULL,
        related_name="approval_reject_states",
        null=True,
        blank=True,
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="requested_workflow_approvals",
        null=True,
    )
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="resolved_workflow_approvals",
        null=True,
        blank=True,
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Workflow Approval"
        verbose_name_plural = "Workflow Approvals"
        db_table = "workflow_approvals"
        ordering = ("-created_at",)

    def __str__(self):
        return f"Approval for {self.issue.name} ({self.status})"


class WorkflowHistory(ProjectBaseModel):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name="history")
    action = models.CharField(max_length=255)
    changes = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Workflow History"
        verbose_name_plural = "Workflow Histories"
        db_table = "workflow_histories"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.workflow.name} - {self.action}"
