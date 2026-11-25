# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Who gets a push notification about new work items, what it says and how a delivery is recorded.
#
# Recipients: people who chose the project for push (PushProject) who are active members allowed to see others'
# work items (same rules as "New", plane/liviere/unread/queries.py). Own work items are never new for anyone
# (new_work_items excludes them), so the author gets nothing about them.
#
# A series of work items (an agent creating a parent with sub-items) gives one notification per project:
# - On the server (plane/liviere/push/signals.py): the work items of a project committed within
#   LIVIERE_PUSH_COALESCE_SECONDS (default 15 s) are sent by one task, notify_project_work_items.
# - In the browser: the tag is per project, so a newer notification replaces the older one. That alone is not
#   enough: Windows keeps one entry in the notification centre, but pops the toast up again on every replacement
#   (live test: 3 work items in 6 s gave 3 pop-ups), even without `renotify`. Hence the coalescing on the server.
# The title counts the recipient's new work items of the project at sending time; with one it names the work item
# and a click opens it, with more a click opens "New" filtered to the project.
# Python imports
import logging

# Django imports
from django.db.models import F
from django.utils import timezone

# Module imports
from plane.db.models import Issue, Profile, Project, ProjectMember
from plane.liviere.models import PushProject, PushSubscription
from plane.liviere.push import messages
from plane.liviere.push.webpush import InvalidSubscription, send
from plane.liviere.unread.queries import can_see_others, new_work_items

logger = logging.getLogger("plane.worker")

# Push services answer 404/410 for a subscription that expired or was revoked, and 400/403 when it does not
# match our keys (e.g. after the VAPID keys changed): the subscription is useless, remove it
GONE = (400, 403, 404, 410)
# A subscription that failed this many times in a row is removed as well
MAX_FAILURES = 5


def language_of(user_id):
    return Profile.objects.filter(user_id=user_id).values_list("language", flat=True).first() or "en"


def project_recipients(project_id):
    chosen = PushProject.objects.filter(project_id=project_id).values_list("user_id", flat=True)
    rows = ProjectMember.objects.filter(project_id=project_id, member_id__in=chosen, is_active=True).select_related(
        "project", "member"
    )
    return [row.member for row in rows if can_see_others(row)]


def recipients(issue):
    return [user for user in project_recipients(issue.project_id) if user.id != issue.created_by_id]


def project_message(user, project, since=None):
    """The notification for one recipient, or None when nothing is new for them.

    With `since`, only when at least one of their new work items was created from then on: an older unread item
    alone (e.g. when the window was opened by their own work item) gives no notification."""
    items = new_work_items(user, project.workspace_id, [project.id])
    if since is not None and not items.filter(created_at__gte=since).exists():
        return None
    count = items.count()
    if count == 0:
        return None
    newest = items.order_by("-created_at").first()
    slug = project.workspace.slug
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


def message_for(user, issue):
    """The notification about one work item for one recipient, or None when nothing is new for them."""
    return project_message(user, issue.project)


def record_failure(subscription):
    if subscription.failure_count + 1 >= MAX_FAILURES:
        subscription.delete()
        return
    PushSubscription.objects.filter(pk=subscription.pk).update(failure_count=F("failure_count") + 1)


def deliver(subscription, message, config):
    """Sends one message; removes a subscription that is gone or keeps failing. Returns the status or None.

    Never raises: one broken subscription must not stop the others."""
    try:
        status_code = send(subscription, message, config)
    except InvalidSubscription:
        subscription.delete()
        return None
    except Exception as e:
        # Network errors, blocked addresses, encryption or JWT errors – only the type is logged
        logger.warning("liviere push: delivery failed: %s", type(e).__name__)
        record_failure(subscription)
        return None
    if status_code in GONE:
        subscription.delete()
    elif 200 <= status_code < 300:
        PushSubscription.objects.filter(pk=subscription.pk).update(last_success_at=timezone.now(), failure_count=0)
    else:
        logger.warning("liviere push: push service answered %s", status_code)
        record_failure(subscription)
    return status_code


def delivered(status_code):
    return status_code is not None and 200 <= status_code < 300


def send_to(user, message_of, config):
    """Sends the recipient's message to all their browsers; returns the number accepted by push services."""
    subscriptions = list(PushSubscription.objects.filter(user=user))
    if not subscriptions:
        return 0
    message = message_of(user)
    if message is None:
        return 0
    return sum(1 for subscription in subscriptions if delivered(deliver(subscription, message, config)))


def notify_new_work_item(issue_id, config):
    """Notifies the recipients about one new work item (coalescing off); returns the messages accepted."""
    issue = Issue.issue_objects.filter(pk=issue_id).select_related("project__workspace").first()
    if issue is None:
        return 0
    return sum(send_to(user, lambda user: message_for(user, issue), config) for user in recipients(issue))


def notify_project_work_items(project_id, since, config):
    """Notifies the recipients about the project's work items created from `since` on (one window of coalescing);
    returns the messages accepted. Drafts, triage, archived or deleted work items are never counted."""
    project = Project.objects.filter(pk=project_id).select_related("workspace").first()
    if project is None:
        return 0
    return sum(
        send_to(user, lambda user: project_message(user, project, since), config)
        for user in project_recipients(project_id)
    )


def send_test(user_id, config):
    title, body = messages.test_message(language_of(user_id))
    message = {"title": title, "body": body, "tag": "liviere-test", "url": "/"}
    return sum(
        1
        for subscription in PushSubscription.objects.filter(user_id=user_id)
        if delivered(deliver(subscription, message, config))
    )
