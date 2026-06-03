# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework.permissions import BasePermission

# Module imports
from plane.license.menu_registry import is_shared_path, required_menu_for_path
from plane.license.models import Instance, InstanceAdmin


class InstanceAdminPermission(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False

        instance = Instance.objects.first()
        return InstanceAdmin.objects.filter(role__gte=15, instance=instance, user=request.user).exists()


class InstanceAdminMenuPermission(BasePermission):
    """Route-group menu RBAC for god-mode endpoints.

    The required menu is resolved from the request path via the prefix
    registry — views carry no per-class menu annotation. Unmapped paths
    deny scoped admins (fail-closed); super-admins bypass menu checks.
    """

    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False

        admin = InstanceAdmin.objects.filter(
            role__gte=15, instance=Instance.objects.first(), user=request.user
        ).first()
        if admin is None:
            return False
        if admin.is_super_admin:
            return True
        if is_shared_path(request.path):
            return True

        required = required_menu_for_path(request.path)
        if required is None:
            return False
        return required in (admin.allowed_menus or [])
