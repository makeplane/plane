# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from uuid import uuid4

# Django imports
from django.db import models
from django.conf import settings
from django.contrib.postgres.fields import ArrayField

from .base import BaseModel

# Scopes an API token can be granted. Each HTTP method needs exactly one of them
# (see required_scope in plane/api/middleware/api_authentication.py).
API_TOKEN_SCOPE_READ = "read"
API_TOKEN_SCOPE_WRITE = "write"
API_TOKEN_SCOPE_DELETE = "delete"
API_TOKEN_SCOPES = (API_TOKEN_SCOPE_READ, API_TOKEN_SCOPE_WRITE, API_TOKEN_SCOPE_DELETE)


def generate_label_token():
    return uuid4().hex


def generate_token():
    return "plane_api_" + uuid4().hex


def default_api_token_scopes():
    # Every scope, so tokens created before scopes existed keep full access
    return list(API_TOKEN_SCOPES)


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
    user_type = models.PositiveSmallIntegerField(choices=((0, "Human"), (1, "Bot")), default=0)
    workspace = models.ForeignKey("db.Workspace", related_name="api_tokens", on_delete=models.CASCADE, null=True)
    expired_at = models.DateTimeField(blank=True, null=True)
    scopes = ArrayField(
        models.CharField(max_length=16),
        default=default_api_token_scopes,
        help_text="Scopes granted to this token: read, write and/or delete",
    )

    class Meta:
        verbose_name = "API Token"
        verbose_name_plural = "API Tokems"
        db_table = "api_tokens"
        ordering = ("-created_at",)

    def __str__(self):
        return str(self.user.id)


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
