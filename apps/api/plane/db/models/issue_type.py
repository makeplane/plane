# Django imports
from django.db import models
from django.db.models import Q

# Module imports
from .project import ProjectBaseModel
from .base import BaseModel


class IssueType(BaseModel):
    workspace = models.ForeignKey("db.Workspace", related_name="issue_types", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    logo_props = models.JSONField(default=dict)
    is_epic = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    level = models.FloatField(default=0)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "Issue Type"
        verbose_name_plural = "Issue Types"
        db_table = "issue_types"

    def __str__(self):
        return self.name


class ProjectIssueType(ProjectBaseModel):
    issue_type = models.ForeignKey("db.IssueType", related_name="project_issue_types", on_delete=models.CASCADE)
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


class IssueTypeProperty(ProjectBaseModel):
    """Issue Type Property Model - 定义Issue Type的动态字段"""
    
    PROPERTY_TYPE_CHOICES = (
        ("TEXT", "Text"),
        ("NUMBER", "Number"),
        ("DATE", "Date"),
        ("DATETIME", "DateTime"),
        ("SELECT", "Select"),
        ("MULTI_SELECT", "Multi Select"),
        ("BOOLEAN", "Boolean"),
        ("URL", "URL"),
        ("EMAIL", "Email"),
    )
    
    RELATION_TYPE_CHOICES = (
        ("ONE_TO_ONE", "One to One"),
        ("ONE_TO_MANY", "One to Many"),
        ("MANY_TO_MANY", "Many to Many"),
    )
    
    issue_type = models.ForeignKey(
        "db.IssueType", 
        related_name="properties", 
        on_delete=models.CASCADE
    )
    display_name = models.CharField(max_length=255)
    property_type = models.CharField(
        max_length=20, 
        choices=PROPERTY_TYPE_CHOICES,
        default="TEXT"
    )
    relation_type = models.CharField(
        max_length=20, 
        choices=RELATION_TYPE_CHOICES,
        null=True, 
        blank=True
    )
    is_multi = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_required = models.BooleanField(default=False)
    logo_props = models.JSONField(default=dict)
    default_value = models.JSONField(default=list)
    settings = models.JSONField(default=dict)  # 存储display_format等设置
    options = models.JSONField(default=list)   # 存储选项数据
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ["project", "issue_type", "display_name", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "issue_type", "display_name"],
                condition=Q(deleted_at__isnull=True),
                name="issue_type_property_unique_project_issue_type_display_name_when_deleted_at_null",
            )
        ]
        verbose_name = "Issue Type Property"
        verbose_name_plural = "Issue Type Properties"
        db_table = "issue_type_properties"
        ordering = ("sort_order", "created_at")

    def __str__(self):
        return f"{self.issue_type.name} - {self.display_name}"


class IssuePropertyValue(ProjectBaseModel):
    """Issue Property Value Model - 存储Issue的动态字段值"""
    
    issue = models.ForeignKey(
        "db.Issue", 
        related_name="property_values", 
        on_delete=models.CASCADE
    )
    property = models.ForeignKey(
        IssueTypeProperty, 
        related_name="values", 
        on_delete=models.CASCADE
    )
    value = models.JSONField(default=list)  # 存储字段值，支持多种数据类型

    class Meta:
        unique_together = ["issue", "property", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "property"],
                condition=Q(deleted_at__isnull=True),
                name="issue_property_value_unique_issue_property_when_deleted_at_null",
            )
        ]
        verbose_name = "Issue Property Value"
        verbose_name_plural = "Issue Property Values"
        db_table = "issue_property_values"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.issue.name} - {self.property.display_name}"
