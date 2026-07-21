# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from types import SimpleNamespace

import pytest

from plane.app.views.issue.looper import _derived_phase, _phase_payload


@pytest.mark.unit
@pytest.mark.parametrize(
    ("state", "wait_kind", "active_role", "expected"),
    [
        ("queued", None, "planner", "research"),
        ("awaiting_human", "role_decision", "planner", "role_decisions"),
        ("awaiting_human", "technical_spec_approval", "planner", "technical_spec"),
        ("running", None, "worker", "implementation"),
        ("awaiting_human", "qa", "worker", "qa"),
        ("completed", None, "worker", "complete"),
    ],
)
def test_derived_phase_uses_durable_dispatch_state(state, wait_kind, active_role, expected):
    dispatch = SimpleNamespace(state=state, wait_kind=wait_kind, active_role=active_role)

    assert _derived_phase(dispatch) == expected


@pytest.mark.unit
def test_phase_payload_marks_only_prior_phases_complete():
    phases = _phase_payload("technical_spec", "awaiting_human")

    assert [phase["status"] for phase in phases] == [
        "completed",
        "completed",
        "current",
        "pending",
        "pending",
        "pending",
        "pending",
    ]


@pytest.mark.unit
def test_completed_dispatch_marks_every_phase_complete():
    phases = _phase_payload("complete", "completed")

    assert all(phase["status"] == "completed" for phase in phases)
