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

MAX_CANDIDATES = 50


def _serialize_candidate(staff):
    user = staff.user
    return {
        "id": str(user.id),
        "display_name": user.display_name,
        "email": user.email,
        "staff_id": staff.staff_id,
    }


class InstanceAdminUserOptionsEndpoint(BaseAPIView):
    """Candidate users for the Add-administrator multi-select picker.

    Lists active staff (name / email / staff_id searchable) who are not yet
    instance admins. Lives under the admins/ route group, so the menu
    permission requires the administrators menu — only admin-managers can
    enumerate users to promote.
    """

    permission_classes = [InstanceAdminMenuPermission]

    def get(self, request):
        instance = Instance.objects.first()
        existing_admin_user_ids = InstanceAdmin.objects.filter(
            instance=instance, user__isnull=False
        ).values_list("user_id", flat=True)

        staff_qs = (
            StaffProfile.objects.filter(
                employment_status=EmploymentStatus.ACTIVE,
                user__isnull=False,
                user__is_active=True,
                deleted_at__isnull=True,
            )
            .exclude(user_id__in=existing_admin_user_ids)
            .select_related("user")
        )

        # Match only fields surfaced in the picker (name / email / staff_id) so
        # server results never get re-hidden by the combobox's client-side text
        # filter over the rendered option label.
        search = request.query_params.get("search")
        if search:
            staff_qs = staff_qs.filter(
                Q(user__display_name__icontains=search)
                | Q(user__email__icontains=search)
                | Q(staff_id__icontains=search)
            )

        candidates = []
        seen_user_ids = set()
        for staff in staff_qs.order_by("staff_id")[: MAX_CANDIDATES * 2]:
            if staff.user_id in seen_user_ids:
                continue
            seen_user_ids.add(staff.user_id)
            candidates.append(_serialize_candidate(staff))
            if len(candidates) >= MAX_CANDIDATES:
                break

        return Response({"candidates": candidates}, status=status.HTTP_200_OK)
