# Python imports
import uuid

# Django imports
from django.db import models

# Module imports
from plane.db.models import ProjectBaseModel


class GithubRepository(ProjectBaseModel):
    name = models.CharField(max_length=500)
    url = models.URLField(null=True)
    config = models.JSONField(default=dict)
    repository_id = models.BigIntegerField()
    owner = models.CharField(max_length=500)

    def __str__(self):
        """Return the repo name"""
        return f"{self.name}"

    class Meta:
        verbose_name = "Repository"
        verbose_name_plural = "Repositories"
        db_table = "github_repositories"
        ordering = ("-created_at",)


class GithubRepositorySync(ProjectBaseModel):
    repository = models.OneToOneField(
        "db.GithubRepository", on_delete=models.CASCADE, related_name="syncs"
    )
    credentials = models.JSONField(default=dict)
    # Bot user
    actor = models.ForeignKey(
        "db.User", related_name="user_syncs", on_delete=models.CASCADE
    )
    workspace_integration = models.ForeignKey(
        "db.WorkspaceIntegration",
        related_name="github_syncs",
        on_delete=models.CASCADE,
    )
    label = models.ForeignKey(
        "db.Label",
        on_delete=models.SET_NULL,
        null=True,
        related_name="repo_syncs",
    )

    def __str__(self):
        """Return the repo sync"""
        return f"{self.repository.name} <{self.project.name}>"

    class Meta:
        unique_together = ["project", "repository"]
        verbose_name = "Github Repository Sync"
        verbose_name_plural = "Github Repository Syncs"
        db_table = "github_repository_syncs"
        ordering = ("-created_at",)


class GithubIssueSync(ProjectBaseModel):
    repo_issue_id = models.BigIntegerField()
    github_issue_id = models.BigIntegerField()
    issue_url = models.URLField(blank=False)
    issue = models.ForeignKey(
        "db.Issue", related_name="github_syncs", on_delete=models.CASCADE
    )
    repository_sync = models.ForeignKey(
        "db.GithubRepositorySync",
        related_name="issue_syncs",
        on_delete=models.CASCADE,
    )

    def __str__(self):
        """Return the github issue sync"""
        return f"{self.repository.name}-{self.project.name}-{self.issue.name}"

    class Meta:
        unique_together = ["repository_sync", "issue"]
        verbose_name = "Github Issue Sync"
        verbose_name_plural = "Github Issue Syncs"
        db_table = "github_issue_syncs"
        ordering = ("-created_at",)


class GithubCommentSync(ProjectBaseModel):
    repo_comment_id = models.BigIntegerField()
    comment = models.ForeignKey(
        "db.IssueComment",
        related_name="comment_syncs",
        on_delete=models.CASCADE,
    )
    issue_sync = models.ForeignKey(
        "db.GithubIssueSync",
        related_name="comment_syncs",
        on_delete=models.CASCADE,
    )

    def __str__(self):
        """Return the github issue sync"""
        return f"{self.comment.id}"

    class Meta:
        unique_together = ["issue_sync", "comment"]
        verbose_name = "Github Comment Sync"
        verbose_name_plural = "Github Comment Syncs"
        db_table = "github_comment_syncs"
        ordering = ("-created_at",)
