# Django imports
from django.db import models
from django.utils import timezone
from django.conf import settings
from django.utils.html import strip_tags

# Module imports
from .workspace import WorkspaceBaseModel


class EntityDescriptionVersion(WorkspaceBaseModel):
    entity_name = models.CharField(max_length=255, verbose_name="Entity Name")
    entity_identifier = models.UUIDField(null=True)
    last_saved_at = models.DateTimeField(default=timezone.now)
    owned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="entity_description_versions",
    )
    description_binary = models.BinaryField(null=True)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    description_json = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Entity Description Version"
        verbose_name_plural = "Entity Description Versions"
        db_table = "entity_description_versions"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        # Strip the html tags using html parser
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )
        super(EntityDescriptionVersion, self).save(*args, **kwargs)

    def __str__(self):
        return f"{self.entity_name} {self.entity_identifier}"
