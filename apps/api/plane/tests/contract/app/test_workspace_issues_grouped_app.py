# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the grouped workspace issues endpoint.

``WorkspaceViewIssuesViewSet.list`` (``GET /api/workspaces/<slug>/issues/``)
gained ``group_by``/``sub_group_by`` support that mirrors
``WorkspaceUserProfileIssuesEndpoint.get`` (feat(board): grouped workspace
issues endpoint). With ``group_by=state__group&sub_group_by=project_id`` the
``results`` payload becomes a dict keyed by the five state groups, each nesting
per-project cells of issue dicts; sub-group keys appear only for groups that
actually hold work items. The flat branch (no ``group_by``) must keep returning
the previous ``ViewIssueListSerializer`` list shape, and the legacy
``state_group`` / ``project`` filters plus cursor pagination must keep working
on it.

These tests pin that response contract and the guest ``created_by`` scoping so a
regression in either branch is caught.
"""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Issue,
    Project,
    ProjectMember,
    State,
    User,
    WorkspaceMember,
)

ISSUES_URL = "/api/workspaces/{slug}/issues/"
PROJECT_ISSUES_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/"
STATE_GROUPS = {"backlog", "unstarted", "started", "completed", "cancelled"}


def _make_project(name, identifier, workspace, user):
    """A project whose Admin member is ``user`` so its issues stay visible to them."""
    project = Project.objects.create(name=name, identifier=identifier, workspace=workspace, created_by=user)
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=20, is_active=True)
    return project


def _make_state(name, group, project, workspace):
    """A state belonging to ``project`` in the given ``group``."""
    return State.objects.create(name=name, color="#000000", group=group, project=project, workspace=workspace)


def _make_issue(name, project, workspace, state, author):
    """Create an issue with a deterministic ``created_by``.

    ``BaseModel.save`` auto-sets ``created_by`` from the current request user
    (None/anonymous under tests), so a ``created_by=`` kwarg to ``create`` is
    overwritten. Passing ``created_by_id`` to ``save`` sets it explicitly.
    """
    issue = Issue(name=name, project=project, workspace=workspace, state=state)
    issue.save(created_by_id=author.id)
    return issue


def _grouped_issue_ids(results):
    """Flatten every nested issue id across all group and sub-group cells."""
    ids = set()
    for group in results.values():
        for cell in group["results"].values():
            ids.update(str(item["id"]) for item in cell["results"])
    return ids


def _cell_issue_ids(results, group, project_id):
    """Issue ids living in one ``(group, project)`` cell of the grouped payload."""
    return {str(item["id"]) for item in results[group]["results"][str(project_id)]["results"]}


@pytest.fixture
def board(db, workspace, create_user):
    """Two projects with work items spanning the ``started`` and ``completed`` groups."""
    project_a = _make_project("Alpha", "ALP", workspace, create_user)
    project_b = _make_project("Beta", "BET", workspace, create_user)
    a_started = _make_state("Alpha In Progress", "started", project_a, workspace)
    a_done = _make_state("Alpha Done", "completed", project_a, workspace)
    b_started = _make_state("Beta In Progress", "started", project_b, workspace)
    issues = {
        "a_started": _make_issue("Alpha started", project_a, workspace, a_started, create_user),
        "a_completed": _make_issue("Alpha completed", project_a, workspace, a_done, create_user),
        "b_started": _make_issue("Beta started", project_b, workspace, b_started, create_user),
    }
    return {"project_a": project_a, "project_b": project_b, "issues": issues}


@pytest.fixture
def pagination_board(db, workspace, create_user):
    """Project A holds two ``started`` items, project B one ``completed`` item."""
    project_a = _make_project("Pag Alpha", "PAL", workspace, create_user)
    project_b = _make_project("Pag Beta", "PBE", workspace, create_user)
    a_started = _make_state("Pag A In Progress", "started", project_a, workspace)
    b_done = _make_state("Pag B Done", "completed", project_b, workspace)
    return {
        "project_a": project_a,
        "project_b": project_b,
        "a_issues": (
            _make_issue("Pag A one", project_a, workspace, a_started, create_user),
            _make_issue("Pag A two", project_a, workspace, a_started, create_user),
        ),
        "b_issue": _make_issue("Pag B one", project_b, workspace, b_done, create_user),
    }


@pytest.fixture
def guest(db, workspace):
    """An active workspace + project GUEST (role=5)."""
    unique_id = uuid4().hex[:8]
    user = User.objects.create(
        email=f"guest-{unique_id}@plane.so",
        username=f"guest_{unique_id}",
        first_name="Guest",
        last_name="User",
    )
    user.set_password("test-password")
    user.save()
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=5)
    return user


@pytest.fixture
def guest_project(db, workspace, guest):
    """A secret project (``guest_view_all_features`` defaults to False) the guest belongs to."""
    project = Project.objects.create(name="Guest Project", identifier="GST", workspace=workspace, created_by=guest)
    ProjectMember.objects.create(project=project, member=guest, workspace=workspace, role=5, is_active=True)
    return project


@pytest.fixture
def guest_state(db, workspace, guest_project):
    return _make_state("Guest In Progress", "started", guest_project, workspace)


@pytest.fixture
def guest_own_issue(db, workspace, guest, guest_project, guest_state):
    """An issue authored by the guest."""
    return _make_issue("Guest's own issue", guest_project, workspace, guest_state, guest)


@pytest.fixture
def guest_foreign_issue(db, workspace, create_user, guest_project, guest_state):
    """An issue authored by someone other than the guest."""
    return _make_issue("Someone else's issue", guest_project, workspace, guest_state, create_user)


@pytest.fixture
def guest_client(guest):
    client = APIClient()
    client.force_authenticate(user=guest)
    return client


@pytest.mark.contract
class TestWorkspaceIssuesGroupedContract:
    """Response-shape and scoping contract for ``GET /api/workspaces/<slug>/issues/``."""

    @pytest.mark.django_db
    def test_grouped_by_state_group_and_project(self, session_client, workspace, board):
        response = session_client.get(
            ISSUES_URL.format(slug=workspace.slug),
            {"group_by": "state__group", "sub_group_by": "project_id"},
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        body = response.data
        assert body["grouped_by"] == "state__group"
        assert body["sub_grouped_by"] == "project_id"

        results = body["results"]
        assert isinstance(results, dict)
        assert set(results.keys()) == STATE_GROUPS

        project_a = board["project_a"]
        project_b = board["project_b"]
        issues = board["issues"]

        assert _cell_issue_ids(results, "started", project_a.id) == {str(issues["a_started"].id)}
        assert _cell_issue_ids(results, "started", project_b.id) == {str(issues["b_started"].id)}
        assert _cell_issue_ids(results, "completed", project_a.id) == {str(issues["a_completed"].id)}

        # A group with no work items carries no sub-group cells at all.
        assert results["backlog"]["results"] == {}
        assert results["unstarted"]["results"] == {}
        assert results["cancelled"]["results"] == {}

    @pytest.mark.django_db
    def test_flat_list_without_group_by(self, session_client, workspace, board):
        response = session_client.get(ISSUES_URL.format(slug=workspace.slug))
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        body = response.data
        assert body["grouped_by"] is None
        assert body["sub_grouped_by"] is None

        results = body["results"]
        assert isinstance(results, list)
        expected_ids = {str(issue.id) for issue in board["issues"].values()}
        assert {str(row["id"]) for row in results} == expected_ids

    @pytest.mark.django_db
    def test_guest_scope_grouped(
        self, guest_client, workspace, guest_project, guest_own_issue, guest_foreign_issue
    ):
        response = guest_client.get(
            ISSUES_URL.format(slug=workspace.slug),
            {"group_by": "state__group", "sub_group_by": "project_id"},
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        results = response.data["results"]
        assert isinstance(results, dict)

        returned_ids = _grouped_issue_ids(results)
        assert str(guest_own_issue.id) in returned_ids
        assert str(guest_foreign_issue.id) not in returned_ids, (
            f"Guest read a foreign issue: {results!r}"
        )

    @pytest.mark.django_db
    def test_flat_pagination_with_filters_and_cursor(self, session_client, workspace, pagination_board):
        project_a = pagination_board["project_a"]
        params = {
            "state_group": "started",
            "project": str(project_a.id),
            "per_page": 1,
            "order_by": "-sequence_id",
        }

        first = session_client.get(ISSUES_URL.format(slug=workspace.slug), params)
        assert first.status_code == status.HTTP_200_OK, (
            f"Got {first.status_code}: {getattr(first, 'data', None)!r}"
        )
        first_results = first.data["results"]
        assert isinstance(first_results, list)
        assert len(first_results) == 1
        assert first.data["next_page_results"] is True

        second = session_client.get(
            ISSUES_URL.format(slug=workspace.slug),
            {**params, "cursor": first.data["next_cursor"]},
        )
        assert second.status_code == status.HTTP_200_OK, (
            f"Got {second.status_code}: {getattr(second, 'data', None)!r}"
        )

        seen_ids = {str(row["id"]) for row in first_results}
        seen_ids |= {str(row["id"]) for row in second.data["results"]}
        expected_ids = {str(issue.id) for issue in pagination_board["a_issues"]}
        assert seen_ids == expected_ids
        assert str(pagination_board["b_issue"].id) not in seen_ids

    @pytest.mark.django_db
    def test_group_by_equal_to_sub_group_by_is_rejected(self, session_client, workspace):
        response = session_client.get(
            ISSUES_URL.format(slug=workspace.slug),
            {"group_by": "state__group", "sub_group_by": "state__group"},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data == {"error": "Group by and sub group by cannot have same parameters"}

    @pytest.mark.django_db
    def test_group_by_without_sub_group_by_uses_grouped_paginator_shape(self, session_client, workspace, board):
        """``group_by`` alone paginates with ``GroupedOffsetPaginator``: a flat map of group
        cells whose ``results`` hold issue dicts directly — no per-project nesting."""
        response = session_client.get(
            ISSUES_URL.format(slug=workspace.slug),
            {"group_by": "state__group"},
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        body = response.data
        assert body["grouped_by"] == "state__group"
        assert body["sub_grouped_by"] is None

        results = body["results"]
        assert isinstance(results, dict)
        assert set(results.keys()) == STATE_GROUPS

        issues = board["issues"]
        assert {str(item["id"]) for item in results["started"]["results"]} == {
            str(issues["a_started"].id),
            str(issues["b_started"].id),
        }
        assert results["started"]["total_results"] == 2
        assert {str(item["id"]) for item in results["completed"]["results"]} == {str(issues["a_completed"].id)}
        assert results["completed"]["total_results"] == 1
        for group in ("backlog", "unstarted", "cancelled"):
            assert results[group]["results"] == []
            assert results[group]["total_results"] == 0

        # issues sit directly in the group cell, keyed by their own fields
        sample = results["started"]["results"][0]
        assert "results" not in sample
        assert "project_id" in sample

    @pytest.mark.django_db
    def test_guest_grouped_payload_only_exposes_own_created_by(
        self, guest_client, guest, workspace, guest_project, guest_own_issue, guest_foreign_issue
    ):
        response = guest_client.get(
            ISSUES_URL.format(slug=workspace.slug),
            {"group_by": "state__group", "sub_group_by": "project_id"},
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        results = response.data["results"]

        returned = [
            item for group in results.values() for cell in group["results"].values() for item in cell["results"]
        ]
        assert {str(item["id"]) for item in returned} == {str(guest_own_issue.id)}
        assert all(str(item["created_by"]) == str(guest.id) for item in returned), (
            f"Guest payload leaked a foreign created_by: {results!r}"
        )


@pytest.mark.contract
class TestIssueCreateContract:
    """``IssueViewSet.create`` reports the issue's state group in its 201 payload."""

    @pytest.mark.django_db
    def test_create_response_contains_state_group(self, session_client, workspace, create_user):
        project = Project.objects.create(
            name="Create Project", identifier="CRT", workspace=workspace, created_by=create_user
        )
        ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20, is_active=True)
        state = _make_state("Create In Progress", "started", project, workspace)

        url = PROJECT_ISSUES_URL.format(slug=workspace.slug, project_id=project.id)
        with (
            mock.patch("plane.app.views.issue.base.issue_activity"),
            mock.patch("plane.app.views.issue.base.model_activity"),
            mock.patch("plane.app.views.issue.base.issue_description_version_task"),
        ):
            response = session_client.post(url, {"name": "Contract issue", "state_id": str(state.id)}, format="json")

        assert response.status_code == status.HTTP_201_CREATED, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert str(response.data["state_id"]) == str(state.id)
        assert response.data["state__group"] == "started"
