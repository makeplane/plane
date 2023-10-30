# Django imports
from django.db import models
from django.conf import settings

# Module imports
from plane.db.models import BaseModel


class Instance(BaseModel):
    instance_id = models.CharField(max_length=25, unique=True)
    license_key = models.CharField(max_length=256)
    api_key = models.CharField(max_length=16)
    version = models.CharField(max_length=10)
    email = models.CharField(max_length=256)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="instance_owner",
    )
    last_checked_at = models.DateTimeField()

    class Meta:
        verbose_name = "Instance"
        verbose_name_plural = "Instances"
        db_table = "instances"
        ordering = ("-created_at",)
