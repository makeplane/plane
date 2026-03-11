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
from django.db import models

# Module imports
from plane.db.mixins import IssueActivityMixin
from plane.db.models import ProjectBaseModel


class Milestone(ProjectBaseModel):
    """
    Project Milestone Model
    """

    title = models.CharField(max_length=255, verbose_name="Milestone Title")
    description = models.ForeignKey("db.Description", on_delete=models.CASCADE, related_name="milestone_description")
    target_date = models.DateField(null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    archived_at = models.DateTimeField(null=True)

    @classmethod
    def is_valid_title(cls, title, project_id, exclude_id=None):
        """Validate that the milestone title is unique within the project."""
        qs = cls.objects.filter(title=title, project_id=project_id)
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        if qs.exists():
            return False
        return True

    class Meta:
        verbose_name = "Milestone"
        verbose_name_plural = "Milestones"
        db_table = "milestones"
        ordering = ("target_date", "-created_at")
        unique_together = ["title", "project", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["title", "project"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_milestone_title_per_project",
            )
        ]

    def __str__(self):
        return f"{self.title} <{self.project.name}>"


class MilestoneIssue(IssueActivityMixin, ProjectBaseModel):
    """
    Milestone Issues Junction Table
    """

    milestone = models.ForeignKey(Milestone, on_delete=models.CASCADE, related_name="milestone_issues")
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="issue_milestone")

    class Meta:
        unique_together = ["issue", "deleted_at"]
        constraints = [
            # Ensure an issue can only be in one milestone at a time
            models.UniqueConstraint(
                fields=["issue"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_issue_per_milestone_when_not_deleted",
            )
        ]
        verbose_name = "Milestone Issue"
        verbose_name_plural = "Milestone Issues"
        db_table = "milestone_issues"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.milestone.title} - {self.issue.name}"
