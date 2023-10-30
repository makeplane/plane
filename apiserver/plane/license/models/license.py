# Django imports
from django.db import models

# Module imports
from plane.db.models import BaseModel


class License(BaseModel):
    instance_id = models.CharField(max_length=25, unique=True)
    license_key = models.CharField(max_length=256)
    api_key = models.CharField(max_length=16)
    version = models.CharField(max_length=10)
    email = models.CharField(max_length=256)
    last_checked_at = models.DateTimeField(null=True)
    check_frequency = models.CharField(null=True)


    class Meta:
        verbose_name = "License"
        verbose_name_plural = "Licenses"
        db_table = "licenses"
        ordering = ("-created_at",)
