# Python imports
from uuid import UUID

# Django imports
from django.db import models
from django.db.models import Q

# Module imports
from .project import ProjectBaseModel
from .base import BaseModel
from plane.db.mixins import SoftDeletionQuerySet, SoftDeletionManager


class IssueTypeQuerySet(SoftDeletionQuerySet):
    """QuerySet for project related models that handles accessibility"""

    def accessible_to(self, user_id: UUID, slug: str):
        from plane.ee.models import TeamspaceProject, TeamspaceMember
        from plane.payment.flags.flag_decorator import check_workspace_feature_flag
        from plane.payment.flags.flag import FeatureFlag

        base_query = Q(
            project_issue_types__project__project_projectmember__member_id=user_id,
            project_issue_types__project__project_projectmember__is_active=True,
        )

        if check_workspace_feature_flag(
            feature_key=FeatureFlag.TEAMSPACES, user_id=user_id, slug=slug
        ):
            ## Get all team ids where the user is a member
            teamspace_ids = TeamspaceMember.objects.filter(
                member_id=user_id, workspace__slug=slug
            ).values_list("team_space_id", flat=True)

            # Get all the projects in the respective teamspaces
            teamspace_project_ids = TeamspaceProject.objects.filter(
                team_space_id__in=teamspace_ids
            ).values_list("project_id", flat=True)

            return self.filter(
                Q(project_issue_types__project_id__in=teamspace_project_ids)
                | Q(base_query),
            )

        return self.filter(base_query)


class IssueTypeManager(SoftDeletionManager):
    """Manager for project related models that handles accessibility"""

    def get_queryset(self):
        return IssueTypeQuerySet(self.model, using=self._db).filter(
            deleted_at__isnull=True
        )

    def accessible_to(self, user_id: UUID, slug: str):
        return self.get_queryset().accessible_to(user_id, slug)


class IssueType(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", related_name="issue_types", on_delete=models.CASCADE
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    logo_props = models.JSONField(default=dict)
    is_epic = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    level = models.FloatField(default=0)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    objects = IssueTypeManager()

    class Meta:
        verbose_name = "Issue Type"
        verbose_name_plural = "Issue Types"
        db_table = "issue_types"

    def __str__(self):
        return self.name


class ProjectIssueType(ProjectBaseModel):
    issue_type = models.ForeignKey(
        "db.IssueType", related_name="project_issue_types", on_delete=models.CASCADE
    )
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
