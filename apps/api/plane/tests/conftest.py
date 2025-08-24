import pytest
from unittest.mock import patch
from rest_framework.test import APIClient
from pytest_django.fixtures import django_db_setup

from uuid import uuid4

from plane.app.permissions import ROLE

from plane.db.models import (
    User,
    Workspace,
    FileAsset,
    WorkspaceMember,
    ProjectMember,
    ProjectPage,
    Page,
    DeployBoard,
)
from plane.app.permissions import ROLE

from plane.db.models.api import APIToken
from rest_framework_simplejwt.tokens import RefreshToken


@pytest.fixture(scope="session")
def django_db_setup(django_db_setup):  # noqa: F811
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


def workspace(db, create_user):
    """Create and return a workspace instance"""
    workspace = Workspace.objects.create(
        name="Test Workspace", slug="test-workspace", id=uuid4(), owner=create_user
    )

    WorkspaceMember.objects.create(
        workspace=workspace, member=create_user, role=ROLE.ADMIN.value
    )

    return workspace


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
    """Return a session authenticated API client for app API testing, which is what plane.app uses"""  # noqa: E501
    api_client.force_authenticate(user=create_user)
    return api_client


@pytest.fixture
def jwt_client(api_client, create_user):
    """Return a JWT authenticated API client for app API testing, which is what plane.graphql uses"""  # noqa: E501

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
def epic(db, workspace, project, create_user):
    """Create and return an epic instance"""
    from plane.tests.factories import EpicFactory, IssueTypeFactory
    from plane.db.models import State

    # Create an epic issue type ignore duplicates
    _ = IssueTypeFactory(
        workspace=workspace, name="Epic", description="Epic issue type", is_epic=True
    )

    # Create a default state for the project
    _ = State.objects.create(
        project=project,
        workspace=workspace,
        name="Backlog",
        group="backlog",
        default=True,
        created_by=create_user,
    )

    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=ROLE.ADMIN.value,
    )

    return project


@pytest.fixture
def create_workspace_member_admin(db, workspace, create_user):
    """Create and return a workspace member with admin role"""
    workspace_member = WorkspaceMember.objects.create(
        workspace=workspace,
        member=create_user,
        role=ROLE.ADMIN.value,  # 20
        is_active=True,
    )
    return workspace_member


@pytest.fixture
def create_project_member_admin(db, workspace, project, create_user):
    """Create and return a workspace member with member role"""
    project_member = ProjectMember.objects.create(
        workspace=workspace,
        project=project,
        member=create_user,
        role=ROLE.ADMIN.value,
        is_active=True,
    )
    return project_member


@pytest.fixture
def mock_feature_flag():
    """Fixture to mock the feature flag check"""

    def mock_decorator(flag_name, default_value=False):
        def wrapper(func):
            return func  # Pass through the original function

        return wrapper

    with patch(
        "plane.payment.flags.flag_decorator.check_feature_flag", new=mock_decorator
    ) as mock:
        yield mock


@pytest.fixture
def create_workspace_member_admin(db, workspace, create_user):
    """Create and return a workspace member with admin role"""
    workspace_member = WorkspaceMember.objects.create(
        workspace=workspace,
        member=create_user,
        role=ROLE.ADMIN.value,  # 20
        is_active=True,
    )
    return workspace_member


@pytest.fixture
def create_project_member_admin(db, workspace, project, create_user):
    """Create and return a workspace member with member role"""
    project_member = ProjectMember.objects.create(
        workspace=workspace,
        project=project,
        member=create_user,
        role=ROLE.ADMIN.value,
        is_active=True,
    )
    return project_member


@pytest.fixture
def mock_feature_flag():
    """Fixture to mock the feature flag check"""

    def mock_decorator(flag_name, default_value=False):
        def wrapper(func):
            return func  # Pass through the original function

        return wrapper

    with patch(
        "plane.payment.flags.flag_decorator.check_feature_flag", new=mock_decorator
    ) as mock:
        yield mock

def workspace_page(db, workspace, create_user):
    """Create and return a page instance"""
    from plane.tests.factories import PageFactory

    return PageFactory(
        workspace=workspace,
        name="Test Workspace Page",
        owned_by=create_user,
        is_global=True,
    )


@pytest.fixture
def project_page(db, workspace, project, create_user):
    """Create and return a project page instance"""
    from plane.tests.factories import PageFactory

    page = PageFactory(
        workspace=workspace,
        name="Test Project Page",
        owned_by=create_user,
    )
    # add as a project member
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,
    )
    ProjectPage.objects.create(
        project=project,
        page=page,
        workspace=workspace,
    )
    return page


@pytest.fixture
def published_page(db, workspace, workspace_page) -> tuple[Page, str]:
    """Publish a page"""
    workspace_page.access = Page.PUBLIC_ACCESS
    workspace_page.save()

    deploy_board = DeployBoard.objects.create(
        entity_name=DeployBoard.DeployBoardType.PAGE,
        entity_identifier=workspace_page.id,
        workspace=workspace,
    )
    return workspace_page, deploy_board.anchor

