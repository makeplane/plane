# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid
import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from plane.db.models import User
from plane.license.models import Instance, InstanceAdmin


@pytest.fixture
def instance(db):
    return Instance.objects.create(
        instance_name="Test Instance",
        instance_id=str(uuid.uuid4()),
        current_version="1.0.0",
        domain="http://localhost:8000",
        last_checked_at=timezone.now(),
        is_setup_done=True,
    )


@pytest.fixture
def admin_client(api_client, create_user, instance):
    """Authenticated client whose user is registered as an instance admin."""
    InstanceAdmin.objects.create(instance=instance, user=create_user, role=20)
    api_client.force_authenticate(user=create_user)
    return api_client


@pytest.fixture
def other_user(db):
    user = User.objects.create(
        email="other@plane.so",
        username=f"other_{uuid.uuid4().hex[:8]}",
        first_name="Other",
        last_name="User",
        is_active=True,
    )
    user.set_password("other@123")
    user.save()
    return user


@pytest.fixture
def bot_user(db):
    user = User.objects.create(
        email="bot@plane.so",
        username=f"bot_{uuid.uuid4().hex[:8]}",
        is_bot=True,
        is_active=True,
    )
    user.save()
    return user


@pytest.mark.contract
class TestInstanceUserList:
    """GET /api/instances/users/"""

    @pytest.mark.django_db
    def test_requires_authentication(self, api_client, instance):
        url = reverse("instance-users")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_requires_instance_admin(self, api_client, create_user, instance):
        """Authenticated non-admin cannot access the list."""
        api_client.force_authenticate(user=create_user)
        url = reverse("instance-users")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_returns_paginated_users(self, admin_client, create_user, other_user):
        url = reverse("instance-users")
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        emails = [u["email"] for u in response.data["results"]]
        assert create_user.email in emails
        assert other_user.email in emails

    @pytest.mark.django_db
    def test_excludes_bot_users(self, admin_client, bot_user):
        url = reverse("instance-users")
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        emails = [u["email"] for u in response.data["results"]]
        assert bot_user.email not in emails

    @pytest.mark.django_db
    def test_instance_admin_flag_present(self, admin_client, create_user, other_user):
        url = reverse("instance-users")
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        by_email = {u["email"]: u for u in response.data["results"]}
        assert by_email[create_user.email]["is_instance_admin"] is True
        assert by_email[other_user.email]["is_instance_admin"] is False

    @pytest.mark.django_db
    def test_search_by_email(self, admin_client, create_user, other_user):
        url = reverse("instance-users")
        response = admin_client.get(url, {"search": "other"})
        assert response.status_code == status.HTTP_200_OK
        emails = [u["email"] for u in response.data["results"]]
        assert other_user.email in emails
        assert create_user.email not in emails


@pytest.mark.contract
class TestInstanceUserPatch:
    """PATCH /api/instances/users/<uuid>/"""

    @pytest.mark.django_db
    def test_deactivate_user(self, admin_client, other_user):
        url = reverse("instance-user", kwargs={"pk": other_user.pk})
        response = admin_client.patch(url, {"is_active": False}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_active"] is False
        other_user.refresh_from_db()
        assert other_user.is_active is False

    @pytest.mark.django_db
    def test_reactivate_user(self, admin_client, other_user):
        other_user.is_active = False
        other_user.save()
        url = reverse("instance-user", kwargs={"pk": other_user.pk})
        response = admin_client.patch(url, {"is_active": True}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_active"] is True
        other_user.refresh_from_db()
        assert other_user.is_active is True

    @pytest.mark.django_db
    def test_cannot_deactivate_self(self, admin_client, create_user):
        url = reverse("instance-user", kwargs={"pk": create_user.pk})
        response = admin_client.patch(url, {"is_active": False}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        create_user.refresh_from_db()
        assert create_user.is_active is True

    @pytest.mark.django_db
    def test_missing_is_active_field(self, admin_client, other_user):
        url = reverse("instance-user", kwargs={"pk": other_user.pk})
        response = admin_client.patch(url, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_unknown_user_returns_404(self, admin_client):
        url = reverse("instance-user", kwargs={"pk": uuid.uuid4()})
        response = admin_client.patch(url, {"is_active": False}, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_cannot_patch_bot_user(self, admin_client, bot_user):
        url = reverse("instance-user", kwargs={"pk": bot_user.pk})
        response = admin_client.patch(url, {"is_active": False}, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_requires_authentication(self, api_client, other_user, instance):
        url = reverse("instance-user", kwargs={"pk": other_user.pk})
        response = api_client.patch(url, {"is_active": False}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
