# Python imports
from uuid import uuid4

# Django imports
from django.db import models
from django.conf import settings

from .base import BaseModel


def generate_label_token():
    return uuid4().hex


def generate_token():
    return uuid4().hex + uuid4().hex


class APIToken(BaseModel):
    token = models.CharField(max_length=255, unique=True, default=generate_token)
    label = models.CharField(max_length=255, default=generate_label_token)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bot_tokens",
    )
    user_type = models.PositiveSmallIntegerField(
        choices=((0, "Human"), (1, "Bot")), default=0
    )
    workspace = models.ForeignKey(
        "db.workspace", related_name="api_tokens", on_delete=models.SET_NULL, null=True
    )

    class Meta:
        verbose_name = "API Token"
        verbose_name_plural = "API Tokems"
        db_table = "api_tokens"
        ordering = ("-created_at",)

    def __str__(self):
        return str(self.user.name)
