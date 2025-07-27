from django.urls import reverse
from rest_framework import status
from plane.authentication.models import WorkspaceAppInstallation
from plane.db.models import WorkspaceMember, ProjectMember

class TestOAuthApplicationInstallEndpoint:
    """Test cases for OAuthApplicationInstallEndpoint"""

    def test_install_application_success(
        self,
        session_client,
        workspace,
        oauth_application,
        project,
    ):
        """Test that installation properly sets up related data and webhook"""
        url = reverse(
            "application-install",
            kwargs={
                "slug": workspace.slug,
                "pk": oauth_application.id,
            },
        )

        response = session_client.post(url)
        if response.status_code != status.HTTP_200_OK:
            print(f"Response status: {response.status_code}")
            print(f"Response data: {response.data}")
        assert response.status_code == status.HTTP_200_OK

        # Verify the workspace app installation is created
        assert WorkspaceAppInstallation.objects.filter(
            application=oauth_application,
            workspace=workspace,
            status=WorkspaceAppInstallation.Status.INSTALLED,
        ).exists()

        from plane.db.models import Webhook, User
        from plane.app.permissions import ROLE

        # Verify the webhook is created
        assert Webhook.objects.filter(
            url=oauth_application.webhook_url,
            workspace=workspace,
            is_active=True,
            deleted_at__isnull=True,
        ).exists()

        # Verify the bot user is created
        user = User.objects.get(
            username=f"{workspace.slug}_{oauth_application.slug}_bot",
        )
        assert user is not None
        assert user.is_bot is True
        assert user.is_active is True

        # Verify the bot user is added to the workspace members
        assert WorkspaceMember.objects.filter(
            member=user,
            workspace=workspace,
            role=ROLE.MEMBER.value,
        ).exists()

        # Verify the bot user is added to the project members
        assert ProjectMember.objects.filter(
            member=user,
            project=project,
            workspace=workspace,
            role=ROLE.MEMBER.value,
        ).exists()

    def test_install_application_not_found(self, session_client, workspace):
        """Test installation when application doesn't exist"""
        import uuid

        non_existent_id = uuid.uuid4()
        url = reverse(
            "application-install",
            kwargs={
                "slug": workspace.slug,
                "pk": non_existent_id,
            },
        )

        response = session_client.post(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.data["error"] == "Application not found"

    def test_install_application_workspace_not_found(
        self,
        session_client,
        workspace_app_installation,
    ):
        """Test installation when workspace doesn't exist"""
        url = reverse(
            "application-install",
            kwargs={
                "slug": "non-existent-workspace",
                "pk": workspace_app_installation.id,
            },
        )

        response = session_client.post(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_install_application_unauthenticated(
        self, api_client, workspace, workspace_app_installation
    ):
        """Test installation without authentication"""
        url = reverse(
            "application-install",
            kwargs={
                "slug": workspace.slug,
                "pk": workspace_app_installation.id,
            },
        )

        response = api_client.post(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_install_application_insufficient_permissions(
        self, session_client, workspace, workspace_app_installation, create_user
    ):
        """Test installation with insufficient permissions"""
        # Update user role to member (not admin)
        WorkspaceMember.objects.filter(
            workspace=workspace,
            member=create_user,
        ).update(role=15)

        url = reverse(
            "application-install",
            kwargs={
                "slug": workspace.slug,
                "pk": workspace_app_installation.id,
            },
        )

        response = session_client.post(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_install_application_different_http_methods(
        self,
        session_client,
        workspace,
        oauth_application,
    ):
        """Test that only POST method is allowed"""
        url = reverse(
            "application-install",
            kwargs={
                "slug": workspace.slug,
                "pk": oauth_application.id,
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
        response = session_client.delete(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    def test_install_application_idempotency(
        self, session_client, workspace, oauth_application
    ):
        """Test that workspace app installation is reused when reinstalling the same app"""
        # Install the application
        url = reverse(
            "application-install",
            kwargs={
                "slug": workspace.slug,
                "pk": oauth_application.id,
            },
        )

        installation1 = session_client.post(url)
        assert installation1.status_code == status.HTTP_200_OK

        # re install the same application
        installation2 = session_client.post(url)
        assert installation2.status_code == status.HTTP_200_OK

        # Verify it used the same workspace app installation
        assert installation2.data["id"] == installation1.data["id"]