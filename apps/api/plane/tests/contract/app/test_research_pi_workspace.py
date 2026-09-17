# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Main PI workspace: a scoped, read-only aggregate over the public workspace."""

import pytest
from rest_framework.test import APIClient

from plane.db.models import (
    OrgUnit,
    OrgUnitMember,
    Project,
    ResearchProjectProfile,
    ResearchStageInstance,
)
from plane.research.utils.org import build_path
from plane.tests.research_fixtures import (
    add_workspace_member,
    enable_research,
    make_user,
    pi_aggregate_url,
    pi_workspace,
    public_workspace,
)

pytestmark = pytest.mark.contract


@pytest.fixture(autouse=True)
def research_module_on(settings):
    settings.RESEARCH_MODULE_ENABLED = True


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def make_group(workspace, root, name):
    unit = OrgUnit(
        workspace=workspace,
        parent=root,
        name=name,
        unit_type=OrgUnit.UnitType.GROUP,
        depth=root.depth + 1,
        path="",
    )
    unit.path = build_path(unit.id, root.path)
    unit.save()
    return unit


def make_project(workspace, owner, unit, identifier, status="ACTIVE"):
    project = Project.objects.create(
        workspace=workspace,
        name=f"Project {identifier}",
        identifier=identifier,
        created_by=owner,
    )
    ResearchProjectProfile.objects.create(
        project=project,
        workspace=workspace,
        owner=owner,
        org_unit=unit,
        research_type=ResearchProjectProfile.ResearchType.PHD,
        workflow_status=status,
        created_by=owner,
    )
    return project


@pytest.fixture
def env(db):
    admin = make_user(first_name="Admin")
    public = public_workspace(owner=admin)
    enable_research(public)
    pi_area = pi_workspace(owner=admin)
    enable_research(pi_area)
    root = OrgUnit.objects.create(
        workspace=public,
        name="材料科学与工程学院",
        unit_type=OrgUnit.UnitType.ROOT,
        path="",
        depth=0,
    )
    root.path = build_path(root.id, None)
    root.save(update_fields=["path"])
    own_group = make_group(public, root, "器件")
    other_group = make_group(public, root, "量子")
    return {
        "admin": admin,
        "public": public,
        "pi_area": pi_area,
        "root": root,
        "own_group": own_group,
        "other_group": other_group,
    }


def test_aggregate_is_scoped_to_the_callers_subtree(env):
    pi_user = make_user(first_name="MainPI")
    add_workspace_member(env["public"], pi_user)
    add_workspace_member(env["pi_area"], pi_user)
    OrgUnitMember.objects.create(
        workspace=env["public"],
        org_unit=env["own_group"],
        user=pi_user,
        org_role=OrgUnitMember.OrgRole.PI,
    )
    make_project(env["public"], pi_user, env["own_group"], "OWN1")
    make_project(env["public"], pi_user, env["other_group"], "OTHER1")

    response = client_for(pi_user).get(pi_aggregate_url(env["pi_area"]))
    assert response.status_code == 200
    assert response.data["source_workspace"]["slug"] == env["public"].slug
    assert response.data["scope"]["unit_count"] == 1
    assert [unit["name"] for unit in response.data["org_units"]] == ["器件"]
    assert response.data["projects"]["total"] == 1
    assert response.data["projects"]["by_status"] == {"ACTIVE": 1}


def test_aggregate_covers_descendant_nodes(env):
    pi_user = make_user(first_name="DeptHead")
    add_workspace_member(env["public"], pi_user)
    add_workspace_member(env["pi_area"], pi_user)
    OrgUnitMember.objects.create(
        workspace=env["public"],
        org_unit=env["root"],
        user=pi_user,
        org_role=OrgUnitMember.OrgRole.OWNER,
    )
    make_project(env["public"], pi_user, env["own_group"], "OWN2")
    make_project(env["public"], pi_user, env["other_group"], "OTHER2")

    response = client_for(pi_user).get(pi_aggregate_url(env["pi_area"]))
    assert response.status_code == 200
    assert response.data["projects"]["total"] == 2
    assert response.data["scope"]["unit_count"] == 3


