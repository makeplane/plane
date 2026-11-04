# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import models

from plane.db.models.base import BaseModel


class TelegramIntegration(BaseModel):
    workspace = models.OneToOneField("db.Workspace", on_delete=models.CASCADE, related_name="telegram_integration")
    bot_id = models.BigIntegerField(unique=True)
    bot_username = models.CharField(max_length=64)
    encrypted_bot_token = models.TextField()
    webhook_secret = models.CharField(max_length=64)

    class Meta:
        db_table = "telegram_integrations"


class TelegramProjectChat(BaseModel):
    integration = models.ForeignKey(TelegramIntegration, on_delete=models.CASCADE, related_name="project_chats")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="telegram_chats")
    chat_id = models.BigIntegerField()
    # Zero represents the general chat; positive IDs are Telegram forum topics.
    topic_id = models.BigIntegerField(default=0)
    chat_title = models.CharField(max_length=255)

    class Meta:
        db_table = "telegram_project_chats"
        constraints = [
            models.UniqueConstraint(fields=["integration", "chat_id", "topic_id"], name="telegram_chat_topic_unique"),
            models.UniqueConstraint(fields=["integration", "project"], name="telegram_project_unique"),
        ]


class TelegramUserLink(BaseModel):
    integration = models.ForeignKey(TelegramIntegration, on_delete=models.CASCADE, related_name="user_links")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    telegram_user_id = models.BigIntegerField()

    class Meta:
        db_table = "telegram_user_links"
        constraints = [
            models.UniqueConstraint(fields=["integration", "user"], name="telegram_link_user_unique"),
            models.UniqueConstraint(
                fields=["integration", "telegram_user_id"], name="telegram_link_telegram_user_unique"
            ),
        ]


class TelegramLinkToken(BaseModel):
    integration = models.ForeignKey(TelegramIntegration, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    token_hash = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "telegram_link_tokens"


class TelegramProcessedUpdate(BaseModel):
    integration = models.ForeignKey(TelegramIntegration, on_delete=models.CASCADE)
    update_id = models.BigIntegerField()

    class Meta:
        db_table = "telegram_processed_updates"
        constraints = [models.UniqueConstraint(fields=["integration", "update_id"], name="telegram_update_unique")]
