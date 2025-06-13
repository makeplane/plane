import pytest
from django.conf import settings
from rest_framework.test import APIClient
from pytest_django.fixtures import django_db_setup
from unittest.mock import patch, MagicMock
from uuid import uuid4

from plane.db.models import User, Workspace, FileAsset
from plane.db.models.api import APIToken


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
def plane_server(live_server):
    """
    Renamed version of live_server fixture to avoid name clashes.
    Returns a live Django server for testing HTTP requests.
    """
    return live_server
