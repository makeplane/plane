# Django imports
from django.db import models

# Module imports
from plane.db.models.base import BaseModel


class WorkspaceFeature(BaseModel):
    workspace = models.OneToOneField(
        "db.Workspace", on_delete=models.CASCADE, related_name="features"
    )
    is_project_grouping_enabled = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Workspace Feature"
        verbose_name_plural = "Workspace Features"
        db_table = "workspace_features"
        ordering = ("-created_at",)
