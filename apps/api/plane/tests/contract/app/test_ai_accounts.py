# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests: AI account management endpoints (internal app API, session auth)."""

import pytest
from rest_framework import status

from plane.ai_accounts.constants import BOT_TYPE_AI_AGENT
from plane.ai_accounts.models import AIAccount
from plane.db.models import APIToken, Project, ProjectMember, User, WorkspaceMember


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project, member=create_user, role=20, is_active=True
    )
    return project


@pytest.fixture
def member_user(db):
    """A non-admin workspace member."""
    user = User.objects.create(email="member@plane.so", username="member-user")
    user.set_password("password")
    user.save()
    return user


def accounts_url(slug):
    return f"/api/workspaces/{slug}/ai-accounts/"


@pytest.mark.contract
class TestAIAccountManagement:
    def test_create_account_returns_token_once(self, session_client, workspace):
        response = session_client.post(
            accounts_url(workspace.slug),
            {"name": "review-bot", "description": "RENG reviewer", "role": 15},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.data
        assert data["token"].startswith("plane_api_")
        assert data["bot_user"]["is_bot"] is True
        assert data["bot_user"]["bot_type"] == BOT_TYPE_AI_AGENT

        account = AIAccount.objects.get(pk=data["id"])
        token = APIToken.objects.get(user=account.bot_user)
        assert token.is_service is True
        assert token.user_type == 1
        # Bot joined the workspace as a member
        assert WorkspaceMember.objects.filter(
            workspace=workspace, member=account.bot_user, role=15, is_active=True
        ).exists()

    def test_create_forbidden_for_non_admin(
        self, api_client, workspace, member_user
    ):
        WorkspaceMember.objects.create(
            workspace=workspace, member=member_user, role=15, is_active=True
        )
        api_client.force_authenticate(user=member_user)
        response = api_client.post(
            accounts_url(workspace.slug), {"name": "x", "role": 15}, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_and_detail(self, session_client, workspace):
        create = session_client.post(
            accounts_url(workspace.slug), {"name": "bot-1", "role": 15}, format="json"
        )
        account_id = create.data["id"]

        response = session_client.get(accounts_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert "token" not in response.data[0]

        response = session_client.get(f"{accounts_url(workspace.slug)}{account_id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "bot-1"
        assert "token" not in response.data

    def test_patch_deactivate_disables_token(self, session_client, workspace):
        create = session_client.post(
            accounts_url(workspace.slug), {"name": "bot-2", "role": 15}, format="json"
        )
        account = AIAccount.objects.get(pk=create.data["id"])

        response = session_client.patch(
            f"{accounts_url(workspace.slug)}{account.id}/",
            {"is_active": False},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_active"] is False
        assert not APIToken.objects.get(user=account.bot_user).is_active

    def test_patch_avatar_sets_bot_user_avatar(self, session_client, workspace):
        create = session_client.post(
            accounts_url(workspace.slug), {"name": "bot-avatar", "role": 15}, format="json"
        )
        account = AIAccount.objects.get(pk=create.data["id"])

        response = session_client.patch(
            f"{accounts_url(workspace.slug)}{account.id}/",
            {"avatar": "/api/assets/v2/user-assets/some-asset/"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        account.bot_user.refresh_from_db()
        assert account.bot_user.avatar == "/api/assets/v2/user-assets/some-asset/"
        assert account.bot_user.avatar_asset is None
        assert response.data["bot_user"]["avatar_url"] == "/api/assets/v2/user-assets/some-asset/"

        # Omitting the key leaves the avatar untouched; empty string clears it
        session_client.patch(
            f"{accounts_url(workspace.slug)}{account.id}/",
            {"description": "no avatar key"},
            format="json",
        )
        account.bot_user.refresh_from_db()
        assert account.bot_user.avatar == "/api/assets/v2/user-assets/some-asset/"
        session_client.patch(
            f"{accounts_url(workspace.slug)}{account.id}/", {"avatar": ""}, format="json"
        )
        account.bot_user.refresh_from_db()
        assert account.bot_user.avatar == ""

    def test_delete_disables_everything(self, session_client, workspace):
        create = session_client.post(
            accounts_url(workspace.slug), {"name": "bot-3", "role": 15}, format="json"
        )
        account = AIAccount.objects.get(pk=create.data["id"])

        response = session_client.delete(f"{accounts_url(workspace.slug)}{account.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not APIToken.objects.get(user=account.bot_user).is_active
        assert not WorkspaceMember.objects.get(
            workspace=workspace, member=account.bot_user
        ).is_active

    def test_scopes_replace(self, session_client, workspace, project):
        create = session_client.post(
            accounts_url(workspace.slug), {"name": "bot-4", "role": 15}, format="json"
        )
        account_id = create.data["id"]

        response = session_client.put(
            f"{accounts_url(workspace.slug)}{account_id}/scopes/",
            {
                "scopes": [
                    {
                        "project": str(project.id),
                        "resource_type": "work_item",
                        "action": "read",
                    },
                    {"project": None, "resource_type": "comment", "action": "create"},
                ]
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

        # Second PUT replaces rather than appends
        response = session_client.put(
            f"{accounts_url(workspace.slug)}{account_id}/scopes/",
            {"scopes": [{"project": None, "resource_type": "state", "action": "read"}]},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["resource_type"] == "state"

    def test_scopes_reject_foreign_project(self, session_client, workspace, project):
        import uuid

        create = session_client.post(
            accounts_url(workspace.slug), {"name": "bot-5", "role": 15}, format="json"
        )
        # A project id that does not exist in this workspace
        response = session_client.put(
            f"{accounts_url(workspace.slug)}{create.data['id']}/scopes/",
            {
                "scopes": [
                    {
                        "project": str(uuid.uuid4()),
                        "resource_type": "work_item",
                        "action": "read",
                    }
                ]
            },
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
