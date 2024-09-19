# Python Imports
import pytz

# Django imports
from django.conf import settings
from django.db import models

# Module imports
from .project import ProjectBaseModel


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
        "sub_issue": True,
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
        "labels": True,
        "link": True,
        "priority": True,
        "start_date": True,
        "state": True,
        "sub_issue_count": True,
        "updated_on": True,
    }


class Cycle(ProjectBaseModel):
    name = models.CharField(max_length=255, verbose_name="Cycle Name")
    description = models.TextField(
        verbose_name="Cycle Description", blank=True
    )
    start_date = models.DateTimeField(
        verbose_name="Start Date", blank=True, null=True
    )
    end_date = models.DateTimeField(
        verbose_name="End Date", blank=True, null=True
    )
    owned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_by_cycle",
    )
    view_props = models.JSONField(default=dict)
    sort_order = models.FloatField(default=65535)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)
    progress_snapshot = models.JSONField(default=dict)
    archived_at = models.DateTimeField(null=True)
    logo_props = models.JSONField(default=dict)
    # timezone
    USER_TIMEZONE_CHOICES = tuple(zip(pytz.all_timezones, pytz.all_timezones))
    user_timezone = models.CharField(
        max_length=255, default="UTC", choices=USER_TIMEZONE_CHOICES
    )

    class Meta:
        verbose_name = "Cycle"
        verbose_name_plural = "Cycles"
        db_table = "cycles"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        if self._state.adding:
            smallest_sort_order = Cycle.objects.filter(
                project=self.project
            ).aggregate(smallest=models.Min("sort_order"))["smallest"]

            if smallest_sort_order is not None:
                self.sort_order = smallest_sort_order - 10000

        super(Cycle, self).save(*args, **kwargs)

    def __str__(self):
        """Return name of the cycle"""
        return f"{self.name} <{self.project.name}>"


class CycleIssue(ProjectBaseModel):
    """
    Cycle Issues
    """

    issue = models.OneToOneField(
        "db.Issue", on_delete=models.CASCADE, related_name="issue_cycle"
    )
    cycle = models.ForeignKey(
        Cycle, on_delete=models.CASCADE, related_name="issue_cycle"
    )

    class Meta:
        verbose_name = "Cycle Issue"
        verbose_name_plural = "Cycle Issues"
        db_table = "cycle_issues"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.cycle}"


