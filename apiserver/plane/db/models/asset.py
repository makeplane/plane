# Python imports
from uuid import uuid4

# Django import
from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings

# Module import
from . import BaseModel


def get_upload_path(instance, filename):
    if instance.workspace_id is not None:
        return f"{instance.workspace.id}/{uuid4().hex}-{filename}"
    return f"user-{uuid4().hex}-{filename}"


def file_size(value):
    # File limit check is only for cloud hosted
    if not settings.DOCKERIZED:
        limit = 5 * 1024 * 1024
        if value.size > limit:
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
        "db.Workspace", on_delete=models.CASCADE, null=True, related_name="assets"
    )

    class Meta:
        verbose_name = "File Asset"
        verbose_name_plural = "File Assets"
        db_table = "file_assets"
        ordering = ("-created_at",)

    def __str__(self):
        return str(self.asset)
