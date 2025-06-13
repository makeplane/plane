# Python imports
from datetime import datetime
import pytz

# Django imports
from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator

# Third party imports
from pydantic import BaseModel as PydanticBaseModel, Field, UUID4, field_validator
from typing import Optional, Dict, List, Union

# Module imports
from plane.db.models import WorkspaceBaseModel, BaseModel
from plane.utils.html_processor import strip_tags


class Template(WorkspaceBaseModel):
    class TemplateType(models.TextChoices):
        WORKITEM = "workitem", "Workitem"
        PAGE = "page", "Page"
        PROJECT = "project", "Project"

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
    categories = models.ManyToManyField(
        "ee.TemplateCategory",
        related_name="templates",
        blank=True,
    )
    company_name = models.CharField(max_length=255, blank=True)
    supported_languages = models.JSONField(default=dict)
    support = models.JSONField(default=dict)
    resources = models.JSONField(default=dict)
    attachments = models.ManyToManyField(
        "db.FileAsset",
        related_name="templates",
        through="ee.TemplateAttachment",
        blank=True,
    )
    cover_image_asset = models.ForeignKey(
        "db.FileAsset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cover_image_templates",
    )
    short_description = models.TextField(blank=True, null=True)
    privacy_policy_url = models.URLField(max_length=800, null=True, blank=True)
    terms_of_service_url = models.URLField(max_length=800, null=True, blank=True)
    contact_email = models.EmailField(max_length=255, null=True, blank=True)
    support_url = models.URLField(max_length=800, null=True, blank=True)
    video_url = models.URLField(max_length=800, null=True, blank=True)
    keywords = models.JSONField(default=list)
    website = models.URLField(max_length=800, null=True, blank=True)

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

    @property
    def cover_image_url(self):
        # Return cover image url
        if self.cover_image_asset:
            return self.cover_image_asset.asset_url

        return None


class TemplateAttachment(BaseModel):
    template = models.ForeignKey(
        "ee.Template",
        on_delete=models.CASCADE,
        related_name="template_attachments",
    )
    file_asset = models.ForeignKey(
        "db.FileAsset",
        on_delete=models.CASCADE,
        related_name="template_attachments",
    )

    class Meta:
        db_table = "template_attachments"
        verbose_name = "Template Attachment"
        verbose_name_plural = "Template Attachments"
        ordering = ("-created_at",)


class TemplateCategory(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    logo_props = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "template_categories"
        verbose_name = "Template Category"
        verbose_name_plural = "Template Categories"
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


class Type(PydanticBaseModel):
    id: UUID4
    name: str = Field(..., max_length=255)
    description: Optional[str] = Field("")
    logo_props: dict
    is_epic: bool

    @field_validator("name")
    def validate_name(cls, v):
        if len(v) > 255:
            raise ValueError("Name too long")
        return v


class Parent(PydanticBaseModel):
    id: UUID4
    project_id: UUID4
    project_identifier: str
    sequence_id: int
    type: Union[Type, Dict]

    @field_validator("type")
    def validate_type(cls, v):
        if isinstance(v, dict) and v != {}:
            # If it's a dict but not empty, try to parse it as Type
            # This will raise validation errors if it doesn't match Type
            try:
                Type(**v)
            except Exception:
                raise ValueError(
                    "If 'type' is a dictionary, it must either be empty or conform to Type model"  # noqa: E501
                )
        return v


class State(PydanticBaseModel):
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


class Assignee(PydanticBaseModel):
    id: UUID4


class Label(PydanticBaseModel):
    id: UUID4
    name: str = Field(..., max_length=255)
    color: Optional[str] = Field(..., max_length=7)


class Module(PydanticBaseModel):
    id: UUID4
    name: str = Field(..., max_length=255)


class IssuePropertyOption(PydanticBaseModel):
    id: UUID4
    name: str = Field(..., max_length=255)
    is_active: bool = True
    is_default: bool = False
    logo_props: Optional[Dict] = {}


class IssueProperty(PydanticBaseModel):
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


def get_view_props():
    return {"full_width": False}


class PageTemplate(WorkspaceBaseModel):
    template = models.ForeignKey(
        Template, on_delete=models.CASCADE, related_name="page_templates"
    )
    name = models.TextField(blank=True)
    description = models.JSONField(default=dict, blank=True)
    description_binary = models.BinaryField(null=True)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=255, blank=True)
    parent = models.JSONField(default=dict)
    view_props = models.JSONField(default=get_view_props)
    logo_props = models.JSONField(default=dict)

    class Meta:
        db_table = "page_templates"
        verbose_name = "Page Template"
        verbose_name_plural = "Page Templates"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        # Strip the html tags using html parser
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )
        super(PageTemplate, self).save(*args, **kwargs)


class PageParent(PydanticBaseModel):
    id: UUID4
    project_id: UUID4
    project_identifier: str


