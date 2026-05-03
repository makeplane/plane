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
from datetime import date, datetime, timedelta, timezone as dt_timezone
from uuid import uuid4

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.app.serializers import TimelinePropagationRequestSerializer
from plane.db.models import Issue, IssueRelation
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


# ---------------------------------------------------------------------------
# Plan 03-02 Task 1 — Serializer-level tests for
# ``TimelinePropagationRequestSerializer`` (CONTEXT D-04 structural-only).
# These pin the structural-vs-domain split: missing fields and ``operation``
# values other than ``"move"`` produce DRF default 400 (NOT envelope) when
# the live view runs ``is_valid(raise_exception=True)``.
# ---------------------------------------------------------------------------


def _valid_request_payload(work_item_id=None, expected_updated_at=None):
    """Build a minimal valid payload for the request serializer."""
    return {
        "work_item_id": str(work_item_id or uuid4()),
        "original_start_date": "2026-01-01",
        "original_target_date": "2026-01-02",
        "expected_updated_at": (
            expected_updated_at
            or datetime(2026, 1, 1, 12, 0, 0, tzinfo=dt_timezone.utc).isoformat()
        ),
        "requested_start_date": "2026-01-10",
        "requested_target_date": "2026-01-11",
        "operation": "move",
    }


class TestTimelinePropagationRequestSerializer:
    """Plan 03-02 Task 1: structural-only serializer behavior (CONTEXT D-04)."""

    def test_serializer_accepts_valid_payload(self):
        """A well-formed payload validates and round-trips proper Python types."""
        wid = uuid4()
        payload = _valid_request_payload(work_item_id=wid)

        serializer = TimelinePropagationRequestSerializer(data=payload)

        assert serializer.is_valid(), serializer.errors
        validated = serializer.validated_data
        assert validated["work_item_id"] == wid
        assert isinstance(validated["original_start_date"], date)
        assert isinstance(validated["original_target_date"], date)
        assert isinstance(validated["expected_updated_at"], datetime)
        assert validated["expected_updated_at"].tzinfo is not None
        assert isinstance(validated["requested_start_date"], date)
        assert isinstance(validated["requested_target_date"], date)
        assert validated["operation"] == "move"

    def test_serializer_rejects_missing_field(
        self, session_client, workspace, create_user
    ):
        """Dropping ``expected_updated_at`` returns DRF default 400 (NOT envelope).

        Pins CONTEXT D-13 / Pitfall 8: the structural failure surface is the
        DRF parser, distinct from the ``{code, message}`` envelope reserved
        for the 7 PropagationErrorCode values.
        """
        project = ProjectFactory.create(workspace=workspace, created_by=create_user)
        ProjectMemberFactory.create(project=project, member=create_user, role=20)
        issue = IssueFactory.create(project=project)

        payload = _valid_request_payload(work_item_id=issue.id)
        del payload["expected_updated_at"]

        url = reverse(
            "project-timeline-propagation",
            kwargs={"slug": workspace.slug, "project_id": project.id},
        )
        response = session_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        body = response.json()
        # DRF default 400 body is per-field: {"expected_updated_at": [...]}.
        # The ``{code, message}`` envelope MUST NOT be triggered for
        # structural failures (CONTEXT D-04 / Pitfall 8).
        assert "code" not in body
        assert "message" not in body or "expected_updated_at" in body

    def test_serializer_rejects_resize_operation(
        self, session_client, workspace, create_user
    ):
        """``operation="resize"`` returns DRF default 400 (NOT envelope).

        The ChoiceField at the parser layer rejects every value except ``"move"``
        per CONTEXT D-04 / PROP-18 / FE-09. This pins the structural-vs-domain
        split — ``"resize"`` never reaches the algorithm and never produces a
        ``{code, message}`` envelope.
        """
        project = ProjectFactory.create(workspace=workspace, created_by=create_user)
        ProjectMemberFactory.create(project=project, member=create_user, role=20)
        issue = IssueFactory.create(project=project)

        payload = _valid_request_payload(work_item_id=issue.id)
        payload["operation"] = "resize"

        url = reverse(
            "project-timeline-propagation",
            kwargs={"slug": workspace.slug, "project_id": project.id},
        )
        response = session_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        body = response.json()
        assert "code" not in body, (
            f"resize must return DRF default 400, NOT envelope; got {body}"
        )

    def test_serializer_accepts_optional_client_preview_count(self):
        """``client_preview_count`` is optional; preserved when present."""
        # Present case
        payload = _valid_request_payload()
        payload["client_preview_count"] = 42
        serializer = TimelinePropagationRequestSerializer(data=payload)
        assert serializer.is_valid(), serializer.errors
        assert serializer.validated_data["client_preview_count"] == 42

        # Absent case
        payload2 = _valid_request_payload()
        assert "client_preview_count" not in payload2
        serializer2 = TimelinePropagationRequestSerializer(data=payload2)
        assert serializer2.is_valid(), serializer2.errors
        assert "client_preview_count" not in serializer2.validated_data

    def test_serializer_does_not_check_cross_field_invariants(self):
        """``requested_target_date < requested_start_date`` still passes
        ``is_valid()`` (CONTEXT D-04).

        The algorithm owns ``INVALID_DATE_RANGE`` per Phase 2 D-06 step 1; the
        serializer is structural-only. This test pins the absence of any
        cross-field ``validate(...)`` method.
        """
        payload = _valid_request_payload()
        payload["requested_start_date"] = "2026-01-15"
        payload["requested_target_date"] = "2026-01-10"  # target < start

        serializer = TimelinePropagationRequestSerializer(data=payload)

        assert serializer.is_valid(), serializer.errors
