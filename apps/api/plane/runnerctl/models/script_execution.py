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

from django.db import models

from plane.db.models.base import BaseModel
from plane.db.models.project import Project
from plane.db.models.workspace import Workspace

from .script import Script


class ScriptExecution(BaseModel):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("errored", "Errored"),
    ]

    TRIGGER_TYPE_CHOICES = [
        ("test", "Test"),
        ("manual", "Manual"),
        ("automation", "Automation"),
    ]

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="workspace_script_executions")
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="project_script_executions", null=True, blank=True
    )
    script = models.ForeignKey(Script, on_delete=models.CASCADE, related_name="executions", null=True, blank=True)
    trigger_type = models.CharField(max_length=30, choices=TRIGGER_TYPE_CHOICES, default="manual")
    trigger_id = models.UUIDField(
        null=True, blank=True, help_text="ID of the triggering entity (automation rule, runner task, etc.)"
    )
    trigger_context = models.JSONField(
        null=True, blank=True, help_text="Additional context about the trigger (event payload, etc.)"
    )
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="pending")
    # Code fields for test runs (when script is null) or overrides
    code = models.TextField(null=True, blank=True)
    code_type = models.CharField(max_length=30, null=True, blank=True)
    platform = models.CharField(max_length=30, null=True, blank=True)
    build = models.TextField(null=True, blank=True)
    input_data = models.JSONField(null=True, blank=True)
    execution_variables = models.JSONField(
        null=True, blank=True, help_text="Variable values passed by the invoking system during execution"
    )
    output_data = models.JSONField(null=True, blank=True)
    error_data = models.JSONField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "script_executions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Execution {self.id} - Script {self.script_id} - {self.status}"

    def save(self, *args, **kwargs):
        if self.script:
            if not self.workspace_id:
                self.workspace = self.script.workspace
            if not self.project_id and self.script.project:
                self.project = self.script.project
        if not self.workspace_id:
            raise ValueError("Workspace must be set for ScriptExecution")
        super().save(*args, **kwargs)
