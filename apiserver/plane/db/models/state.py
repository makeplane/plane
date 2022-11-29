# Django imports
from django.db import models
from django.template.defaultfilters import slugify

# Module imports
from . import ProjectBaseModel


class State(ProjectBaseModel):
    name = models.CharField(max_length=255, verbose_name="State Name")
    description = models.TextField(verbose_name="State Description", blank=True)
    color = models.CharField(max_length=255, verbose_name="State Color")
    slug = models.SlugField(max_length=100, blank=True)
    sequence = models.FloatField(default=65535)

    def __str__(self):
        """Return name of the state"""
        return f"{self.name} <{self.project.name}>"

    class Meta:
        unique_together = ["name", "project"]
        verbose_name = "State"
        verbose_name_plural = "States"
        db_table = "state"
        ordering = ("sequence",)

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        return super().save(*args, **kwargs)
