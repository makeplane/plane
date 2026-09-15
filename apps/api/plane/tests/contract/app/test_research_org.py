# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from types import SimpleNamespace

import pytest
from rest_framework.test import APIClient

from plane.db.models import MentorBinding, OrgUnit, OrgUnitMember, ResearchAuditEvent
from plane.tests.research_fixtures import (
    add_workspace_member,
    enable_research,
    make_user,
    make_workspace,
    mentors_url,
    org_units_url,
)

pytestmark = pytest.mark.contract


@pytest.fixture(autouse=True)
def research_module_on(settings):
    """Research endpoints are behind a deployment level switch."""
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
    guest = make_user(first_name="Guest")
    add_workspace_member(workspace, guest, role=5)
    outsider = make_user(first_name="Outsider")
    return SimpleNamespace(
        admin=admin,
        member=member,
        guest=guest,
        outsider=outsider,
        workspace=workspace,
        admin_client=client_for(admin),
        member_client=client_for(member),
        guest_client=client_for(guest),
        outsider_client=client_for(outsider),
    )


def create_unit(client, workspace, name, parent=None, unit_type="GROUP"):
    payload = {"name": name, "unit_type": unit_type}
    if parent is not None:
        if isinstance(parent, dict):
            payload["parent"] = parent["id"]
        elif isinstance(parent, str):
            payload["parent"] = parent
        else:
            payload["parent"] = str(parent.id)
    return client.post(org_units_url(workspace), payload, format="json")


@pytest.mark.django_db
class TestResearchModuleSwitch:
    def test_disabled_module_returns_error_envelope(self, env, settings):
        settings.RESEARCH_MODULE_ENABLED = False
        response = env.admin_client.get(org_units_url(env.workspace))
        assert response.status_code == 404
        assert response.json()["error_code"] == "research_module_disabled"

    def test_health_endpoint_stays_reachable(self, env, settings):
        settings.RESEARCH_MODULE_ENABLED = False
        response = env.admin_client.get("/api/research/health/")
        assert response.status_code == 200
        assert response.json()["module_enabled"] is False
        assert response.json()["limits"] == {"image_max_mb": 20, "pdf_max_mb": 100, "markdown_max_mb": 5}


