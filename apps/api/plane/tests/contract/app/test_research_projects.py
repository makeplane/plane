# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework.test import APIClient

from plane.db.models import (
    MentorBinding,
    OrgUnit,
    OrgUnitMember,
    Project,
    ProjectMember,
    ResearchAuditEvent,
    ResearchProjectProfile,
    ResearchStageInstance,
    State,
)
from plane.tests.research_fixtures import (
    add_workspace_member,
    enable_research,
    make_user,
    make_workspace,
)

pytestmark = pytest.mark.contract


@pytest.fixture(autouse=True)
def research_module_on(settings):
    settings.RESEARCH_MODULE_ENABLED = True


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def env(db):
    admin = make_user(first_name="Admin")
    workspace = make_workspace(admin)
    enable_research(workspace)
    member = make_user(first_name="Member")
    add_workspace_member(workspace, member)
    root = OrgUnit.objects.create(
        workspace=workspace,
        name=workspace.name,
        parent=None,
        unit_type=OrgUnit.UnitType.ROOT,
        depth=0,
        path="",
    )
    root.path = f"/{str(root.id).replace('-', '')}/"
    root.save(update_fields=["path"])
    group = OrgUnit.objects.create(
        workspace=workspace,
        name="Group",
        parent=root,
        unit_type=OrgUnit.UnitType.GROUP,
        depth=1,
        path="",
    )
    group.path = f"{root.path}{str(group.id).replace('-', '')}/"
    group.save(update_fields=["path"])
    OrgUnitMember.objects.create(
        workspace=workspace,
        org_unit=group,
        user=member,
        org_role=OrgUnitMember.OrgRole.PI,
        is_primary=True,
    )
    return {
        "admin": admin,
        "member": member,
        "workspace": workspace,
        "root": root,
        "group": group,
        "admin_client": client_for(admin),
        "member_client": client_for(member),
        "url": f"/api/research/workspaces/{workspace.slug}/projects/",
    }


