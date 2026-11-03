# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Regression tests for the issue-update notification email.

An actor without a profile photo must fall back to the initial rendered by
``templates/emails/notifications/issue-updates.html``. Building the avatar URL
unconditionally turns ``User.avatar_url`` (``None``) into the string
``"<base_api>None"``, which is truthy, so the template always took the ``<img>``
branch and mail clients showed a broken image.
"""

import re
from unittest.mock import MagicMock, patch

import pytest
from django.core import mail

from plane.bgtasks.email_notification_task import send_email_notification
from plane.db.models import EmailNotificationLog, Issue, Project, Workspace
from plane.tests.factories import UserFactory

BASE_API = "http://localhost:8000"
TASK_MODULE = "plane.bgtasks.email_notification_task"

# Matches the initial-letter block the template renders in the {% else %} branch.
INITIAL_RE = re.compile(r"border-radius: 50%.{0,200}?<span[^>]*>\s*([A-Za-z])\s*</span>", re.S)


def _email_configuration():
    """Stand in for the instance-level SMTP configuration lookup."""
    return ("smtp.test.local", "user", "password", "587", "1", "0", "Team Plane <team@plane.so>")


def _notification_data(actor_id):
    return {
        str(actor_id): [
            {
                "issue_activity": {
                    "field": "state",
                    "old_value": "Todo",
                    "new_value": "Done",
                    "activity_time": "2026-10-14T10:00:00Z",
                }
            }
        ]
    }


def _send(actor, receiver, issue, log):
    """Run the task with Redis and SMTP configuration stubbed out."""
    redis = MagicMock()
    redis.get.return_value = BASE_API.encode()

    with (
        patch(f"{TASK_MODULE}.redis_instance", return_value=redis),
        patch(f"{TASK_MODULE}.get_email_configuration", side_effect=_email_configuration),
    ):
        mail.outbox = []
        send_email_notification(
            str(issue.id),
            _notification_data(actor.id),
            str(receiver.id),
            [str(log.id)],
        )

    assert mail.outbox, "the task did not produce an email"
    return mail.outbox[0].alternatives[0][0]


@pytest.fixture
def notification_setup(db):
    """An issue plus the actor/receiver pair an update notification needs."""
    # UserFactory does not populate the unique username column.
    actor = UserFactory(first_name="Ada", last_name="Lovelace", username="ada-notification-test")
    receiver = UserFactory(first_name="Bob", last_name="Receiver", username="bob-notification-test")
    workspace = Workspace.objects.create(name="Test Workspace", slug="test-workspace", owner=actor)
    project = Project.objects.create(name="Test Project", identifier="TEST", workspace=workspace)
    issue = Issue.objects.create(name="A work item", project=project, workspace=workspace)
    log = EmailNotificationLog.objects.create(
        receiver=receiver,
        triggered_by=actor,
        entity_name="issue",
        entity_identifier=issue.id,
    )
    return actor, receiver, issue, log


@pytest.mark.unit
class TestIssueUpdateNotificationAvatar:
    def test_actor_without_avatar_renders_the_initial(self, notification_setup):
        actor, receiver, issue, log = notification_setup
        assert actor.avatar_url is None, "fixture actor should have no avatar"

        html = _send(actor, receiver, issue, log)

        sources = re.findall(r'<img[^>]*src="([^"]*)"', html)
        assert not [src for src in sources if "None" in src], (
            f"avatar URL was built for an actor without an avatar: {sources}"
        )

        initial = INITIAL_RE.search(html)
        assert initial, "the initial-letter fallback was not rendered"
        assert initial.group(1) == "A"

    def test_actor_with_avatar_still_renders_the_image(self, notification_setup):
        actor, receiver, issue, log = notification_setup
        actor.avatar = "/api/assets/v2/static/avatar/"
        actor.save(update_fields=["avatar"])

        html = _send(actor, receiver, issue, log)

        assert f'src="{BASE_API}/api/assets/v2/static/avatar/"' in html, (
            "the avatar image was dropped for an actor that has one"
        )
