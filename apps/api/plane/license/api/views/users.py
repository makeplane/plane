# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Instance administrator surface for accounts and administrator tags.

Only instance administrators reach these endpoints: the three administrator
tags (development, operations, main PI) are handed out here and nowhere
else, which keeps tag granting behind a single, auditable door.
"""

from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import User, WorkspaceMember
from plane.license.api.serializers import InstanceRoleAssignmentSerializer, InstanceUserSerializer
from plane.license.models import Instance, InstanceRoleAssignment

from .base import BaseAPIView


def available_roles():
    return [{"key": key, "label": label} for key, label in InstanceRoleAssignment.AdminRole.choices]


def current_roles(user):
    return list(
        InstanceRoleAssignment.objects.filter(user=user, deleted_at__isnull=True)
        .order_by("role")
        .values_list("role", flat=True)
    )


def sync_admin_memberships(user, actor=None):
    """Keep the tag-driven workspace seats in sync with the tag set."""
    from plane.research.utils.roles import demote_admin_workspace_membership, sync_admin_workspace_membership

    if current_roles(user):
        sync_admin_workspace_membership(user, actor=actor)
    else:
        demote_admin_workspace_membership(user)


class InstanceUserListEndpoint(BaseAPIView):
    """``GET /api/instances/users/`` - accounts with their administrator tags."""

    def get(self, request):
        queryset = (
            User.objects.filter(is_bot=False)
            .select_related("research_profile")
            .order_by("-date_joined")
        )

        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(display_name__icontains=search)
            )

        role = str(request.query_params.get("role") or "").upper()
        if role in dict(InstanceRoleAssignment.AdminRole.choices):
            queryset = queryset.filter(
                instance_role_assignments__role=role,
                instance_role_assignments__deleted_at__isnull=True,
            ).distinct()

        user_ids = list(queryset.values_list("id", flat=True)[:2000])
        role_map = {}
        for user_id, value in InstanceRoleAssignment.objects.filter(
            user_id__in=user_ids, deleted_at__isnull=True
        ).values_list("user_id", "role"):
            role_map.setdefault(user_id, []).append(value)

        membership_map = {}
        for user_id, slug in WorkspaceMember.objects.filter(
            member_id__in=user_ids, is_active=True, deleted_at__isnull=True
        ).values_list("member_id", "workspace__slug"):
            membership_map.setdefault(user_id, []).append(slug)

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda results: InstanceUserSerializer(
                [_annotated(user, role_map, membership_map) for user in results],
                many=True,
            ).data,
            max_per_page=100,
            default_per_page=20,
        )


def _annotated(user, role_map, membership_map):
    user.active_role_assignments = sorted(role_map.get(user.id, []))
    user.active_workspace_memberships = sorted(membership_map.get(user.id, []))
    return user


class InstanceUserRoleEndpoint(BaseAPIView):
    """``GET``/``POST``/``DELETE /api/instances/users/<uuid:pk>/roles/``.

    ``POST`` body: ``{"role": "DEV_ADMIN"|"OPS_ADMIN"|"MAIN_PI", "note": ""}``
    ``DELETE`` body: ``{"role": "..."}``
    """

    def _user(self, pk):
        return User.objects.filter(pk=pk).first()

    def get(self, request, pk):
        user = self._user(pk)
        if user is None:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        assignments = InstanceRoleAssignment.objects.filter(user=user, deleted_at__isnull=True).order_by("role")
        return Response(
            {
                "user_id": str(user.id),
                "email": user.email,
                "roles": InstanceRoleAssignmentSerializer(assignments, many=True).data,
                "available_roles": available_roles(),
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, pk):
        user = self._user(pk)
        if user is None:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        role = str(request.data.get("role") or "").upper()
        if role not in dict(InstanceRoleAssignment.AdminRole.choices):
            return Response(
                {"error": "role must be one of DEV_ADMIN, OPS_ADMIN, MAIN_PI"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        instance = Instance.objects.first()
        assignment, created = InstanceRoleAssignment.objects.get_or_create(
            user=user,
            role=role,
            deleted_at__isnull=True,
            defaults={
                "instance": instance,
                "assigned_by": request.user,
                "note": str(request.data.get("note") or ""),
            },
        )

        sync_admin_memberships(user, actor=request.user)

        return Response(
            {
                "user_id": str(user.id),
                "role": role,
                "created": created,
                "roles": current_roles(user),
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        user = self._user(pk)
        if user is None:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        role = str(request.data.get("role") or request.query_params.get("role") or "").upper()
        if role not in dict(InstanceRoleAssignment.AdminRole.choices):
            return Response({"error": "A valid role is required"}, status=status.HTTP_400_BAD_REQUEST)

        revoked = InstanceRoleAssignment.objects.filter(
            user=user, role=role, deleted_at__isnull=True
        ).update(deleted_at=timezone.now(), updated_by=request.user)

        sync_admin_memberships(user, actor=request.user)

        return Response(
            {
                "user_id": str(user.id),
                "role": role,
                "revoked": bool(revoked),
                "roles": current_roles(user),
            },
            status=status.HTTP_200_OK,
        )
