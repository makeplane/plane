# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models

# Module imports
from .base import BaseModel


class MainTaskCategory(BaseModel):
    """Instance-level main task category for work item classification."""

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    sort_order = models.FloatField(default=65535)
    is_active = models.BooleanField(default=True)
    departments = models.ManyToManyField(
        "db.Department",
        through="DepartmentTaskCategory",
        related_name="main_task_categories",
        blank=True,
    )

    class Meta:
        db_table = "main_task_categories"
        verbose_name = "Main Task Category"
        verbose_name_plural = "Main Task Categories"
        ordering = ["sort_order", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["name"],
                condition=models.Q(deleted_at__isnull=True),
                name="main_task_category_unique_name",
            ),
        ]

    def __str__(self):
        return self.name


class SubTaskCategory(BaseModel):
    """Instance-level sub task category linked to a main category."""

    main_category = models.ForeignKey(
        MainTaskCategory,
        on_delete=models.CASCADE,
        related_name="sub_categories",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    sort_order = models.FloatField(default=65535)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "sub_task_categories"
        verbose_name = "Sub Task Category"
        verbose_name_plural = "Sub Task Categories"
        ordering = ["sort_order", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["main_category", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="sub_task_category_unique_name_per_main",
            ),
        ]

    def __str__(self):
        return f"{self.main_category.name} / {self.name}"


class DepartmentTaskCategory(BaseModel):
    """Through-model linking departments to main task categories (M2M)."""

    department = models.ForeignKey(
        "db.Department", on_delete=models.CASCADE, related_name="task_category_links"
    )
    main_task_category = models.ForeignKey(
        MainTaskCategory, on_delete=models.CASCADE, related_name="department_links"
    )

    class Meta:
        db_table = "department_task_categories"
        unique_together = [["department", "main_task_category"]]
