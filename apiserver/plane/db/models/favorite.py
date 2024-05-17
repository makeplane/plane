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
    entity_type = models.CharField(max_length=100)
    entity_identifier = models.UUIDField(null=True, blank=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    is_folder = models.BooleanField(default=False)
    sequence = models.IntegerField(default=0)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="parent_folder",
    )

    class Meta:
        unique_together = ["entity_type", "user", "entity_identifier"]
        verbose_name = "User Favorite"
        verbose_name_plural = "User Favorites"
        db_table = "user_favorites"
        ordering = ("-created_at",)

    def __str__(self):
        """Return user and the entity type"""
        return f"{self.user.email} <{self.entity_type}>"
