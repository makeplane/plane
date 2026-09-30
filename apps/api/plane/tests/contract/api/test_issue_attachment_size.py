# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""POST /api/v1/.../issues/{issue_id}/issue-attachments/ with ``size`` as a string.

``size`` was passed straight to ``min(size, FILE_SIZE_LIMIT)``, so a numeric
string like ``"53314"`` raised ``TypeError`` (HTTP 500). Non-positive sizes and
non-finite numbers (``1e400``) must be 400, not a signed upload with a bad range.
"""

from unittest import mock

import pytest
from rest_framework import status

from plane.db.models import FileAsset, Issue, Project, ProjectMember, State


@pytest.fixture
def issue(db, workspace, create_user):
    project = Project.objects.create(name="P", identifier="P", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    state = State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)
    return Issue.objects.create(name="I", workspace=workspace, project=project, state=state, created_by=create_user)


def url(workspace, issue):
    return f"/api/v1/workspaces/{workspace.slug}/projects/{issue.project_id}/issues/{issue.id}/issue-attachments/"


@pytest.mark.contract
@pytest.mark.django_db
@mock.patch("plane.api.views.issue.S3Storage")
def test_string_size_is_accepted(s3, api_key_client, workspace, issue):
    s3.return_value.generate_presigned_post.return_value = {}

    response = api_key_client.post(
        url(workspace, issue), {"name": "a.png", "type": "image/png", "size": "53314"}, format="json"
    )

    assert response.status_code == status.HTTP_200_OK
    assert FileAsset.objects.get(id=response.data["asset_id"]).size == 53314


@pytest.mark.contract
@pytest.mark.django_db
def test_non_numeric_size_is_400(api_key_client, workspace, issue):
    response = api_key_client.post(
        url(workspace, issue), {"name": "a.png", "type": "image/png", "size": "big"}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("size", ["-1", -1])
def test_non_positive_size_is_400(api_key_client, workspace, issue, size):
    response = api_key_client.post(
        url(workspace, issue), {"name": "a.png", "type": "image/png", "size": size}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
@pytest.mark.django_db
def test_overflow_size_is_400(api_key_client, workspace, issue):
    # JSON 1e400 is parsed as inf; int(inf) raises OverflowError.
    response = api_key_client.post(
        url(workspace, issue),
        data='{"name": "a.png", "type": "image/png", "size": 1e400}',
        content_type="application/json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
