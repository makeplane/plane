# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Project access granted through teams.

A project belongs to a team through its portfolio. Team admins are Admin in every project of the
team, team members are Member in its public projects. Access is materialized as ProjectMember rows,
so the existing project permission checks apply unchanged. `ProjectMember.manual_role` keeps the
role granted by hand so it survives when the team grant ends.

Nothing here is signal based: ProjectMember is often written with bulk operations. Code that changes
team membership, a project's portfolio or its network must call `reconcile_project_access`, and code
that sets a project role by hand must call `absorb_manual_roles`.
"""

# Python imports
from dataclasses import dataclass
from typing import Optional

# Django imports
from django.db import transaction
from django.db.models import F, Min
from django.utils import timezone

# Module imports
from plane.db.models import (
    Project,
    ProjectMember,
    ProjectNetwork,
    ProjectUserProperty,
    Team,
    TeamKind,
    TeamMember,
    WorkspaceMember,
)
from plane.db.models.project import ROLE

TEAM_ADMIN = ROLE.ADMIN.value
TEAM_MEMBER = ROLE.MEMBER.value


class TeamAccessError(Exception):
    """The requested change would leave a team or a project without an admin."""


@dataclass(frozen=True)
class AccessChange:
    project_id: str
    member_id: str
    before: Optional[int]
    after: Optional[int]


def _team_roles(projects, user_ids):
    """Return {(project_id, member_id): (team role, workspace role)} that the teams grant."""
    team_projects = {}
    for project in projects:
        team = project.portfolio.team if project.portfolio_id else None
        if team is not None and team.kind == TeamKind.REGULAR:
            team_projects.setdefault(team.id, []).append(project)
    if not team_projects:
        return {}

    team_members = TeamMember.objects.filter(
        team_id__in=team_projects, member__is_active=True, member__is_bot=False
    )
    if user_ids is not None:
        team_members = team_members.filter(member_id__in=user_ids)
    team_members = list(team_members.values_list("team_id", "member_id", "role"))

    workspace_roles = {
        (workspace_id, member_id): role
        for workspace_id, member_id, role in WorkspaceMember.objects.filter(
            workspace_id__in={project.workspace_id for project in projects},
            member_id__in={member_id for _, member_id, _ in team_members},
            is_active=True,
            role__gt=ROLE.GUEST.value,
        ).values_list("workspace_id", "member_id", "role")
    }

    roles = {}
    for team_id, member_id, role in team_members:
        for project in team_projects[team_id]:
            workspace_role = workspace_roles.get((project.workspace_id, member_id))
            if workspace_role is None:
                continue
            if role != TEAM_ADMIN and project.network != ProjectNetwork.PUBLIC.value:
                continue
            roles[(project.id, member_id)] = (TEAM_ADMIN if role == TEAM_ADMIN else TEAM_MEMBER, workspace_role)
    return roles


def _create_project_members(rows):
    """Bulk create memberships together with the per-user project properties."""
    if not rows:
        return
    ProjectMember.objects.bulk_create(rows, batch_size=100)

    existing = set(
        ProjectUserProperty.objects.filter(
            project_id__in={row.project_id for row in rows}, user_id__in={row.member_id for row in rows}
        ).values_list("project_id", "user_id")
    )
    sort_orders = {
        (item["workspace_id"], item["user_id"]): item["smallest"]
        for item in ProjectUserProperty.objects.filter(
            workspace_id__in={row.workspace_id for row in rows}, user_id__in={row.member_id for row in rows}
        )
        .order_by()
        .values("workspace_id", "user_id")
        .annotate(smallest=Min("sort_order"))
    }
    properties = []
    for row in rows:
        if (row.project_id, row.member_id) in existing:
            continue
        key = (row.workspace_id, row.member_id)
        sort_orders[key] = sort_orders[key] - 10000 if key in sort_orders else 65535
        properties.append(
            ProjectUserProperty(
                workspace_id=row.workspace_id,
                project_id=row.project_id,
                user_id=row.member_id,
                sort_order=sort_orders[key],
            )
        )
    ProjectUserProperty.objects.bulk_create(properties, batch_size=100, ignore_conflicts=True)


def _assert_admins_remain(projects, changes):
    """Raise when a change removed the last active admin of a project."""
    admin = ROLE.ADMIN.value
    weakened = {c.project_id for c in changes if c.before == admin and c.after != admin}
    if not weakened:
        return
    with_admin = set(
        ProjectMember.objects.filter(project_id__in=weakened, role=admin, is_active=True).values_list(
            "project_id", flat=True
        )
    )
    orphaned = [project.name for project in projects if project.id in weakened - with_admin]
    if orphaned:
        raise TeamAccessError(f"These projects would be left without an admin: {', '.join(sorted(orphaned))}")


@transaction.atomic
def reconcile_project_access(project_ids, user_ids=None):
    """Bring ProjectMember rows in line with the teams. Returns the list of effective changes."""
    projects = list(
        Project.objects.select_for_update(of=("self",))
        .filter(id__in=list(project_ids))
        .select_related("portfolio__team")
        .order_by("id")
    )
    if not projects:
        return []

    team_roles = _team_roles(projects, user_ids)
    existing = ProjectMember.objects.select_for_update().filter(project__in=projects, member__isnull=False)
    if user_ids is not None:
        existing = existing.filter(member_id__in=user_ids)
    rows = {(row.project_id, row.member_id): row for row in existing.order_by("id")}
    workspace_ids = {project.id: project.workspace_id for project in projects}

    changes, to_create, to_update = [], [], []
    now = timezone.now()
    for key in set(team_roles) | {key for key, row in rows.items() if row.is_team_managed}:
        project_id, member_id = key
        row = rows.get(key)
        before = row.role if row is not None and row.is_active else None
        manual = None
        if before is not None:
            manual = row.manual_role if row.is_team_managed else row.role

        if key in team_roles:
            team_role, workspace_role = team_roles[key]
            after = max(team_role, manual or 0, ROLE.ADMIN.value if workspace_role == ROLE.ADMIN.value else 0)
            target = {"role": after, "is_active": True, "is_team_managed": True, "manual_role": manual}
        else:
            after = manual
            target = {
                "role": manual if manual is not None else row.role,
                "is_active": manual is not None,
                "is_team_managed": False,
                "manual_role": None,
            }

        if row is None:
            to_create.append(
                ProjectMember(
                    project_id=project_id, workspace_id=workspace_ids[project_id], member_id=member_id, **target
                )
            )
        elif any(getattr(row, field) != value for field, value in target.items()):
            for field, value in target.items():
                setattr(row, field, value)
            row.updated_at = now
            to_update.append(row)
        if before != after:
            changes.append(AccessChange(project_id, member_id, before, after))

    _create_project_members(to_create)
    ProjectMember.objects.bulk_update(
        to_update, ["role", "is_active", "is_team_managed", "manual_role", "updated_at"], batch_size=100
    )
    _assert_admins_remain(projects, changes)
    return changes


def team_project_ids(team_id):
    return list(Project.objects.filter(portfolio__team_id=team_id).values_list("id", flat=True))


def reconcile_team_access(team_id, user_ids=None):
    return reconcile_project_access(team_project_ids(team_id), user_ids)


@transaction.atomic
def absorb_manual_roles(project_id, user_ids):
    """Record roles just written by hand as manual roles, then re-apply the team grants."""
    ProjectMember.objects.filter(
        project_id=project_id, member_id__in=user_ids, is_team_managed=True, is_active=True
    ).update(manual_role=F("role"))
    return reconcile_project_access([project_id], user_ids)


def assert_team_admin_remains(team, excluding_user_id):
    """Raise unless the team has an admin other than the given user. Locks the team row."""
    Team.objects.select_for_update().get(pk=team.pk)
    if (
        not TeamMember.objects.filter(team=team, role=TEAM_ADMIN)
        .exclude(member_id=excluding_user_id)
        .exists()
    ):
        raise TeamAccessError(f"Assign another admin to the team first: {team.name}")


@transaction.atomic
def leave_all_teams(workspace_id, user_id):
    """Drop the user from every team of the workspace, e.g. when they leave it or become a guest."""
    memberships = list(
        TeamMember.objects.filter(workspace_id=workspace_id, member_id=user_id)
        .select_related("team")
        .order_by("team_id")
    )
    if not memberships:
        return
    for membership in memberships:
        if membership.role == TEAM_ADMIN:
            assert_team_admin_remains(membership.team, user_id)
    TeamMember.objects.filter(pk__in=[membership.pk for membership in memberships]).delete()
    project_ids = Project.objects.filter(
        portfolio__team_id__in=[membership.team_id for membership in memberships]
    ).values_list("id", flat=True)
    reconcile_project_access(project_ids, [user_id])


def reconcile_user_teams(workspace_id, user_id):
    """Re-apply the team grants of one user after their workspace role changed."""
    project_ids = Project.objects.filter(
        portfolio__team__in=TeamMember.objects.filter(workspace_id=workspace_id, member_id=user_id).values("team_id")
    ).values_list("id", flat=True)
    return reconcile_project_access(project_ids, [user_id])
