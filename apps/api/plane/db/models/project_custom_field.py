# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models
from django.db.models import Q

# Module imports
from .project import ProjectBaseModel


class ProjectCustomFieldType(models.TextChoices):
    NUMBER = "number", "Number"


class ProjectCustomField(ProjectBaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    field_type = models.CharField(
        max_length=30, choices=ProjectCustomFieldType.choices, default=ProjectCustomFieldType.NUMBER
    )
    sort_order = models.FloatField(default=65535)
    is_active = models.BooleanField(default=True)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "name"],
                condition=Q(deleted_at__isnull=True),
                name="project_custom_field_unique_project_name_when_not_deleted",
            )
        ]
        verbose_name = "Project Custom Field"
        verbose_name_plural = "Project Custom Fields"
        db_table = "project_custom_fields"
        ordering = ("sort_order",)

    def save(self, *args, **kwargs):
        if self._state.adding:
            last_sort_order = ProjectCustomField.objects.filter(project=self.project).aggregate(
                largest=models.Max("sort_order")
            )["largest"]
            if last_sort_order is not None:
                self.sort_order = last_sort_order + 10000
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} <{self.project.name}>"


class ProjectCustomFieldValue(ProjectBaseModel):
    custom_field = models.ForeignKey(ProjectCustomField, on_delete=models.CASCADE, related_name="values")
    # DecimalField (not Float): summed/compared monetary and ratio figures must not
    # accumulate binary floating-point rounding error once this replaces the source
    # spreadsheet's financial columns.
    value_decimal = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "custom_field"],
                condition=Q(deleted_at__isnull=True),
                name="project_custom_field_value_unique_project_field_when_not_deleted",
            )
        ]
        verbose_name = "Project Custom Field Value"
        verbose_name_plural = "Project Custom Field Values"
        db_table = "project_custom_field_values"

    def __str__(self):
        return f"{self.custom_field.name} = {self.value_decimal} <{self.project.name}>"
