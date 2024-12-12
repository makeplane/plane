# Django imports
from django.db import models
from django.conf import settings

# Module imports
from plane.db.models import ProjectBaseModel


class Workflow(ProjectBaseModel):
    state = models.ForeignKey(
        "db.State", on_delete=models.CASCADE, related_name="workflows"
    )

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
    workflow = models.ForeignKey(
        Workflow, on_delete=models.CASCADE, related_name="workflow_transitions"
    )
    transition_state = models.ForeignKey(
        "db.State", on_delete=models.CASCADE, related_name="workflow_transitions"
    )

    class Meta:
        unique_together = ["workflow", "transition_state", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["workflow", "transition_state"],
                condition=models.Q(deleted_at__isnull=True),
                name="workflow_transition_unique_workflow_transition_when_deleted_at_null",
            )
        ]
        db_table = "workflow_transitions"
        verbose_name = "Workflow Transition"
        verbose_name_plural = "Workflow Transitions"


class WorkflowTransitionActor(ProjectBaseModel):
    workflow = models.ForeignKey(
        Workflow, on_delete=models.CASCADE, related_name="workflow_transition_actors"
    )
    workflow_transition = models.ForeignKey(
        WorkflowTransition,
        on_delete=models.CASCADE,
        related_name="workflow_transition_actors",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workflow_transition_actors",
    )

    class Meta:
        unique_together = ["workflow_transition", "actor", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["workflow_transition", "actor"],
                condition=models.Q(deleted_at__isnull=True),
                name="workflow_transition_actor_unique_workflow_transition_actor_when_deleted_at_null",
            )
        ]
        db_table = "workflow_transition_actors"
        verbose_name = "Workflow Transition Actor"
        verbose_name_plural = "Workflow Transition Actors"
