# Django imports
from django.db import models
from django.conf import settings

# Module imports
from plane.db.models import (
    ProjectBaseModel,
    Issue,
    BaseModel,
)


class IssueWorkLog(ProjectBaseModel):
    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="worklogs"
    )
    description = models.TextField(blank=True)
    logged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="worklogs",
    )
    duration = models.IntegerField(default=0)

    class Meta:
        verbose_name = "Issue Work Log"
        verbose_name_plural = "Issue Work Logs"
        db_table = "issue_worklogs"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.issue.name} {self.logged_by.email}"


class ActionTypeEnum(models.TextChoices):
    ADDED = "ADDED", "Added"
    UPDATED = "UPDATED", "Updated"
    REMOVED = "REMOVED", "Removed"


class EntityTypeEnum(models.TextChoices):
    CYCLE = "CYCLE", "Cycle"
    MODULE = "MODULE", "Module"
    PROJECT = "PROJECT", "Project"
    TEAM = "TEAM", "Team"


class EntityIssueStateActivity(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workspace_issue_state_progress",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.DO_NOTHING,
        related_name="project_issue_state_progress",
        null=True,
        blank=True,
    )
    module = models.ForeignKey(
        "db.Module",
        on_delete=models.DO_NOTHING,
        related_name="module_issue_state_progress",
        null=True,
        blank=True,
    )
    cycle = models.ForeignKey(
        "db.Cycle",
        on_delete=models.DO_NOTHING,
        related_name="cycle_issue_state_progress",
        null=True,
        blank=True,
    )
    team = models.ForeignKey(
        "db.Team",
        on_delete=models.DO_NOTHING,
        related_name="team_issue_state_progress",
        null=True,
        blank=True,
    )
    entity_type = models.CharField(
        max_length=30,
        choices=EntityTypeEnum.choices,
    )
    state = models.ForeignKey(
        "db.State",
        on_delete=models.DO_NOTHING,
        related_name="entity_issue_state_progress",
    )
    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.DO_NOTHING,
        related_name="issue_state_progress",
    )
    state_group = models.CharField(max_length=255)
    action = models.CharField(
        max_length=30,
        choices=ActionTypeEnum.choices,
    )
    estimate_point = models.ForeignKey(
        "db.EstimatePoint",
        on_delete=models.DO_NOTHING,
        related_name="issue_estimate_state_progress",
        null=True,
        blank=True,
    )
    estimate_value = models.FloatField(null=True, blank=True)

    class Meta:
        verbose_name = "Entity Issue State Activity"
        verbose_name_plural = "Entity Issue State Activities"
        db_table = "entity_issue_state_activities"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.entity_type} {self.issue.name}"


class EntityProgress(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workspace_progress",
    )
    cycle = models.ForeignKey(
        "db.Cycle",
        on_delete=models.DO_NOTHING,
        related_name="cycle_progress",
        null=True,
        blank=True,
    )
    module = models.ForeignKey(
        "db.Module",
        on_delete=models.DO_NOTHING,
        related_name="module_progress",
        null=True,
        blank=True,
    )
    team = models.ForeignKey(
        "db.Team",
        on_delete=models.DO_NOTHING,
        related_name="team_progress",
        null=True,
        blank=True,
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.DO_NOTHING,
        related_name="project_progress",
        null=True,
        blank=True,
    )
    entity_type = models.CharField(
        max_length=30,
        choices=EntityTypeEnum.choices,
    )

    progress_date = models.DateTimeField()
    data = models.JSONField(default=dict)

    total_issues = models.IntegerField(default=0)
    total_estimate_points = models.FloatField(default=0)

    # state group wise issue count
    backlog_issues = models.IntegerField(default=0)
    unstarted_issues = models.IntegerField(default=0)
    started_issues = models.IntegerField(default=0)
    completed_issues = models.IntegerField(default=0)
    cancelled_issues = models.IntegerField(default=0)

    # state group wise estimate count
    backlog_estimate_points = models.FloatField(default=0)
    unstarted_estimate_points = models.FloatField(default=0)
    started_estimate_points = models.FloatField(default=0)
    completed_estimate_points = models.FloatField(default=0)
    cancelled_estimate_points = models.FloatField(default=0)

    class Meta:
        verbose_name = "Entity Progress"
        verbose_name_plural = "Entity Progress"
        db_table = "entity_progress"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.progress_date} <{self.entity_type}>"


class UpdatesEnum(models.TextChoices):
    ONTRACK = "ONTRACK", "On Track"
    OFFTRACK = "OFFTRACK", "Off Track"
    AT_RISK = "AT_RISK", "At Risk"
    STARTED = "STARTED", "Started"
    ENDED = "ENDED", "Ended"
    SCOPE_INCREASED = "SCOPE_INCREASED", "Scope Increased"
    SCOPE_DECREASED = "SCOPE_DECREASED", "Scope Decreased"


class EntityUpdates(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workspace_updates",
    )
    cycle = models.ForeignKey(
        "db.Cycle",
        on_delete=models.DO_NOTHING,
        related_name="cycle_updates",
        null=True,
        blank=True,
    )
    module = models.ForeignKey(
        "db.Module",
        on_delete=models.DO_NOTHING,
        related_name="module_updates",
        null=True,
        blank=True,
    )
    team = models.ForeignKey(
        "db.Team",
        on_delete=models.DO_NOTHING,
        related_name="team_updates",
        null=True,
        blank=True,
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.DO_NOTHING,
        related_name="project_updates",
        null=True,
        blank=True,
    )
    entity_type = models.CharField(
        max_length=30,
        choices=EntityTypeEnum.choices,
    )
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=30,
        choices=UpdatesEnum.choices,
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="parent_updates",
        null=True,
        blank=True,
    )
    completed_issues = models.IntegerField(default=0)
    total_issues = models.IntegerField(default=0)
    total_estimate_points = models.FloatField(default=0)
    completed_estimate_points = models.FloatField(default=0)
    scope_change = models.FloatField(default=0)

    class Meta:
        verbose_name = "Entity Updates"
        verbose_name_plural = "Entity Updates"
        db_table = "entity_updates"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.entity_type} {self.status}"


class UpdateReaction(ProjectBaseModel):
    update = models.ForeignKey(
        "ee.EntityUpdates",
        on_delete=models.CASCADE,
        related_name="update_reactions",
    )
    reaction = models.CharField(max_length=20)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="actor_update_reactions",
    )

    class Meta:
        unique_together = ["actor", "reaction", "update"]
        verbose_name = "Update Reaction"
        verbose_name_plural = "Update Reactions"
        db_table = "update_reactions"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.actor.email} <{self.reaction}> <{self.entity_type}>"
