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

# Python import
from uuid import uuid4

from django import apps

# Django imports
from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import connection, models, transaction
from django.db.models import Q
from django.utils import timezone

from plane.db.mixins import ChangeTrackerMixin, IssueActivityMixin, update_issue_last_activity_at
from plane.db.models.project import ProjectManager
from plane.db.signals import post_bulk_create, post_bulk_update
from plane.utils.exception_logger import log_exception

# Third party imports
# Module imports
from plane.utils.html_processor import strip_tags
from plane.utils.uuid import convert_uuid_to_integer

from .description import Description
from .project import ProjectBaseModel
from .state import StateGroup

# ee imports


def get_default_properties():
    return {
        "assignee": True,
        "start_date": True,
        "due_date": True,
        "labels": True,
        "key": True,
        "priority": True,
        "state": True,
        "sub_issue_count": True,
        "link": True,
        "attachment_count": True,
        "estimate": True,
        "created_on": True,
        "updated_on": True,
    }


def get_default_filters():
    return {
        "priority": None,
        "state": None,
        "state_group": None,
        "assignees": None,
        "created_by": None,
        "labels": None,
        "start_date": None,
        "target_date": None,
        "subscriber": None,
    }


def get_default_display_filters():
    return {
        "group_by": None,
        "order_by": "-created_at",
        "type": None,
        "sub_issue": True,
        "show_empty_groups": True,
        "layout": "list",
        "calendar_date_range": "",
    }


def get_default_display_properties():
    return {
        "assignee": True,
        "attachment_count": True,
        "created_on": True,
        "due_date": True,
        "estimate": True,
        "key": True,
        "issue_type": True,
        "labels": True,
        "link": True,
        "priority": True,
        "start_date": True,
        "state": True,
        "sub_issue_count": True,
        "updated_on": True,
        "customer_count": True,
        "customer_request_count": True,
    }


# TODO: Handle identifiers for Bulk Inserts - nk
class IssueManager(ProjectManager):
    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .exclude(state__group=StateGroup.TRIAGE.value)
            .exclude(archived_at__isnull=False)
            .exclude(project__archived_at__isnull=False)
            .exclude(is_draft=True)
            .filter(Q(type__is_epic=False) | Q(type__isnull=True))
        )


class IssueAndEpicsManager(ProjectManager):
    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .exclude(state__group=StateGroup.TRIAGE.value)
            .exclude(archived_at__isnull=False)
            .exclude(project__archived_at__isnull=False)
            .exclude(is_draft=True)
        )


