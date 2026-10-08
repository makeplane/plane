# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django models
from django.db import models

from .base import BaseModel


class AnalyticView(BaseModel):
    workspace = models.ForeignKey("db.Workspace", related_name="analytics", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    query = models.JSONField()
    query_dict = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Analytic"
        verbose_name_plural = "Analytics"
        db_table = "analytic_views"
        ordering = ("-created_at",)

    def __str__(self):
        """Return name of the analytic view"""
        return f"{self.name} <{self.workspace.name}>"
