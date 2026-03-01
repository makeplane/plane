# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from django.contrib.postgres.fields import ArrayField
from django.db import models

from plane.db.models.base import BaseModel
from plane.db.models.project import Project
from plane.db.models.workspace import Workspace


class Script(BaseModel):
    PLATFORM_CHOICES = [
        ("node22", "Node.js 22"),
    ]

    CODE_TYPE_CHOICES = [
        ("inline", "Inline"),
        ("main_fn", "Main Function"),
    ]

    name = models.CharField(max_length=255, verbose_name="Script Name")
    description = models.TextField(null=True, blank=True, verbose_name="Script Description")
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="workspace_scripts",
        null=True,
        blank=True,
        help_text="Null for system scripts",
    )
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="project_scripts", null=True, blank=True
    )
    is_system = models.BooleanField(
        default=False,
        help_text="System scripts are built-in and read-only for all workspaces",
    )
    platform = models.CharField(max_length=30, choices=PLATFORM_CHOICES, default="node22")
    code = models.TextField()
    code_type = models.CharField(max_length=30, choices=CODE_TYPE_CHOICES, null=True, blank=True)
    build = models.TextField(null=True, blank=True)
    function_names = ArrayField(
        models.CharField(max_length=100),
        default=list,
        blank=True,
        help_text="Function names used by this script (detected during build)",
    )
    env_variables = models.JSONField(null=True, blank=True)
    allowed_domains = models.JSONField(null=True, blank=True)
    variables = models.JSONField(
        null=True, blank=True, help_text="Variable definitions that the script expects from the invoking system"
    )

    class Meta:
        db_table = "scripts"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name"],
                condition=models.Q(deleted_at__isnull=True, is_system=True),
                name="unique_system_script_name",
            ),
        ]

    def __str__(self):
        return f"Script {self.id} - {self.name}"

    def save(self, *args, **kwargs):
        if self.project and not self.workspace_id:
            self.workspace = self.project.workspace
        # System scripts don't require a workspace
        if not self.workspace_id and not self.is_system:
            raise ValueError("Workspace must be set for non-system scripts")
        super().save(*args, **kwargs)
