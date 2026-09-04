# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests: AI account management endpoints (internal app API, session auth)."""

from uuid import uuid4

import pytest
from rest_framework import status

from plane.ai_accounts.constants import BOT_TYPE_AI_AGENT
from plane.ai_accounts.models import AIAccount
from plane.db.models import APIToken, FileAsset, Project, ProjectMember, User, WorkspaceMember


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

    def test_create_joins_existing_projects(self, session_client, workspace, project):
        create = session_client.post(
            accounts_url(workspace.slug), {"name": "bot-join", "role": 15}, format="json"
        )
        account = AIAccount.objects.get(pk=create.data["id"])
        assert ProjectMember.objects.filter(
            project=project, member=account.bot_user, role=15, is_active=True
        ).exists()

    def test_new_project_auto_adds_bot(self, session_client, workspace, create_user):
        create = session_client.post(
            accounts_url(workspace.slug), {"name": "bot-inherit", "role": 15}, format="json"
        )
        account = AIAccount.objects.get(pk=create.data["id"])

        # A project created after the account picks the bot up via signal
        new_project = Project.objects.create(
            name="Later Project", identifier="LP", workspace=workspace, created_by=create_user
        )
        assert ProjectMember.objects.filter(
            project=new_project, member=account.bot_user, role=15, is_active=True
        ).exists()

        # Deactivated membership is reactivated when the project signal re-fires
        # (covered by create path above); inactive accounts are not added
        account.is_active = False
        account.save()
        other_project = Project.objects.create(
            name="Other Project", identifier="OP", workspace=workspace, created_by=create_user
        )
        assert not ProjectMember.objects.filter(
            project=other_project, member=account.bot_user
        ).exists()

    def test_new_project_skips_bot_without_workspace_membership(
        self, session_client, workspace, create_user
    ):
        create = session_client.post(
            accounts_url(workspace.slug), {"name": "bot-removed", "role": 15}, format="json"
        )
        account = AIAccount.objects.get(pk=create.data["id"])
        # The bot was removed from the workspace but the account stayed active;
        # the signal must not re-activate it in new projects
        WorkspaceMember.objects.filter(
            workspace=workspace, member=account.bot_user
        ).update(is_active=False)

        project = Project.objects.create(
            name="Skip Project", identifier="SP", workspace=workspace, created_by=create_user
        )
        assert not ProjectMember.objects.filter(
            project=project, member=account.bot_user
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

        # Avatar assets are workspace assets bound to the bot user
        asset = FileAsset.objects.create(
            attributes={"name": "avatar.png", "type": "image/png", "size": 100},
            asset=f"{workspace.id}/avatar.png",
            size=100,
            workspace=workspace,
            entity_type="USER_AVATAR",
            entity_identifier=str(account.bot_user.id),
            is_uploaded=True,
        )

        response = session_client.patch(
            f"{accounts_url(workspace.slug)}{account.id}/",
            {"avatar": asset.asset_url},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        account.bot_user.refresh_from_db()
        assert account.bot_user.avatar_asset_id == asset.id
        assert account.bot_user.avatar == ""
        assert response.data["bot_user"]["avatar_url"] == asset.asset_url

        # Unknown or malformed asset references are rejected
        response = session_client.patch(
            f"{accounts_url(workspace.slug)}{account.id}/",
            {"avatar": "/api/assets/v2/static/not-a-uuid/"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        response = session_client.patch(
            f"{accounts_url(workspace.slug)}{account.id}/",
            {"avatar": f"/api/assets/v2/static/{uuid4()}/"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Assets uploaded for a different entity cannot be attached
        other_asset = FileAsset.objects.create(
            attributes={"name": "other.png", "type": "image/png", "size": 100},
            asset=f"{workspace.id}/other.png",
            size=100,
            workspace=workspace,
            entity_type="USER_AVATAR",
            entity_identifier=str(uuid4()),
            is_uploaded=True,
        )
        response = session_client.patch(
            f"{accounts_url(workspace.slug)}{account.id}/",
            {"avatar": other_asset.asset_url},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Omitting the key leaves the avatar untouched; empty string clears it
        # and deletes the previously attached asset
        session_client.patch(
            f"{accounts_url(workspace.slug)}{account.id}/",
            {"description": "no avatar key"},
            format="json",
        )
        account.bot_user.refresh_from_db()
        assert account.bot_user.avatar_asset_id == asset.id
        session_client.patch(
            f"{accounts_url(workspace.slug)}{account.id}/", {"avatar": ""}, format="json"
        )
        account.bot_user.refresh_from_db()
        assert account.bot_user.avatar_asset_id is None
        assert account.bot_user.avatar == ""
        asset.refresh_from_db()
        assert asset.is_deleted is True

    def test_patch_with_invalid_avatar_changes_nothing(self, session_client, workspace):
        create = session_client.post(
            accounts_url(workspace.slug), {"name": "bot-atomic", "role": 15}, format="json"
        )
        account = AIAccount.objects.get(pk=create.data["id"])

        # An invalid avatar must reject the whole PATCH, not just the avatar part
        response = session_client.patch(
            f"{accounts_url(workspace.slug)}{account.id}/",
            {"name": "renamed", "avatar": f"/api/assets/v2/static/{uuid4()}/"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        account.refresh_from_db()
        assert account.name == "bot-atomic"

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

    def test_delete_blocked_when_bot_is_sole_project_admin(
        self, session_client, workspace, create_user
    ):
        create = session_client.post(
            accounts_url(workspace.slug), {"name": "bot-admin", "role": 15}, format="json"
        )
        account = AIAccount.objects.get(pk=create.data["id"])

        # A project where the bot ends up as the only active admin (an admin
        # promoted it through the project member endpoint)
        project = Project.objects.create(
            name="Bot Owned", identifier="BO", workspace=workspace, created_by=create_user
        )
        membership = ProjectMember.objects.get(project=project, member=account.bot_user)
        membership.role = 20
        membership.save()

        response = session_client.delete(f"{accounts_url(workspace.slug)}{account.id}/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert AIAccount.objects.filter(pk=account.pk).exists()

        # An active non-admin member does not change anything: the bot is
        # still the only admin
        member_user = User.objects.create(email="plain-member@plane.so", username="plain-member")
        ProjectMember.objects.create(
            project=project, member=member_user, role=15, workspace=workspace, is_active=True
        )
        response = session_client.delete(f"{accounts_url(workspace.slug)}{account.id}/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Promoting another admin unblocks the deletion
        ProjectMember.objects.filter(project=project, member=member_user).update(role=20)
        response = session_client.delete(f"{accounts_url(workspace.slug)}{account.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

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


@pytest.mark.contract
class TestAIAccountPolicyCache:
    def test_get_ai_account_caches_negative_result(
        self, db, create_user, django_assert_num_queries
    ):
        """A request without an AI account must hit the DB only once."""
        from plane.ai_accounts.policy import get_ai_account

        class _Request:
            def __init__(self, user):
                self.user = user

        request = _Request(create_user)
        assert get_ai_account(request) is None
        with django_assert_num_queries(0):
            assert get_ai_account(request) is None
