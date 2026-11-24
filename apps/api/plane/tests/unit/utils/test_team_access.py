# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Project access that follows from team membership (plane.utils.team_access)."""

import pytest

from plane.db.models import Portfolio, Project, ProjectMember, ProjectUserProperty, Team, TeamMember, WorkspaceMember
from plane.tests.factories import ProjectFactory, UserFactory, WorkspaceFactory
from plane.utils.team_access import (
    TeamAccessError,
    absorb_manual_roles,
    leave_all_teams,
    reconcile_project_access,
    reconcile_team_access,
)

ADMIN, MEMBER, GUEST = 20, 15, 5


@pytest.fixture
def workspace(db):
    return WorkspaceFactory()


def make_user(workspace, role=MEMBER):
    user = UserFactory()
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role)
    return user


def make_team(workspace, name="A", kind="regular"):
    return Team.objects.create(workspace=workspace, name=name, kind=kind)


def make_project(workspace, team, name="P1", network=2):
    portfolio, _ = Portfolio.objects.get_or_create(team=team, name="Main")
    return ProjectFactory(
        workspace=workspace, name=name, identifier=name.upper(), network=network, portfolio=portfolio
    )


def join(team, user, role=MEMBER):
    return TeamMember.objects.create(team=team, member=user, role=role)


def row(project, user):
    return ProjectMember.objects.filter(project=project, member=user).first()


def active_role(project, user):
    found = row(project, user)
    return found.role if found and found.is_active else None


