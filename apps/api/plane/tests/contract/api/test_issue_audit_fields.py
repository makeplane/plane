# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""created_by and created_at on external-API work items, comments and links come from the request.

created_by is the authenticated caller and created_at the request time; values in
the request body are ignored on create, and created_by does not change on update.
"""

import json
from datetime import timedelta
from unittest import mock
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import APIToken, Issue, IssueComment, IssueLink, Project, ProjectMember, State

BODY_CREATED_AT = timezone.now() - timedelta(days=3650)


def _assert_created_at_is_now(created_at):
    now = timezone.now()
    assert now - timedelta(minutes=1) <= created_at <= now + timedelta(minutes=1), (
        f"created_at must be generated near the request time, got {created_at}"
    )


def _create_issue_as(creator, **kwargs):
    # Outside a request BaseModel.save() clears created_by unless it is passed here
    obj = Issue(**kwargs)
    obj.save(created_by_id=creator.id)
    return obj


pytestmark = pytest.mark.contract


@pytest.fixture
def admin_user(db, create_user):
    """The project admin and creator of the fixture issue."""
    return create_user


@pytest.fixture
def member_user(db):
    """A project member who makes the requests in these tests."""
    from plane.db.models import User

    unique = uuid4().hex[:8]
    user = User.objects.create(email=f"member-{unique}@plane.so", username=f"member_{unique}")
    user.set_password("member-password")
    user.save()
    return user


@pytest.fixture
def project(db, workspace, admin_user, member_user):
    project = Project.objects.create(
        name="Test Project",
        identifier="TPF",
        workspace=workspace,
        created_by=admin_user,
    )
    ProjectMember.objects.create(project=project, member=admin_user, role=20, is_active=True)
    ProjectMember.objects.create(project=project, member=member_user, role=15, is_active=True)
    return project


@pytest.fixture
def state(db, workspace, project):
    return State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)


@pytest.fixture
def issue(db, workspace, project, state, admin_user):
    return _create_issue_as(
        admin_user,
        name="Admin's issue",
        workspace=workspace,
        project=project,
        state=state,
    )


@pytest.fixture
def member_api_client(api_client, member_user):
    token = APIToken.objects.create(user=member_user, label="Member Token", token=f"member-token-{uuid4().hex}")
    api_client.credentials(HTTP_X_API_KEY=token.token)
    return api_client


def _issues_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/issues/"


def _issue_detail_url(slug, project_id, pk):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/issues/{pk}/"


def _links_url(slug, project_id, issue_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/links/"


def _comments_url(slug, project_id, issue_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/comments/"


@pytest.mark.django_db
class TestIssueCreateAuditFields:
    def test_post_sets_created_by_to_the_caller(
        self, member_api_client, workspace, project, state, admin_user, member_user
    ):
        url = _issues_url(workspace.slug, project.id)
        response = member_api_client.post(
            url,
            {
                "name": "New issue",
                "state": str(state.id),
                "created_by": str(admin_user.id),
                "created_at": BODY_CREATED_AT.isoformat(),
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, f"got {response.status_code}: {response.data!r}"

        created = Issue.objects.get(pk=response.data["id"])
        assert created.created_by_id == member_user.id
        _assert_created_at_is_now(created.created_at)

    # IssueDetailAPIEndpoint.put has no mounted route (IssueListCreateAPIEndpoint is
    # registered for get/post only), so its create branch is not tested here.


@pytest.mark.django_db
class TestIssuePatchAuditFields:
    def test_patch_keeps_created_by(self, member_api_client, workspace, project, issue, admin_user, member_user):
        url = _issue_detail_url(workspace.slug, project.id, issue.id)
        with (
            mock.patch("plane.api.views.issue.issue_activity") as issue_activity,
            mock.patch("plane.api.views.issue.model_activity") as model_activity,
        ):
            response = member_api_client.patch(
                url, {"name": "Edited by member", "created_by": str(member_user.id)}, format="json"
            )
        assert response.status_code == status.HTTP_200_OK, f"got {response.status_code}: {response.data!r}"

        issue.refresh_from_db()
        assert issue.created_by_id == admin_user.id
        assert issue.name == "Edited by member"
        # The ignored field is not reported as a change.
        assert "created_by" not in json.loads(issue_activity.delay.call_args.kwargs["requested_data"])
        assert "created_by" not in model_activity.delay.call_args.kwargs["requested_data"]
        assert model_activity.delay.call_args.kwargs["requested_data"]["name"] == "Edited by member"


@pytest.mark.django_db
class TestIssueDeleteAfterPatch:
    def test_member_cannot_delete_after_patching_created_by(
        self, member_api_client, workspace, project, issue, member_user
    ):
        """Delete requires a project admin or the creator; a PATCH does not change the creator."""
        patch_url = _issue_detail_url(workspace.slug, project.id, issue.id)
        member_api_client.patch(patch_url, {"created_by": str(member_user.id)}, format="json")
        issue.refresh_from_db()
        assert issue.created_by_id != member_user.id

        response = member_api_client.delete(_issue_detail_url(workspace.slug, project.id, issue.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN, f"got {response.status_code}"
        assert Issue.objects.filter(pk=issue.id).exists()

    def test_creator_can_delete_own_issue(self, member_api_client, workspace, project, state, member_user):
        own_issue = _create_issue_as(
            member_user, name="Member's own issue", workspace=workspace, project=project, state=state
        )
        url = _issue_detail_url(workspace.slug, project.id, own_issue.id)
        response = member_api_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT, f"got {response.status_code}: {response.data!r}"


@pytest.mark.django_db
class TestCommentCreateAuditFields:
    def test_post_comment_sets_created_by_to_the_caller(
        self, member_api_client, workspace, project, issue, admin_user, member_user
    ):
        url = _comments_url(workspace.slug, project.id, issue.id)
        response = member_api_client.post(
            url,
            {
                "comment_html": "<p>Looks good</p>",
                "created_by": str(admin_user.id),
                "created_at": BODY_CREATED_AT.isoformat(),
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, f"got {response.status_code}: {response.data!r}"

        comment = IssueComment.objects.get(pk=response.data["id"])
        assert comment.created_by_id == member_user.id
        assert comment.actor_id == member_user.id
        _assert_created_at_is_now(comment.created_at)


@pytest.mark.django_db
class TestIssueLinkCreateAuditFields:
    def test_post_link_sets_created_by_to_the_caller(
        self, member_api_client, workspace, project, issue, admin_user, member_user
    ):
        url = _links_url(workspace.slug, project.id, issue.id)
        response = member_api_client.post(
            url,
            {"title": "Spec doc", "url": "https://example.com/spec", "created_by": str(admin_user.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, f"got {response.status_code}: {response.data!r}"

        link = IssueLink.objects.get(pk=response.data["id"])
        assert link.created_by_id == member_user.id
