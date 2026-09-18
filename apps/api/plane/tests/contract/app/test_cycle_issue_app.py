# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression test for GHSA-4w5x-wc9w-f47x.

CycleIssueViewSet.create reassigned any CycleIssue row matched by issue_id to
the caller's cycle without scoping the lookup to the caller's
workspace/project. An ADMIN/MEMBER of their own project could therefore pass a
work-item UUID from a *different* tenant and silently evict the victim's work
item from the victim's cycle (cross-tenant write / BOLA).
"""

from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import (
    Cycle,
    CycleIssue,
    Issue,
    Project,
    ProjectMember,
    State,
    User,
    Workspace,
    WorkspaceMember,
)


@pytest.fixture
def attacker_project(db, workspace, create_user):
    """Project + cycle in the attacker's own workspace; attacker is admin."""
    project = Project.objects.create(
        name="Attacker Project",
        identifier="ATK",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def attacker_cycle(db, workspace, attacker_project, create_user):
    return Cycle.objects.create(
        name="Attacker Cycle",
        project=attacker_project,
        workspace=workspace,
        owned_by=create_user,
    )


@pytest.fixture
def victim_tenant(db):
    """A completely separate workspace/project/cycle owning a work item that is
    already assigned to the victim's own cycle."""
    uid = uuid4().hex[:8]
    victim_user = User.objects.create(
        email=f"victim-{uid}@plane.so",
        username=f"victim_{uid}",
        first_name="Victim",
        last_name="User",
    )
    victim_ws = Workspace.objects.create(name="Victim WS", owner=victim_user, slug=f"victim-{uid}")
    WorkspaceMember.objects.create(workspace=victim_ws, member=victim_user, role=20)
    victim_project = Project.objects.create(
        name="Victim Project",
        identifier="VIC",
        workspace=victim_ws,
        created_by=victim_user,
    )
    ProjectMember.objects.create(project=victim_project, member=victim_user, role=20, is_active=True)
    state = State.objects.create(
        name="Todo", project=victim_project, workspace=victim_ws, group="backlog", default=True
    )
    victim_issue = Issue.objects.create(
        name="Victim Issue",
        workspace=victim_ws,
        project=victim_project,
        state=state,
        created_by=victim_user,
    )
    victim_cycle = Cycle.objects.create(
        name="Victim Cycle", project=victim_project, workspace=victim_ws, owned_by=victim_user
    )
    cycle_issue = CycleIssue.objects.create(
        issue=victim_issue,
        cycle=victim_cycle,
        project=victim_project,
        workspace=victim_ws,
        created_by=victim_user,
    )
    return {
        "issue": victim_issue,
        "cycle": victim_cycle,
        "cycle_issue": cycle_issue,
    }


@pytest.mark.contract
class TestCycleIssueCrossTenantBOLA:
    def get_url(self, workspace_slug, project_id, cycle_id):
        return f"/api/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/cycle-issues/"

    @pytest.mark.django_db
    def test_foreign_tenant_cycle_issue_not_reassigned(
        self, session_client, workspace, attacker_project, attacker_cycle, victim_tenant
    ):
        """The attacker adds a foreign-tenant work-item UUID to their own cycle.

        Before the fix the victim's CycleIssue row was reassigned to the
        attacker's cycle (cycle_id flipped). After the fix the foreign row is
        excluded from the lookup, so it stays in the victim's cycle.
        """
        victim_issue = victim_tenant["issue"]
        victim_cycle = victim_tenant["cycle"]
        victim_cycle_issue = victim_tenant["cycle_issue"]

        url = self.get_url(workspace.slug, attacker_project.id, attacker_cycle.id)
        response = session_client.post(url, {"issues": [str(victim_issue.id)]}, format="json")

        # The endpoint reports success regardless; the security property is that
        # the foreign row is untouched.
        assert response.status_code in (status.HTTP_201_CREATED, status.HTTP_200_OK), (
            f"Got {response.status_code}: {response.data!r}"
        )

        victim_cycle_issue.refresh_from_db()
        assert victim_cycle_issue.cycle_id == victim_cycle.id, (
            "Cross-tenant reassignment: victim's CycleIssue was moved to the attacker's cycle"
        )
        # No CycleIssue for the victim's issue should exist under the attacker's cycle.
        assert not CycleIssue.objects.filter(
            cycle_id=attacker_cycle.id, issue_id=victim_issue.id
        ).exists()

    @pytest.mark.django_db
    def test_same_tenant_reassignment_still_works(
        self, session_client, workspace, attacker_project, attacker_cycle, create_user
    ):
        """A legitimate reassignment within the caller's own project must still
        move the issue into the target cycle — the scope guard must not break
        the normal flow."""
        state = State.objects.create(
            name="Todo", project=attacker_project, workspace=workspace, group="backlog", default=True
        )
        own_issue = Issue.objects.create(
            name="Own Issue",
            workspace=workspace,
            project=attacker_project,
            state=state,
            created_by=create_user,
        )
        old_cycle = Cycle.objects.create(
            name="Old Cycle", project=attacker_project, workspace=workspace, owned_by=create_user
        )
        own_cycle_issue = CycleIssue.objects.create(
            issue=own_issue,
            cycle=old_cycle,
            project=attacker_project,
            workspace=workspace,
            created_by=create_user,
        )

        url = self.get_url(workspace.slug, attacker_project.id, attacker_cycle.id)
        response = session_client.post(url, {"issues": [str(own_issue.id)]}, format="json")

        assert response.status_code in (status.HTTP_201_CREATED, status.HTTP_200_OK), (
            f"Got {response.status_code}: {response.data!r}"
        )
        own_cycle_issue.refresh_from_db()
        assert own_cycle_issue.cycle_id == attacker_cycle.id, (
            "Legitimate same-project reassignment must still move the issue to the target cycle"
        )
