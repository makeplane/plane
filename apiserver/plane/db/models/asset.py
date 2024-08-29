# Python imports
from uuid import uuid4

# Django import
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.core.validators import FileExtensionValidator

# Third party imports
import magic

# Module import
from .base import BaseModel


def validate_file_type(file):
    # Read the first 2048 bytes to determine the file type
    file_header = file.read(2048)
    file_type = magic.from_buffer(file_header, mime=True)
    file.seek(0)  # Reset file pointer

    # List of allowed MIME types
    allowed_types = ["image/jpeg", "image/png"]

    if file_type not in allowed_types:
        raise ValidationError(
            f"Unsupported file type: {file_type}. Allowed types are JPEG and PNG."
        )


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
            FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png"]),
            validate_file_type,
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
    is_archived = models.BooleanField(default=False)

    class Meta:
        verbose_name = "File Asset"
        verbose_name_plural = "File Assets"
        db_table = "file_assets"
        ordering = ("-created_at",)

    def __str__(self):
        return str(self.asset)
