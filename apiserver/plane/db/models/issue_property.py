# Django imports
from django.db import models

# Module imports
from plane.db.models import ProjectBaseModel, BaseModel


class IssueProperty(BaseModel):
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
    color = models.CharField(max_length=20, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    type = models.CharField(
        choices=(
            ("entity", "entity"),
            ("text", "text"),
            ("number", "number"),
            ("checkbox", "checkbox"),
            ("select", "select"),
            ("multi_select", "multi_select"),
            ("date", "date"),
            ("relation", "relation"),
            ("files", "files"),
            ("email", "email"),
            ("url", "url"),
            ("datetime", "datetime"),
            ("option", "option"),
        )
    )
    is_required = models.BooleanField(default=False)
    sort_order = models.FloatField(default=65535)
    parent = models.ForeignKey(
        "db.IssueProperty",
        on_delete=models.CASCADE,
        related_name="children",
        null=True,
    )
    default_value = models.TextField(blank=True, null=True)
    is_shared = models.BooleanField(default=True)
    extra_settings = models.JSONField(default=None, null=True, blank=True)
    unit = models.CharField(max_length=100, blank=True, null=True)
    is_multi = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name = "IssueProperty"
        verbose_name_plural = "IssueProperties"
        db_table = "issue_properties"
        ordering = ("sort_order",)

    def __str__(self):
        return f"<{self.name} {self.type}>"

    def save(self, *args, **kwargs):
        if self._state.adding:
            largest_order = IssueProperty.objects.filter(
                workspace=self.workspace
            ).aggregate(largest=models.Min("sort_order"))["largest"]
            if largest_order is not None:
                self.sort_order = largest_order + 10000

        if self.project is not None and self.workspace is not None:
            self.is_shared = False

        super(IssueProperty, self).save(*args, **kwargs)


class IssuePropertyValue(ProjectBaseModel):
    TYPE_CHOICES = (
        ("text", "text"),
        ("uuid", "uuid"),
    )
    issue_property = models.ForeignKey(
        IssueProperty, on_delete=models.CASCADE, related_name="property_values"
    )
    description = models.TextField(blank=True, null=True)
    value = models.TextField(null=True, blank=True, db_index=True)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    issue = models.ForeignKey(
        "db.Issue", on_delete=models.CASCADE, related_name="property_values"
    )

    class Meta:
        verbose_name = "IssuePropertyValue"
        verbose_name_plural = "IssuePropertyValues"
        db_table = "issue_property_values"

    def __str__(self):
        return f"<{str(self.issue_property.type)} {str(self.values)}>"
