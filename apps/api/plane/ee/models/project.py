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
from django.conf import settings

# Module imports
from plane.db.models.base import BaseModel
from plane.db.models.project import ProjectBaseModel
from plane.db.mixins import ChangeTrackerMixin
from plane.utils.html_processor import strip_tags


class GroupChoices(models.TextChoices):
    DRAFT = "draft", "Draft"
    PLANNING = "planning", "Planning"
    EXECUTION = "execution", "Execution"
    MONITORING = "monitoring", "Monitoring"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class ProjectState(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="project_states")
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=255)
    sequence = models.FloatField(default=65535)
    group = models.CharField(max_length=20, choices=GroupChoices.choices, default=GroupChoices.DRAFT)
    default = models.BooleanField(default=False)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        """Return name of the state"""
        return f"{self.name} <{self.workspace.name}>"

    class Meta:
        unique_together = ["name", "workspace", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=models.Q(deleted_at__isnull=True),
                name="project_state_unique_name_project_when_deleted_at_null",
            )
        ]
        verbose_name = "Project State"
        verbose_name_plural = "Project States"
        db_table = "project_states"
        ordering = ("sequence",)

    def save(self, *args, **kwargs):
        if self._state.adding:
            # Get the maximum sequence value from the database
            last_id = ProjectState.objects.filter(workspace=self.workspace).aggregate(largest=models.Max("sequence"))[
                "largest"
            ]
            # if last_id is not None
            if last_id is not None:
                self.sequence = last_id + 15000

        return super().save(*args, **kwargs)


class PriorityChoices(models.TextChoices):
    NONE = "none", "None"
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"
    URGENT = "urgent", "Urgent"


class ProjectAttribute(ProjectBaseModel):
    priority = models.CharField(max_length=50, choices=PriorityChoices.choices, default=PriorityChoices.NONE)
    state = models.ForeignKey(
        ProjectState,
        on_delete=models.SET_NULL,
        related_name="project_attributes",
        null=True,
    )
    start_date = models.DateTimeField(null=True, blank=True)
    target_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Project Attribute"
        verbose_name_plural = "Project Attributes"
        db_table = "project_attributes"
        ordering = ("created_at",)


class ProjectFeature(ProjectBaseModel):
    is_project_updates_enabled = models.BooleanField(default=False)
    is_epic_enabled = models.BooleanField(default=False)
    is_workflow_enabled = models.BooleanField(default=False)
    is_milestone_enabled = models.BooleanField(default=False)
    is_automated_cycle_enabled = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Project Feature"
        verbose_name_plural = "Project Features"
        db_table = "project_features"
        ordering = ("-created_at",)

    def __str__(self):
        return str(self.project)


class ProjectLink(ChangeTrackerMixin, ProjectBaseModel):
    title = models.CharField(max_length=255, null=True, blank=True)
    url = models.TextField()
    metadata = models.JSONField(default=dict)

    TRACKED_FIELDS = ["url"]

    class Meta:
        verbose_name = "Project Link"
        verbose_name_plural = "Project Links"
        db_table = "project_links"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        url_changed = self.has_changed("url") if not is_new else False

        super().save(*args, **kwargs)

        if (is_new or url_changed) and self.url:
            from plane.bgtasks.link_crawler_task import link_crawler

            link_crawler.delay(str(self.id), self.url, "project")

    def __str__(self):
        return f"{self.project.name} {self.url}"


class ProjectReaction(ProjectBaseModel):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_reactions",
    )
    reaction = models.CharField(max_length=20)

    class Meta:
        unique_together = ["project", "actor", "reaction", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "actor", "reaction"],
                condition=models.Q(deleted_at__isnull=True),
                name="project_reaction_unique_project_actor_reaction_when_deleted_at_null",
            )
        ]
        verbose_name = "Project Reaction"
        verbose_name_plural = "Project Reactions"
        db_table = "project_reactions"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.project.name} {self.actor.email}"


class ProjectComment(ProjectBaseModel):
    comment_stripped = models.TextField(verbose_name="Comment", blank=True)
    comment_json = models.JSONField(blank=True, default=dict)
    comment_html = models.TextField(blank=True, default="<p></p>")
    # System can also create comment
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_comments",
        null=True,
    )
    access = models.CharField(
        choices=(("INTERNAL", "INTERNAL"), ("EXTERNAL", "EXTERNAL")),
        default="INTERNAL",
        max_length=100,
    )
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)
    edited_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        self.comment_stripped = strip_tags(self.comment_html) if self.comment_html != "" else ""
        return super(ProjectComment, self).save(*args, **kwargs)

    class Meta:
        verbose_name = "Project Comment"
        verbose_name_plural = "Project Comments"
        db_table = "project_comments"
        ordering = ("-created_at",)

    def __str__(self):
        """Return project of the comment"""
        return str(self.project)


