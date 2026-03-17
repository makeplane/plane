# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Django imports
from django.db import models
from django.db.models import Q

# Module imports
from .workspace import WorkspaceBaseModel


class Release(WorkspaceBaseModel):
    class StatusChoices(models.TextChoices):
        UNRELEASED = "unreleased", "Unreleased"
        RELEASED = "released", "Released"
        CANCELLED = "cancelled", "Cancelled"

    name = models.CharField(max_length=255)
    description = models.ForeignKey("db.Description", on_delete=models.CASCADE, related_name="releases")
    status = models.CharField(max_length=255, choices=StatusChoices.choices, default=StatusChoices.UNRELEASED)
    target_date = models.DateField(null=True, blank=True)
    release_date = models.DateField(null=True, blank=True)
    lead = models.ForeignKey("db.User", on_delete=models.SET_NULL, related_name="releases", null=True, blank=True)
    tag = models.ForeignKey("db.ReleaseTag", on_delete=models.SET_NULL, related_name="releases", null=True, blank=True)
    is_latest = models.BooleanField(default=False)
    is_prerelease = models.BooleanField(default=False)
    external_id = models.CharField(max_length=255, null=True, blank=True)
    external_source = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=Q(deleted_at__isnull=True),
                name="release_unique_name_workspace_when_deleted_at_null",
            ),
        ]
        verbose_name = "Release"
        verbose_name_plural = "Releases"
        db_table = "releases"
        ordering = ("-created_at",)


class ReleaseTag(WorkspaceBaseModel):
    version = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    commit_hash = models.CharField(max_length=255, blank=True, null=True)
    git_tag = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["version", "workspace"],
                condition=Q(deleted_at__isnull=True),
                name="release_tag_unique_version_workspace_when_deleted_at_null",
            ),
        ]
        verbose_name = "Release Tag"
        verbose_name_plural = "Release Tags"
        db_table = "release_tags"
        ordering = ("-created_at",)


class ReleaseLabel(WorkspaceBaseModel):
    name = models.CharField(max_length=255)
    color = models.CharField(max_length=255, default="#4E5355")
    sort_order = models.IntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=Q(deleted_at__isnull=True),
                name="release_label_unique_name_workspace_when_deleted_at_null",
            ),
        ]
        verbose_name = "Release Label"
        verbose_name_plural = "Release Labels"
        db_table = "release_labels"
        ordering = ("-created_at",)


class ReleaseLabelAssociation(WorkspaceBaseModel):
    release = models.ForeignKey("db.Release", on_delete=models.CASCADE, related_name="release_label_associations")
    label = models.ForeignKey("db.ReleaseLabel", on_delete=models.CASCADE, related_name="release_label_associations")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["release", "label"],
                condition=Q(deleted_at__isnull=True),
                name="release_label_association_unique_release_label_when_deleted_at_null",
            ),
        ]
        verbose_name = "Release Label Association"
        verbose_name_plural = "Release Label Associations"
        db_table = "release_label_associations"
        ordering = ("-created_at",)


class ReleaseComment(WorkspaceBaseModel):
    release = models.ForeignKey("db.Release", on_delete=models.CASCADE, related_name="release_comments")
    comment = models.ForeignKey("db.Description", on_delete=models.CASCADE, related_name="release_comments")
    parent = models.ForeignKey(
        "self", on_delete=models.SET_NULL, related_name="release_comments", null=True, blank=True
    )
    edited_at = models.DateTimeField(null=True, blank=True)
    is_resolved = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Release Comment"
        verbose_name_plural = "Release Comments"
        db_table = "release_comments"
        ordering = ("-created_at",)


class ReleaseCommentReaction(WorkspaceBaseModel):
    release_comment = models.ForeignKey(
        "db.ReleaseComment",
        on_delete=models.CASCADE,
        related_name="release_comment_reactions",
    )
    reaction = models.CharField(max_length=255)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["release_comment", "reaction", "created_by"],
                condition=Q(deleted_at__isnull=True),
                name="release_comment_reaction_unique_release_comment_reaction_created_by_when_deleted_at_null",
            ),
        ]
        verbose_name = "Release Comment Reaction"
        verbose_name_plural = "Release Comment Reactions"
        db_table = "release_comment_reactions"
        ordering = ("-created_at",)


