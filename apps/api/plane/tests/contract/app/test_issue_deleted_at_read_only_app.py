# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""``deleted_at`` is read-only on ``IssueViewSet.partial_update``; removal goes through destroy."""

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Issue, Project, ProjectMember, WorkspaceMember
from plane.tests.factories import UserFactory


@pytest.mark.contract
@pytest.mark.django_db
def test_partial_update_does_not_set_deleted_at(workspace, create_user):
    member = UserFactory()
    WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)
    project = Project.objects.create(name="P", identifier="P", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    ProjectMember.objects.create(project=project, member=member, workspace=workspace, role=15)
    issue = Issue(name="I", workspace=workspace, project=project)
    issue.save(created_by_id=create_user.id)
    client = APIClient()
    client.force_authenticate(user=member)

    response = client.patch(
        f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue.id}/",
        {"name": "Renamed", "deleted_at": "2020-01-01T00:00:00Z"},
        format="json",
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT, response.data
    issue = Issue.all_objects.get(pk=issue.id)
    assert issue.deleted_at is None
    assert issue.name == "Renamed"
