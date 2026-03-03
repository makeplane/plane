# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models
from django.db.models import Q

from .workspace import WorkspaceBaseModel


class Label(WorkspaceBaseModel):
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="parent_label",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=255, blank=True)
    sort_order = models.FloatField(default=65535)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        constraints = [
            # Enforce uniqueness of name when project is NULL and deleted_at is NULL
            models.UniqueConstraint(
                fields=["name"],
                condition=Q(project__isnull=True, deleted_at__isnull=True),
                name="unique_name_when_project_null_and_not_deleted",
            ),
            # Enforce uniqueness of project and name when project is not NULL and deleted_at is NULL
            models.UniqueConstraint(
                fields=["project", "name"],
                condition=Q(project__isnull=False, deleted_at__isnull=True),
                name="unique_project_name_when_not_deleted",
            ),
        ]
        verbose_name = "Label"
        verbose_name_plural = "Labels"
        db_table = "labels"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        if self._state.adding:
            # Get the maximum sequence value from the database
            last_id = Label.objects.filter(project=self.project).aggregate(largest=models.Max("sort_order"))["largest"]
            # if last_id is not None
            if last_id is not None:
                self.sort_order = last_id + 10000

        super(Label, self).save(*args, **kwargs)

    def __str__(self):
        return str(self.name)


# Default labels seeded on project creation (matches DEFAULT_STATES pattern).
# Note: bulk_create bypasses Label.save(), so sort_order values are used as-is.
# Manually created labels auto-compute sort_order from max(existing) + 10000.
DEFAULT_LABELS = [
    {"name": "Bank-wide Project", "color": "#0E8A16", "sort_order": 65535},
    {"name": "Daily",             "color": "#0075CA", "sort_order": 75535},
    {"name": "Weekly",            "color": "#E4E669", "sort_order": 85535},
    {"name": "Monthly",           "color": "#D93F0B", "sort_order": 95535},
    {"name": "Quarterly",         "color": "#0693E3", "sort_order": 105535},
    {"name": "Half-year",         "color": "#FBCA04", "sort_order": 115535},
    {"name": "Yearly",            "color": "#B60205", "sort_order": 125535},
    {"name": "Ad-hoc",            "color": "#D876E3", "sort_order": 135535},
]
