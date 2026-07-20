# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit tests for the issue activity background task.

Verifies that creating a work item with inline assignees tracks the assignee
activities and auto-subscribes the assignees regardless of whether the payload
uses the web app field name (``assignee_ids``) or the external REST API field
name (``assignees``). With only ``assignee_ids`` accepted, work items created
through the external API with assignees produced no assignee activity and no
subscription, so the assignees were never notified.
"""

import json

import pytest
from django.utils import timezone

from plane.bgtasks.issue_activities_task import create_issue_activity
from plane.db.models import Issue, IssueActivity, IssueSubscriber, User
from plane.tests.factories import ProjectFactory, WorkspaceFactory


@pytest.fixture
def workspace(db):
    return WorkspaceFactory()


@pytest.fixture
def project(db, workspace):
    return ProjectFactory(workspace=workspace)


@pytest.fixture
def assignee(db):
    # Not UserFactory: it leaves username empty, and a second factory user
    # would collide with the unique username constraint.
    user = User.objects.create(
        email="assignee@plane.so",
        username="assignee-user",
        first_name="Assignee",
        last_name="User",
    )
    user.set_password("assignee-password")
    user.save()
    return user


@pytest.fixture
def author(db):
    user = User.objects.create(
        email="author@plane.so",
        username="author-user",
        first_name="Author",
        last_name="User",
    )
    user.set_password("author-password")
    user.save()
    return user


@pytest.fixture
def issue(db, workspace, project, author):
    return Issue.objects.create(
        name="Created via external API",
        project=project,
        workspace=workspace,
        created_by=author,
    )


@pytest.mark.unit
class TestCreateIssueActivityAssignees:
    def _run(self, issue, project, workspace, actor, requested_data):
        # actor is passed explicitly: BaseModel.save() derives created_by from
        # crum's current user, which is None outside a request, so
        # issue.created_by_id cannot be used as the actor here.
        issue_activities = []
        create_issue_activity(
            requested_data=json.dumps(requested_data),
            current_instance=None,
            issue_id=issue.id,
            project_id=project.id,
            workspace_id=workspace.id,
            actor_id=str(actor.id),
            issue_activities=issue_activities,
            epoch=int(timezone.now().timestamp()),
        )
        return issue_activities

    @pytest.mark.django_db
    def test_create_with_assignee_ids_tracks_and_subscribes(self, workspace, project, issue, author, assignee):
        """Web app payload key: assignee activity is collected, assignee subscribed."""
        activities = self._run(issue, project, workspace, author, {"assignee_ids": [str(assignee.id)]})

        assert any(activity.field == "assignees" for activity in activities)
        assert IssueSubscriber.objects.filter(issue_id=issue.id, subscriber_id=assignee.id).exists()

    @pytest.mark.django_db
    def test_create_with_assignees_tracks_and_subscribes(self, workspace, project, issue, author, assignee):
        """External API payload key: must behave exactly like ``assignee_ids``."""
        activities = self._run(issue, project, workspace, author, {"assignees": [str(assignee.id)]})

        assert any(activity.field == "assignees" for activity in activities)
        assert IssueSubscriber.objects.filter(issue_id=issue.id, subscriber_id=assignee.id).exists()

    @pytest.mark.django_db
    def test_create_without_assignees_only_creates_created_activity(self, workspace, project, issue, author):
        """No assignee payload: no assignee activities, no subscriptions."""
        activities = self._run(issue, project, workspace, author, {"name": "Created via external API"})

        assert activities == []
        assert not IssueSubscriber.objects.filter(issue_id=issue.id).exists()
        assert IssueActivity.objects.filter(issue_id=issue.id, verb="created").exists()
