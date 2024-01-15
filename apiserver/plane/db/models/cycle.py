# Django imports
from django.db import models
from django.conf import settings

# Module imports
from . import ProjectBaseModel


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
    start_date = models.DateField(
        verbose_name="Start Date", blank=True, null=True
    )
    end_date = models.DateField(verbose_name="End Date", blank=True, null=True)
    owned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_by_cycle",
    )
    view_props = models.JSONField(default=dict)
    sort_order = models.FloatField(default=65535)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

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
        unique_together = ["cycle", "user"]
        verbose_name = "Cycle User Property"
        verbose_name_plural = "Cycle User Properties"
        db_table = "cycle_user_properties"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.cycle.name} {self.user.email}"
