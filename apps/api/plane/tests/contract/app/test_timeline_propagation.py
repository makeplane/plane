# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the Timeline Propagation endpoint (Phase 3).

D-13 / Pitfall 8: the 7 typed PropagationErrorCode values are the only
payloads wrapped in ``{code, message}``. DRF parser 400s and BaseAPIView
IntegrityError 400s are NOT envelope-shaped.

D-09 / Pitfall 9: ``pytest.mark.django_db`` wraps each test in a transaction
that never commits, so ``transaction.on_commit`` callbacks never fire by
default. Tests in 03-03 use ``mocker.patch`` on
``django.db.transaction.on_commit`` with ``side_effect=lambda fn: fn()`` to
bypass this.
"""
from uuid import uuid4

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import IssueRelation
from plane.tests.factories import (
    IssueFactory,
    IssueRelationFactory,
    ProjectFactory,
    ProjectMemberFactory,
    StateFactory,
    UserFactory,
    WorkspaceFactory,
    WorkspaceMemberFactory,
)

pytestmark = [pytest.mark.contract, pytest.mark.django_db]


# ---------------------------------------------------------------------------
# Task 1 — Factory smoke tests (Wave-0 fixture sanity).
# These prove the new factories actually save before any view-level test
# depends on them.
# ---------------------------------------------------------------------------


class TestFactorySmoke:
    """Wave-0 sanity: the new factories produce saveable, well-formed rows."""

    def test_factory_smoke_issue_factory_saves(self):
        """IssueFactory.create() returns a saved Issue with all required FKs.

        Per CONTEXT D-14: ProjectFactory does not seed states, so the
        IssueFactory must wire an explicit StateFactory SubFactory; otherwise
        Issue.save() falls back to a project default that doesn't exist and
        ``state`` ends up None — which would later silently fail the state FK
        in IssueManager queries.
        """
        issue = IssueFactory.create()

        assert issue.id is not None
        assert issue.project_id is not None
        assert issue.workspace_id is not None
        assert issue.state is not None
        assert issue.state.project_id == issue.project_id
        assert issue.state.workspace_id == issue.workspace_id

    def test_factory_smoke_issue_relation_factory_defaults_to_blocked_by(self):
        """IssueRelationFactory defaults to relation_type='blocked_by'.

        Phase 1 D-04 binding: the precedence graph loader filters on the
        literal string ``"blocked_by"``. If the factory ever drifts, every
        downstream graph-loading test becomes a silent no-op.
        """
        relation = IssueRelationFactory.create()

        assert relation.id is not None
        assert relation.relation_type == "blocked_by"
        assert relation.project_id == relation.issue.project_id
        assert relation.workspace_id == relation.issue.workspace_id
        assert relation.related_issue.project_id == relation.issue.project_id

    def test_factory_smoke_issue_factory_state_project_matches_explicit_project(self):
        """When IssueFactory(project=p) is called, state.project == p.

        This pins the SelfAttribute("..project") wiring on the SubFactory.
        Without it, the state would spawn a fresh ProjectFactory and break
        the (state.project, issue.project) FK invariant.
        """
        project = ProjectFactory.create()
        issue = IssueFactory.create(project=project)

        assert issue.project_id == project.id
        assert issue.state.project_id == project.id
        assert issue.workspace_id == project.workspace_id


# ---------------------------------------------------------------------------
# Task 2 — Routing scaffold + API-11 regression smoke.
# These pin the public HTTP surface; Plan 03-02 grows them into the full
# permission/algorithm contract suite.
# ---------------------------------------------------------------------------


class TestTimelinePropagation:
    """Routing scaffold tests for the new endpoint + API-11 regression."""

    def test_url_reverses(self):
        """``reverse("project-timeline-propagation")`` resolves to the
        canonical project-scoped path (CONTEXT D-01).

        plane.app.urls is mounted at ``/api/`` (see plane/urls.py:18), so the
        canonical path begins with ``/api/workspaces/...``.
        """
        slug = "ws-test"
        project_id = uuid4()

        url = reverse(
            "project-timeline-propagation",
            kwargs={"slug": slug, "project_id": project_id},
        )

        expected = (
            f"/api/workspaces/{slug}/projects/{project_id}/timeline-propagation/"
        )
        assert url == expected

    def test_unauthenticated_request_returns_401(self):
        """Unauthenticated POST returns DRF default 401 (NOT envelope).

        BaseAPIView's ``IsAuthenticated`` permission class fires before any
        view code; the response body is DRF's stock
        ``{"detail": "Authentication credentials were not provided."}``,
        which is NOT the ``{code, message}`` failure envelope reserved for
        the 7 PropagationErrorCode values (CONTEXT D-13 / Pitfall 8).
        """
        client = APIClient()  # no force_authenticate
        url = reverse(
            "project-timeline-propagation",
            kwargs={"slug": "ws-test", "project_id": uuid4()},
        )

        response = client.post(url, {}, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_existing_bulk_update_endpoint_unchanged(
        self, session_client, workspace, create_user
    ):
        """API-11 regression smoke against ``IssueBulkUpdateDateEndpoint``.

        Per Open Question 5: structural smoke only, NOT a full behavior
        re-verification. We POST one updates entry with new dates, assert
        200, and assert the response body's top-level keys match the
        existing ``{"message": ...}`` shape (see
        ``apps/api/plane/app/views/issue/base.py:1093-1170``).
        """
        # Set up a project + issue + project membership so the existing
        # @allow_permission([ROLE.ADMIN, ROLE.MEMBER]) decorator passes.
        project = ProjectFactory.create(workspace=workspace, created_by=create_user)
        ProjectMemberFactory.create(
            project=project, member=create_user, role=20
        )  # ADMIN
        issue = IssueFactory.create(project=project)

        url = reverse(
            "project-issue-dates",
            kwargs={"slug": workspace.slug, "project_id": project.id},
        )
        payload = {
            "updates": [
                {
                    "id": str(issue.id),
                    "start_date": "2026-06-01",
                    "target_date": "2026-06-05",
                }
            ]
        }

        response = session_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        # Existing endpoint returns a flat {"message": "..."} body.
        assert set(body.keys()) == {"message"}, (
            f"IssueBulkUpdateDateEndpoint shape changed; got keys "
            f"{set(body.keys())}. API-11 regression — see Plan 03-01."
        )
