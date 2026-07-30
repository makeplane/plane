"""
Regression tests for makeplane/plane space public-board security fixes.

Covered findings
----------------
VULN-01  Cross-project comment list IDOR (AllowAny endpoint)
VULN-02  Cross-project comment injection (IsAuthenticated endpoint)
VULN-04  IssueVotePublicViewSet.get_queryset() used wrong kwarg
BONUS    IssueReactionPublicViewSet.get_queryset() used wrong kwargs
Phase-3  Cross-project vote/reaction injection in create() (adversarial review finding)

Each test class documents:
  - the original exploit scenario (should now return 404 or empty)
  - the authorised, in-project behaviour (must still work)
"""

from unittest.mock import patch, MagicMock
from uuid import uuid4

import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _board(project_id, workspace_id, is_comments=True, is_votes=True, is_reactions=True):
    """Return a minimal DeployBoard mock."""
    board = MagicMock()
    board.project_id = project_id
    board.workspace_id = workspace_id
    board.is_comments_enabled = is_comments
    board.is_votes_enabled = is_votes
    board.is_reactions_enabled = is_reactions
    return board


# ---------------------------------------------------------------------------
# VULN-01 — IssueCommentPublicViewSet.get_queryset() project_id isolation
# ---------------------------------------------------------------------------

class TestIssueCommentGetQuerysetProjectIsolation:
    """
    VULN-01 root-cause: get_queryset() filtered by workspace_id + issue_id
    but NOT by project_id.  Any caller (no auth required for list) could
    read EXTERNAL comments on a foreign issue by supplying its UUID in the
    URL while using a public board from a different project.

    Fix: .filter(project_id=project_deploy_board.project_id) is now applied
    between the workspace_id filter and the issue_id filter.
    """

    def test_queryset_includes_project_id_filter(self):
        """
        After the fix the queryset MUST contain a project_id filter equal to
        the deploy-board's project_id.  This prevents cross-project comment
        reads even when the caller supplies a foreign issue_id.
        """
        from plane.space.views.issue import IssueCommentPublicViewSet

        project_id = uuid4()
        workspace_id = uuid4()
        board = _board(project_id, workspace_id)

        view = IssueCommentPublicViewSet()
        view.kwargs = {"anchor": "public-anchor", "issue_id": uuid4()}
        view.request = MagicMock()
        view.request.user.id = uuid4()
        view.action = "list"
        view.format_kwarg = None

        mock_qs = MagicMock()
        mock_qs.filter.return_value = mock_qs
        mock_qs.select_related.return_value = mock_qs
        mock_qs.annotate.return_value = mock_qs
        mock_qs.distinct.return_value = mock_qs
        mock_qs.order_by.return_value = mock_qs

        with patch("plane.space.views.issue.DeployBoard.objects.get", return_value=board), \
             patch.object(type(view), "get_queryset",
                          wraps=IssueCommentPublicViewSet.get_queryset):

            filter_kwargs_seen = []

            mock_qs.filter = lambda **kw: (filter_kwargs_seen.append(kw), mock_qs)[1]

            with patch("plane.space.views.issue.IssueComment.objects.none", return_value=mock_qs), \
                 patch("plane.space.views.issue.super") as mock_super:
                mock_super.return_value.get_queryset.return_value = mock_qs
                try:
                    view.get_queryset()
                except Exception:
                    pass  # annotate/filter_queryset wiring; we only care about filter calls

        combined = {}
        for d in filter_kwargs_seen:
            combined.update(d)

        assert "project_id" in combined, (
            "get_queryset() must filter by project_id to prevent cross-project IDOR. "
            "Filters seen: %s" % filter_kwargs_seen
        )
        assert combined["project_id"] == project_id


# ---------------------------------------------------------------------------
# VULN-02 — IssueCommentPublicViewSet.create() issue ownership validation
# ---------------------------------------------------------------------------

