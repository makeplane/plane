# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Releases (with labels, tags, changelog and work items), milestones and initiatives.

CE has no tables for any of these. The API hard-deletes both the resources and
their link rows, so uniqueness constraints need no soft-delete condition.
"""

from django.conf import settings
from django.db import models

from plane.db.models import BaseModel

__all__ = [
    "Release",
    "ReleaseTag",
    "ReleaseLabel",
    "ReleaseItemLabel",
    "ReleaseChangelog",
    "ReleaseWorkItem",
    "Milestone",
    "MilestoneWorkItem",
    "Initiative",
    "InitiativeProject",
    "InitiativeWorkItem",
]


def _empty_doc():
    return {}


class ReleaseTag(BaseModel):
    """A version marker (version + optional git metadata), not a label."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_release_tags")
    version = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    commit_hash = models.CharField(max_length=255, blank=True, default="")
    git_tag = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        db_table = "nexus_release_tags"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(fields=["workspace", "version"], name="nexus_release_tag_unique_version"),
        ]


class ReleaseLabel(BaseModel):
    """The workspace palette of release labels."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_release_labels")
    name = models.CharField(max_length=255)
    color = models.CharField(max_length=255, blank=True, default="")
    sort_order = models.FloatField(default=65535)

    class Meta:
        db_table = "nexus_release_labels"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(fields=["workspace", "name"], name="nexus_release_label_unique_name"),
        ]


class Release(BaseModel):
    STATUS_CHOICES = (("unreleased", "Unreleased"), ("released", "Released"), ("cancelled", "Cancelled"))

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_releases")
    name = models.CharField(max_length=255)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_json = models.JSONField(blank=True, default=_empty_doc)
    description_stripped = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="unreleased")
    # The UI labels release_date "Target date"; target_date is a separate stored date.
    release_date = models.DateField(null=True, blank=True)
    target_date = models.DateField(null=True, blank=True)
    lead = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="nexus_led_releases"
    )
    tag = models.ForeignKey(ReleaseTag, on_delete=models.SET_NULL, null=True, blank=True, related_name="releases")
    is_prerelease = models.BooleanField(default=False)
    labels = models.ManyToManyField(ReleaseLabel, through="ReleaseItemLabel", related_name="releases", blank=True)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = "nexus_releases"
        ordering = ("-created_at",)


class ReleaseItemLabel(BaseModel):
    """A palette label attached to one release."""

    release = models.ForeignKey(Release, on_delete=models.CASCADE, related_name="label_links")
    label = models.ForeignKey(ReleaseLabel, on_delete=models.CASCADE, related_name="release_links")

    class Meta:
        db_table = "nexus_release_item_labels"
        constraints = [
            models.UniqueConstraint(fields=["release", "label"], name="nexus_release_item_label_unique"),
        ]


class ReleaseChangelog(BaseModel):
    """One changelog body per release, created with the release."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_release_changelogs")
    release = models.OneToOneField(Release, on_delete=models.CASCADE, related_name="changelog")
    description_html = models.TextField(blank=True, default="<p></p>")
    description_json = models.JSONField(blank=True, default=_empty_doc)
    description_stripped = models.TextField(blank=True, default="")

    class Meta:
        db_table = "nexus_release_changelogs"


class ReleaseWorkItem(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_release_work_items")
    release = models.ForeignKey(Release, on_delete=models.CASCADE, related_name="work_item_links")
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="release_work_items")

    class Meta:
        db_table = "nexus_release_work_items"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(fields=["release", "issue"], name="nexus_release_work_item_unique"),
        ]


class Milestone(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_milestones")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="nexus_milestones")
    title = models.CharField(max_length=255)
    target_date = models.DateField(null=True, blank=True)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = "nexus_milestones"
        ordering = ("-created_at",)


class MilestoneWorkItem(BaseModel):
    """A work item sits in at most one milestone; adding it to another moves it."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_milestone_work_items")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="nexus_milestone_work_items")
    milestone = models.ForeignKey(Milestone, on_delete=models.CASCADE, related_name="work_item_links")
    issue = models.OneToOneField("db.Issue", on_delete=models.CASCADE, related_name="milestone_work_item")

    class Meta:
        db_table = "nexus_milestone_work_items"
        ordering = ("-created_at",)


class Initiative(BaseModel):
    STATE_CHOICES = (
        ("DRAFT", "Draft"),
        ("PLANNED", "Planned"),
        ("ACTIVE", "Active"),
        ("COMPLETED", "Completed"),
        ("CLOSED", "Closed"),
    )

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_initiatives")
    name = models.CharField(max_length=255)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_json = models.JSONField(blank=True, default=_empty_doc)
    description_stripped = models.TextField(blank=True, default="")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    logo_props = models.JSONField(blank=True, default=_empty_doc)
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default="DRAFT")
    lead = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="nexus_led_initiatives"
    )
    projects = models.ManyToManyField("db.Project", through="InitiativeProject", related_name="nexus_initiatives")

    class Meta:
        db_table = "nexus_initiatives"
        ordering = ("-created_at",)


class InitiativeProject(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_initiative_projects")
    initiative = models.ForeignKey(Initiative, on_delete=models.CASCADE, related_name="project_links")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="nexus_initiative_links")

    class Meta:
        db_table = "nexus_initiative_projects"
        constraints = [
            models.UniqueConstraint(fields=["initiative", "project"], name="nexus_initiative_project_unique"),
        ]


class InitiativeWorkItem(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="nexus_initiative_work_items")
    initiative = models.ForeignKey(Initiative, on_delete=models.CASCADE, related_name="work_item_links")
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="nexus_initiative_links")

    class Meta:
        db_table = "nexus_initiative_work_items"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(fields=["initiative", "issue"], name="nexus_initiative_work_item_unique"),
        ]
