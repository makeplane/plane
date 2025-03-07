# Python imports
from datetime import datetime

# Django imports
from django.db import models

# Third party imports
from pydantic import BaseModel, Field, UUID4, HttpUrl, EmailStr, field_validator
from typing import Optional, Dict, List, Union

# Module imports
from plane.db.models.workspace import WorkspaceBaseModel
from plane.utils.html_processor import strip_tags


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

    def save(self, *args, **kwargs):
        # Strip the html tags using html parser
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )
        super(Template, self).save(*args, **kwargs)


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


class Type(BaseModel):
    id: UUID4
    name: str = Field(..., max_length=255)
    logo_props: dict
    is_epic: bool

    @field_validator("name")
    def validate_name(cls, v):
        if len(v) > 255:
            raise ValueError("Name too long")
        return v


class Parent(BaseModel):
    id: UUID4
    project_id: UUID4
    project_identifier: str
    sequence_id: int
    type: Union[Type, Dict]
    
    @field_validator('type')
    def validate_type(cls, v):
        if isinstance(v, dict) and v != {}:
            # If it's a dict but not empty, try to parse it as Type
            # This will raise validation errors if it doesn't match Type
            try:
                Type(**v)
            except Exception:
                raise ValueError("If 'type' is a dictionary, it must either be empty or conform to Type model")
        return v

class State(BaseModel):
    id: UUID4
    name: str = Field(..., max_length=255)
    group: str

    @field_validator("group")
    def validate_group(cls, group: str) -> str:
        valid_groups = {
            "backlog",
            "unstarted",
            "started",
            "completed",
            "cancelled",
            "triage",
        }
        if group not in valid_groups:
            raise ValueError("Invalid group")
        return group


class Assignee(BaseModel):
    id: UUID4


class Label(BaseModel):
    id: UUID4
    name: str = Field(..., max_length=255)


class Module(BaseModel):
    id: UUID4
    name: str = Field(..., max_length=255)


class IssuePropertyOption(BaseModel):
    id: UUID4
    name: str = Field(..., max_length=255)
    is_active: bool = True
    is_default: bool = False


class IssueProperty(BaseModel):
    id: UUID4
    name: str = Field(..., max_length=255)
    display_name: str = Field(..., max_length=255)
    property_type: str
    relation_type: Optional[str] = None
    logo_props: Dict
    is_required: bool = False
    settings: Dict
    is_active: bool = True
    type: Type
    is_multi: bool = False
    options: List[IssuePropertyOption] = []
    values: List[str] = []

    @staticmethod
    def validate_datetime(value: str) -> bool:
        for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S"):
            try:
                datetime.strptime(value, fmt)
                return True
            except ValueError:
                continue
        return False

    @staticmethod
    def validate_decimal(value: str) -> bool:
        try:
            float(value)
            return True
        except ValueError:
            return False

    @staticmethod
    def validate_url(value: str) -> bool:
        try:
            HttpUrl(value)
            return True
        except ValueError:
            return False

    @staticmethod
    def validate_email_value(value: str) -> bool:
        try:
            EmailStr(value)
            return True
        except ValueError:
            return False