@pytest.mark.django_db
class TestResearchProjectCreation:
    def test_admin_can_create_for_a_member(self, env):
        response = env["admin_client"].post(
            env["url"],
            {
                "owner": str(env["member"].id),
                "org_unit": str(env["group"].id),
                "research_type": "PHD",
            },
            format="json",
        )
        assert response.status_code == 201
        payload = response.json()
        assert payload["is_research_project"] is True
        assert payload["research"]["workflow_status"] == "ACTIVE"
        assert payload["research"]["research_type"] == "PHD"

        project = Project.objects.get(pk=payload["id"])
        assert project.identifier
        # the upstream default state set is provisioned for the new project
        assert State.objects.filter(project=project).count() >= 5
        assert State.objects.filter(project=project, default=True).exists()
        membership = ProjectMember.objects.get(project=project, member=env["member"])
        assert membership.role == 20

    def test_second_active_cultivation_project_is_rejected(self, env):
        assert (
            env["admin_client"]
            .post(
                env["url"],
                {"owner": str(env["member"].id), "research_type": "PHD"},
                format="json",
            )
            .status_code
            == 201
        )
        duplicate = env["admin_client"].post(
            env["url"],
            {"owner": str(env["member"].id), "research_type": "MASTER"},
            format="json",
        )
        assert duplicate.status_code == 409
        assert duplicate.json()["error_code"] == "research_project_exists"

    def test_multiple_team_projects_are_allowed_without_workspace_override(self, env):
        first = env["admin_client"].post(
            env["url"],
            {"owner": str(env["member"].id), "research_type": "RESEARCH_PROJECT"},
            format="json",
        )
        second = env["admin_client"].post(
            env["url"],
            {"owner": str(env["member"].id), "research_type": "RESEARCH_PROJECT"},
            format="json",
        )
        assert first.status_code == 201
        assert second.status_code == 201
        assert ResearchProjectProfile.objects.filter(workspace=env["workspace"]).count() == 2

    def test_workspace_admin_can_create_team_project_without_org_assignment(self, env):
        response = env["admin_client"].post(
            env["url"],
            {"name": "Unassigned team project", "research_type": "RESEARCH_PROJECT"},
            format="json",
        )

        assert response.status_code == 201
        assert response.json()["research"]["org_unit"] is None

    def test_cultivation_project_without_org_is_created_as_pending_classification(self, env):
        response = env["admin_client"].post(
            env["url"],
            {"name": "Unassigned cultivation", "research_type": "PHD"},
            format="json",
        )

        assert response.status_code == 201
        assert response.json()["research"]["org_unit"] is None

    def test_team_project_adds_valid_workspace_collaborators(self, env):
        collaborator = make_user(first_name="Collaborator")
        add_workspace_member(env["workspace"], collaborator)

        response = env["member_client"].post(
            env["url"],
            {
                "name": "Collaborative team project",
                "research_type": "RESEARCH_PROJECT",
                "collaborator_ids": [str(collaborator.id)],
            },
            format="json",
        )

        assert response.status_code == 201, response.json()
        assert response.json()["collaborator_ids"] == [str(collaborator.id)]
        assert ProjectMember.objects.filter(
            project_id=response.json()["id"],
            member=collaborator,
            role=15,
            is_active=True,
        ).exists()

    def test_team_project_rejects_non_workspace_collaborators_atomically(self, env):
        outsider = make_user(first_name="Outsider")

        response = env["member_client"].post(
            env["url"],
            {
                "name": "Invalid collaborators",
                "research_type": "RESEARCH_PROJECT",
                "collaborator_ids": [str(outsider.id)],
            },
            format="json",
        )

        assert response.status_code == 403
        assert not Project.objects.filter(workspace=env["workspace"], name="Invalid collaborators").exists()

    def test_multiple_cultivation_projects_remain_rejected_when_legacy_override_is_enabled(self, env):
        env["admin_client"].patch(
            f"/api/research/workspaces/{env['workspace'].slug}/settings/",
            {"allow_multiple_projects": True},
            format="json",
        )
        assert (
            env["admin_client"]
            .post(
                env["url"],
                {"owner": str(env["member"].id), "research_type": "PHD"},
                format="json",
            )
            .status_code
            == 201
        )
        second = env["admin_client"].post(
            env["url"],
            {"owner": str(env["member"].id), "research_type": "POSTDOC"},
            format="json",
        )
        assert second.status_code == 409

    def test_creation_infers_primary_org_and_keeps_plane_project_private(self, env):
        response = env["member_client"].post(env["url"], {"research_type": "PHD", "name": "培养项目"}, format="json")
        assert response.status_code == 201
        assert response.json()["research"]["org_unit"] == str(env["group"].id)
        assert Project.objects.get(pk=response.json()["id"]).network == 0

    def test_member_cannot_spoof_another_org_unit_on_creation(self, env):
        other = OrgUnit.objects.create(
            workspace=env["workspace"],
            name="Other group",
            parent=env["root"],
            unit_type=OrgUnit.UnitType.GROUP,
            depth=1,
            path="",
        )
        other.path = f"{env['root'].path}{str(other.id).replace('-', '')}/"
        other.save(update_fields=["path"])

        response = env["member_client"].post(
            env["url"],
            {"research_type": "RESEARCH_PROJECT", "org_unit": str(other.id)},
            format="json",
        )

        assert response.status_code == 403
        assert ResearchProjectProfile.objects.filter(owner=env["member"]).count() == 0

    def test_mentor_and_management_chain_can_list_private_research_metadata(self, env):
        created = (
            env["admin_client"]
            .post(
                env["url"],
                {"owner": str(env["member"].id), "research_type": "PHD"},
                format="json",
            )
            .json()
        )
        mentor = make_user(first_name="Mentor")
        manager = make_user(first_name="Direction head")
        for user in (mentor, manager):
            add_workspace_member(env["workspace"], user)
        MentorBinding.objects.create(
            workspace=env["workspace"],
            mentee=env["member"],
            mentor=mentor,
            org_unit=env["group"],
        )
        OrgUnitMember.objects.create(
            workspace=env["workspace"],
            org_unit=env["root"],
            user=manager,
            org_role=OrgUnitMember.OrgRole.OWNER,
            is_primary=True,
        )

        mentor_list = client_for(mentor).get(env["url"]).json()
        manager_list = client_for(manager).get(env["url"]).json()

        assert {item["id"] for item in mentor_list["results"]} == {created["id"]}
        assert {item["id"] for item in manager_list["results"]} == {created["id"]}

    def test_cultivation_project_initializes_stages_but_team_project_does_not(self, env):
        cultivation = env["member_client"].post(env["url"], {"research_type": "PHD"}, format="json")
        team = env["member_client"].post(env["url"], {"research_type": "RESEARCH_PROJECT"}, format="json")
        assert cultivation.status_code == 201
        assert team.status_code == 201
        assert ResearchStageInstance.objects.filter(project_id=cultivation.json()["id"]).count() == 4
        assert ResearchStageInstance.objects.filter(project_id=team.json()["id"]).count() == 0

    def test_member_creates_their_own_project(self, env):
        response = env["member_client"].post(env["url"], {"research_type": "POSTDOC"}, format="json")
        assert response.status_code == 201
        assert response.json()["research"]["owner"] == str(env["member"].id)

    def test_member_cannot_create_for_someone_else(self, env):
        response = env["member_client"].post(env["url"], {"owner": str(env["admin"].id)}, format="json")
        assert response.status_code == 403

    def test_creating_an_account_without_research_role_is_denied(self, env):
        stranger = make_user()
        add_workspace_member(env["workspace"], stranger)
        response = client_for(stranger).post(env["url"], {}, format="json")
        assert response.status_code == 403

    def test_creation_is_audited(self, env):
        env["admin_client"].post(env["url"], {"owner": str(env["member"].id)}, format="json")
        assert ResearchAuditEvent.objects.filter(action="project.create").exists()


