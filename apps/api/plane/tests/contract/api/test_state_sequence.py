# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for where a state created through the v1 API lands on the board.

State.save() put every new state after the last one, so a sequence sent with the
create request was silently replaced. The MCP `state create` passes one straight
through, which is how the bug showed up: new states landed after Cancelled.
"""

import pytest
from rest_framework import status

from plane.db.models import State
from plane.tests.factories import ProjectFactory, ProjectMemberFactory

ADMIN = 20


def _states_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/states/"


@pytest.fixture
def project(db, workspace, create_user):
    project = ProjectFactory(workspace=workspace, identifier="SQ")
    ProjectMemberFactory(project=project, member=create_user, role=ADMIN)
    # The first state keeps its default sequence; each later one goes 15000 after the last.
    State.objects.create(name="Todo", color="#000000", group="unstarted", project=project)
    State.objects.create(name="Cancelled", color="#9AA4BC", group="cancelled", project=project)
    return project


@pytest.mark.contract
@pytest.mark.django_db
class TestStateV1Sequence:
    def test_create_keeps_the_sequence_it_was_sent(self, api_key_client, workspace, project):
        todo, cancelled = State.objects.filter(project=project).order_by("sequence")
        between = (todo.sequence + cancelled.sequence) / 2
        response = api_key_client.post(
            _states_url(workspace.slug, project.id),
            {"name": "Blocked", "color": "#EF4444", "group": "started", "sequence": between},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["sequence"] == between
        assert State.objects.get(pk=response.data["id"]).sequence == between
        names = list(State.objects.filter(project=project).values_list("name", flat=True))
        assert names == ["Todo", "Blocked", "Cancelled"]

    def test_create_without_a_sequence_still_goes_after_the_last_state(self, api_key_client, workspace, project):
        last = max(State.objects.filter(project=project).values_list("sequence", flat=True))
        response = api_key_client.post(
            _states_url(workspace.slug, project.id),
            {"name": "Blocked", "color": "#EF4444", "group": "started"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["sequence"] == last + 15000

    def test_create_keeps_a_sequence_of_zero(self, api_key_client, workspace, project):
        """0 is a real position, the top of the board, not "unset"."""
        response = api_key_client.post(
            _states_url(workspace.slug, project.id),
            {"name": "Inbox", "color": "#60646C", "group": "backlog", "sequence": 0},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["sequence"] == 0
