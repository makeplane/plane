# Python imports
from uuid import uuid4

# Django import
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.core.validators import FileExtensionValidator

# Module import
from .base import BaseModel
from plane.settings.storage import S3Storage


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

    class EntityTypeContext(models.TextChoices):
        ISSUE_ATTACHMENT = "ISSUE_ATTACHMENT"
        ISSUE_DESCRIPTION = "ISSUE_DESCRIPTION"
        COMMENT_DESCRIPTION = "COMMENT_DESCRIPTION"
        PAGE_DESCRIPTION = "PAGE_DESCRIPTION"
        COVER_IMAGE = "COVER_IMAGE"

    attributes = models.JSONField(default=dict)
    asset = models.FileField(
        upload_to=get_upload_path,
        validators=[
            FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png"]),
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
    entity_identifier = models.UUIDField(null=True, blank=True)
    entity_type = models.CharField(
        max_length=255,
        choices=EntityTypeContext.choices,
        null=True,
        blank=True,
    )
    external_id = models.CharField(max_length=255, null=True, blank=True)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        null=True,
        related_name="assets",
    )
    size = models.FloatField(default=0)
    is_uploaded = models.BooleanField(default=False)
    storage_metadata = models.JSONField(default=dict, null=True, blank=True)

    class Meta:
        verbose_name = "File Asset"
        verbose_name_plural = "File Assets"
        db_table = "file_assets"
        ordering = ("-created_at",)

    def __str__(self):
        return str(self.asset)

    @property
    def signed_url(self):
        storage = S3Storage()
        return storage.generate_presigned_url(self.asset.name)

    @property
    def asset_url(self):
        if self.entity_type == self.EntityTypeContext.COVER_IMAGE:
            return f"/api/v2/assets/{self.id}/"

        if self.entity_type == self.EntityTypeContext.ISSUE_ATTACHMENT:
            return f"/api/v2/workspaces/{self.workspace.slug}/projects/{self.project_id}/issues/{self.entity_identifier}/attachments/{self.id}/"

        if self.entity_type == self.EntityTypeContext.ISSUE_DESCRIPTION:
            return f"/api/v2/workspaces/{self.workspace.slug}/projects/{self.project_id}/issues/{self.entity_identifier}/assets/{self.id}/"

        if self.entity_type == self.EntityTypeContext.COMMENT_DESCRIPTION:
            return f"/api/v2/workspaces/{self.workspace.slug}/projects/{self.project_id}/comments/{self.entity_identifier}/assets/{self.id}/"

        if self.entity_type == self.EntityTypeContext.PAGE_DESCRIPTION:
            return f"/api/v2/workspaces/{self.workspace.slug}/projects/{self.project_id}/pages/{self.entity_identifier}/assets/{self.id}/"

        return None
