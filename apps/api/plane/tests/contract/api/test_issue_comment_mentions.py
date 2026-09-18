# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
from unittest.mock import patch

import pytest
from rest_framework import status

from plane.api.serializers.issue import render_user_mention
from plane.bgtasks.notification_task import extract_comment_mentions
from plane.bgtasks.webhook_task import get_model_data
from plane.db.models import (
    BotTypeEnum,
    EmailNotificationLog,
    Issue,
    IssueComment,
    Notification,
    Project,
    ProjectMember,
    State,
    User,
    WorkspaceMember,
)
from plane.utils.service_account import create_service_account


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the user as an admin member and a default state."""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,  # Admin role
        is_active=True,
    )
    # A default state is required to create work items through the API
    State.objects.create(
        name="Backlog",
        color="#000000",
        group="backlog",
        default=True,
        project=project,
        workspace=workspace,
        created_by=create_user,
    )
    return project


@pytest.fixture
def create_issue(db, project, workspace, create_user):
    """Create an existing work item to comment on in tests."""
    return Issue.objects.create(
        name="Existing Issue",
        project=project,
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def mention_user(db, workspace, project):
    """Create a second user who is an active member of the project (mentionable)."""
    user = User.objects.create(
        email="mention@plane.so",
        username="mention-user",
        first_name="Mention",
        last_name="User",
    )
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    ProjectMember.objects.create(project=project, member=user, role=15, is_active=True)
    return user


@pytest.fixture
def second_mention_user(db, workspace, project):
    """Create another active project member (for multi-mention tests)."""
    user = User.objects.create(
        email="mention2@plane.so",
        username="mention-user-2",
        first_name="Mention",
        last_name="Two",
    )
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    ProjectMember.objects.create(project=project, member=user, role=15, is_active=True)
    return user


@pytest.fixture
def seed_bot_member(db, workspace, project):
    """Create a WORKSPACE_SEED bot that is an active project member (NOT mentionable).

    Non-service bots are not addressable teammates and have no notification
    preference, so the serializer must keep filtering them out.
    """
    user = User.objects.create(
        email="seedbot@plane.so",
        username="seed-bot-user",
        first_name="Seed",
        last_name="Bot",
        is_bot=True,
        bot_type=BotTypeEnum.WORKSPACE_SEED,
    )
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    ProjectMember.objects.create(project=project, member=user, role=15, is_active=True)
    return user


@pytest.fixture
def service_account_member(db, workspace, project):
    """Create a SERVICE bot (service account) that is an active project member.

    Service accounts are first-class, mentionable actors (an external system reacts
    to the mention via webhooks). Built via the real provisioning util so the test
    exercises the genuine is_bot=True / bot_type=SERVICE identity.
    """
    sa = create_service_account(workspace=workspace, name="Agent Smith", role="member")
    ProjectMember.objects.create(project=project, member=sa.user, role=15, is_active=True)
    return sa.user


@pytest.fixture
def non_member_user(db):
    """Create a user who is NOT a member of the project (not mentionable)."""
    return User.objects.create(
        email="outsider@plane.so",
        username="outsider-user",
        first_name="Outsider",
        last_name="User",
    )


@pytest.fixture
def inactive_member_user(db, workspace, project):
    """Create a deactivated project member (must NOT be mentionable)."""
    user = User.objects.create(
        email="inactive@plane.so",
        username="inactive-user",
        first_name="Inactive",
        last_name="User",
    )
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    ProjectMember.objects.create(project=project, member=user, role=15, is_active=False)
    return user


@pytest.fixture
def mock_comment_tasks():
    """Patch the deferred tasks the comment views dispatch.

    Returns the ``issue_activity`` mock so tests can assert on the dispatched
    notification; ``model_activity`` is suppressed so the tests do not require a
    running message broker.
    """
    with (
        patch("plane.api.views.issue.issue_activity") as mock_issue_activity,
        patch("plane.api.views.issue.model_activity"),
    ):
        yield mock_issue_activity


@pytest.fixture
def eager_celery():
    """Run dispatched Celery tasks synchronously, restoring the flag afterwards.

    Flips the Celery app conf directly (and restores it) rather than the Django
    setting, so eager mode cannot leak into other tests.
    """
    from plane.celery import app

    previous_eager = app.conf.task_always_eager
    previous_propagates = app.conf.task_eager_propagates
    app.conf.task_always_eager = True
    app.conf.task_eager_propagates = True
    try:
        yield
    finally:
        app.conf.task_always_eager = previous_eager
        app.conf.task_eager_propagates = previous_propagates


@pytest.mark.contract
class TestIssueCommentMentionContract:
    """
    Contract: the external REST API (``/api/v1/...``) exposes a first-class way to
    mention users in a work item comment. Callers pass a ``mentions`` list of user
    ids; the server renders the ``<mention-component>`` markup into ``comment_html``,
    the ids are parseable back out of ``comment_html``, and a notifying activity is
    dispatched so mentioned users are notified the same way the web app does.
    """

    def comments_url(self, workspace_slug, project_id, issue_id):
        """Helper to build the work item comment list/create endpoint URL."""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/comments/"

    def comment_detail_url(self, workspace_slug, project_id, issue_id, comment_id):
        """Helper to build the work item comment detail endpoint URL."""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/comments/{comment_id}/"

    @pytest.mark.django_db
    def test_create_comment_with_mentions_renders_parseable_markup(
        self, api_key_client, workspace, project, create_issue, mention_user, mock_comment_tasks
    ):
        """A mentioned user id is rendered as mention markup and is parseable back out."""
        url = self.comments_url(workspace.slug, project.id, create_issue.id)

        response = api_key_client.post(
            url,
            {"comment_html": "<p>Please take a look</p>", "mentions": [str(mention_user.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

        comment = IssueComment.objects.get(pk=response.data["id"])
        # The original body is preserved and the mention markup is appended.
        assert "<p>Please take a look</p>" in comment.comment_html
        assert 'entity_name="user_mention"' in comment.comment_html
        assert f'entity_identifier="{mention_user.id}"' in comment.comment_html
        # The mentioned id round-trips through the notification parser.
        assert extract_comment_mentions(comment.comment_html) == [str(mention_user.id)]

    @pytest.mark.django_db
    def test_create_comment_with_mentions_triggers_mention_notification(
        self, api_key_client, workspace, project, create_issue, mention_user, mock_comment_tasks
    ):
        """Creating a comment with mentions dispatches a notifying comment activity."""
        url = self.comments_url(workspace.slug, project.id, create_issue.id)

        response = api_key_client.post(
            url,
            {"comment_html": "<p>ping</p>", "mentions": [str(mention_user.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

        mock_comment_tasks.delay.assert_called_once()
        kwargs = mock_comment_tasks.delay.call_args.kwargs
        assert kwargs["type"] == "comment.activity.created"
        assert kwargs["notification"] is True
        # The dispatched activity must carry the comment id and the rendered mention
        # markup, otherwise the notification pipeline cannot fire mention notifications.
        requested_data = json.loads(kwargs["requested_data"])
        assert requested_data.get("id") == str(response.data["id"])
        assert extract_comment_mentions(requested_data["comment_html"]) == [str(mention_user.id)]

    @pytest.mark.django_db
    def test_create_plain_comment_triggers_notification(
        self, api_key_client, workspace, project, create_issue, mock_comment_tasks
    ):
        """Even a comment without mentions now dispatches a notifying activity."""
        url = self.comments_url(workspace.slug, project.id, create_issue.id)

        response = api_key_client.post(url, {"comment_html": "<p>hello</p>"}, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        mock_comment_tasks.delay.assert_called_once()
        kwargs = mock_comment_tasks.delay.call_args.kwargs
        assert kwargs["type"] == "comment.activity.created"
        assert kwargs["notification"] is True

    @pytest.mark.django_db
    def test_mention_non_project_member_is_ignored(
        self, api_key_client, workspace, project, create_issue, non_member_user, mock_comment_tasks
    ):
        """User ids that are not active project members are dropped, not rendered."""
        url = self.comments_url(workspace.slug, project.id, create_issue.id)

        response = api_key_client.post(
            url,
            {"comment_html": "<p>hi</p>", "mentions": [str(non_member_user.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        comment = IssueComment.objects.get(pk=response.data["id"])
        assert "mention-component" not in comment.comment_html
        assert extract_comment_mentions(comment.comment_html) == []

    @pytest.mark.django_db
    def test_mention_unknown_user_id_is_rejected(
        self, api_key_client, workspace, project, create_issue, mock_comment_tasks
    ):
        """A mentions entry that is not a real user id fails validation."""
        url = self.comments_url(workspace.slug, project.id, create_issue.id)

        response = api_key_client.post(
            url,
            {"comment_html": "<p>hi</p>", "mentions": ["00000000-0000-0000-0000-000000000000"]},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_update_comment_with_mentions_renders_and_notifies(
        self, api_key_client, workspace, project, create_issue, create_user, mention_user, mock_comment_tasks
    ):
        """Adding mentions on update appends markup and dispatches a notifying activity."""
        comment = IssueComment.objects.create(
            issue=create_issue,
            project=project,
            workspace=workspace,
            comment_html="<p>Original</p>",
            actor=create_user,
            created_by=create_user,
        )
        url = self.comment_detail_url(workspace.slug, project.id, create_issue.id, comment.id)

        response = api_key_client.patch(url, {"mentions": [str(mention_user.id)]}, format="json")

        assert response.status_code == status.HTTP_200_OK
        comment.refresh_from_db()
        # Existing body is kept and the mention markup is appended.
        assert "<p>Original</p>" in comment.comment_html
        assert extract_comment_mentions(comment.comment_html) == [str(mention_user.id)]

        mock_comment_tasks.delay.assert_called_once()
        kwargs = mock_comment_tasks.delay.call_args.kwargs
        assert kwargs["type"] == "comment.activity.updated"
        assert kwargs["notification"] is True

    @pytest.mark.django_db
    def test_create_comment_with_multiple_mentions_deduplicated(
        self, api_key_client, workspace, project, create_issue, mention_user, second_mention_user, mock_comment_tasks
    ):
        """Multiple mentions render once each; duplicate ids are collapsed."""
        url = self.comments_url(workspace.slug, project.id, create_issue.id)

        response = api_key_client.post(
            url,
            {
                "comment_html": "<p>team</p>",
                # second_mention_user is listed twice to exercise de-duplication.
                "mentions": [str(mention_user.id), str(second_mention_user.id), str(second_mention_user.id)],
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        comment = IssueComment.objects.get(pk=response.data["id"])
        # Both users are mentioned, each exactly once (set compare avoids relying on
        # extract_comment_mentions' non-deterministic ordering).
        assert set(extract_comment_mentions(comment.comment_html)) == {
            str(mention_user.id),
            str(second_mention_user.id),
        }
        assert comment.comment_html.count('entity_name="user_mention"') == 2

    @pytest.mark.django_db
    def test_mention_inactive_project_member_is_ignored(
        self, api_key_client, workspace, project, create_issue, inactive_member_user, mock_comment_tasks
    ):
        """A deactivated project member is not mentionable."""
        url = self.comments_url(workspace.slug, project.id, create_issue.id)

        response = api_key_client.post(
            url,
            {"comment_html": "<p>hi</p>", "mentions": [str(inactive_member_user.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        comment = IssueComment.objects.get(pk=response.data["id"])
        assert "mention-component" not in comment.comment_html

    @pytest.mark.django_db
    def test_delete_comment_triggers_notification(
        self, api_key_client, workspace, project, create_issue, create_user, mention_user, mock_comment_tasks
    ):
        """Deleting a comment dispatches a notifying activity with the request origin."""
        comment = IssueComment.objects.create(
            issue=create_issue,
            project=project,
            workspace=workspace,
            comment_html=f"<p>bye</p><p>{render_user_mention(mention_user.id)}</p>",
            actor=create_user,
            created_by=create_user,
        )
        url = self.comment_detail_url(workspace.slug, project.id, create_issue.id, comment.id)

        response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        mock_comment_tasks.delay.assert_called_once()
        kwargs = mock_comment_tasks.delay.call_args.kwargs
        assert kwargs["type"] == "comment.activity.deleted"
        assert kwargs["notification"] is True
        assert kwargs["origin"]

    @pytest.mark.django_db
    def test_comment_activity_actor_is_authenticated_user(
        self, api_key_client, workspace, project, create_issue, create_user, mention_user, mock_comment_tasks
    ):
        """A client-supplied created_by cannot spoof the notification actor."""
        url = self.comments_url(workspace.slug, project.id, create_issue.id)

        response = api_key_client.post(
            url,
            # Attempt to attribute the activity (and so the mention notification) to
            # another user by passing their id as created_by.
            {"comment_html": "<p>hi</p>", "created_by": str(mention_user.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        kwargs = mock_comment_tasks.delay.call_args.kwargs
        assert kwargs["actor_id"] == str(create_user.id)
        assert kwargs["actor_id"] != str(mention_user.id)

    @pytest.mark.django_db
    def test_mention_seed_bot_is_ignored(
        self, api_key_client, workspace, project, create_issue, seed_bot_member, mock_comment_tasks
    ):
        """A non-service (workspace-seed) bot is not mentionable and is not rendered.

        Terminology matches the rest of the contract: unknown ids are *rejected*
        (400), non-mentionable members are *ignored* (201, no markup rendered).
        """
        url = self.comments_url(workspace.slug, project.id, create_issue.id)

        response = api_key_client.post(
            url,
            {"comment_html": "<p>hi</p>", "mentions": [str(seed_bot_member.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        comment = IssueComment.objects.get(pk=response.data["id"])
        assert "mention-component" not in comment.comment_html

    @pytest.mark.django_db
    def test_mention_service_account_renders_parseable_markup(
        self, api_key_client, workspace, project, create_issue, service_account_member, mock_comment_tasks
    ):
        """A service account (bot_type=SERVICE) is mentionable and its markup renders."""
        url = self.comments_url(workspace.slug, project.id, create_issue.id)

        response = api_key_client.post(
            url,
            {"comment_html": "<p>hey agent</p>", "mentions": [str(service_account_member.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        comment = IssueComment.objects.get(pk=response.data["id"])
        assert f'entity_identifier="{service_account_member.id}"' in comment.comment_html
        assert extract_comment_mentions(comment.comment_html) == [str(service_account_member.id)]

    @pytest.mark.django_db
    def test_service_account_mention_carried_in_webhook_payload(
        self, api_key_client, workspace, project, create_issue, service_account_member, mock_comment_tasks
    ):
        """The issue_comment webhook payload (get_model_data) carries the mention."""
        url = self.comments_url(workspace.slug, project.id, create_issue.id)

        response = api_key_client.post(
            url,
            {"comment_html": "<p>ping</p>", "mentions": [str(service_account_member.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        # get_model_data is exactly what webhook_send_task serializes for delivery.
        payload = get_model_data("issue_comment", str(response.data["id"]))
        assert extract_comment_mentions(payload["comment_html"]) == [str(service_account_member.id)]

    @pytest.mark.django_db
    def test_mention_service_account_notifies_in_app_without_email(
        self, api_key_client, workspace, project, create_issue, service_account_member, eager_celery
    ):
        """Mentioning a service account creates its in-app Notification but sends no email."""
        url = self.comments_url(workspace.slug, project.id, create_issue.id)

        with patch("plane.api.views.issue.model_activity"):
            response = api_key_client.post(
                url,
                {"comment_html": "<p>ping</p>", "mentions": [str(service_account_member.id)]},
                format="json",
            )

        # The comment succeeds despite the bot having no notification preference.
        assert response.status_code == status.HTTP_201_CREATED
        # In-app mention notification IS created (external systems react to it)...
        assert Notification.objects.filter(
            receiver=service_account_member,
            entity_identifier=create_issue.id,
            sender="in_app:issue_activities:mentioned",
        ).exists()
        # ...but no email is queued to the service account's synthetic address.
        assert not EmailNotificationLog.objects.filter(receiver=service_account_member).exists()

    @pytest.mark.django_db
    def test_repeated_mention_update_is_idempotent(
        self, api_key_client, workspace, project, create_issue, create_user, mention_user, mock_comment_tasks
    ):
        """Re-sending the same mention on update does not duplicate the markup."""
        comment = IssueComment.objects.create(
            issue=create_issue,
            project=project,
            workspace=workspace,
            comment_html="<p>Original</p>",
            actor=create_user,
            created_by=create_user,
        )
        url = self.comment_detail_url(workspace.slug, project.id, create_issue.id, comment.id)

        api_key_client.patch(url, {"mentions": [str(mention_user.id)]}, format="json")
        api_key_client.patch(url, {"mentions": [str(mention_user.id)]}, format="json")

        comment.refresh_from_db()
        assert comment.comment_html.count('entity_name="user_mention"') == 1

    @pytest.mark.django_db
    def test_mention_renders_when_id_appears_in_body_text(
        self, api_key_client, workspace, project, create_issue, mention_user, mock_comment_tasks
    ):
        """An id occurring outside a mention node must not suppress a real mention.

        The already-mentioned check parses the body for <mention-component> nodes; a
        substring match would treat this text as an existing mention, silently drop
        the markup and never notify the user.
        """
        url = self.comments_url(workspace.slug, project.id, create_issue.id)

        response = api_key_client.post(
            url,
            {
                "comment_html": f'<p>entity_identifier="{mention_user.id}"</p>',
                "mentions": [str(mention_user.id)],
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        comment = IssueComment.objects.get(pk=response.data["id"])
        assert extract_comment_mentions(comment.comment_html) == [str(mention_user.id)]

    @pytest.mark.django_db
    def test_mention_creates_notification_end_to_end(
        self, api_key_client, workspace, project, create_issue, mention_user, eager_celery
    ):
        """Running the real pipeline, a mentioned member gets a mention Notification row."""
        # eager_celery executes the dispatched issue_activity (and the nested
        # notifications task) synchronously so we can assert the Notification is created.
        url = self.comments_url(workspace.slug, project.id, create_issue.id)

        # Suppress the webhook task (unrelated side effect) while letting the
        # notification pipeline run for real.
        with patch("plane.api.views.issue.model_activity"):
            response = api_key_client.post(
                url,
                {"comment_html": "<p>ping</p>", "mentions": [str(mention_user.id)]},
                format="json",
            )

        assert response.status_code == status.HTTP_201_CREATED
        assert Notification.objects.filter(
            receiver=mention_user,
            entity_identifier=create_issue.id,
            sender="in_app:issue_activities:mentioned",
        ).exists()

    @pytest.mark.django_db
    def test_description_mention_email_log_targets_mentioned_user(
        self, api_key_client, workspace, project, create_issue, mention_user, eager_celery
    ):
        """A description mention emails the mentioned user.

        Regression: the description-mention email log addressed ``subscriber``, which
        in that scope is the notification task's boolean parameter (or a user id left
        over from the subscriber loop) rather than the mentioned user — so the log went
        to the wrong recipient, or the write failed and silently dropped every
        notification for that activity.
        """
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/issues/{create_issue.id}/"
        description_html = f"<p>please look</p><p>{render_user_mention(mention_user.id)}</p>"

        with patch("plane.api.views.issue.model_activity"):
            response = api_key_client.patch(url, {"description_html": description_html}, format="json")

        assert response.status_code == status.HTTP_200_OK
        logs = EmailNotificationLog.objects.filter(entity_identifier=create_issue.id)
        assert logs.exists()
        # Every log for this activity is addressed to the mentioned user.
        assert {str(log.receiver_id) for log in logs} == {str(mention_user.id)}

    @pytest.mark.django_db
    def test_create_comment_sanitizes_unsafe_html(
        self, api_key_client, workspace, project, create_issue, mock_comment_tasks
    ):
        """Unsafe HTML in comment_html is sanitized on the public write path."""
        url = self.comments_url(workspace.slug, project.id, create_issue.id)

        response = api_key_client.post(
            url,
            {"comment_html": '<p>ok</p><script>alert(1)</script><p onclick="evil()">x</p>'},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        comment = IssueComment.objects.get(pk=response.data["id"])
        assert "<script" not in comment.comment_html
        assert "onclick" not in comment.comment_html
        # Safe content is preserved.
        assert "<p>ok</p>" in comment.comment_html

    @pytest.mark.django_db
    def test_mentions_exceeding_max_length_rejected(
        self, api_key_client, workspace, project, create_issue, mention_user, mock_comment_tasks
    ):
        """More than 100 mentions is rejected by the field's max_length bound."""
        url = self.comments_url(workspace.slug, project.id, create_issue.id)

        response = api_key_client.post(
            url,
            {"comment_html": "<p>hi</p>", "mentions": [str(mention_user.id)] * 101},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_mention_markup_survives_sanitization(
        self, api_key_client, workspace, project, create_issue, mention_user, mock_comment_tasks
    ):
        """The rendered mention markup is whitelisted, so sanitization keeps it intact."""
        url = self.comments_url(workspace.slug, project.id, create_issue.id)

        response = api_key_client.post(
            url,
            {"comment_html": "<p>see</p><script>bad()</script>", "mentions": [str(mention_user.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        comment = IssueComment.objects.get(pk=response.data["id"])
        assert "<script" not in comment.comment_html
        # The mention still parses back out after sanitization.
        assert extract_comment_mentions(comment.comment_html) == [str(mention_user.id)]


@pytest.mark.contract
class TestEntitySearchMentionCandidates:
    """
    Contract: the web editor's @-mention autocomplete is served by the app API
    entity-search endpoint. Service accounts (bot_type=SERVICE) must appear as
    mention candidates so humans can @-mention agents from the UI, while other
    bots (workspace-seed) stay hidden.
    """

    def entity_search_url(self, workspace_slug):
        return f"/api/workspaces/{workspace_slug}/entity-search/"

    @pytest.mark.django_db
    def test_user_mention_search_includes_service_account_excludes_seed_bot(
        self,
        session_client,
        workspace,
        project,
        create_user,
        mention_user,
        service_account_member,
        seed_bot_member,
    ):
        """user_mention suggestions include humans + service accounts, not seed bots."""
        response = session_client.get(
            self.entity_search_url(workspace.slug),
            {"query_type": "user_mention", "project_id": str(project.id), "count": 50},
        )

        assert response.status_code == status.HTTP_200_OK
        ids = {str(row["member__id"]) for row in response.data["user_mention"]}
        assert str(mention_user.id) in ids
        assert str(service_account_member.id) in ids
        assert str(seed_bot_member.id) not in ids
