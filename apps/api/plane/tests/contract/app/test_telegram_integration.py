# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
from datetime import timedelta
from unittest.mock import patch

import pytest
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APIClient

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
from plane.bgtasks.telegram_task import send_telegram_issue_event
from plane.bgtasks.issue_activities_task import issue_activity
from plane.bgtasks.cleanup_task import delete_expired_telegram_records
from plane.tests.factories import UserFactory, WorkspaceFactory
from plane.utils.telegram import TelegramRetryableError


def _telegram_api(_token, method, _payload=None):
    if method == "getMe":
        return {"id": 123456789, "username": "plane_test_bot", "is_bot": True}
    if method == "getWebhookInfo":
        return {"url": ""}
    if method == "getChat":
        return {"id": -100123, "title": "Engineering", "type": "supergroup"}
    if method == "getChatMember":
        return {"status": "member"}
    return True


@pytest.fixture
def telegram_setup(workspace, create_user):
    client = APIClient()
    client.force_authenticate(user=create_user)
    with (
        override_settings(WEB_URL="https://plane.example"),
        patch("plane.app.views.telegram.telegram_api", side_effect=_telegram_api),
    ):
        response = client.post(
            f"/api/workspaces/{workspace.slug}/telegram/",
            {"bot_token": "123456789:test-token"},
            format="json",
        )
    assert response.status_code == 201
    return client, TelegramIntegration.objects.get(workspace=workspace)


@pytest.mark.contract
@pytest.mark.django_db
def test_telegram_connect_keeps_token_private_and_registers_secret(workspace, create_user):
    client = APIClient()
    client.force_authenticate(user=create_user)
    with (
        override_settings(WEB_URL="https://plane.example"),
        patch("plane.app.views.telegram.telegram_api", side_effect=_telegram_api) as api,
    ):
        response = client.post(
            f"/api/workspaces/{workspace.slug}/telegram/",
            {"bot_token": "123456789:test-token"},
            format="json",
        )
    assert response.status_code == 201
    assert set(response.data) == {"id", "bot_username"}
    integration = TelegramIntegration.objects.get(workspace=workspace)
    assert "test-token" not in integration.encrypted_bot_token
    webhook_call = api.call_args_list[-1]
    assert webhook_call.args[1] == "setWebhook"
    assert webhook_call.args[2]["url"] == f"https://plane.example/api/telegram/webhook/{integration.id}/"
    assert webhook_call.args[2]["secret_token"] == integration.webhook_secret


@pytest.mark.contract
@pytest.mark.django_db
def test_telegram_connect_does_not_replace_another_webhook(workspace, create_user):
    client = APIClient()
    client.force_authenticate(user=create_user)

    def existing_webhook(token, method, payload=None):
        if method == "getWebhookInfo":
            return {"url": "https://another-app.example/webhook"}
        return _telegram_api(token, method, payload)

    with (
        override_settings(WEB_URL="https://plane.example"),
        patch("plane.app.views.telegram.telegram_api", side_effect=existing_webhook) as api,
    ):
        response = client.post(
            f"/api/workspaces/{workspace.slug}/telegram/",
            {"bot_token": "123456789:test-token"},
            format="json",
        )
    assert response.status_code == 409
    assert not TelegramIntegration.objects.filter(workspace=workspace).exists()
    assert all(call.args[1] != "setWebhook" for call in api.call_args_list)


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("web_url", ["http://plane.example", "https://plane.example:3000"])
def test_telegram_connect_rejects_unsupported_webhook_url(workspace, create_user, web_url):
    client = APIClient()
    client.force_authenticate(user=create_user)
    with (
        override_settings(WEB_URL=web_url),
        patch("plane.app.views.telegram.telegram_api") as api,
    ):
        response = client.post(
            f"/api/workspaces/{workspace.slug}/telegram/",
            {"bot_token": "123456789:test-token"},
            format="json",
        )
    assert response.status_code == 400
    api.assert_not_called()


