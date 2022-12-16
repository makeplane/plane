# Django imports
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

# Module imports
from . import ProjectBaseModel

# TODO: Handle identifiers for Bulk Inserts - nk
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
    name = models.CharField(max_length=255, verbose_name="Issue Name")
    description = models.JSONField(verbose_name="Issue Description", blank=True)
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
    attachments = ArrayField(models.URLField(), size=10, blank=True, default=list)
    labels = models.ManyToManyField(
        "db.Label", blank=True, related_name="labels", through="IssueLabel"
    )

    class Meta:
        verbose_name = "Issue"
        verbose_name_plural = "Issues"
        db_table = "issue"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        # This means that the model isn't saved to the database yet
        if self._state.adding:
            # Get the maximum display_id value from the database

            last_id = IssueSequence.objects.filter(project=self.project).aggregate(
                largest=models.Max("sequence")
            )["largest"]
            # aggregate can return None! Check it first.
            # If it isn't none, just use the last ID specified (which should be the greatest) and add one to it
            if last_id is not None:
                self.sequence_id = last_id + 1
        if self.state is None:
            try:
                from plane.db.models import State

                self.state, created = State.objects.get_or_create(
                    project=self.project, name="Backlog"
                )
            except ImportError:
                pass
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
        db_table = "issue_blocker"
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
        db_table = "issue_assignee"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.issue.name} {self.assignee.email}"


class IssueActivity(ProjectBaseModel):
    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="issue_activity"
    )
    verb = models.CharField(max_length=255, verbose_name="Action", default="created")
    field = models.CharField(
        max_length=255, verbose_name="Field Name", blank=True, null=True
    )
    old_value = models.CharField(
        max_length=255, verbose_name="Old Value", blank=True, null=True
    )
    new_value = models.CharField(
        max_length=255, verbose_name="New Value", blank=True, null=True
    )

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

    class Meta:
        verbose_name = "Issue Activity"
        verbose_name_plural = "Issue Activities"
        db_table = "issue_activity"
        ordering = ("-created_at",)

    def __str__(self):
        """Return issue of the comment"""
        return str(self.issue)


class TimelineIssue(ProjectBaseModel):
    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="issue_timeline"
    )
    sequence_id = models.FloatField(default=1.0)
    links = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Timeline Issue"
        verbose_name_plural = "Timeline Issues"
        db_table = "issue_timeline"
        ordering = ("-created_at",)

    def __str__(self):
        """Return project of the project member"""
        return str(self.issue)


class IssueComment(ProjectBaseModel):
    comment = models.TextField(verbose_name="Comment", blank=True)
    attachments = ArrayField(models.URLField(), size=10, blank=True, default=list)
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE)
    # System can also create comment
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comments",
        null=True,
    )

    class Meta:
        verbose_name = "Issue Comment"
        verbose_name_plural = "Issue Comments"
        db_table = "issue_comment"
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
        db_table = "issue_property"
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
    colour = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = "Label"
        verbose_name_plural = "Labels"
        db_table = "label"
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
        db_table = "issue_label"
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
        db_table = "issue_sequence"
        ordering = ("-created_at",)


# TODO: Find a better method to save the model
@receiver(post_save, sender=Issue)
def create_issue_sequence(sender, instance, created, **kwargs):

    if created:
        IssueSequence.objects.create(
            issue=instance, sequence=instance.sequence_id, project=instance.project
        )
