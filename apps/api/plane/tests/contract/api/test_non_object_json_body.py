# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""v1 write endpoints reject a JSON body that is not an object or array.

A body like ``"hello"`` parses to a ``str``; views then called
``request.data.get(...)``/``.pop(...)`` and raised ``AttributeError`` (HTTP 500).
"""

import json
import uuid

import pytest
from rest_framework import status

from plane.db.models import Issue, Project, ProjectMember, State

BODY_ERROR = "Request body must be a JSON object or array."


@pytest.fixture
def project_issue(workspace, create_user):
    project = Project.objects.create(name="P", identifier="P", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    state = State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)
    issue = Issue.objects.create(name="I", workspace=workspace, project=project, state=state, created_by=create_user)
    return project, issue


def _write_targets(workspace, project, issue):
    """POST/PUT/PATCH targets on BaseAPIView and BaseViewSet."""
    slug = workspace.slug
    base = f"/api/v1/workspaces/{slug}"
    missing_id = uuid.uuid4()
    return {
        "comment_post": ("post", f"{base}/projects/{project.id}/issues/{issue.id}/comments/"),
        "comment_patch": ("patch", f"{base}/projects/{project.id}/issues/{issue.id}/comments/{missing_id}/"),
        "issue_put": ("put", f"{base}/projects/{project.id}/issues/"),
        "sticky_post": ("post", f"{base}/stickies/"),
        "sticky_patch": ("patch", f"{base}/stickies/{missing_id}/"),
        "sticky_put": ("put", f"{base}/stickies/{missing_id}/"),
    }


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("body", ['"hello"', "42", "true", "null"])
@pytest.mark.parametrize(
    "target",
    ["comment_post", "comment_patch", "issue_put", "sticky_post", "sticky_patch", "sticky_put"],
)
def test_scalar_json_body_is_400(api_key_client, workspace, project_issue, body, target):
    project, issue = project_issue
    method, url = _write_targets(workspace, project, issue)[target]

    response = getattr(api_key_client, method)(url, data=body, content_type="application/json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == BODY_ERROR


@pytest.mark.contract
@pytest.mark.django_db
def test_object_body_still_works(api_key_client, workspace, project_issue):
    project, issue = project_issue

    response = api_key_client.post(
        f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/comments/",
        data=json.dumps({"comment_html": "<p>hi</p>"}),
        content_type="application/json",
    )

    assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.contract
@pytest.mark.django_db
def test_array_body_reaches_the_viewset(api_key_client, workspace):
    """A JSON array is a supported container, so the guard must not reject it."""
    response = api_key_client.post(
        f"/api/v1/workspaces/{workspace.slug}/stickies/",
        data=json.dumps([{"name": "note"}]),
        content_type="application/json",
    )

    assert response.status_code < status.HTTP_500_INTERNAL_SERVER_ERROR
    assert BODY_ERROR not in response.content.decode()
