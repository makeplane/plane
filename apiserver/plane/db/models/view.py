# Django imports
from django.db import models


# Module import
from . import ProjectBaseModel


class View(ProjectBaseModel):
    name = models.CharField(max_length=255, verbose_name="View Name")
    description = models.TextField(verbose_name="View Description", blank=True)
    query = models.JSONField(verbose_name="View Query")

    class Meta:
        verbose_name = "View"
        verbose_name_plural = "Views"
        db_table = "view"
        ordering = ("-created_at",)

    def __str__(self):
        """Return name of the View"""
        return f"{self.name} <{self.project.name}>"
