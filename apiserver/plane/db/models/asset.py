# Django import
from django.db import models

# Module import
from . import BaseModel


class FileAsset(BaseModel):
    """
    A file asset.
    """

    attributes = models.JSONField(default=dict)
    asset = models.FileField(upload_to="library-assets")

    class Meta:
        verbose_name = "File Asset"
        verbose_name_plural = "File Assets"
        db_table = "file_asset"
        ordering = ("-created_at",)

    def __str__(self):
        return self.asset

