# Django imports
from django.db import models
from django.conf import settings

# Module imports
from . import ProjectBaseModel


class Paper(ProjectBaseModel):
    name = models.CharField(max_length=255)
    description = models.JSONField(default=dict, blank=True)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    owned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="papers"
    )
    access = models.PositiveSmallIntegerField(
        choices=((0, "Public"), (1, "Private")), default=0
    )

    class Meta:
        verbose_name = "Paper"
        verbose_name_plural = "Papers"
        db_table = "papers"
        ordering = ("-created_at",)


class PaperBlocks(ProjectBaseModel):
    paper = models.ForeignKey(
        "db.Paper", on_delete=models.CASCADE, related_name="blocks"
    )
    name = models.CharField(max_length=255)
    description = models.JSONField(default=dict, blank=True)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    issue = models.ForeignKey(
        "db.Issue", on_delete=models.SET_NULL, related_name="blocks", null=True
    )
    completed = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Paper Block"
        verbose_name_plural = "Paper Blocks"
        db_table = "paper_blocks"
        ordering = ("-created_at",)
