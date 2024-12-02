# Django imports
from django.conf import settings
from django.db import models
from django.utils import timezone

# Module import
from .base import BaseModel


class SocialLoginConnection(BaseModel):
    medium = models.CharField(
        max_length=20,
        choices=(
            ("Google", "google"),
            ("Github", "github"),
            ("GitLab", "gitlab"),
            ("Jira", "jira"),
        ),
        default=None,
    )
    last_login_at = models.DateTimeField(default=timezone.now, null=True)
    last_received_at = models.DateTimeField(default=timezone.now, null=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_login_connections",
    )
    token_data = models.JSONField(null=True)
    extra_data = models.JSONField(null=True)

    class Meta:
        verbose_name = "Social Login Connection"
        verbose_name_plural = "Social Login Connections"
        db_table = "social_login_connections"
        ordering = ("-created_at",)

    def __str__(self):
        """Return name of the user and medium"""
        return f"{self.medium} <{self.user.email}>"
