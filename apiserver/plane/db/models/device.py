# models.py
from django.db import models
from django.conf import settings
from .base import BaseModel


class Device(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="devices",
    )
    device_id = models.CharField(max_length=255, blank=True, null=True)
    device_type = models.CharField(max_length=255)
    push_token = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ["user", "push_token"]
        db_table = "devices"
        verbose_name = "Device"
        verbose_name_plural = "Devices"


class DeviceSession(BaseModel):
    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    session_id = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    user_agent = models.CharField(max_length=255, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "device_sessions"
        verbose_name = "Device Session"
        verbose_name_plural = "Device Sessions"
