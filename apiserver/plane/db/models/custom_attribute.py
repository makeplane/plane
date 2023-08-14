# Django imports
from django.db import models

# Module imports
from plane.db.models import ProjectBaseModel


class CustomProperty(ProjectBaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    type = models.CharField(
        choices=(
            ("entity", "entity"),
            ("text", "text"),
            ("number", "number"),
            ("checkbox", "checkbox"),
            ("select", "select"),
            ("mselect", "mselect"),
            ("date", "date"),
            ("relation", "relation"),
        )
    )
    required = models.BooleanField(default=False)
    sort_order = models.FloatField(default=65535)
    parent = models.ForeignKey(
        "db.IssueAttribute", on_delete=models.CASCADE, related_name="parent_attributes"
    )
    default = models.CharField(max_length=800, blank=True, null=True)

    class Meta:
        verbose_name = "CustomProperty"
        verbose_name_plural = "CustomProperties"
        db_table = "custom_properties"
        ordering = ("sort_order",)

    def save(self, *args, **kwargs):
        smallest_order = CustomProperty.objects.filter(
            project=self.project, state=self.state
        ).aggregate(smallest=models.Min("sort_order"))["smallest"]
        if smallest_order is not None:
            self.sort_order = smallest_order - 10000

        super(CustomProperty, self).save(*args, **kwargs)


class CustomPropertyAttribute(ProjectBaseModel):
    custom_property = models.ForeignKey(
        CustomProperty, on_delete=models.CASCADE, related_name="attributes"
    )
    value = models.CharField(max_length=800)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "CustomPropertyAttribute"
        verbose_name_plural = "CustomPropertyAttributes"
        db_table = "custom_property_attributes"


class CustomPropertyValue(ProjectBaseModel):
    attribute = models.ForeignKey(
        CustomPropertyAttribute, on_delete=models.CASCADE, related_name="values"
    )
    description = models.TextField(blank=True, null=True)
    value = models.CharField(max_length=800)
    issue = models.ForeignKey(
        "db.Issue", on_delete=models.CASCADE, related_name="attribute_values"
    )

    class Meta:
        verbose_name = "CustomPropertyValue"
        verbose_name_plural = "CustomPropertyValues"
        db_table = "custom_property_values"
