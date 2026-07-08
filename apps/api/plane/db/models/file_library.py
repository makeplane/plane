# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models
from django.db.models import Q

from .base import BaseModel

# Name of the protected default category created when the module is enabled
DEFAULT_CONTRACT_CATEGORY_NAME = "Contratos"


class WorkspaceFeature(BaseModel):
    """Per-workspace feature toggle, managed from the instance admin (god-mode)."""

    class FeatureKey(models.TextChoices):
        FILE_LIBRARY = "file_library"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="feature_flags")
    key = models.CharField(max_length=100, choices=FeatureKey.choices)
    is_enabled = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "key"],
                condition=Q(deleted_at__isnull=True),
                name="unique_workspace_feature_key_when_not_deleted",
            )
        ]
        verbose_name = "Workspace Feature"
        verbose_name_plural = "Workspace Features"
        db_table = "workspace_features"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.workspace_id} {self.key} {self.is_enabled}"


class FileFolder(BaseModel):
    """A folder in the workspace file library.

    Folders are the physical location of a file (a file lives in exactly one
    folder, or at the root); categories and tags are orthogonal labels.
    """

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="file_folders")
    name = models.CharField(max_length=255)
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True, related_name="children")

    class Meta:
        constraints = [
            # Postgres treats NULLs as distinct, so root folders (parent IS
            # NULL) need their own uniqueness constraint
            models.UniqueConstraint(
                fields=["workspace", "parent", "name"],
                condition=Q(parent__isnull=False, deleted_at__isnull=True),
                name="unique_file_folder_name_per_parent_when_not_deleted",
            ),
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(parent__isnull=True, deleted_at__isnull=True),
                name="unique_root_file_folder_name_when_not_deleted",
            ),
        ]
        verbose_name = "File Folder"
        verbose_name_plural = "File Folders"
        db_table = "file_folders"
        ordering = ("name",)

    def __str__(self):
        return str(self.name)


class FileTag(BaseModel):
    """Free-form label for library files (e.g. an artist name).

    The AI contract pipeline links contracts to artist tags so every file of
    an artist can be filtered in one step.
    """

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="file_tags")
    name = models.CharField(max_length=255)
    color = models.CharField(max_length=255, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(deleted_at__isnull=True),
                name="unique_workspace_file_tag_name_when_not_deleted",
            )
        ]
        verbose_name = "File Tag"
        verbose_name_plural = "File Tags"
        db_table = "file_tags"
        ordering = ("name",)

    def __str__(self):
        return str(self.name)


class FileTagLink(BaseModel):
    """Link between a file asset and a tag; deleting a tag only removes links."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="file_tag_links")
    file_asset = models.ForeignKey("db.FileAsset", on_delete=models.CASCADE, related_name="tag_links")
    tag = models.ForeignKey("db.FileTag", on_delete=models.CASCADE, related_name="file_links")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["file_asset", "tag"],
                condition=Q(deleted_at__isnull=True),
                name="unique_file_asset_tag_when_not_deleted",
            )
        ]
        verbose_name = "File Tag Link"
        verbose_name_plural = "File Tag Links"
        db_table = "file_tag_links"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.file_asset_id} -> {self.tag_id}"


class FileCategory(BaseModel):
    """User-defined category for classifying file-library assets in a workspace."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="file_categories")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=255, blank=True)
    # The default category ("Contratos") is auto-created and cannot be deleted
    is_default = models.BooleanField(default=False)
    # When set, only PDF files may be linked to this category
    pdf_only = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(deleted_at__isnull=True),
                name="unique_workspace_file_category_name_when_not_deleted",
            )
        ]
        verbose_name = "File Category"
        verbose_name_plural = "File Categories"
        db_table = "file_categories"
        ordering = ("-created_at",)

    def __str__(self):
        return str(self.name)


class FileCategoryLink(BaseModel):
    """Link between a file asset and a category.

    Deleting a category cascades these links only — the file assets themselves
    are never removed when a category goes away.
    """

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="file_category_links")
    file_asset = models.ForeignKey("db.FileAsset", on_delete=models.CASCADE, related_name="category_links")
    category = models.ForeignKey("db.FileCategory", on_delete=models.CASCADE, related_name="file_links")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["file_asset", "category"],
                condition=Q(deleted_at__isnull=True),
                name="unique_file_asset_category_when_not_deleted",
            )
        ]
        verbose_name = "File Category Link"
        verbose_name_plural = "File Category Links"
        db_table = "file_category_links"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.file_asset_id} -> {self.category_id}"
