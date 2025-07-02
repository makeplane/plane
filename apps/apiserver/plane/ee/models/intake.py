# Django imports
from django.db import models

# Module imports
from plane.db.models import ProjectBaseModel


class IntakeSetting(ProjectBaseModel):
    intake = models.ForeignKey(
        "db.Intake", on_delete=models.CASCADE, related_name="intake_settings"
    )
    is_in_app_enabled = models.BooleanField(default=True)
    is_email_enabled = models.BooleanField(default=False)
    is_form_enabled = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Intake Setting"
        verbose_name_plural = "Intake Settings"
        db_table = "intake_settings"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.intake.name}"
