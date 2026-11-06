# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Models for the work_item feature group. See plane/nexus/README.md.

Archive, dependencies, relates_to/duplicate, intake status and the PQL list
live on CE's own tables. Time tracking, and relations typed by a workspace
relation definition (plane.nexus WorkItemRelationDefinition), need new ones.
"""

from django.conf import settings
from django.db import models
from django.db.models import Q

from plane.db.models import ProjectBaseModel

__all__ = ["WorkItemWorkLog", "WorkItemCustomRelation"]


class WorkItemWorkLog(ProjectBaseModel):
    """Time logged against a work item. duration is in minutes."""

    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="nexus_work_logs")
    description = models.TextField(blank=True, default="")
    duration = models.PositiveIntegerField()
    logged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="nexus_work_logs"
    )

    class Meta:
        db_table = "nexus_work_logs"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["project", "issue"], name="nexus_worklog_project_issue")]


class WorkItemCustomRelation(ProjectBaseModel):
    """`issue` <definition.outward> `related_issue`; seen from `related_issue` it reads <definition.inward>."""

    definition = models.ForeignKey(
        "nexus.WorkItemRelationDefinition", on_delete=models.CASCADE, related_name="work_item_relations"
    )
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="nexus_custom_relations")
    related_issue = models.ForeignKey(
        "db.Issue", on_delete=models.CASCADE, related_name="nexus_custom_related_relations"
    )

    class Meta:
        db_table = "nexus_work_item_custom_relations"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["definition", "issue", "related_issue"],
                condition=Q(deleted_at__isnull=True),
                name="nexus_wi_custom_relation_unique",
            )
        ]
