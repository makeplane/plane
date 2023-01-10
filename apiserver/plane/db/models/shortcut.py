# Django imports
from django.db import models


# Module imports
from . import ProjectBaseModel


class Shortcut(ProjectBaseModel):
    TYPE_CHOICES = (("repo", "Repo"), ("direct", "Direct"))
    name = models.CharField(max_length=255, verbose_name="Cycle Name")
    description = models.TextField(verbose_name="Cycle Description", blank=True)
    type = models.CharField(
        max_length=255, verbose_name="Shortcut Type", choices=TYPE_CHOICES
    )
    url = models.URLField(verbose_name="URL", blank=True, null=True)

    class Meta:
        verbose_name = "Shortcut"
        verbose_name_plural = "Shortcuts"
        db_table = "shortcuts"
        ordering = ("-created_at",)

    def __str__(self):
        """Return name of the shortcut"""
        return f"{self.name} <{self.project.name}>"
