# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models
from django.db.models import Q

# Module imports
from .project import ProjectBaseModel, ProjectMember
from .base import BaseModel
from plane.db.mixins import SoftDeletionQuerySet, SoftDeletionManager


class IssueTypeQuerySet(SoftDeletionQuerySet):
    """QuerySet for issue types that handles accessibility.

    NOTE: the EE teamspace branch of accessible_to is deferred to the
    Teamspaces phase (Plan 06); only project-membership access is applied here.
    """

    def accessible_to(self, user_id, slug):
        member_project_ids = ProjectMember.objects.filter(
            member_id=user_id, workspace__slug=slug, is_active=True
        ).values_list("project_id", flat=True)
        return self.filter(project_issue_types__project_id__in=member_project_ids)


class IssueTypeManager(SoftDeletionManager):
    def get_queryset(self):
        return IssueTypeQuerySet(self.model, using=self._db).filter(deleted_at__isnull=True)

    def accessible_to(self, user_id, slug):
        return self.get_queryset().accessible_to(user_id, slug)


class IssueType(BaseModel):
    objects = IssueTypeManager()

    workspace = models.ForeignKey("db.Workspace", related_name="issue_types", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    logo_props = models.JSONField(default=dict)
    is_epic = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    level = models.FloatField(default=0)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "Issue Type"
        verbose_name_plural = "Issue Types"
        db_table = "issue_types"

    def __str__(self):
        return self.name


class ProjectIssueType(ProjectBaseModel):
    issue_type = models.ForeignKey("db.IssueType", related_name="project_issue_types", on_delete=models.CASCADE)
    level = models.PositiveIntegerField(default=0)
    is_default = models.BooleanField(default=False)

    class Meta:
        unique_together = ["project", "issue_type", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "issue_type"],
                condition=Q(deleted_at__isnull=True),
                name="project_issue_type_unique_project_issue_type_when_deleted_at_null",
            )
        ]
        verbose_name = "Project Issue Type"
        verbose_name_plural = "Project Issue Types"
        db_table = "project_issue_types"
        ordering = ("project", "issue_type")

    def __str__(self):
        return f"{self.project} - {self.issue_type}"
