# Django imports
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator
from django.db import models

# Module imports
from .base import BaseModel


class Department(BaseModel):
    """Hierarchical department model for organizational structure (max 6 levels)."""

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="departments",
    )

    # Basic info
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=20)
    short_name = models.CharField(max_length=10)
    dept_code = models.CharField(max_length=4)
    description = models.TextField(blank=True, default="")

    # Hierarchy (parent=NULL means top level)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    level = models.PositiveSmallIntegerField(
        default=1,
        validators=[MaxValueValidator(6)],
    )

    # Department manager
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_departments",
    )

    # Link to team project
    linked_project = models.ForeignKey(
        "db.Project",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="linked_department",
    )

    # Ordering and status
    sort_order = models.FloatField(default=65535)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "departments"
        verbose_name = "Department"
        verbose_name_plural = "Departments"
        ordering = ["sort_order", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "code"],
                condition=models.Q(deleted_at__isnull=True),
                name="department_unique_workspace_code",
            ),
            models.UniqueConstraint(
                fields=["workspace", "short_name"],
                condition=models.Q(deleted_at__isnull=True),
                name="department_unique_workspace_short_name",
            ),
            models.UniqueConstraint(
                fields=["workspace", "dept_code"],
                condition=models.Q(deleted_at__isnull=True),
                name="department_unique_workspace_dept_code",
            ),
        ]

    def clean(self):
        if self.short_name and (len(self.short_name) < 2 or not self.short_name.isupper()):
            raise ValidationError("short_name must be uppercase, minimum 2 characters")
        if self.dept_code and (len(self.dept_code) != 4 or not self.dept_code.isdigit()):
            raise ValidationError("dept_code must be exactly 4 digits")
        # Prevent circular parent references
        if self.parent_id and self.pk:
            current = self.parent
            while current is not None:
                if current.pk == self.pk:
                    raise ValidationError("Circular parent reference detected")
                current = current.parent

    def __str__(self):
        return f"{self.code} - {self.name}"
