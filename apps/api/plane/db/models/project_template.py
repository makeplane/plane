# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models
from django.db.models import Q

from .base import BaseModel


class ProjectTemplate(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="project_templates")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    payload = models.JSONField(default=dict)
    sort_order = models.FloatField(default=65535)

    class Meta:
        verbose_name = "Project template"
        verbose_name_plural = "Project templates"
        db_table = "project_templates"
        ordering = ("-sort_order", "-created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(deleted_at__isnull=True),
                name="unique_project_template_name_workspace_not_deleted",
            )
        ]

    def save(self, *args, **kwargs):
        if self._state.adding:
            last = (
                ProjectTemplate.objects.filter(workspace_id=self.workspace_id)
                .exclude(pk=self.pk)
                .aggregate(largest=models.Max("sort_order"))["largest"]
            )
            if last is not None:
                self.sort_order = last + 10000
        super().save(*args, **kwargs)

    def __str__(self):
        return str(self.name)
