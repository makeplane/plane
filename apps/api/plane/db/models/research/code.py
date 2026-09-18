# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Code repository registration and artifacts (§4.6, P1-CODE-01 ~ P1-CODE-10).

Plane never hosts Git: a repository is a registration record, an artifact is a
commit / branch / tag / snapshot reference, and a snapshot is an uploaded
archive kept for traceability only.
"""

from django.db import models

from plane.db.models.base import BaseModel


class ProjectCodeRepository(BaseModel):
    """An external repository used by a research project (§4.6)."""

    class Provider(models.TextChoices):
        GITHUB = "GITHUB", "GitHub"
        GITLAB = "GITLAB", "GitLab"
        GITEA = "GITEA", "Gitea"
        LOCAL_GIT = "LOCAL_GIT", "Local git"
        OTHER = "OTHER", "Other"

    class Visibility(models.TextChoices):
        PUBLIC = "PUBLIC", "Public"
        INTERNAL = "INTERNAL", "Internal"
        PRIVATE = "PRIVATE", "Private"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        ARCHIVED = "ARCHIVED", "Archived"
        SYNC_FAILED = "SYNC_FAILED", "Sync failed"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="research_code_repositories",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="research_code_repositories",
    )
    provider = models.CharField(max_length=16, choices=Provider.choices, default=Provider.GITHUB)
    repository_url = models.URLField(max_length=500)
    repository_slug = models.CharField(max_length=255, blank=True, default="")
    default_branch = models.CharField(max_length=128, default="main")
    visibility = models.CharField(max_length=16, choices=Visibility.choices, default=Visibility.PRIVATE)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    # only the name of a secret manager entry is ever stored here (P1-CODE-08)
    credential_ref = models.CharField(max_length=128, blank=True, default="")
    last_synced_commit = models.CharField(max_length=64, blank=True, default="")
    last_sync_at = models.DateTimeField(null=True, blank=True)
    sync_error = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        verbose_name = "Project Code Repository"
        verbose_name_plural = "Project Code Repositories"
        db_table = "research_code_repositories"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["project", "repository_url"],
                name="rsch_code_repo_uq_project_url",
            ),
        ]
        indexes = [
            models.Index(fields=["workspace", "status"], name="rsch_code_repo_ws_status_idx"),
            models.Index(fields=["project", "provider"], name="rsch_code_repo_project_idx"),
        ]

    def __str__(self):
        return f"{self.project_id} <{self.repository_url}>"


class CodeArtifact(BaseModel):
    """A commit, branch, tag or snapshot of a registered repository (§4.6)."""

    class RefType(models.TextChoices):
        COMMIT = "COMMIT", "Commit"
        BRANCH = "BRANCH", "Branch"
        TAG = "TAG", "Tag"
        SNAPSHOT = "SNAPSHOT", "Snapshot"

    repository = models.ForeignKey(
        ProjectCodeRepository,
        on_delete=models.CASCADE,
        related_name="artifacts",
    )
    ref_type = models.CharField(max_length=16, choices=RefType.choices)
    ref_value = models.CharField(max_length=255)
    commit_message = models.TextField(blank=True, default="")
    author_name = models.CharField(max_length=255, blank=True, default="")
    committed_at = models.DateTimeField(null=True, blank=True)
    snapshot_asset = models.ForeignKey(
        "db.FileAsset",
        on_delete=models.SET_NULL,
        related_name="research_code_snapshots",
        null=True,
        blank=True,
    )
    linked_experiment = models.ForeignKey(
        "db.ExperimentRecord",
        on_delete=models.SET_NULL,
        related_name="code_artifacts",
        null=True,
        blank=True,
    )
    description = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "Code Artifact"
        verbose_name_plural = "Code Artifacts"
        db_table = "research_code_artifacts"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["repository", "ref_type", "ref_value"],
                name="rsch_code_artifact_uq_ref",
            ),
        ]
        indexes = [
            models.Index(fields=["repository", "ref_type", "committed_at"], name="rsch_code_artifact_repo_idx"),
        ]

    def __str__(self):
        return f"{self.repository_id} {self.ref_type}:{self.ref_value}"
