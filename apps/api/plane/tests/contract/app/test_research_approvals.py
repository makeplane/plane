# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework.test import APIClient

from plane.db.models import (
    ApprovalAction,
    ApprovalFlow,
    ApprovalRequest,
    Issue,
    Notification,
    OrgUnit,
    OrgUnitMember,
    Project,
    ProjectMember,
    State,
)
from plane.tests.research_fixtures import add_workspace_member, enable_research, make_user, make_workspace

pytestmark = pytest.mark.contract


@pytest.fixture(autouse=True)
def research_module_on(settings):
    settings.RESEARCH_MODULE_ENABLED = True


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def create_unit(workspace, name, parent=None, unit_type=OrgUnit.UnitType.GROUP):
    unit = OrgUnit.objects.create(
        workspace=workspace,
        name=name,
        parent=parent,
        unit_type=unit_type,
        depth=(parent.depth + 1) if parent else 0,
        path="",
    )
    unit.path = (parent.path if parent else "/") + str(unit.id).replace("-", "") + "/"
    unit.save(update_fields=["path"])
    return unit


def bootstrap_project(workspace, owner):
    project = Project.objects.create(
        workspace=workspace,
        name=f"approvals {owner.first_name}",
        identifier=f"AP{owner.first_name[:3].upper()}",
        network=2,
        created_by=owner,
    )
    ProjectMember.objects.create(project=project, member=owner, role=20)
    states = {}
    for name, group, sequence in (
        ("Backlog", "backlog", 15000),
        ("Todo", "unstarted", 25000),
        ("Done", "completed", 45000),
    ):
        states[group] = State.objects.create(
            name=name,
            group=group,
            color="#000000",
            sequence=sequence,
            project=project,
            workspace=workspace,
            default=group == "backlog",
        )
    return project, states


@pytest.fixture
def env(db):
    admin = make_user(first_name="Admin")
    workspace = make_workspace(admin)
    enable_research(workspace)
    requester = make_user(first_name="Requester", email="requester@example.com")
    lead = make_user(first_name="Lead", email="lead@example.com")
    director = make_user(first_name="Director", email="director@example.com")
    bystander = make_user(first_name="Bystander")
    for user in (requester, lead, director, bystander):
        add_workspace_member(workspace, user)

    root = create_unit(workspace, "Root", None, OrgUnit.UnitType.ROOT)
    group = create_unit(workspace, "Group", root, OrgUnit.UnitType.GROUP)
    OrgUnitMember.objects.create(
        workspace=workspace, org_unit=group, user=requester, org_role=OrgUnitMember.OrgRole.OWNER
    )
    OrgUnitMember.objects.create(
        workspace=workspace, org_unit=group, user=lead, org_role=OrgUnitMember.OrgRole.PI
    )

    project, states = bootstrap_project(workspace, admin)
    issue = Issue.objects.create(
        name="Buy a pump",
        project=project,
        workspace=workspace,
        state=states["backlog"],
        created_by=requester,
    )

    return {
        "admin": admin,
        "requester": requester,
        "lead": lead,
        "director": director,
        "bystander": bystander,
        "workspace": workspace,
        "group": group,
        "project": project,
        "states": states,
        "issue": issue,
        "admin_client": client_for(admin),
        "requester_client": client_for(requester),
        "lead_client": client_for(lead),
        "director_client": client_for(director),
        "bystander_client": client_for(bystander),
        "flows_url": f"/api/research/workspaces/{workspace.slug}/approval-flows/",
        "requests_url": f"/api/research/workspaces/{workspace.slug}/approval-requests/",
    }


def create_two_step_flow(env):
    return env["admin_client"].post(
        env["flows_url"],
        {
            "name": "Purchase approval",
            "approval_type": "PURCHASE",
            "org_unit": str(env["group"].id),
            "steps": [
                {"order": 1, "approver_org_role": "PI", "approver_mode": "ANY"},
                {"order": 2, "approver_user": str(env["director"].id), "approver_mode": "ANY"},
            ],
        },
        format="json",
    )


def create_request(env, client=None, **payload):
    return (client or env["requester_client"]).post(
        env["requests_url"],
        {
            "issue": str(env["issue"].id),
            "approval_type": "PURCHASE",
            "org_unit": str(env["group"].id),
            **payload,
        },
        format="json",
    )


@pytest.mark.django_db
class TestApprovalFlowConfiguration:
    def test_admin_creates_a_two_step_flow(self, env):
        response = create_two_step_flow(env)
        assert response.status_code == 201
        payload = response.json()
        assert payload["version"] == 1
        assert [step["order"] for step in payload["steps"]] == [1, 2]
        assert payload["steps"][0]["approver_org_role"] == "PI"
        assert payload["steps"][1]["approver_user"] == str(env["director"].id)

    def test_member_cannot_configure_flows(self, env):
        response = env["bystander_client"].post(
            env["flows_url"],
            {"name": "X", "approval_type": "TASK", "steps": [{"order": 1, "approver_org_role": "PI"}]},
            format="json",
        )
        assert response.status_code == 403

    def test_flow_without_steps_is_rejected(self, env):
        response = env["admin_client"].post(
            env["flows_url"], {"name": "Empty", "approval_type": "TASK", "steps": []}, format="json"
        )
        assert response.status_code == 400

    def test_update_publishes_a_new_version(self, env):
        flow = create_two_step_flow(env).json()
        updated = env["admin_client"].patch(
            f"{env['flows_url']}{flow['id']}/",
            {"steps": [{"order": 1, "approver_user": str(env["director"].id)}]},
            format="json",
        )
        assert updated.status_code == 200
        assert updated.json()["version"] == 2
        assert len(updated.json()["steps"]) == 1
        assert ApprovalFlow.objects.filter(pk=flow["id"]).first().is_active is False


