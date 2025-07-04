# Django imports
from django.db import models
from django.conf import settings
from django.db.models import Q
from django.template.defaultfilters import slugify
from django.contrib.postgres.fields import ArrayField

# Module imports
from plane.db.models import WorkspaceBaseModel


class PropertyTypeEnum(models.TextChoices):
    TEXT = "TEXT", "Text"
    DATETIME = "DATETIME", "Datetime"
    DECIMAL = "DECIMAL", "Decimal"
    BOOLEAN = "BOOLEAN", "Boolean"
    OPTION = "OPTION", "Option"
    RELATION = "RELATION", "Relation"
    URL = "URL", "URL"
    EMAIL = "EMAIL", "Email"
    FILE = "FILE", "File"


class RelationTypeEnum(models.TextChoices):
    ISSUE = "ISSUE", "Issue"
    USER = "USER", "User"


class IssueProperty(WorkspaceBaseModel):
    name = models.CharField(max_length=255)
    display_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    logo_props = models.JSONField(blank=True, default=dict)
    sort_order = models.FloatField(default=65535)
    property_type = models.CharField(max_length=255, choices=PropertyTypeEnum.choices)
    relation_type = models.CharField(
        max_length=255, blank=True, null=True, choices=RelationTypeEnum.choices
    )
    is_required = models.BooleanField(default=False)
    default_value = ArrayField(models.TextField(), blank=True, default=list)
    settings = models.JSONField(blank=True, default=dict)
    is_active = models.BooleanField(default=True)
    issue_type = models.ForeignKey(
        "db.IssueType", on_delete=models.CASCADE, related_name="properties"
    )
    is_multi = models.BooleanField(default=False)
    validation_rules = models.JSONField(blank=True, default=dict)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ["sort_order"]
        unique_together = ["name", "issue_type", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "issue_type"],
                condition=Q(deleted_at__isnull=True),
                name="issue_property_unique_name_project_when_deleted_at_null",
            )
        ]
        db_table = "issue_properties"

    def save(self, *args, **kwargs):
        self.name = slugify(self.display_name)
        if self._state.adding:
            # Get the maximum sequence value from the database
            last_id = IssueProperty.objects.filter(project=self.project).aggregate(
                largest=models.Max("sort_order")
            )["largest"]
            # if last_id is not None
            if last_id is not None:
                self.sort_order = last_id + 10000

        super(IssueProperty, self).save(*args, **kwargs)

    def __str__(self):
        return self.display_name


class IssuePropertyOption(WorkspaceBaseModel):
    name = models.CharField(max_length=255)
    sort_order = models.FloatField(default=65535)
    property = models.ForeignKey(
        IssueProperty, on_delete=models.CASCADE, related_name="options"
    )
    description = models.TextField(blank=True)
    logo_props = models.JSONField(blank=True, default=dict)
    is_active = models.BooleanField(default=True)
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, related_name="children", null=True, blank=True
    )
    is_default = models.BooleanField(default=False)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ["sort_order"]
        unique_together = ["name", "property", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "property"],
                condition=Q(deleted_at__isnull=True),
                name="issue_property_option_unique_name_project_when_deleted_at_null",
            )
        ]
        db_table = "issue_property_options"

    def save(self, *args, **kwargs):
        if self._state.adding:
            # Get the maximum sequence value from the database
            last_id = IssuePropertyOption.objects.filter(
                project=self.project, property=self.property
            ).aggregate(largest=models.Max("sort_order"))["largest"]
            # if last_id is not None
            if last_id is not None:
                self.sort_order = last_id + 10000

        if self.is_default:
            self.is_active = True

        super(IssuePropertyOption, self).save(*args, **kwargs)


class IssuePropertyValue(WorkspaceBaseModel):
    issue = models.ForeignKey(
        "db.Issue", on_delete=models.CASCADE, related_name="properties"
    )
    property = models.ForeignKey(
        IssueProperty, on_delete=models.CASCADE, related_name="values"
    )
    value_text = models.TextField(blank=True)
    value_boolean = models.BooleanField(default=False)
    value_decimal = models.FloatField(default=0)
    value_datetime = models.DateTimeField(blank=True, null=True)
    value_uuid = models.UUIDField(blank=True, null=True)
    value_option = models.ForeignKey(
        IssuePropertyOption,
        on_delete=models.CASCADE,
        related_name="property_values",
        blank=True,
        null=True,
    )
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]
        db_table = "issue_property_values"

    def __str__(self):
        return f"{self.property.display_name}"


class IssuePropertyActivity(WorkspaceBaseModel):
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    old_identifier = models.UUIDField(blank=True, null=True)
    new_identifier = models.UUIDField(blank=True, null=True)
    property = models.ForeignKey(
        IssueProperty, on_delete=models.CASCADE, related_name="activities"
    )
    issue = models.ForeignKey(
        "db.Issue", on_delete=models.CASCADE, related_name="activities"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="issue_property_activities",
    )
    action = models.CharField(max_length=255)
    epoch = models.FloatField(null=True)
    comment = models.TextField(verbose_name="Comment", blank=True)

    class Meta:
        ordering = ["-created_at"]
        db_table = "issue_property_activities"

    def __str__(self):
        return f"{self.property.display_name} - {self.issue_id}"
