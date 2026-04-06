# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Django imports
from django.core.validators import MaxValueValidator
from django.db import models
from django.conf import settings

# Module imports
from plane.db.models import ProjectBaseModel


class WorkflowHookExecutionStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    RUNNING = "running", "Running"
    SUCCESS = "success", "Success"
    FAILED = "failed", "Failed"


class WorkflowStateType(models.TextChoices):
    TRANSITION = "transition"
    APPROVAL = "approval"


class WorkflowApprovalType(models.TextChoices):
    APPROVAL = "approve"
    REJECTION = "reject"


class WorkflowTransitionHookPhase(models.TextChoices):
    PRE = "pre", "Pre"
    POST = "post", "Post"


class WorkflowTransitionHookType(models.TextChoices):
    VALIDATION = "validation", "Validation"
    ACTION = "action", "Action"


class Workflow(ProjectBaseModel):
    name = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)

    class Meta:
        db_table = "workflows"
        verbose_name = "Workflow"
        verbose_name_plural = "Workflows"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["workspace"]),
            models.Index(fields=["project"]),
            models.Index(fields=["created_by"]),
            models.Index(fields=["updated_by"]),
        ]


class WorkflowWorkItemType(ProjectBaseModel):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name="workflow_work_item_types")
    work_item_type = models.ForeignKey(
        "db.IssueType", on_delete=models.CASCADE, related_name="workflow_work_item_types", null=True, blank=True
    )

    class Meta:
        unique_together = ["work_item_type", "project", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["work_item_type", "project"],
                condition=models.Q(deleted_at__isnull=True),
                name="workflow_work_item_type_unique_work_item_type_project_when_deleted_at_null",
            )
        ]
        db_table = "workflow_work_item_types"
        verbose_name = "Workflow Work Item Type"
        verbose_name_plural = "Workflow Work Item Types"
        ordering = ("-created_at",)


class WorkflowState(ProjectBaseModel):
    state = models.ForeignKey("db.State", on_delete=models.CASCADE, related_name="workflows")
    allow_issue_creation = models.BooleanField(default=True)
    type = models.CharField(max_length=255, default=WorkflowStateType.TRANSITION)
    workflow = models.ForeignKey(
        "Workflow", on_delete=models.CASCADE, related_name="workflow_states", null=True, blank=True
    )

    class Meta:
        unique_together = ["project", "state", "workflow", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "state", "workflow"],
                condition=models.Q(deleted_at__isnull=True),
                name="workflow_state_unique_project_state_when_deleted_at_null",
            )
        ]
        db_table = "workflow_states"
        verbose_name = "Workflow State"
        verbose_name_plural = "Workflow States"


class WorkflowTransition(ProjectBaseModel):
    workflow_state = models.ForeignKey(WorkflowState, on_delete=models.CASCADE, related_name="workflow_transitions")
    transition_state = models.ForeignKey(
        "db.State",
        on_delete=models.CASCADE,
        related_name="workflow_transitions",
        null=True,
    )
    # State where issues move on rejection
    rejection_state = models.ForeignKey(
        "db.State",
        on_delete=models.CASCADE,
        related_name="workflow_rejection_transitions",
        null=True,
        blank=True,
    )
    # Number of approvals required (null means all approvers must approve)
    required_approvals = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "workflow_transitions"
        verbose_name = "Workflow Transition"
        verbose_name_plural = "Workflow Transitions"

    def _get_hooks(self, phase):
        return list(
            WorkflowTransitionHook.objects.filter(
                workflow_transition=self,
                phase=phase,
                is_enabled=True,
                deleted_at__isnull=True,
            )
            .order_by("execution_order", "created_at")
            .values("handler_name", "config")
        )

    @property
    def pre_rules(self):
        return [
            {
                "handler_name": r["handler_name"],
                "rule_type": WorkflowTransitionHookType.VALIDATION,
                "config": r.get("config") or {},
            }
            for r in self._get_hooks(WorkflowTransitionHookPhase.PRE)
        ]

    @property
    def post_rules(self):
        return [
            {
                "handler_name": r["handler_name"],
                "rule_type": WorkflowTransitionHookType.ACTION,
                "config": r.get("config") or {},
            }
            for r in self._get_hooks(WorkflowTransitionHookPhase.POST)
        ]


class WorkflowTransitionHook(ProjectBaseModel):
    SCRIPT_HANDLER_NAME = "run_script"

    workflow_transition = models.ForeignKey(
        WorkflowTransition,
        on_delete=models.CASCADE,
        related_name="hooks",
    )
    phase = models.CharField(max_length=32, choices=WorkflowTransitionHookPhase.choices)
    name = models.CharField(max_length=255, blank=True, default="")
    hook_type = models.CharField(max_length=32, choices=WorkflowTransitionHookType.choices)
    execution_order = models.PositiveIntegerField(default=0)
    is_enabled = models.BooleanField(default=True)
    handler_name = models.CharField(
        max_length=100,
        help_text="Handler to execute for this hook (e.g., run_script, change_property, trigger_webhook)",
    )
    config = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "workflow_transition_hooks"
        verbose_name = "Workflow Transition Hook"
        verbose_name_plural = "Workflow Transition Hooks"
        ordering = ("phase", "execution_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["workflow_transition", "phase", "execution_order"],
                condition=models.Q(deleted_at__isnull=True),
                name="workflow_transition_hook_unique_order_per_phase",
            ),
        ]
        indexes = [
            models.Index(fields=["workflow_transition", "phase"]),
            models.Index(fields=["workflow_transition", "hook_type"]),
            models.Index(fields=["handler_name"]),
        ]