class Issue(ChangeTrackerMixin, ProjectBaseModel):
    TRACKED_FIELDS = ["type_id", "state_id"]

    PRIORITY_CHOICES = (
        ("urgent", "Urgent"),
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
        ("none", "None"),
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="parent_issue",
    )
    state = models.ForeignKey(
        "db.State",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="state_issue",
    )
    point = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(12)], null=True, blank=True)
    estimate_point = models.ForeignKey(
        "db.EstimatePoint",
        on_delete=models.SET_NULL,
        related_name="issue_estimates",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=255, verbose_name="Issue Name")
    description_json = models.JSONField(blank=True, default=dict)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    description_binary = models.BinaryField(null=True)
    priority = models.CharField(
        max_length=30,
        choices=PRIORITY_CHOICES,
        verbose_name="Issue Priority",
        default="none",
    )
    start_date = models.DateField(null=True, blank=True)
    target_date = models.DateField(null=True, blank=True)
    assignees = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="assignee",
        through="IssueAssignee",
        through_fields=("issue", "assignee"),
    )
    sequence_id = models.IntegerField(default=1, verbose_name="Issue Sequence ID")
    labels = models.ManyToManyField("db.Label", blank=True, related_name="labels", through="IssueLabel")
    sort_order = models.FloatField(default=65535)
    completed_at = models.DateTimeField(null=True)
    archived_at = models.DateField(null=True)
    last_activity_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Last Activity At",
    )
    is_draft = models.BooleanField(default=False)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)
    type = models.ForeignKey(
        "db.IssueType",
        on_delete=models.SET_NULL,
        related_name="issue_type",
        null=True,
        blank=True,
    )

    issue_objects = IssueManager()
    issue_and_epics_objects = IssueAndEpicsManager()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Store original values of semantic fields for change tracking
        # Only set if fields are not deferred to avoid unnecessary DB queries
        deferred_fields = self.get_deferred_fields()
        self._original_name = self.name if "name" not in deferred_fields else None
        self._original_description_stripped = (
            self.description_stripped if "description_stripped" not in deferred_fields else None
        )

    class Meta:
        verbose_name = "Issue"
        verbose_name_plural = "Issues"
        db_table = "issues"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        self._ensure_default_state()
        kwargs = self._sync_completed_at(kwargs)
        kwargs = self._sync_last_activity_at(kwargs)

        if self._state.adding:
            with transaction.atomic():
                self._assign_sequence_and_sort_order()
                self._set_description_stripped()
                super(Issue, self).save(*args, **kwargs)
                IssueSequence.objects.create(issue=self, sequence=self.sequence_id, project=self.project)
        else:
            old_type_id = self.old_values.get("type_id") if self.has_changed("type_id") else None
            if old_type_id:
                kwargs = self._archive_type_change_properties(old_type_id, kwargs)
            self._set_description_stripped()
            with transaction.atomic():
                super(Issue, self).save(*args, **kwargs)
                self._cleanup_orphaned_property_values(old_type_id)

    def _ensure_default_state(self):
        """Assign a default state when none is set."""
        if self.state is not None:
            return
        try:
            from plane.db.models import State

            default_state = State.objects.filter(~models.Q(is_triage=True), project=self.project, default=True).first()
            self.state = default_state or State.objects.filter(~models.Q(is_triage=True), project=self.project).first()
        except ImportError:
            pass

    def _sync_completed_at(self, kwargs):
        """Update completed_at when state changes. Returns kwargs."""
        if not self.state:
            return kwargs
        if not self._state.adding and not self.has_changed("state_id"):
            return kwargs

        if self.state.group == "completed":
            self.completed_at = timezone.now()
        else:
            self.completed_at = None

        update_fields = kwargs.get("update_fields")
        if update_fields is not None:
            kwargs["update_fields"] = list(set(update_fields) | {"completed_at"})
        return kwargs

    def _sync_last_activity_at(self, kwargs):
        """Set last_activity_at to now on every save. Returns kwargs."""
        self.last_activity_at = timezone.now()
        update_fields = kwargs.get("update_fields")
        if update_fields is not None:
            kwargs["update_fields"] = list(set(update_fields) | {"last_activity_at"})
        return kwargs

    def _set_description_stripped(self):
        """Recompute description_stripped from description_html."""
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )

    def _assign_sequence_and_sort_order(self):
        """Acquire advisory lock and assign sequence_id + sort_order for new issues."""
        lock_key = convert_uuid_to_integer(self.project.id)
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_xact_lock(%s)", [lock_key])

        last_sequence = IssueSequence.objects.filter(project=self.project).aggregate(largest=models.Max("sequence"))[
            "largest"
        ]
        self.sequence_id = last_sequence + 1 if last_sequence else 1

        largest_sort_order = Issue.objects.filter(project=self.project, state=self.state).aggregate(
            largest=models.Max("sort_order")
        )["largest"]
        if largest_sort_order is not None:
            self.sort_order = largest_sort_order + 10000

    def _archive_type_change_properties(self, old_type_id, kwargs):
        """Append archived property HTML to description before save.

        Returns kwargs (possibly with extended update_fields).
        """
        from plane.ee.utils.issue_property_archiver import compute_archive_html_for_issue

        archive_html = compute_archive_html_for_issue(self.id, self.type_id, old_type_id)
        if not archive_html:
            return kwargs

        current_html = self.description_html or ""
        if current_html.strip() in ("", "<p></p>"):
            self.description_html = archive_html
        else:
            self.description_html = current_html + archive_html

        # Extend update_fields if caller provided them
        update_fields = kwargs.get("update_fields")
        if update_fields is not None:
            kwargs["update_fields"] = list(set(update_fields) | {"description_html", "description_stripped"})
        return kwargs

    def _cleanup_orphaned_property_values(self, old_type_id):
        """Delete orphaned property values when issue type changes.

        Archiving is handled before save() by compute_archive_html_for_issue.
        This method only performs the deletion step.
        """
        if not old_type_id:
            return

        from plane.ee.models import IssuePropertyValue

        IssuePropertyValue.cleanup_orphaned_for_issues([self.id], self.type_id)

    def __str__(self):
        """Return name of the issue"""
        return f"{self.name} <{self.project.name}>"


