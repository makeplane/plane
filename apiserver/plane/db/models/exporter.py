import uuid

# Python imports
from uuid import uuid4

from django.conf import settings
from django.contrib.postgres.fields import ArrayField

# Django imports
from django.db import models

# Module imports
from .base import BaseModel


def generate_token():
    return uuid4().hex


class ExporterHistory(BaseModel):
    name = models.CharField(
        max_length=255, verbose_name="Exporter Name", null=True, blank=True
    )
    type = models.CharField(
        max_length=50,
        default="issue_exports",
        choices=(
            ("issue_exports", "Issue Exports"),
            ("issue_worklogs", "Issue Worklogs"),
        ),
    )
    workspace = models.ForeignKey(
        "db.WorkSpace", on_delete=models.CASCADE, related_name="workspace_exporters"
    )
    project = ArrayField(models.UUIDField(default=uuid.uuid4), blank=True, null=True)
    provider = models.CharField(
        max_length=50, choices=(("json", "json"), ("csv", "csv"), ("xlsx", "xlsx"))
    )
    status = models.CharField(
        max_length=50,
        choices=(
            ("queued", "Queued"),
            ("processing", "Processing"),
            ("completed", "Completed"),
            ("failed", "Failed"),
        ),
        default="queued",
    )
    reason = models.TextField(blank=True)
    key = models.TextField(blank=True)
    url = models.URLField(max_length=800, blank=True, null=True)
    token = models.CharField(max_length=255, default=generate_token, unique=True)
    initiated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_exporters",
    )
    filters = models.JSONField(blank=True, null=True)

    class Meta:
        verbose_name = "Exporter"
        verbose_name_plural = "Exporters"
        db_table = "exporters"
        ordering = ("-created_at",)

    def __str__(self):
        """Return name of the service"""
        return f"{self.provider} <{self.workspace.name}>"
