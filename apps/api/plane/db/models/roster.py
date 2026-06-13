# Django imports
from django.db import models
from django.db.models import Q, Case, When, Value, IntegerField
from django.db.models.functions import Cast

# Module imports
from .project import ProjectBaseModel


class RosterPlayerStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    INJURED = "injured", "Injured"
    INACTIVE = "inactive", "Inactive"
    PENDING = "pending", "Pending"


class RosterPlayer(ProjectBaseModel):
    player_name = models.CharField(max_length=255)
    jersey_number = models.CharField(max_length=20, null=True, blank=True)
    position = models.CharField(max_length=50, null=True, blank=True)
    height = models.CharField(max_length=50, null=True, blank=True)
    weight = models.CharField(max_length=50, null=True, blank=True)
    class_year = models.CharField(max_length=50, null=True, blank=True)
    status = models.CharField(max_length=20, choices=RosterPlayerStatus.choices, default=RosterPlayerStatus.ACTIVE)
    notes = models.TextField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "jersey_number"],
                condition=Q(deleted_at__isnull=True) & Q(jersey_number__isnull=False) & ~Q(jersey_number=""),
                name="roster_player_unique_project_jersey_when_active",
            )
        ]
        verbose_name = "Roster Player"
        verbose_name_plural = "Roster Players"
        db_table = "roster_players"
        ordering = ("player_name",)

    def __str__(self):
        return f"{self.player_name} <{self.project_id}>"

    @classmethod
    def jersey_number_ordering(cls):
        return Case(
            When(jersey_number__regex=r"^\d+$", then=Cast("jersey_number", IntegerField())),
            default=Value(2147483647),
            output_field=IntegerField(),
        )
