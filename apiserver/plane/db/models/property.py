# Django imports
from django.db import models
from django.conf import settings

# Module imports
from plane.db.mixins import AuditModel
from plane.db.models import ProjectBaseModel, BaseModel


def convert_string(s):
    return s.lower().replace(" ", "_")


class Property(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="issue_properties"
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="issue_properties",
        null=True,
    )
    name = models.CharField(max_length=255)
    display_name = models.CharField(max_length=255)
    icon = models.CharField(max_length=255, blank=True, null=True)
    color = models.CharField(max_length=20, blank=True, default="")
    description = models.TextField(blank=True, default="")
    type = models.CharField(
        choices=(
            ("entity", "entity"),
            ("text", "text"),
            ("paragraph", "paragraph"),
            ("number", "number"),
            ("checkbox", "checkbox"),
            ("select", "select"),
            ("multi_select", "multi_select"),
            ("relation", "relation"),
            ("file", "file"),
            ("email", "email"),
            ("url", "url"),
            ("datetime", "datetime"),
            ("option", "option"),
        )
    )
    is_required = models.BooleanField(default=False)
    sort_order = models.FloatField(default=65535)
    parent = models.ForeignKey(
        "db.Property",
        on_delete=models.CASCADE,
        related_name="children",
        null=True,
    )
    default_value = models.TextField(blank=True, default="")
    is_shared = models.BooleanField(default=True)
    extra_settings = models.JSONField(default=dict, blank=True)
    unit = models.CharField(max_length=100, blank=True, null=True)
    is_multi = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Property"
        verbose_name_plural = "Properties"
        db_table = "properties"
        ordering = ("sort_order",)

    def __str__(self):
        return f"<{self.name} {self.type}>"

    def save(self, *args, **kwargs):
        self.name = convert_string(self.display_name)
        
        # type is multi_select
        if self.type == "multi_select":
            self.is_multi = True

        if self._state.adding:
            if self.parent is None:
                largest_order = Property.objects.filter(
                    workspace=self.workspace
                ).aggregate(largest=models.Max("sort_order"))["largest"]
            else:
                largest_order = Property.objects.filter(
                    workspace=self.workspace, parent=self.parent
                ).aggregate(largest=models.Max("sort_order"))["largest"]
            
            
            # Save the sort_order as well
            if largest_order is not None:
                self.sort_order = largest_order + 10000

        if self.project is not None and self.workspace is not None:
            self.is_shared = False

        super(Property, self).save(*args, **kwargs)


class PropertyValue(ProjectBaseModel):
    TYPE_CHOICES = (
        (0, "text"),
        (1, "uuid"),
    )
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="property_values"
    )
    value = models.TextField(null=True, blank=True, db_index=True)
    value_hash = models.CharField(max_length=255)
    type = models.PositiveSmallIntegerField(choices=TYPE_CHOICES)
    entity = models.CharField()
    entity_uuid = models.UUIDField()
    transaction = models.ForeignKey(
        "db.PropertyTransaction",
        on_delete=models.CASCADE,
        related_name="values",
    )

    class Meta:
        verbose_name = "PropertyValue"
        verbose_name_plural = "PropertyValues"
        db_table = "property_values"

    def __str__(self):
        return f"<{str(self.property.type)} {str(self.value)}>"


class PropertyTransaction(AuditModel):
    id = models.UUIDField(unique=True, editable=False, db_index=True, primary_key=True)
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="property_transactions"
    )
    project = models.ForeignKey(
        "db.Project", on_delete=models.CASCADE, related_name="property_transactions"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="property_transactions",
        null=True,
    )
    property = models.ForeignKey(
        "db.Property",
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    from_value = models.TextField(blank=True)
    to_value = models.TextField(blank=True)
    from_value_hash = models.CharField(max_length=255)
    to_value_hash = models.CharField(max_length=255)
    entity = models.CharField(max_length=255)
    entity_uuid = models.UUIDField()
    s_epoch = models.FloatField()
    a_epoch = models.FloatField()

    class Meta:
        verbose_name = "PropertyTransaction"
        verbose_name_plural = "PropertyTransactions"
        db_table = "property_transactions"
        ordering = ("-created_at",)

    def __str__(self):
        return f"<{str(self.issue_property.type)} {str(self.from_value)}>"
