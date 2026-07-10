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
from unittest.mock import Mock
from uuid import uuid4

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.app.serializers import TimelinePropagationRequestSerializer
from plane.app.services.timeline_propagation import PropagationErrorCode
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

    def test_bulk_update_endpoint_contract(self, session_client, workspace, create_user, monkeypatch):
        """API-11 structural smoke against ``IssueBulkUpdateDateEndpoint``.

        The weekend working-day duration branch intentionally extended the
        response from ``{"message"}`` to ``{"message", "issues"}`` so the
        frontend can merge server-normalized schedules. Full duration
        semantics live in ``test_issue_bulk_update_dates.py``; this remains
        a structural smoke only.
        """
        monkeypatch.setattr("plane.app.views.issue.base.issue_activity.delay", Mock())
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
        assert set(body.keys()) == {"message", "issues"}
        assert len(body["issues"]) == 1
        assert set(body["issues"][0].keys()) == {
            "id",
            "start_date",
            "target_date",
            "planned_duration_working_days",
        }


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


# ---------------------------------------------------------------------------
# Plan 03-02 Task 2 — TimelinePropagationView body tests.
# 11 view-level tests + 1 helper covering: permission gates, success
# (no-violation + chain), single-now invariant, all 5 domain failure
# envelopes, stale check, and the all-or-nothing DB-write guarantee.
# ---------------------------------------------------------------------------


def _snapshot(issue_ids):
    """Return ``{id: updated_at}`` for each id; for the all-or-nothing pin.

    Captured BEFORE the POST under test; compared against post-call values
    via ``_assert_no_db_writes``. Used by every domain-failure test.
    """
    return dict(
        Issue.objects.filter(id__in=issue_ids).values_list("id", "updated_at")
    )


def _assert_no_db_writes(snapshot):
    """Fail if any Issue's ``updated_at`` differs from its pre-call snapshot.

    Pins API-08 / TEST-15 / TEST-17: every domain-failure path must roll back
    the transaction with zero row mutations. Snapshot is bit-identical
    datetime equality (datetimes are timezone-aware datetimes from Django).
    """
    post = dict(
        Issue.objects.filter(id__in=list(snapshot)).values_list("id", "updated_at")
    )
    assert post == snapshot, (
        f"Some Issue.updated_at values changed despite a domain failure. "
        f"Pre: {snapshot}; Post: {post}"
    )


def _unique_project(workspace, create_user, label="P"):
    """Create a project with unique name AND unique identifier.

    ``django_get_or_create=('name', 'workspace')`` on ProjectFactory plus the
    Project ``unique_together`` on ``(identifier, workspace, deleted_at=NULL)``
    both demand uniqueness; tests that need >1 project in one workspace must
    set both explicitly.
    """
    suffix = uuid4().hex[:6].upper()
    return ProjectFactory.create(
        workspace=workspace,
        created_by=create_user,
        name=f"Project {label} {suffix}",
        identifier=f"{label}{suffix}"[:12],
    )


def _build_member_project(workspace, create_user, role=20):
    """Helper: create a unique project and a ProjectMember row at the given role."""
    project = _unique_project(workspace, create_user, label="A")
    ProjectMemberFactory.create(project=project, member=create_user, role=role)
    return project


def _post_propagate(client, slug, project_id, **overrides):
    """Helper: POST to the propagation endpoint with a default valid payload.

    Caller may override any field via kwargs (e.g.,
    ``_post_propagate(..., expected_updated_at="2020-01-01T00:00:00Z")``
    for the stale-check test).
    """
    payload = {
        "work_item_id": overrides["work_item_id"],
        "original_start_date": overrides["original_start_date"],
        "original_target_date": overrides["original_target_date"],
        "expected_updated_at": overrides["expected_updated_at"],
        "requested_start_date": overrides["requested_start_date"],
        "requested_target_date": overrides["requested_target_date"],
        "operation": overrides.get("operation", "move"),
    }
    if "client_preview_count" in overrides:
        payload["client_preview_count"] = overrides["client_preview_count"]
    url = reverse(
        "project-timeline-propagation",
        kwargs={"slug": slug, "project_id": project_id},
    )
    return client.post(url, payload, format="json")


