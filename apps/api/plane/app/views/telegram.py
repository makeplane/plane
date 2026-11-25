# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import hashlib
import hmac
import json
import re
import secrets
from datetime import timedelta
from html import escape
from urllib.parse import urljoin, urlparse

from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.bgtasks.issue_activities_task import issue_activity
from plane.bgtasks.webhook_task import model_activity
from plane.db.models import (
    Issue,
    IssueAssignee,
    Project,
    ProjectMember,
    TelegramIntegration,
    TelegramLinkToken,
    TelegramProcessedUpdate,
    TelegramProjectChat,
    TelegramUserLink,
    WorkspaceMember,
)
from plane.utils.telegram import (
    TelegramAPIError,
    decrypt_bot_token,
    encrypt_bot_token,
    telegram_api,
)


def _integration_data(integration):
    return {"id": str(integration.id), "bot_username": integration.bot_username}


def _send_message(integration, chat_id, text, topic_id=0):
    payload = {"chat_id": chat_id, "text": text}
    if topic_id:
        payload["message_thread_id"] = topic_id
    telegram_api(decrypt_bot_token(integration.encrypted_bot_token), "sendMessage", payload)


class TelegramIntegrationEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        integration = TelegramIntegration.objects.filter(workspace__slug=slug).first()
        return Response(_integration_data(integration) if integration else None)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        base_url = settings.WEB_URL or ""
        parsed_url = urlparse(base_url)
        try:
            port = parsed_url.port
        except ValueError:
            port = -1
        if (
            parsed_url.scheme != "https"
            or not parsed_url.hostname
            or (port is not None and port not in (443, 80, 88, 8443))
        ):
            return Response(
                {"error": "A public HTTPS WEB_URL is required for Telegram webhooks"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = TelegramIntegration.objects.filter(workspace__slug=slug).first()
        if existing:
            webhook_url = urljoin(base_url.rstrip("/") + "/", f"api/telegram/webhook/{existing.id}/")
            try:
                webhook = telegram_api(decrypt_bot_token(existing.encrypted_bot_token), "getWebhookInfo")
                if webhook.get("url") not in ("", webhook_url):
                    return Response(
                        {"error": "This bot now has another webhook. Plane will not replace it."},
                        status=status.HTTP_409_CONFLICT,
                    )
                telegram_api(
                    decrypt_bot_token(existing.encrypted_bot_token),
                    "setWebhook",
                    {
                        "url": webhook_url,
                        "secret_token": existing.webhook_secret,
                        "allowed_updates": ["message"],
                    },
                )
            except TelegramAPIError:
                return Response(
                    {"error": "Could not register the Telegram webhook"}, status=status.HTTP_502_BAD_GATEWAY
                )
            return Response(_integration_data(existing))

        token = request.data.get("bot_token")
        if not isinstance(token, str) or len(token) > 128 or not re.fullmatch(r"[1-9]\d*:[A-Za-z0-9_-]+", token):
            return Response({"bot_token": "Invalid bot token"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            bot = telegram_api(token, "getMe")
            if not bot.get("is_bot") or not bot.get("username"):
                return Response({"bot_token": "Invalid Telegram bot"}, status=status.HTTP_400_BAD_REQUEST)
            webhook = telegram_api(token, "getWebhookInfo")
            if webhook.get("url"):
                return Response(
                    {"bot_token": "This bot already has a webhook. Remove it before connecting to Plane."},
                    status=status.HTTP_409_CONFLICT,
                )
            integration = TelegramIntegration.objects.create(
                workspace_id=WorkspaceMember.objects.get(
                    workspace__slug=slug, member=request.user, is_active=True
                ).workspace_id,
                bot_id=bot["id"],
                bot_username=bot["username"],
                encrypted_bot_token=encrypt_bot_token(token),
                webhook_secret=secrets.token_urlsafe(32),
            )
            webhook_url = urljoin(base_url.rstrip("/") + "/", f"api/telegram/webhook/{integration.id}/")
            telegram_api(
                token,
                "setWebhook",
                {
                    "url": webhook_url,
                    "secret_token": integration.webhook_secret,
                    "allowed_updates": ["message"],
                },
            )
        except IntegrityError:
            return Response(
                {"error": "This bot is already connected to a workspace"},
                status=status.HTTP_409_CONFLICT,
            )
        except TelegramAPIError:
            return Response(
                {"error": "Could not connect the Telegram bot or register its webhook"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response(_integration_data(integration), status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug):
        integration = TelegramIntegration.objects.filter(workspace__slug=slug).first()
        if not integration:
            return Response(status=status.HTTP_204_NO_CONTENT)
        try:
            telegram_api(decrypt_bot_token(integration.encrypted_bot_token), "deleteWebhook")
        except TelegramAPIError:
            return Response(
                {"error": "Could not remove the Telegram webhook"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        integration.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TelegramProjectChatEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        chats = TelegramProjectChat.objects.filter(integration__workspace__slug=slug)
        return Response(
            [
                {
                    "id": str(chat.id),
                    "project_id": str(chat.project_id),
                    "chat_id": chat.chat_id,
                    "topic_id": chat.topic_id,
                    "chat_title": chat.chat_title,
                }
                for chat in chats
            ]
        )

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        integration = TelegramIntegration.objects.filter(workspace__slug=slug).first()
        if not integration:
            return Response({"error": "Connect a Telegram bot first"}, status=status.HTTP_409_CONFLICT)
        project = Project.objects.filter(
            id=request.data.get("project_id"), workspace__slug=slug, archived_at__isnull=True
        ).first()
        if not project:
            return Response({"project_id": "Invalid project"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            chat_id = int(request.data.get("chat_id"))
            topic_id = int(request.data.get("topic_id") or 0)
            if not chat_id or abs(chat_id) >= 2**63 or not 0 <= topic_id < 2**63:
                raise ValueError
        except (TypeError, ValueError):
            return Response({"chat_id": "Invalid chat or topic ID"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = decrypt_bot_token(integration.encrypted_bot_token)
            chat = telegram_api(token, "getChat", {"chat_id": chat_id})
            member = telegram_api(token, "getChatMember", {"chat_id": chat_id, "user_id": integration.bot_id})
            if chat.get("type") not in ("group", "supergroup") or member.get("status") not in (
                "creator",
                "administrator",
                "member",
            ):
                return Response({"chat_id": "Bot must belong to a Telegram group"}, status=400)
        except TelegramAPIError:
            return Response({"chat_id": "Could not verify the Telegram group"}, status=400)

        try:
            mapping = TelegramProjectChat.objects.create(
                integration=integration,
                project=project,
                chat_id=chat_id,
                topic_id=topic_id,
                chat_title=chat.get("title", "Telegram group")[:255],
            )
        except IntegrityError:
            return Response({"error": "Project or chat topic is already mapped"}, status=409)
        return Response({"id": str(mapping.id)}, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, pk):
        mapping = TelegramProjectChat.objects.filter(id=pk, integration__workspace__slug=slug).first()
        if not mapping:
            return Response(status=status.HTTP_404_NOT_FOUND)
        mapping.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TelegramUserLinkEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        integration = TelegramIntegration.objects.filter(workspace__slug=slug).first()
        link = (
            TelegramUserLink.objects.filter(integration=integration, user=request.user).first() if integration else None
        )
        return Response(
            {
                "available": bool(integration),
                "bot_username": integration.bot_username if integration else None,
                "linked": bool(link),
                "telegram_user_id": link.telegram_user_id if link else None,
            }
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request, slug):
        integration = TelegramIntegration.objects.filter(workspace__slug=slug).first()
        if not integration:
            return Response({"error": "Telegram is not connected"}, status=status.HTTP_409_CONFLICT)
        code = secrets.token_urlsafe(24)
        TelegramLinkToken.objects.filter(integration=integration, user=request.user).delete(soft=False)
        TelegramLinkToken.objects.create(
            integration=integration,
            user=request.user,
            token_hash=hashlib.sha256(code.encode()).hexdigest(),
            expires_at=timezone.now() + timedelta(minutes=15),
        )
        return Response({"link_url": f"https://t.me/{integration.bot_username}?start={code}"})

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def delete(self, request, slug):
        TelegramUserLink.objects.filter(integration__workspace__slug=slug, user=request.user).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TelegramWebhookEndpoint(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, integration_id):
        integration = TelegramIntegration.objects.filter(id=integration_id).first()
        secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
        if not integration or not hmac.compare_digest(secret, integration.webhook_secret):
            return Response(status=status.HTTP_403_FORBIDDEN)
        if not isinstance(request.data, dict):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        update_id = request.data.get("update_id")
        if not isinstance(update_id, int) or isinstance(update_id, bool):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            _, created = TelegramProcessedUpdate.objects.get_or_create(integration=integration, update_id=update_id)
            if not created:
                return Response(status=status.HTTP_200_OK)
            message = request.data.get("message")
            if not isinstance(message, dict):
                return Response(status=status.HTTP_200_OK)
            reply = self._handle_message(integration, message)

        if reply:
            try:
                _send_message(integration, reply[0], reply[1], reply[2])
            except TelegramAPIError:
                # The command has already been processed; retrying it could create a duplicate work item.
                pass
        return Response(status=status.HTTP_200_OK)

    @staticmethod
    def _handle_message(integration, message):
        chat = message.get("chat") or {}
        sender = message.get("from") or {}
        text = message.get("text") or ""
        if not isinstance(chat, dict) or not isinstance(sender, dict) or not isinstance(text, str):
            return None
        chat_id = chat.get("id")
        user_id = sender.get("id")
        topic_id = message.get("message_thread_id") or 0
        if (
            not isinstance(chat_id, int)
            or isinstance(chat_id, bool)
            or not isinstance(user_id, int)
            or isinstance(user_id, bool)
            or sender.get("is_bot")
        ):
            return None
        if chat.get("type") == "private" and text.startswith("/start "):
            code = text.split(maxsplit=1)[1].strip()
            pending = (
                TelegramLinkToken.objects.select_for_update()
                .filter(
                    integration=integration,
                    token_hash=hashlib.sha256(code.encode()).hexdigest(),
                    expires_at__gt=timezone.now(),
                )
                .first()
            )
            if not pending or sender.get("is_bot"):
                return (chat_id, "This Plane link has expired. Generate a new link in Plane.", 0)
            if not WorkspaceMember.objects.filter(
                workspace=integration.workspace, member=pending.user, is_active=True
            ).exists():
                return (chat_id, "Your Plane workspace membership is inactive.", 0)
            TelegramUserLink.objects.filter(integration=integration, user=pending.user).delete(soft=False)
            TelegramUserLink.objects.filter(integration=integration, telegram_user_id=user_id).delete(soft=False)
            TelegramUserLink.objects.create(integration=integration, user=pending.user, telegram_user_id=user_id)
            pending.delete(soft=False)
            return (chat_id, "Your Telegram account is linked to Plane.", 0)

        command = text.split(maxsplit=2)
        if not command or command[0].lower() not in (
            "/plane",
            f"/plane@{integration.bot_username.lower()}",
        ):
            return None
        if len(command) >= 2 and command[1] == "chat":
            return (chat_id, f"Chat ID: {chat_id}\nTopic ID: {topic_id}", topic_id)
        if len(command) < 3 or command[1] != "create" or not command[2].strip():
            return (chat_id, "Use /plane create <title> or /plane chat.", topic_id)
        mapping = (
            TelegramProjectChat.objects.select_related("project")
            .filter(integration=integration, chat_id=chat_id, topic_id=topic_id)
            .first()
        )
        if not mapping or mapping.project.archived_at:
            return (chat_id, "This chat is not mapped to a Plane project.", topic_id)
        link = TelegramUserLink.objects.filter(integration=integration, telegram_user_id=user_id).first()
        workspace_member = (
            WorkspaceMember.objects.filter(workspace=integration.workspace, member=link.user, is_active=True).first()
            if link
            else None
        )
        project_member = (
            ProjectMember.objects.filter(project=mapping.project, member=link.user, is_active=True).first()
            if workspace_member
            else None
        )
        if not project_member or (
            project_member.role not in (ROLE.ADMIN.value, ROLE.MEMBER.value)
            and workspace_member.role != ROLE.ADMIN.value
        ):
            return (chat_id, "Link your Plane account and join this project to create work items.", topic_id)
        title = command[2].strip()
        if len(title) > 255:
            return (chat_id, "Work item titles must be 255 characters or fewer.", topic_id)
        quoted = message.get("reply_to_message") or {}
        description = quoted.get("text") if isinstance(quoted, dict) else None
        issue = Issue(project=mapping.project, name=title, created_by=link.user)
        if isinstance(description, str) and description:
            issue.description_html = f"<p>{escape(description)}</p>"
        issue.save(disable_auto_set_user=True)
        default_assignee_id = mapping.project.default_assignee_id
        if (
            default_assignee_id
            and ProjectMember.objects.filter(
                project=mapping.project,
                member_id=default_assignee_id,
                role__gte=ROLE.MEMBER.value,
                is_active=True,
            ).exists()
        ):
            IssueAssignee.objects.bulk_create(
                [
                    IssueAssignee(
                        issue=issue,
                        assignee_id=default_assignee_id,
                        project=mapping.project,
                        workspace=integration.workspace,
                        created_by_id=issue.created_by_id,
                        updated_by_id=issue.updated_by_id,
                    )
                ]
            )
        transaction.on_commit(
            lambda: issue_activity.delay(
                type="issue.activity.created",
                requested_data=json.dumps(
                    {"name": title, "description_html": issue.description_html}, cls=DjangoJSONEncoder
                ),
                actor_id=str(link.user_id),
                issue_id=str(issue.id),
                project_id=str(mapping.project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=settings.APP_BASE_URL or settings.WEB_URL,
            )
        )
        transaction.on_commit(
            lambda: model_activity.delay(
                model_name="issue",
                model_id=str(issue.id),
                requested_data={"name": title},
                current_instance=None,
                actor_id=str(link.user_id),
                slug=integration.workspace.slug,
                origin=settings.APP_BASE_URL or settings.WEB_URL,
            )
        )
        identifier = f"{mapping.project.identifier}-{issue.sequence_id}"
        return (chat_id, f"Created {identifier}: {title}", topic_id)
