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
from plane.db.models.workspace import Workspace


class ScriptFunction(BaseModel):
    """
    ScriptFunction model represents reusable code blocks with defined inputs/outputs
    that can be imported and used within runner scripts.
    """

    CATEGORY_CHOICES = [
        ("http", "HTTP"),
        ("notifications", "Notifications"),
        ("data", "Data"),
        ("utils", "Utils"),
        ("custom", "Custom"),
    ]

    name = models.CharField(max_length=100, verbose_name="Function Name")
    description = models.TextField(verbose_name="Function Description")
    category = models.CharField(
        max_length=50, choices=CATEGORY_CHOICES, default="custom"
    )

    # Input/Output schema stored as JSON
    parameters = models.JSONField(
        default=list, help_text="Array of parameter definitions"
    )
    return_type = models.CharField(
        max_length=255, default="void", verbose_name="Return Type"
    )

    # Implementation
    code = models.TextField(verbose_name="Function Code")

    # Usage
    usage_example = models.TextField(
        null=True, blank=True, verbose_name="Usage Example"
    )

    # System vs Workspace function
    is_system = models.BooleanField(
        default=False,
        help_text="System functions are built-in and immutable by users",
    )
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="script_functions",
        null=True,
        blank=True,
        help_text="Null for system functions",
    )

    class Meta:
        db_table = "script_functions"
        ordering = ["category", "name"]
        constraints = [
            # Unique name per workspace (for workspace functions)
            models.UniqueConstraint(
                fields=["name", "workspace"],
                name="unique_function_name_per_workspace",
                condition=models.Q(workspace__isnull=False, deleted_at__isnull=True),
            ),
            # Unique name for system functions (workspace is null)
            models.UniqueConstraint(
                fields=["name"],
                name="unique_system_function_name",
                condition=models.Q(is_system=True, deleted_at__isnull=True),
            ),
        ]

    def __str__(self):
        prefix = "[System]" if self.is_system else "[Workspace]"
        return f"{prefix} {self.name}"

    def save(self, *args, **kwargs):
        # System functions should not have a workspace
        if self.is_system:
            self.workspace = None
        # Workspace functions must have a workspace
        elif not self.is_system and not self.workspace_id:
            raise ValueError("Workspace must be set for non-system functions")
        super().save(*args, **kwargs)

    def generate_usage_example(self):
        """Auto-generate a usage example based on function definition."""
        params_str = ", ".join(
            [
                f'{p["name"]}: {p.get("type", "unknown")}'
                for p in self.parameters
                if p.get("required", True)
            ]
        )

        optional_params = [
            p for p in self.parameters if not p.get("required", True)
        ]
        if optional_params:
            optional_str = ", ".join(
                [f'{p["name"]}?: {p.get("type", "unknown")}' for p in optional_params]
            )
            params_str = f"{params_str}, {optional_str}" if params_str else optional_str

        return f"""const result = await Functions.{self.name}({{
  {params_str}
}});"""
