# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Teams, portfolios and moving projects: the stage 1 part of the permission matrix."""

import pytest
from rest_framework.test import APIClient

from plane.db.models import (
    Portfolio,
    Project,
    ProjectMember,
    ProjectMemberInvite,
    Team,
    TeamMember,
    User,
    Workspace,
    WorkspaceMember,
)

ADMIN, MEMBER, GUEST = 20, 15, 5


@pytest.fixture(autouse=True)
def _no_celery(mock_celery):
    yield


def make_user(workspace, name, role=MEMBER):
    user = User.objects.create(email=f"{name}@plane.so", username=name, first_name=name)
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role)
    return user


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def s(db, workspace, create_user):
    """Workspace admin, two teams with an admin each, a member, a guest and a project in team A."""

    class S:
        pass

    s = S()
    s.ws = workspace
    s.root = create_user
    s.admin_a, s.admin_b = make_user(workspace, "admin_a"), make_user(workspace, "admin_b")
    s.member, s.outsider = make_user(workspace, "member"), make_user(workspace, "outsider")
    s.guest = make_user(workspace, "guest", GUEST)
    s.a, s.b = (Team.objects.create(workspace=workspace, name=name) for name in "AB")
    TeamMember.objects.create(team=s.a, member=s.admin_a, role=ADMIN)
    s.membership = TeamMember.objects.create(team=s.a, member=s.member, role=MEMBER)
    TeamMember.objects.create(team=s.b, member=s.admin_b, role=ADMIN)
    s.pa = Portfolio.objects.create(team=s.a, name="PA")
    s.pa2 = Portfolio.objects.create(team=s.a, name="PA2")
    s.pb = Portfolio.objects.create(team=s.b, name="PB")
    s.project = Project.objects.create(name="One", identifier="ONE", workspace=workspace, network=2)
    s.url = f"/api/workspaces/{workspace.slug}"
    return s


def call(s, user, method, path, data=None):
    return getattr(client_for(user), method)(f"{s.url}/{path}", data, format="json")


def move(s, user, portfolio, dry_run=False):
    return call(
        s,
        user,
        "post",
        f"projects/{s.project.id}/move/",
        {"portfolio_id": str(portfolio.id) if portfolio else None, "dry_run": dry_run},
    )


def role_in(s, user):
    return (
        ProjectMember.objects.filter(project=s.project, member=user, is_active=True)
        .values_list("role", flat=True)
        .first()
    )


@pytest.mark.contract
@pytest.mark.django_db
class TestTeams:
    def test_only_workspace_admin_creates(self, s):
        assert call(s, s.admin_a, "post", "teams/", {"name": "C"}).status_code == 403
        response = call(s, s.root, "post", "teams/", {"name": "C", "admin_ids": [str(s.outsider.id)]})
        assert response.status_code == 201
        assert TeamMember.objects.get(team_id=response.data["id"]).member_id == s.outsider.id

    def test_duplicate_name_and_second_management_team(self, s):
        assert call(s, s.root, "post", "teams/", {"name": "A"}).status_code == 400
        assert call(s, s.root, "post", "teams/", {"name": "M", "kind": "management"}).status_code == 201
        assert call(s, s.root, "post", "teams/", {"name": "N", "kind": "management"}).status_code == 400

    def test_guest_cannot_read(self, s):
        assert call(s, s.guest, "get", "teams/").status_code == 403
        assert call(s, s.guest, "get", "portfolios/").status_code == 403

    def test_everyone_else_reads(self, s):
        response = call(s, s.outsider, "get", "teams/")
        assert [team["name"] for team in response.data] == ["A", "B"]
        assert call(s, s.outsider, "get", f"teams/{s.a.id}/members/").status_code == 200

    def test_team_admin_edits_only_own_team(self, s):
        assert call(s, s.admin_a, "patch", f"teams/{s.a.id}/", {"description": "x"}).status_code == 200
        assert call(s, s.admin_a, "patch", f"teams/{s.b.id}/", {"description": "x"}).status_code == 403
        assert call(s, s.member, "patch", f"teams/{s.a.id}/", {"description": "x"}).status_code == 403

    def test_kind_is_for_workspace_admin(self, s):
        assert call(s, s.admin_a, "patch", f"teams/{s.a.id}/", {"kind": "management"}).status_code == 403
        assert call(s, s.root, "patch", f"teams/{s.a.id}/", {"kind": "management"}).status_code == 400

    def test_delete_only_when_empty(self, s):
        assert call(s, s.admin_a, "delete", f"teams/{s.a.id}/").status_code == 403
        assert call(s, s.root, "delete", f"teams/{s.a.id}/").status_code == 400
        Portfolio.objects.filter(team=s.a).delete()
        assert call(s, s.root, "delete", f"teams/{s.a.id}/").status_code == 204

    def test_archive(self, s):
        assert call(s, s.admin_a, "post", f"teams/{s.a.id}/archive/").status_code == 403
        assert call(s, s.root, "post", f"teams/{s.a.id}/archive/").status_code == 200
        assert move(s, s.root, s.pa).status_code == 400
        assert call(s, s.root, "delete", f"teams/{s.a.id}/archive/").status_code == 200

    def test_other_workspace_is_404(self, s):
        other = Workspace.objects.create(name="Other", slug="other", owner=s.root)
        team = Team.objects.create(workspace=other, name="X")
        assert call(s, s.root, "get", f"teams/{team.id}/").status_code == 404
        portfolio = Portfolio.objects.create(team=team, name="X")
        assert move(s, s.root, portfolio).status_code == 404