@pytest.mark.django_db
class TestResearchProjectLifecycle:
    def _create(self, env, **payload):
        return env["admin_client"].post(env["url"], {"owner": str(env["member"].id), **payload}, format="json").json()

    def test_archive_keeps_the_project_and_records_audit(self, env):
        created = self._create(env)
        response = env["admin_client"].post(f"{env['url']}{created['id']}/archive/", {}, format="json")
        assert response.status_code == 200
        assert response.json()["research"]["workflow_status"] == "ARCHIVED"
        assert Project.objects.filter(pk=created["id"]).exists()
        assert ResearchAuditEvent.objects.filter(action="project.archive").exists()

    def test_restore_reactivates_the_profile(self, env):
        created = self._create(env)
        env["admin_client"].post(f"{env['url']}{created['id']}/archive/", {}, format="json")
        response = env["admin_client"].post(f"{env['url']}{created['id']}/restore/", {}, format="json")
        assert response.status_code == 200
        assert response.json()["research"]["workflow_status"] == "ACTIVE"
        assert ResearchAuditEvent.objects.filter(action="project.restore").exists()

    def test_restore_conflicts_with_another_active_project(self, env):
        created = self._create(env, research_type="PHD")
        env["admin_client"].post(f"{env['url']}{created['id']}/archive/", {}, format="json")
        self._create(env, research_type="MASTER")
        response = env["admin_client"].post(f"{env['url']}{created['id']}/restore/", {}, format="json")
        assert response.status_code == 409

    def test_team_project_cannot_be_changed_into_a_second_active_cultivation_project(self, env):
        self._create(env, research_type="PHD")
        team = self._create(env, research_type="RESEARCH_PROJECT")
        response = env["admin_client"].patch(
            f"{env['url']}{team['id']}/",
            {"research_type": "MASTER"},
            format="json",
        )
        assert response.status_code == 409

    def test_patch_updates_research_metadata(self, env):
        created = self._create(env)
        response = env["admin_client"].patch(
            f"{env['url']}{created['id']}/",
            {
                "research_type": "MASTER",
                "org_unit": str(env["group"].id),
                "started_at": "2026-09-01",
                "expected_end_at": "2029-06-30",
            },
            format="json",
        )
        assert response.status_code == 200
        research = response.json()["research"]
        assert research["research_type"] == "MASTER"
        assert research["org_unit"] == str(env["group"].id)
        assert research["started_at"] == "2026-09-01"

    def test_converting_team_project_to_cultivation_initializes_stages(self, env):
        team = self._create(env, research_type="RESEARCH_PROJECT")

        response = env["admin_client"].patch(
            f"{env['url']}{team['id']}/",
            {"research_type": "MASTER"},
            format="json",
        )

        assert response.status_code == 200
        assert ResearchStageInstance.objects.filter(project_id=team["id"]).count() == 4

    def test_owner_change_is_admin_only_and_audited(self, env):
        created = self._create(env)
        successor = make_user()
        add_workspace_member(env["workspace"], successor)
        denied = env["member_client"].patch(
            f"{env['url']}{created['id']}/", {"owner": str(successor.id)}, format="json"
        )
        assert denied.status_code == 403

        response = env["admin_client"].patch(
            f"{env['url']}{created['id']}/", {"owner": str(successor.id)}, format="json"
        )
        assert response.status_code == 200
        assert ResearchAuditEvent.objects.filter(action="project.owner.change").exists()

    def test_listing_filters_by_owner_and_status(self, env):
        self._create(env)
        other = make_user()
        add_workspace_member(env["workspace"], other)
        OrgUnitMember.objects.create(
            workspace=env["workspace"],
            org_unit=env["group"],
            user=other,
            org_role=OrgUnitMember.OrgRole.PI,
        )
        env["admin_client"].post(env["url"], {"owner": str(other.id)}, format="json")

        mine = env["member_client"].get(f"{env['url']}?mine=true").json()
        assert mine["count"] == 1
        assert mine["results"][0]["research"]["owner"] == str(env["member"].id)

        by_owner = env["admin_client"].get(f"{env['url']}?owner={other.id}").json()
        assert by_owner["count"] == 1

        by_status = env["admin_client"].get(f"{env['url']}?workflow_status=ARCHIVED").json()
        assert by_status["count"] == 0