class ReleaseWorkItem(WorkspaceBaseModel):
    release = models.ForeignKey("db.Release", on_delete=models.CASCADE, related_name="release_work_items")
    work_item = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="release_work_items")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["release", "work_item"],
                condition=Q(deleted_at__isnull=True),
                name="release_work_item_unique_release_work_item_when_deleted_at_null",
            ),
        ]
        verbose_name = "Release Work Item"
        verbose_name_plural = "Release Work Items"
        db_table = "release_work_items"
        ordering = ("-created_at",)


class ReleaseActivity(WorkspaceBaseModel):
    class ReleaseActionChoices(models.TextChoices):
        CREATED = "created", "Created"
        UPDATED = "updated", "Updated"
        DELETED = "deleted", "Deleted"

    class ReleaseFieldChoices(models.TextChoices):
        NAME = "name", "Name"
        DESCRIPTION = "description", "Description"
        STATUS = "status", "Status"
        TARGET_DATE = "target_date", "Target Date"
        RELEASE_DATE = "release_date", "Release Date"
        LEAD = "lead", "Lead"
        TAG = "tag", "Tag"
        LABEL = "label", "Label"
        COMMENT = "comment", "Comment"

    release = models.ForeignKey("db.Release", on_delete=models.CASCADE, related_name="release_activities")
    action = models.CharField(max_length=255, choices=ReleaseActionChoices.choices)
    field = models.CharField(max_length=255, choices=ReleaseFieldChoices.choices)
    old_value = models.TextField(blank=True, null=True)
    new_value = models.TextField(blank=True, null=True)
    old_identifier = models.UUIDField(null=True, blank=True)
    new_identifier = models.UUIDField(null=True, blank=True)
    actor = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="release_activities",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Release Activity"
        verbose_name_plural = "Release Activities"
        db_table = "release_activities"
        ordering = ("-created_at",)


class ReleaseChangelog(WorkspaceBaseModel):
    release = models.ForeignKey("db.Release", on_delete=models.CASCADE, related_name="release_changelogs")
    changelog = models.ForeignKey("db.Description", on_delete=models.CASCADE, related_name="release_changelogs")

    class Meta:
        verbose_name = "Release Changelog"
        verbose_name_plural = "Release Changelogs"
        db_table = "release_changelogs"
        ordering = ("-created_at",)


class ReleaseAttachment(WorkspaceBaseModel):
    release = models.ForeignKey("db.Release", on_delete=models.CASCADE, related_name="release_attachments")
    attachment = models.ForeignKey("db.FileAsset", on_delete=models.CASCADE, related_name="release_attachments")
    is_artifact = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["release", "attachment"],
                condition=Q(deleted_at__isnull=True),
                name="release_attachment_unique_release_attachment_when_deleted_at_null",
            ),
        ]
        verbose_name = "Release Attachment"
        verbose_name_plural = "Release Attachments"
        db_table = "release_attachments"
        ordering = ("-created_at",)


class ReleaseLink(WorkspaceBaseModel):
    release = models.ForeignKey("db.Release", on_delete=models.CASCADE, related_name="release_links")
    title = models.CharField(max_length=255)
    url = models.URLField()
    metadata = models.JSONField(default=dict)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["release", "url"],
                condition=Q(deleted_at__isnull=True),
                name="release_link_unique_release_url_when_deleted_at_null",
            ),
        ]
        verbose_name = "Release Link"
        verbose_name_plural = "Release Links"
        db_table = "release_links"
        ordering = ("-created_at",)


class ReleasePage(WorkspaceBaseModel):
    release = models.ForeignKey("db.Release", on_delete=models.CASCADE, related_name="release_pages")
    page = models.ForeignKey("db.Page", on_delete=models.CASCADE, related_name="release_pages")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["release", "page"],
                condition=Q(deleted_at__isnull=True),
                name="release_page_unique_release_page_when_deleted_at_null",
            ),
        ]
        verbose_name = "Release Page"
        verbose_name_plural = "Release Pages"
        db_table = "release_pages"
        ordering = ("-created_at",)
