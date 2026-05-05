# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import models

from .project import ProjectBaseModel


class ProjectWorkflow(ProjectBaseModel):
    """Master toggle for workflow enforcement on a project."""

    is_live = models.BooleanField(default=False)

    class Meta:
        unique_together = [("project", "workspace")]
        db_table = "project_workflows"
        verbose_name = "Project Workflow"
        verbose_name_plural = "Project Workflows"

    def __str__(self):
        return f"ProjectWorkflow({self.project_id}, live={self.is_live})"


class WorkflowStateConfig(ProjectBaseModel):
    """Per-state configuration: whether new issues can be created in this state."""

    state = models.ForeignKey("db.State", on_delete=models.CASCADE, related_name="workflow_config")
    allow_issue_creation = models.BooleanField(default=True)

    class Meta:
        unique_together = [("project", "state")]
        db_table = "workflow_state_configs"
        verbose_name = "Workflow State Config"
        verbose_name_plural = "Workflow State Configs"

    def __str__(self):
        return f"WorkflowStateConfig(state={self.state_id}, allow={self.allow_issue_creation})"


class WorkflowTransition(ProjectBaseModel):
    """A permitted state transition: issues in `state` can move to `transition_state`."""

    state = models.ForeignKey("db.State", on_delete=models.CASCADE, related_name="outgoing_transitions")
    transition_state = models.ForeignKey("db.State", on_delete=models.CASCADE, related_name="incoming_transitions")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "state", "transition_state"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_workflow_transition_active",
            )
        ]
        db_table = "workflow_transitions"
        verbose_name = "Workflow Transition"
        verbose_name_plural = "Workflow Transitions"

    def __str__(self):
        return f"WorkflowTransition({self.state_id} → {self.transition_state_id})"


class WorkflowTransitionApprover(ProjectBaseModel):
    """User authorized to perform a specific workflow transition."""

    transition = models.ForeignKey(WorkflowTransition, on_delete=models.CASCADE, related_name="approvers")
    approver = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="workflow_approvals"
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["transition", "approver"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_workflow_approver_active",
            )
        ]
        db_table = "workflow_transition_approvers"
        verbose_name = "Workflow Transition Approver"
        verbose_name_plural = "Workflow Transition Approvers"

    def __str__(self):
        return f"WorkflowTransitionApprover(transition={self.transition_id}, approver={self.approver_id})"


class WorkflowActivity(ProjectBaseModel):
    """Audit log for workflow configuration changes."""

    field = models.CharField(max_length=255)
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="workflow_activities",
    )

    class Meta:
        db_table = "workflow_activities"
        ordering = ["-created_at"]
        verbose_name = "Workflow Activity"
        verbose_name_plural = "Workflow Activities"

    def __str__(self):
        return f"WorkflowActivity(field={self.field}, project={self.project_id})"