@pytest.mark.contract
@pytest.mark.django_db
def test_telegram_connect_can_retry_uncertain_webhook_registration(workspace, create_user):
    client = APIClient()
    client.force_authenticate(user=create_user)
    failures = 0

    def flaky_webhook(token, method, payload=None):
        nonlocal failures
        if method == "setWebhook" and failures == 0:
            failures += 1
            raise TelegramRetryableError("Timeout after registration")
        return _telegram_api(token, method, payload)

    with (
        override_settings(WEB_URL="https://plane.example"),
        patch("plane.app.views.telegram.telegram_api", side_effect=flaky_webhook),
    ):
        first = client.post(
            f"/api/workspaces/{workspace.slug}/telegram/",
            {"bot_token": "123456789:test-token"},
            format="json",
        )
        integration = TelegramIntegration.objects.get(workspace=workspace)
        second = client.post(f"/api/workspaces/{workspace.slug}/telegram/", {}, format="json")

    assert first.status_code == 502
    assert second.status_code == 200
    assert second.data["id"] == str(integration.id)
    assert TelegramIntegration.objects.filter(workspace=workspace).count() == 1


@pytest.mark.contract
@pytest.mark.django_db
def test_telegram_mapping_rejects_other_workspace_project(telegram_setup, workspace):
    client, integration = telegram_setup
    other = WorkspaceFactory(owner=UserFactory())
    project = Project.objects.create(workspace=other, name="Other", identifier="OTH")
    with patch("plane.app.views.telegram.telegram_api", side_effect=_telegram_api) as api:
        response = client.post(
            f"/api/workspaces/{workspace.slug}/telegram/chats/",
            {"project_id": str(project.id), "chat_id": -100123},
            format="json",
        )
    assert response.status_code == 400
    assert not TelegramProjectChat.objects.filter(integration=integration).exists()
    api.assert_not_called()


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("command", ["/plane", "/plane@plane_test_bot"])
def test_telegram_webhook_requires_secret_and_only_creates_once(telegram_setup, workspace, create_user, command):
    _client, integration = telegram_setup
    project = Project.objects.create(workspace=workspace, name="Engineering", identifier="ENG")
    ProjectMember.objects.create(workspace=workspace, project=project, member=create_user, role=15)
    TelegramProjectChat.objects.create(
        integration=integration, project=project, chat_id=-100123, chat_title="Engineering"
    )
    TelegramUserLink.objects.create(integration=integration, user=create_user, telegram_user_id=987654321)
    webhook = f"/api/telegram/webhook/{integration.id}/"
    update = {
        "update_id": 42,
        "message": {
            "chat": {"id": -100123, "type": "supergroup"},
            "from": {"id": 987654321},
            "text": f"{command} create Write release notes",
        },
    }
    client = APIClient()
    assert client.post(webhook, update, format="json").status_code == 403
    assert not TelegramProcessedUpdate.objects.exists()

    with patch("plane.app.views.telegram.telegram_api", side_effect=_telegram_api):
        first = client.post(
            webhook, update, format="json", HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN=integration.webhook_secret
        )
        second = client.post(
            webhook, update, format="json", HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN=integration.webhook_secret
        )
    assert first.status_code == second.status_code == 200
    assert Issue.objects.filter(project=project, name="Write release notes", created_by=create_user).count() == 1
    assert TelegramProcessedUpdate.objects.filter(integration=integration, update_id=42).count() == 1


@pytest.mark.contract
@pytest.mark.django_db
def test_telegram_webhook_denies_unlinked_and_guest_users(telegram_setup, workspace, create_user):
    _client, integration = telegram_setup
    guest = UserFactory()
    WorkspaceMember.objects.create(workspace=workspace, member=guest, role=15)
    project = Project.objects.create(workspace=workspace, name="Engineering", identifier="ENG")
    ProjectMember.objects.create(workspace=workspace, project=project, member=guest, role=5)
    TelegramProjectChat.objects.create(
        integration=integration, project=project, chat_id=-100123, chat_title="Engineering"
    )
    webhook = f"/api/telegram/webhook/{integration.id}/"
    client = APIClient()
    base = {
        "message": {
            "chat": {"id": -100123, "type": "supergroup"},
            "from": {"id": 987654321},
            "text": "/plane create Restricted issue",
        }
    }
    with patch("plane.app.views.telegram.telegram_api", side_effect=_telegram_api):
        assert (
            client.post(
                webhook,
                {**base, "update_id": 1},
                format="json",
                HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN=integration.webhook_secret,
            ).status_code
            == 200
        )
        TelegramUserLink.objects.create(integration=integration, user=guest, telegram_user_id=987654321)
        assert (
            client.post(
                webhook,
                {**base, "update_id": 2},
                format="json",
                HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN=integration.webhook_secret,
            ).status_code
            == 200
        )
    assert not Issue.objects.filter(name="Restricted issue").exists()