class TestIssueCommentCreateProjectIsolation:
    """
    VULN-02 root-cause: create() accepted the URL-supplied issue_id without
    verifying it belonged to the board's project.  An authenticated caller
    could POST a comment with a foreign issue_id, creating a DB record with
    comment.project_id != issue.project_id.

    Fix: Issue.objects.filter(pk=issue_id, project_id=..., workspace_id=...)
    is checked before serializer.save().  If the issue doesn't exist in the
    board's project the endpoint returns HTTP 404.
    """

    def _make_request(self, user=None):
        req = MagicMock()
        req.user = user or MagicMock(id=uuid4())
        req.data = {"comment_html": "<p>injected</p>"}
        return req

    def test_returns_404_for_foreign_issue(self):
        """
        Posting to a public board with an issue_id from a different project
        must return 404, not 201.
        """
        from plane.space.views.issue import IssueCommentPublicViewSet
        from rest_framework import status

        project_id = uuid4()
        workspace_id = uuid4()
        board = _board(project_id, workspace_id)
        foreign_issue_id = uuid4()

        view = IssueCommentPublicViewSet()
        view.kwargs = {}

        with patch("plane.space.views.issue.DeployBoard.objects.get", return_value=board), \
             patch("plane.space.views.issue.Issue.objects") as mock_issue_mgr:

            # Issue does NOT exist in board's project
            mock_issue_mgr.filter.return_value.exists.return_value = False

            response = view.create(self._make_request(), anchor="public-anchor",
                                   issue_id=foreign_issue_id)

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            "Expected 404 for issue belonging to a foreign project, got %d" % response.status_code
        )

    def test_allows_comment_on_board_project_issue(self):
        """
        Posting a comment for an issue that DOES belong to the board's project
        must succeed (HTTP 201).
        """
        from plane.space.views.issue import IssueCommentPublicViewSet
        from rest_framework import status

        project_id = uuid4()
        workspace_id = uuid4()
        board = _board(project_id, workspace_id)
        own_issue_id = uuid4()

        view = IssueCommentPublicViewSet()
        view.kwargs = {}

        mock_serializer = MagicMock()
        mock_serializer.is_valid.return_value = True
        mock_serializer.data = {}

        with patch("plane.space.views.issue.DeployBoard.objects.get", return_value=board), \
             patch("plane.space.views.issue.Issue.objects") as mock_issue_mgr, \
             patch("plane.space.views.issue.IssueCommentSerializer",
                   return_value=mock_serializer), \
             patch("plane.space.views.issue.issue_activity") as mock_task, \
             patch("plane.space.views.issue.ProjectMember.objects") as mock_pm, \
             patch("plane.space.views.issue.ProjectPublicMember.objects"):

            mock_issue_mgr.filter.return_value.exists.return_value = True
            mock_pm.filter.return_value.exists.return_value = True
            mock_task.delay = MagicMock()

            response = view.create(self._make_request(), anchor="public-anchor",
                                   issue_id=own_issue_id)

        assert response.status_code == status.HTTP_201_CREATED, (
            "Expected 201 for a valid in-project comment, got %d" % response.status_code
        )

    def test_returns_400_when_comments_disabled(self):
        """
        When comments are disabled on the board the endpoint must return 400
        regardless of the issue_id — and must not perform the issue lookup.
        """
        from plane.space.views.issue import IssueCommentPublicViewSet
        from rest_framework import status

        board = _board(uuid4(), uuid4(), is_comments=False)
        view = IssueCommentPublicViewSet()
        view.kwargs = {}

        with patch("plane.space.views.issue.DeployBoard.objects.get", return_value=board), \
             patch("plane.space.views.issue.Issue.objects") as mock_issue_mgr:

            response = view.create(MagicMock(), anchor="x", issue_id=uuid4())

            # Issue lookup must NOT be called when comments are disabled
            mock_issue_mgr.filter.assert_not_called()

        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Phase-3 — IssueVotePublicViewSet.create() issue ownership validation
# ---------------------------------------------------------------------------

