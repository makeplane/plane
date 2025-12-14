"""BacklogItem model for FamilyFlow - represents tasks, chores, projects, events, and goals"""

# Django imports
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.core.exceptions import ValidationError

# Module imports
from .base import BaseModel


class BacklogItemStatus(models.TextChoices):
    """Backlog item status choices"""
    BACKLOG = "backlog", "Backlog"
    SPRINT = "sprint", "Sprint"
    ARCHIVED = "archived", "Archived"


class BacklogItem(BaseModel):
    """
    Represents a task, chore, project, event, or goal that needs family attention.
    
    Items can be promoted to sprints and converted to Tasks. This is the main
    way families capture and organize household responsibilities.
    """
    
    family = models.ForeignKey(
        "db.Family",
        on_delete=models.CASCADE,
        related_name="backlog_items",
        help_text="Family this backlog item belongs to"
    )
    title = models.CharField(
        max_length=500,
        verbose_name="Title",
        help_text="Title of the backlog item"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Rich text description of the backlog item"
    )
    category = models.CharField(
        max_length=100,
        verbose_name="Category",
        help_text="Swim lane category (must exist in family's swim lanes)"
    )
    priority = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Priority order (higher number = higher priority, for ordering)"
    )
    story_points = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Effort estimate (1-5 scale, optional in backlog)"
    )
    creator = models.ForeignKey(
        "db.FamilyMember",
        on_delete=models.CASCADE,
        related_name="created_backlog_items",
        help_text="Family member who created this item"
    )
    status = models.CharField(
        max_length=20,
        choices=BacklogItemStatus.choices,
        default=BacklogItemStatus.BACKLOG,
        help_text="Current status of the backlog item"
    )
    is_template = models.BooleanField(
        default=False,
        help_text="Whether this is a template for recurring tasks"
    )
    
    class Meta:
        verbose_name = "Backlog Item"
        verbose_name_plural = "Backlog Items"
        db_table = "backlog_items"
        ordering = ("-priority", "-created_at")
        indexes = [
            models.Index(fields=["family", "category"]),
            models.Index(fields=["family", "status"]),
            models.Index(fields=["family", "priority"]),
            models.Index(fields=["family", "status", "priority"]),
        ]
    
    def __str__(self) -> str:
        """Return backlog item representation"""
        return f"{self.title} ({self.category})"
    
    def clean(self):
        """Validate model data"""
        # Title cannot be empty or whitespace
        if not self.title or not self.title.strip():
            raise ValidationError({"title": "Title cannot be empty or whitespace"})
        
        # Category must exist in family's swim lanes
        if self.family:
            all_swim_lanes = self.family.get_all_swim_lanes()
            if self.category not in all_swim_lanes:
                raise ValidationError({
                    "category": f"Category '{self.category}' must be one of the family's swim lanes: {', '.join(all_swim_lanes)}"
                })
        
        # Priority must be >= 0
        if self.priority < 0:
            raise ValidationError({"priority": "Priority must be >= 0"})
        
        # Story points must be >= 0 if provided, and between 1-5
        if self.story_points is not None:
            if self.story_points < 0:
                raise ValidationError({"story_points": "Story points must be >= 0"})
            if self.story_points < 1 or self.story_points > 5:
                raise ValidationError({"story_points": "Story points must be between 1 and 5"})
        
        # Status must be valid
        if self.status not in [choice[0] for choice in BacklogItemStatus.choices]:
            raise ValidationError({"status": f"Status must be one of: {', '.join([c[0] for c in BacklogItemStatus.choices])}"})
    
    def save(self, *args, **kwargs):
        """Override save to validate data"""
        self.full_clean()
        super().save(*args, **kwargs)

