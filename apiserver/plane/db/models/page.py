# Django imports
from django.db import models
from django.conf import settings

# Module imports
from . import ProjectBaseModel
from plane.utils.html_processor import strip_tags


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
    color = models.CharField(max_length=255, blank=True)
    labels = models.ManyToManyField(
        "db.Label", blank=True, related_name="pages", through="db.PageLabel"
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
    sort_order = models.FloatField(default=65535)

    def save(self, *args, **kwargs):
        if self._state.adding:
            largest_sort_order = PageBlock.objects.filter(
                project=self.project, page=self.page
            ).aggregate(largest=models.Max("sort_order"))["largest"]
            if largest_sort_order is not None:
                self.sort_order = largest_sort_order + 10000

        # Strip the html tags using html parser
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )

        if self.completed_at and self.issue:
            try:
                from plane.db.models import State, Issue

                completed_state = State.objects.filter(
                    group="completed", project=self.project
                ).first()
                if completed_state is not None:
                    Issue.objects.update(pk=self.issue_id, state=completed_state)
            except ImportError:
                pass
        super(PageBlock, self).save(*args, **kwargs)

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


class PageLabel(ProjectBaseModel):
    label = models.ForeignKey(
        "db.Label", on_delete=models.CASCADE, related_name="page_labels"
    )
    page = models.ForeignKey(
        "db.Page", on_delete=models.CASCADE, related_name="page_labels"
    )

    class Meta:
        verbose_name = "Page Label"
        verbose_name_plural = "Page Labels"
        db_table = "page_labels"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.page.name} {self.label.name}"