class TestIssueVoteCreateProjectIsolation:
    """
    Phase-3 adversarial finding: create() accepted the URL-supplied issue_id
    without verifying it belonged to the board's project.  An authenticated
    caller could cast a vote on any issue in the system, creating a DB record
    with vote.project_id != vote.issue.project_id.

    Fix: _issue_belongs_to_board() is checked before get_or_create().
    Returns HTTP 404 if the issue does not belong to the board's project.
    """

    def _make_request(self):
        req = MagicMock()
        req.user = MagicMock(id=uuid4())
        req.data = {"vote": 1}
        return req

    def test_returns_404_for_foreign_issue(self):
        """
        Casting a vote for an issue from a different project must return 404.
        Before the fix this would create a cross-project IssueVote record.
        """
        from plane.space.views.issue import IssueVotePublicViewSet
        from rest_framework import status

        project_id = uuid4()
        workspace_id = uuid4()
        board = _board(project_id, workspace_id)
        foreign_issue_id = uuid4()

        view = IssueVotePublicViewSet()
        view.kwargs = {"issue_id": foreign_issue_id}

        with patch("plane.space.views.issue.DeployBoard.objects.get", return_value=board), \
             patch("plane.space.views.issue.Issue.objects") as mock_issue_mgr:

            # Issue does NOT exist in board's project
            mock_issue_mgr.filter.return_value.exists.return_value = False

            response = view.create(self._make_request(), anchor="public-anchor",
                                   issue_id=foreign_issue_id)

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            "Expected 404 when issue_id belongs to a foreign project, got %d. "
            "Cross-project vote injection must be blocked." % response.status_code
        )

    def test_allows_vote_on_board_project_issue(self):
        """
        Casting a vote for an issue that belongs to the board's project
        must succeed (HTTP 201).
        """
        from plane.space.views.issue import IssueVotePublicViewSet
        from rest_framework import status

        project_id = uuid4()
        workspace_id = uuid4()
        board = _board(project_id, workspace_id)
        own_issue_id = uuid4()

        view = IssueVotePublicViewSet()
        view.kwargs = {"issue_id": own_issue_id}

        mock_vote = MagicMock()
        mock_serializer_instance = MagicMock()
        mock_serializer_instance.data = {}

        with patch("plane.space.views.issue.DeployBoard.objects.get", return_value=board), \
             patch("plane.space.views.issue.Issue.objects") as mock_issue_mgr, \
             patch("plane.space.views.issue.IssueVote.objects") as mock_vote_mgr, \
             patch("plane.space.views.issue.IssueVoteSerializer",
                   return_value=mock_serializer_instance), \
             patch("plane.space.views.issue.issue_activity") as mock_task, \
             patch("plane.space.views.issue.ProjectMember.objects") as mock_pm, \
             patch("plane.space.views.issue.ProjectPublicMember.objects"):

            mock_issue_mgr.filter.return_value.exists.return_value = True
            mock_vote_mgr.get_or_create.return_value = (mock_vote, True)
            mock_pm.filter.return_value.exists.return_value = True
            mock_task.delay = MagicMock()

            response = view.create(self._make_request(), anchor="public-anchor",
                                   issue_id=own_issue_id)

        assert response.status_code == status.HTTP_201_CREATED, (
            "Expected 201 for a valid in-project vote, got %d" % response.status_code
        )


# ---------------------------------------------------------------------------
# Phase-3 — IssueReactionPublicViewSet.create() issue ownership validation
# ---------------------------------------------------------------------------