# DEPRECATED TODO: - Remove in next release
class CycleFavorite(ProjectBaseModel):
    """_summary_
    CycleFavorite (model): To store all the cycle favorite of the user
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cycle_favorites",
    )
    cycle = models.ForeignKey(
        "db.Cycle", on_delete=models.CASCADE, related_name="cycle_favorites"
    )

    class Meta:
        unique_together = ["cycle", "user"]
        verbose_name = "Cycle Favorite"
        verbose_name_plural = "Cycle Favorites"
        db_table = "cycle_favorites"
        ordering = ("-created_at",)

    def __str__(self):
        """Return user and the cycle"""
        return f"{self.user.email} <{self.cycle.name}>"


class CycleUserProperties(ProjectBaseModel):
    cycle = models.ForeignKey(
        "db.Cycle",
        on_delete=models.CASCADE,
        related_name="cycle_user_properties",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cycle_user_properties",
    )
    filters = models.JSONField(default=get_default_filters)
    display_filters = models.JSONField(default=get_default_display_filters)
    display_properties = models.JSONField(
        default=get_default_display_properties
    )

    class Meta:
        unique_together = ["cycle", "user", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["cycle", "user"],
                condition=models.Q(deleted_at__isnull=True),
                name="cycle_user_properties_unique_cycle_user_when_deleted_at_null",
            )
        ]
        verbose_name = "Cycle User Property"
        verbose_name_plural = "Cycle User Properties"
        db_table = "cycle_user_properties"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.cycle.name} {self.user.email}"


class TypeEnum(models.TextChoices):
    ADDED = "ADDED", "Added"
    UPDATED = "UPDATED", "Updated"
    REMOVED = "REMOVED", "Removed"
    # TRANSFER = "TRANSFER", "Transfer"


class CycleIssueStateProgress(ProjectBaseModel):
    cycle = models.ForeignKey(
        "db.Cycle",
        on_delete=models.DO_NOTHING,
        related_name="cycle_issue_state_progress",
    )
    state = models.ForeignKey(
        "db.State",
        on_delete=models.DO_NOTHING,
        related_name="cycle_issue_state_progress",
    )
    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.DO_NOTHING,
        related_name="cycle_issue_state_progress",
    )
    state_group = models.CharField(max_length=255)
    type = models.CharField(
        max_length=30,
        choices=TypeEnum.choices,
    )
    estimate_id = models.UUIDField(null=True)
    estimate_value = models.FloatField(null=True)


    class Meta:
        verbose_name = "Cycle Issue State Progress"
        verbose_name_plural = "Cycle Issue State Progress"
        db_table = "cycle_issue_state_progress"
        ordering = ("-created_at",)
    
    def __str__(self):
        return f"{self.cycle.name} {self.issue.name}"


class CycleAnalytics(ProjectBaseModel):
    cycle = models.ForeignKey(
        "db.Cycle", on_delete=models.CASCADE, related_name="cycle_analytics"
    )
    date = models.DateField()
    data = models.JSONField(default=dict)

    total_issues = models.FloatField(default=0)
    total_estimate_points = models.FloatField(default=0)

    # state group wise distribution
    backlog_issues = models.FloatField(default=0)
    unstarted_issues = models.FloatField(default=0)
    started_issues = models.FloatField(default=0)
    completed_issues = models.FloatField(default=0)
    cancelled_issues = models.FloatField(default=0)

    backlog_estimate_points = models.FloatField(default=0)
    unstarted_estimate_points = models.FloatField(default=0)
    started_estimate_points = models.FloatField(default=0)
    completed_estimate_points = models.FloatField(default=0)
    cancelled_estimate_points = models.FloatField(default=0)

    class Meta:
        unique_together = ["cycle", "date"]
        verbose_name = "Cycle Analytics"
        verbose_name_plural = "Cycle Analytics"
        db_table = "cycle_analytics"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.user.email} <{self.cycle.name}>"


class UpdatesEnum(models.TextChoices):
    ONTRACK = "ONTRACK", "On Track"
    OFFTRACK = "OFFTRACK", "Off Track"
    AT_RISK = "AT_RISK", "At Risk"
    STARTED = "STARTED", "Started"
    SCOPE_INCREASED = "SCOPE_INCREASED", "Scope Increased"
    SCOPE_DECREASED = "SCOPE_DECREASED", "Scope Decreased"


class CycleUpdates(ProjectBaseModel):
    cycle = models.ForeignKey(
        "db.Cycle", on_delete=models.CASCADE, related_name="cycle_updates"
    )
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=30,
        choices=UpdatesEnum.choices,
    )
    parent = models.ForeignKey(
        "db.CycleUpdates",
        on_delete=models.CASCADE,
        related_name="cycle_updates",
        null=True,
        blank=True,
    )
    completed_issues = models.FloatField(default=0)
    total_issues = models.FloatField(default=0)
    total_estimate_points = models.FloatField(default=0)
    completed_estimate_points = models.FloatField(default=0)

    class Meta:
        verbose_name = "Cycle Updates"
        verbose_name_plural = "Cycle Updates"
        db_table = "cycle_updates"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.cycle.name} {self.status}"


class CycleUpdateReaction(ProjectBaseModel):
    cycle = models.ForeignKey(
        "db.Cycle",
        on_delete=models.CASCADE,
        related_name="cycle_update_reactions",
    )
    update = models.ForeignKey(
        "db.CycleUpdates",
        on_delete=models.CASCADE,
        related_name="cycle_update_reactions",
    )
    reaction = models.CharField(max_length=20)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cycle_update_reactions",
    )

    class Meta:
        verbose_name = "Cycle Update Reaction"
        verbose_name_plural = "Cycle Update Reactions"
        db_table = "cycle_update_reactions"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.actor.email} <{self.cycle.name}>"
