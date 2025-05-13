# Django imports
from django.db import models
from django.db.models import Q
from django.template.defaultfilters import slugify
from django.contrib.postgres.fields import ArrayField

# Module imports
from plane.utils.html_processor import strip_tags
from plane.db.models import BaseModel


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


class Customer(BaseModel):
    name = models.CharField(max_length=255)
    description = models.JSONField(blank=True, null=True)
    description_html = models.TextField(blank=True, null=True)
    description_stripped = models.TextField(blank=True, null=True)
    description_binary = models.BinaryField(null=True)
    email = models.EmailField(blank=True, null=True)
    website_url = models.URLField(blank=True, null=True)
    logo_props = models.JSONField(blank=True, default=dict)
    logo_asset = models.ForeignKey("db.FileAsset", on_delete=models.SET_NULL, null=True)
    domain = models.CharField(max_length=255, blank=True, null=True)
    employees = models.IntegerField(blank=True, null=True)
    stage = models.CharField(max_length=255, blank=True, null=True)
    contract_status = models.CharField(max_length=255, blank=True, null=True)
    revenue = models.CharField(blank=True, null=True)
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="customers"
    )

    @property
    def logo_url(self):
        if self.logo_asset:
            return self.logo_asset.asset_url

        return None

    def save(self, *args, **kwargs):
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )

        super(Customer, self).save(*args, **kwargs)

    class Meta:
        unique_together = ["name", "workspace", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=Q(deleted_at__isnull=True),
                name="customer_unique_name_workspace_when_deleted_at_null",
            )
        ]
        verbose_name = "Customer"
        verbose_name_plural = "Customers"
        db_table = "customers"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name}"


class CustomerProperty(BaseModel):
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
    is_multi = models.BooleanField(default=False)
    validation_rules = models.JSONField(blank=True, default=dict)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="customer_property"
    )

    class Meta:
        ordering = ["sort_order"]
        unique_together = ["name", "workspace", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=Q(deleted_at__isnull=True),
                name="customer_property_unique_name_project_when_deleted_at_null",
            )
        ]
        verbose_name = "Customer Property"
        verbose_name_plural = "Customer Properties"
        db_table = "customer_properties"

    def save(self, *args, **kwargs):
        self.name = slugify(self.display_name)
        if self._state.adding:
            # Get the maximum sequence value from the database
            last_id = CustomerProperty.objects.aggregate(
                largest=models.Max("sort_order")
            )["largest"]
            # if last_id is not None
            if last_id is not None:
                self.sort_order = last_id + 10000

        super(CustomerProperty, self).save(*args, **kwargs)

    def __str__(self):
        return self.display_name


class CustomerPropertyOption(BaseModel):
    name = models.CharField(max_length=255)
    sort_order = models.FloatField(default=65535)
    property = models.ForeignKey(
        CustomerProperty, on_delete=models.CASCADE, related_name="options"
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
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="customer_property_option",
    )

    class Meta:
        unique_together = ["name", "property", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "property"],
                condition=Q(deleted_at__isnull=True),
                name="customer_property_option_unique_name_project_when_deleted_at_null",
            )
        ]
        verbose_name = "Customer Property Option"
        verbose_name_plural = "Customer Property Options"
        db_table = "customer_property_options"
        ordering = ["sort_order"]

    def save(self, *args, **kwargs):
        if self._state.adding:
            # Get the maximum sequence value from the database
            last_id = CustomerPropertyOption.objects.filter(
                project=self.project, property=self.property
            ).aggregate(largest=models.Max("sort_order"))["largest"]
            # if last_id is not None
            if last_id is not None:
                self.sort_order = last_id + 10000

        if self.is_default:
            self.is_active = True

        super(CustomerPropertyOption, self).save(*args, **kwargs)

    def __str__(self):
        return f"{self.property.display_name}"


class CustomerPropertyValue(BaseModel):
    customer = models.ForeignKey(
        "ee.Customer", on_delete=models.CASCADE, related_name="properties"
    )
    property = models.ForeignKey(
        CustomerProperty, on_delete=models.CASCADE, related_name="values"
    )
    value_text = models.TextField(blank=True)
    value_boolean = models.BooleanField(default=False)
    value_decimal = models.FloatField(default=0)
    value_datetime = models.DateTimeField(blank=True, null=True)
    value_uuid = models.UUIDField(blank=True, null=True)
    value_option = models.ForeignKey(
        CustomerPropertyOption,
        on_delete=models.CASCADE,
        related_name="property_values",
        blank=True,
        null=True,
    )
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="customer_property_value"
    )

    class Meta:
        verbose_name = "Customer Property Value"
        verbose_name_plural = "Customer Property Values"
        ordering = ["-created_at"]
        db_table = "customer_property_values"

    def __str__(self):
        return f"{self.property.display_name}"


class CustomerRequest(BaseModel):
    name = models.CharField(max_length=255)
    description = models.JSONField(blank=True, null=True)
    description_html = models.TextField(blank=True, null=True)
    description_stripped = models.TextField(blank=True, null=True)
    description_binary = models.BinaryField(null=True)
    customer = models.ForeignKey(
        "ee.Customer", on_delete=models.CASCADE, related_name="requests"
    )
    link = models.URLField(blank=True, null=True)
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="customer_requests"
    )

    def save(self, *args, **kwargs):
        # Strip the html tags using html parser
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )

        super(CustomerRequest, self).save(*args, **kwargs)

    class Meta:
        verbose_name = "Customer Request"
        verbose_name_plural = "Customer Requests"
        db_table = "customer_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name}"


class CustomerRequestIssue(BaseModel):
    customer_request = models.ForeignKey(
        "ee.CustomerRequest",
        on_delete=models.CASCADE,
        related_name="customer_request_issues",
        blank=True,
        null=True,
    )
    customer = models.ForeignKey(
        "ee.Customer", on_delete=models.CASCADE, related_name="customer_request_issues"
    )
    issue = models.ForeignKey(
        "db.Issue", on_delete=models.CASCADE, related_name="customer_request_issues"
    )
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="customer_request_issues"
    )

    class Meta:
        verbose_name = "Customer Request Issue"
        verbose_name_plural = "Customer Issues"
        db_table = "customer_request_issues"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.customer} {self.issue} {self.customer_request}"
