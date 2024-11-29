# Python imports
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
    description = models.TextField(verbose_name="Cycle Description", blank=True)
    start_date = models.DateTimeField(verbose_name="Start Date", blank=True, null=True)
    end_date = models.DateTimeField(verbose_name="End Date", blank=True, null=True)
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
    TIMEZONE_CHOICES = tuple(zip(pytz.all_timezones, pytz.all_timezones))
    timezone = models.CharField(max_length=255, default="UTC", choices=TIMEZONE_CHOICES)
    version = models.IntegerField(default=1)

    class Meta:
        verbose_name = "Cycle"
        verbose_name_plural = "Cycles"
        db_table = "cycles"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        if self._state.adding:
            smallest_sort_order = Cycle.objects.filter(project=self.project).aggregate(
                smallest=models.Min("sort_order")
            )["smallest"]

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

    issue = models.ForeignKey(
        "db.Issue", on_delete=models.CASCADE, related_name="issue_cycle"
    )
    cycle = models.ForeignKey(
        Cycle, on_delete=models.CASCADE, related_name="issue_cycle"
    )

    class Meta:
        unique_together = ["issue", "cycle", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["cycle", "issue"],
                condition=models.Q(deleted_at__isnull=True),
                name="cycle_issue_when_deleted_at_null",
            )
        ]
        verbose_name = "Cycle Issue"
        verbose_name_plural = "Cycle Issues"
        db_table = "cycle_issues"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.cycle}"


class CycleUserProperties(ProjectBaseModel):
    cycle = models.ForeignKey(
        "db.Cycle", on_delete=models.CASCADE, related_name="cycle_user_properties"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cycle_user_properties",
    )
    filters = models.JSONField(default=get_default_filters)
    display_filters = models.JSONField(default=get_default_display_filters)
    display_properties = models.JSONField(default=get_default_display_properties)

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