@pytest.mark.contract
@pytest.mark.django_db
class TestTeamMembers:
    def test_add_and_remove_changes_access(self, s):
        assert move(s, s.root, s.pa).status_code == 200
        path = f"teams/{s.a.id}/members/"
        data = {"member_ids": [str(s.outsider.id)]}
        assert call(s, s.admin_b, "post", path, data).status_code == 403
        assert call(s, s.member, "post", path, data).status_code == 403
        response = call(s, s.admin_a, "post", path, data)
        assert response.status_code == 201
        assert role_in(s, s.outsider) == MEMBER
        pk = response.data[0]["id"]
        assert call(s, s.admin_b, "delete", f"{path}{pk}/").status_code == 403
        assert call(s, s.admin_a, "patch", f"{path}{pk}/", {"role": ADMIN}).status_code == 200
        assert role_in(s, s.outsider) == ADMIN
        assert call(s, s.admin_a, "delete", f"{path}{pk}/").status_code == 204
        assert role_in(s, s.outsider) is None

    def test_member_leaves_alone(self, s):
        assert call(s, s.member, "delete", f"teams/{s.a.id}/members/{s.membership.id}/").status_code == 204

    def test_guest_and_stranger_cannot_join(self, s):
        stranger = User.objects.create(email="z@plane.so", username="z")
        for user in (s.guest, stranger):
            response = call(s, s.admin_a, "post", f"teams/{s.a.id}/members/", {"member_ids": [str(user.id)]})
            assert response.status_code == 400

    def test_last_admin_is_protected(self, s):
        admin = TeamMember.objects.get(team=s.a, member=s.admin_a)
        path = f"teams/{s.a.id}/members/{admin.id}/"
        assert call(s, s.root, "patch", path, {"role": MEMBER}).status_code == 400
        assert call(s, s.root, "delete", path).status_code == 400
        workspace_member = WorkspaceMember.objects.get(member=s.admin_a)
        response = call(s, s.root, "delete", f"members/{workspace_member.id}/")
        assert response.status_code == 400
        assert "A" in response.data["error"]
        assert call(s, s.admin_a, "post", "members/leave/").status_code == 400
        assert WorkspaceMember.objects.get(member=s.admin_a).is_active is True

    def test_removal_from_workspace_and_demotion(self, s):
        move(s, s.root, s.pa)
        assert role_in(s, s.member) == MEMBER
        workspace_member = WorkspaceMember.objects.get(member=s.member)
        response = call(s, s.root, "patch", f"members/{workspace_member.id}/", {"role": GUEST})
        assert response.status_code == 200
        assert role_in(s, s.member) is None
        assert not TeamMember.objects.filter(member=s.member).exists()
        TeamMember.objects.create(team=s.a, member=s.outsider, role=MEMBER)
        workspace_member = WorkspaceMember.objects.get(member=s.outsider)
        assert call(s, s.root, "delete", f"members/{workspace_member.id}/").status_code == 204
        assert not TeamMember.objects.filter(member=s.outsider).exists()


