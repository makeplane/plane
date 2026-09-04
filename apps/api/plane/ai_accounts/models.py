# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import models

from plane.db.models import BaseModel

from .constants import ACTION_CHOICES, RESOURCE_CHOICES


class AIAccount(BaseModel):
    """An AI service account: a bot user acting on behalf of an owner.

    The bot user (``User.is_bot=True``) can never log in interactively and only
    acts through its API tokens. The owner's permissions cap everything the
    account may do — the effective permission is the owner's role intersected
    with the account's scope policies (enforced in ``policy.py``).
    """

    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="ai_accounts"
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="owned_ai_accounts"
    )
    bot_user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ai_account"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "AI Account"
        verbose_name_plural = "AI Accounts"
        db_table = "ai_accounts"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.name} ({self.workspace.slug})"


class AIScopePolicy(BaseModel):
    """Allow-list entry: the AI account may perform ``action`` on
    ``resource_type`` inside ``project`` (null project = workspace-wide).

    Absence of a matching row means denied (default-deny).
    """

    ai_account = models.ForeignKey(
        AIAccount, on_delete=models.CASCADE, related_name="scope_policies"
    )
    project = models.ForeignKey(
        "db.Project", on_delete=models.CASCADE, null=True, blank=True, related_name="ai_scope_policies"
    )
    resource_type = models.CharField(max_length=50, choices=RESOURCE_CHOICES)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)

    class Meta:
        verbose_name = "AI Scope Policy"
        verbose_name_plural = "AI Scope Policies"
        db_table = "ai_scope_policies"
        ordering = ("-created_at",)
        unique_together = ["ai_account", "project", "resource_type", "action", "deleted_at"]

    def __str__(self):
        return f"{self.ai_account.name}: {self.action} {self.resource_type}"
