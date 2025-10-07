from django.db import models
from django.utils.html import strip_tags
from .workspace import WorkspaceBaseModel


class Description(WorkspaceBaseModel):
    description_json = models.JSONField(default=dict, blank=True)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_binary = models.BinaryField(null=True)
    description_stripped = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Description"
        verbose_name_plural = "Descriptions"
        db_table = "descriptions"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        # Strip the html tags using html parser
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )
        super(Description, self).save(*args, **kwargs)


class DescriptionVersion(WorkspaceBaseModel):
    """
    DescriptionVersion is a model used to store historical versions of a Description.
    """

    description = models.ForeignKey("db.Description", on_delete=models.CASCADE, related_name="versions")
    description_json = models.JSONField(default=dict, blank=True)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_binary = models.BinaryField(null=True)
    description_stripped = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Description Version"
        verbose_name_plural = "Description Versions"
        db_table = "description_versions"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        # Strip the html tags using html parser
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )
        super(DescriptionVersion, self).save(*args, **kwargs)
