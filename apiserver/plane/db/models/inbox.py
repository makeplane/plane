# Django imports
from django.db import models

# Module imports
from plane.db.models.project import ProjectBaseModel


class Inbox(ProjectBaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(
        verbose_name="Inbox Description", blank=True
    )
    is_default = models.BooleanField(default=False)
    view_props = models.JSONField(default=dict)
    logo_props = models.JSONField(default=dict)

    def __str__(self):
        """Return name of the Inbox"""
        return f"{self.name} <{self.project.name}>"

    class Meta:
        unique_together = ["name", "project", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "project"],
                condition=models.Q(deleted_at__isnull=True),
                name="inbox_unique_name_project_when_deleted_at_null",
            )
        ]
        verbose_name = "Inbox"
        verbose_name_plural = "Inboxes"
        db_table = "inboxes"
        ordering = ("name",)


class InboxIssue(ProjectBaseModel):
    inbox = models.ForeignKey(
        "db.Inbox", related_name="issue_inbox", on_delete=models.CASCADE
    )
    issue = models.ForeignKey(
        "db.Issue", related_name="issue_inbox", on_delete=models.CASCADE
    )
    status = models.IntegerField(
        choices=(
            (-2, "Pending"),
            (-1, "Rejected"),
            (0, "Snoozed"),
            (1, "Accepted"),
            (2, "Duplicate"),
        ),
        default=-2,
    )
    snoozed_till = models.DateTimeField(null=True)
    duplicate_to = models.ForeignKey(
        "db.Issue",
        related_name="inbox_duplicate",
        on_delete=models.SET_NULL,
        null=True,
    )
    source = models.TextField(blank=True, null=True)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "InboxIssue"
        verbose_name_plural = "InboxIssues"
        db_table = "inbox_issues"
        ordering = ("-created_at",)

    def __str__(self):
        """Return name of the Issue"""
        return f"{self.issue.name} <{self.inbox.name}>"
