# Django imports
from django.db import models

# Module imports
from plane.db.models import WorkspaceBaseModel
from plane.ee.models import IssueProperty, IssuePropertyOption


class DraftIssuePropertyValue(WorkspaceBaseModel):
    draft_issue = models.ForeignKey(
        "db.DraftIssue", on_delete=models.CASCADE, related_name="draft_issue_properties"
    )
    property = models.ForeignKey(
        IssueProperty, on_delete=models.CASCADE, related_name="draft_issue_values"
    )
    value_text = models.TextField(blank=True)
    value_boolean = models.BooleanField(default=False)
    value_decimal = models.FloatField(default=0)
    value_datetime = models.DateTimeField(blank=True, null=True)
    value_uuid = models.UUIDField(blank=True, null=True)
    value_option = models.ForeignKey(
        IssuePropertyOption,
        on_delete=models.CASCADE,
        related_name="draft_issue_property_values",
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ["-created_at"]
        db_table = "draft_issue_property_values"

    def __str__(self):
        return f"{self.property.display_name}"
