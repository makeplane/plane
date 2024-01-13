# Django imports
from django.db import models
from django.template.defaultfilters import slugify

# Module imports
from . import ProjectBaseModel


class State(ProjectBaseModel):
    name = models.CharField(max_length=255, verbose_name="State Name")
    description = models.TextField(
        verbose_name="State Description", blank=True
    )
    color = models.CharField(max_length=255, verbose_name="State Color")
    slug = models.SlugField(max_length=100, blank=True)
    sequence = models.FloatField(default=65535)
    group = models.CharField(
        choices=(
            ("backlog", "Backlog"),
            ("unstarted", "Unstarted"),
            ("started", "Started"),
            ("completed", "Completed"),
            ("cancelled", "Cancelled"),
        ),
        default="backlog",
        max_length=20,
    )
    default = models.BooleanField(default=False)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        """Return name of the state"""
        return f"{self.name} <{self.project.name}>"

    class Meta:
        unique_together = ["name", "project"]
        verbose_name = "State"
        verbose_name_plural = "States"
        db_table = "states"
        ordering = ("sequence",)

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        if self._state.adding:
            # Get the maximum sequence value from the database
            last_id = State.objects.filter(project=self.project).aggregate(
                largest=models.Max("sequence")
            )["largest"]
            # if last_id is not None
            if last_id is not None:
                self.sequence = last_id + 15000

        return super().save(*args, **kwargs)
