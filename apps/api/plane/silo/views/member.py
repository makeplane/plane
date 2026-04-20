# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import uuid
from dataclasses import dataclass
from typing import Optional

from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.db.models import Count, Q
from rest_framework import status
from rest_framework.response import Response

from plane.api.serializers import UserLiteSerializer
from plane.db.models import Project, ProjectMember, User, Workspace, WorkspaceMember, WorkspaceMemberInvite
from plane.ee.models import WorkspaceLicense
from plane.payment.bgtasks.member_sync_task import member_sync_task
from plane.silo.views.base import BaseServiceAPIView

# Free plan baseline when a workspace has no WorkspaceLicense row. Mirrors the
# `free_seats=12` default used by `fetch_workspace_license`.
DEFAULT_FREE_SEATS = 12
DEFAULT_MEMBER_ROLE = 15


@dataclass
class RowPlan:
    row: dict
    should_be_active: bool
    user: Optional[User] = None


def _get_available_active_seats(workspace_id) -> int:
    """
    Return remaining active seats for the workspace.

    Mirrors role-split accounting in
    `plane.utils.porters.serializers.user.UserImportListSerializer`, collapsed
    to a single integer since this endpoint only creates role=15 (member) users.

    Absent `WorkspaceLicense` falls back to `DEFAULT_FREE_SEATS` — this is a
    billing guard and must not silently leak seats on unlicensed workspaces.
    """
    members = WorkspaceMember.objects.filter(
        workspace_id=workspace_id, is_active=True, member__is_bot=False
    ).aggregate(
        admins=Count("id", filter=Q(role__gt=10)),
        guests=Count("id", filter=Q(role__lte=10)),
    )
    invites = WorkspaceMemberInvite.objects.filter(workspace_id=workspace_id).aggregate(
        admins=Count("id", filter=Q(role__gt=10)),
        guests=Count("id", filter=Q(role__lte=10)),
    )

    license = WorkspaceLicense.objects.filter(workspace_id=workspace_id).first()
    is_free = not license or license.plan == WorkspaceLicense.PlanChoice.FREE

    if is_free:
        free_seats = license.free_seats if license else DEFAULT_FREE_SEATS
        consumed = members["admins"] + members["guests"] + invites["admins"] + invites["guests"]
        return max(0, free_seats - consumed)

    # Paid plans: member/admin budget is `purchased_seats`; guests are free.
    return max(0, license.purchased_seats - members["admins"] - invites["admins"])


