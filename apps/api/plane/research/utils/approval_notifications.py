# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.db.models import Notification

from .approvals import pending_approver_users
from .notifications import RESEARCH_APPROVAL_ENTITY


def notify_approvers(request, actor, title):
    for receiver in pending_approver_users(request):
        if receiver.id == actor.id:
            continue
        Notification.objects.create(
            workspace_id=request.flow.workspace_id,
            project_id=request.issue.project_id,
            data={
                "approval_request_id": str(request.id),
                "issue_id": str(request.issue_id),
                "step": request.current_step_order,
                "status": request.status,
            },
            entity_identifier=request.issue_id,
            entity_name=RESEARCH_APPROVAL_ENTITY,
            title=title,
            message={"action": "pending", "step": request.current_step_order},
            message_html=f"<p>{title}</p>",
            message_stripped=title,
            sender="research",
            triggered_by=actor,
            receiver=receiver,
        )


def notify_requester(request, actor, title, action):
    if not request.requested_by_id:
        return
    Notification.objects.create(
        workspace_id=request.flow.workspace_id,
        project_id=request.issue.project_id,
        data={
            "approval_request_id": str(request.id),
            "issue_id": str(request.issue_id),
            "status": request.status,
        },
        entity_identifier=request.issue_id,
        entity_name=RESEARCH_APPROVAL_ENTITY,
        title=title,
        message={"action": action, "actor": str(actor.id)},
        message_html=f"<p>{title}</p>",
        message_stripped=title,
        sender="research",
        triggered_by=actor,
        receiver_id=request.requested_by_id,
    )
