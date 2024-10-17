# Django imports
from django.db import models

# Module imports
from plane.db.models.base import BaseModel
from plane.db.models.project import ProjectBaseModel


class GroupChoices(models.TextChoices):
    DRAFT = "draft", "Draft"
    PLANNING = "planning", "Planning"
    EXECUTION = "execution", "Execution"
    MONITORING = "monitoring", "Monitoring"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class ProjectState(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="project_states"
    )
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=255)
    sequence = models.FloatField(default=65535)
    group = models.CharField(
        max_length=20, choices=GroupChoices.choices, default=GroupChoices.DRAFT
    )
    default = models.BooleanField(default=False)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        """Return name of the state"""
        return f"{self.name} <{self.workspace.name}>"

    class Meta:
        unique_together = ["name", "workspace", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=models.Q(deleted_at__isnull=True),
                name="project_state_unique_name_project_when_deleted_at_null",
            )
        ]
        verbose_name = "Project State"
        verbose_name_plural = "Project States"
        db_table = "project_states"
        ordering = ("sequence",)

    def save(self, *args, **kwargs):
        if self._state.adding:
            # Get the maximum sequence value from the database
            last_id = ProjectState.objects.filter(
                workspace=self.workspace
            ).aggregate(largest=models.Max("sequence"))["largest"]
            # if last_id is not None
            if last_id is not None:
                self.sequence = last_id + 15000

        return super().save(*args, **kwargs)


class PriorityChoices(models.TextChoices):
    NONE = "none", "None"
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"
    URGENT = "urgent", "Urgent"


class ProjectAttribute(ProjectBaseModel):
    priority = models.CharField(
        max_length=50,
        choices=PriorityChoices.choices,
        default=PriorityChoices.NONE,
    )
    state = models.ForeignKey(
        ProjectState,
        on_delete=models.SET_NULL,
        related_name="project_attributes",
        null=True,
    )
    start_date = models.DateTimeField(null=True, blank=True)
    target_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Project Attribute"
        verbose_name_plural = "Project Attributes"
        db_table = "project_attributes"
        ordering = ("created_at",)
