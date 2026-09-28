# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression tests for the ``avatar_url`` annotation used by the assignee
distribution / analytics querysets.

Those querysets build the avatar URL with
``Concat(Value("/api/assets/v2/static/"), <user>__avatar_asset, Value("/"))``.
On Django 5.x ``ConcatPair.as_postgresql`` resolves the output field of each
argument, so concatenating a ``CharField`` with the raw ``UUIDField`` column
raises ``FieldError: Expression contains mixed types``. Every endpoint below
returned a 500 until the UUID column was explicitly cast to text.
"""

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import (
    Cycle,
    CycleIssue,
    FileAsset,
    Issue,
    IssueAssignee,
    Module,
    ModuleIssue,
    Project,
    ProjectMember,
    State,
)


@pytest.fixture
def user_with_avatar_asset(db, workspace, create_user):
    """A user whose avatar comes from a FileAsset, i.e. the branch of the
    ``Case`` expression that concatenates the asset UUID into a URL."""
    asset = FileAsset.objects.create(
        workspace=workspace,
        asset=f"{workspace.id}/avatar.png",
        size=1024,
        entity_type=FileAsset.EntityTypeContext.USER_AVATAR,
        user=create_user,
        is_uploaded=True,
    )
    create_user.avatar_asset = asset
    create_user.save()
    return create_user


@pytest.fixture
def project(db, workspace, user_with_avatar_asset):
    project = Project.objects.create(
        name="Avatar URL Project",
        identifier="AVU",
        workspace=workspace,
        created_by=user_with_avatar_asset,
        module_view=True,
        cycle_view=True,
    )
    ProjectMember.objects.create(
        workspace=workspace,
        project=project,
        member=user_with_avatar_asset,
        role=20,
        is_active=True,
    )
    return project


@pytest.fixture
def assigned_issue(db, project, user_with_avatar_asset):
    """A work item assigned to the avatar-bearing user, so the distribution
    querysets have at least one row to annotate."""
    state = State.objects.create(name="Todo", group="unstarted", project=project, workspace=project.workspace)
    issue = Issue.objects.create(
        name="Avatar URL Issue",
        project=project,
        workspace=project.workspace,
        state=state,
        created_by=user_with_avatar_asset,
    )
    IssueAssignee.objects.create(
        issue=issue,
        assignee=user_with_avatar_asset,
        project=project,
        workspace=project.workspace,
    )
    return issue


@pytest.fixture
def module(db, project, assigned_issue):
    module = Module.objects.create(name="Avatar URL Module", project=project, workspace=project.workspace)
    ModuleIssue.objects.create(issue=assigned_issue, module=module, project=project, workspace=project.workspace)
    return module


@pytest.fixture
def archived_module(db, project, assigned_issue):
    module = Module.objects.create(
        name="Archived Avatar URL Module",
        project=project,
        workspace=project.workspace,
        archived_at=timezone.now(),
    )
    ModuleIssue.objects.create(issue=assigned_issue, module=module, project=project, workspace=project.workspace)
    return module


@pytest.fixture
def cycle(db, project, assigned_issue, user_with_avatar_asset):
    cycle = Cycle.objects.create(
        name="Avatar URL Cycle",
        project=project,
        workspace=project.workspace,
        owned_by=user_with_avatar_asset,
        start_date=timezone.now(),
        end_date=timezone.now() + timezone.timedelta(days=7),
    )
    CycleIssue.objects.create(issue=assigned_issue, cycle=cycle, project=project, workspace=project.workspace)
    return cycle


@pytest.fixture
def archived_cycle(db, project, user_with_avatar_asset):
    return Cycle.objects.create(
        name="Archived Avatar URL Cycle",
        project=project,
        workspace=project.workspace,
        owned_by=user_with_avatar_asset,
        archived_at=timezone.now(),
    )


@pytest.mark.contract
class TestAvatarUrlAnnotation:
    @pytest.mark.django_db
    def test_module_retrieve_builds_avatar_url_from_asset(
        self, session_client, workspace, project, module, user_with_avatar_asset
    ):
        response = session_client.get(f"/api/workspaces/{workspace.slug}/projects/{project.id}/modules/{module.id}/")
        assert response.status_code == status.HTTP_200_OK

        assignees = list(response.data["distribution"]["assignees"])
        assert [a["avatar_url"] for a in assignees] == [
            f"/api/assets/v2/static/{user_with_avatar_asset.avatar_asset_id}/"
        ]

    @pytest.mark.django_db
    def test_archived_module_retrieve(self, session_client, workspace, project, archived_module):
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/archived-modules/{archived_module.id}/"
        )
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_archived_cycle_retrieve(self, session_client, workspace, project, archived_cycle):
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/archived-cycles/{archived_cycle.id}/"
        )
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_cycle_analytics(self, session_client, workspace, project, cycle):
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/cycles/{cycle.id}/analytics/?type=issues"
        )
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_workspace_analytics(self, session_client, workspace, project, assigned_issue):
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/analytics/?x_axis=assignees__id&y_axis=issue_count"
        )
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_default_analytics(self, session_client, workspace, project, assigned_issue):
        response = session_client.get(f"/api/workspaces/{workspace.slug}/default-analytics/")
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_project_advance_analytics_stats(self, session_client, workspace, project, assigned_issue):
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/advance-analytics-stats/?type=work-items"
        )
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_entity_search_user_mention(self, session_client, workspace, project):
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/entity-search/"
            f"?query_type=user_mention&query=Test&project_id={project.id}"
        )
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_cycle_transfer_issues(self, session_client, workspace, project, cycle, user_with_avatar_asset):
        new_cycle = Cycle.objects.create(
            name="Transfer Target Cycle",
            project=project,
            workspace=project.workspace,
            owned_by=user_with_avatar_asset,
            start_date=timezone.now() + timezone.timedelta(days=8),
            end_date=timezone.now() + timezone.timedelta(days=14),
        )
        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/cycles/{cycle.id}/transfer-issues/",
            {"new_cycle_id": str(new_cycle.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
