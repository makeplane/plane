# Django imports
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator
from django.db import models

# Module imports
from .base import BaseModel


class Department(BaseModel):
    """Hierarchical department model for organizational structure (max 6 levels).
    Instance-level: not scoped to any workspace.
    """

    # Basic info
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=20, blank=True, null=True, default=None)
    short_name = models.CharField(max_length=10, blank=True, null=True)
    dept_code = models.CharField(max_length=4, blank=True, null=True)
    description = models.TextField(blank=True, default="")
    DEPT_TYPE_CHOICES = [("HO", "HO"), ("BRX", "BRX"), ("OSR", "OSR")]
    dept_type = models.CharField(max_length=3, choices=DEPT_TYPE_CHOICES, blank=True, default="")

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

    # Link to workspace (one workspace per department)
    linked_workspace = models.OneToOneField(
        "db.Workspace",
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
                fields=["short_name"],
                condition=models.Q(deleted_at__isnull=True),
                name="department_unique_short_name",
            ),
        ]

    def clean(self):
        if self.short_name is not None and self.short_name and (
            len(self.short_name) < 2 or not self.short_name.isupper()
        ):
            raise ValidationError("short_name must be uppercase, minimum 2 characters")
        if self.dept_code is not None and self.dept_code and (
            len(self.dept_code) != 4 or not self.dept_code.isdigit()
        ):
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
