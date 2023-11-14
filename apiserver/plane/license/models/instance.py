# Django imports
from django.db import models
from django.conf import settings

# Module imports
from plane.db.models import BaseModel
from plane.db.mixins import AuditModel

class Instance(BaseModel):
    # General informations
    instance_name = models.CharField(max_length=255)
    whitelist_emails = models.TextField(blank=True, null=True)
    instance_id = models.CharField(max_length=25, unique=True)
    license_key = models.CharField(max_length=256, null=True, blank=True)
    api_key = models.CharField(max_length=16)
    version = models.CharField(max_length=10)
    # User information
    email = models.CharField(max_length=256)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="instance_owner",
    )
    # Instnace specifics
    last_checked_at = models.DateTimeField()
    namespace = models.CharField(max_length=50, blank=True, null=True)
    # telemetry and support
    is_telemetry_enabled = models.BooleanField(default=True)
    is_support_required = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Instance"
        verbose_name_plural = "Instances"
        db_table = "instances"
        ordering = ("-created_at",)


class InstanceAdmin(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="instance_owner",
    )
    instance = models.ForeignKey("db.Instance", on_delete=models.CASCADE, related_name="admins")

    class Meta:
        verbose_name = "Instance Admin"
        verbose_name_plural = "Instance Admins"
        db_table = "instance_admins"
        ordering = ("-created_at",)


class InstanceConfiguration(BaseModel):
    # The instance configuration variables
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField(null=True, blank=True, default=None)

    class Meta:
        verbose_name = "Instance Configuration"
        verbose_name_plural = "Instance Configurations"
        db_table = "instance_configurations"
        ordering = ("-created_at",)

