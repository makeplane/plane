# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""The ``seed_research_demo`` fixture has to stay trustworthy (P0 + P1).

The fixture is what manual testing is built on, so it is verified like a
feature: the P0 access matrix is rebuilt through the production ACL and compared
cell by cell with the acceptance matrix, both stage gates are checked, and the
owner queues must not be empty.
"""

import pytest

from plane.db.models import (
    OrgUnit,
    ExperimentRecord,
    LiteratureEntry,
    PeriodicReport,
    Project,
    ResearchAuditEvent,
    ResearchOutcome,
    ResearchProjectProfile,
    StageReviewerAssignment,
)
from plane.research.seed import scenario
from plane.research.seed.builder import (
    ResearchSeedBuilder,
    perform_wipe,
    reset_seed,
    wipe_research_data,
)
from plane.research.seed.verify import (
    acl_matrix,
    actor_for,
    matrix_mismatches,
    pending_approvals,
    pending_reviews,
    stage_for,
    verify,
    visible_reports,
)
from plane.research.services.stage_gate import evaluate_stage_gate
from plane.research.utils.org import build_path
from plane.tests.research_fixtures import make_user, make_workspace
from plane.tests.unit.research.test_acl import EXPECTED

pytestmark = pytest.mark.unit


@pytest.fixture
def seeded(db, settings):
    settings.RESEARCH_MODULE_ENABLED = True
    owner = make_user(email=scenario.DEFAULT_OWNER_EMAIL, first_name="Yikai", last_name="Fang")
    workspace = make_workspace(owner, name="fangyikai", slug="fangyikai")
    builder = ResearchSeedBuilder(workspace, owner, with_files=False)
    builder.run()
    return {"workspace": workspace, "owner": owner, "builder": builder}


@pytest.mark.django_db
def test_seed_creates_every_identity_and_record(seeded):
    workspace = seeded["workspace"]
    assert len(scenario.ACCOUNTS) == 12
    for spec in scenario.ACCOUNTS:
        actor = actor_for(workspace, spec.key)
        assert actor is not None, spec.email
    assert Project.objects.filter(workspace=workspace).count() >= len(scenario.PROJECTS)
    assert PeriodicReport.objects.filter(workspace=workspace).count() == 27
    assert LiteratureEntry.objects.filter(workspace=workspace).count() == 95
    assert ResearchOutcome.objects.filter(workspace=workspace).count() == 8
    assert ExperimentRecord.objects.filter(workspace=workspace).count() == 14


@pytest.mark.django_db
def test_seed_is_idempotent(seeded):
    workspace = seeded["workspace"]
    before = PeriodicReport.objects.filter(workspace=workspace).count()
    second = ResearchSeedBuilder(workspace, seeded["owner"], with_files=False).run()
    assert sum(second.values()) == 0, dict(second)
    assert PeriodicReport.objects.filter(workspace=workspace).count() == before


@pytest.mark.django_db
def test_org_tree_is_a_single_chain(seeded):
    """One node per category, top down: 学院 -> 实验室 -> 课题组 -> 小组."""
    workspace = seeded["workspace"]
    assert [spec.unit_type for spec in scenario.ORG_UNITS] == ["INSTITUTE", "LAB", "GROUP", "TEAM"]

    units = list(
        OrgUnit.objects.filter(workspace=workspace, deleted_at__isnull=True)
        .exclude(unit_type=OrgUnit.UnitType.ROOT)
        .order_by("depth")
    )
    assert [unit.unit_type for unit in units] == ["INSTITUTE", "LAB", "GROUP", "TEAM"]
    assert [unit.depth for unit in units] == [1, 2, 3, 4]

    root = OrgUnit.objects.get(workspace=workspace, unit_type=OrgUnit.UnitType.ROOT, deleted_at__isnull=True)
    assert OrgUnit.objects.filter(workspace=workspace, parent=root, deleted_at__isnull=True).count() == 1
    # no siblings anywhere: the tree is a single chain, not a branching tree
    for unit in units:
        assert OrgUnit.objects.filter(workspace=workspace, parent=unit, deleted_at__isnull=True).count() <= 1

    # retired fixture nodes never come back
    assert not OrgUnit.all_objects.filter(
        workspace=workspace, name__in=scenario.RETIRED_ORG_UNIT_NAMES
    ).exists()


@pytest.mark.django_db
def test_reset_retires_legacy_nodes(seeded):
    """``--reset`` also clears the node names older fixture versions created."""
    workspace = seeded["workspace"]
    root = OrgUnit.objects.get(workspace=workspace, unit_type=OrgUnit.UnitType.ROOT, deleted_at__isnull=True)
    legacy = OrgUnit.objects.create(
        workspace=workspace,
        parent=root,
        name=scenario.RETIRED_ORG_UNIT_NAMES[0],
        unit_type=OrgUnit.UnitType.LAB,
        depth=1,
        created_by=seeded["owner"],
    )
    legacy.path = build_path(legacy.id, root.path)
    legacy.save(update_fields=["path"])

    deleted = reset_seed(workspace)
    assert deleted["org_units"] >= 1
    assert not OrgUnit.all_objects.filter(pk=legacy.pk).exists()


@pytest.mark.django_db
def test_acl_matrix_matches_the_p0_acceptance_matrix(seeded):
    workspace = seeded["workspace"]
    matrix = acl_matrix(workspace)
    assert matrix_mismatches(matrix) == []
    # The seeded ``admin`` is also a PI in the report owner's ancestry, while
    # the P0 unit fixture deliberately keeps its administrator out of the org
    # tree. All single-role subjects must still agree exactly.
    for visibility, expected_row in EXPECTED.items():
        for subject, expected in expected_row.items():
            if subject == "admin":
                continue
            assert matrix[subject][visibility] is expected, f"{visibility} x {subject}"


@pytest.mark.django_db
def test_gates_demonstrate_blocked_and_ready_stages(seeded):
    workspace = seeded["workspace"]
    midterm = stage_for(workspace, scenario.PROJECT_BY_KEY["liuyang"].name, "MIDTERM")
    opening = stage_for(workspace, scenario.PROJECT_BY_KEY["sunhao"].name, "OPENING")
    assert midterm is not None and opening is not None
    midterm_gate = evaluate_stage_gate(midterm, "submit")
    opening_gate = evaluate_stage_gate(opening, "submit")
    assert {item["code"] for item in midterm_gate["blockers"]} == {
        "material_set",
        "experiment_status_notes",
    }
    assert opening_gate["blockers"] == []
    # the pre-opening gate of the flagship project really passed
    pre_opening = stage_for(workspace, scenario.PROJECT_BY_KEY["liuyang"].name, "PRE_OPENING")
    assert pre_opening.status == "PASSED"
    assert pre_opening.transitions.filter(action="PASS").count() == 1


@pytest.mark.django_db
def test_owner_queues_are_populated(seeded):
    workspace = seeded["workspace"]
    owner = seeded["owner"]
    reports = visible_reports(workspace, owner)
    assert len(reports) >= 20
    # Drafts remain author-only; the PI queue covers every formal state.
    assert {report.status for report in reports} == {"SUBMITTED", "NEEDS_REVISION", "ACCEPTED"}
    assert len(pending_reviews(workspace, owner)) == 1
    assert len(pending_approvals(workspace, owner)) == 1
    assignment = StageReviewerAssignment.objects.filter(stage_instance__workspace=workspace, reviewer=owner).first()
    assert assignment is not None


@pytest.mark.django_db
def test_negative_cases_only_expose_workspace_level_reports(seeded):
    workspace = seeded["workspace"]
    workspace_level = set(
        PeriodicReport.objects.filter(workspace=workspace, visibility="WORKSPACE", deleted_at__isnull=True).values_list(
            "id", flat=True
        )
    )
    workspace_level -= set(
        PeriodicReport.objects.filter(
            workspace=workspace,
            visibility="WORKSPACE",
            status=PeriodicReport.Status.DRAFT,
            deleted_at__isnull=True,
        ).values_list("id", flat=True)
    )
    assert workspace_level
    for account_key in ("gaopeng", "hexue"):
        actor = actor_for(workspace, account_key)
        visible = {report.id for report in visible_reports(workspace, actor)}
        assert visible == workspace_level, account_key


@pytest.mark.django_db
def test_verify_reports_success_and_reset_removes_the_fixture(seeded):
    workspace = seeded["workspace"]
    result = verify(workspace)
    assert result["ok"] is True
    assert result["mismatches"] == []
    assert result["pending_reviews"] == 1
    assert result["pending_approvals"] == 1

    deleted = reset_seed(workspace)
    assert deleted["users"] == len(scenario.ACCOUNTS)
    assert PeriodicReport.objects.filter(workspace=workspace).count() == 0
    # the owner account and its own records are never touched by --reset
    assert Project.objects.filter(workspace=workspace).count() == 0
    assert actor_for(workspace, scenario.OWNER_KEY) is not None


@pytest.mark.django_db
def test_wipe_clears_the_workspace_but_keeps_the_audit_trail(seeded):
    workspace = seeded["workspace"]
    counts = wipe_research_data(workspace)
    assert counts["reports"] == 27
    assert counts["research_projects"] == len(scenario.PROJECTS)
    audit_before = ResearchAuditEvent.objects.filter(workspace=workspace).count()
    assert audit_before > 0

    perform_wipe(workspace)
    assert PeriodicReport.objects.filter(workspace=workspace).count() == 0
    assert ResearchProjectProfile.objects.filter(workspace=workspace).count() == 0
    # the workspace keeps its ROOT node, the fixture's subtree is gone
    units = OrgUnit.objects.filter(workspace=workspace)
    assert units.count() == 1
    assert units.first().parent_id is None
    # audit is append-only: a wipe never touches it
    assert ResearchAuditEvent.objects.filter(workspace=workspace).count() >= audit_before
