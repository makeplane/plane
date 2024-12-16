# Django imports
from django.conf import settings
from django.db import models
from django.db.models import Q

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


class Module(ProjectBaseModel):
    name = models.CharField(max_length=255, verbose_name="Module Name")
    description = models.TextField(verbose_name="Module Description", blank=True)
    description_text = models.JSONField(
        verbose_name="Module Description RT", blank=True, null=True
    )
    description_html = models.JSONField(
        verbose_name="Module Description HTML", blank=True, null=True
    )
    start_date = models.DateField(null=True)
    target_date = models.DateField(null=True)
    status = models.CharField(
        choices=(
            ("backlog", "Backlog"),
            ("planned", "Planned"),
            ("in-progress", "In Progress"),
            ("paused", "Paused"),
            ("completed", "Completed"),
            ("cancelled", "Cancelled"),
        ),
        default="planned",
        max_length=20,
    )
    lead = models.ForeignKey(
        "db.User", on_delete=models.SET_NULL, related_name="module_leads", null=True
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="module_members",
        through="ModuleMember",
        through_fields=("module", "member"),
    )
    view_props = models.JSONField(default=dict)
    sort_order = models.FloatField(default=65535)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)
    archived_at = models.DateTimeField(null=True)
    logo_props = models.JSONField(default=dict)

    class Meta:
        unique_together = ["name", "project", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "project"],
                condition=Q(deleted_at__isnull=True),
                name="module_unique_name_project_when_deleted_at_null",
            )
        ]
        verbose_name = "Module"
        verbose_name_plural = "Modules"
        db_table = "modules"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        if self._state.adding:
            smallest_sort_order = Module.objects.filter(project=self.project).aggregate(
                smallest=models.Min("sort_order")
            )["smallest"]

            if smallest_sort_order is not None:
                self.sort_order = smallest_sort_order - 10000

        super(Module, self).save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} {self.start_date} {self.target_date}"


class ModuleMember(ProjectBaseModel):
    module = models.ForeignKey("db.Module", on_delete=models.CASCADE)
    member = models.ForeignKey("db.User", on_delete=models.CASCADE)

    class Meta:
        unique_together = ["module", "member", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["module", "member"],
                condition=models.Q(deleted_at__isnull=True),
                name="module_member_unique_module_member_when_deleted_at_null",
            )
        ]
        verbose_name = "Module Member"
        verbose_name_plural = "Module Members"
        db_table = "module_members"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.module.name} {self.member}"


class ModuleIssue(ProjectBaseModel):
    module = models.ForeignKey(
        "db.Module", on_delete=models.CASCADE, related_name="issue_module"
    )
    issue = models.ForeignKey(
        "db.Issue", on_delete=models.CASCADE, related_name="issue_module"
    )

    class Meta:
        unique_together = ["issue", "module", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "module"],
                condition=models.Q(deleted_at__isnull=True),
                name="module_issue_unique_issue_module_when_deleted_at_null",
            )
        ]
        verbose_name = "Module Issue"
        verbose_name_plural = "Module Issues"
        db_table = "module_issues"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.module.name} {self.issue.name}"


class ModuleLink(ProjectBaseModel):
    title = models.CharField(max_length=255, blank=True, null=True)
    url = models.URLField()
    module = models.ForeignKey(
        Module, on_delete=models.CASCADE, related_name="link_module"
    )
    metadata = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Module Link"
        verbose_name_plural = "Module Links"
        db_table = "module_links"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.module.name} {self.url}"


class ModuleUserProperties(ProjectBaseModel):
    module = models.ForeignKey(
        "db.Module", on_delete=models.CASCADE, related_name="module_user_properties"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="module_user_properties",
    )
    filters = models.JSONField(default=get_default_filters)
    display_filters = models.JSONField(default=get_default_display_filters)
    display_properties = models.JSONField(default=get_default_display_properties)

    class Meta:
        unique_together = ["module", "user", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["module", "user"],
                condition=models.Q(deleted_at__isnull=True),
                name="module_user_properties_unique_module_user_when_deleted_at_null",
            )
        ]
        verbose_name = "Module User Property"
        verbose_name_plural = "Module User Property"
        db_table = "module_user_properties"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.module.name} {self.user.email}"
