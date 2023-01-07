# Django import
from django.db import models

# Module import
from . import BaseModel


def get_upload_path(instance, filename):
    return f"{instance.workspace.id}/{filename}"


class FileAsset(BaseModel):
    """
    A file asset.
    """

    attributes = models.JSONField(default=dict)
    asset = models.FileField(upload_to=get_upload_path)
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, null=True, related_name="assets")

    class Meta:
        verbose_name = "File Asset"
        verbose_name_plural = "File Assets"
        db_table = "file_assets"
        ordering = ("-created_at",)

    def __str__(self):
        return str(self.asset)