@pytest.mark.contract
@pytest.mark.django_db
def test_telegram_create_matches_workspace_admin_permission_and_default_assignee(
    telegram_setup, workspace, create_user
):
    _client, integration = telegram_setup
    assignee = UserFactory()
    project = Project.objects.create(
        workspace=workspace, name="Engineering", identifier="ENG", default_assignee=assignee
    )
    ProjectMember.objects.create(workspace=workspace, project=project, member=create_user, role=5)
    ProjectMember.objects.create(workspace=workspace, project=project, member=assignee, role=15)
    TelegramProjectChat.objects.create(
        integration=integration, project=project, chat_id=-100123, chat_title="Engineering"
    )
    TelegramUserLink.objects.create(integration=integration, user=create_user, telegram_user_id=987654321)
    update = {
        "update_id": 43,
        "message": {
            "chat": {"id": -100123, "type": "supergroup"},
            "from": {"id": 987654321, "is_bot": False},
            "text": "/plane create Ship release",
        },
    }
    with patch("plane.app.views.telegram.telegram_api", side_effect=_telegram_api):
        response = APIClient().post(
            f"/api/telegram/webhook/{integration.id}/",
            update,
            format="json",
            HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN=integration.webhook_secret,
        )
    assert response.status_code == 200
    issue = Issue.objects.get(project=project, name="Ship release")
    assert issue.created_by == create_user
    assert IssueAssignee.objects.filter(issue=issue, assignee=assignee).exists()


@pytest.mark.contract
@pytest.mark.django_db
def test_telegram_account_link_is_private_and_one_time(telegram_setup, workspace, create_user):
    user_client, integration = telegram_setup
    response = user_client.post(f"/api/workspaces/{workspace.slug}/telegram/link/")
    assert response.status_code == 200
    code = response.data["link_url"].split("start=", 1)[1]
    webhook = f"/api/telegram/webhook/{integration.id}/"
    base = {
        "message": {
            "chat": {"id": 987654321, "type": "private"},
            "from": {"id": 987654321, "is_bot": False},
            "text": f"/start {code}",
        }
    }
    client = APIClient()
    with patch("plane.app.views.telegram.telegram_api", side_effect=_telegram_api):
        assert (
            client.post(
                webhook,
                {
                    "update_id": 0,
                    "message": {**base["message"], "chat": {"id": -100123, "type": "supergroup"}},
                },
                format="json",
                HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN=integration.webhook_secret,
            ).status_code
            == 200
        )
        assert not TelegramUserLink.objects.filter(integration=integration).exists()
        assert (
            client.post(
                webhook,
                {**base, "update_id": 1},
                format="json",
                HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN=integration.webhook_secret,
            ).status_code
            == 200
        )
        assert (
            client.post(
                webhook,
                {**base, "update_id": 2},
                format="json",
                HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN=integration.webhook_secret,
            ).status_code
            == 200
        )
    assert (
        TelegramUserLink.objects.filter(integration=integration, user=create_user, telegram_user_id=987654321).count()
        == 1
    )
    assert not TelegramLinkToken.objects.filter(integration=integration).exists()


@pytest.mark.contract
@pytest.mark.django_db
def test_telegram_sends_created_event_to_mapped_chat(telegram_setup, workspace, create_user):
    _client, integration = telegram_setup
    project = Project.objects.create(workspace=workspace, name="Engineering", identifier="ENG")
    TelegramProjectChat.objects.create(
        integration=integration, project=project, chat_id=-100123, chat_title="Engineering"
    )
    issue = Issue(project=project, name="Ship release", created_by=create_user)
    issue.save(disable_auto_set_user=True)
    with (
        override_settings(APP_BASE_URL="https://plane.example"),
        patch("plane.bgtasks.telegram_task.telegram_api", side_effect=_telegram_api) as api,
    ):
        send_telegram_issue_event(
            "issue.activity.created", str(issue.id), str(project.id), "[]", '{"name":"Ship release"}', None
        )
    assert api.call_args.args[1] == "sendMessage"
    payload = api.call_args.args[2]
    assert payload["chat_id"] == -100123
    assert "Ship release" in payload["text"]
    assert f"/browse/ENG-{issue.sequence_id}/" in payload["text"]


