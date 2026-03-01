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

# Django imports
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q

# Module imports
from .project import ProjectBaseModel


class Estimate(ProjectBaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(verbose_name="Estimate Description", blank=True)
    type = models.CharField(max_length=255, default="categories")
    last_used = models.BooleanField(default=False)

    def __str__(self):
        """Return name of the estimate"""
        return f"{self.name} <{self.project.name}>"

    class Meta:
        unique_together = ["name", "project", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "project"],
                condition=Q(deleted_at__isnull=True),
                name="estimate_unique_name_project_when_deleted_at_null",
            )
        ]
        verbose_name = "Estimate"
        verbose_name_plural = "Estimates"
        db_table = "estimates"
        ordering = ("name",)


class EstimatePoint(ProjectBaseModel):
    estimate = models.ForeignKey("db.Estimate", on_delete=models.CASCADE, related_name="points")
    key = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    description = models.TextField(blank=True)
    value = models.CharField(max_length=255)

    def __str__(self):
        """Return name of the estimate"""
        return f"{self.estimate.name} <{self.key}> <{self.value}>"

    class Meta:
        verbose_name = "Estimate Point"
        verbose_name_plural = "Estimate Points"
        db_table = "estimate_points"
        ordering = ("value",)
