# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseAPIView
from plane.db.models import EmploymentStatus, StaffProfile
from plane.license.api.permissions import InstanceAdminMenuPermission
from plane.license.models import Instance, InstanceAdmin
from plane.utils.general_director import (
    AmbiguousGeneralDirector,
    get_general_director_user,
)

MAX_CANDIDATES = 50


def _serialize_user(user):
    return {
        "id": str(user.id),
        "display_name": user.display_name,
        "email": user.email,
    }


def _can_enumerate_candidates(user) -> bool:
    """Staff-directory enumeration is broader than the create form needs —
    gate it behind the staff/users menu so a workspace-only scoped admin
    cannot dump every staff email. Pre-RBAC (no menu fields yet) every
    instance admin is full-access, so enumeration is allowed."""
    admin = InstanceAdmin.objects.filter(
        instance=Instance.objects.first(), user=user
    ).first()
    if admin is None:
        return False
    if getattr(admin, "is_super_admin", False):
        return True
    allowed_menus = getattr(admin, "allowed_menus", None)
    if allowed_menus is None:
        # Menu RBAC fields not present — all admins are full-access.
        return True
    return "staff" in allowed_menus or "users" in allowed_menus


class InstanceWorkspaceOwnerOptionsEndpoint(BaseAPIView):
    """Default owner (the GD) + candidate users for the workspace-create
    owner picker. `default_owner` is null when no unambiguous GD resolves —
    the UI then requires an explicit pick; creation endpoints still 400."""

    permission_classes = [InstanceAdminMenuPermission]

    def get(self, request):
        try:
            gd_user = get_general_director_user()
        except AmbiguousGeneralDirector:
            gd_user = None

        candidates = []
        if _can_enumerate_candidates(request.user):
            staff_qs = StaffProfile.objects.filter(
                employment_status=EmploymentStatus.ACTIVE,
                user__isnull=False,
                user__is_active=True,
                deleted_at__isnull=True,
            ).select_related("user")

            search = request.query_params.get("search")
            if search:
                staff_qs = staff_qs.filter(
                    Q(user__display_name__icontains=search)
                    | Q(user__email__icontains=search)
                    | Q(user__first_name__icontains=search)
                )

            seen_user_ids = set()
            for staff in staff_qs.order_by("staff_id")[: MAX_CANDIDATES * 2]:
                if staff.user_id in seen_user_ids:
                    continue
                seen_user_ids.add(staff.user_id)
                candidates.append(_serialize_user(staff.user))
                if len(candidates) >= MAX_CANDIDATES:
                    break

        return Response(
            {
                "default_owner": _serialize_user(gd_user) if gd_user else None,
                "candidates": candidates,
            },
            status=status.HTTP_200_OK,
        )
