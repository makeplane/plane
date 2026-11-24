# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Who gets a push notification about a new work item, what it says and how a delivery is recorded.
#
# Recipients: people who chose the project for push (PushProject), except the author, who are active members
# allowed to see others' work items (same rules as "New", plane/liviere/unread/queries.py).
# A series of work items (an agent creating a parent with sub-items) gives one notification per project: the
# tag is per project, so a newer notification replaces the older one (no `renotify`: by the Notifications API the
# replacement does not alert again while the previous one is still shown). The title counts the recipient's
# new work items of the project at sending time; with one it names the work item and a click opens it, with
# more a click opens "New" filtered to the project.

# Python imports
import logging

# Django imports
from django.db.models import F
from django.utils import timezone

# Third party imports
import requests

# Module imports
from plane.db.models import Issue, Profile, ProjectMember
from plane.liviere.models import PushProject, PushSubscription
from plane.liviere.push import messages
from plane.liviere.push.webpush import InvalidSubscription, send
from plane.liviere.unread.queries import can_see_others, new_work_items

logger = logging.getLogger("plane.worker")

# Push services answer 404/410 for a subscription that expired or was revoked
GONE = (404, 410)


def language_of(user_id):
    return Profile.objects.filter(user_id=user_id).values_list("language", flat=True).first() or "en"


def recipients(issue):
    chosen = PushProject.objects.filter(project_id=issue.project_id).values_list("user_id", flat=True)
    rows = ProjectMember.objects.filter(
        project_id=issue.project_id, member_id__in=chosen, is_active=True
    ).select_related("project", "member")
    return [row.member for row in rows if can_see_others(row) and row.member_id != issue.created_by_id]


def message_for(user, issue):
    """The notification for one recipient, or None when the work item is not new for them."""
    project = issue.project
    items = new_work_items(user, issue.workspace_id, [issue.project_id])
    count = items.count()
    if count == 0:
        return None
    newest = items.order_by("-created_at").first()
    slug = issue.workspace.slug
    if count == 1:
        title = messages.single_title(project.identifier, newest.sequence_id, project.name)
        url = f"/{slug}/browse/{project.identifier}-{newest.sequence_id}/"
    else:
        title = messages.many_title(project.identifier, count, language_of(user.id))
        url = f"/{slug}/new-work-items?projects={project.id}"
    return {
        "title": title,
        "body": newest.name,
        "tag": f"liviere-new-{project.id}",
        "url": url,
        "count": count,
    }


def deliver(subscription, message, config):
    """Sends one message; removes a subscription the push service no longer knows. Returns the status or None."""
    try:
        status_code = send(subscription, message, config)
    except InvalidSubscription:
        subscription.delete()
        return None
    except (requests.RequestException, ValueError) as e:
        logger.warning("liviere push: delivery failed: %s", type(e).__name__)
        PushSubscription.objects.filter(pk=subscription.pk).update(failure_count=F("failure_count") + 1)
        return None
    if status_code in GONE:
        subscription.delete()
    elif 200 <= status_code < 300:
        PushSubscription.objects.filter(pk=subscription.pk).update(last_success_at=timezone.now(), failure_count=0)
    else:
        logger.warning("liviere push: push service answered %s", status_code)
        PushSubscription.objects.filter(pk=subscription.pk).update(failure_count=F("failure_count") + 1)
    return status_code


def delivered(status_code):
    return status_code is not None and 200 <= status_code < 300


def notify_new_work_item(issue_id, config):
    """Notifies the recipients about a new work item; returns the number of messages accepted by push services."""
    issue = Issue.issue_objects.filter(pk=issue_id).select_related("project", "workspace").first()
    if issue is None:
        return 0
    sent = 0
    for user in recipients(issue):
        subscriptions = list(PushSubscription.objects.filter(user=user))
        if not subscriptions:
            continue
        message = message_for(user, issue)
        if message is None:
            continue
        sent += sum(1 for subscription in subscriptions if delivered(deliver(subscription, message, config)))
    return sent


def send_test(user_id, config):
    title, body = messages.test_message(language_of(user_id))
    message = {"title": title, "body": body, "tag": "liviere-test", "url": "/"}
    return sum(
        1
        for subscription in PushSubscription.objects.filter(user_id=user_id)
        if delivered(deliver(subscription, message, config))
    )
