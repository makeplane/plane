# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Bindings service tests — §25 Phase 3 lazy binding."""

# Third Party imports
import pytest

# Module imports
from plane.db.models import IssueWorkflowBinding
from plane.services.workflow import bindings


@pytest.mark.unit
@pytest.mark.django_db
class TestWorkflowBindings:
    def test_bind_on_creation_when_enforcement_off(
        self,
        workflow_issue,
        settings,
    ):
        settings.ENABLE_WORKFLOWS = False
        result = bindings.bind_on_creation(
            issue=workflow_issue,
            actor_id=str(workflow_issue.created_by_id),
        )
        assert result is None
        assert not IssueWorkflowBinding.objects.filter(
            issue=workflow_issue
        ).exists()

    def test_bind_on_creation_creates_binding(
        self,
        workflow_issue,
        default_workflow,
        default_revision,
        enable_instance_flag,
    ):
        result = bindings.bind_on_creation(
            issue=workflow_issue,
            actor_id=str(workflow_issue.created_by_id),
        )
        assert result is not None
        assert result.workflow_id == default_workflow.id
        assert result.workflow_revision_id == default_revision.id

    def test_ensure_binding_is_idempotent(
        self,
        workflow_issue,
        default_workflow,
        default_revision,
        enable_instance_flag,
    ):
        first = bindings.ensure_binding(
            issue=workflow_issue,
            actor_id=str(workflow_issue.created_by_id),
        )
        second = bindings.ensure_binding(
            issue=workflow_issue,
            actor_id=str(workflow_issue.created_by_id),
        )
        assert first is not None
        assert first.id == second.id
