# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

import pytest
from django.utils import timezone

from plane.db.models import User
from plane.license.models import Instance, InstanceAdmin


@pytest.mark.contract
class TestInstanceAdminSignUp:
    """Contract tests for the first-run instance administrator setup."""

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        ("form_value", "expected_value"),
        [("false", False), ("true", True), ("False", False), ("True", True), ("1", True)],
    )
    def test_telemetry_form_value_is_coerced_to_boolean(self, client, form_value, expected_value):
        """Form-encoded telemetry values must not interrupt instance setup."""
        instance = Instance.objects.create(
            instance_name="Test Instance",
            instance_id=str(uuid.uuid4()),
            current_version="1.0.0",
            domain="http://localhost:8000",
            last_checked_at=timezone.now(),
        )
        response = client.post(
            "/api/instances/admins/sign-up/",
            {
                "email": "admin@plane.so",
                "password": "vB9!qZ2@Lm7#Rx4$",
                "first_name": "Admin",
                "is_telemetry_enabled": form_value,
            },
            follow=False,
            HTTP_USER_AGENT="Mozilla/5.0",
        )

        assert response.status_code == 302
        assert response.url.endswith("/general/")

        instance.refresh_from_db()
        assert instance.is_setup_done is True
        assert instance.is_telemetry_enabled is expected_value
        assert User.objects.filter(email="admin@plane.so").exists()
        assert InstanceAdmin.objects.filter(instance=instance).exists()
