from django.urls import reverse
from rest_framework import status
from django.utils import timezone

from plane.authentication.models import WorkspaceAppInstallation
from plane.db.models import WorkspaceMember, ProjectMember
from plane.tests.factories import (
    WorkspaceFactory,
    WorkspaceAppInstallationFactory,
    ProjectFactory,
)


class TestOAuthApplicationUninstallEndpoint:
    """Test cases for OAuthApplicationUninstallEndpoint"""

    def test_uninstall_application_success(
        self, session_client, workspace, workspace_app_installation
    ):
        """Test successful uninstallation of an application"""
        url = reverse(
            "application-detail",
            kwargs={
                "slug": workspace.slug,
                "pk": workspace_app_installation.id,
            },
        )

        response = session_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify the installation is deleted
        assert not WorkspaceAppInstallation.objects.filter(
            id=workspace_app_installation.id
        ).exists()

    def test_uninstall_application_bot_cleanup(
        self, session_client, workspace, project, workspace_app_installation
    ):
        """Test that bot user is properly cleaned up during uninstallation"""
        # Verify bot user exists and is active
        app_bot = workspace_app_installation.app_bot
        assert app_bot is not None
        assert app_bot.is_active is True
        assert app_bot.is_bot is True

        # Verify bot is a workspace member
        assert WorkspaceMember.objects.filter(
            member=app_bot, workspace=workspace, is_active=True, deleted_at__isnull=True
        ).exists()

        # Verify bot is a project member
        assert ProjectMember.objects.filter(
            member=app_bot,
            workspace=workspace,
            project=project,
            is_active=True,
            deleted_at__isnull=True,
        ).exists()

        url = reverse(
            "application-detail",
            kwargs={
                "slug": workspace.slug,
                "pk": workspace_app_installation.id,
            },
        )

        response = session_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify bot user is marked as inactive
        app_bot.refresh_from_db()
        assert app_bot.is_active is False

        # Verify bot is removed from workspace members
        workspace_member = WorkspaceMember.all_objects.filter(
            member=app_bot,
            workspace=workspace,
            is_active=False,
            deleted_at__isnull=False,
        ).first()
        assert workspace_member is not None

        # Verify bot is removed from project members
        project_member = ProjectMember.all_objects.filter(
            member=app_bot,
            workspace=workspace,
            project=project,
            is_active=False,
            deleted_at__isnull=False,
        ).first()
        assert project_member is not None

    def test_uninstall_application_multiple_projects_cleanup(
        self, session_client, workspace, oauth_application, create_user
    ):
        """Test that bot is removed from all projects in the workspace"""
        # Create multiple projects BEFORE creating the installation
        project1 = ProjectFactory(
            workspace=workspace, created_by=create_user, updated_by=create_user
        )
        project2 = ProjectFactory(
            workspace=workspace, created_by=create_user, updated_by=create_user
        )
        project3 = ProjectFactory(
            workspace=workspace, created_by=create_user, updated_by=create_user
        )

        # Now create the installation - this will add bot to all existing projects
        workspace_app_installation = WorkspaceAppInstallationFactory(
            workspace=workspace,
            application=oauth_application,
            installed_by=create_user,
            status=WorkspaceAppInstallation.Status.INSTALLED,
        )

        # Verify bot is member of all projects
        app_bot = workspace_app_installation.app_bot
        assert ProjectMember.objects.filter(
            member=app_bot, project=project1, is_active=True
        ).exists()
        assert ProjectMember.objects.filter(
            member=app_bot, project=project2, is_active=True
        ).exists()
        assert ProjectMember.objects.filter(
            member=app_bot, project=project3, is_active=True
        ).exists()

        url = reverse(
            "application-detail",
            kwargs={
                "slug": workspace.slug,
                "pk": workspace_app_installation.id,
            },
        )

        response = session_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify bot is removed from all projects using all_objects to access soft-deleted records
        assert ProjectMember.all_objects.filter(
            member=app_bot, project=project1, is_active=False, deleted_at__isnull=False
        ).exists()
        assert ProjectMember.all_objects.filter(
            member=app_bot, project=project2, is_active=False, deleted_at__isnull=False
        ).exists()
        assert ProjectMember.all_objects.filter(
            member=app_bot, project=project3, is_active=False, deleted_at__isnull=False
        ).exists()

    def test_uninstall_application_token_cleanup(
        self,
        session_client,
        workspace,
        workspace_app_installation,
        oauth_application,
        create_user,
    ):
        """Test that tokens are properly expired/revoked during uninstallation"""
        from plane.authentication.models import AccessToken, RefreshToken

        app_bot = workspace_app_installation.app_bot

        # Create access and refresh tokens for the app bot
        access_token = AccessToken.objects.create(
            user=app_bot,
            application=oauth_application,
            token="test-access-token",
            expires=timezone.now(),
        )
        refresh_token = RefreshToken.objects.create(
            user=app_bot,
            application=oauth_application,
            token="test-refresh-token",
        )

        # Create tokens for workspace members
        workspace_member = WorkspaceMember.objects.filter(workspace=workspace).first()
        member_access_token = AccessToken.objects.create(
            user=workspace_member.member,
            application=oauth_application,
            token="test-member-access-token",
            expires=timezone.now(),
        )
        member_refresh_token = RefreshToken.objects.create(
            user=workspace_member.member,
            application=oauth_application,
            token="test-member-refresh-token",
        )

        url = reverse(
            "application-detail",
            kwargs={
                "slug": workspace.slug,
                "pk": workspace_app_installation.id,
            },
        )

        response = session_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify bot tokens are expired/revoked
        access_token.refresh_from_db()
        refresh_token.refresh_from_db()
        assert access_token.expires <= timezone.now()
        assert refresh_token.revoked is not None

        # Verify workspace member tokens are expired/revoked
        member_access_token.refresh_from_db()
        member_refresh_token.refresh_from_db()
        assert member_access_token.expires <= timezone.now()
        assert member_refresh_token.revoked is not None

    def test_uninstall_application_not_found(self, session_client, workspace):
        """Test uninstallation when installation doesn't exist"""
        import uuid

        non_existent_id = uuid.uuid4()
        url = reverse(
            "application-detail",
            kwargs={
                "slug": workspace.slug,
                "pk": non_existent_id,
            },
        )

        response = session_client.delete(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.data["error"] == "Installation not found"

    def test_uninstall_application_wrong_workspace(
        self, session_client, workspace, oauth_application, create_user
    ):
        """Test uninstallation when installation belongs to different workspace"""
        # Create another workspace
        other_workspace = WorkspaceFactory(owner=create_user)

        # Create installation in other workspace
        other_installation = WorkspaceAppInstallationFactory(
            workspace=other_workspace,
            application=oauth_application,
            installed_by=create_user,
            status=WorkspaceAppInstallation.Status.INSTALLED,
        )

        url = reverse(
            "application-detail",
            kwargs={
                "slug": workspace.slug,  # Current workspace
                "pk": other_installation.id,  # Installation from other workspace
            },
        )

        response = session_client.delete(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.data["error"] == "Installation not found"

        # Verify the installation still exists
        assert WorkspaceAppInstallation.objects.filter(
            id=other_installation.id
        ).exists()

    def test_uninstall_application_workspace_not_found(
        self,
        session_client,
        workspace_app_installation,
    ):
        """Test uninstallation when workspace doesn't exist"""
        url = reverse(
            "application-detail",
            kwargs={
                "slug": "non-existent-workspace",
                "pk": workspace_app_installation.id,
            },
        )

        response = session_client.delete(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_uninstall_application_unauthenticated(
        self, api_client, workspace, workspace_app_installation
    ):
        """Test uninstallation without authentication"""
        url = reverse(
            "application-detail",
            kwargs={
                "slug": workspace.slug,
                "pk": workspace_app_installation.id,
            },
        )

        response = api_client.delete(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_uninstall_application_insufficient_permissions(
        self, session_client, workspace, workspace_app_installation, create_user
    ):
        """Test uninstallation with insufficient permissions"""
        # Update user role to member (not admin)
        WorkspaceMember.objects.filter(
            workspace=workspace,
            member=create_user,
        ).update(role=15)

        url = reverse(
            "application-detail",
            kwargs={
                "slug": workspace.slug,
                "pk": workspace_app_installation.id,
            },
        )

        response = session_client.delete(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_uninstall_application_cleanup_verification(
        self,
        session_client,
        workspace,
        workspace_app_installation,
        oauth_application,
        create_user,
    ):
        """Test that uninstallation properly cleans up related data"""
        # Create some related data that should be cleaned up
        from plane.authentication.models import AccessToken, RefreshToken
        from plane.db.models import Webhook

        # Create a webhook for the installation
        webhook = Webhook.objects.create(
            workspace=workspace,
            url="https://example.com/webhook",
        )
        workspace_app_installation.webhook = webhook
        workspace_app_installation.save()

        # Create access and refresh tokens for the app bot
        app_bot = workspace_app_installation.app_bot
        access_token = AccessToken.objects.create(
            user=app_bot,
            application=oauth_application,
            token="test-access-token",
            expires=timezone.now(),
        )
        refresh_token = RefreshToken.objects.create(
            user=app_bot,
            application=oauth_application,
            token="test-refresh-token",
        )

        url = reverse(
            "application-detail",
            kwargs={
                "slug": workspace.slug,
                "pk": workspace_app_installation.id,
            },
        )

        response = session_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify the installation is deleted
        assert not WorkspaceAppInstallation.objects.filter(
            id=workspace_app_installation.id
        ).exists()

        # Verify the webhook is deleted
        assert not Webhook.objects.filter(id=webhook.id).exists()

        # Verify tokens are expired/revoked
        access_token.refresh_from_db()
        refresh_token.refresh_from_db()
        assert access_token.expires <= timezone.now()
        assert refresh_token.revoked is not None

        # Verify app bot is marked as inactive
        app_bot.refresh_from_db()
        assert not app_bot.is_active

    def test_uninstall_application_different_http_methods(
        self,
        session_client,
        workspace,
        workspace_app_installation,
    ):
        """Test that only POST method is allowed"""
        url = reverse(
            "application-detail",
            kwargs={
                "slug": workspace.slug,
                "pk": workspace_app_installation.id,
            },
        )

        # Test GET method
        response = session_client.get(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

        # Test PUT method
        response = session_client.put(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

        # Test PATCH method
        response = session_client.patch(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

        # Test POST method
        response = session_client.post(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

        # Verify installation still exists
        assert WorkspaceAppInstallation.objects.filter(
            id=workspace_app_installation.id
        ).exists()

    def test_uninstall_application_bot_reuse(
        self, session_client, workspace, oauth_application, create_user
    ):
        """Test that inactive bot users are reused when reinstalling the same app"""
        # Create initial installation
        installation1 = WorkspaceAppInstallationFactory(
            workspace=workspace,
            application=oauth_application,
            installed_by=create_user,
            status=WorkspaceAppInstallation.Status.INSTALLED,
        )

        # Get the bot user
        bot_user = installation1.app_bot
        original_username = bot_user.username

        # Uninstall the application
        url = reverse(
            "application-detail",
            kwargs={
                "slug": workspace.slug,
                "pk": installation1.id,
            },
        )

        response = session_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify bot is inactive
        bot_user.refresh_from_db()
        assert not bot_user.is_active

        # Create a new installation for the same app
        installation2 = WorkspaceAppInstallationFactory(
            workspace=workspace,
            application=oauth_application,
            installed_by=create_user,
            status=WorkspaceAppInstallation.Status.INSTALLED,
        )

        # Verify the same bot user is reused
        assert installation2.app_bot.id == bot_user.id
        assert installation2.app_bot.username == original_username
        assert installation2.app_bot.is_active is True

    def test_installation_bot_creation_and_membership(
        self, workspace, oauth_application, create_user, project
    ):
        """Test that bot user is properly created and added to workspace/project members during installation"""
        # Create installation which should trigger bot creation
        installation = WorkspaceAppInstallationFactory(
            workspace=workspace,
            application=oauth_application,
            installed_by=create_user,
            status=WorkspaceAppInstallation.Status.INSTALLED,
        )

        # Verify bot user was created
        app_bot = installation.app_bot
        assert app_bot is not None
        assert app_bot.is_bot is True
        assert app_bot.is_active is True
        assert app_bot.username == f"{workspace.slug}_{oauth_application.slug}_bot"
        assert app_bot.display_name == f"{oauth_application.name} Bot"
        assert app_bot.first_name == oauth_application.name
        assert app_bot.last_name == "Bot"
        assert app_bot.email == f"{app_bot.username}@plane.so"

        # Verify bot is added to workspace members
        workspace_member = WorkspaceMember.objects.filter(
            member=app_bot, workspace=workspace, is_active=True, deleted_at__isnull=True
        ).first()
        assert workspace_member is not None
        assert workspace_member.role == 15  # MEMBER role

        # Verify bot is added to project members
        project_member = ProjectMember.objects.filter(
            member=app_bot,
            workspace=workspace,
            project=project,
            is_active=True,
            deleted_at__isnull=True,
        ).first()
        assert project_member is not None
        assert project_member.role == 15  # MEMBER role
