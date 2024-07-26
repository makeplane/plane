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
    )

    entity_identifier = models.UUIDField(null=True)
    entity_name = models.CharField(
        max_length=30,
        choices=TYPE_CHOICES,
    )
    anchor = models.CharField(
        max_length=255, default=get_anchor, unique=True, db_index=True
    )
    is_comments_enabled = models.BooleanField(default=False)
    is_reactions_enabled = models.BooleanField(default=False)
    inbox = models.ForeignKey(
        "db.Inbox",
        related_name="board_inbox",
        on_delete=models.SET_NULL,
        null=True,
    )
    is_votes_enabled = models.BooleanField(default=False)
    view_props = models.JSONField(default=dict)

    def __str__(self):
        """Return name of the deploy board"""
        return f"{self.entity_identifier} <{self.entity_name}>"

    class Meta:
        unique_together = ["entity_name", "entity_identifier"]
        verbose_name = "Deploy Board"
        verbose_name_plural = "Deploy Boards"
        db_table = "deploy_boards"
        ordering = ("-created_at",)
