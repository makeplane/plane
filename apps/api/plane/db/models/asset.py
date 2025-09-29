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
        PAGE_COMMENT_DESCRIPTION = "PAGE_COMMENT_DESCRIPTION"
        USER_COVER = "USER_COVER"
        USER_AVATAR = "USER_AVATAR"
        WORKSPACE_LOGO = "WORKSPACE_LOGO"
        PROJECT_COVER = "PROJECT_COVER"
        DRAFT_ISSUE_ATTACHMENT = "DRAFT_ISSUE_ATTACHMENT"
        DRAFT_ISSUE_DESCRIPTION = "DRAFT_ISSUE_DESCRIPTION"
        INITIATIVE_DESCRIPTION = "INITIATIVE_DESCRIPTION"
        INITIATIVE_ATTACHMENT = "INITIATIVE_ATTACHMENT"
        INITIATIVE_COMMENT_DESCRIPTION = "INITIATIVE_COMMENT_DESCRIPTION"
        PROJECT_DESCRIPTION = "PROJECT_DESCRIPTION"
        PROJECT_ATTACHMENT = "PROJECT_ATTACHMENT"
        TEAM_SPACE_DESCRIPTION = "TEAM_SPACE_DESCRIPTION"
        TEAM_SPACE_COMMENT_DESCRIPTION = "TEAM_SPACE_COMMENT_DESCRIPTION"
        OAUTH_APP_LOGO = "OAUTH_APP_LOGO"
        OAUTH_APP_DESCRIPTION = "OAUTH_APP_DESCRIPTION"
        OAUTH_APP_ATTACHMENT = "OAUTH_APP_ATTACHMENT"
        CUSTOMER_REQUEST_ATTACHMENT = "CUSTOMER_REQUEST_ATTACHMENT"
        CUSTOMER_LOGO = "CUSTOMER_LOGO"
        CUSTOMER_DESCRIPTION = "CUSTOMER_DESCRIPTION"
        CUSTOMER_REQUEST_DESCRIPTION = "CUSTOMER_REQUEST_DESCRIPTION"
        WORKITEM_TEMPLATE_DESCRIPTION = "WORKITEM_TEMPLATE_DESCRIPTION"
        PAGE_TEMPLATE_DESCRIPTION = "PAGE_TEMPLATE_DESCRIPTION"
        TEMPLATE_ATTACHMENT = "TEMPLATE_ATTACHMENT"
        LICENSE_FILE = "LICENSE_FILE"

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
        indexes = [
            models.Index(fields=["entity_type"], name="asset_entity_type_idx"),
            models.Index(
                fields=["entity_identifier"], name="asset_entity_identifier_idx"
            ),
            models.Index(
                fields=["entity_type", "entity_identifier"], name="asset_entity_idx"
            ),
        ]

    def __str__(self):
        return str(self.asset)

    @property
    def asset_url(self):
        if self.entity_type in (
            self.EntityTypeContext.WORKSPACE_LOGO,
            self.EntityTypeContext.USER_AVATAR,
            self.EntityTypeContext.USER_COVER,
            self.EntityTypeContext.PROJECT_COVER,
            self.EntityTypeContext.OAUTH_APP_LOGO,
            self.EntityTypeContext.OAUTH_APP_DESCRIPTION,
            self.EntityTypeContext.OAUTH_APP_ATTACHMENT,
            self.EntityTypeContext.CUSTOMER_LOGO,
            self.EntityTypeContext.TEMPLATE_ATTACHMENT,
        ):
            return f"/api/assets/v2/static/{self.id}/"

        if self.entity_type == self.EntityTypeContext.ISSUE_ATTACHMENT:
            return f"/api/assets/v2/workspaces/{self.workspace.slug}/projects/{self.project_id}/issues/{self.issue_id}/attachments/{self.id}/"

        if self.entity_type == self.EntityTypeContext.PROJECT_ATTACHMENT:
            return f"/api/assets/v2/workspaces/{self.workspace.slug}/projects/{self.project_id}/attachments/{self.id}/"

        if self.entity_type == self.EntityTypeContext.INITIATIVE_ATTACHMENT:
            return f"/api/assets/v2/workspaces/{self.workspace.slug}/initiatives/{self.entity_identifier}/attachments/{self.id}/"

        if self.entity_type == FileAsset.EntityTypeContext.CUSTOMER_REQUEST_ATTACHMENT:
            return f"/api/assets/v2/workspaces/{self.workspace.slug}/customer-requests/{self.entity_identifier}/attachments/{self.id}/"

        if self.entity_type in [
            self.EntityTypeContext.ISSUE_DESCRIPTION,
            self.EntityTypeContext.COMMENT_DESCRIPTION,
            self.EntityTypeContext.PAGE_DESCRIPTION,
            self.EntityTypeContext.DRAFT_ISSUE_DESCRIPTION,
            self.EntityTypeContext.PROJECT_DESCRIPTION,
        ]:
            return f"/api/assets/v2/workspaces/{self.workspace.slug}/projects/{self.project_id}/{self.id}/"

        if self.entity_type in [
            self.EntityTypeContext.INITIATIVE_DESCRIPTION,
            self.EntityTypeContext.TEAM_SPACE_DESCRIPTION,
            self.EntityTypeContext.INITIATIVE_COMMENT_DESCRIPTION,
            self.EntityTypeContext.TEAM_SPACE_COMMENT_DESCRIPTION,
            self.EntityTypeContext.CUSTOMER_DESCRIPTION,
            self.EntityTypeContext.WORKITEM_TEMPLATE_DESCRIPTION,
            self.EntityTypeContext.PAGE_TEMPLATE_DESCRIPTION,
            self.EntityTypeContext.PAGE_COMMENT_DESCRIPTION,
        ]:
            return f"/api/assets/v2/workspaces/{self.workspace.slug}/{self.id}/"

        return None
