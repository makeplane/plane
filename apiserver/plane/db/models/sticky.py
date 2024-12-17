# Django imports
from django.conf import settings
from django.db import models

# Module imports
from .base import BaseModel


class Sticky(BaseModel):
    name = models.TextField()

    description = models.JSONField(blank=True, default=dict)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    description_binary = models.BinaryField(null=True)

    logo_props = models.JSONField(default=dict)
    color = models.CharField(max_length=255, blank=True, null=True)
    background_color = models.CharField(max_length=255, blank=True, null=True)

    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="stickies"
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="stickies"
    )

    class Meta:
        verbose_name = "Sticky"
        verbose_name_plural = "Stickies"
        db_table = "stickies"
        ordering = ("-created_at",)
