# Django imports
from django.db import models
from django.conf import settings

# Module imports
from . import ProjectBaseModel


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

    class Meta:
        unique_together = ["name", "project"]
        verbose_name = "Module"
        verbose_name_plural = "Modules"
        db_table = "module"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.name} {self.start_date} {self.target_date}"


class ModuleMember(ProjectBaseModel):

    module = models.ForeignKey("db.Module", on_delete=models.CASCADE)
    member = models.ForeignKey("db.User", on_delete=models.CASCADE)

    class Meta:
        unique_together = ["module", "member"]
        verbose_name = "Module Member"
        verbose_name_plural = "Module Members"
        db_table = "module_member"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.module.name} {self.member}"


class ModuleIssue(ProjectBaseModel):

    module = models.ForeignKey(
        "db.Module", on_delete=models.CASCADE, related_name="module_issues"
    )
    issue = models.ForeignKey(
        "db.Issue", on_delete=models.CASCADE, related_name="module_issues"
    )

    class Meta:
        unique_together = ["module", "issue"]
        verbose_name = "Module Issue"
        verbose_name_plural = "Module Issues"
        db_table = "module_issues"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.module.name} {self.issue.name}"
