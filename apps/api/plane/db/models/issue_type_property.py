# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models
from django.db.models import Q

from .base import BaseModel
from .project import ProjectBaseModel


class IssueTypeProperty(BaseModel):
    PROPERTY_TYPES = (
        ("text", "Text"),
        ("number", "Number"),
        ("dropdown", "Dropdown"),
        ("boolean", "Boolean"),
        ("date", "Date"),
        ("member_picker", "Member Picker"),
    )
    SELECT_MODES = (
        ("single", "Single"),
        ("multi", "Multi"),
    )

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="issue_type_properties")
    issue_type = models.ForeignKey("db.IssueType", on_delete=models.CASCADE, related_name="properties")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    property_type = models.CharField(max_length=32, choices=PROPERTY_TYPES, default="text")
    is_mandatory = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    sort_order = models.FloatField(default=65535)
    options = models.JSONField(default=list, blank=True)
    select_mode = models.CharField(max_length=16, choices=SELECT_MODES, default="single")
    default_value = models.JSONField(null=True, blank=True)

    class Meta:
        verbose_name = "Issue Type Property"
        verbose_name_plural = "Issue Type Properties"
        db_table = "issue_type_properties"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["issue_type", "title"],
                condition=Q(deleted_at__isnull=True),
                name="issue_type_property_unique_title_per_type_not_deleted",
            )
        ]

    def save(self, *args, **kwargs):
        if self._state.adding:
            last = (
                IssueTypeProperty.objects.filter(issue_type_id=self.issue_type_id)
                .exclude(pk=self.pk)
                .aggregate(largest=models.Max("sort_order"))["largest"]
            )
            if last is not None:
                self.sort_order = last + 10000
        super().save(*args, **kwargs)

    def __str__(self):
        return str(self.title)


class IssuePropertyValue(ProjectBaseModel):
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="type_property_values")
    property = models.ForeignKey(
        "db.IssueTypeProperty",
        on_delete=models.CASCADE,
        related_name="values",
    )
    value = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Issue Property Value"
        verbose_name_plural = "Issue Property Values"
        db_table = "issue_property_values"
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "property"],
                condition=Q(deleted_at__isnull=True),
                name="issue_property_value_unique_issue_property_not_deleted",
            )
        ]

    def __str__(self):
        return f"{self.issue_id}:{self.property_id}"
