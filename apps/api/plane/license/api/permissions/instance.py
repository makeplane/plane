# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework.permissions import BasePermission

# Module imports
from plane.license.models import Instance, InstanceAdmin, INSTANCE_ADMIN_ROLE, INSTANCE_SUPER_ADMIN_ROLE


class InstanceAdminPermission(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False

        instance = Instance.objects.first()
        return InstanceAdmin.objects.filter(
            role__gte=INSTANCE_ADMIN_ROLE, instance=instance, user=request.user
        ).exists()


class InstanceSuperAdminPermission(BasePermission):
    """Allows only instance super admins to manage instance administrators."""

    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False

        instance = Instance.objects.first()
        return InstanceAdmin.objects.filter(
            role__gte=INSTANCE_SUPER_ADMIN_ROLE, instance=instance, user=request.user
        ).exists()
