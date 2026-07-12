# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models

# Module imports
from .project import ProjectBaseModel


class Milestone(ProjectBaseModel):
    name = models.CharField(max_length=255, verbose_name="Milestone Name")
    description = models.TextField(verbose_name="Milestone Description", blank=True)
    target_date = models.DateTimeField(verbose_name="Target Date", null=True, blank=True)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)
    sort_order = models.FloatField(default=65535)

    class Meta:
        verbose_name = "Milestone"
        verbose_name_plural = "Milestones"
        db_table = "milestones"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        if self._state.adding:
            smallest_sort_order = Milestone.objects.filter(project=self.project).aggregate(
                smallest=models.Min("sort_order")
            )["smallest"]

            if smallest_sort_order is not None:
                self.sort_order = smallest_sort_order - 10000

        super(Milestone, self).save(*args, **kwargs)

    def __str__(self):
        """Return name of the milestone"""
        return f"{self.name} <{self.project.name}>"


class MilestoneIssue(ProjectBaseModel):
    """
    Milestone Issues
    """

    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="issue_milestone")
    milestone = models.ForeignKey(Milestone, on_delete=models.CASCADE, related_name="issue_milestone")

    class Meta:
        unique_together = ["issue", "milestone", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "milestone"],
                condition=models.Q(deleted_at__isnull=True),
                name="milestone_issue_when_deleted_at_null",
            )
        ]
        verbose_name = "Milestone Issue"
        verbose_name_plural = "Milestone Issues"
        db_table = "milestone_issues"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.milestone}"
