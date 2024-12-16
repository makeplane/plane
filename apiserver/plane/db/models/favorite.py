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
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites"
    )
    entity_type = models.CharField(max_length=100)
    entity_identifier = models.UUIDField(null=True, blank=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    is_folder = models.BooleanField(default=False)
    sequence = models.FloatField(default=65535)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="parent_folder",
    )

    class Meta:
        unique_together = ["entity_type", "user", "entity_identifier", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["entity_type", "entity_identifier", "user"],
                condition=models.Q(deleted_at__isnull=True),
                name="user_favorite_unique_entity_type_entity_identifier_user_when_deleted_at_null",
            )
        ]
        verbose_name = "User Favorite"
        verbose_name_plural = "User Favorites"
        db_table = "user_favorites"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        if self._state.adding:
            if self.project:
                largest_sequence = UserFavorite.objects.filter(
                    workspace=self.project.workspace
                ).aggregate(largest=models.Max("sequence"))["largest"]
            else:
                largest_sequence = UserFavorite.objects.filter(
                    workspace=self.workspace
                ).aggregate(largest=models.Max("sequence"))["largest"]
            if largest_sequence is not None:
                self.sequence = largest_sequence + 10000

        super(UserFavorite, self).save(*args, **kwargs)

    def __str__(self):
        """Return user and the entity type"""
        return f"{self.user.email} <{self.entity_type}>"