class IssueBlocker(ProjectBaseModel):
    block = models.ForeignKey(Issue, related_name="blocker_issues", on_delete=models.CASCADE)
    blocked_by = models.ForeignKey(Issue, related_name="blocked_issues", on_delete=models.CASCADE)

    class Meta:
        verbose_name = "Issue Blocker"
        verbose_name_plural = "Issue Blockers"
        db_table = "issue_blockers"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.block.name} {self.blocked_by.name}"


class IssueMention(IssueActivityMixin, ProjectBaseModel):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name="issue_mention")
    mention = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="issue_mention")

    class Meta:
        unique_together = ["issue", "mention", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "mention"],
                condition=Q(deleted_at__isnull=True),
                name="issue_mention_unique_issue_mention_when_deleted_at_null",
            )
        ]
        verbose_name = "Issue Mention"
        verbose_name_plural = "Issue Mentions"
        db_table = "issue_mentions"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.issue.name} {self.mention.email}"


class IssueAssignee(IssueActivityMixin, ProjectBaseModel):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name="issue_assignee")
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="issue_assignee",
    )

    class Meta:
        unique_together = ["issue", "assignee", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "assignee"],
                condition=Q(deleted_at__isnull=True),
                name="issue_assignee_unique_issue_assignee_when_deleted_at_null",
            )
        ]
        verbose_name = "Issue Assignee"
        verbose_name_plural = "Issue Assignees"
        db_table = "issue_assignees"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.issue.name} {self.assignee.email}"


class IssueLink(IssueActivityMixin, ChangeTrackerMixin, ProjectBaseModel):
    title = models.CharField(max_length=255, null=True, blank=True)
    url = models.TextField()
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="issue_link")
    metadata = models.JSONField(default=dict)

    TRACKED_FIELDS = ["url"]

    class Meta:
        verbose_name = "Issue Link"
        verbose_name_plural = "Issue Links"
        db_table = "issue_links"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        url_changed = self.has_changed("url") if not is_new else False

        super().save(*args, **kwargs)

        if (is_new or url_changed) and self.url:
            from plane.bgtasks.link_crawler_task import link_crawler

            link_crawler.delay(str(self.id), self.url, "issue")

    def __str__(self):
        return f"{self.issue.name} {self.url}"


def get_upload_path(instance, filename):
    return f"{instance.workspace.id}/{uuid4().hex}-{filename}"


def file_size(value):
    # File limit check is only for cloud hosted
    if value.size > settings.FILE_SIZE_LIMIT:
        raise ValidationError("File too large. Size should not exceed 5 MB.")


class IssueAttachment(IssueActivityMixin, ProjectBaseModel):
    attributes = models.JSONField(default=dict)
    asset = models.FileField(upload_to=get_upload_path, validators=[file_size])
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="issue_attachment")
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "Issue Attachment"
        verbose_name_plural = "Issue Attachments"
        db_table = "issue_attachments"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.issue.name} {self.asset}"