class ProjectCommentReaction(ProjectBaseModel):
    reaction = models.CharField(max_length=255)
    comment = models.ForeignKey("ee.ProjectComment", on_delete=models.CASCADE, related_name="project_reactions")
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_comment_reactions",
    )

    class Meta:
        unique_together = ["comment", "actor", "reaction", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["comment", "actor", "reaction"],
                condition=models.Q(deleted_at__isnull=True),
                name="project_comment_reaction_unique_comment_actor_reaction_when_deleted_at_null",
            )
        ]
        verbose_name = "Project Comment Reaction"
        verbose_name_plural = "Project Comment Reactions"
        db_table = "project_comment_reactions"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.comment} {self.actor.email}"


class ProjectMemberActivity(ProjectBaseModel):
    class ProjectMemberActivityType(models.TextChoices):
        JOINED = "JOINED", "Joined"
        ADDED = "ADDED", "Added"
        LEFT = "LEFT", "Left"
        REMOVED = "REMOVED", "Removed"
        ROLE_UPDATED = "ROLE_UPDATED", "Role Updated"

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_member_activities",
    )
    project_member = models.ForeignKey(
        "db.ProjectMember",
        on_delete=models.CASCADE,
        related_name="activities",
        null=True,
    )
    type = models.CharField(max_length=25)
    old_value = models.TextField(blank=True, null=True)
    new_value = models.TextField(blank=True, null=True)
    old_identifier = models.UUIDField(null=True)
    new_identifier = models.UUIDField(null=True)
    epoch = models.FloatField(null=True)

    class Meta:
        verbose_name = "Project Member Activity"
        verbose_name_plural = "Project Member Activities"
        db_table = "project_member_activities"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.project.name} {self.actor}"


class ProjectActivity(ProjectBaseModel):
    verb = models.CharField(max_length=255, verbose_name="Action", default="created")
    field = models.CharField(max_length=255, verbose_name="Field Name", blank=True, null=True)
    old_value = models.TextField(verbose_name="Old Value", blank=True, null=True)
    new_value = models.TextField(verbose_name="New Value", blank=True, null=True)
    comment = models.TextField(verbose_name="Comment", blank=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="project_activities",
    )
    old_identifier = models.UUIDField(null=True)
    new_identifier = models.UUIDField(null=True)
    epoch = models.FloatField(null=True)

    class Meta:
        verbose_name = "Project Activity"
        verbose_name_plural = "Project Activities"
        db_table = "project_activities"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.project.name} {self.verb}"


class ProjectLabel(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="project_labels",
        null=True,
        blank=True,
    )

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=255, blank=True)
    sort_order = models.FloatField(default=65535)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="uniq_projlabel_ws_name_null",
            )
        ]

        db_table = "project_labels"
        verbose_name = "Project Label"
        verbose_name_plural = "Project Labels"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self._state.adding:
            last_id = ProjectLabel.objects.filter(workspace=self.workspace).aggregate(largest=models.Max("sort_order"))[
                "largest"
            ]

            if last_id is not None:
                self.sort_order = last_id + 10000

        super(ProjectLabel, self).save(*args, **kwargs)


class ProjectLabelAssociation(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="project_label_associations",
        null=True,
        blank=True,
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="project_label_associations",
    )
    label = models.ForeignKey(
        "ee.ProjectLabel",
        on_delete=models.CASCADE,
        related_name="project_label_associations",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "label"],
                condition=models.Q(deleted_at__isnull=True),
                name="uniq_plassoc_proj_lbl_null",
            )
        ]
        db_table = "project_label_associations"
        verbose_name = "Project Label Association"
        verbose_name_plural = "Project Label Associations"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.project.name} {self.label.name}"


class ProjectSubscriber(ProjectBaseModel):
    subscriber = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_subscribers",
    )

    class Meta:
        unique_together = ["project", "subscriber", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "subscriber"],
                condition=models.Q(deleted_at__isnull=True),
                name="project_subscriber_unique_project_subscriber_when_deleted_at_null",
            )
        ]
        verbose_name = "Project Subscriber"
        verbose_name_plural = "Project Subscribers"
        db_table = "project_subscribers"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.project.name} {self.subscriber.email}"
