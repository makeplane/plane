# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.license.models import Instance, InstanceAdmin


def is_instance_admin(user) -> bool:
    """Return True if the user is an instance admin (role >= 15)."""
    if not user or user.is_anonymous:
        return False
    instance = Instance.objects.first()
    if not instance:
        return False
    return InstanceAdmin.objects.filter(
        role__gte=15,
        instance=instance,
        user=user,
    ).exists()