class IssueActivity(ProjectBaseModel):
    issue = models.ForeignKey(Issue, on_delete=models.DO_NOTHING, null=True, related_name="issue_activity")
    verb = models.CharField(max_length=255, verbose_name="Action", default="created")
    field = models.CharField(max_length=255, verbose_name="Field Name", blank=True, null=True)
    old_value = models.TextField(verbose_name="Old Value", blank=True, null=True)
    new_value = models.TextField(verbose_name="New Value", blank=True, null=True)

    comment = models.TextField(verbose_name="Comment", blank=True)
    attachments = ArrayField(models.URLField(), size=10, blank=True, default=list)
    issue_comment = models.ForeignKey(
        "db.IssueComment",
        on_delete=models.DO_NOTHING,
        related_name="issue_comment",
        null=True,
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="issue_activities",
    )
    old_identifier = models.UUIDField(null=True)
    new_identifier = models.UUIDField(null=True)
    epoch = models.FloatField(null=True)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        verbose_name = "Issue Activity"
        verbose_name_plural = "Issue Activities"
        db_table = "issue_activities"
        ordering = ("-created_at",)

    def __str__(self):
        """Return issue of the comment"""
        return str(self.issue)


class IssueComment(IssueActivityMixin, ChangeTrackerMixin, ProjectBaseModel):
    comment_stripped = models.TextField(verbose_name="Comment", blank=True)
    comment_json = models.JSONField(blank=True, default=dict)
    comment_html = models.TextField(blank=True, default="<p></p>")
    description = models.OneToOneField(
        "db.Description", on_delete=models.CASCADE, related_name="issue_comment_description", null=True
    )
    attachments = ArrayField(models.URLField(), size=10, blank=True, default=list)
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name="issue_comments")
    # System can also create comment
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comments",
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
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="parent_issue_comment",  # TODO (Dheeraj): The related_name should be changed to replies
    )
    source = models.OneToOneField(
        "db.WorkItemCommentSource", on_delete=models.CASCADE, related_name="issue_comment", null=True, blank=True
    )

    TRACKED_FIELDS = ["comment_stripped", "comment_json", "comment_html", "access"]

    def save(self, *args, **kwargs):
        """
        Custom save method for IssueComment that manages the associated Description model.

        This method handles creation and updates of both the comment and its description in a
        single atomic transaction to ensure data consistency.
        """

        self.comment_stripped = strip_tags(self.comment_html) if self.comment_html != "" else ""
        is_creating = self._state.adding

        # Get the parent comment access and set it for the child
        if self.parent_id:
            parent_comment = IssueComment.objects.get(id=self.parent_id)
            self.access = parent_comment.access

        # set the child comments access only if the parent comment access is changed
        if self.has_changed("access"):
            # Get all the child comments and set it's access to the parent's access
            IssueComment.objects.filter(parent_id=self.id).update(access=self.access)

        # Prepare description defaults
        description_defaults = {
            "workspace_id": self.workspace_id,
            "project_id": self.project_id,
            "created_by_id": self.created_by_id,
            "updated_by_id": self.updated_by_id,
            "description_stripped": self.comment_stripped,
            "description_json": self.comment_json,
            "description_html": self.comment_html,
        }

        with transaction.atomic():
            if is_creating or not self.description_id:
                # Create description first so the FK is set before the single save
                description = Description.objects.create(**description_defaults)
                self.description_id = description.id

            super(IssueComment, self).save(*args, **kwargs)

            if not is_creating and self.description_id:
                field_mapping = {
                    "comment_html": "description_html",
                    "comment_stripped": "description_stripped",
                    "comment_json": "description_json",
                }

                # Use _changes_on_save which is captured by ChangeTrackerMixin.save()
                # before the tracked fields are reset
                changed_fields = {
                    desc_field: getattr(self, comment_field)
                    for comment_field, desc_field in field_mapping.items()
                    if comment_field in self._changes_on_save
                }

                # Update description only if comment fields changed
                if changed_fields:
                    Description.objects.filter(pk=self.description_id).update(
                        **changed_fields, updated_by_id=self.updated_by_id, updated_at=self.updated_at
                    )
        # trigger the agent run comment task if comment is created by a user
        if is_creating and not self.actor.is_bot:
            from plane.agents.bgtasks.agent_run_user_comment_task import handle_agent_run_user_comment_task

            handle_agent_run_user_comment_task.delay(self.id)

    class Meta:
        verbose_name = "Issue Comment"
        verbose_name_plural = "Issue Comments"
        db_table = "issue_comments"
        ordering = ("-created_at",)

    def __str__(self):
        """Return issue of the comment"""
        return str(self.issue)


