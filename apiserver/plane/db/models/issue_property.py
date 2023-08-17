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
    is_required = models.BooleanField(default=False)
    sort_order = models.FloatField(default=65535)
    parent = models.ForeignKey(
        "db.IssueProperty", on_delete=models.CASCADE, related_name="children", null=True,
    )
    default_value = models.CharField(max_length=800, blank=True, null=True)
    is_shared = models.BooleanField(default=False)
    extra_settings = models.JSONField(default=None, null=True, blank=True)
    unit = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        verbose_name = "IssueProperty"
        verbose_name_plural = "IssueProperties"
        db_table = "issue_properties"
        ordering = ("sort_order",)

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
    issue_property = models.ForeignKey(
        IssueProperty, on_delete=models.CASCADE, related_name="values"
    )
    description = models.TextField(blank=True, null=True)
    value = models.CharField(max_length=800)
    issue = models.ForeignKey(
        "db.Issue", on_delete=models.CASCADE, related_name="attribute_values"
    )

    class Meta:
        verbose_name = "IssuePropertyValue"
        verbose_name_plural = "IssuePropertyValues"
        db_table = "issue_property_values"
