# Django imports
from django.conf import settings
from django.db import models

# Module imports
from .base import BaseModel


class EmploymentStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    PROBATION = "probation", "Probation"
    RESIGNED = "resigned", "Resigned"
    SUSPENDED = "suspended", "Suspended"
    TRANSFERRED = "transferred", "Transferred"


class StaffProfile(BaseModel):
    """Employee profile linked to User, scoped to workspace (one per workspace)."""

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="staff_profiles",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="staff_profiles",
    )

    # Staff ID
    staff_id = models.CharField(max_length=8, db_index=True)

    # Department
    department = models.ForeignKey(
        "db.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff_members",
    )

    # Job info
    position = models.CharField(max_length=255, blank=True, default="")
    job_grade = models.CharField(max_length=50, blank=True, default="")

    # Contact
    phone = models.CharField(max_length=20, blank=True, default="")

    # Dates
    date_of_joining = models.DateField(null=True, blank=True)
    date_of_leaving = models.DateField(null=True, blank=True)

    # Status
    employment_status = models.CharField(
        max_length=20,
        choices=EmploymentStatus.choices,
        default=EmploymentStatus.ACTIVE,
    )

    # Department manager flag - auto-join children projects
    is_department_manager = models.BooleanField(default=False)

    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "staff_profiles"
        verbose_name = "Staff Profile"
        verbose_name_plural = "Staff Profiles"
        ordering = ["staff_id"]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "staff_id"],
                condition=models.Q(deleted_at__isnull=True),
                name="staff_unique_workspace_staff_id",
            ),
            models.UniqueConstraint(
                fields=["workspace", "user"],
                condition=models.Q(deleted_at__isnull=True),
                name="staff_unique_workspace_user",
            ),
        ]

    @property
    def email(self):
        return f"sh{self.staff_id}@swing.shinhan.com"

    def __str__(self):
        return f"{self.staff_id} - {self.user.get_full_name()}"
