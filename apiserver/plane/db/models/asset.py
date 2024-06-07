# Python imports
from uuid import uuid4

from django.conf import settings
from django.core.exceptions import ValidationError

# Django import
from django.db import models

# Module import
from .base import BaseModel


def get_upload_path(instance, filename):
    filename = filename[:50]
    if instance.workspace_id is not None:
        return f"{instance.workspace.id}/{uuid4().hex}-{filename}"
    return f"user-{uuid4().hex}-{filename}"


def file_size(value):
    if value.size > settings.FILE_SIZE_LIMIT:
        raise ValidationError("File too large. Size should not exceed 5 MB.")


class FileAsset(BaseModel):
    """
    A file asset.
    """

    attributes = models.JSONField(default=dict)
    asset = models.FileField(
        upload_to=get_upload_path,
        validators=[
            file_size,
        ],
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        null=True,
        related_name="assets",
    )
    is_deleted = models.BooleanField(default=False)

    class Meta:
        verbose_name = "File Asset"
        verbose_name_plural = "File Assets"
        db_table = "file_assets"
        ordering = ("-created_at",)

    def __str__(self):
        return str(self.asset)
