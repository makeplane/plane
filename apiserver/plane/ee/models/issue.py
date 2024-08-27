# Django imports
from django.db import models
from django.conf import settings

# Module imports
from plane.db.models import ProjectBaseModel, Issue


class IssueWorkLog(ProjectBaseModel):
    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="worklogs"
    )
    description = models.TextField(blank=True)
    logged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="worklogs",
    )
    duration = models.IntegerField(default=0)

    class Meta:
        verbose_name = "Issue Work Log"
        verbose_name_plural = "Issue Work Logs"
        db_table = "issue_worklogs"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.issue.name} {self.logged_by.email}"
