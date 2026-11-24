# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Queues the web push task for a new work item once the transaction commits, so the request that created it
# (app, /api/v1/ with an API key, MCP) never waits for push services. Never raises into that request.

# Django imports
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
        transaction.on_commit(lambda: notify_new_work_item.delay(issue_id))
    except Exception as e:
        log_exception(e)


def connect():
    post_save.connect(queue_new_work_item_push, sender=Issue, dispatch_uid="liviere_new_work_item_push")