@pytest.mark.django_db
class TestResearchOrgTreeApi:
    def test_root_is_created_lazily_and_four_levels_can_be_created(self, env):
        response = env.admin_client.get(org_units_url(env.workspace))
        assert response.status_code == 200
        assert response.json()["count"] == 1
        root = OrgUnit.objects.get(workspace=env.workspace)
        assert root.unit_type == OrgUnit.UnitType.ROOT

        college = create_unit(env.admin_client, env.workspace, "College", root, "INSTITUTE")
        assert college.status_code == 201
        lab = create_unit(env.admin_client, env.workspace, "Lab", college.json()["id"], "LAB")
        assert lab.status_code == 201
        group = create_unit(env.admin_client, env.workspace, "Group", lab.json()["id"], "GROUP")
        assert group.status_code == 201
        team = create_unit(env.admin_client, env.workspace, "Team", group.json()["id"], "TEAM")
        assert team.status_code == 201
        assert team.json()["depth"] == 4

        response = env.admin_client.get(org_units_url(env.workspace))
        assert response.json()["count"] == 5

    def test_second_root_is_rejected(self, env):
        env.admin_client.get(org_units_url(env.workspace))
        response = create_unit(env.admin_client, env.workspace, "Another root", None, "ROOT")
        assert response.status_code == 400
        assert response.json()["error_code"] == "org_unit_root_exists"

    def test_duplicate_name_under_same_parent_is_rejected(self, env):
        env.admin_client.get(org_units_url(env.workspace))
        root = OrgUnit.objects.get(workspace=env.workspace)
        assert create_unit(env.admin_client, env.workspace, "Group", root).status_code == 201
        response = create_unit(env.admin_client, env.workspace, "Group", root)
        assert response.status_code == 400
        assert response.json()["error_code"] == "org_unit_duplicate_name"

    def test_cycle_detection_rejects_moving_parent_under_descendant(self, env):
        env.admin_client.get(org_units_url(env.workspace))
        root = OrgUnit.objects.get(workspace=env.workspace)
        college = create_unit(env.admin_client, env.workspace, "College", root, "INSTITUTE").json()
        lab = create_unit(env.admin_client, env.workspace, "Lab", college["id"], "LAB").json()

        response = env.admin_client.patch(
            org_units_url(env.workspace, f"{college['id']}/"),
            {"parent": lab["id"]},
            format="json",
        )
        assert response.status_code == 400
        assert response.json()["error_code"] == "org_unit_cycle_detected"

        response = env.admin_client.patch(
            org_units_url(env.workspace, f"{college['id']}/"),
            {"parent": college["id"]},
            format="json",
        )
        assert response.status_code == 400
        assert response.json()["error_code"] == "org_unit_cycle_detected"

    def test_move_reparent_rewrites_subtree(self, env):
        env.admin_client.get(org_units_url(env.workspace))
        root = OrgUnit.objects.get(workspace=env.workspace)
        lab_a = create_unit(env.admin_client, env.workspace, "Lab A", root, "LAB").json()
        lab_b = create_unit(env.admin_client, env.workspace, "Lab B", root, "LAB").json()
        group = create_unit(env.admin_client, env.workspace, "Group", lab_a["id"], "GROUP").json()

        response = env.admin_client.patch(
            org_units_url(env.workspace, f"{group['id']}/"),
            {"parent": lab_b["id"]},
            format="json",
        )
        assert response.status_code == 200
        moved = OrgUnit.objects.get(pk=group["id"])
        assert str(moved.parent_id) == lab_b["id"]
        assert moved.path.startswith(OrgUnit.objects.get(pk=lab_b["id"]).path)

    def test_soft_delete_removes_subtree_from_tree_but_keeps_history(self, env):
        env.admin_client.get(org_units_url(env.workspace))
        root = OrgUnit.objects.get(workspace=env.workspace)
        lab = create_unit(env.admin_client, env.workspace, "Lab", root, "LAB").json()
        group = create_unit(env.admin_client, env.workspace, "Group", lab["id"], "GROUP").json()
        env.admin_client.post(
            org_units_url(env.workspace, f"{group['id']}/members/"),
            {"user": str(env.member.id), "org_role": "PI"},
            format="json",
        )

        response = env.admin_client.delete(org_units_url(env.workspace, f"{lab['id']}/"))
        assert response.status_code == 204

        listing = env.admin_client.get(org_units_url(env.workspace)).json()
        listed_ids = {unit["id"] for unit in listing["results"]}
        assert lab["id"] not in listed_ids
        assert group["id"] not in listed_ids

        # history is retained in the database and in the audit trail
        assert OrgUnit.all_objects.filter(pk__in=[lab["id"], group["id"]]).count() == 2
        assert OrgUnitMember.objects.filter(org_unit_id=group["id"]).count() == 1
        assert ResearchAuditEvent.objects.filter(
            workspace=env.workspace, action="org.unit.delete"
        ).exists()

    def test_root_unit_cannot_be_deleted(self, env):
        env.admin_client.get(org_units_url(env.workspace))
        root = OrgUnit.objects.get(workspace=env.workspace)
        response = env.admin_client.delete(org_units_url(env.workspace, f"{root.id}/"))
        assert response.status_code == 400
        assert response.json()["error_code"] == "org_unit_root_undeletable"

    def test_create_and_update_write_audit_events(self, env):
        env.admin_client.get(org_units_url(env.workspace))
        root = OrgUnit.objects.get(workspace=env.workspace)
        college = create_unit(env.admin_client, env.workspace, "College", root, "INSTITUTE").json()
        env.admin_client.patch(
            org_units_url(env.workspace, f"{college['id']}/"),
            {"name": "College of Science"},
            format="json",
        )
        actions = set(
            ResearchAuditEvent.objects.filter(workspace=env.workspace).values_list("action", flat=True)
        )
        assert {"org.unit.create", "org.unit.update"} <= actions
        event = ResearchAuditEvent.objects.filter(action="org.unit.create").first()
        assert event.actor_id == env.admin.id
        assert str(event.resource_id) == college["id"]

    def test_member_cannot_manage_tree_without_org_role(self, env):
        env.admin_client.get(org_units_url(env.workspace))
        root = OrgUnit.objects.get(workspace=env.workspace)
        response = create_unit(env.member_client, env.workspace, "College", root, "INSTITUTE")
        assert response.status_code == 403
        assert response.json()["error_code"] == "research_permission_denied"

    def test_guest_has_no_research_access(self, env):
        response = env.guest_client.get(org_units_url(env.workspace))
        assert response.status_code == 403

    def test_non_member_sees_workspace_as_missing(self, env):
        response = env.outsider_client.get(org_units_url(env.workspace))
        assert response.status_code == 404
        assert response.json()["error_code"] == "research_workspace_not_found"


