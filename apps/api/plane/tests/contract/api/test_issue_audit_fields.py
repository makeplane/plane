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
from rest_framework.test import APIClient

from plane.bgtasks.issue_activities_task import issue_activity as issue_activity_task
from plane.db.models import APIToken, Issue, IssueComment, IssueLink, Project, ProjectMember, State, WorkspaceMember

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


def _comment_detail_url(slug, project_id, issue_id, comment_id):
    return f"{_comments_url(slug, project_id, issue_id)}{comment_id}/"


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
        token = APIToken.objects.get(user=member_user, label="Member Token")
        assert created.created_by_id == token.actor_id
        assert token.actor.display_name == token.label
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
        token = APIToken.objects.get(user=member_user, label="Member Token")
        assert issue_activity.delay.call_args.kwargs["actor_id"] == str(token.actor_id)
        assert model_activity.delay.call_args.kwargs["actor_id"] == token.actor_id


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

    def test_token_owner_can_delete_issue_created_by_its_actor(
        self, member_api_client, workspace, project, state, member_user
    ):
        response = member_api_client.post(
            _issues_url(workspace.slug, project.id),
            {"name": "Agent issue", "state": str(state.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, f"got {response.status_code}: {response.data!r}"

        issue_id = response.data["id"]
        token = APIToken.objects.get(user=member_user, label="Member Token")
        assert Issue.objects.get(pk=issue_id).created_by_id == token.actor_id
        delete_response = member_api_client.delete(_issue_detail_url(workspace.slug, project.id, issue_id))

        assert delete_response.status_code == status.HTTP_204_NO_CONTENT
        assert not Issue.objects.filter(pk=issue_id).exists()


@pytest.mark.django_db
class TestCommentCreateAuditFields:
    def test_post_comment_sets_created_by_to_the_caller(
        self, member_api_client, workspace, project, issue, admin_user, member_user
    ):
        url = _comments_url(workspace.slug, project.id, issue.id)
        with (
            mock.patch("plane.api.views.issue.issue_activity") as issue_activity,
            mock.patch("plane.api.views.issue.model_activity") as model_activity,
        ):
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
        token = APIToken.objects.get(user=member_user, label="Member Token")
        assert comment.created_by_id == token.actor_id
        assert comment.actor_id == token.actor_id
        assert issue_activity.delay.call_args.kwargs["actor_id"] == str(token.actor_id)
        assert model_activity.delay.call_args.kwargs["actor_id"] == token.actor_id
        _assert_created_at_is_now(comment.created_at)

    def test_token_owner_can_edit_and_delete_comment_created_by_its_actor(
        self, member_api_client, workspace, project, issue, member_user
    ):
        response = member_api_client.post(
            _comments_url(workspace.slug, project.id, issue.id),
            {"comment_html": "<p>Agent comment</p>"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED, f"got {response.status_code}: {response.data!r}"
        comment = IssueComment.objects.get(pk=response.data["id"])
        token = APIToken.objects.get(user=member_user, label="Member Token")
        assert comment.created_by_id == token.actor_id
        assert comment.actor_id == token.actor_id

        url = _comment_detail_url(workspace.slug, project.id, issue.id, comment.id)
        with (
            mock.patch("plane.api.views.issue.issue_activity") as issue_activity,
            mock.patch("plane.api.views.issue.model_activity") as model_activity,
        ):
            patch_response = member_api_client.patch(
                url, {"comment_html": "<p>Updated by agent</p>"}, format="json"
            )
        assert patch_response.status_code == status.HTTP_200_OK, (
            f"got {patch_response.status_code}: {patch_response.data!r}"
        )
        assert issue_activity.delay.call_args.kwargs["actor_id"] == str(token.actor_id)
        assert model_activity.delay.call_args.kwargs["actor_id"] == token.actor_id

        delete_response = member_api_client.delete(url)
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT
        assert not IssueComment.objects.filter(pk=comment.id).exists()


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
        token = APIToken.objects.get(user=member_user, label="Member Token")
        assert link.created_by_id == token.actor_id


@pytest.mark.django_db
class TestCompleteAPITokenActorWorkflow:
    def test_two_tokens_human_session_rename_and_revocation(
        self, create_user, member_user, workspace, project, state
    ):
        """Visible identity and owner access persist across two tokens and a human session."""
        member_user.set_password("agent-owner-password")
        member_user.save()
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=member_user,
            defaults={"role": 15},
        )

        owner_session = APIClient()
        assert owner_session.login(email=member_user.email, password="agent-owner-password")

        planner_token = APIToken.objects.create(
            user=member_user,
            label="planner-agent",
            token=f"planner-token-{uuid4().hex}",
        )
        reviewer_token = APIToken.objects.create(
            user=member_user,
            label="review-agent",
            token=f"review-token-{uuid4().hex}",
        )
        assert planner_token.actor_id is None  # Simulate a token created before actor identities existed.

        planner = APIClient()
        planner.credentials(HTTP_X_API_KEY=planner_token.token)
        reviewer = APIClient()
        reviewer.credentials(HTTP_X_API_KEY=reviewer_token.token)

        def run_activity_inline(*args, **kwargs):
            kwargs["notification"] = False
            kwargs["origin"] = None
            return issue_activity_task.run(*args, **kwargs)

        with (
            mock.patch.object(issue_activity_task, "delay", side_effect=run_activity_inline),
            mock.patch("plane.bgtasks.webhook_task.model_activity.delay"),
            mock.patch("plane.bgtasks.issue_description_version_task.issue_description_version_task.delay"),
        ):
            create_response = planner.post(
                _issues_url(workspace.slug, project.id),
                {"name": "Created by planner", "state": str(state.id)},
                format="json",
            )
            assert create_response.status_code == status.HTTP_201_CREATED, create_response.data
            issue_id = create_response.data["id"]
            planner_token.refresh_from_db()
            assert planner_token.actor_id is not None  # First use provisions the legacy token's actor.

            planner_comment_response = planner.post(
                _comments_url(workspace.slug, project.id, issue_id),
                {"comment_html": "<p>Planner comment</p>"},
                format="json",
            )
            assert planner_comment_response.status_code == status.HTTP_201_CREATED, planner_comment_response.data
            second_planner_comment = planner.post(
                _comments_url(workspace.slug, project.id, issue_id),
                {"comment_html": "<p>Planner comment to remove</p>"},
                format="json",
            )
            assert second_planner_comment.status_code == status.HTTP_201_CREATED, second_planner_comment.data

            planner_update = planner.patch(
                _issue_detail_url(workspace.slug, project.id, issue_id),
                {"name": "Planner updated the issue"},
                format="json",
            )
            assert planner_update.status_code == status.HTTP_200_OK, planner_update.data

            reviewer_comment_response = reviewer.post(
                _comments_url(workspace.slug, project.id, issue_id),
                {"comment_html": "<p>Reviewer comment</p>"},
                format="json",
            )
            assert reviewer_comment_response.status_code == status.HTTP_201_CREATED, reviewer_comment_response.data
            reviewer_update = reviewer.patch(
                _issue_detail_url(workspace.slug, project.id, issue_id),
                {"name": "Reviewer updated the issue"},
                format="json",
            )
            assert reviewer_update.status_code == status.HTTP_200_OK, reviewer_update.data
            reviewer_token.refresh_from_db()
            assert reviewer_token.actor_id is not None

            human_create = owner_session.post(
                f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/",
                {"name": "Created by human", "state_id": str(state.id)},
                format="json",
            )
            assert human_create.status_code == status.HTTP_201_CREATED, human_create.data
            human_issue_id = human_create.data["id"]
            human_comment = owner_session.post(
                f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue_id}/comments/",
                {"comment_html": "<p>Human comment</p>"},
                format="json",
            )
            assert human_comment.status_code == status.HTTP_201_CREATED, human_comment.data
            human_update = owner_session.patch(
                f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue_id}/",
                {"name": "Human updated the issue"},
                format="json",
            )
            assert human_update.status_code == status.HTTP_204_NO_CONTENT, human_update.data

            issue_url = _issue_detail_url(workspace.slug, project.id, issue_id)
            visible_issue = reviewer.get(f"{issue_url}?expand=created_by")
            assert visible_issue.status_code == status.HTTP_200_OK
            assert visible_issue.data["created_by"]["display_name"] == "planner-agent"

            human_issue = reviewer.get(
                f"{_issue_detail_url(workspace.slug, project.id, human_issue_id)}?expand=created_by"
            )
            assert human_issue.status_code == status.HTTP_200_OK
            assert human_issue.data["created_by"]["display_name"] == member_user.display_name

            comments_url = _comments_url(workspace.slug, project.id, issue_id)
            visible_comments = reviewer.get(f"{comments_url}?expand=created_by,actor")
            assert visible_comments.status_code == status.HTTP_200_OK
            visible_comment_names = {
                row["actor"]["display_name"] for row in visible_comments.data["results"]
            }
            assert visible_comment_names == {"planner-agent", "review-agent", member_user.display_name}
            visible_comment_creator_names = {
                row["created_by"]["display_name"] for row in visible_comments.data["results"]
            }
            assert visible_comment_creator_names == {"planner-agent", "review-agent", member_user.display_name}

            reviewer_comment_id = reviewer_comment_response.data["id"]
            reviewer_comment_before_rename = reviewer.get(
                f"{_comment_detail_url(workspace.slug, project.id, issue_id, reviewer_comment_id)}?expand=actor"
            )
            assert reviewer_comment_before_rename.data["actor"]["display_name"] == "review-agent"

            rename_response = owner_session.patch(
                reverse("api-tokens-details", kwargs={"pk": reviewer_token.pk}),
                {"label": "review-agent-renamed"},
                format="json",
            )
            assert rename_response.status_code == status.HTTP_200_OK, rename_response.data
            reviewer_token.refresh_from_db()
            assert reviewer_token.actor.display_name == "review-agent-renamed"
            reviewer_comment_after_rename = reviewer.get(
                f"{_comment_detail_url(workspace.slug, project.id, issue_id, reviewer_comment_id)}?expand=actor"
            )
            assert reviewer_comment_after_rename.data["actor"]["display_name"] == "review-agent-renamed"

            activity_response = reviewer.get(
                f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue_id}/activities/?expand=actor"
            )
            assert activity_response.status_code == status.HTTP_200_OK
            history_names = {row["actor"]["display_name"] for row in activity_response.data["results"]}
            assert {"planner-agent", "review-agent-renamed", member_user.display_name}.issubset(history_names)

            revoke_response = owner_session.delete(reverse("api-tokens-details", kwargs={"pk": planner_token.pk}))
            assert revoke_response.status_code == status.HTTP_204_NO_CONTENT
            assert planner.get(issue_url).status_code == status.HTTP_401_UNAUTHORIZED
            assert reviewer.get(issue_url).status_code == status.HTTP_200_OK
            assert owner_session.get(
                f"/api/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue_id}/"
            ).status_code == status.HTTP_200_OK

            issue_after_revoke = reviewer.get(f"{issue_url}?expand=created_by")
            assert issue_after_revoke.status_code == status.HTTP_200_OK
            assert issue_after_revoke.data["created_by"]["display_name"] == "planner-agent"
            history_after_revoke = reviewer.get(
                f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{issue_id}/activities/?expand=actor"
            )
            assert history_after_revoke.status_code == status.HTTP_200_OK
            assert any(row["actor"]["display_name"] == "planner-agent" for row in history_after_revoke.data["results"])

            comments_after_revoke = reviewer.get(f"{comments_url}?expand=created_by,actor")
            assert comments_after_revoke.status_code == status.HTTP_200_OK
            assert any(
                row["id"] == planner_comment_response.data["id"]
                and row["actor"]["display_name"] == "planner-agent"
                for row in comments_after_revoke.data["results"]
            )
            planner_comment_url = _comment_detail_url(
                workspace.slug, project.id, issue_id, planner_comment_response.data["id"]
            )
            manageable_comment = reviewer.patch(
                planner_comment_url,
                {"comment_html": "<p>Owner updated the planner comment</p>"},
                format="json",
            )
            assert manageable_comment.status_code == status.HTTP_200_OK, manageable_comment.data
            deletable_comment_url = _comment_detail_url(
                workspace.slug, project.id, issue_id, second_planner_comment.data["id"]
            )
            owner_delete = reviewer.delete(deletable_comment_url)
            assert owner_delete.status_code == status.HTTP_204_NO_CONTENT
