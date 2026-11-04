# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Notification emails must not render a broken avatar for users who have none.

``User.avatar_url`` returns ``None`` when neither ``avatar_asset`` nor ``avatar``
is set, which is the default for most accounts. The email context was building
``f"{base_api}{actor.avatar_url}"`` unconditionally, so those users got the
*truthy* string ``"<base>/None"``. The template checks ``{% if avatar_url %}``
before choosing between an ``<img>`` and the initials circle, so a truthy value
sends it down the image branch — and ``/None`` is served by the SPA catch-all as
HTML with a 200, so mail clients render a broken-image icon rather than falling
back.

This asserts the rendered HTML, not the context dict: the bug was only visible
once the value reached the template's truthiness check.
"""

from unittest.mock import MagicMock, patch

import pytest

from plane.bgtasks.email_notification_task import send_email_notification
from plane.db.models import EmailNotificationLog, Issue, Project, ProjectMember, User

BASE_API = "https://plane.example.com"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Avatar Test", identifier="AV", workspace=workspace, created_by=create_user)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def issue(db, project, workspace, create_user):
    return Issue.objects.create(
        name="Broken avatar in email", project=project, workspace=workspace, created_by=create_user
    )


@pytest.fixture
def actor_without_avatar(db):
    """The default state for a Plane account: no avatar asset, no avatar url."""
    user = User.objects.create(email="noavatar@example.com", username="noavatar", first_name="Josh", last_name="Gwinn")
    assert user.avatar_url is None, "fixture premise: this user has no avatar"
    return user


# The guard was applied at three call sites, each reached by a different field:
# "comment" and "mention" append to the comments block, anything else falls through
# to the activity-change block. Exercising only one would leave two guards untested.
ACTOR_DETAIL_PATHS = [
    pytest.param("comment", "Who is working on this?", id="comment"),
    pytest.param("mention", "<p>pinging you on this</p>", id="mention"),
    pytest.param("name", "Renamed work item", id="activity-change"),
]


def _render(issue, actor, receiver, field="comment", new_value="Who is working on this?"):
    """Run the task with its external edges mocked, returning the HTML it built."""
    log = EmailNotificationLog.objects.create(
        entity_identifier=issue.id,
        entity_name="issue",
        entity="issue",
        receiver=receiver,
        triggered_by=actor,
        data={},
    )
    # Raw shape, as stack_email_notification builds it: the task runs this through
    # create_payload first, which folds it into {actor_id: {field: {...}, activity_time}}.
    notification_data = {
        str(actor.id): [
            {
                "issue_activity": {
                    "field": field,
                    "old_value": "",
                    "new_value": new_value,
                    "activity_time": "2026-08-20T10:43:11",
                }
            }
        ]
    }

    redis = MagicMock()
    redis.get.return_value = BASE_API.encode()
    captured = {}

    class FakeMessage:
        def __init__(self, *a, **kw):
            pass

        def attach_alternative(self, content, mimetype):
            captured["html"] = content

        def send(self):
            pass

    with (
        patch("plane.bgtasks.email_notification_task.redis_instance", return_value=redis),
        patch("plane.bgtasks.email_notification_task.acquire_lock", return_value=True),
        patch("plane.bgtasks.email_notification_task.release_lock", return_value=True),
        patch("plane.bgtasks.email_notification_task.EmailMultiAlternatives", FakeMessage),
        patch("plane.bgtasks.email_notification_task.get_connection", return_value=MagicMock()),
        patch(
            "plane.bgtasks.email_notification_task.get_email_configuration",
            # (host, user, password, port, use_tls, use_ssl, from)
            return_value=("smtp.example.com", "user", "pass", "587", "0", "0", "noreply@example.com"),
        ),
    ):
        send_email_notification(
            issue_id=str(issue.id),
            notification_data=notification_data,
            receiver_id=str(receiver.id),
            email_notification_ids=[log.id],
        )
    return captured.get("html", "")


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("field,new_value", ACTOR_DETAIL_PATHS)
def test_actor_without_avatar_does_not_get_a_broken_image(issue, actor_without_avatar, create_user, field, new_value):
    """No ``<base>/None`` image src anywhere in the mail, on any path."""
    html = _render(issue, actor_without_avatar, create_user, field=field, new_value=new_value)

    assert html, "the task should have rendered and attached an HTML body"
    assert f"{BASE_API}/None" not in html
    # Belt and braces: no img src anywhere may end in None.
    srcs = [chunk.split('"')[0] for chunk in html.split('src="')[1:]]
    assert not [s for s in srcs if s.endswith("None")], srcs


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("field,new_value", ACTOR_DETAIL_PATHS)
def test_actor_without_avatar_falls_back_to_initials(issue, actor_without_avatar, create_user, field, new_value):
    """The template's initials branch must actually be taken, on any path."""
    html = _render(issue, actor_without_avatar, create_user, field=field, new_value=new_value)

    # The initials circle renders the actor's first initial; "J" for Josh.
    assert ">J<" in html.replace(" ", "").replace("\n", "")


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("field,new_value", ACTOR_DETAIL_PATHS)
def test_actor_with_avatar_still_gets_the_image(issue, actor_without_avatar, create_user, field, new_value):
    """The guard must not suppress real avatars, on any path."""
    actor_without_avatar.avatar = "/uploads/avatar.png"
    actor_without_avatar.save(update_fields=["avatar"])

    html = _render(issue, actor_without_avatar, create_user, field=field, new_value=new_value)

    assert f"{BASE_API}/uploads/avatar.png" in html
