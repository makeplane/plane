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

# Python imports
from typing import Optional

# Django imports
from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import Q
from django.template.defaultfilters import slugify

# Module imports
from plane.db.mixins import ChangeTrackerMixin, IssueActivityMixin
from plane.db.models import ProjectOptionalBaseModel


class PropertyTypeEnum(models.TextChoices):
    TEXT = "TEXT", "Text"
    DATETIME = "DATETIME", "Datetime"
    DECIMAL = "DECIMAL", "Decimal"
    BOOLEAN = "BOOLEAN", "Boolean"
    OPTION = "OPTION", "Option"
    RELATION = "RELATION", "Relation"
    URL = "URL", "URL"
    EMAIL = "EMAIL", "Email"
    FILE = "FILE", "File"
    FORMULA = "FORMULA", "Formula"


class RelationTypeEnum(models.TextChoices):
    ISSUE = "ISSUE", "Issue"
    USER = "USER", "User"
    RELEASE = "RELEASE", "Release"


class IssueProperty(ChangeTrackerMixin, ProjectOptionalBaseModel):
    name = models.CharField(max_length=255)
    display_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    logo_props = models.JSONField(blank=True, default=dict)
    sort_order = models.FloatField(default=65535)
    property_type = models.CharField(max_length=255, choices=PropertyTypeEnum.choices)
    relation_type = models.CharField(max_length=255, blank=True, null=True, choices=RelationTypeEnum.choices)
    is_required = models.BooleanField(default=False)
    default_value = ArrayField(models.TextField(), blank=True, default=list)
    settings = models.JSONField(blank=True, default=dict)
    is_active = models.BooleanField(default=True)
    issue_type = models.ForeignKey(
        "db.IssueType", on_delete=models.CASCADE, related_name="properties", null=True, blank=True
    )
    is_multi = models.BooleanField(default=False)
    validation_rules = models.JSONField(blank=True, default=dict)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)
    formula_config = models.OneToOneField(
        "ee.FormulaProperty", on_delete=models.SET_NULL, related_name="property", null=True, blank=True
    )

    TRACKED_FIELDS = [
        "is_required",
        "default_value",
        "is_active",
        "sort_order",
        "external_source",
        "external_id",
        "deleted_at",
    ]

    class Meta:
        ordering = ["sort_order"]
        db_table = "issue_properties"

    def save(self, *args, **kwargs):
        self.name = slugify(self.display_name)
        created = self._state.adding
        if created and self.issue_type:
            # Get the maximum sequence value from the database
            last_id = IssueTypeProperty.objects.filter(
                issue_type_id=self.issue_type.id, workspace_id=self.workspace_id
            ).aggregate(largest=models.Max("sort_order"))["largest"]
            # if last_id is not None
            if last_id is not None:
                self.sort_order = last_id + 10000

        super(IssueProperty, self).save(*args, **kwargs)

        if self.issue_type:
            # Use _changes_on_save which is captured by ChangeTrackerMixin.save()
            self.sync_to_issue_type_properties(created=created, changed_fields=self._changes_on_save)

    def sync_to_issue_type_properties(self, created=False, changed_fields=None):
        issue_type = self.issue_type
        if created and issue_type:
            IssueTypeProperty.objects.create(
                workspace_id=self.workspace_id,
                issue_type=issue_type,
                property=self,
                is_required=self.is_required,
                default_value=self.default_value,
                is_active=self.is_active,
                sort_order=self.sort_order,
                external_source=self.external_source,
                external_id=self.external_id,
            )
        elif issue_type:
            if changed_fields:
                fields_to_update = {field: getattr(self, field) for field in changed_fields}
                IssueTypeProperty.objects.filter(issue_type=issue_type, property=self).update(**fields_to_update)

    def handle_formula_property(self, formula: str, example_output: Optional[str] = None) -> None:
        """
        Create or update the linked FormulaProperty for this issue property.
        """

        if self.property_type != PropertyTypeEnum.FORMULA:
            return

        # if the formula config already exists, update it
        if self.formula_config:
            self.formula_config.formula = formula
            self.formula_config.example_output = (
                example_output if example_output else self.formula_config.example_output
            )
            self.formula_config.save(update_fields=["formula", "example_output"])
        # if the formula config does not exist, create it
        else:
            formula_config = FormulaProperty.objects.create(
                workspace_id=self.workspace_id,
                project_id=self.project_id,
                formula=formula,
                example_output=example_output,
            )
            self.formula_config = formula_config
            self.save(update_fields=["formula_config"])

    def __str__(self):
        return self.display_name


