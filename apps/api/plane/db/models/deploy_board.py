# Python imports
from uuid import uuid4

# Django imports
from django.db import models

# Module imports
from .workspace import WorkspaceBaseModel


def get_anchor():
    return uuid4().hex


class DeployBoard(WorkspaceBaseModel):
    TYPE_CHOICES = (
        ("project", "Project"),
        ("issue", "Issue"),
        ("module", "Module"),
        ("cycle", "Task"),
        ("page", "Page"),
        ("view", "View"),
        ("intake", "Intake"),
    )

    entity_identifier = models.UUIDField(null=True)
    entity_name = models.CharField(max_length=30, null=True, blank=True)
    anchor = models.CharField(max_length=255, default=get_anchor, unique=True, db_index=True)
    is_comments_enabled = models.BooleanField(default=False)
    is_reactions_enabled = models.BooleanField(default=False)
    intake = models.ForeignKey("db.Intake", related_name="publish_intake", on_delete=models.SET_NULL, null=True)
    is_votes_enabled = models.BooleanField(default=False)
    view_props = models.JSONField(default=dict)
    is_activity_enabled = models.BooleanField(default=True)
    is_disabled = models.BooleanField(default=False)

    def __str__(self):
        """Return name of the deploy board"""
        return f"{self.entity_identifier} <{self.entity_name}>"

    class Meta:
        unique_together = ["entity_name", "entity_identifier", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["entity_name", "entity_identifier"],
                condition=models.Q(deleted_at__isnull=True),
                name="deploy_board_unique_entity_name_entity_identifier_when_deleted_at_null",
            )
        ]
        verbose_name = "Deploy Board"
        verbose_name_plural = "Deploy Boards"
        db_table = "deploy_boards"
        ordering = ("-created_at",)
