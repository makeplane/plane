# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from uuid import uuid4

# Django import
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

# Module import
from plane.utils.path_validator import sanitize_filename

from .base import BaseModel
from .project import ProjectMember


def get_upload_path(instance, filename):
    filename = sanitize_filename(filename) or uuid4().hex
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
    user = models.ForeignKey("db.User", on_delete=models.CASCADE, null=True, related_name="assets")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, null=True, related_name="assets")
    draft_issue = models.ForeignKey("db.DraftIssue", on_delete=models.CASCADE, null=True, related_name="assets")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, null=True, related_name="assets")
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, null=True, related_name="assets")
    comment = models.ForeignKey("db.IssueComment", on_delete=models.CASCADE, null=True, related_name="assets")
    page = models.ForeignKey("db.Page", on_delete=models.CASCADE, null=True, related_name="assets")
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
            models.Index(fields=["entity_identifier"], name="asset_entity_identifier_idx"),
            models.Index(fields=["entity_type", "entity_identifier"], name="asset_entity_idx"),
            models.Index(fields=["asset"], name="asset_asset_idx"),
        ]

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
            return f"/api/assets/v2/workspaces/{self.workspace.slug}/projects/{self.project_id}/issues/{self.issue_id}/attachments/{self.id}/"  # noqa: E501

        if self.entity_type in [
            self.EntityTypeContext.ISSUE_DESCRIPTION,
            self.EntityTypeContext.COMMENT_DESCRIPTION,
            self.EntityTypeContext.PAGE_DESCRIPTION,
            self.EntityTypeContext.DRAFT_ISSUE_DESCRIPTION,
        ]:
            return f"/api/assets/v2/workspaces/{self.workspace.slug}/projects/{self.project_id}/{self.id}/"

        return None

    def is_project_accessible_to(self, user):
        """Return whether ``user`` clears the project dimension of access to this asset.

        This is the project-membership half of asset authorization and nothing
        more. Callers are still responsible for establishing that ``user`` may
        act in this asset's workspace at all -- typically the endpoint's
        permission class or ``allow_permission(..., level="WORKSPACE")``.

        It exists as a model method rather than a view helper because the
        workspace-level asset routes are spread across several unrelated
        ``BaseAPIView`` subclasses in both the app and the external API, and a
        helper bound to one of those classes is unreachable from the others.
        That is precisely how the earlier project-scoping fix came to cover
        three handlers and miss the rest: a route added later has no way to
        inherit the rule. Keeping it on the model means every surface that can
        load a ``FileAsset`` can also ask the question.

        Assets with no project (workspace logos, user avatars and covers) carry
        ``project_id=None`` and are workspace-level by definition, so they clear
        this check; workspace authorization is the only gate that applies.
        """
        if self.project_id is None:
            return True
        # Scope the membership lookup to this asset's workspace as well as its
        # project. A project id alone would let a member of a same-id project in
        # a different workspace pass, should a row ever be inconsistent
        # (workspace_id != project.workspace_id) -- a state the external API's
        # create path could previously produce.
        return ProjectMember.objects.filter(
            member=user,
            workspace_id=self.workspace_id,
            project_id=self.project_id,
            is_active=True,
        ).exists()