@pytest.mark.django_db
class TestResearchOrgMembershipApi:
    def _bootstrap(self, env):
        env.admin_client.get(org_units_url(env.workspace))
        root = OrgUnit.objects.get(workspace=env.workspace)
        return create_unit(env.admin_client, env.workspace, "Group", root, "GROUP").json()

    def test_member_roles_support_multiple_people_per_role(self, env):
        group = self._bootstrap(env)
        second_pi = make_user()
        add_workspace_member(env.workspace, second_pi)

        first = env.admin_client.post(
            org_units_url(env.workspace, f"{group['id']}/members/"),
            {"user": str(env.member.id), "org_role": "PI"},
            format="json",
        )
        assert first.status_code == 201
        second = env.admin_client.post(
            org_units_url(env.workspace, f"{group['id']}/members/"),
            {"user": str(second_pi.id), "org_role": "PI"},
            format="json",
        )
        assert second.status_code == 201

        listing = env.admin_client.get(org_units_url(env.workspace, f"{group['id']}/members/")).json()
        assert listing["count"] == 2

    def test_duplicate_role_assignment_is_rejected(self, env):
        group = self._bootstrap(env)
        payload = {"user": str(env.member.id), "org_role": "PI"}
        created = env.admin_client.post(
            org_units_url(env.workspace, f"{group['id']}/members/"), payload, format="json"
        )
        assert created.status_code == 201
        duplicate = env.admin_client.post(
            org_units_url(env.workspace, f"{group['id']}/members/"), payload, format="json"
        )
        assert duplicate.status_code == 400
        assert duplicate.json()["error_code"] == "org_member_exists"

    def test_pi_transfer_swaps_roles_and_is_audited(self, env):
        group = self._bootstrap(env)
        successor = make_user()
        add_workspace_member(env.workspace, successor)
        env.admin_client.post(
            org_units_url(env.workspace, f"{group['id']}/members/"),
            {"user": str(env.member.id), "org_role": "PI"},
            format="json",
        )

        response = env.admin_client.post(
            org_units_url(env.workspace, f"{group['id']}/pi/"),
            {"user_ids": [str(successor.id)]},
            format="json",
        )
        assert response.status_code == 200
        pi_user_ids = {member["user"] for member in response.json()["results"]}
        assert pi_user_ids == {str(successor.id)}

        # the previous PI keeps their history but loses the management role
        assert not OrgUnitMember.objects.filter(
            org_unit_id=group["id"], user=env.member, org_role="PI"
        ).exists()
        event = ResearchAuditEvent.objects.filter(action="org.pi.transfer").first()
        assert event is not None
        assert str(env.member.id) in event.metadata["removed"]
        assert str(successor.id) in event.metadata["added"]

    def test_effective_window_excludes_expired_relations(self, env):
        group = self._bootstrap(env)
        env.admin_client.post(
            org_units_url(env.workspace, f"{group['id']}/members/"),
            {
                "user": str(env.member.id),
                "org_role": "PI",
                "effective_from": "2020-01-01",
                "effective_to": "2020-12-31",
            },
            format="json",
        )
        response = create_unit(env.member_client, env.workspace, "Sub group", group, "GROUP")
        assert response.status_code == 403

    def test_member_can_manage_subtree_after_grant(self, env):
        group = self._bootstrap(env)
        env.admin_client.post(
            org_units_url(env.workspace, f"{group['id']}/members/"),
            {"user": str(env.member.id), "org_role": "OWNER"},
            format="json",
        )
        response = create_unit(env.member_client, env.workspace, "Sub group", group, "GROUP")
        assert response.status_code == 201

    def test_member_removal_is_soft_and_audited(self, env):
        group = self._bootstrap(env)
        member = env.admin_client.post(
            org_units_url(env.workspace, f"{group['id']}/members/"),
            {"user": str(env.member.id), "org_role": "PI"},
            format="json",
        ).json()
        response = env.admin_client.delete(
            org_units_url(env.workspace, f"{group['id']}/members/{member['id']}/")
        )
        assert response.status_code == 204
        assert not OrgUnitMember.objects.filter(pk=member["id"]).exists()
        assert OrgUnitMember.all_objects.filter(pk=member["id"]).exists()
        assert ResearchAuditEvent.objects.filter(action="org.member.remove").exists()

    def test_primary_org_unit_is_unique_per_user(self, env):
        group = self._bootstrap(env)
        root = OrgUnit.objects.filter(workspace=env.workspace, unit_type=OrgUnit.UnitType.ROOT).first()
        other = create_unit(env.admin_client, env.workspace, "Other", root, "GROUP").json()
        env.admin_client.post(
            org_units_url(env.workspace, f"{group['id']}/members/"),
            {"user": str(env.member.id), "org_role": "PI", "is_primary": True},
            format="json",
        )
        env.admin_client.post(
            org_units_url(env.workspace, f"{other['id']}/members/"),
            {"user": str(env.member.id), "org_role": "PI", "is_primary": True},
            format="json",
        )
        primaries = OrgUnitMember.objects.filter(workspace=env.workspace, user=env.member, is_primary=True)
        assert primaries.count() == 1
        assert str(primaries.first().org_unit_id) == other["id"]