class WorkItemCommentSource(ProjectBaseModel):
    class SOURCE_CHOICES(models.TextChoices):
        IN_APP = "IN_APP", "In App"
        PUBLISHED_BOARD = "PUBLISHED_BOARD", "Published Board"
        TRACKABLE_LINK = "TRACKABLE_LINK", "Trackable Link"
        EMAIL = "EMAIL", "Email"

    source_type = models.CharField(max_length=255, choices=SOURCE_CHOICES.choices, default=SOURCE_CHOICES.IN_APP)
    source_email = models.EmailField(null=True, blank=True)
    extra = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Work Item Comment Source"
        verbose_name_plural = "Work Item Comment Sources"
        db_table = "work_item_comment_sources"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.issue_comment.id} {self.source_type}"


class IssueLabel(IssueActivityMixin, ProjectBaseModel):
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="label_issue")
    label = models.ForeignKey("db.Label", on_delete=models.CASCADE, related_name="label_issue")

    class Meta:
        verbose_name = "Issue Label"
        verbose_name_plural = "Issue Labels"
        db_table = "issue_labels"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.issue.name} {self.label.name}"


class IssueSequence(ProjectBaseModel):
    issue = models.ForeignKey(
        Issue,
        on_delete=models.SET_NULL,
        related_name="issue_sequence",
        null=True,  # This is set to null because we want to keep the sequence even if the issue is deleted
    )
    sequence = models.PositiveBigIntegerField(default=1, db_index=True)
    deleted = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Issue Sequence"
        verbose_name_plural = "Issue Sequences"
        db_table = "issue_sequences"
        ordering = ("-created_at",)


class IssueSubscriber(ProjectBaseModel):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name="issue_subscribers")
    subscriber = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="issue_subscribers",
    )

    class Meta:
        unique_together = ["issue", "subscriber", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "subscriber"],
                condition=models.Q(deleted_at__isnull=True),
                name="issue_subscriber_unique_issue_subscriber_when_deleted_at_null",
            )
        ]
        verbose_name = "Issue Subscriber"
        verbose_name_plural = "Issue Subscribers"
        db_table = "issue_subscribers"
        ordering = ("-created_at",)

    @classmethod
    def is_subscribed(cls, issue_id, subscriber_id):
        return cls.objects.filter(
            issue_id=issue_id,
            subscriber_id=subscriber_id,
            deleted_at__isnull=True,
        ).exists()

    def __str__(self):
        return f"{self.issue.name} {self.subscriber.email}"


class IssueReaction(ProjectBaseModel):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="issue_reactions",
    )
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name="issue_reactions")
    reaction = models.TextField()

    class Meta:
        unique_together = ["issue", "actor", "reaction", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "actor", "reaction"],
                condition=models.Q(deleted_at__isnull=True),
                name="issue_reaction_unique_issue_actor_reaction_when_deleted_at_null",
            )
        ]
        verbose_name = "Issue Reaction"
        verbose_name_plural = "Issue Reactions"
        db_table = "issue_reactions"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.issue.name} {self.actor.email}"


class CommentReaction(ProjectBaseModel):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comment_reactions",
    )
    comment = models.ForeignKey(IssueComment, on_delete=models.CASCADE, related_name="comment_reactions")
    reaction = models.TextField()

    class Meta:
        unique_together = ["comment", "actor", "reaction", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["comment", "actor", "reaction"],
                condition=models.Q(deleted_at__isnull=True),
                name="comment_reaction_unique_comment_actor_reaction_when_deleted_at_null",
            )
        ]
        verbose_name = "Comment Reaction"
        verbose_name_plural = "Comment Reactions"
        db_table = "comment_reactions"
        ordering = ("-created_at",)

    def get_issue_id_for_activity(self):
        if not self.comment_id:
            return None
        return IssueComment.objects.filter(pk=self.comment_id).values_list("issue_id", flat=True).first()

    def __str__(self):
        return f"{self.comment.issue.name} {self.actor.email}"


