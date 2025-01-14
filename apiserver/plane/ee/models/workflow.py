# Django imports
from django.db import models
from django.conf import settings

# Module imports
from plane.db.models import ProjectBaseModel


class Workflow(ProjectBaseModel):
    state = models.ForeignKey(
        "db.State", on_delete=models.CASCADE, related_name="workflows"
    )
    allow_issue_creation = models.BooleanField(default=True)

    class Meta:
        unique_together = ["project", "state", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "state"],
                condition=models.Q(deleted_at__isnull=True),
                name="workflow_unique_project_state_when_deleted_at_null",
            )
        ]
        db_table = "workflows"
        verbose_name = "Workflow"
        verbose_name_plural = "Workflows"


class WorkflowTransition(ProjectBaseModel):
    # Transition types
    class TransitionTypes(models.TextChoices):
        STATE = "STATE", "State"
        APPROVAL = "APPROVAL", "Approval"

    workflow = models.ForeignKey(
        Workflow, on_delete=models.CASCADE, related_name="workflow_transitions"
    )
    type = models.CharField(max_length=255, default=TransitionTypes.STATE)
    transition_state = models.ForeignKey(
        "db.State", on_delete=models.CASCADE, related_name="workflow_transitions", null=True
    )
    # State where issues move on approval
    approval_state = models.ForeignKey(
        "db.State",
        on_delete=models.CASCADE,
        related_name="workflow_approval_transitions",
        null=True,
        blank=True
    )
    # State where issues move on rejection
    rejection_state = models.ForeignKey(
        "db.State",
        on_delete=models.CASCADE,
        related_name="workflow_rejection_transitions",
        null=True,
        blank=True
    )
    # Number of approvals required (null means all approvers must approve)
    required_approvals = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "workflow_transitions"
        verbose_name = "Workflow Transition"
        verbose_name_plural = "Workflow Transitions"


class WorkflowApprover(ProjectBaseModel):
    """Defines who can approve a particular workflow transition"""
    workflow = models.ForeignKey(
        Workflow, on_delete=models.CASCADE, related_name="workflow_approvers"
    )
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
        db_table = "workflow_approvers"
        verbose_name = "Workflow Approver"
        verbose_name_plural = "Workflow Approvers"


class WorkflowApproval(ProjectBaseModel):
    """Records approvals/rejections for specific issues"""
    workflow = models.ForeignKey(
        Workflow, on_delete=models.CASCADE, related_name="workflow_approvals"
    )
    workflow_transition = models.ForeignKey(
        WorkflowTransition,
        on_delete=models.CASCADE,
        related_name="workflow_approvals",
    )
    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.CASCADE,
        related_name="workflow_approvals"
    )
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
        db_table = "workflow_approvals"
        verbose_name = "Workflow Approval"
        verbose_name_plural = "Workflow Approvals"


class WorkflowActivity(ProjectBaseModel):
    workflow = models.ForeignKey(
        Workflow, on_delete=models.CASCADE, related_name="workflow_activities"
    )
    verb = models.CharField(max_length=255, verbose_name="Action", default="created")
    field = models.CharField(
        max_length=255, verbose_name="Field Name", blank=True, null=True
    )
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
        verbose_name = "Workflow Activity"
        verbose_name_plural = "Workflow Activities"
        db_table = "workflow_activities"
        ordering = ("-created_at",)

    def __str__(self):
        """Return workflow of the comment"""
        return str(self.workflow)
