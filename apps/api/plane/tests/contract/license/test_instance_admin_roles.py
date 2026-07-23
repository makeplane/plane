# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import User
from plane.license.models import Instance, InstanceAdmin


INSTANCE_ADMINS_URL = "/api/instances/admins/"


@pytest.fixture
def instance(db):
    return Instance.objects.create(
        instance_name="Test instance",
        instance_id=uuid4().hex,
        current_version="1.0.0",
        last_checked_at=timezone.now(),
    )


@pytest.fixture
def registered_user(db):
    return User.objects.create(email="registered@gizmo.so", first_name="Registered", last_name="User")


@pytest.mark.contract
class TestInstanceAdminRoles:
    @pytest.mark.django_db
    def test_super_admin_can_delegate_god_mode_as_admin(self, api_client, create_user, registered_user, instance):
        InstanceAdmin.objects.create(instance=instance, user=create_user, role=20)
        api_client.force_authenticate(user=create_user)

        response = api_client.post(
            INSTANCE_ADMINS_URL,
            {"email": registered_user.email, "role": 20},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["role"] == 15
        assert InstanceAdmin.objects.get(instance=instance, user=registered_user).role == 15

    @pytest.mark.django_db
    def test_admin_cannot_delegate_or_revoke_god_mode(self, api_client, create_user, registered_user, instance):
        admin = InstanceAdmin.objects.create(instance=instance, user=create_user, role=15)
        api_client.force_authenticate(user=create_user)

        create_response = api_client.post(INSTANCE_ADMINS_URL, {"email": registered_user.email}, format="json")
        delete_response = api_client.delete(f"{INSTANCE_ADMINS_URL}{admin.id}/")

        assert create_response.status_code == status.HTTP_403_FORBIDDEN
        assert delete_response.status_code == status.HTTP_403_FORBIDDEN
        assert not InstanceAdmin.objects.filter(instance=instance, user=registered_user).exists()

    @pytest.mark.django_db
    def test_admin_keeps_god_mode_access(self, api_client, create_user, instance):
        InstanceAdmin.objects.create(instance=instance, user=create_user, role=15)
        api_client.force_authenticate(user=create_user)

        response = api_client.get(INSTANCE_ADMINS_URL)

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_super_admin_cannot_remove_another_super_admin(self, api_client, create_user, instance):
        super_admin = User.objects.create(email="super@gizmo.so", first_name="Super", last_name="Admin")
        InstanceAdmin.objects.create(instance=instance, user=create_user, role=20)
        protected_admin = InstanceAdmin.objects.create(instance=instance, user=super_admin, role=20)
        api_client.force_authenticate(user=create_user)

        response = api_client.delete(f"{INSTANCE_ADMINS_URL}{protected_admin.id}/")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert InstanceAdmin.objects.filter(pk=protected_admin.id).exists()
