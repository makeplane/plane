# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models
from django.db.models import Q

from .workspace import WorkspaceBaseModel


class WorkItemTemplate(WorkspaceBaseModel):
    """
    Predefined work item (issue) field sets for a workspace, optionally scoped to one project.
    `payload` stores the same field keys as TIssue / create payload (partial).
    """

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    payload = models.JSONField(default=dict)
    sort_order = models.FloatField(default=65535)

    class Meta:
        verbose_name = "Work item template"
        verbose_name_plural = "Work item templates"
        db_table = "work_item_templates"
        ordering = ("-sort_order", "-created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(project__isnull=True, deleted_at__isnull=True),
                name="unique_work_item_template_name_ws_global_not_deleted",
            ),
            models.UniqueConstraint(
                fields=["workspace", "project", "name"],
                condition=Q(project__isnull=False, deleted_at__isnull=True),
                name="unique_work_item_template_name_per_project_not_deleted",
            ),
        ]

    def save(self, *args, **kwargs):
        if self._state.adding:
            qs = WorkItemTemplate.objects.filter(workspace_id=self.workspace_id).exclude(pk=self.pk)
            if self.project_id:
                qs = qs.filter(project_id=self.project_id)
            else:
                qs = qs.filter(project_id__isnull=True)
            last = qs.aggregate(largest=models.Max("sort_order"))["largest"]
            if last is not None:
                self.sort_order = last + 10000
        super().save(*args, **kwargs)

    def __str__(self):
        return str(self.name)
