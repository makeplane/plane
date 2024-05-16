from django.conf import settings

# Django imports
from django.db import models

# Module imports
from .workspace import WorkspaceBaseModel


class UserFavorite(WorkspaceBaseModel):
    """_summary_
    UserFavorite (model): To store all the favorites of the user
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favorites",
    )
    entity_name = models.CharField(max_length=100)
    entity_identifier = models.UUIDField()

    class Meta:
        unique_together = ["entity_name", "user", "entity_identifier"]
        verbose_name = "User Favorite"
        verbose_name_plural = "User Favorites"
        db_table = "user_favorites"
        ordering = ("-created_at",)

    def __str__(self):
        """Return user and the entity name"""
        return f"{self.user.email} <{self.entity_name}>"
