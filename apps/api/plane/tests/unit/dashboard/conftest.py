# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Shared fixtures for the dashboard operational predicate tests.

The reference 12-issue fixture is described in spec §12:

* backlog 2, unstarted 3, started 4, completed 2, cancelled 1 ⇒ Total 12
* Open = 9 (backlog + unstarted + started)
* Not started = 5 (backlog + unstarted)
* Overdue = 2 (open ∧ target_date < today)
* Blocked = 3 (open ∧ active unresolved blocker), with one row overlapping
  overdue ⇒ attention union = 4

The three IssueBlocker rows point at fixtures *inside* the 12, so the total
issue count stays at 12. The blocker-source issues are themselves Open but
not blocked (so they remain in the started/unstarted buckets exactly once).
"""

from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import Dict
from uuid import uuid4

import pytest

from plane.db.models import (
    Issue,
    IssueAssignee,
    IssueBlocker,
    IssueLabel,
    Label,
    Module,
    ModuleIssue,
    Project,
    ProjectMember,
    ProjectNetwork,
    State,
    User,
    Workspace,
    WorkspaceMember,
)


# ----- helpers -----------------------------------------------------------


def _make_user(email: str) -> User:
    user = User.objects.create(
        email=email, username=email.split("@")[0],
    )
    user.set_password("pw")
    user.save()
    return user


def _make_workspace(slug: str = "ws-ops") -> Workspace:
    owner = User.objects.create(
        email=f"owner-{slug}-{uuid4().hex[:6]}@plane.so",
        username=f"owner-{slug}-{uuid4().hex[:6]}",
    )
    owner.set_password("pw")
    owner.save()
    return Workspace.objects.create(name="WS", slug=slug, owner=owner, timezone="UTC")


def _make_state(project: Project, group: str, name: str = None) -> State:
    return State.objects.create(
        project=project, name=name or group.title(), color="#000000", group=group,
    )


def _add_to_workspace(user: User, workspace: Workspace, role: int = 20) -> None:
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role, is_active=True)


def _add_to_project(user: User, project: Project, role: int = 20) -> None:
    ProjectMember.objects.create(project=project, member=user, role=role, is_active=True)


def _make_project(workspace: Workspace, *, network: int = ProjectNetwork.PUBLIC.value, name: str = "P") -> Project:
    return Project.objects.create(
        workspace=workspace, name=name,
        identifier=f"P{uuid4().hex[:4].upper()}",
        created_by=workspace.owner, updated_by=workspace.owner, network=network,
    )


# ----- 12-issue fixture (spec §12) --------------------------------------


@pytest.fixture
def today() -> date:
    # Wednesday 2026-09-23 — mid-week so target_date arithmetic is unambiguous.
    return date(2026, 9, 23)


@pytest.fixture
def fixture_setup(db, today):
    """Create the spec §12 reference fixture (exactly 12 issues).

    Returns the workspace, project, state, user and issue handles. Auxiliary
    tests must create their own extra issues inside the test so the §12
    totals remain stable.
    """
    workspace = _make_workspace("ws-ops")
    project = _make_project(workspace, network=ProjectNetwork.PUBLIC.value, name="Spec")

    state_backlog = _make_state(project, "backlog", "Backlog")
    state_unstarted = _make_state(project, "unstarted", "Unstarted")
    state_started = _make_state(project, "started", "Started")
    state_completed = _make_state(project, "completed", "Completed")
    state_cancelled = _make_state(project, "cancelled", "Cancelled")

    alice = _make_user("alice@plane.so")
    bob = _make_user("bob@plane.so")
    carol = _make_user("carol@plane.so")
    for u in (alice, bob, carol):
        _add_to_workspace(u, workspace)
        _add_to_project(u, project)

    dave = _make_user("dave@plane.so")
    _add_to_workspace(dave, workspace)

    issues: Dict[str, list] = {
        "backlog": [], "unstarted": [], "started": [], "completed": [], "cancelled": [],
    }

    # 2 backlog
    for i in range(2):
        issues["backlog"].append(
            Issue.objects.create(
                project=project, workspace=workspace, name=f"Backlog {i}",
                state=state_backlog, priority="none", target_date=None, created_by=alice,
            )
        )
    # 3 unstarted — Unstarted 0 is BLOCKED, Unstarted 1 is the BLOCKER source
    issues["unstarted"] = []
    unstarted_0 = Issue.objects.create(
        project=project, workspace=workspace, name="Unstarted 0",
        state=state_unstarted, priority="medium", target_date=None, created_by=alice,
    )
    issues["unstarted"].append(unstarted_0)
    for i in range(1, 3):
        issues["unstarted"].append(
            Issue.objects.create(
                project=project, workspace=workspace, name=f"Unstarted {i}",
                state=state_unstarted, priority="medium", target_date=None, created_by=alice,
            )
        )
    # 4 started — Started overdue 0 is BLOCKED+OVERDUE (overlap);
    #             Started overdue 1 is OVERDUE only;
    #             Started healthy is BLOCKED only (target_date +5d);
    #             Multi assignee started is NEITHER (multi-assignee + labels + modules).
    started_overdue_0 = Issue.objects.create(
        project=project, workspace=workspace, name="Started overdue 0",
        state=state_started, priority="high",
        target_date=today - timedelta(days=2), created_by=alice,
    )
    started_overdue_1 = Issue.objects.create(
        project=project, workspace=workspace, name="Started overdue 1",
        state=state_started, priority="high",
        target_date=today - timedelta(days=2), created_by=alice,
    )
    started_healthy = Issue.objects.create(
        project=project, workspace=workspace, name="Started healthy",
        state=state_started, priority="medium",
        target_date=today + timedelta(days=5), created_by=alice,
    )
    multi = Issue.objects.create(
        project=project, workspace=workspace, name="Multi assignee started",
        state=state_started, priority="medium",
        target_date=today + timedelta(days=3), created_by=alice,
    )
    IssueAssignee.objects.create(issue=multi, assignee=alice, project=project, workspace=workspace)
    IssueAssignee.objects.create(issue=multi, assignee=bob, project=project, workspace=workspace)
    for i in range(3):
        label = Label.objects.create(
            project=project, name=f"label-{i}", color="#000000", created_by=alice,
        )
        IssueLabel.objects.create(issue=multi, label=label, project=project, workspace=workspace)
    for i in range(2):
        module = Module.objects.create(
            project=project, name=f"mod-{i}", created_by=alice, workspace=workspace,
        )
        ModuleIssue.objects.create(issue=multi, module=module, project=project, workspace=workspace)
    issues["started"] = [started_overdue_0, started_overdue_1, started_healthy, multi]

    # 2 completed (one inside period, one outside). Issue.save() overrides
    # completed_at when state.group == "completed", so we create with a
    # temporary state and then update completed_at + state in a separate
    # call. (Spec §8 requires completed_at semantics for the period query.)
    completed_inside = Issue.objects.create(
        project=project, workspace=workspace, name="Completed inside",
        state=state_started, priority="none", target_date=None, created_by=alice,
    )
    Issue.objects.filter(pk=completed_inside.pk).update(
        state=state_completed,
        completed_at=datetime.combine(today, time(9, 0)),
    )
    completed_outside = Issue.objects.create(
        project=project, workspace=workspace, name="Completed outside",
        state=state_started, priority="none", target_date=None, created_by=alice,
    )
    Issue.objects.filter(pk=completed_outside.pk).update(
        state=state_completed,
        completed_at=datetime.combine(today - timedelta(days=120), time(9, 0)),
    )
    issues["completed"] = [completed_inside, completed_outside]

    # 1 cancelled
    issues["cancelled"].append(
        Issue.objects.create(
            project=project, workspace=workspace, name="Cancelled",
            state=state_cancelled, priority="low", target_date=None, created_by=alice,
        )
    )

    # 3 blocked rows:
    #   started_overdue_0 ← started_healthy (overlap with overdue)
    #   started_healthy   ← multi
    #   unstarted_0       ← unstarted_1
    # Each blocker-source is itself in the 12-issue set but is NOT blocked.
    IssueBlocker.objects.create(
        block=started_overdue_0, blocked_by=started_healthy,
        project=project, workspace=workspace, created_by=alice,
    )
    IssueBlocker.objects.create(
        block=started_healthy, blocked_by=multi,
        project=project, workspace=workspace, created_by=alice,
    )
    IssueBlocker.objects.create(
        block=unstarted_0, blocked_by=issues["unstarted"][1],
        project=project, workspace=workspace, created_by=alice,
    )

    yield {
        "workspace": workspace, "project": project,
        "states": {
            "backlog": state_backlog, "unstarted": state_unstarted,
            "started": state_started, "completed": state_completed,
            "cancelled": state_cancelled,
        },
        "users": {"alice": alice, "bob": bob, "carol": carol, "dave": dave},
        "issues": issues, "multi": multi,
        "blocked_targets": [started_overdue_0, started_healthy, unstarted_0],
    }