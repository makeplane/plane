# Django imports
from django.conf import settings
from django.db import models

# Module import
from .base import BaseModel
from .project import ProjectBaseModel
from .workspace import WorkspaceBaseModel
from plane.utils.issue_filters import issue_filters


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

# DEPRECATED TODO: - Remove in next release
class GlobalView(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="global_views"
    )
    name = models.CharField(max_length=255, verbose_name="View Name")
    description = models.TextField(verbose_name="View Description", blank=True)
    query = models.JSONField(verbose_name="View Query")
    access = models.PositiveSmallIntegerField(
        default=1, choices=((0, "Private"), (1, "Public"))
    )
    query_data = models.JSONField(default=dict)
    sort_order = models.FloatField(default=65535)
    logo_props = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Global View"
        verbose_name_plural = "Global Views"
        db_table = "global_views"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        if self._state.adding:
            largest_sort_order = GlobalView.objects.filter(
                workspace=self.workspace
            ).aggregate(largest=models.Max("sort_order"))["largest"]
            if largest_sort_order is not None:
                self.sort_order = largest_sort_order + 10000

        super(GlobalView, self).save(*args, **kwargs)

    def __str__(self):
        """Return name of the View"""
        return f"{self.name} <{self.workspace.name}>"


class IssueView(WorkspaceBaseModel):
    name = models.CharField(max_length=255, verbose_name="View Name")
    description = models.TextField(verbose_name="View Description", blank=True)
    query = models.JSONField(verbose_name="View Query")
    filters = models.JSONField(default=dict)
    display_filters = models.JSONField(default=get_default_display_filters)
    display_properties = models.JSONField(
        default=get_default_display_properties
    )
    access = models.PositiveSmallIntegerField(
        default=1, choices=((0, "Private"), (1, "Public"))
    )
    sort_order = models.FloatField(default=65535)
    logo_props = models.JSONField(default=dict)
    owned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="views",
    )
    is_locked = models.BooleanField(default=False)


    class Meta:
        verbose_name = "Issue View"
        verbose_name_plural = "Issue Views"
        db_table = "issue_views"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        query_params = self.filters
        self.query = (
            issue_filters(query_params, "POST") if query_params else {}
        )

        if self._state.adding:
            if self.project:
                largest_sort_order = IssueView.objects.filter(
                    project=self.project
                ).aggregate(largest=models.Max("sort_order"))["largest"]
            else:
                largest_sort_order = IssueView.objects.filter(
                    workspace=self.workspace, project__isnull=True
                ).aggregate(largest=models.Max("sort_order"))["largest"]
            if largest_sort_order is not None:
                self.sort_order = largest_sort_order + 10000

        super(IssueView, self).save(*args, **kwargs)

    def __str__(self):
        """Return name of the View"""
        return f"{self.name} <{self.project.name}>"


# DEPRECATED TODO: - Remove in next release
class IssueViewFavorite(ProjectBaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_view_favorites",
    )
    view = models.ForeignKey(
        "db.IssueView", on_delete=models.CASCADE, related_name="view_favorites"
    )

    class Meta:
        unique_together = ["view", "user"]
        verbose_name = "View Favorite"
        verbose_name_plural = "View Favorites"
        db_table = "view_favorites"
        ordering = ("-created_at",)

    def __str__(self):
        """Return user and the view"""
        return f"{self.user.email} <{self.view.name}>"
