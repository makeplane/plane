# Django imports
from django.db import models

# Module imports
from plane.db.models.workspace import WorkspaceBaseModel


class Template(WorkspaceBaseModel):
    class TemplateType(models.TextChoices):
        WORKITEM = "workitem", "Workitem"

    name = models.CharField(max_length=255)
    description = models.JSONField(blank=True, default=dict)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    description_binary = models.BinaryField(null=True)

    template_type = models.CharField(
        max_length=30, verbose_name="Template Type", default=TemplateType.WORKITEM
    )
    is_published = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    categories = models.JSONField(default=dict)
    company_name = models.CharField(max_length=255, blank=True)
    supported_languages = models.JSONField(default=dict)
    support = models.JSONField(default=dict)
    resources = models.JSONField(default=dict)

    class Meta:
        db_table = "templates"
        verbose_name = "Template"
        verbose_name_plural = "Templates"
        ordering = ("-created_at",)


class WorkitemTemplate(WorkspaceBaseModel):
    class PriorityChoices(models.TextChoices):
        URGENT = "urgent", "Urgent"
        HIGH = "high", "High"
        MEDIUM = "medium", "Medium"
        LOW = "low", "Low"
        NONE = "none", "None"

    template = models.ForeignKey(
        Template, on_delete=models.CASCADE, related_name="workitem_templates"
    )
    # basic info fields
    name = models.CharField(max_length=255)
    description = models.JSONField(blank=True, default=dict)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    description_binary = models.BinaryField(null=True)
    priority = models.CharField(
        max_length=30,
        choices=PriorityChoices.choices,
        verbose_name="Issue Priority",
        default=PriorityChoices.NONE,
    )
    parent = models.JSONField(default=dict)
    state = models.JSONField(default=dict)
    assignees = models.JSONField(default=dict)
    labels = models.JSONField(default=dict)
    type = models.JSONField(default=dict)
    modules = models.JSONField(default=dict)
    properties = models.JSONField(default=dict)

    class Meta:
        db_table = "workitem_templates"
        verbose_name = "Workitem Template"
        verbose_name_plural = "Workitem Templates"
        ordering = ("-created_at",)
