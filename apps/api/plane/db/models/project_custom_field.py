# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from functools import reduce
import operator

# Django imports
from django.conf import settings
from django.db import models
from django.db.models import Q

# Module imports
from .project import ProjectBaseModel

# The columns on ProjectCustomFieldValue that hold the actual value, one per field type.
SINGLE_VALUE_COLUMNS = ("value_decimal", "value_text", "value_date", "value_option", "value_member")


def _single_value_column_check() -> Q:
    """
    At most one of SINGLE_VALUE_COLUMNS may be set on a row (all-null is allowed:
    the upsert view creates a row via get_or_create before any value is written).
    Mirrors ProjectCustomFieldValueSerializer.validate() so the invariant also
    holds for writes that bypass the serializer (migrations, admin, scripts).
    """
    all_null = Q(**{f"{column}__isnull": True for column in SINGLE_VALUE_COLUMNS})
    exactly_one_conditions = [
        Q(**{f"{column}__isnull": False})
        & Q(**{f"{other}__isnull": True for other in SINGLE_VALUE_COLUMNS if other != column})
        for column in SINGLE_VALUE_COLUMNS
    ]
    return reduce(operator.or_, exactly_one_conditions, all_null)


class ProjectCustomFieldType(models.TextChoices):
    NUMBER = "number", "Number"
    TEXT = "text", "Text"
    DATE = "date", "Date"
    DROPDOWN = "dropdown", "Dropdown"
    MEMBER = "member", "Member"


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
    # Purely a display grouping hint for the project-info page (e.g. "项目&合同基本信息");
    # unset for ad-hoc user-created fields, which render ungrouped there.
    group_name = models.CharField(max_length=255, blank=True, null=True)
    # When true, ProjectCustomFieldValueSerializer.validate() rejects a value that
    # duplicates another project's value for a field of the same name in this
    # workspace (see that method for why the comparison is by name, not custom_field_id).
    # Deliberately not exposed on the create/update field API: only default-seeded
    # fields carry this, never a field a user creates ad hoc through "Add field".
    is_unique_key = models.BooleanField(default=False)

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


class ProjectCustomFieldOption(ProjectBaseModel):
    custom_field = models.ForeignKey(ProjectCustomField, on_delete=models.CASCADE, related_name="options")
    name = models.CharField(max_length=255)
    sort_order = models.FloatField(default=65535)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["custom_field", "name"],
                condition=Q(deleted_at__isnull=True),
                name="project_custom_field_option_unique_field_name_when_not_deleted",
            )
        ]
        verbose_name = "Project Custom Field Option"
        verbose_name_plural = "Project Custom Field Options"
        db_table = "project_custom_field_options"
        ordering = ("sort_order",)

    def save(self, *args, **kwargs):
        if self._state.adding:
            last_sort_order = ProjectCustomFieldOption.objects.filter(custom_field=self.custom_field).aggregate(
                largest=models.Max("sort_order")
            )["largest"]
            if last_sort_order is not None:
                self.sort_order = last_sort_order + 10000
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} <{self.custom_field.name}>"


class ProjectCustomFieldValue(ProjectBaseModel):
    custom_field = models.ForeignKey(ProjectCustomField, on_delete=models.CASCADE, related_name="values")
    # DecimalField (not Float): summed/compared monetary and ratio figures must not
    # accumulate binary floating-point rounding error once this replaces the source
    # spreadsheet's financial columns.
    value_decimal = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    value_text = models.TextField(blank=True, null=True)
    value_date = models.DateField(blank=True, null=True)
    # SET_NULL (not CASCADE): the soft-delete bgtask treats any on_delete other than
    # SET_NULL as "soft-delete the related row too", so CASCADE here would destroy this
    # entire value record whenever the referenced option is deleted, not just clear the
    # selection. See apps/api/plane/bgtasks/deletion_task.py.
    value_option = models.ForeignKey(
        ProjectCustomFieldOption, on_delete=models.SET_NULL, null=True, blank=True, related_name="values"
    )
    # Same FK target as Project.project_lead: the field tracks who is currently
    # responsible, not a project-membership record, so it should keep pointing at
    # the user even if their ProjectMember row is later deactivated or removed.
    value_member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="project_custom_field_values",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "custom_field"],
                condition=Q(deleted_at__isnull=True),
                name="project_custom_field_value_unique_project_field_when_not_deleted",
            ),
            models.CheckConstraint(
                check=_single_value_column_check(),
                name="project_custom_field_value_single_value_column",
            ),
        ]
        verbose_name = "Project Custom Field Value"
        verbose_name_plural = "Project Custom Field Values"
        db_table = "project_custom_field_values"

    def __str__(self):
        value = (
            self.value_decimal
            or self.value_text
            or self.value_date
            or self.value_option_id
            or self.value_member_id
        )
        return f"{self.custom_field.name} = {value} <{self.project.name}>"
