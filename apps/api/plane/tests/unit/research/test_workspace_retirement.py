# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workspace retirement helpers: workspace-scoped SQL conditions and order."""

import pytest

from plane.db.models import (
    ApprovalRequest,
    ExperimentAmendment,
    ExperimentRecordVersion,
    OrgUnit,
    StageReview,
)
from plane.research.services.maintenance import (
    _deletion_order,
    _workspace_condition,
    research_models,
)

pytestmark = pytest.mark.unit


def _conditions(workspace):
    return {model: _workspace_condition(model, workspace) for model in research_models()}


def test_direct_workspace_columns_use_the_workspace_id(db):
    from plane.tests.research_fixtures import make_user, make_workspace

    workspace = make_workspace(make_user())
    sql, params = _workspace_condition(OrgUnit, workspace)
    assert sql == "workspace_id = %s"
    assert params == [str(workspace.id)]


def test_child_tables_resolve_through_their_research_parent(db):
    """Child rows (no workspace column) are matched through the parent table."""
    from plane.tests.research_fixtures import make_user, make_workspace

    workspace = make_workspace(make_user())

    for child, parent_table in (
        (ApprovalRequest, "research_approval_flows"),
        (ExperimentRecordVersion, "research_experiment_records"),
        (StageReview, "research_stage_instances"),
    ):
        sql, params = _workspace_condition(child, workspace)
        assert parent_table in sql, (child.__name__, sql)
        assert "workspace_id = %s" in sql
        assert params == [str(workspace.id)]


def test_non_research_relations_are_not_followed(db):
    """``created_by`` style links must never become the workspace condition."""
    from plane.tests.research_fixtures import make_user, make_workspace

    workspace = make_workspace(make_user())
    sql, params = _workspace_condition(ExperimentAmendment, workspace)
    assert "users" not in sql
    assert "file_assets" not in sql
    assert params == [str(workspace.id)]


def test_deletion_order_puts_children_before_parents(db):
    from plane.tests.research_fixtures import make_user, make_workspace

    workspace = make_workspace(make_user())
    order = _deletion_order(research_models(), _conditions(workspace))
    position = {model.__name__: index for index, model in enumerate(order)}

    assert position["ApprovalAction"] < position["ApprovalRequest"]
    assert position["ApprovalRequest"] < position["ApprovalFlow"]
    assert position["ExperimentRecordVersion"] < position["ExperimentRecord"]
    assert position["StageMaterial"] < position["ResearchStageInstance"]
    assert position["StageReview"] < position["ResearchStageInstance"]
    assert position["PeriodicReport"] < position["OrgUnit"]


def test_every_research_table_has_a_condition(db):
    from plane.tests.research_fixtures import make_user, make_workspace

    workspace = make_workspace(make_user())
    # IdentityMapping is instance level (keyed by user), so it is the one
    # research table that deliberately has no workspace scope.
    workspace_agnostic = {"IdentityMapping"}
    missing = [
        model.__name__
        for model, condition in _conditions(workspace).items()
        if condition is None and model.__name__ not in workspace_agnostic
    ]
    assert missing == []