@pytest.mark.contract
@pytest.mark.django_db
class TestPortfolios:
    def test_create_edit_delete(self, s):
        path = f"teams/{s.a.id}/portfolios/"
        assert call(s, s.admin_b, "post", path, {"name": "N"}).status_code == 403
        assert call(s, s.admin_a, "post", path, {"name": "PA"}).status_code == 400
        response = call(s, s.admin_a, "post", path, {"name": "N"})
        assert response.status_code == 201
        detail = f"portfolios/{response.data['id']}/"
        assert call(s, s.admin_b, "patch", detail, {"name": "M"}).status_code == 403
        assert call(s, s.admin_a, "patch", detail, {"name": "M", "team": str(s.b.id)}).status_code == 200
        assert Portfolio.objects.get(pk=response.data["id"]).team_id == s.a.id
        assert call(s, s.admin_a, "delete", detail).status_code == 204

    def test_non_empty_is_kept(self, s):
        move(s, s.root, s.pa)
        assert call(s, s.admin_a, "delete", f"portfolios/{s.pa.id}/").status_code == 400
        assert Project.objects.filter(pk=s.project.pk).exists()

    def test_management_team_has_no_portfolios(self, s):
        team = Team.objects.create(workspace=s.ws, name="M", kind="management")
        assert call(s, s.root, "post", f"teams/{team.id}/portfolios/", {"name": "N"}).status_code == 400

    def test_archive_keeps_access(self, s):
        move(s, s.root, s.pa)
        assert call(s, s.admin_a, "post", f"portfolios/{s.pa.id}/archive/").status_code == 200
        assert role_in(s, s.member) == MEMBER


@pytest.mark.contract
@pytest.mark.django_db
class TestMove:
    def test_permissions(self, s):
        assert move(s, s.admin_a, s.pa).status_code == 403
        assert move(s, s.root, s.pa).status_code == 200
        assert move(s, s.admin_a, s.pa2).status_code == 200
        assert move(s, s.member, s.pa).status_code == 403
        assert move(s, s.admin_a, s.pb).status_code == 403
        assert move(s, s.admin_a, None).status_code == 403
        assert move(s, s.root, s.pb).status_code == 200

    def test_dry_run_reports_without_writing(self, s):
        move(s, s.root, s.pa)
        response = move(s, s.root, s.pb, dry_run=True)
        assert response.status_code == 200
        assert {item["member"] for item in response.data["lost"]} == {str(s.admin_a.id), str(s.member.id)}
        assert {item["member"] for item in response.data["gained"]} == {str(s.admin_b.id)}
        s.project.refresh_from_db()
        assert s.project.portfolio_id == s.pa.id
        assert role_in(s, s.admin_b) is None
        assert role_in(s, s.admin_a) == ADMIN

    def test_project_patch_cannot_change_portfolio_or_flags(self, s):
        move(s, s.root, s.pa)
        response = call(s, s.admin_a, "patch", f"projects/{s.project.id}/", {"portfolio": str(s.pb.id)})
        assert response.status_code == 200
        s.project.refresh_from_db()
        assert s.project.portfolio_id == s.pa.id

    def test_closing_project_revokes_member(self, s):
        move(s, s.root, s.pa)
        assert call(s, s.admin_a, "patch", f"projects/{s.project.id}/", {"network": 0}).status_code == 200
        assert role_in(s, s.member) is None

    def test_list_returns_portfolio_and_team(self, s):
        move(s, s.root, s.pa)
        for path in ("projects/", "projects/details/"):
            response = call(s, s.admin_a, "get", path)
            assert str(response.data[0]["portfolio"]) == str(s.pa.id)
            assert str(response.data[0]["team"]) == str(s.a.id)


@pytest.mark.contract
@pytest.mark.django_db
class TestTeamManagedMembership:
    def _pk(self, s, user):
        return ProjectMember.objects.get(project=s.project, member=user).id

    def test_cannot_be_removed_by_hand(self, s):
        move(s, s.root, s.pa)
        path = f"projects/{s.project.id}/members/"
        assert call(s, s.admin_a, "delete", f"{path}{self._pk(s, s.member)}/").status_code == 409
        response = call(s, s.admin_a, "patch", f"{path}{self._pk(s, s.member)}/", {"is_active": False})
        assert response.status_code == 409
        assert call(s, s.member, "post", f"{path}leave/").status_code == 409

    def test_flags_are_read_only(self, s):
        move(s, s.root, s.pa)
        call(
            s,
            s.admin_a,
            "patch",
            f"projects/{s.project.id}/members/{self._pk(s, s.member)}/",
            {"is_team_managed": False, "manual_role": ADMIN},
        )
        membership = ProjectMember.objects.get(project=s.project, member=s.member)
        assert membership.is_team_managed is True
        assert membership.manual_role is None

    def test_manual_role_is_kept_next_to_team_role(self, s):
        move(s, s.root, s.pa)
        data = {"members": [{"member_id": str(s.member.id), "role": GUEST}]}
        assert call(s, s.admin_a, "post", f"projects/{s.project.id}/members/", data).status_code == 201
        assert role_in(s, s.member) == MEMBER
        call(s, s.admin_a, "delete", f"teams/{s.a.id}/members/{s.membership.id}/")
        assert role_in(s, s.member) == GUEST


