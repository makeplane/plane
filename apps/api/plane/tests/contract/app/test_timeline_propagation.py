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
