# Python import
from uuid import uuid4

# Django imports
from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models, transaction
from django.utils import timezone
from django.db.models import Q

# Module imports
from plane.utils.html_processor import strip_tags

from .project import ProjectBaseModel


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
        "labels": True,
        "link": True,
        "priority": True,
        "start_date": True,
        "state": True,
        "sub_issue_count": True,
        "updated_on": True,
    }


# TODO: Handle identifiers for Bulk Inserts - nk
class IssueManager(models.Manager):
    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(
                models.Q(issue_inbox__status=1)
                | models.Q(issue_inbox__status=-1)
                | models.Q(issue_inbox__status=2)
                | models.Q(issue_inbox__isnull=True)
            )
            .filter(deleted_at__isnull=True)
            .filter(state__is_triage=False)
            .exclude(archived_at__isnull=False)
            .exclude(project__archived_at__isnull=False)
            .exclude(is_draft=True)
        )


class Issue(ProjectBaseModel):
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
    point = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(12)],
        null=True,
        blank=True,
    )
    estimate_point = models.ForeignKey(
        "db.EstimatePoint",
        on_delete=models.SET_NULL,
        related_name="issue_estimates",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=255, verbose_name="Issue Name")
    description = models.JSONField(blank=True, default=dict)
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
    sequence_id = models.IntegerField(
        default=1, verbose_name="Issue Sequence ID"
    )
    labels = models.ManyToManyField(
        "db.Label", blank=True, related_name="labels", through="IssueLabel"
    )
    sort_order = models.FloatField(default=65535)
    completed_at = models.DateTimeField(null=True)
    archived_at = models.DateField(null=True)
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

    objects = models.Manager()
    issue_objects = IssueManager()

    class Meta:
        verbose_name = "Issue"
        verbose_name_plural = "Issues"
        db_table = "issues"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        if self.state is None:
            try:
                from plane.db.models import State

                default_state = State.objects.filter(
                    ~models.Q(is_triage=True),
                    project=self.project,
                    default=True,
                ).first()
                if default_state is None:
                    random_state = State.objects.filter(
                        ~models.Q(is_triage=True), project=self.project
                    ).first()
                    self.state = random_state
                else:
                    self.state = default_state
            except ImportError:
                pass
        else:
            try:
                from plane.db.models import State

                if self.state.group == "completed":
                    self.completed_at = timezone.now()
                else:
                    self.completed_at = None
            except ImportError:
                pass

        if self._state.adding:
            with transaction.atomic():
                last_sequence = (
                    IssueSequence.objects.filter(project=self.project)
                    .select_for_update()
                    .aggregate(largest=models.Max("sequence"))["largest"]
                )
                self.sequence_id = last_sequence + 1 if last_sequence else 1
                # Strip the html tags using html parser
                self.description_stripped = (
                    None
                    if (
                        self.description_html == ""
                        or self.description_html is None
                    )
                    else strip_tags(self.description_html)
                )
                largest_sort_order = Issue.objects.filter(
                    project=self.project, state=self.state
                ).aggregate(largest=models.Max("sort_order"))["largest"]
                if largest_sort_order is not None:
                    self.sort_order = largest_sort_order + 10000

                super(Issue, self).save(*args, **kwargs)

                IssueSequence.objects.create(
                    issue=self, sequence=self.sequence_id, project=self.project
                )
        else:
            # Strip the html tags using html parser
            self.description_stripped = (
                None
                if (
                    self.description_html == ""
                    or self.description_html is None
                )
                else strip_tags(self.description_html)
            )
            super(Issue, self).save(*args, **kwargs)

    def __str__(self):
        """Return name of the issue"""
        return f"{self.name} <{self.project.name}>"


class IssueBlocker(ProjectBaseModel):
    block = models.ForeignKey(
        Issue, related_name="blocker_issues", on_delete=models.CASCADE
    )
    blocked_by = models.ForeignKey(
        Issue, related_name="blocked_issues", on_delete=models.CASCADE
    )

    class Meta:
        verbose_name = "Issue Blocker"
        verbose_name_plural = "Issue Blockers"
        db_table = "issue_blockers"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.block.name} {self.blocked_by.name}"


class IssueRelation(ProjectBaseModel):
    RELATION_CHOICES = (
        ("duplicate", "Duplicate"),
        ("relates_to", "Relates To"),
        ("blocked_by", "Blocked By"),
    )

    issue = models.ForeignKey(
        Issue, related_name="issue_relation", on_delete=models.CASCADE
    )
    related_issue = models.ForeignKey(
        Issue, related_name="issue_related", on_delete=models.CASCADE
    )
    relation_type = models.CharField(
        max_length=20,
        choices=RELATION_CHOICES,
        verbose_name="Issue Relation Type",
        default="blocked_by",
    )

    class Meta:
        unique_together = ["issue", "related_issue", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "related_issue"],
                condition=Q(deleted_at__isnull=True),
                name="issue_relation_unique_issue_related_issue_when_deleted_at_null",
            )
        ]
        verbose_name = "Issue Relation"
        verbose_name_plural = "Issue Relations"
        db_table = "issue_relations"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.issue.name} {self.related_issue.name}"


class IssueMention(ProjectBaseModel):
    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="issue_mention"
    )
    mention = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="issue_mention",
    )

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


class IssueAssignee(ProjectBaseModel):
    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="issue_assignee"
    )
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


class IssueLink(ProjectBaseModel):
    title = models.CharField(max_length=255, null=True, blank=True)
    url = models.TextField()
    issue = models.ForeignKey(
        "db.Issue", on_delete=models.CASCADE, related_name="issue_link"
    )
    metadata = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Issue Link"
        verbose_name_plural = "Issue Links"
        db_table = "issue_links"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.issue.name} {self.url}"


