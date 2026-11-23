# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""``deleted_at``, ``archived_at``, ``sequence_id`` and ``is_draft`` are read-only on work item PATCH.

Delete, archive and unarchive go through their dedicated endpoints."""

import json
from unittest import mock

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.api.serializers import IssueSerializer
from plane.db.models import APIToken, Issue, Project, ProjectMember, WorkspaceMember
from plane.tests.factories import UserFactory


READ_ONLY_FIELDS = [
    ("deleted_at", "2020-01-01T00:00:00Z"),
    ("archived_at", "2020-01-01"),
    ("sequence_id", 999),
    ("is_draft", True),
]


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("field, value", READ_ONLY_FIELDS)
def test_patch_does_not_set_read_only_field(workspace, create_user, field, value):
    member = UserFactory()
    WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)
    project = Project.objects.create(name="P", identifier="P", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    ProjectMember.objects.create(project=project, member=member, workspace=workspace, role=15)
    issue = Issue(name="I", workspace=workspace, project=project)
    issue.save(created_by_id=create_user.id)
    original = getattr(issue, field)
    token = APIToken.objects.create(user=member, label="Member Token", token="member-read-only-fields-token")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)

    with (
        mock.patch("plane.api.views.issue.issue_activity") as issue_activity,
        mock.patch("plane.api.views.issue.model_activity") as model_activity,
    ):
        response = client.patch(
            f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-items/{issue.id}/",
            {"name": "Renamed", field: value},
            format="json",
        )

    assert response.status_code == status.HTTP_200_OK, response.data
    issue = Issue.all_objects.get(pk=issue.id)
    assert getattr(issue, field) == original
    assert issue.name == "Renamed"
    # The ignored field is not reported as a change.
    activity_data = json.loads(issue_activity.delay.call_args.kwargs["requested_data"])
    assert field not in activity_data
    assert activity_data["name"] == "Renamed"
    assert field not in model_activity.delay.call_args.kwargs["requested_data"]


@pytest.mark.contract
def test_is_draft_stays_writable_on_create():
    assert not IssueSerializer().fields["is_draft"].read_only
