# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.utils import timezone

from plane.api.serializers.issue import IssueSerializer
from plane.app.serializers.issue import IssueCreateSerializer
from plane.db.models import Project, State


def make_states(project, workspace, create_user):
    backlog_state = State.objects.create(
        name="Backlog",
        color="#000000",
        group="backlog",
        default=True,
        project=project,
        workspace=workspace,
        created_by=create_user,
    )
    completed_state = State.objects.create(
        name="Done",
        color="#000000",
        group="completed",
        project=project,
        workspace=workspace,
        created_by=create_user,
    )
    return backlog_state, completed_state


@pytest.mark.unit
class TestPublicIssueSerializerArchiveValidation:
    """IssueSerializer must reject archived_at unless the work item is completed/cancelled (makeplane/plane#9115)"""

    @pytest.mark.django_db
    def test_create_with_archived_at_and_backlog_state_is_rejected(self, db, workspace, create_user):
        project = Project.objects.create(
            name="Test Project", identifier="TEST", workspace=workspace, created_by=create_user
        )
        backlog_state, _ = make_states(project, workspace, create_user)

        serializer = IssueSerializer(
            data={
                "name": "Test Issue",
                "state": str(backlog_state.id),
                "archived_at": timezone.now().date().isoformat(),
            },
            context={"project_id": project.id, "workspace_id": workspace.id},
        )

        assert not serializer.is_valid()
        assert "archived_at" in serializer.errors

    @pytest.mark.django_db
    def test_create_with_archived_at_and_no_state_is_rejected(self, db, workspace, create_user):
        project = Project.objects.create(
            name="Test Project", identifier="TEST", workspace=workspace, created_by=create_user
        )

        serializer = IssueSerializer(
            data={"name": "Test Issue", "archived_at": timezone.now().date().isoformat()},
            context={"project_id": project.id, "workspace_id": workspace.id},
        )

        assert not serializer.is_valid()
        assert "archived_at" in serializer.errors

    @pytest.mark.django_db
    def test_create_with_archived_at_and_completed_state_is_accepted(self, db, workspace, create_user):
        project = Project.objects.create(
            name="Test Project", identifier="TEST", workspace=workspace, created_by=create_user
        )
        _, completed_state = make_states(project, workspace, create_user)

        serializer = IssueSerializer(
            data={
                "name": "Test Issue",
                "state": str(completed_state.id),
                "archived_at": timezone.now().date().isoformat(),
            },
            context={"project_id": project.id, "workspace_id": workspace.id},
        )

        assert serializer.is_valid(), serializer.errors

    @pytest.mark.django_db
    def test_partial_update_of_backlog_issue_with_archived_at_is_rejected(self, db, workspace, create_user):
        from plane.db.models import Issue

        project = Project.objects.create(
            name="Test Project", identifier="TEST", workspace=workspace, created_by=create_user
        )
        backlog_state, _ = make_states(project, workspace, create_user)
        issue = Issue.objects.create(
            name="Backlog Issue", project=project, workspace=workspace, state=backlog_state, created_by=create_user
        )

        serializer = IssueSerializer(
            issue,
            data={"archived_at": timezone.now().date().isoformat()},
            partial=True,
            context={"project_id": project.id, "workspace_id": workspace.id},
        )

        assert not serializer.is_valid()
        assert "archived_at" in serializer.errors

    @pytest.mark.django_db
    def test_partial_update_of_completed_issue_with_archived_at_is_accepted(self, db, workspace, create_user):
        from plane.db.models import Issue

        project = Project.objects.create(
            name="Test Project", identifier="TEST", workspace=workspace, created_by=create_user
        )
        _, completed_state = make_states(project, workspace, create_user)
        issue = Issue.objects.create(
            name="Completed Issue", project=project, workspace=workspace, state=completed_state, created_by=create_user
        )

        serializer = IssueSerializer(
            issue,
            data={"archived_at": timezone.now().date().isoformat()},
            partial=True,
            context={"project_id": project.id, "workspace_id": workspace.id},
        )

        assert serializer.is_valid(), serializer.errors

    @pytest.mark.django_db
    def test_partial_update_clearing_archived_at_is_always_accepted(self, db, workspace, create_user):
        """Unarchiving (archived_at=null) must not be state-group restricted."""
        from plane.db.models import Issue

        project = Project.objects.create(
            name="Test Project", identifier="TEST", workspace=workspace, created_by=create_user
        )
        backlog_state, _ = make_states(project, workspace, create_user)
        issue = Issue.objects.create(
            name="Backlog Issue", project=project, workspace=workspace, state=backlog_state, created_by=create_user
        )

        serializer = IssueSerializer(
            issue,
            data={"archived_at": None},
            partial=True,
            context={"project_id": project.id, "workspace_id": workspace.id},
        )

        assert serializer.is_valid(), serializer.errors


@pytest.mark.unit
class TestAppIssueCreateSerializerArchiveValidation:
    """IssueCreateSerializer must apply the same archived_at rule as the archive endpoints (makeplane/plane#9115)"""

    @pytest.mark.django_db
    def test_create_with_archived_at_and_backlog_state_is_rejected(self, db, workspace, create_user):
        project = Project.objects.create(
            name="Test Project", identifier="TEST", workspace=workspace, created_by=create_user
        )
        backlog_state, _ = make_states(project, workspace, create_user)

        serializer = IssueCreateSerializer(
            data={
                "name": "Test Issue",
                "state_id": str(backlog_state.id),
                "archived_at": timezone.now().date().isoformat(),
            },
            context={"project_id": project.id},
        )

        assert not serializer.is_valid()
        assert "archived_at" in serializer.errors

    @pytest.mark.django_db
    def test_partial_update_of_backlog_issue_with_archived_at_is_rejected(self, db, workspace, create_user):
        from plane.db.models import Issue

        project = Project.objects.create(
            name="Test Project", identifier="TEST", workspace=workspace, created_by=create_user
        )
        backlog_state, _ = make_states(project, workspace, create_user)
        issue = Issue.objects.create(
            name="Backlog Issue", project=project, workspace=workspace, state=backlog_state, created_by=create_user
        )

        serializer = IssueCreateSerializer(
            issue,
            data={"archived_at": timezone.now().date().isoformat()},
            partial=True,
            context={"project_id": project.id},
        )

        assert not serializer.is_valid()
        assert "archived_at" in serializer.errors

    @pytest.mark.django_db
    def test_partial_update_of_completed_issue_with_archived_at_is_accepted(self, db, workspace, create_user):
        from plane.db.models import Issue

        project = Project.objects.create(
            name="Test Project", identifier="TEST", workspace=workspace, created_by=create_user
        )
        _, completed_state = make_states(project, workspace, create_user)
        issue = Issue.objects.create(
            name="Completed Issue", project=project, workspace=workspace, state=completed_state, created_by=create_user
        )

        serializer = IssueCreateSerializer(
            issue,
            data={"archived_at": timezone.now().date().isoformat()},
            partial=True,
            context={"project_id": project.id},
        )

        assert serializer.is_valid(), serializer.errors