class TestIssueReactionCreateProjectIsolation:
    """
    Phase-3 adversarial finding: create() accepted the URL-supplied issue_id
    without verifying it belonged to the board's project.  An authenticated
    caller could add a reaction to any issue in the system, creating a DB
    record with reaction.project_id != reaction.issue.project_id.

    Fix: _issue_belongs_to_board() is checked before serializer.save().
    Returns HTTP 404 if the issue does not belong to the board's project.
    """

    def _make_request(self):
        req = MagicMock()
        req.user = MagicMock(id=uuid4())
        req.data = {"reaction": "1F44D"}
        return req

    def test_returns_404_for_foreign_issue(self):
        """
        Adding a reaction to an issue from a different project must return 404.
        Before the fix this would create a cross-project IssueReaction record.
        """
        from plane.space.views.issue import IssueReactionPublicViewSet
        from rest_framework import status

        project_id = uuid4()
        workspace_id = uuid4()
        board = _board(project_id, workspace_id)
        foreign_issue_id = uuid4()

        view = IssueReactionPublicViewSet()
        view.kwargs = {"issue_id": foreign_issue_id}

        with patch("plane.space.views.issue.DeployBoard.objects.get", return_value=board), \
             patch("plane.space.views.issue.Issue.objects") as mock_issue_mgr:

            # Issue does NOT exist in board's project
            mock_issue_mgr.filter.return_value.exists.return_value = False

            response = view.create(self._make_request(), anchor="public-anchor",
                                   issue_id=foreign_issue_id)

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            "Expected 404 when issue_id belongs to a foreign project, got %d. "
            "Cross-project reaction injection must be blocked." % response.status_code
        )

    def test_allows_reaction_on_board_project_issue(self):
        """
        Adding a reaction to an issue that belongs to the board's project
        must succeed (HTTP 201).
        """
        from plane.space.views.issue import IssueReactionPublicViewSet
        from rest_framework import status

        project_id = uuid4()
        workspace_id = uuid4()
        board = _board(project_id, workspace_id)
        own_issue_id = uuid4()

        view = IssueReactionPublicViewSet()
        view.kwargs = {"issue_id": own_issue_id}

        mock_serializer = MagicMock()
        mock_serializer.is_valid.return_value = True
        mock_serializer.data = {}

        with patch("plane.space.views.issue.DeployBoard.objects.get", return_value=board), \
             patch("plane.space.views.issue.Issue.objects") as mock_issue_mgr, \
             patch("plane.space.views.issue.IssueReactionSerializer",
                   return_value=mock_serializer), \
             patch("plane.space.views.issue.issue_activity") as mock_task, \
             patch("plane.space.views.issue.ProjectMember.objects") as mock_pm, \
             patch("plane.space.views.issue.ProjectPublicMember.objects"):

            mock_issue_mgr.filter.return_value.exists.return_value = True
            mock_pm.filter.return_value.exists.return_value = True
            mock_task.delay = MagicMock()

            response = view.create(self._make_request(), anchor="public-anchor",
                                   issue_id=own_issue_id)

        assert response.status_code == status.HTTP_201_CREATED, (
            "Expected 201 for a valid in-project reaction, got %d" % response.status_code
        )


# ---------------------------------------------------------------------------
# VULN-04 — IssueVotePublicViewSet.get_queryset() wrong kwarg
# ---------------------------------------------------------------------------

class TestIssueVoteGetQuerysetKwarg:
    """
    VULN-04 root-cause: get_queryset() looked up the DeployBoard via
      workspace__slug=self.kwargs.get("anchor")
    but the URL pattern /anchor/<str:anchor>/issues/<uuid:issue_id>/votes/
    provides no "slug" kwarg — so "anchor" was passed as if it were a
    workspace slug.  The opaque anchor token never matches a workspace slug,
    DeployBoard.DoesNotExist was always raised, and vote listing silently
    returned an empty queryset on every public board.

    Fix: use anchor=self.kwargs.get("anchor").
    """

    def test_queryset_resolves_board_by_anchor_not_slug(self):
        """
        get_queryset() must call DeployBoard.objects.get(anchor=...) — NOT
        workspace__slug=...  If the wrong kwarg is used, DoesNotExist is
        raised and the test would observe empty results.
        """
        from plane.space.views.issue import IssueVotePublicViewSet

        anchor_token = "opaque-anchor-abc123"
        project_id = uuid4()
        workspace_id = uuid4()
        board = _board(project_id, workspace_id)

        view = IssueVotePublicViewSet()
        view.kwargs = {"anchor": anchor_token, "issue_id": uuid4()}

        called_with = {}

        def fake_get(**kwargs):
            called_with.update(kwargs)
            return board

        mock_qs = MagicMock()
        mock_qs.filter.return_value = mock_qs

        with patch("plane.space.views.issue.DeployBoard.objects.get", side_effect=fake_get), \
             patch("plane.space.views.issue.super") as mock_super:
            mock_super.return_value.get_queryset.return_value = mock_qs
            try:
                view.get_queryset()
            except Exception:
                pass

        assert "anchor" in called_with, (
            "get_queryset() must look up DeployBoard via 'anchor' kwarg. "
            "Actual kwargs used: %s" % called_with
        )
        assert called_with.get("anchor") == anchor_token, (
            "DeployBoard.objects.get must receive anchor=%r, got %r"
            % (anchor_token, called_with.get("anchor"))
        )
        assert "workspace__slug" not in called_with, (
            "get_queryset() must not use workspace__slug for the DeployBoard lookup "
            "(anchor is not a workspace slug). kwargs seen: %s" % called_with
        )


