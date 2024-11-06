# Django imports
from django.db import models
from django.conf import settings

# Module imports
from .workspace import WorkspaceBaseModel


class EntityNameEnum(models.TextChoices):
    VIEW = "VIEW", "View"
    PAGE = "PAGE", "Page"
    ISSUE = "ISSUE", "Issue"
    CYCLE = "CYCLE", "Cycle"
    MODULE = "MODULE", "Module"
    PROJECT = "PROJECT", "Project"


class UserRecentVisit(WorkspaceBaseModel):
    entity_identifier = models.UUIDField(null=True)
    entity_name = models.CharField(
        max_length=30,
        choices=EntityNameEnum.choices,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_recent_visit",
    )
    visited_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Recent Visit"
        verbose_name_plural = "User Recent Visits"
        db_table = "user_recent_visits"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.entity_name} {self.user.email}"
