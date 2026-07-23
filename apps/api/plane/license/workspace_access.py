# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import transaction

from plane.db.models import Project, ProjectMember, Workspace, WorkspaceMember
from plane.license.models import InstanceAdmin, INSTANCE_ADMIN_ROLE


def _grant_member_access(model, lookup, create_values=None):
    create_values = create_values or {}
    member = model.objects.filter(**lookup, deleted_at__isnull=True).first()

    if member is None:
        member = model(
            **lookup,
            **create_values,
            role=20,
            is_active=True,
            is_instance_admin_access=True,
        )
        if model is ProjectMember:
            # ProjectMember.save() creates personal sorting metadata. A global
            # access projection does not need that user preference row.
            model.objects.bulk_create([member])
        else:
            member.save()
        return

    if not member.is_instance_admin_access:
        member.instance_admin_previous_role = member.role if member.is_active else None
    member.role = 20
    member.is_active = True
    member.is_instance_admin_access = True
    member.save(
        update_fields=[
            "role",
            "is_active",
            "is_instance_admin_access",
            "instance_admin_previous_role",
            "updated_at",
        ]
    )


@transaction.atomic
def grant_instance_admin_access(user, workspace=None, project=None):
    """Project an instance admin's global access into Plane memberships."""

    if workspace is not None:
        workspaces = [workspace]
    elif project is not None:
        workspaces = [project.workspace]
    else:
        workspaces = Workspace.objects.all()

    for current_workspace in workspaces:
        _grant_member_access(
            WorkspaceMember,
            {"workspace": current_workspace, "member": user},
        )

    if project is not None:
        projects = [project]
    elif workspace is not None:
        projects = Project.objects.filter(workspace=workspace)
    else:
        projects = Project.objects.all()

    for current_project in projects:
        _grant_member_access(
            ProjectMember,
            {"project": current_project, "member": user},
            {"workspace": current_project.workspace},
        )


@transaction.atomic
def grant_all_instance_admins_access(workspace=None, project=None, exclude_users=None):
    admins = InstanceAdmin.objects.filter(
        role__gte=INSTANCE_ADMIN_ROLE,
        user__isnull=False,
    ).select_related("user")
    excluded_user_ids = [user.id for user in (exclude_users or []) if user is not None]
    if excluded_user_ids:
        admins = admins.exclude(user_id__in=excluded_user_ids)
    for admin in admins:
        grant_instance_admin_access(admin.user, workspace=workspace, project=project)


@transaction.atomic
def revoke_instance_admin_access(user):
    """Remove projected access and restore any pre-existing local roles."""

    for model in (ProjectMember, WorkspaceMember):
        members = model.objects.filter(member=user, is_instance_admin_access=True)
        for member in members:
            if member.instance_admin_previous_role is None:
                member.is_active = False
            else:
                member.role = member.instance_admin_previous_role
            member.is_instance_admin_access = False
            member.instance_admin_previous_role = None
            member.save(
                update_fields=[
                    "role",
                    "is_active",
                    "is_instance_admin_access",
                    "instance_admin_previous_role",
                    "updated_at",
                ]
            )
