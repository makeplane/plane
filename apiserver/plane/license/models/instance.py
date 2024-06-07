# Python imports
from enum import Enum

# Django imports
from django.db import models
from django.conf import settings

# Module imports
from plane.db.models import BaseModel

ROLE_CHOICES = ((20, "Admin"),)


class ProductTypes(Enum):
    PLANE_CE = "plane-ce"


class Instance(BaseModel):
    # General information
    instance_name = models.CharField(max_length=255)
    whitelist_emails = models.TextField(blank=True, null=True)
    instance_id = models.CharField(max_length=255, unique=True)
    license_key = models.CharField(max_length=256, null=True, blank=True)
    current_version = models.CharField(max_length=255)
    latest_version = models.CharField(max_length=255, null=True, blank=True)
    product = models.CharField(
        max_length=255, default=ProductTypes.PLANE_CE.value
    )
    domain = models.TextField(blank=True)
    # Instance specifics
    last_checked_at = models.DateTimeField()
    namespace = models.CharField(max_length=255, blank=True, null=True)
    # telemetry and support
    is_telemetry_enabled = models.BooleanField(default=True)
    is_support_required = models.BooleanField(default=True)
    # is setup done
    is_setup_done = models.BooleanField(default=False)
    # signup screen
    is_signup_screen_visited = models.BooleanField(default=False)
    # users
    user_count = models.PositiveBigIntegerField(default=0)
    is_verified = models.BooleanField(default=False)

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
    instance = models.ForeignKey(
        Instance, on_delete=models.CASCADE, related_name="admins"
    )
    role = models.PositiveIntegerField(choices=ROLE_CHOICES, default=20)
    is_verified = models.BooleanField(default=False)

    class Meta:
        unique_together = ["instance", "user"]
        verbose_name = "Instance Admin"
        verbose_name_plural = "Instance Admins"
        db_table = "instance_admins"
        ordering = ("-created_at",)


class InstanceConfiguration(BaseModel):
    # The instance configuration variables
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField(null=True, blank=True, default=None)
    category = models.TextField()
    is_encrypted = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Instance Configuration"
        verbose_name_plural = "Instance Configurations"
        db_table = "instance_configurations"
        ordering = ("-created_at",)


class ChangeLog(BaseModel):
    """Change Log model to store the release changelogs made in the application."""

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    version = models.CharField(max_length=255)
    tags = models.JSONField(default=list)
    release_date = models.DateTimeField(null=True)
    is_release_candidate = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Change Log"
        verbose_name_plural = "Change Logs"
        db_table = "changelogs"
        ordering = ("-created_at",)
