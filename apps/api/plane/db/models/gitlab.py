# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models

from .project import ProjectBaseModel


class ProjectGitLabConfig(ProjectBaseModel):
    """Per-project GitLab merge automation settings.

    When an MR whose title starts with the work-item key is merged, and the
    work item is currently in ``merge_from_state``, it is moved to
    ``merge_to_state``. Both states are optional — if either is unset, no
    auto-transition runs.
    """

    merge_from_state = models.ForeignKey(
        "db.State",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gitlab_merge_from_projects",
    )
    merge_to_state = models.ForeignKey(
        "db.State",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gitlab_merge_to_projects",
    )

    class Meta:
        verbose_name = "Project GitLab Config"
        verbose_name_plural = "Project GitLab Configs"
        db_table = "project_gitlab_configs"
        constraints = [
            models.UniqueConstraint(
                fields=["project"],
                condition=models.Q(deleted_at__isnull=True),
                name="project_gitlab_config_unique_project_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"GitLab config <{self.project_id}>"


class IssueGitLabMeta(ProjectBaseModel):
    """GitLab MR status and commit count linked to a work item."""

    issue = models.OneToOneField(
        "db.Issue",
        on_delete=models.CASCADE,
        related_name="gitlab_meta",
    )
    mr_status = models.CharField(max_length=32, blank=True, default="")
    mr_url = models.URLField(max_length=2048, blank=True, default="")
    mr_iid = models.IntegerField(null=True, blank=True)
    mr_title = models.CharField(max_length=500, blank=True, default="")
    commit_count = models.PositiveIntegerField(default=0)
    commit_shas = models.JSONField(default=list, blank=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Issue GitLab Meta"
        verbose_name_plural = "Issue GitLab Metas"
        db_table = "issue_gitlab_metas"
        indexes = [
            models.Index(fields=["issue"], name="issue_gitlab_meta_issue_idx"),
        ]

    def __str__(self):
        return f"{self.issue_id} mr={self.mr_status} commits={self.commit_count}"
