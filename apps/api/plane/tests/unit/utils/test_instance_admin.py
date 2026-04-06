# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.utils import timezone
from plane.license.models import Instance, InstanceAdmin
from plane.utils.instance_admin import is_instance_admin


@pytest.mark.unit
class TestInstanceAdminUtility:
    """Test the is_instance_admin utility function"""

    @pytest.mark.django_db
    def test_is_instance_admin_returns_false_for_anonymous_user(self, db):
        """Test that anonymous users are not instance admins"""
        result = is_instance_admin(None)
        assert result is False

    @pytest.mark.django_db
    def test_is_instance_admin_returns_false_when_no_instance_exists(self, db, create_user):
        """Test that users are not instance admins when no instance exists"""
        # No Instance created
        result = is_instance_admin(create_user)
        assert result is False

    @pytest.mark.django_db
    def test_is_instance_admin_returns_false_for_non_admin_user(self, db, create_user):
        """Test that non-admin users return False"""
        Instance.objects.create(
            instance_name="Test Instance",
            is_setup_done=True,
            last_checked_at=timezone.now(),
        )
        # Create user without InstanceAdmin record
        result = is_instance_admin(create_user)
        assert result is False

    @pytest.mark.django_db
    def test_is_instance_admin_returns_true_for_admin_user(self, db, create_user):
        """Test that users with InstanceAdmin role >= 15 return True"""
        instance = Instance.objects.create(
            instance_name="Test Instance",
            is_setup_done=True,
            last_checked_at=timezone.now(),
        )
        InstanceAdmin.objects.create(
            instance=instance,
            user=create_user,
            role=15
        )
        result = is_instance_admin(create_user)
        assert result is True

    @pytest.mark.django_db
    def test_is_instance_admin_returns_true_for_high_role_admin(self, db, create_user):
        """Test that users with higher InstanceAdmin role return True"""
        instance = Instance.objects.create(
            instance_name="Test Instance",
            is_setup_done=True,
            last_checked_at=timezone.now(),
        )
        InstanceAdmin.objects.create(
            instance=instance,
            user=create_user,
            role=20  # Higher role value
        )
        result = is_instance_admin(create_user)
        assert result is True

    @pytest.mark.django_db
    def test_is_instance_admin_returns_false_for_low_role(self, db, create_user):
        """Test that users with InstanceAdmin role < 15 return False"""
        instance = Instance.objects.create(
            instance_name="Test Instance",
            is_setup_done=True,
            last_checked_at=timezone.now(),
        )
        InstanceAdmin.objects.create(
            instance=instance,
            user=create_user,
            role=10  # Lower role value
        )
        result = is_instance_admin(create_user)
        assert result is False
