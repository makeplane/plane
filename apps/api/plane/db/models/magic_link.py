"""
Magic Link Model for PostgreSQL-based authentication tokens.

This replaces Redis-based magic link storage for simplified infrastructure.
Expired links are cleaned up by a scheduled task.
"""
import uuid
from datetime import timedelta

from django.db import models
from django.utils import timezone


class MagicLink(models.Model):
    """
    Stores magic link tokens for passwordless authentication.

    Replaces Redis storage for simpler infrastructure (no Redis needed for auth).
    """

    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    key = models.CharField(max_length=255, unique=True, db_index=True)
    email = models.EmailField()
    token = models.CharField(max_length=10)
    current_attempt = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "magic_links"
        indexes = [
            models.Index(fields=["expires_at"]),
        ]

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @classmethod
    def cleanup_expired(cls):
        """Delete all expired magic links."""
        return cls.objects.filter(expires_at__lt=timezone.now()).delete()

    def __str__(self):
        return f"MagicLink({self.email}, expires={self.expires_at})"