class ProjectMemberBulkAPIView(BaseServiceAPIView):
    """
    Bulk create users + workspace/project memberships for importer flows.

    - Each row requires `email` and `display_name`.
    - Users become inactive when the payload sets `is_active=False` or adding
      them would exceed available workspace seats.
    - Existing users / workspace members / project members are reused (idempotent).
    - Inserts batched via `bulk_create` per table.
    """

    def post(self, request, slug, project_id):
        if not isinstance(request.data, list):
            return Response(
                {"error": "Expected a list of users"}, status=status.HTTP_400_BAD_REQUEST
            )

        workspace = Workspace.objects.filter(slug=slug).first()
        project = Project.objects.filter(pk=project_id).first()
        if not workspace or not project:
            return Response(
                {"error": "Provided workspace or project does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_rows, errored = self._validate_rows(request.data)
        if not valid_rows:
            return Response({"created": [], "errored": errored}, status=status.HTTP_200_OK)

        plans, existing_wm_ids, existing_pm_ids = self._plan_rows(workspace, valid_rows, project)

        with transaction.atomic():
            self._persist(workspace, project, plans, existing_wm_ids, existing_pm_ids)

        created = []
        for plan in plans:
            if not plan.user:
                errored.append({"payload": plan.row, "error": "User creation failed"})
                continue
            created.append({**UserLiteSerializer(plan.user).data, "is_active": plan.should_be_active})

        if created:
            member_sync_task.delay(workspace.slug)

        return Response({"created": created, "errored": errored}, status=status.HTTP_200_OK)

    # ----- helpers -----------------------------------------------------------

    @staticmethod
    def _validate_rows(rows):
        """Return (valid_rows, errored). Emails normalised to lowercase."""
        valid, errored = [], []
        seen = set()
        for row in rows:
            email = (row.get("email") or "").strip().lower()
            if not email or not row.get("display_name"):
                errored.append({"payload": row, "error": "email and display_name are required"})
                continue
            try:
                validate_email(email)
            except ValidationError:
                errored.append({"payload": row, "error": "Invalid email provided"})
                continue
            if email in seen:
                errored.append({"payload": row, "error": "Duplicate email in payload"})
                continue
            seen.add(email)
            valid.append({**row, "email": email})
        return valid, errored

    @staticmethod
    def _plan_rows(workspace, valid_rows, project):
        """
        Build per-row activation plan and return existing membership lookups.

        Seat budget is consumed in payload order: once exhausted, remaining new
        rows are created inactive. Existing workspace members keep their current
        `is_active` value regardless of payload.
        """
        emails = [row["email"] for row in valid_rows]
        existing_users = {u.email: u for u in User.objects.filter(email__in=emails)}
        user_ids = [u.id for u in existing_users.values()]

        existing_wm = {
            wm.member_id: wm
            for wm in WorkspaceMember.objects.filter(workspace=workspace, member_id__in=user_ids)
        }
        existing_pm_ids = set(
            ProjectMember.objects.filter(project=project, member_id__in=user_ids).values_list(
                "member_id", flat=True
            )
        )

        available = _get_available_active_seats(workspace.id)
        consumed = 0
        plans = []

        for row in valid_rows:
            user = existing_users.get(row["email"])
            wm = existing_wm.get(user.id) if user else None

            if wm is not None:
                should_be_active = wm.is_active
            elif row.get("is_active", True) is False:
                should_be_active = False
            else:
                should_be_active = consumed < available
                if should_be_active:
                    consumed += 1

            plans.append(RowPlan(row=row, should_be_active=should_be_active, user=user))

        return plans, set(existing_wm), existing_pm_ids

    @staticmethod
    def _persist(workspace, project, plans, existing_wm_ids, existing_pm_ids):
        """Bulk-create users, workspace members, project members."""
        to_create_users = [
            User(
                email=p.row["email"],
                display_name=p.row["display_name"],
                first_name=p.row.get("first_name", ""),
                last_name=p.row.get("last_name", ""),
                username=uuid.uuid4().hex,
                password=make_password(uuid.uuid4().hex),
                is_password_autoset=True,
                is_active=p.should_be_active,
                avatar_asset_id=p.row.get("avatar_asset_id"),
            )
            for p in plans
            if p.user is None
        ]
        if to_create_users:
            User.objects.bulk_create(to_create_users, ignore_conflicts=True)
            # Refetch: `ignore_conflicts=True` skips PK assignment for conflict
            # rows, and concurrent requests may have created some of these.
            missing_emails = [p.row["email"] for p in plans if p.user is None]
            refreshed = {u.email: u for u in User.objects.filter(email__in=missing_emails)}
            for p in plans:
                if p.user is None:
                    p.user = refreshed.get(p.row["email"])

        wm_to_create = [
            WorkspaceMember(
                workspace=workspace,
                member=p.user,
                role=p.row.get("role", DEFAULT_MEMBER_ROLE),
                is_active=p.should_be_active,
            )
            for p in plans
            if p.user and p.user.id not in existing_wm_ids
        ]
        if wm_to_create:
            WorkspaceMember.objects.bulk_create(wm_to_create, ignore_conflicts=True)

        pm_to_create = [
            ProjectMember(
                workspace=workspace,
                project=project,
                member=p.user,
                role=p.row.get("role", DEFAULT_MEMBER_ROLE),
                is_active=p.should_be_active,
            )
            for p in plans
            if p.user and p.user.id not in existing_pm_ids
        ]
        if pm_to_create:
            ProjectMember.objects.bulk_create(pm_to_create, ignore_conflicts=True)
