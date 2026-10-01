# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for workspace-scoping of ``ProjectAdvanceAnalyticsChartEndpoint``.

Regression coverage for a cross-workspace IDOR: the ``work-items`` chart looked
up ``Cycle``/``Module`` by bare ``id`` with no workspace filter, so a member of
workspace A could pass a foreign ``cycle_id``/``module_id`` belonging to
workspace B and have that cycle's/module's ``start_date``/``end_date`` used to
build the chart response, leaking those dates across workspace boundaries.

The fix scopes the ``Cycle``/``Module`` lookups to the requesting workspace via
``workspace__slug=slug``, matching every other query in this file.
"""

from datetime import date
from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import (
    Cycle,
    Module,
    Project,
    ProjectMember,
    User,
    Workspace,
)

CHART_URL = "/api/workspaces/{slug}/projects/{project_id}/advance-analytics-charts/"


@pytest.fixture
def project(db, workspace, create_user):
    """A project in the fixture workspace; ``create_user`` is an active member."""
    project = Project.objects.create(
        name="Project A",
        identifier="PRJA",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def other_workspace(db):
    """A second, unrelated workspace owned by a different user."""
    unique_id = uuid4().hex[:8]
    owner = User.objects.create(
        email=f"owner-{unique_id}@plane.so",
        username=f"owner_{unique_id}",
        first_name="Owner",
        last_name="User",
    )
    owner.set_password("test-password")
    owner.save()
    return Workspace.objects.create(name="Workspace B", owner=owner, slug=f"workspace-b-{unique_id}")


@pytest.fixture
def other_project(db, other_workspace):
    """A project that lives in ``other_workspace``, owned by that workspace's owner."""
    return Project.objects.create(
        name="Project B",
        identifier="PRJB",
        workspace=other_workspace,
        created_by=other_workspace.owner,
    )


@pytest.fixture
def foreign_cycle(db, other_workspace, other_project):
    """A cycle belonging to the *other* workspace, with dates that must not leak."""
    return Cycle.objects.create(
        name="Foreign Cycle",
        project=other_project,
        workspace=other_workspace,
        owned_by=other_workspace.owner,
        start_date="2020-01-01T00:00:00Z",
        end_date="2020-01-31T00:00:00Z",
    )


@pytest.fixture
def foreign_module(db, other_workspace, other_project):
    """A module belonging to the *other* workspace, with dates that must not leak."""
    return Module.objects.create(
        name="Foreign Module",
        project=other_project,
        workspace=other_workspace,
        start_date=date(2020, 1, 1),
        target_date=date(2020, 1, 31),
    )


@pytest.fixture
def own_cycle(db, workspace, project, create_user):
    """A cycle belonging to the requester's own workspace/project."""
    return Cycle.objects.create(
        name="Own Cycle",
        project=project,
        workspace=workspace,
        owned_by=create_user,
        start_date="2024-01-01T00:00:00Z",
        end_date="2024-01-31T00:00:00Z",
    )


@pytest.mark.contract
class TestProjectAdvanceAnalyticsChartWorkspaceScope:
    """A workspace member must not be able to read another workspace's cycle/module dates."""

    @pytest.mark.django_db
    def test_foreign_cycle_id_does_not_leak_dates(self, session_client, workspace, project, foreign_cycle):
        response = session_client.get(
            CHART_URL.format(slug=workspace.slug, project_id=project.id),
            {"type": "work-items", "cycle_id": str(foreign_cycle.id)},
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert response.data == {"data": [], "schema": {}}, f"Leaked foreign cycle date range: {response.data!r}"

    @pytest.mark.django_db
    def test_foreign_module_id_does_not_leak_dates(self, session_client, workspace, project, foreign_module):
        response = session_client.get(
            CHART_URL.format(slug=workspace.slug, project_id=project.id),
            {"type": "work-items", "module_id": str(foreign_module.id)},
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert response.data == {"data": [], "schema": {}}, f"Leaked foreign module date range: {response.data!r}"

    @pytest.mark.django_db
    def test_own_cycle_id_still_returns_chart(self, session_client, workspace, project, own_cycle):
        """Positive control: analytics for a cycle in the requester's own workspace still work."""
        response = session_client.get(
            CHART_URL.format(slug=workspace.slug, project_id=project.id),
            {"type": "work-items", "cycle_id": str(own_cycle.id)},
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["schema"] == {
            "completed_issues": "completed_issues",
            "created_issues": "created_issues",
        }
        dates = {row["key"] for row in response.data["data"]}
        assert "2024-01-01" in dates, f"Expected own cycle's date range in {response.data!r}"
