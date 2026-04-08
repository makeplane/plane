# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.urls import reverse
from django.utils import timezone

from plane.db.models import Issue, IssueAssignee, ProjectMember, WorkspaceMember
from plane.tests.factories import ProjectFactory, UserFactory, WorkspaceFactory


@pytest.mark.django_db
@pytest.mark.contract
def test_workspace_user_profile_excludes_soft_deleted_assignments_from_project_counts(session_client, create_user):
    workspace = WorkspaceFactory(owner=create_user)
    WorkspaceMember.objects.create(workspace=workspace, member=create_user, role=20)

    profiled_user = UserFactory()
    WorkspaceMember.objects.create(workspace=workspace, member=profiled_user, role=15)

    project = ProjectFactory(
        workspace=workspace,
        created_by=create_user,
        updated_by=create_user,
        identifier="PRJ",
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20)
    ProjectMember.objects.create(project=project, member=profiled_user, role=15)

    active_issue = Issue.objects.create(
        project=project,
        name="Active assignment",
        created_by=create_user,
        updated_by=create_user,
    )
    IssueAssignee.objects.create(
        project=project,
        issue=active_issue,
        assignee=profiled_user,
        created_by=create_user,
        updated_by=create_user,
    )

    for index in range(2):
        stale_issue = Issue.objects.create(
            project=project,
            name=f"Closed assignment {index}",
            completed_at=timezone.now(),
            created_by=create_user,
            updated_by=create_user,
        )
        IssueAssignee.all_objects.create(
            project=project,
            issue=stale_issue,
            assignee=profiled_user,
            deleted_at=timezone.now(),
            created_by=create_user,
            updated_by=create_user,
        )

    url = reverse(
        "workspace-user-profile-page",
        kwargs={"slug": workspace.slug, "user_id": profiled_user.id},
    )

    response = session_client.get(url)

    assert response.status_code == 200
    assert len(response.data["project_data"]) == 1
    assert response.data["project_data"][0]["assigned_issues"] == 1
    assert response.data["project_data"][0]["completed_issues"] == 0
    assert response.data["project_data"][0]["pending_issues"] == 0