# ---------------------------------------------------------------------------
# BONUS — IssueReactionPublicViewSet.get_queryset() wrong kwargs
# ---------------------------------------------------------------------------

class TestIssueReactionGetQuerysetKwarg:
    """
    BONUS root-cause: get_queryset() looked up the DeployBoard via
      workspace__slug=self.kwargs.get("slug")
      project_id=self.kwargs.get("project_id")
    but the URL pattern /anchor/<str:anchor>/issues/<uuid:issue_id>/reactions/
    provides neither "slug" nor "project_id" kwargs.  Both resolved to None,
    DeployBoard.DoesNotExist was raised, and reaction listing was permanently
    broken on all public boards.

    Fix: use anchor=self.kwargs.get("anchor").
    """

    def test_queryset_resolves_board_by_anchor(self):
        """
        get_queryset() must call DeployBoard.objects.get(anchor=..., entity_name="project").
        """
        from plane.space.views.issue import IssueReactionPublicViewSet

        anchor_token = "public-reaction-anchor"
        project_id = uuid4()
        workspace_id = uuid4()
        board = _board(project_id, workspace_id)

        view = IssueReactionPublicViewSet()
        view.kwargs = {"anchor": anchor_token, "issue_id": uuid4()}

        called_with = {}

        def fake_get(**kwargs):
            called_with.update(kwargs)
            return board

        mock_qs = MagicMock()
        mock_qs.filter.return_value = mock_qs
        mock_qs.order_by.return_value = mock_qs
        mock_qs.distinct.return_value = mock_qs

        with patch("plane.space.views.issue.DeployBoard.objects.get", side_effect=fake_get), \
             patch("plane.space.views.issue.super") as mock_super:
            mock_super.return_value.get_queryset.return_value = mock_qs
            try:
                view.get_queryset()
            except Exception:
                pass

        assert "anchor" in called_with, (
            "get_queryset() must look up DeployBoard via 'anchor' kwarg. "
            "Actual kwargs used: %s" % called_with
        )
        assert called_with.get("anchor") == anchor_token, (
            "DeployBoard lookup must use anchor=%r; got %r" % (anchor_token, called_with.get("anchor"))
        )
        assert "workspace__slug" not in called_with, (
            "workspace__slug must not be used for DeployBoard lookup; "
            "URL provides no 'slug' kwarg. kwargs seen: %s" % called_with
        )
        # project_id must NOT be used as a DeployBoard lookup kwarg (it's not in the URL)
        assert "project_id" not in called_with, (
            "project_id from URL must not be used for DeployBoard lookup; "
            "URL provides no 'project_id' kwarg. kwargs seen: %s" % called_with
        )

    def test_reaction_list_returns_results_when_enabled(self):
        """
        With the fix in place, listing reactions on a board that has
        is_reactions_enabled=True must not silently return empty.
        (Previously always empty due to DoesNotExist on None slug.)
        """
        from plane.space.views.issue import IssueReactionPublicViewSet

        anchor_token = "board-with-reactions"
        project_id = uuid4()
        workspace_id = uuid4()
        board = _board(project_id, workspace_id, is_reactions=True)

        view = IssueReactionPublicViewSet()
        view.kwargs = {"anchor": anchor_token, "issue_id": uuid4()}

        sentinel_qs = object()  # non-empty sentinel
        mock_qs = MagicMock()
        mock_qs.filter.return_value = mock_qs
        mock_qs.order_by.return_value = mock_qs
        mock_qs.distinct.return_value = sentinel_qs

        with patch("plane.space.views.issue.DeployBoard.objects.get", return_value=board), \
             patch("plane.space.views.issue.super") as mock_super:
            mock_super.return_value.get_queryset.return_value = mock_qs
            result = view.get_queryset()

        assert result is sentinel_qs, (
            "get_queryset() must return the actual queryset when reactions are enabled, "
            "not IssueReaction.objects.none().  Got: %r" % result
        )
