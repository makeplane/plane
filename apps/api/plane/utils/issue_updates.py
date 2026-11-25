# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""What has to happen after a work item was changed through a request."""

# Python imports
import json

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

# Module imports
from plane.bgtasks.issue_activities_task import issue_activity
from plane.bgtasks.webhook_task import model_activity
from plane.utils.host import base_host


def record_issue_update(request, slug, project_id, issue_id, requested_data, current_instance, subscriber=True):
    """Queue the history, the notifications and the webhooks of an update."""
    issue_activity.delay(
        type="issue.activity.updated",
        requested_data=json.dumps(requested_data, cls=DjangoJSONEncoder),
        actor_id=str(request.user.id),
        issue_id=str(issue_id),
        project_id=str(project_id),
        current_instance=current_instance,
        epoch=int(timezone.now().timestamp()),
        notification=True,
        origin=base_host(request=request, is_app=True),
        subscriber=subscriber,
    )
    model_activity.delay(
        model_name="issue",
        model_id=str(issue_id),
        requested_data=requested_data,
        current_instance=current_instance,
        actor_id=request.user.id,
        slug=slug,
        origin=base_host(request=request, is_app=True),
    )
