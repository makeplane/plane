# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for InstanceWorkSpaceAvailabilityCheckEndpoint.

Endpoint: GET /api/instances/workspace-slug-check/?slug=<slug>

Response shape: {"slug": <slug>, "is_available": <bool>}
- is_available: true  → slug is AVAILABLE (does not exist, not restricted)
- is_available: false → slug is TAKEN (exists in DB or in RESTRICTED_WORKSPACE_SLUGS)
"""

import uuid

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from plane.db.models import User, Workspace
from plane.license.models import Instance, InstanceAdmin
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def setup_instance(db):
    instance_id = (
        uuid.uuid4()
        if not Instance.objects.exists()
        else Instance.objects.first().id
    )
    instance, _ = Instance.objects.update_or_create(
        id=instance_id,
        defaults={
            "instance_name": "Test Instance",
            "instance_id": str(uuid.uuid4()),
            "current_version": "1.0.0",
            "domain": "http://localhost:8000",
            "last_checked_at": timezone.now(),
            "is_setup_done": True,
        },
    )
    return instance


@pytest.fixture
def admin_user(db):
    user = User.objects.create(
        email="slug-admin@test.plane.so",
        first_name="Admin",
        last_name="User",
        username="slug-admin@test.plane.so",
    )
    user.set_password("admin-password-123")
    user.save()
    return user


@pytest.fixture
def instance_admin(setup_instance, admin_user):
    return InstanceAdmin.objects.create(
        instance=setup_instance,
        user=admin_user,
        role=20,
        is_super_admin=True,
    )


@pytest.fixture
def admin_client(api_client, admin_user, instance_admin):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def existing_workspace(admin_user):
    return Workspace.objects.create(
        name="Credit Analysis Division",
        slug="credit-analysis-division",
        owner=admin_user,
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.contract
@pytest.mark.django_db
class TestInstanceWorkspaceSlugCheck:
    url_name = "instance-workspace-availability"

    def test_available_slug_returns_is_available_true(self, admin_client):
        """Slug that does not exist and is not restricted → is_available: true"""
        url = reverse(self.url_name)
        slug = "brand-new-unique-slug"
        response = admin_client.get(url, {"slug": slug})

        assert response.status_code == status.HTTP_200_OK
        assert response.data == {"slug": slug, "is_available": True}

    def test_existing_slug_returns_is_available_false(self, admin_client, existing_workspace):
        """Slug that exists in DB → is_available: false (taken)"""
        url = reverse(self.url_name)
        response = admin_client.get(url, {"slug": existing_workspace.slug})

        assert response.status_code == status.HTTP_200_OK
        assert response.data == {"slug": existing_workspace.slug, "is_available": False}

    def test_restricted_slug_returns_is_available_false(self, admin_client):
        """Slug in RESTRICTED_WORKSPACE_SLUGS → is_available: false (taken)"""
        assert RESTRICTED_WORKSPACE_SLUGS, "Restricted list must not be empty"
        restricted = RESTRICTED_WORKSPACE_SLUGS[0]

        url = reverse(self.url_name)
        response = admin_client.get(url, {"slug": restricted})

        assert response.status_code == status.HTTP_200_OK
        assert response.data == {"slug": restricted, "is_available": False}

    def test_missing_slug_returns_400(self, admin_client):
        """No slug query param → 400"""
        url = reverse(self.url_name)
        response = admin_client.get(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data

    def test_empty_slug_returns_400(self, admin_client):
        """Empty slug query param → 400"""
        url = reverse(self.url_name)
        response = admin_client.get(url, {"slug": ""})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data

    def test_existing_slug_check_is_case_insensitive(self, admin_client, existing_workspace):
        """slug__iexact: uppercase variant of existing slug → is_available: false"""
        url = reverse(self.url_name)
        upper_slug = existing_workspace.slug.upper()
        response = admin_client.get(url, {"slug": upper_slug})

        assert response.status_code == status.HTTP_200_OK
        assert response.data == {"slug": upper_slug, "is_available": False}

    def test_requires_instance_admin_permission(self, api_client, db):
        """Anonymous request → 401/403"""
        url = reverse(self.url_name)
        response = api_client.get(url, {"slug": "anything"})

        assert response.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )
