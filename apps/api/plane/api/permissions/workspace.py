# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework.permissions import BasePermission, SAFE_METHODS

from plane.db.models import WorkspaceMember


Admin = 20
Member = 15


class WorkspaceAdminOnlyPermission(BasePermission):
    """
    Permission class for external APIs that restricts access to workspace admins only.
    """

    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False

        return WorkspaceMember.objects.filter(
            member=request.user,
            workspace__slug=view.workspace_slug,
            role=Admin,
            is_active=True,
        ).exists()


class WorkspaceAdminWriteMemberReadPermission(BasePermission):
    """
    Permission class for external APIs that allows workspace members to read
    but restricts write operations to workspace admins only.
    """

    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False

        if request.method in SAFE_METHODS:
            return WorkspaceMember.objects.filter(
                member=request.user,
                workspace__slug=view.workspace_slug,
                role__in=[Admin, Member],
                is_active=True,
            ).exists()

        return WorkspaceMember.objects.filter(
            member=request.user,
            workspace__slug=view.workspace_slug,
            role=Admin,
            is_active=True,
        ).exists()
