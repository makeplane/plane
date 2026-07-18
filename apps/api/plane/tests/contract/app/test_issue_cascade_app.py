# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Opt-in gate for the parent->child close cascade.

IssueViewSet.partial_update should only enqueue cascade_state_to_sub_issues when
the parent enters a completed/cancelled group AND the project has
``cascade_state_on_close`` enabled.
"""

from unittest.mock import patch

import pytest
from rest_framework import status

from plane.db.models import Issue, Project, ProjectMember, State


def _project(workspace, user, *, cascade):
    project = Project.objects.create(
        name=f"Cascade {'On' if cascade else 'Off'}",
        identifier="CON" if cascade else "COF",
        workspace=workspace,
        created_by=user,
        cascade_state_on_close=cascade,
    )
    ProjectMember.objects.create(project=project, member=user, role=20, is_active=True)
    return project


def _states(project, workspace):
    started = State.objects.create(name="In Progress", project=project, workspace=workspace, group="started")
    completed = State.objects.create(name="Done", project=project, workspace=workspace, group="completed")
    return started, completed


def _issue(name, workspace, project, state, user, parent=None):
    return Issue.objects.create(
        name=name, workspace=workspace, project=project, state=state, parent=parent, created_by=user
    )


def _url(slug, project_id, issue_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/"


@pytest.mark.contract
class TestCascadeOptInGate:
    @pytest.mark.django_db
    @patch("plane.app.views.issue.base.cascade_state_to_sub_issues")
    @patch("plane.app.views.issue.base.issue_description_version_task")
    @patch("plane.app.views.issue.base.model_activity")
    @patch("plane.app.views.issue.base.issue_activity")
    def test_enqueues_when_option_enabled(
        self,
        mock_issue_activity,
        mock_model_activity,
        mock_desc_version,
        mock_cascade,
        session_client,
        workspace,
        create_user,
    ):
        project = _project(workspace, create_user, cascade=True)
        started, completed = _states(project, workspace)
        parent = _issue("Parent", workspace, project, started, create_user)
        _issue("Child", workspace, project, started, create_user, parent=parent)

        response = session_client.patch(
            _url(workspace.slug, project.id, parent.id),
            {"state_id": str(completed.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT, f"Got {response.status_code}: {response.data!r}"
        mock_cascade.delay.assert_called_once()
        kwargs = mock_cascade.delay.call_args.kwargs
        assert kwargs["parent_issue_id"] == str(parent.id)
        assert kwargs["new_state_id"] == str(completed.id)
        assert kwargs["project_id"] == str(project.id)

    @pytest.mark.django_db
    @patch("plane.app.views.issue.base.cascade_state_to_sub_issues")
    @patch("plane.app.views.issue.base.issue_description_version_task")
    @patch("plane.app.views.issue.base.model_activity")
    @patch("plane.app.views.issue.base.issue_activity")
    def test_no_enqueue_when_option_disabled(
        self,
        mock_issue_activity,
        mock_model_activity,
        mock_desc_version,
        mock_cascade,
        session_client,
        workspace,
        create_user,
    ):
        project = _project(workspace, create_user, cascade=False)
        started, completed = _states(project, workspace)
        parent = _issue("Parent", workspace, project, started, create_user)
        _issue("Child", workspace, project, started, create_user, parent=parent)

        response = session_client.patch(
            _url(workspace.slug, project.id, parent.id),
            {"state_id": str(completed.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT, f"Got {response.status_code}: {response.data!r}"
        mock_cascade.delay.assert_not_called()
