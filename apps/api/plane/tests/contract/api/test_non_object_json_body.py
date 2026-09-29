# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""v1 write endpoints reject a JSON body that is not an object/array.

A body like ``"hello"`` parses to a ``str``; views then called
``request.data.get(...)``/``.pop(...)`` and raised ``AttributeError`` (HTTP 500).
"""

import json

import pytest
from rest_framework import status

from plane.db.models import Issue, Project, ProjectMember, State


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("body", ['"hello"', "42", "true"])
def test_scalar_json_body_is_400(api_key_client, workspace, create_user, body):
    project = Project.objects.create(name="P", identifier="P", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    state = State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)
    issue = Issue.objects.create(name="I", workspace=workspace, project=project, state=state, created_by=create_user)

    response = api_key_client.post(
        f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/comments/",
        data=body,
        content_type="application/json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
@pytest.mark.django_db
def test_object_body_still_works(api_key_client, workspace, create_user):
    project = Project.objects.create(name="P", identifier="P", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    state = State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)
    issue = Issue.objects.create(name="I", workspace=workspace, project=project, state=state, created_by=create_user)

    response = api_key_client.post(
        f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/comments/",
        data=json.dumps({"comment_html": "<p>hi</p>"}),
        content_type="application/json",
    )

    assert response.status_code == status.HTTP_201_CREATED
