# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import models

from plane.db.models import BaseModel

DEFAULT_BRANCH = "sandbox/jafron"
DEFAULT_WORKDIR = "/opt/testhub/workdir"


class ProjectTestRepo(BaseModel):
    project = models.OneToOneField(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="testhub_repo",
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="testhub_repos",
    )
    repo_url = models.CharField(max_length=1024, blank=True, default="")
    branch = models.CharField(max_length=255, default=DEFAULT_BRANCH)
    workdir = models.CharField(max_length=1024, default=DEFAULT_WORKDIR)
    last_sync_sha = models.CharField(max_length=64, blank=True, default="")
    last_sync_at = models.DateTimeField(null=True, blank=True)
    last_sync_status = models.CharField(max_length=32, blank=True, default="")
    last_sync_error = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "Project test repo"
        verbose_name_plural = "Project test repos"
        db_table = "testhub_project_test_repos"
        ordering = ("-created_at",)


class CatalogSnapshot(BaseModel):
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="testhub_catalogs",
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="testhub_catalogs",
    )
    sha = models.CharField(max_length=64, blank=True, default="")
    payload = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Catalog snapshot"
        verbose_name_plural = "Catalog snapshots"
        db_table = "testhub_catalog_snapshots"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["project", "-created_at"]),
        ]


class TesthubAssetOverlay(BaseModel):
    """Platform-only state keyed by a catalog/path ref. Never written back to git."""

    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="testhub_overlays",
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="testhub_overlays",
    )
    asset_ref = models.CharField(max_length=512)
    kind = models.CharField(max_length=64, default="progress")
    payload = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Testhub asset overlay"
        verbose_name_plural = "Testhub asset overlays"
        db_table = "testhub_asset_overlays"
        ordering = ("asset_ref",)
        constraints = [
            models.UniqueConstraint(
                fields=["project", "asset_ref", "kind"],
                name="testhub_overlay_project_asset_kind_uniq",
            ),
        ]
        indexes = [
            models.Index(fields=["project", "kind"]),
        ]


class TesthubJob(BaseModel):
    class Status(models.TextChoices):
        QUEUED = "queued"
        RUNNING = "running"
        SUCCEEDED = "succeeded"
        FAILED = "failed"

    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="testhub_jobs",
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="testhub_jobs",
    )
    kind = models.CharField(max_length=64)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.QUEUED)
    params = models.JSONField(default=dict)
    argv = models.JSONField(default=list)
    confirmed = models.BooleanField(default=False)
    exit_code = models.IntegerField(null=True, blank=True)
    stdout = models.TextField(blank=True, default="")
    stderr = models.TextField(blank=True, default="")
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="testhub_jobs",
    )

    class Meta:
        verbose_name = "Testhub job"
        verbose_name_plural = "Testhub jobs"
        db_table = "testhub_jobs"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["project", "status"]),
            models.Index(fields=["project", "-created_at"]),
        ]


class TesthubSession(BaseModel):
    """A test session that references Formulation features. Does not copy Gherkin."""

    class Status(models.TextChoices):
        DRAFT = "draft"
        QUEUED = "queued"
        RUNNING = "running"
        SUCCEEDED = "succeeded"
        FAILED = "failed"

    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="testhub_sessions",
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="testhub_sessions",
    )
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    feature_source_module = models.CharField(max_length=64, default="features")
    feature_sha = models.CharField(max_length=64, blank=True, default="")
    environment_id = models.CharField(max_length=255, blank=True, default="")
    selection = models.JSONField(default=list)
    summary = models.JSONField(default=dict)
    job = models.ForeignKey(
        TesthubJob,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sessions",
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="testhub_sessions",
    )

    class Meta:
        verbose_name = "Testhub session"
        verbose_name_plural = "Testhub sessions"
        db_table = "testhub_sessions"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["project", "-created_at"]),
        ]
