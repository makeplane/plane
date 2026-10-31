# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models
from django.db.models import Q

# Module imports
from plane.db.models.base import BaseModel


class WorkSession(BaseModel):
    """One stretch of work on a work item: what was done, the document, and whether others must look at it."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="team_ops_work_sessions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="team_ops_work_sessions")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="team_ops_work_sessions")
    issue = models.ForeignKey(
        "db.Issue", on_delete=models.SET_NULL, null=True, blank=True, related_name="team_ops_work_sessions"
    )
    time_entry = models.OneToOneField(
        "team_ops.TimeEntry", on_delete=models.SET_NULL, null=True, blank=True, related_name="work_session"
    )
    started_at = models.DateTimeField()
    finished_at = models.DateTimeField()
    duration_seconds = models.PositiveIntegerField(default=0)
    summary = models.TextField()
    document_text = models.TextField(blank=True, default="")
    # The person confirmed that there is nothing to attach; a session needs a document or this.
    no_document = models.BooleanField(default=False)
    needs_attention = models.BooleanField(default=False)
    attention_message = models.TextField(blank=True, default="")
    location = models.CharField(max_length=10, blank=True, default="")
    break_seconds = models.PositiveIntegerField(default=0)
    frozen_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Work Session"
        verbose_name_plural = "Work Sessions"
        db_table = "tops_work_session"
        ordering = ("-finished_at",)
        indexes = [
            models.Index(fields=["workspace", "user", "finished_at"], name="tops_ws_user_finished_idx"),
            models.Index(fields=["workspace", "project", "finished_at"], name="tops_ws_project_finished_idx"),
        ]

    def __str__(self):
        return f"{self.user_id} {self.finished_at}"


class HubChannel(BaseModel):
    """A conversation space: one per team and one per project. Membership is the team's or project's."""

    class Kind(models.TextChoices):
        TEAM = "TEAM", "Team"
        PROJECT = "PROJECT", "Project"
        GENERAL = "GENERAL", "General"
        NEWS = "NEWS", "News"
        DM = "DM", "Private"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="team_ops_hub_channels")
    kind = models.CharField(max_length=10, choices=Kind.choices)
    # The two people of a private conversation, stored with the smaller id first.
    dm_a = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="+"
    )
    dm_b = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="+"
    )
    team = models.ForeignKey(
        "team_ops.OpsTeam", on_delete=models.CASCADE, null=True, blank=True, related_name="hub_channels"
    )
    project = models.ForeignKey(
        "db.Project", on_delete=models.CASCADE, null=True, blank=True, related_name="team_ops_hub_channels"
    )

    class Meta:
        verbose_name = "Hub Channel"
        verbose_name_plural = "Hub Channels"
        db_table = "tops_hub_channel"
        constraints = [
            models.UniqueConstraint(
                fields=["team"], condition=Q(deleted_at__isnull=True, team__isnull=False), name="tops_hub_one_per_team"
            ),
            models.UniqueConstraint(
                fields=["project"],
                condition=Q(deleted_at__isnull=True, project__isnull=False),
                name="tops_hub_one_per_project",
            ),
            models.UniqueConstraint(
                fields=["workspace", "kind"],
                condition=Q(deleted_at__isnull=True, kind__in=["GENERAL", "NEWS"]),
                name="tops_hub_one_general_news",
            ),
            models.UniqueConstraint(
                fields=["workspace", "dm_a", "dm_b"],
                condition=Q(deleted_at__isnull=True, kind="DM"),
                name="tops_hub_one_dm_per_pair",
            ),
            models.CheckConstraint(
                condition=(Q(kind="TEAM", team__isnull=False, project__isnull=True))
                | (Q(kind="PROJECT", project__isnull=False, team__isnull=True))
                | (Q(kind__in=["GENERAL", "NEWS"], team__isnull=True, project__isnull=True))
                | (Q(kind="DM", dm_a__isnull=False, dm_b__isnull=False)),
                name="tops_hub_channel_target_matches_kind",
            ),
        ]

    def __str__(self):
        return f"{self.kind} {self.team_id or self.project_id}"


class HubMessage(BaseModel):
    """A message in a channel, a reply in a thread, or an attention post from a finished work session."""

    class Kind(models.TextChoices):
        MESSAGE = "MESSAGE", "Message"
        ATTENTION = "ATTENTION", "Needs attention"

    channel = models.ForeignKey(HubChannel, on_delete=models.CASCADE, related_name="messages")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="team_ops_hub_messages")
    body = models.TextField(blank=True, default="")
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True, related_name="replies")
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.MESSAGE)
    session = models.ForeignKey(
        WorkSession, on_delete=models.SET_NULL, null=True, blank=True, related_name="hub_messages"
    )
    edited_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Hub Message"
        verbose_name_plural = "Hub Messages"
        db_table = "tops_hub_message"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["channel", "created_at"], name="tops_hm_channel_created_idx")]

    def __str__(self):
        return f"{self.channel_id} {self.author_id}"


class HubMention(BaseModel):
    """A person tagged in a message (directly or through a team). It doubles as their notification."""

    message = models.ForeignKey(HubMessage, on_delete=models.CASCADE, related_name="mentions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="team_ops_hub_mentions")
    via_team = models.ForeignKey("team_ops.OpsTeam", on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Hub Mention"
        verbose_name_plural = "Hub Mentions"
        db_table = "tops_hub_mention"
        constraints = [
            models.UniqueConstraint(
                fields=["message", "user"], condition=Q(deleted_at__isnull=True), name="tops_hub_mention_once"
            )
        ]
        indexes = [models.Index(fields=["user", "read_at"], name="tops_hmention_user_read_idx")]


class HubAttachment(BaseModel):
    """A file in the private object storage, attached to a message or to a work session."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="team_ops_hub_attachments")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="team_ops_hub_attachments"
    )
    message = models.ForeignKey(HubMessage, on_delete=models.CASCADE, null=True, blank=True, related_name="attachments")
    session = models.ForeignKey(
        WorkSession, on_delete=models.CASCADE, null=True, blank=True, related_name="attachments"
    )
    storage_key = models.CharField(max_length=512, unique=True)
    name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100)
    size = models.PositiveIntegerField()
    # A file shared with everyone in the workspace from the Files section.
    library = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Hub Attachment"
        verbose_name_plural = "Hub Attachments"
        db_table = "tops_hub_attachment"
        constraints = [
            models.CheckConstraint(
                condition=Q(message__isnull=False) | Q(session__isnull=False) | Q(library=True),
                name="tops_hub_attachment_has_owner",
            )
        ]


class HubReadState(BaseModel):
    """Where a person has read up to in a channel; everything after it is unread."""

    channel = models.ForeignKey(HubChannel, on_delete=models.CASCADE, related_name="read_states")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="team_ops_hub_reads")
    last_read_at = models.DateTimeField()

    class Meta:
        db_table = "tops_hub_read_state"
        constraints = [
            models.UniqueConstraint(
                fields=["channel", "user"], condition=Q(deleted_at__isnull=True), name="tops_hub_read_once"
            )
        ]