class IssueVote(ProjectBaseModel):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name="votes")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="votes")
    vote = models.IntegerField(choices=((-1, "DOWNVOTE"), (1, "UPVOTE")), default=1)

    class Meta:
        unique_together = ["issue", "actor", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "actor"],
                condition=models.Q(deleted_at__isnull=True),
                name="issue_vote_unique_issue_actor_when_deleted_at_null",
            )
        ]
        verbose_name = "Issue Vote"
        verbose_name_plural = "Issue Votes"
        db_table = "issue_votes"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.issue.name} {self.actor.email}"

    @classmethod
    def log_issue_vote(cls, issue_id, user, project_id, vote_value):
        try:
            # Here if the user already has a vote change it
            # otherwise create a new vote
            obj = cls.objects.filter(issue_id=issue_id, actor=user, project_id=project_id).first()
            if obj:
                obj.vote = vote_value
                obj.save(update_fields=["vote", "updated_at"])
            else:
                obj = cls.objects.create(issue_id=issue_id, actor=user, project_id=project_id, vote=vote_value)
            return obj
        except Exception as e:
            log_exception(e)
            raise e


class IssueVersion(ProjectBaseModel):
    PRIORITY_CHOICES = (
        ("urgent", "Urgent"),
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
        ("none", "None"),
    )

    parent = models.UUIDField(blank=True, null=True)
    state = models.UUIDField(blank=True, null=True)
    estimate_point = models.UUIDField(blank=True, null=True)
    name = models.CharField(max_length=255, verbose_name="Issue Name")
    priority = models.CharField(
        max_length=30,
        choices=PRIORITY_CHOICES,
        verbose_name="Issue Priority",
        default="none",
    )
    start_date = models.DateField(null=True, blank=True)
    target_date = models.DateField(null=True, blank=True)
    assignees = ArrayField(models.UUIDField(), blank=True, default=list)
    sequence_id = models.IntegerField(default=1, verbose_name="Issue Sequence ID")
    labels = ArrayField(models.UUIDField(), blank=True, default=list)
    sort_order = models.FloatField(default=65535)
    completed_at = models.DateTimeField(null=True)
    archived_at = models.DateField(null=True)
    is_draft = models.BooleanField(default=False)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)
    type = models.UUIDField(blank=True, null=True)
    cycle = models.UUIDField(null=True, blank=True)
    modules = ArrayField(models.UUIDField(), blank=True, default=list)
    properties = models.JSONField(default=dict)  # issue properties
    meta = models.JSONField(default=dict)  # issue meta
    last_saved_at = models.DateTimeField(default=timezone.now)

    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="versions")
    activity = models.ForeignKey(
        "db.IssueActivity",
        on_delete=models.SET_NULL,
        null=True,
        related_name="versions",
    )
    owned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="issue_versions",
    )

    class Meta:
        verbose_name = "Issue Version"
        verbose_name_plural = "Issue Versions"
        db_table = "issue_versions"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.name} <{self.project.name}>"

    @classmethod
    def log_issue_version(cls, issue, user):
        try:
            """
            Log the issue version
            """

            Module = apps.get_model("db.Module")
            CycleIssue = apps.get_model("db.CycleIssue")
            IssueAssignee = apps.get_model("db.IssueAssignee")
            IssueLabel = apps.get_model("db.IssueLabel")

            cycle_issue = CycleIssue.objects.filter(issue=issue).first()

            cls.objects.create(
                issue=issue,
                parent=issue.parent_id,
                state=issue.state_id,
                estimate_point=issue.estimate_point_id,
                name=issue.name,
                priority=issue.priority,
                start_date=issue.start_date,
                target_date=issue.target_date,
                assignees=list(IssueAssignee.objects.filter(issue=issue).values_list("assignee_id", flat=True)),
                sequence_id=issue.sequence_id,
                labels=list(IssueLabel.objects.filter(issue=issue).values_list("label_id", flat=True)),
                sort_order=issue.sort_order,
                completed_at=issue.completed_at,
                archived_at=issue.archived_at,
                is_draft=issue.is_draft,
                external_source=issue.external_source,
                external_id=issue.external_id,
                type=issue.type_id,
                cycle=cycle_issue.cycle_id if cycle_issue else None,
                modules=list(Module.objects.filter(issue=issue).values_list("id", flat=True)),
                properties={},
                meta={},
                last_saved_at=timezone.now(),
                owned_by=user,
            )
            return True
        except Exception as e:
            log_exception(e)
            return False