class ProjectTemplate(BaseModel):
    NETWORK_CHOICES = ((0, "Secret"), (2, "Public"))

    class PriorityChoices(models.TextChoices):
        NONE = "none", "None"
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="project_templates"
    )
    template = models.ForeignKey(
        Template, on_delete=models.CASCADE, related_name="project_templates", null=True
    )

    # basics
    name = models.CharField(max_length=255, verbose_name="Project Name")
    description = models.TextField(verbose_name="Project Description", blank=True)
    description_text = models.JSONField(
        verbose_name="Project Description RT", blank=True, null=True
    )
    description_html = models.JSONField(
        verbose_name="Project Description HTML", blank=True, null=True
    )
    network = models.PositiveSmallIntegerField(default=2, choices=NETWORK_CHOICES)
    default_assignee = models.JSONField(default=dict)
    project_lead = models.JSONField(default=dict)
    logo_props = models.JSONField(default=dict)
    cover_asset = models.TextField(default=dict)

    # Feature toggles
    module_view = models.BooleanField(default=True)
    cycle_view = models.BooleanField(default=True)
    issue_views_view = models.BooleanField(default=True)
    page_view = models.BooleanField(default=True)
    intake_view = models.BooleanField(default=False)
    is_time_tracking_enabled = models.BooleanField(default=False)
    is_issue_type_enabled = models.BooleanField(default=False)
    guest_view_all_features = models.BooleanField(default=False)
    is_project_updates_enabled = models.BooleanField(default=False)
    is_epic_enabled = models.BooleanField(default=False)
    is_workflow_enabled = models.BooleanField(default=False)

    TIMEZONE_CHOICES = tuple(zip(pytz.all_timezones, pytz.all_timezones))
    timezone = models.CharField(max_length=255, default="UTC", choices=TIMEZONE_CHOICES)

    # archives
    archive_in = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(12)]
    )
    close_in = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(12)]
    )

    # attributes
    states = models.JSONField(default=dict)
    priority = models.CharField(
        max_length=50, choices=PriorityChoices.choices, default=PriorityChoices.NONE
    )
    project_state = models.JSONField(default=dict)
    # dates
    start_date = models.DateTimeField(null=True, blank=True)
    target_date = models.DateTimeField(null=True, blank=True)

    # attributes
    archived_at = models.DateTimeField(null=True)
    labels = models.JSONField(default=dict)
    workflows = models.JSONField(default=dict)
    estimates = models.JSONField(default=dict)
    workitem_types = models.JSONField(default=dict)
    epics = models.JSONField(default=dict)
    members = models.JSONField(default=dict)
    intake_settings = models.JSONField(default=dict)

    class Meta:
        unique_together = ["name", "workspace", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=models.Q(deleted_at__isnull=True),
                name="project_template_unique_name_workspace_when_deleted_at_null",
            )
        ]
        verbose_name = "Project Template"
        verbose_name_plural = "Project Templates"
        db_table = "project_templates"
        ordering = ("-created_at",)

    def __str__(self):
        return self.name


class ProjectState(PydanticBaseModel):
    id: UUID4
    name: str
    group: str


class WorkitemProperty(PydanticBaseModel):
    id: UUID4
    display_name: str = Field(..., max_length=255)
    description: Optional[str] = Field("")
    property_type: str
    relation_type: Optional[str] = None
    logo_props: Dict
    is_required: bool = False
    settings: Dict = {}
    is_active: bool = True
    is_multi: bool = False
    options: List[IssuePropertyOption] = []

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


class WorkitemType(PydanticBaseModel):
    id: UUID4
    name: str = Field(..., max_length=255)
    description: Optional[str] = Field("")
    logo_props: dict
    is_epic: bool
    is_default: bool = False
    is_active: bool = True
    properties: List[WorkitemProperty]


class EstimatePoints(PydanticBaseModel):
    id: UUID4
    key: int = Field(..., ge=0, le=12)
    value: str = Field(..., max_length=255)


class Estimate(PydanticBaseModel):
    id: UUID4
    name: str = Field(..., max_length=255)
    type: str = Field(..., max_length=255)
    points: List[EstimatePoints]


class Epic(PydanticBaseModel):
    id: UUID4
    name: str = Field(..., max_length=255)
    is_epic: bool = True
    properties: List[WorkitemProperty]


class WorkitemState(PydanticBaseModel):
    id: UUID4
    name: str = Field(..., max_length=255)
    description: Optional[str] = Field("", max_length=255)
    color: str = Field(..., max_length=255)
    sequence: float
    default: bool = False
    group: str = Field(..., max_length=255)

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


class Member(PydanticBaseModel):
    id: UUID4


class IntakeSettings(PydanticBaseModel):
    is_in_app_enabled: bool = False
    is_email_enabled: bool = False
    is_form_enabled: bool = False


class WorkflowTransitionApprover(PydanticBaseModel):
    approver: UUID4


class WorkflowTransition(PydanticBaseModel):
    transition_state: UUID4
    rejection_state: UUID4
    approver: List[WorkflowTransitionApprover]


class Workflow(PydanticBaseModel):
    state: UUID4
    allow_issue_creation: bool = False
    transitions: List[WorkflowTransition]
