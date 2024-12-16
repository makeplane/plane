# Python imports

# Django imports
from django.db import models

# Module imports
from plane.db.models.project import ProjectBaseModel


class SlackProjectSync(ProjectBaseModel):
    access_token = models.CharField(max_length=300)
    scopes = models.TextField()
    bot_user_id = models.CharField(max_length=50)
    webhook_url = models.URLField(max_length=1000)
    data = models.JSONField(default=dict)
    team_id = models.CharField(max_length=30)
    team_name = models.CharField(max_length=300)
    workspace_integration = models.ForeignKey(
        "db.WorkspaceIntegration", related_name="slack_syncs", on_delete=models.CASCADE
    )

    def __str__(self):
        """Return the repo name"""
        return f"{self.project.name}"

    class Meta:
        unique_together = ["team_id", "project"]
        verbose_name = "Slack Project Sync"
        verbose_name_plural = "Slack Project Syncs"
        db_table = "slack_project_syncs"
        ordering = ("-created_at",)