class TestTimelinePropagationView:
    """Plan 03-02 Task 2: full view body — permission, success, all 7
    failure envelopes, stale check, all-or-nothing DB-write guarantee.
    """

    # --- Permission gates -------------------------------------------------

    def test_non_member_returns_permission_denied_403(
        self, api_client, workspace, create_user
    ):
        """Authenticated user with NO ProjectMember row → 403 + envelope.

        Mirrors the inline membership filter from CONTEXT D-02. The project
        is created without a membership row for the requesting user, so the
        ``.exists()`` returns False and ``_error(PERMISSION_DENIED)`` fires
        before any algorithm or DB write (TEST-18 piece 1).
        """
        # workspace fixture creates a workspace owned by create_user, but no
        # ProjectMember rows. We authenticate a DIFFERENT user with no
        # membership at all.
        # Note: User has unique=True on username; UserFactory in this repo
        # doesn't set username, so we explicitly pass one to avoid collisions
        # with other tests that share the test DB.
        outsider_id = uuid4()
        outsider = UserFactory.create(
            email=f"outsider-{outsider_id.hex[:8]}@plane.so",
            username=f"outsider_{outsider_id.hex[:8]}",
        )
        api_client.force_authenticate(user=outsider)

        project = ProjectFactory.create(workspace=workspace, created_by=create_user)
        issue = IssueFactory.create(
            project=project, start_date="2026-01-01", target_date="2026-01-02"
        )

        response = _post_propagate(
            api_client,
            workspace.slug,
            project.id,
            work_item_id=str(issue.id),
            original_start_date="2026-01-01",
            original_target_date="2026-01-02",
            expected_updated_at=issue.updated_at.isoformat(),
            requested_start_date="2026-01-10",
            requested_target_date="2026-01-11",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        body = response.json()
        assert body["code"] == PropagationErrorCode.PERMISSION_DENIED.value
        assert isinstance(body["message"], str) and body["message"]

    def test_guest_returns_permission_denied_403(
        self, session_client, workspace, create_user
    ):
        """``ProjectMember(role=ROLE.GUEST.value=5)`` → 403 + envelope.

        GUEST is excluded by the inline ``role__in=[ADMIN, MEMBER]`` filter
        per CONTEXT D-02 (TEST-18 piece 2).
        """
        project = ProjectFactory.create(workspace=workspace, created_by=create_user)
        ProjectMemberFactory.create(project=project, member=create_user, role=5)
        issue = IssueFactory.create(
            project=project, start_date="2026-01-01", target_date="2026-01-02"
        )

        response = _post_propagate(
            session_client,
            workspace.slug,
            project.id,
            work_item_id=str(issue.id),
            original_start_date="2026-01-01",
            original_target_date="2026-01-02",
            expected_updated_at=issue.updated_at.isoformat(),
            requested_start_date="2026-01-10",
            requested_target_date="2026-01-11",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        body = response.json()
        assert body["code"] == PropagationErrorCode.PERMISSION_DENIED.value

    def test_dragged_issue_not_in_project_returns_permission_denied_403(
        self, session_client, workspace, create_user
    ):
        """Valid member but ``work_item_id`` belongs to a different project →
        403 + envelope (CONTEXT D-05c info-leak prevention).

        A non-member must not learn whether a work item exists or not. The
        ``Issue.DoesNotExist`` from ``select_for_update().get(...)`` maps to
        ``PERMISSION_DENIED``, matching the inline membership-check envelope.
        """
        # Member of project A, but the dragged work_item_id is in project B
        # under the same workspace.
        project_a = _unique_project(workspace, create_user, label="A")
        ProjectMemberFactory.create(project=project_a, member=create_user, role=20)
        project_b = _unique_project(workspace, create_user, label="B")
        # No ProjectMember row binding create_user to project_b.
        issue_b = IssueFactory.create(
            project=project_b,
            start_date="2026-01-01",
            target_date="2026-01-02",
        )

        response = _post_propagate(
            session_client,
            workspace.slug,
            project_a.id,  # POST to project A …
            work_item_id=str(issue_b.id),  # … but with a B-issue id
            original_start_date="2026-01-01",
            original_target_date="2026-01-02",
            expected_updated_at=issue_b.updated_at.isoformat(),
            requested_start_date="2026-01-10",
            requested_target_date="2026-01-11",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        body = response.json()
        assert body["code"] == PropagationErrorCode.PERMISSION_DENIED.value

    # --- Success paths ----------------------------------------------------

    def test_no_violation_move_returns_200_with_dragged_only(
        self, session_client, workspace, create_user
    ):
        """No-violation move (single Issue, no relations) → 200 + 1 update.

        Dragged item only; ``total_updated_count == 1`` (TEST-16 piece 1).
        """
        project = _build_member_project(workspace, create_user)
        issue = IssueFactory.create(
            project=project, start_date="2026-01-01", target_date="2026-01-02"
        )
        pre_updated_at = issue.updated_at

        response = _post_propagate(
            session_client,
            workspace.slug,
            project.id,
            work_item_id=str(issue.id),
            original_start_date="2026-01-01",
            original_target_date="2026-01-02",
            expected_updated_at=issue.updated_at.isoformat(),
            requested_start_date="2026-01-10",
            requested_target_date="2026-01-11",
        )

        assert response.status_code == status.HTTP_200_OK, response.content
        body = response.json()
        assert body["requested_work_item_id"] == str(issue.id)
        assert body["total_updated_count"] == 1
        assert body["client_preview_count"] is None
        assert len(body["work_items"]) == 1
        item = body["work_items"][0]
        assert item["id"] == str(issue.id)
        assert item["start_date"] == "2026-01-10"
        assert item["target_date"] == "2026-01-11"
        # updated_at is the captured ``now``; differs from pre-call value.
        issue.refresh_from_db()
        assert issue.updated_at != pre_updated_at
        assert issue.start_date == date(2026, 1, 10)
        assert issue.target_date == date(2026, 1, 11)

    def test_chain_propagation_returns_200_with_full_payload(
        self, session_client, workspace, create_user
    ):
        """A→B→C tight chain, drag A right past B's start → 3 updates.

        Asserts ``total_updated_count == 3`` and that all three returned
        ``updated_at`` values are equal (single captured ``now``;
        CONTEXT D-05a / D-05f, TEST-16 main).
        """
        project = _build_member_project(workspace, create_user)
        a = IssueFactory.create(
            project=project, start_date="2026-01-01", target_date="2026-01-02"
        )
        b = IssueFactory.create(
            project=project, start_date="2026-01-03", target_date="2026-01-04"
        )
        c = IssueFactory.create(
            project=project, start_date="2026-01-05", target_date="2026-01-06"
        )
        # b blocked_by a; c blocked_by b
        IssueRelationFactory.create(project=project, issue=b, related_issue=a)
        IssueRelationFactory.create(project=project, issue=c, related_issue=b)

        response = _post_propagate(
            session_client,
            workspace.slug,
            project.id,
            work_item_id=str(a.id),
            original_start_date="2026-01-01",
            original_target_date="2026-01-02",
            expected_updated_at=a.updated_at.isoformat(),
            requested_start_date="2026-01-10",
            requested_target_date="2026-01-11",
            client_preview_count=3,
        )

        assert response.status_code == status.HTTP_200_OK, response.content
        body = response.json()
        assert body["total_updated_count"] == 3
        assert body["client_preview_count"] == 3
        assert len(body["work_items"]) == 3

    def test_success_payload_uses_single_now_for_updated_at(
        self, session_client, workspace, create_user
    ):
        """All ``updated_at`` values across ``work_items`` are equal
        (single captured ``now``; CONTEXT D-05a / D-05f).
        """
        project = _build_member_project(workspace, create_user)
        a = IssueFactory.create(
            project=project, start_date="2026-01-01", target_date="2026-01-02"
        )
        b = IssueFactory.create(
            project=project, start_date="2026-01-03", target_date="2026-01-04"
        )
        c = IssueFactory.create(
            project=project, start_date="2026-01-05", target_date="2026-01-06"
        )
        IssueRelationFactory.create(project=project, issue=b, related_issue=a)
        IssueRelationFactory.create(project=project, issue=c, related_issue=b)

        response = _post_propagate(
            session_client,
            workspace.slug,
            project.id,
            work_item_id=str(a.id),
            original_start_date="2026-01-01",
            original_target_date="2026-01-02",
            expected_updated_at=a.updated_at.isoformat(),
            requested_start_date="2026-01-10",
            requested_target_date="2026-01-11",
        )

        assert response.status_code == status.HTTP_200_OK, response.content
        body = response.json()
        timestamps = {item["updated_at"] for item in body["work_items"]}
        assert len(timestamps) == 1, (
            f"Expected single shared updated_at across all work_items; "
            f"got distinct values: {timestamps}"
        )

    # --- Domain failure envelopes (5 codes × 422; +1 stale × 409) --------

    def test_dependency_cycle_returns_422_envelope(
        self, session_client, workspace, create_user
    ):
        """Graph cycle → 422 ``DEPENDENCY_CYCLE`` + no DB writes."""
        project = _build_member_project(workspace, create_user)
        a = IssueFactory.create(
            project=project, start_date="2026-01-01", target_date="2026-01-02"
        )
        b = IssueFactory.create(
            project=project, start_date="2026-01-03", target_date="2026-01-04"
        )
        # cycle: b blocked_by a; a blocked_by b
        IssueRelationFactory.create(project=project, issue=b, related_issue=a)
        IssueRelationFactory.create(project=project, issue=a, related_issue=b)
        snapshot = _snapshot([a.id, b.id])

        response = _post_propagate(
            session_client,
            workspace.slug,
            project.id,
            work_item_id=str(a.id),
            original_start_date="2026-01-01",
            original_target_date="2026-01-02",
            expected_updated_at=a.updated_at.isoformat(),
            requested_start_date="2026-01-10",
            requested_target_date="2026-01-11",
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        body = response.json()
        assert body["code"] == PropagationErrorCode.DEPENDENCY_CYCLE.value
        assert isinstance(body["message"], str) and body["message"]
        _assert_no_db_writes(snapshot)

    def test_cross_project_path_returns_422_envelope(
        self, session_client, workspace, create_user
    ):
        """Cross-project edge from active project → 422
        ``PROJECT_BOUNDARY_EXCEEDED`` + no DB writes (TEST-10).
        """
        project_a = _build_member_project(workspace, create_user)
        project_b = _unique_project(workspace, create_user, label="X")
        a = IssueFactory.create(
            project=project_a, start_date="2026-01-01", target_date="2026-01-02"
        )
        b = IssueFactory.create(
            project=project_b, start_date="2026-01-03", target_date="2026-01-04"
        )
        # b is in project_b, but the relation row is registered to project_a
        # (same shape Phase 1 D-03 detects via the related_project_id annotation).
        # b blocked_by a; relation owned by project_a.
        IssueRelation.objects.create(
            id=uuid4(),
            project=project_a,
            workspace=workspace,
            issue=b,
            related_issue=a,
            relation_type="blocked_by",
            created_by=create_user,
            updated_by=create_user,
        )
        snapshot = _snapshot([a.id, b.id])

        response = _post_propagate(
            session_client,
            workspace.slug,
            project_a.id,
            work_item_id=str(a.id),
            original_start_date="2026-01-01",
            original_target_date="2026-01-02",
            expected_updated_at=a.updated_at.isoformat(),
            requested_start_date="2026-01-10",
            requested_target_date="2026-01-11",
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        body = response.json()
        assert body["code"] == PropagationErrorCode.PROJECT_BOUNDARY_EXCEEDED.value
        _assert_no_db_writes(snapshot)

    def test_cross_project_path_owned_by_other_endpoint_returns_422_envelope(
        self, session_client, workspace, create_user
    ):
        """Cross-project edge whose relation row is owned by the foreign
        endpoint's project is still part of the active project's graph.
        """
        project_a = _build_member_project(workspace, create_user)
        project_b = _unique_project(workspace, create_user, label="Y")
        a = IssueFactory.create(
            project=project_a, start_date="2026-01-01", target_date="2026-01-02"
        )
        b = IssueFactory.create(
            project=project_b, start_date="2026-01-03", target_date="2026-01-04"
        )
        # b blocked_by a; relation row owned by project_b because it was
        # created from the B side.
        IssueRelation.objects.create(
            id=uuid4(),
            project=project_b,
            workspace=workspace,
            issue=b,
            related_issue=a,
            relation_type="blocked_by",
            created_by=create_user,
            updated_by=create_user,
        )
        snapshot = _snapshot([a.id, b.id])

        response = _post_propagate(
            session_client,
            workspace.slug,
            project_a.id,
            work_item_id=str(a.id),
            original_start_date="2026-01-01",
            original_target_date="2026-01-02",
            expected_updated_at=a.updated_at.isoformat(),
            requested_start_date="2026-01-10",
            requested_target_date="2026-01-11",
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        body = response.json()
        assert body["code"] == PropagationErrorCode.PROJECT_BOUNDARY_EXCEEDED.value
        _assert_no_db_writes(snapshot)

    def test_incomplete_schedule_descendant_returns_422_envelope(
        self, session_client, workspace, create_user
    ):
        """Successor with ``target_date=None`` → 422 ``INCOMPLETE_SCHEDULE``
        + no DB writes.
        """
        project = _build_member_project(workspace, create_user)
        a = IssueFactory.create(
            project=project, start_date="2026-01-01", target_date="2026-01-02"
        )
        # b has NO dates — INCOMPLETE_SCHEDULE on visit during forward walk.
        b = IssueFactory.create(project=project)
        IssueRelationFactory.create(project=project, issue=b, related_issue=a)
        snapshot = _snapshot([a.id, b.id])

        response = _post_propagate(
            session_client,
            workspace.slug,
            project.id,
            work_item_id=str(a.id),
            original_start_date="2026-01-01",
            original_target_date="2026-01-02",
            expected_updated_at=a.updated_at.isoformat(),
            requested_start_date="2026-01-10",
            requested_target_date="2026-01-11",
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        body = response.json()
        assert body["code"] == PropagationErrorCode.INCOMPLETE_SCHEDULE.value
        _assert_no_db_writes(snapshot)

    def test_propagation_limit_at_101_returns_422_envelope(
        self, session_client, workspace, create_user
    ):
        """Tight chain of 101 affected items → 422
        ``PROPAGATION_LIMIT_EXCEEDED`` + no DB writes (TEST-12 endpoint-level).

        The algorithm's ``LIMIT = 100`` (services/timeline_propagation/
        propagation.py:64) is the dragged-included cap. A chain of length 101
        with all dates equal forces every node to shift, exceeding the cap.
        """
        project = _build_member_project(workspace, create_user)
        # Create 101 issues all on the same date, chained tightly so a 1-day
        # rightward drag of the head propagates through every node.
        issues = [
            IssueFactory.create(
                project=project,
                start_date="2026-01-01",
                target_date="2026-01-01",
            )
            for _ in range(101)
        ]
        # Chain: issues[i] blocked_by issues[i-1]
        for i in range(1, 101):
            IssueRelationFactory.create(
                project=project, issue=issues[i], related_issue=issues[i - 1]
            )
        head = issues[0]
        snapshot = _snapshot([i.id for i in issues])

        response = _post_propagate(
            session_client,
            workspace.slug,
            project.id,
            work_item_id=str(head.id),
            original_start_date="2026-01-01",
            original_target_date="2026-01-01",
            expected_updated_at=head.updated_at.isoformat(),
            requested_start_date="2026-01-02",
            requested_target_date="2026-01-02",
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        body = response.json()
        assert body["code"] == PropagationErrorCode.PROPAGATION_LIMIT_EXCEEDED.value
        _assert_no_db_writes(snapshot)

    def test_invalid_date_range_returns_422_envelope(
        self, session_client, workspace, create_user
    ):
        """``requested_target_date < requested_start_date`` → 422
        ``INVALID_DATE_RANGE`` + no DB writes (Phase 2 D-06 step 1).
        """
        project = _build_member_project(workspace, create_user)
        a = IssueFactory.create(
            project=project, start_date="2026-01-01", target_date="2026-01-02"
        )
        snapshot = _snapshot([a.id])

        response = _post_propagate(
            session_client,
            workspace.slug,
            project.id,
            work_item_id=str(a.id),
            original_start_date="2026-01-01",
            original_target_date="2026-01-02",
            expected_updated_at=a.updated_at.isoformat(),
            requested_start_date="2026-01-15",
            requested_target_date="2026-01-10",  # target < start
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        body = response.json()
        assert body["code"] == PropagationErrorCode.INVALID_DATE_RANGE.value
        _assert_no_db_writes(snapshot)

    def test_stale_updated_at_with_current_schedule_succeeds(
        self, session_client, workspace, create_user
    ):
        """``expected_updated_at`` older than dragged Issue's current value
        does not fail when the drag-start date range still matches the DB.
        """
        project = _build_member_project(workspace, create_user)
        a = IssueFactory.create(
            project=project, start_date="2026-01-01", target_date="2026-01-02"
        )
        stale = (a.updated_at - timedelta(hours=1)).isoformat()

        response = _post_propagate(
            session_client,
            workspace.slug,
            project.id,
            work_item_id=str(a.id),
            original_start_date="2026-01-01",
            original_target_date="2026-01-02",
            expected_updated_at=stale,
            requested_start_date="2026-01-10",
            requested_target_date="2026-01-11",
        )

        assert response.status_code == status.HTTP_200_OK

    def test_stale_schedule_returns_409_envelope(
        self, session_client, workspace, create_user
    ):
        """Drag-start date range older than dragged Issue's current schedule
        → 409 ``SCHEDULE_CHANGED`` + no DB writes (TEST-13).
        """
        project = _build_member_project(workspace, create_user)
        a = IssueFactory.create(
            project=project, start_date="2026-01-01", target_date="2026-01-02"
        )
        snapshot = _snapshot([a.id])

        # 1 hour in the past plus a stale original range — algorithm's D-08
        # dragged-only schedule check rejects the mismatch.
        stale = (a.updated_at - timedelta(hours=1)).isoformat()

        response = _post_propagate(
            session_client,
            workspace.slug,
            project.id,
            work_item_id=str(a.id),
            original_start_date="2025-12-29",
            original_target_date="2025-12-30",
            expected_updated_at=stale,
            requested_start_date="2026-01-10",
            requested_target_date="2026-01-11",
        )

        assert response.status_code == status.HTTP_409_CONFLICT
        body = response.json()
        assert body["code"] == PropagationErrorCode.SCHEDULE_CHANGED.value
        _assert_no_db_writes(snapshot)

    def test_stale_schedule_with_same_updated_at_returns_409_envelope(
        self, session_client, workspace, create_user
    ):
        """/issue-dates/ can change dates without advancing updated_at; date
        mismatch alone must reject propagation.
        """
        project = _build_member_project(workspace, create_user)
        a = IssueFactory.create(
            project=project, start_date="2026-01-01", target_date="2026-01-02"
        )
        snapshot = _snapshot([a.id])

        response = _post_propagate(
            session_client,
            workspace.slug,
            project.id,
            work_item_id=str(a.id),
            original_start_date="2025-12-29",
            original_target_date="2025-12-30",
            expected_updated_at=a.updated_at.isoformat(),
            requested_start_date="2026-01-10",
            requested_target_date="2026-01-11",
        )

        assert response.status_code == status.HTTP_409_CONFLICT
        body = response.json()
        assert body["code"] == PropagationErrorCode.SCHEDULE_CHANGED.value
        _assert_no_db_writes(snapshot)


# ---------------------------------------------------------------------------
# Plan 03-03 — transaction.on_commit registration of issue_activity.delay +
# model_activity.delay. Pins:
#   - count: 2 issue_activity events per moved issue (start_date + target_date
#     as separate events) and 1 model_activity event per moved issue.
#   - timing: registrations only — when on_commit swallows them, .delay never
#     fires (RESEARCH Pitfall 7 regression guard).
#   - failure path: domain failure (cycle) returns BEFORE on_commit registration
#     block; even with on_commit firing immediately, .delay stays at 0.
#   - Pitfall 4: per-iteration default-arg capture proves distinct issue_id /
#     model_id values across the patched .delay call_args_list.
#   - Pitfall 9: pytest.mark.django_db rolls back rather than commits, so we
#     patch the LOCAL ``plane.app.views.issue.timeline_propagation.transaction.on_commit``
#     binding with side_effect=lambda fn: fn() to make registrations execute.
# ---------------------------------------------------------------------------


class TestTimelinePropagationActivityFanOut:
    """Plan 03-03: transaction.on_commit fan-out for audit + webhook tasks."""

    def test_activity_tasks_register_per_updated_issue(
        self, mocker, session_client, workspace, create_user
    ):
        """Chain A→B→C; all three move both fields → 6 issue_activity + 3
        model_activity registrations; distinct issue_ids prove Pitfall 4 capture.
        """
        on_commit_spy = mocker.patch(
            "plane.app.views.issue.timeline_propagation.transaction.on_commit",
            side_effect=lambda fn: fn(),
        )
        issue_activity_spy = mocker.patch(
            "plane.app.views.issue.timeline_propagation.issue_activity.delay"
        )
        model_activity_spy = mocker.patch(
            "plane.app.views.issue.timeline_propagation.model_activity.delay"
        )

        project = _build_member_project(workspace, create_user)
        a = IssueFactory.create(
            project=project, start_date="2026-01-01", target_date="2026-01-02"
        )
        b = IssueFactory.create(
            project=project, start_date="2026-01-03", target_date="2026-01-04"
        )
        c = IssueFactory.create(
            project=project, start_date="2026-01-05", target_date="2026-01-06"
        )
        # b blocked_by a; c blocked_by b — chain.
        IssueRelationFactory.create(project=project, issue=b, related_issue=a)
        IssueRelationFactory.create(project=project, issue=c, related_issue=b)

        response = _post_propagate(
            session_client,
            workspace.slug,
            project.id,
            work_item_id=str(a.id),
            original_start_date="2026-01-01",
            original_target_date="2026-01-02",
            expected_updated_at=a.updated_at.isoformat(),
            requested_start_date="2026-01-10",
            requested_target_date="2026-01-11",
        )

        assert response.status_code == status.HTTP_200_OK, response.content
        # 3 issues × 2 events each (start_date + target_date) = 6 issue_activity
        # events. Each one wrapped in its own transaction.on_commit.
        assert issue_activity_spy.call_count == 6
        # 3 issues × 1 model_activity event each = 3.
        assert model_activity_spy.call_count == 3
        # Pitfall 4 regression: each issue_activity invocation references a
        # DISTINCT issue_id (proves default-arg ``inst=inst`` capture worked;
        # without it every callback would carry the LAST loop iteration's id).
        seen_issue_ids = {
            call.kwargs["issue_id"] for call in issue_activity_spy.call_args_list
        }
        assert len(seen_issue_ids) == 3, (
            f"Expected 3 distinct issue_ids across issue_activity registrations "
            f"(Pitfall 4 default-arg capture); got {seen_issue_ids}"
        )
        # Same for model_activity model_id.
        seen_model_ids = {
            call.kwargs["model_id"] for call in model_activity_spy.call_args_list
        }
        assert len(seen_model_ids) == 3, (
            f"Expected 3 distinct model_ids across model_activity registrations; "
            f"got {seen_model_ids}"
        )
        # 6 issue_activity + 3 model_activity = 9 on_commit registrations.
        assert on_commit_spy.call_count == 9

    def test_activity_tasks_only_fire_on_commit(
        self, mocker, session_client, workspace, create_user
    ):
        """Patch on_commit to SWALLOW its callback (simulates rollback). Even
        on the success HTTP 200 path, .delay must NOT have run synchronously.

        Pitfall 7 regression guard: the existing IssueBulkUpdateDateEndpoint
        invokes .delay(...) BEFORE bulk_update — a latent audit-leak bug we
        deliberately do NOT replicate. This test pins that the new view
        registers callbacks rather than calling .delay synchronously.
        """
        on_commit_swallow = mocker.patch(
            "plane.app.views.issue.timeline_propagation.transaction.on_commit",
            side_effect=lambda fn: None,
        )
        issue_activity_spy = mocker.patch(
            "plane.app.views.issue.timeline_propagation.issue_activity.delay"
        )
        model_activity_spy = mocker.patch(
            "plane.app.views.issue.timeline_propagation.model_activity.delay"
        )

        project = _build_member_project(workspace, create_user)
        a = IssueFactory.create(
            project=project, start_date="2026-01-01", target_date="2026-01-02"
        )

        response = _post_propagate(
            session_client,
            workspace.slug,
            project.id,
            work_item_id=str(a.id),
            original_start_date="2026-01-01",
            original_target_date="2026-01-02",
            expected_updated_at=a.updated_at.isoformat(),
            requested_start_date="2026-01-10",
            requested_target_date="2026-01-11",
        )

        assert response.status_code == status.HTTP_200_OK, response.content
        # Registrations were made (at least 1 issue_activity + 1 model_activity
        # for the dragged issue) but on_commit swallowed every callable; .delay
        # never ran.
        assert on_commit_swallow.call_count >= 2
        assert issue_activity_spy.call_count == 0, (
            "issue_activity.delay was invoked synchronously — view must wrap "
            "every .delay in transaction.on_commit (Pitfall 7 regression)."
        )
        assert model_activity_spy.call_count == 0, (
            "model_activity.delay was invoked synchronously — view must wrap "
            "every .delay in transaction.on_commit (Pitfall 7 regression)."
        )

    def test_activity_tasks_not_invoked_on_failure(
        self, mocker, session_client, workspace, create_user
    ):
        """Even with on_commit firing immediately, a domain failure (cycle)
        returns BEFORE the registration block. .delay must stay at 0 — proves
        the registrations sit AFTER the ``if result.failure is not None: ...``
        early return.
        """
        mocker.patch(
            "plane.app.views.issue.timeline_propagation.transaction.on_commit",
            side_effect=lambda fn: fn(),
        )
        issue_activity_spy = mocker.patch(
            "plane.app.views.issue.timeline_propagation.issue_activity.delay"
        )
        model_activity_spy = mocker.patch(
            "plane.app.views.issue.timeline_propagation.model_activity.delay"
        )

        project = _build_member_project(workspace, create_user)
        a = IssueFactory.create(
            project=project, start_date="2026-01-01", target_date="2026-01-02"
        )
        b = IssueFactory.create(
            project=project, start_date="2026-01-03", target_date="2026-01-04"
        )
        # cycle: b blocked_by a; a blocked_by b
        IssueRelationFactory.create(project=project, issue=b, related_issue=a)
        IssueRelationFactory.create(project=project, issue=a, related_issue=b)

        response = _post_propagate(
            session_client,
            workspace.slug,
            project.id,
            work_item_id=str(a.id),
            original_start_date="2026-01-01",
            original_target_date="2026-01-02",
            expected_updated_at=a.updated_at.isoformat(),
            requested_start_date="2026-01-10",
            requested_target_date="2026-01-11",
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        body = response.json()
        assert body["code"] == PropagationErrorCode.DEPENDENCY_CYCLE.value
        assert issue_activity_spy.call_count == 0
        assert model_activity_spy.call_count == 0
