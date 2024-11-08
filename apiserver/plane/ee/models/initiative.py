# Django imports
from django.db import models

# Module imports
from plane.db.models import BaseModel


class Initiative(BaseModel):
    class StatusContext(models.TextChoices):
        PLANNED = "PLANNED", "Planned"
        ON_HOLD = "ON_HOLD", "On Hold"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        DONE = "DONE", "Done"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="initiatives",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    description_html = models.TextField(blank=True, null=True)
    description_stripped = models.TextField(blank=True, null=True)
    description_binary = models.BinaryField(null=True)
    lead = models.ForeignKey(
        "db.User",
        on_delete=models.CASCADE,
        related_name="initiatives_lead",
        blank=True,
        null=True,
    )
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(
        max_length=100,
        choices=StatusContext.choices,
        default=StatusContext.PLANNED,
    )

    class Meta:
        db_table = "initiatives"
        verbose_name = "Initiative"
        verbose_name_plural = "Initiatives"


class InitiativeProject(BaseModel):
    initiative = models.ForeignKey(
        "ee.Initiative",
        on_delete=models.CASCADE,
        related_name="projects",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="initiatives",
    )
    sort_order = models.FloatField(default=65535)

    class Meta:
        unique_together = ["initiative", "project"]
        db_table = "initiative_projects"
        verbose_name = "Initiative Project"
        verbose_name_plural = "Initiative Projects"


class InitiativeLabel(BaseModel):
    initiative = models.ForeignKey(
        "ee.Initiative",
        on_delete=models.CASCADE,
        related_name="labels",
    )
    label = models.ForeignKey(
        "db.Label",
        on_delete=models.CASCADE,
        related_name="initiatives",
    )
    sort_order = models.FloatField(default=65535)

    class Meta:
        unique_together = ["initiative", "label"]
        db_table = "initiative_labels"
        verbose_name = "Initiative Label"
        verbose_name_plural = "Initiative Labels"
