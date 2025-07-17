import pytest
from django.conf import settings
from rest_framework.test import APIClient
from pytest_django.fixtures import django_db_setup
from unittest.mock import patch, MagicMock
from uuid import uuid4

from plane.db.models import User, Workspace, FileAsset, WorkspaceMember
from plane.db.models.api import APIToken
from rest_framework_simplejwt.tokens import RefreshToken


@pytest.fixture(scope="session")
def django_db_setup(django_db_setup):
    """Set up the Django database for the test session"""
    pass


@pytest.fixture
def api_client():
    """Return an unauthenticated API client"""
    return APIClient()


@pytest.fixture
def user_data():
    """Return standard user data for tests"""
    return {
        "email": "test@plane.so",
        "password": "test-password",
        "first_name": "Test",
        "last_name": "User",
    }


@pytest.fixture
def create_user(db, user_data):
    """Create and return a user instance"""
    user = User.objects.create(
        email=user_data["email"],
        first_name=user_data["first_name"],
        last_name=user_data["last_name"],
    )
    user.set_password(user_data["password"])
    user.save()
    return user


@pytest.fixture
def workspace(db, create_user):
    """Create and return a workspace instance"""
    workspace = Workspace.objects.create(
        name="Test Workspace", slug="test-workspace", id=uuid4(), owner=create_user
    )
    return workspace


@pytest.fixture
def project(db, workspace, create_user):
    """Create and return a project instance for OAuth testing"""
    from plane.tests.factories import ProjectFactory
    
    return ProjectFactory(
        workspace=workspace,
        created_by=create_user,
        updated_by=create_user,
    )


@pytest.fixture
def file_asset(db, workspace):
    """Create and return a basic FileAsset instance for testing"""
    file_asset = FileAsset.objects.create(
        workspace=workspace,
        asset="test_file.txt",
        attributes={
            "name": "test_file.txt",
            "size": 1024,
            "mime_type": "text/plain",
        },
        size=1024,
    )
    return file_asset


@pytest.fixture
def cover_image_asset(db, workspace):
    """Create and return a FileAsset instance specifically for cover images"""
    file_asset = FileAsset.objects.create(
        workspace=workspace,
        asset="cover_image.jpg",
        attributes={
            "name": "cover_image.jpg",
            "size": 2048,
            "mime_type": "image/jpeg",
        },
        size=2048,
        entity_type=FileAsset.EntityTypeContext.PROJECT_COVER,
    )
    return file_asset


@pytest.fixture
def api_token(db, create_user):
    """Create and return an API token for testing the external API"""
    token = APIToken.objects.create(
        user=create_user,
        label="Test API Token",
        token="test-api-token-12345",
    )
    return token


@pytest.fixture
def api_key_client(api_client, api_token):
    """Return an API key authenticated client for external API testing"""
    api_client.credentials(HTTP_X_API_KEY=api_token.token)
    return api_client


@pytest.fixture
def session_client(api_client, create_user):
    """Return a session authenticated API client for app API testing, which is what plane.app uses"""
    api_client.force_authenticate(user=create_user)
    return api_client


@pytest.fixture
def jwt_client(api_client, create_user):
    """Return a JWT authenticated API client for app API testing, which is what plane.graphql uses"""

    # Get JWT tokens for the user
    refresh = RefreshToken.for_user(create_user)
    access_token = str(refresh.access_token)

    # Set the Authorization header with the JWT token
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
    return api_client


@pytest.fixture
def create_bot_user(db):
    """Create and return a bot user instance"""
    from uuid import uuid4

    unique_id = uuid4().hex[:8]
    user = User.objects.create(
        email=f"bot-{unique_id}@plane.so",
        username=f"bot_user_{unique_id}",
        first_name="Bot",
        last_name="User",
        is_bot=True,
    )
    user.set_password("bot@123")
    user.save()
    return user


@pytest.fixture
def api_token_data():
    """Return sample API token data for testing"""
    from django.utils import timezone
    from datetime import timedelta

    return {
        "label": "Test API Token",
        "description": "Test description for API token",
        "expired_at": (timezone.now() + timedelta(days=30)).isoformat(),
    }


@pytest.fixture
def create_api_token_for_user(db, create_user):
    """Create and return an API token for a specific user"""
    return APIToken.objects.create(
        label="Test Token",
        description="Test token description",
        user=create_user,
        user_type=0,
    )


@pytest.fixture
def plane_server(live_server):
    """
    Renamed version of live_server fixture to avoid name clashes.
    Returns a live Django server for testing HTTP requests.
    """
    return live_server


# OAuth Application Testing Fixtures
@pytest.fixture
def oauth_application(db, create_user, workspace):
    """Create and return an OAuth application instance"""
    from plane.tests.factories import ApplicationFactory, ApplicationOwnerFactory
    
    app = ApplicationFactory(
        user=create_user,
        created_by=create_user,
        updated_by=create_user,
    )
    
    # Create application owner
    ApplicationOwnerFactory(
        user=create_user,
        application=app,
        workspace=workspace,
    )
    
    return app


@pytest.fixture
def workspace_app_installation(db, workspace, oauth_application, create_user):
    """Create and return a workspace app installation instance"""
    from plane.tests.factories import WorkspaceAppInstallationFactory
    from plane.authentication.models import WorkspaceAppInstallation
    
    # When this factory creates and saves the WorkspaceAppInstallation,
    # the model's save() method automatically creates a bot user and adds it
    # to workspace and project members
    return WorkspaceAppInstallationFactory(
        workspace=workspace,
        application=oauth_application,
        installed_by=create_user,
        status=WorkspaceAppInstallation.Status.INSTALLED,
    )

@pytest.fixture
def workspace(create_user):
    """
    Create a new workspace and return the
    corresponding Workspace model instance.
    """
    # Create the workspace using the model
    created_workspace = Workspace.objects.create(
        name="Test Workspace",
        owner=create_user,
        slug="test-workspace",
    )

    WorkspaceMember.objects.create(
        workspace=created_workspace, member=create_user, role=20
    )

    return created_workspace
