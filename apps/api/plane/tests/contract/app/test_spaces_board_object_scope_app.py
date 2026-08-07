# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for public Spaces board object-ID scoping.

Regression coverage for WEB-8283.

The public Spaces board write endpoints (``/api/public/anchor/<anchor>/...``)
resolve the ``DeployBoard`` from the URL ``anchor`` but previously trusted the
caller-supplied ``issue_id`` / ``comment_id`` / ``intake_id`` verbatim, without
verifying the target object belonged to that board's project/workspace. Any
authenticated user could therefore write a comment / reaction / vote onto an
arbitrary issue in any project (cross-tenant), and read EXTERNAL comments from a
different project in the same workspace.

The fix binds every caller-supplied object id to the board's project + workspace
before writing, and scopes the comment-list read to the board's project.
"""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    DeployBoard,
    Intake,
    Issue,
    IssueComment,
    Project,
    ProjectMember,
    State,
    User,
    Workspace,
    WorkspaceMember,
)


# --------------------------------------------------------------------------- #
# URL helpers
# --------------------------------------------------------------------------- #
def comments_url(anchor, issue_id):
    return f"/api/public/anchor/{anchor}/issues/{issue_id}/comments/"


def issue_reactions_url(anchor, issue_id):
    return f"/api/public/anchor/{anchor}/issues/{issue_id}/reactions/"


def comment_reactions_url(anchor, comment_id):
    return f"/api/public/anchor/{anchor}/comments/{comment_id}/reactions/"


def votes_url(anchor, issue_id):
    return f"/api/public/anchor/{anchor}/issues/{issue_id}/votes/"


def intake_issues_url(anchor, intake_id):
    return f"/api/public/anchor/{anchor}/intakes/{intake_id}/intake-issues/"


# --------------------------------------------------------------------------- #
# Fixtures
# --------------------------------------------------------------------------- #
@pytest.fixture(autouse=True)
def _no_activity(db):
    """Stub the deferred activity task so writes never touch the broker."""
    with (
        mock.patch("plane.space.views.issue.issue_activity"),
        mock.patch("plane.space.views.intake.issue_activity"),
    ):
        yield


@pytest.fixture
def board(db, workspace, create_user):
    """A published project board (comments/reactions/votes + intake enabled).

    ``create_user`` (session_client) is an active member of this project.
    """
    project = Project.objects.create(
        name="Board Project", identifier="BRD", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(
        project=project, member=create_user, workspace=workspace, role=20, is_active=True
    )
    state = State.objects.create(
        name="Todo", project=project, workspace=workspace, group="backlog", default=True
    )
    issue = Issue.objects.create(
        name="Board Issue", workspace=workspace, project=project, state=state, created_by=create_user
    )
    comment = IssueComment.objects.create(
        issue=issue,
        project=project,
        workspace=workspace,
        comment_html="<p>board external comment</p>",
        access="EXTERNAL",
        created_by=create_user,
        actor=create_user,
    )
    intake = Intake.objects.create(name="Board Intake", project=project, workspace=workspace)
    deploy_board = DeployBoard.objects.create(
        entity_name="project",
        entity_identifier=project.id,
        project=project,
        workspace=workspace,
        is_comments_enabled=True,
        is_reactions_enabled=True,
        is_votes_enabled=True,
        intake=intake,
    )
    return {
        "project": project,
        "issue": issue,
        "comment": comment,
        "intake": intake,
        "anchor": deploy_board.anchor,
    }


@pytest.fixture
def victim(db, workspace, create_user):
    """A *different* project in the SAME workspace, not published on ``board``."""
    project = Project.objects.create(
        name="Victim Project", identifier="VIC", workspace=workspace, created_by=create_user
    )
    state = State.objects.create(
        name="Todo", project=project, workspace=workspace, group="backlog", default=True
    )
    issue = Issue.objects.create(
        name="Victim Issue", workspace=workspace, project=project, state=state, created_by=create_user
    )
    comment = IssueComment.objects.create(
        issue=issue,
        project=project,
        workspace=workspace,
        comment_html="<p>secret external comment</p>",
        access="EXTERNAL",
        created_by=create_user,
        actor=create_user,
    )
    intake = Intake.objects.create(name="Victim Intake", project=project, workspace=workspace)
    return {"project": project, "issue": issue, "comment": comment, "intake": intake}


@pytest.fixture
def victim_other_ws(db, create_user):
    """A project in a DIFFERENT workspace — exercises the workspace_id binding
    (true cross-tenant, matching the advisory's stated impact)."""
    uid = uuid4().hex[:8]
    owner = User.objects.create(email=f"victim-owner-{uid}@plane.so", username=f"victim_owner_{uid}")
    owner.set_password("test-password")
    owner.save()
    other_ws = Workspace.objects.create(name="Other WS", owner=owner, slug=f"other-ws-{uid}")
    WorkspaceMember.objects.create(workspace=other_ws, member=owner, role=20)
    project = Project.objects.create(
        name="Other WS Project", identifier="OWP", workspace=other_ws, created_by=owner
    )
    state = State.objects.create(
        name="Todo", project=project, workspace=other_ws, group="backlog", default=True
    )
    issue = Issue.objects.create(
        name="Other WS Issue", workspace=other_ws, project=project, state=state, created_by=owner
    )
    return {"workspace": other_ws, "project": project, "issue": issue}


@pytest.fixture
def board_votes_disabled(db, workspace, create_user):
    """A published board with voting DISABLED, for the is_votes_enabled gate."""
    project = Project.objects.create(
        name="No-Vote Project", identifier="NVP", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(
        project=project, member=create_user, workspace=workspace, role=20, is_active=True
    )
    state = State.objects.create(
        name="Todo", project=project, workspace=workspace, group="backlog", default=True
    )
    issue = Issue.objects.create(
        name="No-Vote Issue", workspace=workspace, project=project, state=state, created_by=create_user
    )
    deploy_board = DeployBoard.objects.create(
        entity_name="project",
        entity_identifier=project.id,
        project=project,
        workspace=workspace,
        is_comments_enabled=True,
        is_reactions_enabled=True,
        is_votes_enabled=False,
        intake=None,
    )
    return {"project": project, "issue": issue, "anchor": deploy_board.anchor}


@pytest.fixture
def attacker_client(db, workspace):
    """An authenticated user who is NOT a member of the victim project."""
    uid = uuid4().hex[:8]
    user = User.objects.create(email=f"attacker-{uid}@plane.so", username=f"attacker_{uid}")
    user.set_password("test-password")
    user.save()
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


# --------------------------------------------------------------------------- #
# Cross-tenant WRITE — must be rejected (404 for issue/comment binding,
# 400 for the intake binding mismatch, per each endpoint's contract below)
# --------------------------------------------------------------------------- #
@pytest.mark.contract
class TestSpacesBoardObjectScope:
    @pytest.mark.django_db
    def test_cannot_comment_on_issue_outside_board_project(self, attacker_client, board, victim):
        response = attacker_client.post(
            comments_url(board["anchor"], victim["issue"].id),
            {"comment_html": "<p>injected</p>"},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert not IssueComment.objects.filter(
            issue_id=victim["issue"].id, comment_html="<p>injected</p>"
        ).exists()

    @pytest.mark.django_db
    def test_cannot_react_to_issue_outside_board_project(self, attacker_client, board, victim):
        response = attacker_client.post(
            issue_reactions_url(board["anchor"], victim["issue"].id),
            {"reaction": "smile"},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_cannot_vote_on_issue_outside_board_project(self, attacker_client, board, victim):
        response = attacker_client.post(
            votes_url(board["anchor"], victim["issue"].id),
            {"vote": 1},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_cannot_react_to_comment_outside_board_project(self, attacker_client, board, victim):
        response = attacker_client.post(
            comment_reactions_url(board["anchor"], victim["comment"].id),
            {"reaction": "smile"},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_cannot_create_intake_issue_with_foreign_intake(self, attacker_client, board, victim):
        response = attacker_client.post(
            intake_issues_url(board["anchor"], victim["intake"].id),
            {"issue": {"name": "injected intake"}},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_cannot_comment_on_issue_in_other_workspace(self, attacker_client, board, victim_other_ws):
        """The guard binds on workspace_id too — a board's anchor cannot reach an
        issue in a different workspace (true cross-tenant vector)."""
        response = attacker_client.post(
            comments_url(board["anchor"], victim_other_ws["issue"].id),
            {"comment_html": "<p>injected cross-ws</p>"},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert not IssueComment.objects.filter(
            issue_id=victim_other_ws["issue"].id, comment_html="<p>injected cross-ws</p>"
        ).exists()

    # ----------------------------------------------------------------------- #
    # Feature gate — vote create must honor is_votes_enabled (parity fix)
    # ----------------------------------------------------------------------- #
    @pytest.mark.django_db
    def test_cannot_vote_when_votes_disabled(self, session_client, board_votes_disabled):
        response = session_client.post(
            votes_url(board_votes_disabled["anchor"], board_votes_disabled["issue"].id),
            {"vote": 1},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    # ----------------------------------------------------------------------- #
    # Cross-project READ leak — comment list must not surface other projects
    # ----------------------------------------------------------------------- #
    @pytest.mark.django_db
    def test_comment_list_does_not_leak_cross_project(self, attacker_client, board, victim):
        response = attacker_client.get(comments_url(board["anchor"], victim["issue"].id))
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        results = response.data["results"] if isinstance(response.data, dict) else response.data
        returned_ids = {str(c["id"]) for c in results}
        assert str(victim["comment"].id) not in returned_ids, (
            "Victim project's EXTERNAL comment leaked through another board's anchor"
        )

    @pytest.mark.django_db
    def test_comment_list_returns_own_project_comments(self, session_client, board):
        """Positive control: the board's own EXTERNAL comments are still listed
        (guards against an over-broad project_id filter returning nothing)."""
        response = session_client.get(comments_url(board["anchor"], board["issue"].id))
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        results = response.data["results"] if isinstance(response.data, dict) else response.data
        returned_ids = {str(c["id"]) for c in results}
        assert str(board["comment"].id) in returned_ids, (
            "Board's own EXTERNAL comment was wrongly filtered out"
        )

    # ----------------------------------------------------------------------- #
    # Positive controls — legitimate writes on the board's own issue still work
    # ----------------------------------------------------------------------- #
    @pytest.mark.django_db
    def test_can_comment_on_issue_in_board_project(self, session_client, board):
        response = session_client.post(
            comments_url(board["anchor"], board["issue"].id),
            {"comment_html": "<p>legit</p>"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_can_vote_on_issue_in_board_project(self, session_client, board):
        response = session_client.post(
            votes_url(board["anchor"], board["issue"].id),
            {"vote": 1},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_can_react_to_issue_in_board_project(self, session_client, board):
        response = session_client.post(
            issue_reactions_url(board["anchor"], board["issue"].id),
            {"reaction": "smile"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_can_react_to_comment_in_board_project(self, session_client, board):
        response = session_client.post(
            comment_reactions_url(board["anchor"], board["comment"].id),
            {"reaction": "smile"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_can_create_intake_issue_with_own_intake(self, session_client, board):
        response = session_client.post(
            intake_issues_url(board["anchor"], board["intake"].id),
            {"issue": {"name": "legit intake issue"}},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
