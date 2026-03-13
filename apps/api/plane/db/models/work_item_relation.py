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
from enum import Enum

# Django imports
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.db.models.functions import Greatest, Least

# Module imports
from plane.db.mixins import update_issue_last_activity_at

# Local imports
from .base import BaseModel
from .issue import Issue
from .project import ProjectBaseModel


DEFAULT_RELATES_TO_DEFINITION = {
    "name": "Relates to",
    "description": "General purpose link between two related work items",
    "outward": "relates to",
    "inward": "relates to",
    "is_default": True,
    "sort_order": 65535.0,
}

DEFAULT_DUPLICATE_DEFINITION = {
    "name": "Duplicate",
    "description": "Marks a work item as a duplicate of another",
    "outward": "duplicate",
    "inward": "duplicate",
    "is_default": True,
    "sort_order": 131070.0,
}

DEFAULT_IMPLEMENTS_DEFINITION = {
    "name": "Implements",
    "description": "Indicates a work item implements or is implemented by another",
    "outward": "implements",
    "inward": "implemented by",
    "is_default": True,
    "sort_order": 196605.0,
}

# Default relation definitions seeded per workspace
DEFAULT_RELATION_DEFINITIONS = [
    DEFAULT_RELATES_TO_DEFINITION,
    DEFAULT_DUPLICATE_DEFINITION,
    DEFAULT_IMPLEMENTS_DEFINITION,
]


class WorkItemRelationDefinition(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        related_name="work_item_relation_definitions",
        on_delete=models.CASCADE,
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    outward = models.CharField(max_length=255)
    inward = models.CharField(max_length=255)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    color = models.CharField(max_length=255, blank=True, default="")
    logo_props = models.JSONField(default=dict)
    sort_order = models.FloatField(default=65535)

    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = "work_item_relation_definitions"
        verbose_name = "Work Item Relation Definition"
        verbose_name_plural = "Work Item Relation Definitions"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(deleted_at__isnull=True),
                name="unique_workspace_relation_def_name_when_not_deleted",
            ),
            models.UniqueConstraint(
                fields=["workspace", "inward"],
                condition=Q(deleted_at__isnull=True),
                name="unique_workspace_relation_definition_inward_when_not_deleted",
            ),
            models.UniqueConstraint(
                fields=["workspace", "outward"],
                condition=Q(deleted_at__isnull=True),
                name="unique_workspace_relation_definition_outward_when_not_deleted",
            ),
        ]

    def __str__(self):
        return self.name


class IssueRelationChoices(models.TextChoices):
    # Deprecated: migrating to WorkItemRelationDefinition FK.
    # Kept for backward compatibility during migration period.
    DUPLICATE = "duplicate", "Duplicate"
    RELATES_TO = "relates_to", "Relates To"
    IMPLEMENTED_BY = "implemented_by", "Implemented By"

    # Active dependency choices (stored in CharField relation_type)
    BLOCKED_BY = "blocked_by", "Blocked By"
    START_BEFORE = "start_before", "Start Before"
    FINISH_BEFORE = "finish_before", "Finish Before"


# Bidirectional relation pairs: (forward, reverse)
# Defined after class to avoid enum metaclass conflicts
IssueRelationChoices._RELATION_PAIRS = (
    ("relates_to", "relates_to"),  # symmetric
    ("duplicate", "duplicate"),  # symmetric
    ("blocked_by", "blocking"),
    ("start_before", "start_after"),
    ("finish_before", "finish_after"),
    ("implemented_by", "implements"),
)

# Generate reverse mapping from pairs
IssueRelationChoices._REVERSE_MAPPING = {forward: reverse for forward, reverse in IssueRelationChoices._RELATION_PAIRS}


class DefaultDependencyKeys(Enum):
    BLOCKED_BY = "blocked_by"
    BLOCKING = "blocking"
    START_BEFORE = "start_before"
    START_AFTER = "start_after"
    FINISH_BEFORE = "finish_before"
    FINISH_AFTER = "finish_after"

    def __str__(self):
        return self.value

    def __repr__(self):
        return self.value


class RelationCategory(models.TextChoices):
    DEPENDENCY = "dependency", "Dependency"
    RELATION = "relation", "Relation"


class IssueRelation(ProjectBaseModel):
    # IssueRelation stores both dependencies and relations in one table.
    # - Dependencies: category="dependency", relation_type set (e.g. "blocked_by"), definition=NULL
    # - Relations: category="relation", relation_type=NULL, definition=FK to WorkItemRelationDefinition
    issue = models.ForeignKey(Issue, related_name="issue_relation", on_delete=models.CASCADE)
    related_issue = models.ForeignKey(Issue, related_name="issue_related", on_delete=models.CASCADE)
    category = models.CharField(
        max_length=20,
        choices=RelationCategory.choices,
        default=RelationCategory.DEPENDENCY,
        help_text="Discriminator: 'dependency' for CharField-based deps, 'relation' for FK-based relations.",
    )
    relation_type = models.CharField(
        max_length=20,
        verbose_name="Issue Relation Type",
        null=True,
        blank=True,
        default=None,
    )
    definition = models.ForeignKey(
        "db.WorkItemRelationDefinition",
        related_name="issue_relations",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        help_text="FK to WorkItemRelationDefinition. Set for relation rows, NULL for dependencies.",
    )

    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        unique_together = []
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "related_issue", "relation_type"],
                condition=Q(deleted_at__isnull=True, category="dependency"),
                name="issue_relation_unique_dependency_when_not_deleted",
            ),
            models.UniqueConstraint(
                fields=["issue", "related_issue", "definition"],
                condition=Q(deleted_at__isnull=True, category="relation"),
                name="issue_relation_unique_relation_when_not_deleted",
            ),
            models.UniqueConstraint(
                Least("issue", "related_issue"),
                Greatest("issue", "related_issue"),
                condition=Q(deleted_at__isnull=True, category="dependency"),
                name="issue_relation_unique_dep_per_unordered_pair",
            ),
        ]
        verbose_name = "Issue Relation"
        verbose_name_plural = "Issue Relations"
        db_table = "issue_relations"
        ordering = ("-created_at",)

    def clean(self):
        if self.category == RelationCategory.DEPENDENCY:
            # Dependency row - check no reverse pair exists
            if (
                IssueRelation.objects.filter(
                    issue=self.related_issue,
                    related_issue=self.issue,
                    category=RelationCategory.DEPENDENCY,
                    deleted_at__isnull=True,
                )
                .exclude(pk=self.pk)
                .exists()
            ):
                raise ValidationError("A dependency already exists between these two work items.")

    def _update_issue_last_activity(self):
        update_issue_last_activity_at(self.issue_id, self.related_issue_id)

    def __str__(self):
        return f"{self.issue.name} {self.related_issue.name}"