class IssueTypeProperty(ProjectOptionalBaseModel):
    issue_type = models.ForeignKey("db.IssueType", on_delete=models.CASCADE, related_name="issue_type_properties")
    property = models.ForeignKey(IssueProperty, on_delete=models.CASCADE, related_name="issue_type_properties")
    is_required = models.BooleanField(default=False)
    default_value = ArrayField(models.TextField(), blank=True, default=list)
    is_active = models.BooleanField(default=True)
    sort_order = models.FloatField(default=65535)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ["sort_order"]
        unique_together = ["issue_type", "property", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["issue_type", "property"],
                condition=Q(deleted_at__isnull=True),
                name="issue_type_property_unique_issue_type_property_when_deleted_at_null",
            )
        ]
        db_table = "issue_type_properties"

    def __str__(self):
        return f"{self.issue_type.name} - {self.property.display_name}"

    def save(self, *args, **kwargs):
        if self._state.adding and not self.sort_order:
            # Get the maximum sequence value from the database
            last_id = IssueTypeProperty.objects.filter(
                issue_type_id=self.issue_type.id, workspace_id=self.workspace_id
            ).aggregate(largest=models.Max("sort_order"))["largest"]
            # if last_id is not None
            if last_id is not None:
                self.sort_order = last_id + 10000
        super(IssueTypeProperty, self).save(*args, **kwargs)


class IssuePropertyOption(ProjectOptionalBaseModel):
    name = models.CharField(max_length=255)
    sort_order = models.FloatField(default=65535)
    property = models.ForeignKey(IssueProperty, on_delete=models.CASCADE, related_name="options")
    description = models.TextField(blank=True)
    logo_props = models.JSONField(blank=True, default=dict)
    is_active = models.BooleanField(default=True)
    parent = models.ForeignKey("self", on_delete=models.CASCADE, related_name="children", null=True, blank=True)
    is_default = models.BooleanField(default=False)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ["sort_order"]
        unique_together = ["name", "property", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "property"],
                condition=Q(deleted_at__isnull=True),
                name="issue_property_option_unique_name_project_when_deleted_at_null",
            )
        ]
        db_table = "issue_property_options"

    def save(self, *args, **kwargs):
        if self._state.adding:
            # Get the maximum sequence value from the database
            last_id = IssuePropertyOption.objects.filter(workspace=self.workspace, property=self.property).aggregate(
                largest=models.Max("sort_order")
            )["largest"]
            # if last_id is not None
            if last_id is not None:
                self.sort_order = last_id + 10000

        if self.is_default:
            self.is_active = True

        super(IssuePropertyOption, self).save(*args, **kwargs)


class IssuePropertyValue(IssueActivityMixin, ProjectOptionalBaseModel):
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="properties")
    property = models.ForeignKey(IssueProperty, on_delete=models.CASCADE, related_name="values")
    value_text = models.TextField(blank=True)
    value_boolean = models.BooleanField(default=False)
    value_decimal = models.FloatField(default=0)
    value_datetime = models.DateTimeField(blank=True, null=True)
    value_uuid = models.UUIDField(blank=True, null=True)
    value_option = models.ForeignKey(
        IssuePropertyOption,
        on_delete=models.CASCADE,
        related_name="property_values",
        blank=True,
        null=True,
    )
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]
        db_table = "issue_property_values"

    def __str__(self):
        return f"{self.property.display_name}"

    @classmethod
    def cleanup_orphaned_for_issues(cls, issue_ids, new_type_id):
        """
        Delete property values that are not valid for the new issue type.

        This is called when issue type changes (via save() or bulk update).
        Properties shared between old and new types are preserved.

        Args:
            issue_ids: List of issue IDs to clean up
            new_type_id: The new type ID (None if type is being unset)
        """
        if not issue_ids:
            return

        if not new_type_id:
            # Changed to null type - all property values are orphaned
            cls.objects.filter(issue_id__in=issue_ids).delete()
            return

        # Get valid property IDs for the new type
        valid_property_ids = set(
            IssueTypeProperty.objects.filter(issue_type_id=new_type_id, deleted_at__isnull=True).values_list(
                "property_id", flat=True
            )
        )

        # Delete values for properties not valid on new type (preserves shared properties)
        cls.objects.filter(issue_id__in=issue_ids).exclude(property_id__in=valid_property_ids).delete()

    @classmethod
    def archive_and_cleanup_orphaned_for_issues(cls, issue_ids, new_type_id, old_type_id=None):
        """Archive orphaned property values to issue descriptions, then delete them."""
        if not issue_ids:
            return
        from plane.ee.utils.issue_property_archiver import archive_orphaned_property_values_to_description

        archive_orphaned_property_values_to_description(issue_ids, new_type_id, old_type_id)
        cls.cleanup_orphaned_for_issues(issue_ids, new_type_id)


class IssuePropertyActivity(IssueActivityMixin, ProjectOptionalBaseModel):
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    old_identifier = models.UUIDField(blank=True, null=True)
    new_identifier = models.UUIDField(blank=True, null=True)
    property = models.ForeignKey(IssueProperty, on_delete=models.CASCADE, related_name="activities")
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="activities")
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="issue_property_activities",
    )
    action = models.CharField(max_length=255)
    epoch = models.FloatField(null=True)
    comment = models.TextField(verbose_name="Comment", blank=True)

    class Meta:
        ordering = ["-created_at"]
        db_table = "issue_property_activities"

    def __str__(self):
        return f"{self.property.display_name} - {self.issue_id}"


class FormulaProperty(ProjectOptionalBaseModel):
    formula = models.TextField()
    example_output = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]
        db_table = "formula_properties"

    def __str__(self):
        return f"{self.formula}"
