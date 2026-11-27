# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# - A new work item queues the web push task once the transaction commits, so the request that created it
#   (app, /api/v1/ with an API key, MCP) never waits for push services. Issue.save() runs its own atomic
#   block, so the callback may run at the end of save(): it is robust (a broker failure is logged, the work
#   item is still created) and the receiver itself never raises.
# - Work items of one project are coalesced on the server (LIVIERE_PUSH_COALESCE_SECONDS, default 15 s): the first
#   committed work item of a project takes a cache key (cache.add) and queues one task for the project with a
#   countdown of the window; work items committed while the key exists queue nothing, the task counts them all.
#   Replacing a notification by its tag is not enough: Windows keeps one entry in the notification centre but pops
#   the toast up again on every replacement (3 work items = 3 pop-ups), see plane/liviere/push/notify.py.
#   Window 0 = the old behaviour, one task per work item.
# - Signing out removes the person's push subscriptions: the browser that signed out must not keep getting
#   project names and work item titles. The browser cannot be told apart from the person's other browsers,
#   so all of them stop; the web app subscribes the browser again after the next sign-in (liviere/push).

# Python imports
from datetime import timedelta

# Django imports
from django.contrib.auth.signals import user_logged_out
from django.core.cache import cache
from django.db import transaction
from django.db.models.signals import post_save
from django.utils import timezone

# Module imports
from plane.db.models import Issue
from plane.liviere.push.config import coalesce_seconds, push_available
from plane.utils.exception_logger import log_exception

# A work item saved a moment earlier but committed later than the one that opened the window still counts as new
# in it (see notify_project_work_items)
SINCE_SLACK = timedelta(seconds=5)


def pending_key(project_id):
    return f"liviere-push-pending-{project_id}"


def queue_push(issue_id, project_id, since):
    """Runs after the commit: queues the push task, coalescing the work items of a project.

    The key lives two windows: long enough to survive a busy worker, short enough that a lost task silences the
    project for at most that long. The task deletes it before reading anything (plane/liviere/tasks.py)."""
    from plane.liviere.tasks import notify_new_work_item, notify_project_work_items

    window = coalesce_seconds()
    if window <= 0:
        notify_new_work_item.delay(issue_id)
        return
    key = pending_key(project_id)
    try:
        first = cache.add(key, 1, timeout=2 * window)
    except Exception as e:
        # Without the cache coalescing is off, but the notification still goes out
        log_exception(e)
        first = True
    if not first:
        return
    try:
        notify_project_work_items.apply_async(args=[project_id, since.isoformat()], countdown=window)
    except Exception:
        # The key must not keep the project silent when nothing was queued
        try:
            cache.delete(key)
        except Exception as e:
            log_exception(e)
        raise


def queue_new_work_item_push(sender, instance, created, **kwargs):
    if not created or kwargs.get("raw"):
        return
    try:
        if instance.is_draft or not push_available():
            return
        issue_id, project_id = str(instance.id), str(instance.project_id)
        since = (instance.created_at or timezone.now()) - SINCE_SLACK
        # robust: an error (broker down) is logged by Django, the work item is still created
        transaction.on_commit(lambda: queue_push(issue_id, project_id, since), robust=True)
    except Exception as e:
        log_exception(e)


def remove_subscriptions_on_sign_out(sender, request, user, **kwargs):
    if user is None:
        return
    try:
        from plane.liviere.models import PushSubscription

        PushSubscription.objects.filter(user=user).delete()
    except Exception as e:
        log_exception(e)


def connect():
    post_save.connect(queue_new_work_item_push, sender=Issue, dispatch_uid="liviere_new_work_item_push")
    user_logged_out.connect(remove_subscriptions_on_sign_out, dispatch_uid="liviere_push_sign_out")
