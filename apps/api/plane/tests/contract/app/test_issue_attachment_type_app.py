# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""The presigned work item attachment route rejects a type outside ``ATTACHMENT_MIME_TYPES``
with a message the web app shows as is, so it has to say what can be attached."""

import pytest
from rest_framework import status

from plane.db.models import FileAsset, Issue, Project, ProjectMember


@pytest.fixture
def url(workspace, create_user):
    project = Project.objects.create(name="Uploads", identifier="UP", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    issue = Issue.objects.create(name="issue", project=project, workspace=workspace)
    return f"/api/assets/v2/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/attachments/"


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("content_type", ["text/html", ""])
def test_unsupported_type_is_rejected_with_the_supported_kinds(session_client, url, content_type):
    resp = session_client.post(url, {"name": "page.html", "type": content_type, "size": 10}, format="json")

    assert resp.status_code == status.HTTP_400_BAD_REQUEST, resp.content
    assert resp.data["error"].startswith("This file type isn't supported. You can attach images, documents")
    assert not FileAsset.objects.exists()
