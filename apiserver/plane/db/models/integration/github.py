# Django imports
from django.db import models

# Module imports
from plane.db.models import ProjectBaseModel


class GithubRepository(ProjectBaseModel):
    name = models.CharField(max_length=500)
    url = models.URLField(null=True)
    config = models.JSONField(default=dict)

    def __str__(self):
        """Return the repo name"""
        return f"{self.name}"

    class Meta:
        verbose_name = "Repository"
        verbose_name_plural = "Repositories"
        db_table = "repositories"
        ordering = ("-created_at",)


class GithubRepositorySync(ProjectBaseModel):
    repository = models.ForeignKey(
        "db.GithubRepository", on_delete=models.CASCADE, related_name="syncss"
    )
    credentials = models.JSONField(default=dict)
    # Bot user
    actor = models.ForeignKey(
        "db.User", related_name="user_syncs", on_delete=models.CASCADE
    )
    workspace_integration = models.ForeignKey(
        "db.WorkspaceIntegration", related_name="github_syncs", on_delete=models.CASCADE
    )

    def __str__(self):
        """Return the repo sync"""
        return f"{self.repository.name} <{self.project.name}>"

    class Meta:
        verbose_name = "Github Repository Sync"
        verbose_name_plural = "Github Repository Syncs"
        db_table = "github_repository_syncs"
        ordering = ("-created_at",)


class GithubIssueSync(ProjectBaseModel):
    github_issue_id = models.BigIntegerField()
    issue = models.ForeignKey(
        "db.Issue", related_name="github_syncs", on_delete=models.CASCADE
    )
    repository = models.ForeignKey(
        "db.GithubRepository", related_name="issue_syncs", on_delete=models.CASCADE
    )

    def __str__(self):
        """Return the github issue sync"""
        return f"{self.repository.name}-{self.project.name}-{self.issue.name}"

    class Meta:
        verbose_name = "Github Issue Sync"
        verbose_name_plural = "Github Issue Syncs"
        db_table = "github_issue_syncs"
        ordering = ("-created_at",)
