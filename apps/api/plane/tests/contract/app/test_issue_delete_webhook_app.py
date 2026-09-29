# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest import mock

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Issue, Project, ProjectMember, State


@pytest.mark.contract
class TestIssueDeleteWebhook:
    @pytest.mark.django_db
    def test_app_viewset_delete_dispatches_webhook(self, db, workspace, create_user):
        project = Project.objects.create(
            name="Webhook Project",
            identifier="WHP",
            workspace=workspace,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
        state = State.objects.create(
            name="Todo",
            project=project,
            workspace=workspace,
            group="backlog",
            default=True,
        )
        issue = Issue.objects.create(
            name="Webhook Issue",
            workspace=workspace,
            project=project,
            state=state,
            created_by=create_user,
        )
        client = APIClient()
        client.force_authenticate(user=create_user)
        url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/"

        with mock.patch("plane.app.views.issue.base.webhook_activity") as mocked_webhook:
            response = client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        mocked_webhook.delay.assert_called_once()
        assert mocked_webhook.delay.call_args.kwargs["verb"] == "deleted"
        assert mocked_webhook.delay.call_args.kwargs["event_id"] == issue.id
