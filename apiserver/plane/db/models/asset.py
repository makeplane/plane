# Python imports
from uuid import uuid4

# Django import
from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings

# Module import
from . import BaseModel
from plane.settings.storage import S3PrivateBucketStorage

def get_upload_path(instance, filename):
    if instance.workspace_id is not None:
        return f"{instance.workspace.id}/{uuid4().hex}"
    return f"user-{uuid4().hex}"


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
        storage=S3PrivateBucketStorage(),
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        null=True,
        related_name="assets",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        null=True,
        related_name="assets",
    )
    entity_type = models.CharField(
        choices=(
            ("issue", "Issue"),
            ("comment", "Comment"),
            ("page", "Page"),
        ),
        null=True,
    )
    entity_identifier = models.UUIDField(null=True)
    is_deleted = models.BooleanField(default=False)
    size = models.PositiveBigIntegerField(null=True)

    class Meta:
        verbose_name = "File Asset"
        verbose_name_plural = "File Assets"
        db_table = "file_assets"
        ordering = ("-created_at",)

    def __str__(self):
        return str(self.asset)

    def save(self, *args, **kwargs):
        self.size = self.asset.size
        super(FileAsset, self).save(*args, **kwargs)
