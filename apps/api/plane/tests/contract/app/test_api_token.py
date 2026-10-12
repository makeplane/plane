# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from datetime import timedelta
from uuid import uuid4
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from plane.db.models import APIToken, User, Workspace, WorkspaceMember


@pytest.mark.contract
class TestApiTokenEndpoint:
    """Test cases for ApiTokenEndpoint"""

    # POST /user/api-tokens/ tests
    @pytest.mark.django_db
    def test_create_api_token_success(self, session_client, create_user, api_token_data):
        """Test successful API token creation"""
        # Arrange
        session_client.force_authenticate(user=create_user)
        url = reverse("api-tokens")

        # Act
        response = session_client.post(url, api_token_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        assert "token" in response.data
        assert response.data["label"] == api_token_data["label"]
        assert response.data["description"] == api_token_data["description"]
        assert response.data["user_type"] == 0  # Human user

        # Verify token was created in database
        token = APIToken.objects.get(pk=response.data["id"])
        assert token.user == create_user
        assert token.label == api_token_data["label"]

    @pytest.mark.django_db
    def test_create_api_token_for_bot_user(self, session_client, create_bot_user, api_token_data):
        """Test API token creation for bot user"""
        # Arrange
        session_client.force_authenticate(user=create_bot_user)
        url = reverse("api-tokens")

        # Act
        response = session_client.post(url, api_token_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["user_type"] == 1  # Bot user

    @pytest.mark.django_db
    def test_create_api_token_minimal_data(self, session_client, create_user):
        """Test API token creation with minimal data"""
        # Arrange
        session_client.force_authenticate(user=create_user)
        url = reverse("api-tokens")

        # Act
        response = session_client.post(url, {}, format="json")

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        assert "token" in response.data
        assert len(response.data["label"]) == 32  # UUID hex length
        assert response.data["description"] == ""

    @pytest.mark.django_db
    def test_create_api_token_with_expiry(self, session_client, create_user):
        """Test API token creation with expiry date"""
        # Arrange
        session_client.force_authenticate(user=create_user)
        url = reverse("api-tokens")
        future_date = timezone.now() + timedelta(days=30)
        data = {"label": "Expiring Token", "expired_at": future_date.isoformat()}

        # Act
        response = session_client.post(url, data, format="json")

        # Assert
        assert response.status_code == status.HTTP_201_CREATED

        # Verify expiry date was set
        token = APIToken.objects.get(pk=response.data["id"])
        assert token.expired_at is not None

    @pytest.mark.django_db
    def test_create_api_token_unauthenticated(self, api_client, api_token_data):
        """Test API token creation without authentication"""
        # Arrange
        url = reverse("api-tokens")

        # Act
        response = api_client.post(url, api_token_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # GET /user/api-tokens/ tests
    @pytest.mark.django_db
    def test_get_all_api_tokens(self, session_client, create_user):
        """Test retrieving all API tokens for user"""
        # Arrange
        session_client.force_authenticate(user=create_user)

        # Create multiple tokens
        APIToken.objects.create(label="Token 1", user=create_user, user_type=0)
        APIToken.objects.create(label="Token 2", user=create_user, user_type=0)
        # Create a service token (should be excluded)
        APIToken.objects.create(label="Service Token", user=create_user, user_type=0, is_service=True)
        url = reverse("api-tokens")

        # Act
        response = session_client.get(url)

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2  # Only non-service tokens
        assert all(token["is_service"] is False for token in response.data)

    @pytest.mark.django_db
    def test_get_empty_api_tokens_list(self, session_client, create_user):
        """Test retrieving API tokens when none exist"""
        # Arrange
        session_client.force_authenticate(user=create_user)
        url = reverse("api-tokens")

        # Act
        response = session_client.get(url)

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    # GET /user/api-tokens/<pk>/ tests
    @pytest.mark.django_db
    def test_get_specific_api_token(self, session_client, create_user, create_api_token_for_user):
        """Test retrieving a specific API token"""
        # Arrange
        session_client.force_authenticate(user=create_user)
        url = reverse("api-tokens-details", kwargs={"pk": create_api_token_for_user.pk})

        # Act
        response = session_client.get(url)

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(create_api_token_for_user.pk)
        assert response.data["label"] == create_api_token_for_user.label
        assert "token" not in response.data  # Token should not be visible in read serializer

    @pytest.mark.django_db
    def test_get_nonexistent_api_token(self, session_client, create_user):
        """Test retrieving a non-existent API token"""
        # Arrange
        session_client.force_authenticate(user=create_user)
        fake_pk = uuid4()
        url = reverse("api-tokens-details", kwargs={"pk": fake_pk})

        # Act
        response = session_client.get(url)

        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_get_other_users_api_token(self, session_client, create_user, db):
        """Test retrieving another user's API token (should fail)"""
        # Arrange
        # Create another user and their token with unique email and username
        unique_id = uuid4().hex[:8]
        unique_email = f"other-{unique_id}@plane.so"
        unique_username = f"other_user_{unique_id}"
        other_user = User.objects.create(email=unique_email, username=unique_username)
        other_token = APIToken.objects.create(label="Other Token", user=other_user, user_type=0)
        session_client.force_authenticate(user=create_user)
        url = reverse("api-tokens-details", kwargs={"pk": other_token.pk})

        # Act
        response = session_client.get(url)

        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND

    # DELETE /user/api-tokens/<pk>/ tests
    @pytest.mark.django_db
    def test_delete_api_token_success(self, session_client, create_user, create_api_token_for_user):
        """Test successful API token deletion"""
        # Arrange
        session_client.force_authenticate(user=create_user)
        url = reverse("api-tokens-details", kwargs={"pk": create_api_token_for_user.pk})

        # Act
        response = session_client.delete(url)

        # Assert
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not APIToken.objects.filter(pk=create_api_token_for_user.pk).exists()

    @pytest.mark.django_db
    def test_delete_nonexistent_api_token(self, session_client, create_user):
        """Test deleting a non-existent API token"""
        # Arrange
        session_client.force_authenticate(user=create_user)
        fake_pk = uuid4()
        url = reverse("api-tokens-details", kwargs={"pk": fake_pk})

        # Act
        response = session_client.delete(url)

        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_delete_other_users_api_token(self, session_client, create_user, db):
        """Test deleting another user's API token (should fail)"""
        # Arrange
        # Create another user and their token with unique email and username
        unique_id = uuid4().hex[:8]
        unique_email = f"delete-other-{unique_id}@plane.so"
        unique_username = f"delete_other_user_{unique_id}"
        other_user = User.objects.create(email=unique_email, username=unique_username)
        other_token = APIToken.objects.create(label="Other Token", user=other_user, user_type=0)
        session_client.force_authenticate(user=create_user)
        url = reverse("api-tokens-details", kwargs={"pk": other_token.pk})

        # Act
        response = session_client.delete(url)

        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND
        # Verify token still exists
        assert APIToken.objects.filter(pk=other_token.pk).exists()

    @pytest.mark.django_db
    def test_delete_service_api_token_forbidden(self, session_client, create_user):
        """Test deleting a service API token (should fail)"""
        # Arrange
        service_token = APIToken.objects.create(label="Service Token", user=create_user, user_type=0, is_service=True)
        session_client.force_authenticate(user=create_user)
        url = reverse("api-tokens-details", kwargs={"pk": service_token.pk})

        # Act
        response = session_client.delete(url)

        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND
        # Verify token still exists
        assert APIToken.objects.filter(pk=service_token.pk).exists()

    # PATCH /user/api-tokens/<pk>/ tests
    @pytest.mark.django_db
    def test_patch_api_token_success(self, session_client, create_user, create_api_token_for_user):
        """Test successful API token update"""
        # Arrange
        session_client.force_authenticate(user=create_user)
        url = reverse("api-tokens-details", kwargs={"pk": create_api_token_for_user.pk})
        update_data = {
            "label": "Updated Token Label",
            "description": "Updated description",
        }

        # Act
        response = session_client.patch(url, update_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert response.data["label"] == update_data["label"]
        assert response.data["description"] == update_data["description"]

        # Verify database was updated
        create_api_token_for_user.refresh_from_db()
        assert create_api_token_for_user.label == update_data["label"]
        assert create_api_token_for_user.description == update_data["description"]

    @pytest.mark.django_db
    def test_patch_api_token_partial_update(self, session_client, create_user, create_api_token_for_user):
        """Test partial API token update"""
        # Arrange
        session_client.force_authenticate(user=create_user)
        url = reverse("api-tokens-details", kwargs={"pk": create_api_token_for_user.pk})
        original_description = create_api_token_for_user.description
        update_data = {"label": "Only Label Updated"}

        # Act
        response = session_client.patch(url, update_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert response.data["label"] == update_data["label"]
        assert response.data["description"] == original_description

    @pytest.mark.django_db
    def test_patch_nonexistent_api_token(self, session_client, create_user):
        """Test updating a non-existent API token"""
        # Arrange
        session_client.force_authenticate(user=create_user)
        fake_pk = uuid4()
        url = reverse("api-tokens-details", kwargs={"pk": fake_pk})
        update_data = {"label": "New Label"}

        # Act
        response = session_client.patch(url, update_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_patch_other_users_api_token(self, session_client, create_user, db):
        """Test updating another user's API token (should fail)"""
        # Arrange
        # Create another user and their token with unique email and username
        unique_id = uuid4().hex[:8]
        unique_email = f"patch-other-{unique_id}@plane.so"
        unique_username = f"patch_other_user_{unique_id}"
        other_user = User.objects.create(email=unique_email, username=unique_username)
        other_token = APIToken.objects.create(label="Other Token", user=other_user, user_type=0)
        session_client.force_authenticate(user=create_user)
        url = reverse("api-tokens-details", kwargs={"pk": other_token.pk})
        update_data = {"label": "Hacked Label"}

        # Act
        response = session_client.patch(url, update_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND

        # Verify token was not updated
        other_token.refresh_from_db()
        assert other_token.label == "Other Token"

    @pytest.mark.django_db
    def test_patch_cannot_modify_token(self, session_client, create_user, create_api_token_for_user):
        """Test that token value cannot be modified via PATCH"""
        # Arrange
        session_client.force_authenticate(user=create_user)
        url = reverse("api-tokens-details", kwargs={"pk": create_api_token_for_user.pk})
        original_token = create_api_token_for_user.token
        update_data = {"token": "plane_api_malicious_token_value"}

        # Act
        response = session_client.patch(url, update_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_200_OK
        create_api_token_for_user.refresh_from_db()
        assert create_api_token_for_user.token == original_token

    @pytest.mark.django_db
    def test_patch_cannot_modify_user_type(self, session_client, create_user, create_api_token_for_user):
        """Test that user_type cannot be modified via PATCH"""
        # Arrange
        session_client.force_authenticate(user=create_user)
        url = reverse("api-tokens-details", kwargs={"pk": create_api_token_for_user.pk})
        update_data = {"user_type": 1}

        # Act
        response = session_client.patch(url, update_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_200_OK
        create_api_token_for_user.refresh_from_db()
        assert create_api_token_for_user.user_type == 0

    @pytest.mark.django_db
    def test_patch_cannot_modify_allowed_rate_limit(self, session_client, create_user, create_api_token_for_user):
        """Test that allowed_rate_limit cannot be modified via PATCH"""
        # Arrange
        session_client.force_authenticate(user=create_user)
        url = reverse("api-tokens-details", kwargs={"pk": create_api_token_for_user.pk})
        original_rate_limit = create_api_token_for_user.allowed_rate_limit
        update_data = {"allowed_rate_limit": "100000/min"}

        # Act
        response = session_client.patch(url, update_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_200_OK
        create_api_token_for_user.refresh_from_db()
        assert create_api_token_for_user.allowed_rate_limit == original_rate_limit

    @pytest.mark.django_db
    def test_patch_cannot_modify_service_token(self, session_client, create_user):
        """Test that service tokens cannot be modified through user token endpoint"""
        # Arrange
        service_token = APIToken.objects.create(label="Service Token", user=create_user, user_type=0, is_service=True)
        session_client.force_authenticate(user=create_user)
        url = reverse("api-tokens-details", kwargs={"pk": service_token.pk})
        update_data = {"label": "Hacked Service Token"}

        # Act
        response = session_client.patch(url, update_data, format="json")

        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND
        service_token.refresh_from_db()
        assert service_token.label == "Service Token"

    # Authentication tests
    @pytest.mark.django_db
    def test_all_endpoints_require_authentication(self, api_client):
        """Test that all endpoints require authentication"""
        # Arrange
        endpoints = [
            (reverse("api-tokens"), "get"),
            (reverse("api-tokens"), "post"),
            (reverse("api-tokens-details", kwargs={"pk": uuid4()}), "get"),
            (reverse("api-tokens-details", kwargs={"pk": uuid4()}), "patch"),
            (reverse("api-tokens-details", kwargs={"pk": uuid4()}), "delete"),
        ]

        # Act & Assert
        for url, method in endpoints:
            response = getattr(api_client, method)(url)
            assert response.status_code == status.HTTP_401_UNAUTHORIZED


def _make_workspace(owner, slug):
    return Workspace.objects.create(name=slug, slug=slug, owner=owner)


def _join(workspace, user, role, is_active=True):
    return WorkspaceMember.objects.create(workspace=workspace, member=user, role=role, is_active=is_active)


@pytest.mark.contract
class TestApiTokenCreateRole:
    """Personal token creation requires a non-guest workspace role"""

    @pytest.fixture
    def owner_user(self, db):
        suffix = uuid4().hex[:12]
        return User.objects.create(email=f"owner-{suffix}@plane.so", username=f"owner-{suffix}")

    @pytest.fixture
    def ws_a(self, owner_user):
        return _make_workspace(owner_user, f"ws-a-{uuid4().hex[:8]}")

    @pytest.fixture
    def ws_b(self, owner_user):
        return _make_workspace(owner_user, f"ws-b-{uuid4().hex[:8]}")

    @pytest.mark.django_db
    def test_guest_only_cannot_create_token(self, session_client, create_user, ws_a, api_token_data):
        _join(ws_a, create_user, 5)
        session_client.force_authenticate(user=create_user)

        response = session_client.post(reverse("api-tokens"), api_token_data, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data == {"error": "You don't have the required permissions."}
        assert not APIToken.objects.filter(user=create_user).exists()

    @pytest.mark.django_db
    @pytest.mark.parametrize("role", [15, 20])
    def test_member_and_admin_can_create_token(self, session_client, create_user, ws_a, api_token_data, role):
        _join(ws_a, create_user, role)
        session_client.force_authenticate(user=create_user)

        response = session_client.post(reverse("api-tokens"), api_token_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert APIToken.objects.filter(user=create_user).count() == 1

    @pytest.mark.django_db
    def test_guest_in_one_workspace_member_in_another_can_create_token(
        self, session_client, create_user, ws_a, ws_b, api_token_data
    ):
        _join(ws_a, create_user, 5)
        _join(ws_b, create_user, 15)
        session_client.force_authenticate(user=create_user)

        response = session_client.post(reverse("api-tokens"), api_token_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED

    @pytest.mark.django_db
    def test_inactive_member_with_active_guest_cannot_create_token(
        self, session_client, create_user, ws_a, ws_b, api_token_data
    ):
        _join(ws_a, create_user, 5)
        _join(ws_b, create_user, 15, is_active=False)
        session_client.force_authenticate(user=create_user)

        response = session_client.post(reverse("api-tokens"), api_token_data, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not APIToken.objects.filter(user=create_user).exists()

    @pytest.mark.django_db
    def test_user_without_memberships_can_create_token(self, session_client, create_user, api_token_data):
        session_client.force_authenticate(user=create_user)

        response = session_client.post(reverse("api-tokens"), api_token_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED

    @pytest.mark.django_db
    def test_guest_keeps_existing_token(self, api_client, session_client, create_user, ws_a):
        _join(ws_a, create_user, 5)
        token = APIToken.objects.create(label="Existing", user=create_user, user_type=0)

        api_client.credentials(HTTP_X_API_KEY=token.token)
        me = api_client.get("/api/v1/users/me/")
        assert me.status_code == status.HTTP_200_OK

        api_client.credentials()
        session_client.force_authenticate(user=create_user)
        listing = session_client.get(reverse("api-tokens"))
        assert listing.status_code == status.HTTP_200_OK
        assert [str(t["id"]) for t in listing.data] == [str(token.pk)]

        detail_url = reverse("api-tokens-details", kwargs={"pk": token.pk})
        patched = session_client.patch(detail_url, {"label": "Renamed"}, format="json")
        assert patched.status_code == status.HTTP_200_OK
        token.refresh_from_db()
        assert token.label == "Renamed"

        deleted = session_client.delete(detail_url)
        assert deleted.status_code == status.HTTP_204_NO_CONTENT
        assert not APIToken.objects.filter(pk=token.pk).exists()
