# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models

# Module imports
from .base import BaseModel


class JobGrade(BaseModel):
    """Instance-level job grade (parent entity)."""

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    sort_order = models.FloatField(default=65535)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "job_grades"
        ordering = ["sort_order", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["name"],
                condition=models.Q(deleted_at__isnull=True),
                name="job_grade_unique_name",
            ),
        ]

    def __str__(self):
        return self.name


class JobPosition(BaseModel):
    """Job position linked to a job grade."""

    job_grade = models.ForeignKey(
        JobGrade,
        on_delete=models.CASCADE,
        related_name="job_positions",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    sort_order = models.FloatField(default=65535)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "job_positions"
        ordering = ["sort_order", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["job_grade", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="job_position_unique_name_per_grade",
            ),
        ]

    def __str__(self):
        return f"{self.job_grade.name} / {self.name}"
