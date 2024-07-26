# Django imports
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

# Module imports
from .project import ProjectBaseModel


class Estimate(ProjectBaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(
        verbose_name="Estimate Description", blank=True
    )
    type = models.CharField(max_length=255, default="categories")
    last_used = models.BooleanField(default=False)

    def __str__(self):
        """Return name of the estimate"""
        return f"{self.name} <{self.project.name}>"

    class Meta:
        unique_together = ["name", "project"]
        verbose_name = "Estimate"
        verbose_name_plural = "Estimates"
        db_table = "estimates"
        ordering = ("name",)


class EstimatePoint(ProjectBaseModel):
    estimate = models.ForeignKey(
        "db.Estimate",
        on_delete=models.CASCADE,
        related_name="points",
    )
    key = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(12)]
    )
    description = models.TextField(blank=True)
    value = models.CharField(max_length=255)

    def __str__(self):
        """Return name of the estimate"""
        return f"{self.estimate.name} <{self.key}> <{self.value}>"

    class Meta:
        verbose_name = "Estimate Point"
        verbose_name_plural = "Estimate Points"
        db_table = "estimate_points"
        ordering = ("value",)