class WorkflowTransitionApprover(ProjectBaseModel):
    """Defines who can approve a particular workflow transition"""

    workflow_state = models.ForeignKey(WorkflowState, on_delete=models.CASCADE, related_name="workflow_approvers")
    workflow_transition = models.ForeignKey(
        WorkflowTransition,
        on_delete=models.CASCADE,
        related_name="workflow_approvers",
    )
    approver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workflow_approvers",
    )

    class Meta:
        unique_together = ["workflow_transition", "approver", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["workflow_transition", "approver"],
                condition=models.Q(deleted_at__isnull=True),
                name="workflow_approver_unique_workflow_transition_approver_when_deleted_at_null",
            )
        ]
        db_table = "workflow_transition_approvers"
        verbose_name = "Workflow Transition Approver"
        verbose_name_plural = "Workflow Transition Approvers"


class WorkflowTransitionApproval(ProjectBaseModel):
    """Records approvals/rejections for specific issues"""

    workflow_state = models.ForeignKey(WorkflowState, on_delete=models.CASCADE, related_name="workflow_approvals")
    workflow_transition = models.ForeignKey(
        WorkflowTransition,
        on_delete=models.CASCADE,
        related_name="workflow_approvals",
    )
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="workflow_approvals")
    approver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workflow_approvals",
    )
    approved = models.BooleanField(default=False)
    comment = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ["workflow_transition", "issue", "approver", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["workflow_transition", "issue", "approver"],
                condition=models.Q(deleted_at__isnull=True),
                name="workflow_approval_unique_transition_issue_approver_when_deleted_at_null",
            )
        ]
        db_table = "workflow_transition_approvals"
        verbose_name = "Workflow Transition Approval"
        verbose_name_plural = "Workflow Transition Approvals"


class WorkflowTransitionActivity(ProjectBaseModel):
    workflow = models.ForeignKey(
        Workflow, on_delete=models.CASCADE, related_name="workflow_activities", null=True, blank=True
    )
    workflow_state = models.ForeignKey(
        WorkflowState,
        on_delete=models.SET_NULL,
        related_name="workflow_activities",
        blank=True,
        null=True,
    )
    transition_state = models.ForeignKey(
        "db.State",
        on_delete=models.CASCADE,
        related_name="workflow_activities",
        null=True,
        blank=True,
    )
    verb = models.CharField(max_length=255, verbose_name="Action", default="created")
    field = models.CharField(max_length=255, verbose_name="Field Name", blank=True, null=True)
    old_value = models.TextField(verbose_name="Old Value", blank=True, null=True)
    new_value = models.TextField(verbose_name="New Value", blank=True, null=True)
    comment = models.TextField(verbose_name="Comment", blank=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="workflow_activities",
    )
    old_identifier = models.UUIDField(null=True)
    new_identifier = models.UUIDField(null=True)
    epoch = models.FloatField(null=True)

    class Meta:
        verbose_name = "Workflow Transition Activity"
        verbose_name_plural = "Workflow Transition Activities"
        db_table = "workflow_transition_activities"
        ordering = ("-created_at",)

    def __str__(self):
        """Return workflow of the comment"""
        return str(self.workflow)


class WorkflowTransitionHookStatus(ProjectBaseModel):
    """Tracks each script execution triggered by a workflow transition hook."""

    workflow_transition_hook = models.ForeignKey(
        WorkflowTransitionHook,
        on_delete=models.CASCADE,
        related_name="script_executions",
    )
    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.CASCADE,
        related_name="workflow_script_executions",
    )
    status = models.CharField(
        max_length=20,
        choices=WorkflowHookExecutionStatus.choices,
        default=WorkflowHookExecutionStatus.PENDING,
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    input_data = models.JSONField(default=dict)
    output_data = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    retry_count = models.PositiveIntegerField(
        default=0,
        validators=[MaxValueValidator(5)],
    )

    class Meta:
        db_table = "workflow_transition_hook_statuses"
        verbose_name = "Workflow Transition Hook Status"
        verbose_name_plural = "Workflow Transition Hook Statuses"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["workflow_transition_hook", "status"]),
            models.Index(fields=["issue", "status"]),
            models.Index(fields=["status", "started_at"]),
        ]

    @property
    def duration(self):
        if self.started_at and self.completed_at:
            return self.completed_at - self.started_at
        return None
