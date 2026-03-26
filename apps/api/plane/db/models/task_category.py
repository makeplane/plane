# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models

# Module imports
from .base import BaseModel


class MainTaskCategory(BaseModel):
    """Instance-level main task category for classifying work items.

    Not scoped to any workspace or project — applies instance-wide.
    """

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    sort_order = models.FloatField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "main_task_categories"
        ordering = ["sort_order", "name"]
        verbose_name = "Main Task Category"
        verbose_name_plural = "Main Task Categories"

    def __str__(self):
        return self.name


class SubTaskCategory(BaseModel):
    """Instance-level sub task category, optionally linked to a main category."""

    name = models.CharField(max_length=255)
    main_category = models.ForeignKey(
        MainTaskCategory,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="sub_categories",
    )
    sort_order = models.FloatField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "sub_task_categories"
        ordering = ["sort_order", "name"]
        verbose_name = "Sub Task Category"
        verbose_name_plural = "Sub Task Categories"

    def __str__(self):
        return self.name