@pytest.mark.django_db
class TestProjectCompatibilityFlag:
    def test_secret_research_project_metadata_is_hidden_from_non_members(self, env):
        created = (
            env["admin_client"]
            .post(
                env["url"],
                {"owner": str(env["member"].id), "research_type": "PHD"},
                format="json",
            )
            .json()
        )
        outsider = make_user()
        add_workspace_member(env["workspace"], outsider)
        other_root = OrgUnit.objects.create(
            workspace=env["workspace"],
            name="Other group",
            parent=env["root"],
            unit_type=OrgUnit.UnitType.GROUP,
            path="",
            depth=1,
        )
        other_root.path = f"{env['root'].path}{str(other_root.id).replace('-', '')}/"
        other_root.save(update_fields=["path"])
        OrgUnitMember.objects.create(
            workspace=env["workspace"],
            org_unit=other_root,
            user=outsider,
            org_role=OrgUnitMember.OrgRole.REVIEWER,
            is_primary=True,
        )

        response = client_for(outsider).get(f"{env['url']}{created['id']}/")

        assert response.status_code == 404

    def test_upstream_project_list_marks_research_projects_only(self, env):
        plain = Project.objects.create(
            workspace=env["workspace"],
            name="Plain project",
            identifier="PLAIN",
            network=2,
        )
        ProjectMember.objects.create(project=plain, member=env["admin"], role=20)
        env["admin_client"].post(env["url"], {"owner": str(env["member"].id)}, format="json")

        response = env["admin_client"].get(f"/api/workspaces/{env['workspace'].slug}/projects/")
        assert response.status_code == 200
        payload = response.json()
        by_name = {item["name"]: item for item in payload}
        assert by_name["Plain project"]["is_research_project"] is False
        research_projects = [item for item in payload if item["is_research_project"] is True]
        assert len(research_projects) == 1
