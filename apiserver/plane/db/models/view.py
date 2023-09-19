# Django imports
from django.db import models
from django.conf import settings

# Module import
from . import ProjectBaseModel, BaseModel


class GlobalView(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="global_views"
    )
    name = models.CharField(max_length=255, verbose_name="View Name")
    description = models.TextField(verbose_name="View Description", blank=True)
    query = models.JSONField(verbose_name="View Query")
    access = models.PositiveSmallIntegerField(
        default=1, choices=((0, "Private"), (1, "Public"))
    )
    query_data = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Global View"
        verbose_name_plural = "Global Views"
        db_table = "global_views"
        ordering = ("-created_at",)

    def __str__(self):
        """Return name of the View"""
        return f"{self.name} <{self.workspace.name}>"


class IssueView(ProjectBaseModel):
    name = models.CharField(max_length=255, verbose_name="View Name")
    description = models.TextField(verbose_name="View Description", blank=True)
    query = models.JSONField(verbose_name="View Query")
    access = models.PositiveSmallIntegerField(
        default=1, choices=((0, "Private"), (1, "Public"))
    )
    query_data = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Issue View"
        verbose_name_plural = "Issue Views"
        db_table = "issue_views"
        ordering = ("-created_at",)

    def __str__(self):
        """Return name of the View"""
        return f"{self.name} <{self.project.name}>"


class IssueViewFavorite(ProjectBaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_view_favorites",
    )
    view = models.ForeignKey(
        "db.IssueView", on_delete=models.CASCADE, related_name="view_favorites"
    )

    class Meta:
        unique_together = ["view", "user"]
        verbose_name = "View Favorite"
        verbose_name_plural = "View Favorites"
        db_table = "view_favorites"
        ordering = ("-created_at",)

    def __str__(self):
        """Return user and the view"""
        return f"{self.user.email} <{self.view.name}>"
