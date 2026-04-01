# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.utils import timezone

from rest_framework.test import APIClient

from plane.db.models import User
from plane.license.models import Instance, InstanceAdmin, InstanceConfiguration


@pytest.fixture
def instance_admin(db):
    """Create an instance, an admin user, and link them via InstanceAdmin."""
    user = User.objects.create(
        email="admin@plane.so",
        first_name="Admin",
        last_name="User",
    )
    user.set_password("admin-password")
    user.save()

    instance = Instance.objects.create(
        instance_name="test",
        instance_id="test-instance-id",
        current_version="1.2.3",
        last_checked_at=timezone.now(),
        is_setup_done=True,
    )

    InstanceAdmin.objects.create(
        instance=instance,
        user=user,
        role=20,
    )

    return user


@pytest.fixture
def admin_client(instance_admin):
    """Return an authenticated API client for the instance admin."""
    client = APIClient()
    client.force_authenticate(user=instance_admin)
    return client


@pytest.mark.unit
class TestInstanceConfigurationWhitespaceTrimming:
    """Test that instance configuration values are trimmed on save."""

    @pytest.mark.django_db
    def test_patch_strips_trailing_whitespace(self, admin_client):
        """Values with trailing whitespace should be stripped when saved."""
        InstanceConfiguration.objects.create(
            key="GITHUB_CLIENT_ID",
            value="",
            category="GITHUB",
            is_encrypted=False,
        )

        response = admin_client.patch(
            "/api/instances/configurations/",
            {"GITHUB_CLIENT_ID": "Ov23li2Dep2t79q18nxD "},
            format="json",
        )

        assert response.status_code == 200
        config = InstanceConfiguration.objects.get(key="GITHUB_CLIENT_ID")
        assert config.value == "Ov23li2Dep2t79q18nxD"

    @pytest.mark.django_db
    def test_patch_strips_leading_whitespace(self, admin_client):
        """Values with leading whitespace should be stripped when saved."""
        InstanceConfiguration.objects.create(
            key="GITHUB_CLIENT_ID",
            value="",
            category="GITHUB",
            is_encrypted=False,
        )

        response = admin_client.patch(
            "/api/instances/configurations/",
            {"GITHUB_CLIENT_ID": "  Ov23li2Dep2t79q18nxD"},
            format="json",
        )

        assert response.status_code == 200
        config = InstanceConfiguration.objects.get(key="GITHUB_CLIENT_ID")
        assert config.value == "Ov23li2Dep2t79q18nxD"

    @pytest.mark.django_db
    def test_patch_strips_both_sides(self, admin_client):
        """Values with whitespace on both sides should be fully trimmed."""
        InstanceConfiguration.objects.create(
            key="GOOGLE_CLIENT_ID",
            value="",
            category="GOOGLE",
            is_encrypted=False,
        )

        response = admin_client.patch(
            "/api/instances/configurations/",
            {"GOOGLE_CLIENT_ID": "  some-client-id  "},
            format="json",
        )

        assert response.status_code == 200
        config = InstanceConfiguration.objects.get(key="GOOGLE_CLIENT_ID")
        assert config.value == "some-client-id"

    @pytest.mark.django_db
    def test_patch_preserves_clean_values(self, admin_client):
        """Values without whitespace should be saved unchanged."""
        InstanceConfiguration.objects.create(
            key="GITHUB_CLIENT_ID",
            value="",
            category="GITHUB",
            is_encrypted=False,
        )

        response = admin_client.patch(
            "/api/instances/configurations/",
            {"GITHUB_CLIENT_ID": "Ov23li2Dep2t79q18nxD"},
            format="json",
        )

        assert response.status_code == 200
        config = InstanceConfiguration.objects.get(key="GITHUB_CLIENT_ID")
        assert config.value == "Ov23li2Dep2t79q18nxD"

    @pytest.mark.django_db
    def test_patch_null_value_not_coerced_to_string(self, admin_client):
        """Null values should remain None, not become the string 'None'."""
        InstanceConfiguration.objects.create(
            key="GOOGLE_CLIENT_ID",
            value="old-value",
            category="GOOGLE",
            is_encrypted=False,
        )

        response = admin_client.patch(
            "/api/instances/configurations/",
            {"GOOGLE_CLIENT_ID": None},
            format="json",
        )

        assert response.status_code == 200
        config = InstanceConfiguration.objects.get(key="GOOGLE_CLIENT_ID")
        assert config.value is None