@pytest.mark.django_db
class TestResearchMentorBindingsApi:
    def _group(self, env):
        env.admin_client.get(org_units_url(env.workspace))
        root = OrgUnit.objects.get(workspace=env.workspace)
        group = create_unit(env.admin_client, env.workspace, "Group", root, "GROUP").json()
        env.admin_client.post(
            org_units_url(env.workspace, f"{group['id']}/members/"),
            {"user": str(env.member.id), "org_role": "PI"},
            format="json",
        )
        return group

    def test_one_mentee_can_bind_two_direct_advisors(self, env):
        group = self._group(env)
        student = make_user(first_name="Student")
        advisor_one = make_user(first_name="AdvisorOne")
        advisor_two = make_user(first_name="AdvisorTwo")
        for user in (student, advisor_one, advisor_two):
            add_workspace_member(env.workspace, user)

        for advisor in (advisor_one, advisor_two):
            response = env.admin_client.post(
                mentors_url(env.workspace),
                {"mentee": str(student.id), "mentor": str(advisor.id), "org_unit": group["id"]},
                format="json",
            )
            assert response.status_code == 201

        listing = env.admin_client.get(f"{mentors_url(env.workspace)}?mentee={student.id}").json()
        assert listing["count"] == 2
        assert MentorBinding.objects.filter(workspace=env.workspace, mentee=student).count() == 2

    def test_duplicate_and_self_bindings_are_rejected(self, env):
        group = self._group(env)
        student = make_user()
        advisor = make_user()
        add_workspace_member(env.workspace, student)
        add_workspace_member(env.workspace, advisor)
        payload = {"mentee": str(student.id), "mentor": str(advisor.id), "org_unit": group["id"]}
        assert env.admin_client.post(mentors_url(env.workspace), payload, format="json").status_code == 201
        duplicate = env.admin_client.post(mentors_url(env.workspace), payload, format="json")
        assert duplicate.status_code == 400
        assert duplicate.json()["error_code"] == "mentor_binding_exists"

        self_binding = env.admin_client.post(
            mentors_url(env.workspace),
            {"mentee": str(student.id), "mentor": str(student.id), "org_unit": group["id"]},
            format="json",
        )
        assert self_binding.status_code == 400
        assert self_binding.json()["error_code"] == "mentor_binding_invalid"

    def test_unbinding_removes_the_relationship_and_audits(self, env):
        group = self._group(env)
        student = make_user()
        advisor = make_user()
        add_workspace_member(env.workspace, student)
        add_workspace_member(env.workspace, advisor)
        binding = env.admin_client.post(
            mentors_url(env.workspace),
            {"mentee": str(student.id), "mentor": str(advisor.id), "org_unit": group["id"]},
            format="json",
        ).json()

        response = env.admin_client.delete(mentors_url(env.workspace, f"{binding['id']}/"))
        assert response.status_code == 204
        assert MentorBinding.objects.filter(pk=binding["id"]).count() == 0
        assert MentorBinding.all_objects.filter(pk=binding["id"]).count() == 1
        assert ResearchAuditEvent.objects.filter(action="org.mentor.unbind").exists()

    def test_member_without_org_role_cannot_bind_mentors(self, env):
        group = self._group(env)
        plain_member = make_user()
        add_workspace_member(env.workspace, plain_member)
        student = make_user()
        advisor = make_user()
        add_workspace_member(env.workspace, student)
        add_workspace_member(env.workspace, advisor)
        response = client_for(plain_member).post(
            mentors_url(env.workspace),
            {"mentee": str(student.id), "mentor": str(advisor.id), "org_unit": group["id"]},
            format="json",
        )
        assert response.status_code == 403
