# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third Party imports
from rest_framework.permissions import SAFE_METHODS, BasePermission

# Module import
from plane.db.models import ProjectMember, WorkspaceMember
from plane.db.models.project import ROLE


class ProjectBasePermission(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False

        ## Safe Methods -> Handle the filtering logic in queryset
        if request.method in SAFE_METHODS:
            return WorkspaceMember.objects.filter(
                workspace__slug=view.workspace_slug, member=request.user, is_active=True
            ).exists()

        ## Only workspace owners or admins can create the projects
        if request.method == "POST":
            return WorkspaceMember.objects.filter(
                workspace__slug=view.workspace_slug,
                member=request.user,
                role__in=[ROLE.ADMIN.value, ROLE.MEMBER.value],
                is_active=True,
            ).exists()

        project_member_qs = ProjectMember.objects.filter(
            workspace__slug=view.workspace_slug,
            member=request.user,
            project_id=view.project_id,
            is_active=True,
        )

        ## Only project admins or workspace admin who is part of the project can access

        if project_member_qs.filter(role=ROLE.ADMIN.value).exists():
            return True
        else:
            return (
                project_member_qs.exists()
                and WorkspaceMember.objects.filter(
                    member=request.user,
                    workspace__slug=view.workspace_slug,
                    role=ROLE.ADMIN.value,
                    is_active=True,
                ).exists()
            )


class ProjectArchiveUnarchivePermission(BasePermission):
    """Archive/unarchive always target an existing project_id — never project
    creation — so this must not share ProjectBasePermission's POST branch,
    which assumes POST means "create a project" and checks only
    workspace-level role with no project_id binding at all. A workspace
    ADMIN/MEMBER with no ProjectMember row on the target project could
    otherwise archive (and delete every UserFavorite row on) a project they
    cannot even read.

    Mirrors the app-layer twin's gate (``allow_permission([ROLE.ADMIN,
    ROLE.MEMBER])``, ``level="PROJECT"`` default) on both post and delete so
    the two verbs agree — unarchive already got this right by falling
    through to ProjectBasePermission's non-POST branch; archive didn't.
    """

    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False

        if ProjectMember.objects.filter(
            workspace__slug=view.workspace_slug,
            member=request.user,
            project_id=view.project_id,
            role__in=[ROLE.ADMIN.value, ROLE.MEMBER.value],
            is_active=True,
        ).exists():
            return True

        return (
            ProjectMember.objects.filter(
                workspace__slug=view.workspace_slug,
                member=request.user,
                project_id=view.project_id,
                is_active=True,
            ).exists()
            and WorkspaceMember.objects.filter(
                member=request.user,
                workspace__slug=view.workspace_slug,
                role=ROLE.ADMIN.value,
                is_active=True,
            ).exists()
        )


class ProjectMemberPermission(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False

        ## Safe Methods -> Handle the filtering logic in queryset
        if request.method in SAFE_METHODS:
            return ProjectMember.objects.filter(
                workspace__slug=view.workspace_slug,
                member=request.user,
                project_id=view.project_id,
                is_active=True,
            ).exists()
        ## Only workspace owners or admins can create the projects
        if request.method == "POST":
            return WorkspaceMember.objects.filter(
                workspace__slug=view.workspace_slug,
                member=request.user,
                role__in=[ROLE.ADMIN.value, ROLE.MEMBER.value],
                is_active=True,
            ).exists()

        ## Only Project Admins can update project attributes
        return ProjectMember.objects.filter(
            workspace__slug=view.workspace_slug,
            member=request.user,
            role__in=[ROLE.ADMIN.value, ROLE.MEMBER.value],
            project_id=view.project_id,
            is_active=True,
        ).exists()


class ProjectEntityPermission(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False

        # Handle requests based on project__identifier
        if hasattr(view, "project_identifier") and view.project_identifier:
            if request.method in SAFE_METHODS:
                return ProjectMember.objects.filter(
                    workspace__slug=view.workspace_slug,
                    member=request.user,
                    project__identifier=view.project_identifier,
                    is_active=True,
                ).exists()

        ## Safe Methods -> Handle the filtering logic in queryset
        if request.method in SAFE_METHODS:
            return ProjectMember.objects.filter(
                workspace__slug=view.workspace_slug,
                member=request.user,
                project_id=view.project_id,
                is_active=True,
            ).exists()

        ## Only project members or admins can create and edit the project attributes
        return ProjectMember.objects.filter(
            workspace__slug=view.workspace_slug,
            member=request.user,
            role__in=[ROLE.ADMIN.value, ROLE.MEMBER.value],
            project_id=view.project_id,
            is_active=True,
        ).exists()


class ProjectAdminPermission(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False

        return ProjectMember.objects.filter(
            workspace__slug=view.workspace_slug,
            member=request.user,
            role=ROLE.ADMIN.value,
            project_id=view.project_id,
            is_active=True,
        ).exists()


class ProjectLitePermission(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_anonymous:
            return False

        return ProjectMember.objects.filter(
            workspace__slug=view.workspace_slug,
            member=request.user,
            project_id=view.project_id,
            is_active=True,
        ).exists()