def test_aggregate_is_refused_without_a_managing_role(env):
    """v2.5.0: the board is a main PI surface, so a plain seat is refused.

    Before the level layer the endpoint answered an empty board; now the caller
    without a managing organisation role never reaches it, which is the same
    decision that hides the menu entry.
    """
    bystander = make_user(first_name="Bystander")
    add_workspace_member(env["public"], bystander)
    add_workspace_member(env["pi_area"], bystander)
    make_project(env["public"], env["admin"], env["own_group"], "ANY")

    response = client_for(bystander).get(pi_aggregate_url(env["pi_area"]))
    assert response.status_code == 403
    assert response.data["error_code"] == "research_permission_denied"


def test_aggregate_counts_stage_blockers(env):
    pi_user = make_user(first_name="MainPI")
    add_workspace_member(env["public"], pi_user)
    add_workspace_member(env["pi_area"], pi_user)
    OrgUnitMember.objects.create(
        workspace=env["public"],
        org_unit=env["own_group"],
        user=pi_user,
        org_role=OrgUnitMember.OrgRole.PI,
    )
    project = make_project(env["public"], pi_user, env["own_group"], "STG1")
    ResearchStageInstance.objects.create(
        workspace=env["public"],
        project=project,
        stage="PRE_OPENING",
        status=ResearchStageInstance.Status.SUBMITTED,
        sort_order=1,
        gate_result=ResearchStageInstance.GateResult.BLOCKED,
        org_unit=env["own_group"],
    )

    response = client_for(pi_user).get(pi_aggregate_url(env["pi_area"]))
    assert response.data["stages"]["by_status"] == {"SUBMITTED": 1}
    assert response.data["stages"]["blocked_gates"] == 1
    assert response.data["reviews"]["awaiting_stages"] == 1


def test_non_member_cannot_read_the_aggregate(env):
    stranger = make_user(first_name="Stranger")
    response = client_for(stranger).get(pi_aggregate_url(env["pi_area"]))
    assert response.status_code == 404


def test_org_pi_does_not_get_a_private_workspace_seat(env):
    """A direction or mentor-group PI is not the unique main PI."""
    from plane.db.models import WorkspaceMember
    from plane.research.utils.roles import sync_main_pi_workspace_seat

    pi_user = make_user(first_name="OrgPI")
    add_workspace_member(env["public"], pi_user)
    OrgUnitMember.objects.create(
        workspace=env["public"],
        org_unit=env["own_group"],
        user=pi_user,
        org_role=OrgUnitMember.OrgRole.PI,
    )

    membership = sync_main_pi_workspace_seat(pi_user, actor=env["admin"])
    assert membership is None
    assert not WorkspaceMember.objects.filter(workspace=env["pi_area"], member=pi_user, is_active=True).exists()


def test_org_member_endpoint_does_not_grant_a_private_pi_seat(env):
    from plane.db.models import WorkspaceMember

    admin_client = client_for(env["admin"])
    pi_user = make_user(first_name="FreshPI")
    add_workspace_member(env["public"], pi_user)

    response = admin_client.post(
        f"/api/research/workspaces/{env['public'].slug}/org-units/{env['own_group'].id}/members/",
        {"user": str(pi_user.id), "org_role": "PI"},
        format="json",
    )
    assert response.status_code == 201
    assert not WorkspaceMember.objects.filter(workspace=env["pi_area"], member=pi_user, is_active=True).exists()


def test_explicit_main_pi_gets_the_private_workspace_seat(env):
    from plane.db.models import WorkspaceMember
    from plane.research.utils.roles import sync_main_pi_workspace_seat

    main_pi = make_user(first_name="ConfiguredMainPI")
    setting = env["pi_area"].research_setting
    setting.main_pi = main_pi
    setting.save(update_fields=["main_pi", "updated_at"])

    membership = sync_main_pi_workspace_seat(main_pi, actor=env["admin"])

    assert membership is not None
    assert WorkspaceMember.objects.filter(workspace=env["pi_area"], member=main_pi, is_active=True).exists()