@pytest.mark.unit
@pytest.mark.django_db
class TestTeamAccess:
    @pytest.mark.parametrize(
        "team_role,network,workspace_role,expected",
        [
            (ADMIN, 2, MEMBER, ADMIN),
            (ADMIN, 0, MEMBER, ADMIN),
            (MEMBER, 2, MEMBER, MEMBER),
            (MEMBER, 0, MEMBER, None),
            (MEMBER, 2, ADMIN, ADMIN),
            (MEMBER, 2, GUEST, None),
        ],
    )
    def test_role_table(self, workspace, team_role, network, workspace_role, expected):
        team = make_team(workspace)
        project = make_project(workspace, team, network=network)
        user = make_user(workspace, workspace_role)
        join(team, user, team_role)
        reconcile_project_access([project.id])
        assert active_role(project, user) == expected

    def test_management_team_and_no_portfolio_grant_nothing(self, workspace):
        management = make_team(workspace, kind="management")
        user = make_user(workspace)
        join(management, user, ADMIN)
        project = make_project(workspace, management)
        loose = ProjectFactory(workspace=workspace, name="L", identifier="L")
        reconcile_project_access([project.id, loose.id])
        assert active_role(project, user) is None
        assert active_role(loose, user) is None

    def test_inactive_workspace_member_gets_nothing(self, workspace):
        team = make_team(workspace)
        project = make_project(workspace, team)
        user = make_user(workspace)
        WorkspaceMember.objects.filter(member=user).update(is_active=False)
        join(team, user)
        reconcile_project_access([project.id])
        assert active_role(project, user) is None

    @pytest.mark.parametrize("manual", [GUEST, ADMIN])
    def test_manual_role_survives_team(self, workspace, manual):
        team = make_team(workspace)
        project = make_project(workspace, team)
        join(team, make_user(workspace), ADMIN)
        user = make_user(workspace)
        ProjectMember.objects.create(project=project, member=user, role=manual)
        membership = join(team, user)
        reconcile_team_access(team.id)
        assert active_role(project, user) == max(manual, MEMBER)
        TeamMember.objects.filter(pk=membership.pk).delete()
        reconcile_team_access(team.id)
        assert active_role(project, user) == manual
        assert row(project, user).is_team_managed is False

    def test_leaving_deactivates_and_rejoining_reuses_row(self, workspace):
        team = make_team(workspace)
        project = make_project(workspace, team)
        user = make_user(workspace)
        membership = join(team, user)
        reconcile_team_access(team.id)
        first = row(project, user).pk
        TeamMember.objects.filter(pk=membership.pk).delete()
        reconcile_team_access(team.id)
        assert active_role(project, user) is None
        join(team, user)
        reconcile_team_access(team.id)
        assert active_role(project, user) == MEMBER
        assert row(project, user).pk == first
        assert ProjectUserProperty.objects.filter(project=project, user=user).count() == 1

    def test_inactive_manual_row_is_not_a_manual_grant(self, workspace):
        team = make_team(workspace)
        project = make_project(workspace, team)
        join(team, make_user(workspace), ADMIN)
        user = make_user(workspace)
        ProjectMember.objects.create(project=project, member=user, role=ADMIN, is_active=False)
        join(team, user)
        reconcile_team_access(team.id)
        assert active_role(project, user) == MEMBER
        assert row(project, user).manual_role is None

    def test_closing_and_reopening_project(self, workspace):
        team = make_team(workspace)
        project = make_project(workspace, team)
        admin, user = make_user(workspace), make_user(workspace)
        join(team, admin, ADMIN)
        join(team, user)
        reconcile_team_access(team.id)
        Project.objects.filter(pk=project.pk).update(network=0)
        reconcile_project_access([project.id])
        assert active_role(project, user) is None
        assert active_role(project, admin) == ADMIN
        Project.objects.filter(pk=project.pk).update(network=2)
        reconcile_project_access([project.id])
        assert active_role(project, user) == MEMBER

    def test_move_to_other_team(self, workspace):
        team_a, team_b = make_team(workspace, "A"), make_team(workspace, "B")
        project = make_project(workspace, team_a)
        a, b, both = make_user(workspace), make_user(workspace), make_user(workspace)
        join(team_a, a, ADMIN)
        join(team_b, b, ADMIN)
        join(team_a, both)
        join(team_b, both)
        reconcile_project_access([project.id])
        target = Portfolio.objects.create(team=team_b, name="Main")
        Project.objects.filter(pk=project.pk).update(portfolio=target)
        changes = {c.member_id: (c.before, c.after) for c in reconcile_project_access([project.id])}
        assert changes == {a.id: (ADMIN, None), b.id: (None, ADMIN)}
        assert active_role(project, both) == MEMBER

    def test_last_project_admin_is_protected(self, workspace):
        team = make_team(workspace)
        project = make_project(workspace, team)
        user = make_user(workspace)
        membership = join(team, user, ADMIN)
        reconcile_team_access(team.id)
        TeamMember.objects.filter(pk=membership.pk).delete()
        with pytest.raises(TeamAccessError):
            reconcile_team_access(team.id)
        assert active_role(project, user) == ADMIN

    def test_is_idempotent(self, workspace):
        team = make_team(workspace)
        make_project(workspace, team)
        join(team, make_user(workspace), ADMIN)
        assert len(reconcile_team_access(team.id)) == 1
        before = list(ProjectMember.objects.values())
        assert reconcile_team_access(team.id) == []
        assert list(ProjectMember.objects.values()) == before

    def test_absorb_manual_roles(self, workspace):
        team = make_team(workspace)
        project = make_project(workspace, team)
        join(team, make_user(workspace), ADMIN)
        user = make_user(workspace)
        join(team, user)
        reconcile_team_access(team.id)
        ProjectMember.objects.filter(project=project, member=user).update(role=GUEST)
        absorb_manual_roles(project.id, [user.id])
        assert active_role(project, user) == MEMBER
        assert row(project, user).manual_role == GUEST

    def test_leave_all_teams(self, workspace):
        team = make_team(workspace)
        project = make_project(workspace, team)
        admin, user = make_user(workspace), make_user(workspace)
        join(team, admin, ADMIN)
        join(team, user)
        reconcile_team_access(team.id)
        leave_all_teams(workspace.id, user.id)
        assert active_role(project, user) is None
        with pytest.raises(TeamAccessError):
            leave_all_teams(workspace.id, admin.id)

    def test_query_count_does_not_grow(self, workspace, django_assert_max_num_queries):
        team = make_team(workspace)
        for index in range(5):
            make_project(workspace, team, name=f"P{index}")
        for index in range(10):
            join(team, make_user(workspace), ADMIN if index == 0 else MEMBER)
        with django_assert_max_num_queries(14):
            reconcile_team_access(team.id)
        assert ProjectMember.objects.filter(is_team_managed=True).count() == 50
