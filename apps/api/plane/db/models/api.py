# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from uuid import uuid4

# Django imports
from django.db import models, transaction
from django.conf import settings

from .base import BaseModel


def generate_label_token():
    return uuid4().hex


def generate_token():
    return "plane_api_" + uuid4().hex


class APIToken(BaseModel):
    # Meta information
    label = models.CharField(max_length=255, default=generate_label_token)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    last_used = models.DateTimeField(null=True)

    # Token
    token = models.CharField(max_length=255, unique=True, default=generate_token, db_index=True)

    # User Information
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bot_tokens")
    # The account used for audit attribution. `user` remains the permission owner.
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="api_token_actors"
    )
    user_type = models.PositiveSmallIntegerField(choices=((0, "Human"), (1, "Bot")), default=0)
    workspace = models.ForeignKey("db.Workspace", related_name="api_tokens", on_delete=models.CASCADE, null=True)
    expired_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = "API Token"
        verbose_name_plural = "API Tokems"
        db_table = "api_tokens"
        ordering = ("-created_at",)

    def __str__(self):
        return str(self.user.id)

    def ensure_actor(self):
        """Return the token's audit identity, creating it for legacy tokens as needed."""
        if self.actor_id:
            return self.actor

        from .user import User

        with transaction.atomic():
            locked_token = APIToken.objects.select_for_update().get(pk=self.pk)
            if locked_token.actor_id:
                self.actor = locked_token.actor
                return self.actor

            actor_id = uuid4().hex
            actor = User.objects.create(
                username=f"api_token_{actor_id}",
                email=f"api-token-{actor_id}@plane.invalid",
                display_name=self.label,
                first_name=self.label,
                is_bot=True,
                is_active=True,
                is_password_autoset=True,
            )
            locked_token.actor = actor
            locked_token.save(update_fields=["actor"])
            self.actor = actor
        return self.actor


class APIActivityLog(BaseModel):
    token_identifier = models.CharField(max_length=255)

    # Request Info
    path = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    query_params = models.TextField(null=True, blank=True)
    headers = models.TextField(null=True, blank=True)
    body = models.TextField(null=True, blank=True)

    # Response info
    response_code = models.PositiveIntegerField()
    response_body = models.TextField(null=True, blank=True)

    # Meta information
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=512, null=True, blank=True)

    class Meta:
        verbose_name = "API Activity Log"
        verbose_name_plural = "API Activity Logs"
        db_table = "api_activity_logs"
        ordering = ("-created_at",)

    def __str__(self):
        return str(self.token_identifier)
