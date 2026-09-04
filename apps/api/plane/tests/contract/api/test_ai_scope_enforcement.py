# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests: AI service-account scope enforcement on the public v1 API."""

import pytest
from rest_framework import status

from plane.ai_accounts.constants import BOT_TYPE_AI_AGENT
from plane.ai_accounts.models import AIAccount, AIScopePolicy
from plane.db.models import APIToken, Issue, Project, ProjectMember, WorkspaceMember


@pytest.fixture
def project(db, workspace, create_user):
    """Project with the human user as admin member."""
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
def bot_user(db):
    from plane.db.models import User

    return User.objects.create(
        username="ai_bot_test",
        email="ai_bot_test@plane.so",
        display_name="Test Bot",
        first_name="Test Bot",
        is_bot=True,
        bot_type=BOT_TYPE_AI_AGENT,
    )


@pytest.fixture
def ai_account(db, workspace, create_user, bot_user, project):
    """AI account owned by the human user; bot is a member of both levels."""
    WorkspaceMember.objects.create(
        workspace=workspace, member=bot_user, role=15, is_active=True
    )
    ProjectMember.objects.create(
        project=project, member=bot_user, role=15, is_active=True, workspace=workspace
    )
    return AIAccount.objects.create(
        workspace=workspace, owner=create_user, bot_user=bot_user, name="test-bot"
    )


@pytest.fixture
def bot_token(db, bot_user, workspace):
    return APIToken.objects.create(
        user=bot_user,
        label="ai:test-bot",
        token="test-ai-bot-token-12345",
        user_type=1,
        is_service=True,
        workspace=workspace,
    )


@pytest.fixture
def bot_client(api_client, bot_token):
    api_client.credentials(HTTP_X_API_KEY=bot_token.token)
    return api_client


def issues_url(workspace, project):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/"


@pytest.mark.contract
class TestAIScopeEnforcement:
    """Scope policy enforcement for bot tokens on the v1 API."""

    def test_allowed_when_policy_matches(self, bot_client, ai_account, workspace, project):
        AIScopePolicy.objects.create(
            ai_account=ai_account,
            project=project,
            resource_type="work_item",
            action="read",
        )
        response = bot_client.get(issues_url(workspace, project))
        assert response.status_code == status.HTTP_200_OK

    def test_denied_without_policy(self, bot_client, ai_account, workspace, project):
        response = bot_client.get(issues_url(workspace, project))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_denied_for_other_action(self, bot_client, ai_account, workspace, project):
        AIScopePolicy.objects.create(
            ai_account=ai_account,
            project=project,
            resource_type="work_item",
            action="read",
        )
        response = bot_client.post(
            issues_url(workspace, project), {"name": "bot issue"}, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_workspace_wide_policy_applies(self, bot_client, ai_account, workspace, project):
        AIScopePolicy.objects.create(
            ai_account=ai_account,
            project=None,
            resource_type="work_item",
            action="read",
        )
        response = bot_client.get(issues_url(workspace, project))
        assert response.status_code == status.HTTP_200_OK

    def test_denied_when_account_inactive(self, bot_client, ai_account, workspace, project):
        ai_account.is_active = False
        ai_account.save()
        AIScopePolicy.objects.create(
            ai_account=ai_account,
            project=project,
            resource_type="work_item",
            action="read",
        )
        response = bot_client.get(issues_url(workspace, project))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_denied_when_owner_leaves_project(self, bot_client, ai_account, workspace, project, create_user):
        AIScopePolicy.objects.create(
            ai_account=ai_account,
            project=project,
            resource_type="work_item",
            action="read",
        )
        ProjectMember.objects.filter(project=project, member=create_user).update(
            is_active=False
        )
        response = bot_client.get(issues_url(workspace, project))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_denied_when_owner_role_below_bot(self, bot_client, ai_account, workspace, project, create_user):
        AIScopePolicy.objects.create(
            ai_account=ai_account,
            project=project,
            resource_type="work_item",
            action="read",
        )
        # Bot somehow holds a higher project role than its owner
        ProjectMember.objects.filter(project=project, member=create_user).update(role=15)
        ProjectMember.objects.filter(project=project, member=ai_account.bot_user).update(role=20)
        response = bot_client.get(issues_url(workspace, project))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_human_token_unaffected(self, api_key_client, ai_account, workspace, project):
        """Regression: human API tokens must not hit scope enforcement."""
        response = api_key_client.get(issues_url(workspace, project))
        assert response.status_code == status.HTTP_200_OK

    def test_audit_trail_created_by_bot(self, bot_client, ai_account, workspace, project):
        AIScopePolicy.objects.create(
            ai_account=ai_account,
            project=project,
            resource_type="work_item",
            action="create",
        )
        response = bot_client.post(
            issues_url(workspace, project), {"name": "bot created issue"}, format="json"
        )
        assert response.status_code == status.HTTP_201_CREATED
        issue = Issue.objects.get(pk=response.data["id"])
        assert issue.created_by_id == ai_account.bot_user_id
