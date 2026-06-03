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


def _active_super_admins():
    """Super-admin rows that can actually log in. Ghost rows (user SET_NULL'd)
    and inactive users never count — a login-less row protects nothing."""
    return InstanceAdmin.objects.filter(
        instance=Instance.objects.first(),
        is_super_admin=True,
        user__isnull=False,
        user__is_active=True,
    )


def is_active_super_admin(user) -> bool:
    """Return True if the user is an active, loginable super-admin."""
    if not user or user.is_anonymous:
        return False
    return _active_super_admins().filter(user=user).exists()


def is_last_active_super_admin(user) -> bool:
    """True when the user is the ONLY active loginable super-admin.

    Operations that would lock the instance out (deactivate, demote,
    delete, password seizure) must refuse while this holds.
    """
    if not user or user.is_anonymous:
        return False
    qs = _active_super_admins()
    return qs.filter(user=user).exists() and not qs.exclude(user=user).exists()
