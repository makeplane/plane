# Django imports
from django.db import models
from django.conf import settings

# Module imports
from . import ProjectBaseModel


class Page(ProjectBaseModel):
    name = models.CharField(max_length=255)
    description = models.JSONField(default=dict, blank=True)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    owned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="pages"
    )
    access = models.PositiveSmallIntegerField(
        choices=((0, "Public"), (1, "Private")), default=0
    )

    class Meta:
        verbose_name = "Page"
        verbose_name_plural = "Pages"
        db_table = "pages"
        ordering = ("-created_at",)

    def __str__(self):
        """Return owner email and page name"""
        return f"{self.owned_by.email} <{self.name}>"


class PageBlock(ProjectBaseModel):
    page = models.ForeignKey("db.Page", on_delete=models.CASCADE, related_name="blocks")
    name = models.CharField(max_length=255)
    description = models.JSONField(default=dict, blank=True)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    issue = models.ForeignKey(
        "db.Issue", on_delete=models.SET_NULL, related_name="blocks", null=True
    )
    completed_at = models.DateTimeField(null=True)

    class Meta:
        verbose_name = "Page Block"
        verbose_name_plural = "Page Blocks"
        db_table = "page_blocks"
        ordering = ("-created_at",)

    def __str__(self):
        """Return page and page block"""
        return f"{self.page.name} <{self.name}>"


class PageFavorite(ProjectBaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="page_favorites",
    )
    page = models.ForeignKey(
        "db.Page", on_delete=models.CASCADE, related_name="page_favorites"
    )

    class Meta:
        unique_together = ["page", "user"]
        verbose_name = "Page Favorite"
        verbose_name_plural = "Page Favorites"
        db_table = "page_favorites"
        ordering = ("-created_at",)

    def __str__(self):
        """Return user and the page"""
        return f"{self.user.email} <{self.page.name}>"
