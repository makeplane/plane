# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# - A new work item queues the web push task once the transaction commits, so the request that created it
#   (app, /api/v1/ with an API key, MCP) never waits for push services. Issue.save() runs its own atomic
#   block, so the callback may run at the end of save(): it is robust (a broker failure is logged, the work
#   item is still created) and the receiver itself never raises.
# - Signing out removes the person's push subscriptions: the browser that signed out must not keep getting
#   project names and work item titles. The browser cannot be told apart from the person's other browsers,
#   so all of them stop; the web app subscribes the browser again after the next sign-in (liviere/push).

# Django imports
from django.contrib.auth.signals import user_logged_out
from django.db import transaction
from django.db.models.signals import post_save

# Module imports
from plane.db.models import Issue
from plane.liviere.push.config import push_available
from plane.utils.exception_logger import log_exception


def queue_new_work_item_push(sender, instance, created, **kwargs):
    if not created or kwargs.get("raw"):
        return
    try:
        if instance.is_draft or not push_available():
            return
        from plane.liviere.tasks import notify_new_work_item

        issue_id = str(instance.id)
        transaction.on_commit(lambda: notify_new_work_item.delay(issue_id), robust=True)
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