@pytest.mark.contract
@pytest.mark.django_db
class TestProjectCreation:
    def _create(self, s, user, **extra):
        return call(s, user, "post", "projects/", {"name": "New", "identifier": "NEW", **extra})

    def test_flag_off_is_unchanged(self, s):
        response = self._create(s, s.member)
        assert response.status_code == 201
        assert Project.objects.get(identifier="NEW").portfolio_id is None

    def test_flag_on_needs_portfolio_of_own_team(self, s):
        Workspace.objects.filter(pk=s.ws.pk).update(is_team_structure_enabled=True)
        assert self._create(s, s.admin_a).status_code == 400
        assert self._create(s, s.member, portfolio_id=str(s.pa.id)).status_code == 403
        assert self._create(s, s.admin_a, portfolio_id=str(s.pb.id)).status_code == 403
        assert self._create(s, s.admin_a, portfolio_id="nope").status_code == 400
        assert not Project.objects.filter(identifier="NEW").exists()
        assert self._create(s, s.admin_a, portfolio_id=str(s.pa.id)).status_code == 201
        project = Project.objects.get(identifier="NEW")
        assert project.portfolio_id == s.pa.id
        assert ProjectMember.objects.get(project=project, member=s.member).role == MEMBER

    def test_external_api(self, s, api_key_client):
        url = f"/api/v1/workspaces/{s.ws.slug}/projects/"
        Workspace.objects.filter(pk=s.ws.pk).update(is_team_structure_enabled=True)
        data = {"name": "New", "identifier": "NEW"}
        assert api_key_client.post(url, data, format="json").status_code == 400
        data["portfolio_id"] = str(s.pa.id)
        assert api_key_client.post(url, data, format="json").status_code == 201
        project = Project.objects.get(identifier="NEW")
        assert project.portfolio_id == s.pa.id
        response = api_key_client.patch(f"{url}{project.id}/", {"portfolio": str(s.pb.id)}, format="json")
        assert response.status_code == 200
        project.refresh_from_db()
        assert project.portfolio_id == s.pa.id

    def test_flag_is_set_by_workspace_admin_only(self, s):
        assert client_for(s.member).patch(
            f"{s.url}/", {"is_team_structure_enabled": True}, format="json"
        ).status_code == 403
        assert client_for(s.root).patch(
            f"{s.url}/", {"is_team_structure_enabled": True}, format="json"
        ).status_code == 200


@pytest.mark.contract
@pytest.mark.django_db
class TestExistingMembershipFlows:
    def test_accepted_project_invite_is_a_manual_role(self, s):
        move(s, s.root, s.pa)
        invite = ProjectMemberInvite.objects.create(
            project=s.project, workspace=s.ws, email=s.member.email, role=GUEST, token="t"
        )
        response = client_for(s.member).post(
            f"{s.url}/projects/{s.project.id}/join/{invite.id}/", {"token": "t", "accepted": True}, format="json"
        )
        assert response.status_code == 200
        assert role_in(s, s.member) == MEMBER
        call(s, s.admin_a, "delete", f"teams/{s.a.id}/members/{s.membership.id}/")
        assert role_in(s, s.member) == GUEST

    def test_self_join_of_public_project_is_manual(self, s):
        move(s, s.root, s.pa)
        url = f"/api/users/me/workspaces/{s.ws.slug}/projects/invitations/"
        response = client_for(s.outsider).post(url, {"project_ids": [str(s.project.id)]}, format="json")
        assert response.status_code == 201
        assert ProjectMember.objects.get(project=s.project, member=s.outsider).is_team_managed is False

    def test_promotion_to_workspace_admin_raises_project_role(self, s):
        move(s, s.root, s.pa)
        workspace_member = WorkspaceMember.objects.get(member=s.member)
        path = f"members/{workspace_member.id}/"
        assert call(s, s.root, "patch", path, {"role": ADMIN}).status_code == 200
        assert role_in(s, s.member) == ADMIN
        assert call(s, s.root, "patch", path, {"role": MEMBER}).status_code == 200
        assert role_in(s, s.member) == MEMBER

    def test_last_team_admin_cannot_deactivate_account(self, s):
        response = client_for(s.admin_a).delete("/api/users/me/")
        assert response.status_code == 400
        assert User.objects.get(pk=s.admin_a.pk).is_active is True

    def test_removed_member_has_no_team_flag_left(self, s):
        move(s, s.root, s.pa)
        workspace_member = WorkspaceMember.objects.get(member=s.member)
        assert call(s, s.root, "delete", f"members/{workspace_member.id}/").status_code == 204
        membership = ProjectMember.objects.get(project=s.project, member=s.member)
        assert (membership.is_active, membership.is_team_managed) == (False, False)
