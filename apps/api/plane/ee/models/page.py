from django.conf import settings
from django.db import models

from plane.db.models import Page
from .workspace import WorkspaceBaseModel


class PageUser(WorkspaceBaseModel):
    """
    This model is used to store the users who have access to the private page.
    Defines the possible access levels a user can have for a private page:
        - VIEW (0): User can only view the page content
        - COMMENT (1): User can view and add comments to the page
        - EDIT (2): User has full edit access to the page
    """

    class AccessLevel(models.IntegerChoices):
        VIEW = 0, "View"
        COMMENT = 1, "Comment"
        EDIT = 2, "Edit"

    page = models.ForeignKey(Page, related_name="page_users", on_delete=models.CASCADE)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="page_users",
    )
    access = models.PositiveSmallIntegerField(default=AccessLevel.VIEW)

    class Meta:
        unique_together = ["page", "user", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["page", "user"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_page_user",
            )
        ]
        verbose_name = "Page User"
        verbose_name_plural = "Page Users"
        db_table = "page_users"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.user.email} - {self.page.id}"
