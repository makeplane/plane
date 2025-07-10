# Django imports
from django.db import models
from django.conf import settings

# Module imports
from plane.db.models import ProjectBaseModel, Issue, BaseModel, Page


def get_default_properties():
    return {
        "assignee": True,
        "start_date": True,
        "due_date": True,
        "labels": True,
        "key": True,
        "priority": True,
        "state": True,
        "sub_issue_count": True,
        "link": True,
        "attachment_count": True,
        "estimate": True,
        "created_on": True,
        "updated_on": True,
    }


def get_default_filters():
    return {
        "priority": None,
        "state": None,
        "state_group": None,
        "assignees": None,
        "created_by": None,
        "labels": None,
        "start_date": None,
        "target_date": None,
        "subscriber": None,
    }


def get_default_display_filters():
    return {
        "group_by": None,
        "order_by": "-created_at",
        "type": None,
        "sub_issue": False,
        "show_empty_groups": True,
        "layout": "list",
        "calendar_date_range": "",
    }


def get_default_display_properties():
    return {
        "assignee": True,
        "attachment_count": True,
        "created_on": True,
        "due_date": True,
        "estimate": True,
        "key": True,
        "issue_type": True,
        "labels": True,
        "link": True,
        "priority": True,
        "start_date": True,
        "state": True,
        "sub_issue_count": True,
        "updated_on": True,
    }


class IssueWorkLog(ProjectBaseModel):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name="worklogs")
    description = models.TextField(blank=True)
    logged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="worklogs"
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
    EPIC = "EPIC", "Epic"


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
    entity_type = models.CharField(max_length=30, choices=EntityTypeEnum.choices)
    state = models.ForeignKey(
        "db.State",
        on_delete=models.DO_NOTHING,
        related_name="entity_issue_state_progress",
    )
    issue = models.ForeignKey(
        "db.Issue", on_delete=models.DO_NOTHING, related_name="issue_state_progress"
    )
    state_group = models.CharField(max_length=255)
    action = models.CharField(max_length=30, choices=ActionTypeEnum.choices)
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
        "db.Workspace", on_delete=models.CASCADE, related_name="workspace_progress"
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
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.DO_NOTHING,
        related_name="project_progress",
        null=True,
        blank=True,
    )
    entity_type = models.CharField(max_length=30, choices=EntityTypeEnum.choices)

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


class EntityUpdates(BaseModel):
    class UpdatesEnum(models.TextChoices):
        ON_TRACK = "ON-TRACK", "On Track"
        OFF_TRACK = "OFF-TRACK", "Off Track"
        AT_RISK = "AT-RISK", "At Risk"
        STARTED = "STARTED", "Started"
        ENDED = "ENDED", "Ended"
        SCOPE_INCREASED = "SCOPE_INCREASED", "Scope Increased"
        SCOPE_DECREASED = "SCOPE_DECREASED", "Scope Decreased"

    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="workspace_updates"
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
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.DO_NOTHING,
        related_name="project_updates",
        null=True,
        blank=True,
    )
    epic = models.ForeignKey(
        "db.Issue",
        on_delete=models.DO_NOTHING,
        related_name="epic_updates",
        null=True,
        blank=True,
    )
    entity_type = models.CharField(max_length=30, choices=EntityTypeEnum.choices)
    description = models.TextField(blank=True)
    description_html = models.TextField(blank=True, default="<p></p>")
    status = models.CharField(max_length=30)
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
    metadata = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Entity Updates"
        verbose_name_plural = "Entity Updates"
        db_table = "entity_updates"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.entity_type} {self.status}"


class UpdateReaction(ProjectBaseModel):
    update = models.ForeignKey(
        "ee.EntityUpdates", on_delete=models.CASCADE, related_name="update_reactions"
    )
    reaction = models.CharField(max_length=20)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="actor_update_reactions",
    )

    class Meta:
        unique_together = ["actor", "reaction", "update", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["actor", "reaction", "update"],
                condition=models.Q(deleted_at__isnull=True),
                name="update_reaction_unique_update_actor_reaction_when_deleted_at_null",
            )
        ]
        verbose_name = "Update Reaction"
        verbose_name_plural = "Update Reactions"
        db_table = "update_reactions"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.actor.email} <{self.reaction}> <{self.entity_type}>"


class EpicUserProperties(ProjectBaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="epic_property_user",
    )
    filters = models.JSONField(default=get_default_filters)
    display_filters = models.JSONField(default=get_default_display_filters)
    display_properties = models.JSONField(default=get_default_display_properties)

    class Meta:
        verbose_name = "Epic User Property"
        verbose_name_plural = "Epic User Properties"
        db_table = "epic_user_properties"
        ordering = ("-created_at",)
        unique_together = ["user", "project", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "project"],
                condition=models.Q(deleted_at__isnull=True),
                name="epic_user_property_unique_user_project_when_deleted_at_null",
            )
        ]

    def __str__(self):
        """Return properties status of the epic"""
        return str(self.user)


class WorkItemPage(ProjectBaseModel):
    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="workitem_pages"
    )
    page = models.ForeignKey(
        Page, on_delete=models.CASCADE, related_name="workitem_pages"
    )

    class Meta:
        verbose_name = "Work Item Page"
        verbose_name_plural = "Work Item Pages"
        db_table = "workitem_pages"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.issue.name} {self.page.name}"
