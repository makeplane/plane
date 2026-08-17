# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models

from plane.db.models import BaseModel
from plane.gitsync.registry import MODULE_KEYS


class ProjectGitRemote(BaseModel):
    class Kind(models.TextChoices):
        LOCAL_MOUNT = "local_mount"
        GIT_URL = "git_url"

    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="gitsync_remotes",
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="gitsync_remotes",
    )
    name = models.CharField(max_length=255)
    kind = models.CharField(max_length=32, choices=Kind.choices, default=Kind.LOCAL_MOUNT)
    workdir = models.CharField(max_length=1024, default="/opt/testhub/workdir")
    host_path = models.CharField(max_length=1024, blank=True, default="")
    repo_url = models.CharField(max_length=1024, blank=True, default="")
    branch = models.CharField(max_length=255, blank=True, default="")
    credential_ref = models.CharField(max_length=255, blank=True, default="")
    last_sync_sha = models.CharField(max_length=64, blank=True, default="")
    last_sync_at = models.DateTimeField(null=True, blank=True)
    last_sync_status = models.CharField(max_length=32, blank=True, default="")
    last_sync_error = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "Project git remote"
        verbose_name_plural = "Project git remotes"
        db_table = "gitsync_project_git_remotes"
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(fields=["project", "name"], name="gitsync_remote_project_name_uniq"),
        ]
        indexes = [
            models.Index(fields=["project", "kind"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.kind})"


class ModuleBinding(BaseModel):
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="gitsync_module_bindings",
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="gitsync_module_bindings",
    )
    module_key = models.CharField(max_length=64)
    remote = models.ForeignKey(
        ProjectGitRemote,
        on_delete=models.CASCADE,
        related_name="module_bindings",
    )

    class Meta:
        verbose_name = "Module binding"
        verbose_name_plural = "Module bindings"
        db_table = "gitsync_module_bindings"
        ordering = ("module_key",)
        constraints = [
            models.UniqueConstraint(fields=["project", "module_key"], name="gitsync_binding_project_module_uniq"),
            models.CheckConstraint(
                condition=models.Q(module_key__in=MODULE_KEYS),
                name="gitsync_binding_known_module",
            ),
        ]