@pytest.mark.contract
@pytest.mark.django_db
def test_telegram_queue_failure_does_not_interrupt_plane_notifications(telegram_setup, workspace, create_user):
    _client, integration = telegram_setup
    project = Project.objects.create(workspace=workspace, name="Engineering", identifier="ENG")
    TelegramProjectChat.objects.create(
        integration=integration, project=project, chat_id=-100123, chat_title="Engineering"
    )
    issue = Issue(project=project, name="Ship release", created_by=create_user)
    issue.save(disable_auto_set_user=True)
    with (
        patch(
            "plane.bgtasks.issue_activities_task.send_telegram_issue_event.delay", side_effect=RuntimeError("broker")
        ),
        patch("plane.bgtasks.issue_activities_task.notifications.delay") as notifications,
    ):
        issue_activity(
            type="issue.activity.created",
            requested_data=json.dumps({"name": issue.name}),
            actor_id=str(create_user.id),
            issue_id=str(issue.id),
            project_id=str(project.id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
        )
    notifications.assert_called_once()


@pytest.mark.contract
@pytest.mark.django_db
def test_telegram_updates_include_state_assignment_and_linked_mention(telegram_setup, workspace, create_user):
    _client, integration = telegram_setup
    project = Project.objects.create(workspace=workspace, name="Engineering", identifier="ENG")
    TelegramProjectChat.objects.create(
        integration=integration, project=project, chat_id=-100123, topic_id=17, chat_title="Engineering"
    )
    TelegramUserLink.objects.create(integration=integration, user=create_user, telegram_user_id=987654321)
    issue = Issue(project=project, name="Ship release", created_by=create_user)
    issue.save(disable_auto_set_user=True)
    mention = (
        f'<mention-component entity_name="user_mention" entity_identifier="{create_user.id}">Name</mention-component>'
    )
    activities = [
        {"field": "state", "new_value": "In Progress"},
        {"field": "assignees", "new_value": create_user.display_name, "new_identifier": str(create_user.id)},
    ]
    with patch("plane.bgtasks.telegram_task.telegram_api", side_effect=_telegram_api) as api:
        send_telegram_issue_event(
            "issue.activity.updated",
            str(issue.id),
            str(project.id),
            json.dumps(activities),
            json.dumps({"description_html": mention}),
            json.dumps({"description_html": ""}),
        )
    payload = api.call_args.args[2]
    assert payload["message_thread_id"] == 17
    assert "State changed to In Progress" in payload["text"]
    assert "Assigned to" in payload["text"]
    assert 'href="tg://user?id=987654321"' in payload["text"]


@pytest.mark.contract
@pytest.mark.django_db
def test_telegram_cleanup_preserves_recent_update_ids(telegram_setup, create_user):
    _client, integration = telegram_setup
    expired = TelegramLinkToken.objects.create(
        integration=integration,
        user=create_user,
        token_hash="a" * 64,
        expires_at=timezone.now() - timedelta(minutes=1),
    )
    active = TelegramLinkToken.objects.create(
        integration=integration,
        user=create_user,
        token_hash="b" * 64,
        expires_at=timezone.now() + timedelta(minutes=10),
    )
    old_update = TelegramProcessedUpdate.objects.create(integration=integration, update_id=1)
    recent_update = TelegramProcessedUpdate.objects.create(integration=integration, update_id=2)
    TelegramProcessedUpdate.objects.filter(pk=old_update.pk).update(created_at=timezone.now() - timedelta(days=8))

    delete_expired_telegram_records()

    assert not TelegramLinkToken.objects.filter(pk=expired.pk).exists()
    assert TelegramLinkToken.objects.filter(pk=active.pk).exists()
    assert not TelegramProcessedUpdate.objects.filter(pk=old_update.pk).exists()
    assert TelegramProcessedUpdate.objects.filter(pk=recent_update.pk).exists()
