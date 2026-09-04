# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for managing AI agent bots through the regular member
endpoints (PLANE-11).

AI agent bots (``bot_type="AI_AGENT"``) are treated as regular members:
they appear in project member list/retrieve, can be removed from projects,
and can be role-edited / removed at the workspace level. Removing an AI bot
from the workspace also deactivates its service tokens and deletes the
backing AIAccount. Other bot types (e.g. WORKSPACE_SEED) stay hidden.
"""

import uuid

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.ai_accounts.constants import BOT_TYPE_AI_AGENT
from plane.ai_accounts.models import AIAccount
from plane.db.models import (
    APIToken,
    Project,
    ProjectMember,
    User,
    WorkspaceMember,
)


def _make_bot(email: str, bot_type: str | None = BOT_TYPE_AI_AGENT) -> User:
    local_part = email.split("@")[0]
    return User.objects.create(
        email=email,
        username=local_part,
        first_name=local_part,
        is_bot=True,
        bot_type=bot_type,
        is_active=True,
    )


def _add_member(workspace, project, user, *, ws_role: int = 15, project_role: int = 15) -> ProjectMember:
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=ws_role, is_active=True)
    return ProjectMember.objects.create(
        workspace=workspace, project=project, member=user, role=project_role, is_active=True
    )


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Bot Project",
        identifier="BOT",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        workspace=workspace, project=project, member=create_user, role=20, is_active=True
    )
    return project


@pytest.fixture
def admin_client(create_user):
    client = APIClient()
    client.force_authenticate(user=create_user)
    return client


@pytest.mark.contract
@pytest.mark.django_db
class TestProjectMemberAIBots:
    def test_list_includes_ai_bot_but_not_other_bots(self, workspace, project, admin_client):
        ai_bot = _make_bot("ai-bot@plane.so")
        _add_member(workspace, project, ai_bot)
        seed_bot = _make_bot("seed-bot@plane.so", bot_type="WORKSPACE_SEED")
        _add_member(workspace, project, seed_bot)

        response = admin_client.get(f"/api/workspaces/{workspace.slug}/projects/{project.id}/members/")

        assert response.status_code == status.HTTP_200_OK
        member_ids = [str(m["member"]) for m in response.data]
        assert str(ai_bot.id) in member_ids
        assert str(seed_bot.id) not in member_ids

    def test_retrieve_ai_bot(self, workspace, project, admin_client):
        ai_bot = _make_bot("ai-bot@plane.so")
        membership = _add_member(workspace, project, ai_bot)

        response = admin_client.get(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/members/{membership.id}/"
        )

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["member"]["id"]) == str(ai_bot.id)
        assert response.data["member"]["bot_type"] == BOT_TYPE_AI_AGENT

    def test_destroy_removes_ai_bot_from_project(self, workspace, project, admin_client):
        ai_bot = _make_bot("ai-bot@plane.so")
        membership = _add_member(workspace, project, ai_bot)

        response = admin_client.delete(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/members/{membership.id}/"
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT
        membership.refresh_from_db()
        assert membership.is_active is False

    def test_destroy_still_rejects_other_bot_types(self, workspace, project, admin_client):
        seed_bot = _make_bot("seed-bot@plane.so", bot_type="WORKSPACE_SEED")
        membership = _add_member(workspace, project, seed_bot)

        response = admin_client.delete(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/members/{membership.id}/"
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceMemberAIBots:
    def test_partial_update_ai_bot_role(self, workspace, create_user, admin_client):
        ai_bot = _make_bot("ai-bot@plane.so")
        ws_membership = WorkspaceMember.objects.create(
            workspace=workspace, member=ai_bot, role=15, is_active=True
        )

        response = admin_client.patch(
            f"/api/workspaces/{workspace.slug}/members/{ws_membership.id}/",
            {"role": 5},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        ws_membership.refresh_from_db()
        assert ws_membership.role == 5

    def test_destroy_ai_bot_cascades_to_ai_account(self, workspace, create_user, admin_client):
        ai_bot = _make_bot("ai-bot@plane.so")
        ws_membership = WorkspaceMember.objects.create(
            workspace=workspace, member=ai_bot, role=15, is_active=True
        )
        account = AIAccount.objects.create(
            workspace=workspace, owner=create_user, bot_user=ai_bot, name="test-bot"
        )
        token = APIToken.objects.create(
            user=ai_bot, workspace=workspace, user_type=1, is_service=True
        )

        response = admin_client.delete(f"/api/workspaces/{workspace.slug}/members/{ws_membership.id}/")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        ws_membership.refresh_from_db()
        assert ws_membership.is_active is False
        token.refresh_from_db()
        assert token.is_active is False
        assert not AIAccount.objects.filter(pk=account.pk).exists()

    def test_destroy_still_rejects_other_bot_types(self, workspace, admin_client):
        seed_bot = _make_bot("seed-bot@plane.so", bot_type="WORKSPACE_SEED")
        ws_membership = WorkspaceMember.objects.create(
            workspace=workspace, member=seed_bot, role=15, is_active=True
        )

        response = admin_client.delete(f"/api/workspaces/{workspace.slug}/members/{ws_membership.id}/")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_destroy_ai_bot_blocked_when_sole_project_admin(self, workspace, project, create_user, admin_client):
        ai_bot = _make_bot("ai-bot@plane.so")
        ws_membership = WorkspaceMember.objects.create(
            workspace=workspace, member=ai_bot, role=20, is_active=True
        )
        AIAccount.objects.create(
            workspace=workspace, owner=create_user, bot_user=ai_bot, name="test-bot"
        )
        # The bot is the only active admin of a project: the post_save signal
        # auto-joins it with its workspace role (20)
        owned_project = Project.objects.create(
            name="Bot Owned", identifier="BOWN", workspace=workspace, created_by=create_user
        )
        assert ProjectMember.objects.filter(
            project=owned_project, member=ai_bot, role=20, is_active=True
        ).exists()

        response = admin_client.delete(f"/api/workspaces/{workspace.slug}/members/{ws_membership.id}/")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        ws_membership.refresh_from_db()
        assert ws_membership.is_active is True

        # Promoting another admin unblocks the removal
        ProjectMember.objects.create(
            workspace=workspace, project=owned_project, member=create_user, role=20, is_active=True
        )
        response = admin_client.delete(f"/api/workspaces/{workspace.slug}/members/{ws_membership.id}/")

        assert response.status_code == status.HTTP_204_NO_CONTENT
