# Python import
from uuid import uuid4

# Django imports
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError

# Module imports
from . import ProjectBaseModel
from plane.utils.html_processor import strip_tags


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
            .exclude(archived_at__isnull=False)
        )


class Issue(ProjectBaseModel):
    PRIORITY_CHOICES = (
        ("urgent", "Urgent"),
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
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
    estimate_point = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(7)], null=True, blank=True
    )
    name = models.CharField(max_length=255, verbose_name="Issue Name")
    description = models.JSONField(blank=True, default=dict)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    priority = models.CharField(
        max_length=30,
        choices=PRIORITY_CHOICES,
        verbose_name="Issue Priority",
        null=True,
        blank=True,
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
    labels = models.ManyToManyField(
        "db.Label", blank=True, related_name="labels", through="IssueLabel"
    )
    sort_order = models.FloatField(default=65535)
    completed_at = models.DateTimeField(null=True)
    archived_at = models.DateField(null=True)

    objects = models.Manager()
    issue_objects = IssueManager()

    class Meta:
        verbose_name = "Issue"
        verbose_name_plural = "Issues"
        db_table = "issues"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        # This means that the model isn't saved to the database yet
        if self.state is None:
            try:
                from plane.db.models import State

                default_state = State.objects.filter(
                    ~models.Q(name="Triage"), project=self.project, default=True
                ).first()
                # if there is no default state assign any random state
                if default_state is None:
                    random_state = State.objects.filter(
                        ~models.Q(name="Triage"), project=self.project
                    ).first()
                    self.state = random_state
                    if random_state.group == "started":
                        self.start_date = timezone.now().date()
                else:
                    if default_state.group == "started":
                        self.start_date = timezone.now().date()
                    self.state = default_state
            except ImportError:
                pass
        else:
            try:
                from plane.db.models import State, PageBlock

                # Check if the current issue state and completed state id are same
                if self.state.group == "completed":
                    self.completed_at = timezone.now()
                    # check if there are any page blocks
                    PageBlock.objects.filter(issue_id=self.id).filter().update(
                        completed_at=timezone.now()
                    )
                elif self.state.group == "started":
                    self.start_date = timezone.now().date()
                else:
                    PageBlock.objects.filter(issue_id=self.id).filter().update(
                        completed_at=None
                    )
                    self.completed_at = None

            except ImportError:
                pass
        if self._state.adding:
            # Get the maximum display_id value from the database
            last_id = IssueSequence.objects.filter(project=self.project).aggregate(
                largest=models.Max("sequence")
            )["largest"]
            # aggregate can return None! Check it first.
            # If it isn't none, just use the last ID specified (which should be the greatest) and add one to it
            if last_id is not None:
                self.sequence_id = last_id + 1

            largest_sort_order = Issue.objects.filter(
                project=self.project, state=self.state
            ).aggregate(largest=models.Max("sort_order"))["largest"]
            if largest_sort_order is not None:
                self.sort_order = largest_sort_order + 10000

            # If adding it to started state
            if self.state.group == "started":
                self.start_date = timezone.now().date()
        # Strip the html tags using html parser
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
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
        unique_together = ["issue", "assignee"]
        verbose_name = "Issue Assignee"
        verbose_name_plural = "Issue Assignees"
        db_table = "issue_assignees"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.issue.name} {self.assignee.email}"


class IssueLink(ProjectBaseModel):
    title = models.CharField(max_length=255, null=True, blank=True)
    url = models.URLField()
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

    class Meta:
        verbose_name = "Issue Attachment"
        verbose_name_plural = "Issue Attachments"
        db_table = "issue_attachments"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.issue.name} {self.asset}"


class IssueActivity(ProjectBaseModel):
    issue = models.ForeignKey(
        Issue, on_delete=models.SET_NULL, null=True, related_name="issue_activity"
    )
    verb = models.CharField(max_length=255, verbose_name="Action", default="created")
    field = models.CharField(
        max_length=255, verbose_name="Field Name", blank=True, null=True
    )
    old_value = models.TextField(verbose_name="Old Value", blank=True, null=True)
    new_value = models.TextField(verbose_name="New Value", blank=True, null=True)

    comment = models.TextField(verbose_name="Comment", blank=True)
    attachments = ArrayField(models.URLField(), size=10, blank=True, default=list)
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
    attachments = ArrayField(models.URLField(), size=10, blank=True, default=list)
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE)
    # System can also create comment
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comments",
        null=True,
    )

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


class IssueProperty(ProjectBaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="issue_property_user",
    )
    properties = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Issue Property"
        verbose_name_plural = "Issue Properties"
        db_table = "issue_properties"
        ordering = ("-created_at",)
        unique_together = ["user", "project"]

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

    class Meta:
        unique_together = ["name", "project"]
        verbose_name = "Label"
        verbose_name_plural = "Labels"
        db_table = "labels"
        ordering = ("-created_at",)

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
        Issue, on_delete=models.SET_NULL, related_name="issue_sequence", null=True
    )
    sequence = models.PositiveBigIntegerField(default=1)
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
        unique_together = ["issue", "subscriber"]
        verbose_name = "Issue Subscriber"
        verbose_name_plural = "Issue Subscribers"
        db_table = "issue_subscribers"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.issue.name} {self.subscriber.email}"


# TODO: Find a better method to save the model
@receiver(post_save, sender=Issue)
def create_issue_sequence(sender, instance, created, **kwargs):
    if created:
        IssueSequence.objects.create(
            issue=instance, sequence=instance.sequence_id, project=instance.project
        )