@pytest.mark.django_db
class TestApprovalWorkflow:
    def test_full_two_step_approval_moves_the_issue(self, env):
        create_two_step_flow(env)
        created = create_request(env)
        assert created.status_code == 201
        request_id = created.json()["id"]
        assert created.json()["current_step_order"] == 1

        # the organisation PI approves step one
        first = env["lead_client"].post(f"{env['requests_url']}{request_id}/approve/", {}, format="json")
        assert first.status_code == 200
        assert first.json()["current_step_order"] == 2
        assert first.json()["status"] == "PENDING"

        second = env["director_client"].post(f"{env['requests_url']}{request_id}/approve/", {}, format="json")
        assert second.status_code == 200
        assert second.json()["status"] == "APPROVED"

        env["issue"].refresh_from_db()
        assert env["issue"].state.group == "completed"
        assert ApprovalAction.objects.filter(request_id=request_id).count() == 2

    def test_rejection_stops_the_flow_and_returns_the_issue(self, env):
        create_two_step_flow(env)
        request_id = create_request(env).json()["id"]

        rejected = env["lead_client"].post(
            f"{env['requests_url']}{request_id}/reject/", {"comment": "预算不足"}, format="json"
        )
        assert rejected.status_code == 200
        assert rejected.json()["status"] == "REJECTED"

        # the second step must never be reachable
        blocked = env["director_client"].post(
            f"{env['requests_url']}{request_id}/approve/", {}, format="json"
        )
        assert blocked.status_code == 409

        env["issue"].refresh_from_db()
        assert env["issue"].state.group == "backlog"
        action = ApprovalAction.objects.get(request_id=request_id)
        assert action.action == "REJECT"
        assert action.comment == "预算不足"

    def test_rejection_requires_a_comment(self, env):
        create_two_step_flow(env)
        request_id = create_request(env).json()["id"]
        response = env["lead_client"].post(
            f"{env['requests_url']}{request_id}/reject/", {"comment": "  "}, format="json"
        )
        assert response.status_code == 422

    def test_only_resolved_approvers_can_act(self, env):
        create_two_step_flow(env)
        request_id = create_request(env).json()["id"]
        denied = env["bystander_client"].post(
            f"{env['requests_url']}{request_id}/approve/", {}, format="json"
        )
        assert denied.status_code == 403

    def test_requester_can_withdraw_before_completion(self, env):
        create_two_step_flow(env)
        request_id = create_request(env).json()["id"]
        response = env["requester_client"].post(
            f"{env['requests_url']}{request_id}/withdraw/", {}, format="json"
        )
        assert response.status_code == 200
        assert response.json()["status"] == "WITHDRAWN"
        assert ApprovalAction.objects.filter(request_id=request_id, action="WITHDRAW").exists()

    def test_actions_are_append_only_via_api(self, env):
        create_two_step_flow(env)
        request_id = create_request(env).json()["id"]
        env["lead_client"].post(f"{env['requests_url']}{request_id}/approve/", {}, format="json")
        action = ApprovalAction.objects.first()
        assert env["admin_client"].patch(
            f"{env['requests_url']}{request_id}/history/", {}, format="json"
        ).status_code in (404, 405)
        assert action.comment == ""

    def test_scope_filters(self, env):
        create_two_step_flow(env)
        request_id = create_request(env).json()["id"]
        to_me = env["lead_client"].get(f"{env['requests_url']}?scope=to_me").json()
        assert request_id in {item["id"] for item in to_me["results"]}

        mine = env["requester_client"].get(f"{env['requests_url']}?scope=mine").json()
        assert mine["count"] == 1

        completed = env["admin_client"].get(f"{env['requests_url']}?scope=completed").json()
        assert completed["count"] == 0

    def test_same_issue_cannot_open_two_requests(self, env):
        create_two_step_flow(env)
        assert create_request(env).status_code == 201
        duplicate = create_request(env)
        assert duplicate.status_code == 409

    def test_missing_flow_is_reported(self, env):
        response = create_request(env)
        assert response.status_code == 400
        assert response.json()["error_code"] == "approval_flow_not_found"

    def test_approval_notifications_reuse_the_existing_pipeline(self, env):
        create_two_step_flow(env)
        Notification.objects.all().delete()
        request_id = create_request(env).json()["id"]
        pending = Notification.objects.filter(entity_name="research_approval")
        assert {item.receiver_id for item in pending} == {env["lead"].id}

        Notification.objects.all().delete()
        env["lead_client"].post(f"{env['requests_url']}{request_id}/approve/", {}, format="json")
        next_step = Notification.objects.filter(entity_name="research_approval")
        assert {item.receiver_id for item in next_step} == {env["director"].id}

        Notification.objects.all().delete()
        env["director_client"].post(f"{env['requests_url']}{request_id}/approve/", {}, format="json")
        finished = Notification.objects.filter(entity_name="research_approval")
        assert {item.receiver_id for item in finished} == {env["requester"].id}