class IssueDescriptionVersion(IssueActivityMixin, ProjectBaseModel):
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="description_versions")
    description_binary = models.BinaryField(null=True)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    description_json = models.JSONField(default=dict, blank=True)
    last_saved_at = models.DateTimeField(default=timezone.now)
    owned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="issue_description_versions",
    )

    class Meta:
        verbose_name = "Issue Description Version"
        verbose_name_plural = "Issue Description Versions"
        db_table = "issue_description_versions"

    @classmethod
    def log_issue_description_version(cls, issue, user):
        try:
            """
            Log the issue description version
            """
            cls.objects.create(
                workspace_id=issue.workspace_id,
                project_id=issue.project_id,
                created_by_id=issue.created_by_id,
                updated_by_id=issue.updated_by_id,
                owned_by_id=user,
                last_saved_at=timezone.now(),
                issue_id=issue.id,
                description_binary=issue.description_binary,
                description_html=issue.description_html,
                description_stripped=issue.description_stripped,
                description_json=issue.description_json,
            )
            return True
        except Exception as e:
            log_exception(e)
            return False


# Signal handler for cleaning up orphaned property values on bulk update
def _handle_issue_type_change_on_bulk_update(sender, model, objs, updated_fields=None, **kwargs):
    """Clean up orphaned property values when issue type changes via bulk update."""
    if updated_fields and "type_id" not in updated_fields:
        return

    from plane.ee.models import IssuePropertyValue

    # Run read + cleanup in a single atomic block to reduce race windows.
    # Note: this does not prevent concurrent updates from other transactions,
    # but it ensures this handler sees a consistent view on this connection.
    with transaction.atomic():
        # Convert queryset to list to avoid multiple DB queries
        objs_list = list(objs)
        if not objs_list:
            return

        # All issues have the SAME new type (bulk update sets one value)
        new_type_id = objs_list[0].type_id
        issue_ids = [obj.id for obj in objs_list]

        IssuePropertyValue.archive_and_cleanup_orphaned_for_issues(issue_ids, new_type_id)


post_bulk_update.connect(_handle_issue_type_change_on_bulk_update, sender=Issue)


def _update_issue_last_activity_on_m2m_change(sender, model, objs, **kwargs):
    """Update last_activity_at on parent issues when related M2M records change."""
    issue_ids = {obj.issue_id for obj in objs if getattr(obj, "issue_id", None)}
    if issue_ids:
        update_issue_last_activity_at(*issue_ids)


# Assignees and labels are M2M through tables modified via bulk_create and
# queryset.delete (soft-delete). Both operations bypass the model's save()/delete()
# methods, so IssueActivityMixin never fires. These signal connections ensure
# Issue.last_activity_at is still updated when assignees or labels change.
# - post_bulk_create: triggered when new assignees/labels are added via bulk_create
# - post_bulk_update: triggered when assignees/labels are removed via soft-delete
#   (queryset.delete(soft=True) internally calls queryset.update(deleted_at=...))
post_bulk_create.connect(_update_issue_last_activity_on_m2m_change, sender=IssueAssignee)
post_bulk_update.connect(_update_issue_last_activity_on_m2m_change, sender=IssueAssignee)
post_bulk_create.connect(_update_issue_last_activity_on_m2m_change, sender=IssueLabel)
post_bulk_update.connect(_update_issue_last_activity_on_m2m_change, sender=IssueLabel)
