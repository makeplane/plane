"""Family model for FamilyFlow - represents household units"""

# Django imports
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

# Module imports
from .base import BaseModel


def get_default_swim_lanes():
    """Default swim lane categories for families"""
    return ["Chores", "School/Activities", "Home Projects", "Family Time", "Individual Goals"]


class FamilyRole(models.TextChoices):
    """Family member role choices"""
    PARENT = "parent", "Parent"
    CHILD = "child", "Child"


class Family(BaseModel):
    """
    Represents a household unit with multiple family members collaborating on household tasks.
    
    Family is the primary organizational unit in FamilyFlow, similar to Workspace in Plane.
    Each family has members, backlog items, sprints, and retrospectives.
    """
    
    name = models.CharField(
        max_length=200,
        verbose_name="Family Name",
        help_text="Household identifier or family name"
    )
    sprint_duration = models.IntegerField(
        default=7,
        validators=[MinValueValidator(1), MaxValueValidator(30)],
        help_text="Sprint duration in days (default: 7 for weekly, 14 for bi-weekly)"
    )
    default_swim_lanes = models.JSONField(
        default=get_default_swim_lanes,
        help_text="Default category list for backlog items and sprints"
    )
    custom_swim_lanes = models.JSONField(
        default=list,
        blank=True,
        null=True,
        help_text="Custom categories families can add beyond defaults"
    )
    gamification_enabled = models.BooleanField(
        default=True,
        help_text="Enable/disable gamification features for children"
    )
    baseline_capacity = models.IntegerField(
        default=20,
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text="Baseline sprint capacity in story points (manually configured per family)"
    )
    
    class Meta:
        verbose_name = "Family"
        verbose_name_plural = "Families"
        db_table = "families"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["name"],
                condition=models.Q(deleted_at__isnull=True),
                name="family_unique_name_when_deleted_at_null"
            )
        ]
    
    def __str__(self) -> str:
        """Return family name"""
        return self.name
    
    def clean(self):
        """Validate model data"""
        from django.core.exceptions import ValidationError
        
        # Validate sprint_duration is 7 or 14 (common values, though 1-30 is allowed)
        if self.sprint_duration not in [7, 14] and self.sprint_duration not in range(1, 31):
            raise ValidationError({"sprint_duration": "Sprint duration must be between 1 and 30 days"})
        
        # Validate default_swim_lanes has at least one category
        if not self.default_swim_lanes or len(self.default_swim_lanes) == 0:
            raise ValidationError({"default_swim_lanes": "At least one default swim lane category is required"})
    
    def get_all_swim_lanes(self):
        """Get combined list of default and custom swim lanes"""
        lanes = list(self.default_swim_lanes) if self.default_swim_lanes else []
        if self.custom_swim_lanes:
            lanes.extend(self.custom_swim_lanes)
        return lanes