def get_upload_path(instance, filename):
    return f"{instance.workspace.id}/{uuid4().hex}-{filename}"


def file_size(value):
    # File limit check is only for cloud hosted
    if value.size > settings.FILE_SIZE_LIMIT:
        raise ValidationError("File too large. Size should not exceed 5 MB.")


class IssueAttachment(ProjectBaseModel):
    attributes = models.JSONField(default=dict)
    asset = models.FileField(
        upload_to=get_upload_path,
        validators=[
            file_size,
        ],
    )
    issue = models.ForeignKey(
        "db.Issue", on_delete=models.CASCADE, related_name="issue_attachment"
    )
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
    issue = models.ForeignKey(
        Issue,
        on_delete=models.SET_NULL,
        null=True,
        related_name="issue_activity",
    )
    verb = models.CharField(
        max_length=255, verbose_name="Action", default="created"
    )
    field = models.CharField(
        max_length=255, verbose_name="Field Name", blank=True, null=True
    )
    old_value = models.TextField(
        verbose_name="Old Value", blank=True, null=True
    )
    new_value = models.TextField(
        verbose_name="New Value", blank=True, null=True
    )

    comment = models.TextField(verbose_name="Comment", blank=True)
    attachments = ArrayField(
        models.URLField(), size=10, blank=True, default=list
    )
    issue_comment = models.ForeignKey(
        "db.IssueComment",
        on_delete=models.SET_NULL,
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

    class Meta:
        verbose_name = "Issue Activity"
        verbose_name_plural = "Issue Activities"
        db_table = "issue_activities"
        ordering = ("-created_at",)

    def __str__(self):
        """Return issue of the comment"""
        return str(self.issue)


class IssueComment(ProjectBaseModel):
    comment_stripped = models.TextField(verbose_name="Comment", blank=True)
    comment_json = models.JSONField(blank=True, default=dict)
    comment_html = models.TextField(blank=True, default="<p></p>")
    attachments = ArrayField(
        models.URLField(), size=10, blank=True, default=list
    )
    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="issue_comments"
    )
    # System can also create comment
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comments",
        null=True,
    )
    access = models.CharField(
        choices=(
            ("INTERNAL", "INTERNAL"),
            ("EXTERNAL", "EXTERNAL"),
        ),
        default="INTERNAL",
        max_length=100,
    )
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    def save(self, *args, **kwargs):
        self.comment_stripped = (
            strip_tags(self.comment_html) if self.comment_html != "" else ""
        )
        return super(IssueComment, self).save(*args, **kwargs)

    class Meta:
        verbose_name = "Issue Comment"
        verbose_name_plural = "Issue Comments"
        db_table = "issue_comments"
        ordering = ("-created_at",)

    def __str__(self):
        """Return issue of the comment"""
        return str(self.issue)


class IssueUserProperty(ProjectBaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="issue_property_user",
    )
    filters = models.JSONField(default=get_default_filters)
    display_filters = models.JSONField(default=get_default_display_filters)
    display_properties = models.JSONField(
        default=get_default_display_properties
    )

    class Meta:
        verbose_name = "Issue User Property"
        verbose_name_plural = "Issue User Properties"
        db_table = "issue_user_properties"
        ordering = ("-created_at",)
        unique_together = ["user", "project", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "project"],
                condition=Q(deleted_at__isnull=True),
                name="issue_user_property_unique_user_project_when_deleted_at_null",
            )
        ]

    def __str__(self):
        """Return properties status of the issue"""
        return str(self.user)


class Label(ProjectBaseModel):
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="parent_label",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=255, blank=True)
    sort_order = models.FloatField(default=65535)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        unique_together = ["name", "project", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "project"],
                condition=Q(deleted_at__isnull=True),
                name="label_unique_name_project_when_deleted_at_null",
            )
        ]
        verbose_name = "Label"
        verbose_name_plural = "Labels"
        db_table = "labels"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        if self._state.adding:
            # Get the maximum sequence value from the database
            last_id = Label.objects.filter(project=self.project).aggregate(
                largest=models.Max("sort_order")
            )["largest"]
            # if last_id is not None
            if last_id is not None:
                self.sort_order = last_id + 10000

        super(Label, self).save(*args, **kwargs)

    def __str__(self):
        return str(self.name)


class IssueLabel(ProjectBaseModel):
    issue = models.ForeignKey(
        "db.Issue", on_delete=models.CASCADE, related_name="label_issue"
    )
    label = models.ForeignKey(
        "db.Label", on_delete=models.CASCADE, related_name="label_issue"
    )

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
    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="issue_subscribers"
    )
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

    def __str__(self):
        return f"{self.issue.name} {self.subscriber.email}"


class IssueReaction(ProjectBaseModel):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="issue_reactions",
    )
    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="issue_reactions"
    )
    reaction = models.CharField(max_length=20)

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
    comment = models.ForeignKey(
        IssueComment,
        on_delete=models.CASCADE,
        related_name="comment_reactions",
    )
    reaction = models.CharField(max_length=20)

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

    def __str__(self):
        return f"{self.issue.name} {self.actor.email}"


class IssueVote(ProjectBaseModel):
    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="votes"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="votes",
    )
    vote = models.IntegerField(
        choices=(
            (-1, "DOWNVOTE"),
            (1, "UPVOTE"),
        ),
        default=1,
    )

    class Meta:
        unique_together = [
            "issue",
            "actor",
            "deleted_at",
        ]
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
