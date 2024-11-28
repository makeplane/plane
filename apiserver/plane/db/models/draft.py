# Django imports
from django.conf import settings
from django.db import models
from django.utils import timezone

# Module imports
from plane.utils.html_processor import strip_tags

from .workspace import WorkspaceBaseModel


class DraftIssue(WorkspaceBaseModel):
    PRIORITY_CHOICES = (
        ("urgent", "Urgent"),
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
        ("none", "None"),
    )
    parent = models.ForeignKey(
        "db.Issue",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="draft_parent_issue",
    )
    state = models.ForeignKey(
        "db.State",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="state_draft_issue",
    )
    estimate_point = models.ForeignKey(
        "db.EstimatePoint",
        on_delete=models.SET_NULL,
        related_name="draft_issue_estimates",
        null=True,
        blank=True,
    )
    name = models.CharField(
        max_length=255, verbose_name="Issue Name", blank=True, null=True
    )
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
        related_name="draft_assignee",
        through="DraftIssueAssignee",
        through_fields=("draft_issue", "assignee"),
    )
    labels = models.ManyToManyField(
        "db.Label", blank=True, related_name="draft_labels", through="DraftIssueLabel"
    )
    sort_order = models.FloatField(default=65535)
    completed_at = models.DateTimeField(null=True)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)
    type = models.ForeignKey(
        "db.IssueType",
        on_delete=models.SET_NULL,
        related_name="draft_issue_type",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "DraftIssue"
        verbose_name_plural = "DraftIssues"
        db_table = "draft_issues"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        if self.state is None:
            try:
                from plane.db.models import State

                default_state = State.objects.filter(
                    ~models.Q(is_triage=True), project=self.project, default=True
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
            # Strip the html tags using html parser
            self.description_stripped = (
                None
                if (self.description_html == "" or self.description_html is None)
                else strip_tags(self.description_html)
            )
            largest_sort_order = DraftIssue.objects.filter(
                project=self.project, state=self.state
            ).aggregate(largest=models.Max("sort_order"))["largest"]
            if largest_sort_order is not None:
                self.sort_order = largest_sort_order + 10000

            super(DraftIssue, self).save(*args, **kwargs)

        else:
            # Strip the html tags using html parser
            self.description_stripped = (
                None
                if (self.description_html == "" or self.description_html is None)
                else strip_tags(self.description_html)
            )
            super(DraftIssue, self).save(*args, **kwargs)

    def __str__(self):
        """Return name of the draft issue"""
        return f"{self.name} <{self.project.name}>"


class DraftIssueAssignee(WorkspaceBaseModel):
    draft_issue = models.ForeignKey(
        DraftIssue, on_delete=models.CASCADE, related_name="draft_issue_assignee"
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="draft_issue_assignee",
    )

    class Meta:
        unique_together = ["draft_issue", "assignee", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["draft_issue", "assignee"],
                condition=models.Q(deleted_at__isnull=True),
                name="draft_issue_assignee_unique_issue_assignee_when_deleted_at_null",
            )
        ]
        verbose_name = "Draft Issue Assignee"
        verbose_name_plural = "Draft Issue Assignees"
        db_table = "draft_issue_assignees"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.draft_issue.name} {self.assignee.email}"


class DraftIssueLabel(WorkspaceBaseModel):
    draft_issue = models.ForeignKey(
        "db.DraftIssue", on_delete=models.CASCADE, related_name="draft_label_issue"
    )
    label = models.ForeignKey(
        "db.Label", on_delete=models.CASCADE, related_name="draft_label_issue"
    )

    class Meta:
        verbose_name = "Draft Issue Label"
        verbose_name_plural = "Draft Issue Labels"
        db_table = "draft_issue_labels"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.draft_issue.name} {self.label.name}"


class DraftIssueModule(WorkspaceBaseModel):
    module = models.ForeignKey(
        "db.Module", on_delete=models.CASCADE, related_name="draft_issue_module"
    )
    draft_issue = models.ForeignKey(
        "db.DraftIssue", on_delete=models.CASCADE, related_name="draft_issue_module"
    )

    class Meta:
        unique_together = ["draft_issue", "module", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["draft_issue", "module"],
                condition=models.Q(deleted_at__isnull=True),
                name="module_draft_issue_unique_issue_module_when_deleted_at_null",
            )
        ]
        verbose_name = "Draft Issue Module"
        verbose_name_plural = "Draft Issue Modules"
        db_table = "draft_issue_modules"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.module.name} {self.draft_issue.name}"


class DraftIssueCycle(WorkspaceBaseModel):
    """
    Draft Issue Cycles
    """

    draft_issue = models.ForeignKey(
        "db.DraftIssue", on_delete=models.CASCADE, related_name="draft_issue_cycle"
    )
    cycle = models.ForeignKey(
        "db.Cycle", on_delete=models.CASCADE, related_name="draft_issue_cycle"
    )

    class Meta:
        unique_together = ["draft_issue", "cycle", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["draft_issue", "cycle"],
                condition=models.Q(deleted_at__isnull=True),
                name="draft_issue_cycle_when_deleted_at_null",
            )
        ]
        verbose_name = "Draft Issue Cycle"
        verbose_name_plural = "Draft Issue Cycles"
        db_table = "draft_issue_cycles"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.cycle}"
