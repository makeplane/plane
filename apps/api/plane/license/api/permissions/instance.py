# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework.permissions import BasePermission

# Module imports
from plane.license.models import Instance, InstanceAdmin


class InstanceAdminPermission(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False

        instance = Instance.objects.first()
        return InstanceAdmin.objects.filter(role__gte=15, instance=instance, user=request.user).exists()
