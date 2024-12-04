# Python imports
from uuid import uuid4

# Django import
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

# Module import
from .base import BaseModel


def get_upload_path(instance, filename):
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
        USER_COVER = "USER_COVER"
        USER_AVATAR = "USER_AVATAR"
        WORKSPACE_LOGO = "WORKSPACE_LOGO"
        PROJECT_COVER = "PROJECT_COVER"
        DRAFT_ISSUE_ATTACHMENT = "DRAFT_ISSUE_ATTACHMENT"
        DRAFT_ISSUE_DESCRIPTION = "DRAFT_ISSUE_DESCRIPTION"

    attributes = models.JSONField(default=dict)
    asset = models.FileField(upload_to=get_upload_path, max_length=800)
    user = models.ForeignKey(
        "db.User", on_delete=models.CASCADE, null=True, related_name="assets"
    )
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, null=True, related_name="assets"
    )
    draft_issue = models.ForeignKey(
        "db.DraftIssue", on_delete=models.CASCADE, null=True, related_name="assets"
    )
    project = models.ForeignKey(
        "db.Project", on_delete=models.CASCADE, null=True, related_name="assets"
    )
    issue = models.ForeignKey(
        "db.Issue", on_delete=models.CASCADE, null=True, related_name="assets"
    )
    comment = models.ForeignKey(
        "db.IssueComment", on_delete=models.CASCADE, null=True, related_name="assets"
    )
    page = models.ForeignKey(
        "db.Page", on_delete=models.CASCADE, null=True, related_name="assets"
    )
    entity_type = models.CharField(max_length=255, null=True, blank=True)
    entity_identifier = models.CharField(max_length=255, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    external_id = models.CharField(max_length=255, null=True, blank=True)
    external_source = models.CharField(max_length=255, null=True, blank=True)
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
    def asset_url(self):
        if (
            self.entity_type == self.EntityTypeContext.WORKSPACE_LOGO
            or self.entity_type == self.EntityTypeContext.USER_AVATAR
            or self.entity_type == self.EntityTypeContext.USER_COVER
            or self.entity_type == self.EntityTypeContext.PROJECT_COVER
        ):
            return f"/api/assets/v2/static/{self.id}/"

        if self.entity_type == self.EntityTypeContext.ISSUE_ATTACHMENT:
            return f"/api/assets/v2/workspaces/{self.workspace.slug}/projects/{self.project_id}/issues/{self.issue_id}/attachments/{self.id}/"

        if self.entity_type in [
            self.EntityTypeContext.ISSUE_DESCRIPTION,
            self.EntityTypeContext.COMMENT_DESCRIPTION,
            self.EntityTypeContext.PAGE_DESCRIPTION,
            self.EntityTypeContext.DRAFT_ISSUE_DESCRIPTION,
        ]:
            return f"/api/assets/v2/workspaces/{self.workspace.slug}/projects/{self.project_id}/{self.id}/"

        return None
