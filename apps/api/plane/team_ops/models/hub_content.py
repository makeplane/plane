# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models
from django.db.models import Q

# Module imports
from plane.db.models.base import BaseModel


class HubDoc(BaseModel):
    """A written document in the Doc Hub, with tags and an optional project it belongs to."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="team_ops_hub_docs")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="team_ops_hub_docs")
    project = models.ForeignKey(
        "db.Project", on_delete=models.SET_NULL, null=True, blank=True, related_name="team_ops_hub_docs"
    )
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True, default="")
    tags = models.JSONField(default=list, blank=True)

    class Meta:
        verbose_name = "Hub Doc"
        verbose_name_plural = "Hub Docs"
        db_table = "tops_hub_doc"
        ordering = ("-updated_at",)


class HubSecret(BaseModel):
    """A secret (password, key, token). The value is stored encrypted; the publisher decides who may read it."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="team_ops_hub_secrets")
    publisher = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="team_ops_hub_secrets"
    )
    project = models.ForeignKey(
        "db.Project", on_delete=models.SET_NULL, null=True, blank=True, related_name="team_ops_hub_secrets"
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    ciphertext = models.TextField()

    class Meta:
        verbose_name = "Hub Secret"
        verbose_name_plural = "Hub Secrets"
        db_table = "tops_hub_secret"
        ordering = ("name",)


class HubSecretAccess(BaseModel):
    """A person the publisher allowed to read a secret."""

    secret = models.ForeignKey(HubSecret, on_delete=models.CASCADE, related_name="access")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")

    class Meta:
        db_table = "tops_hub_secret_access"
        constraints = [
            models.UniqueConstraint(
                fields=["secret", "user"], condition=Q(deleted_at__isnull=True), name="tops_hub_secret_access_once"
            )
        ]


class HubSecretLog(BaseModel):
    """Who did what with a secret. It never holds the value."""

    class Action(models.TextChoices):
        CREATE = "CREATE", "Created"
        REVEAL = "REVEAL", "Revealed"
        UPDATE = "UPDATE", "Changed"
        GRANT = "GRANT", "Access given"
        REVOKE = "REVOKE", "Access removed"

    secret = models.ForeignKey(HubSecret, on_delete=models.CASCADE, related_name="log")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    action = models.CharField(max_length=10, choices=Action.choices)
    target = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta:
        db_table = "tops_hub_secret_log"
        ordering = ("-created_at",)
