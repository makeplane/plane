# Django imports
from django.db import models

# Module imports
from .workspace import WorkspaceBaseModel


class IssueType(WorkspaceBaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    logo_props = models.JSONField(default=dict)
    sort_order = models.FloatField(default=65535)
    is_default = models.BooleanField(default=False)
    weight = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ["project", "name"]
        verbose_name = "Issue Type"
        verbose_name_plural = "Issue Types"
        db_table = "issue_types"
        ordering = ("sort_order",)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # If we are adding a new issue type, we need to set the sort order
        if self._state.adding:
            # Get the largest sort order for the project
            largest_sort_order = IssueType.objects.filter(
                project=self.project
            ).aggregate(largest=models.Max("sort_order"))["largest"]
            # If there are issue types, set the sort order to the largest + 10000
            if largest_sort_order is not None:
                self.sort_order = largest_sort_order + 10000
        super(IssueType, self).save(*args, **kwargs)
