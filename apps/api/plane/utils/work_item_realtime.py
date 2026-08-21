# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json

from django.core.serializers.json import DjangoJSONEncoder

from plane.db.models import (
    CycleIssue,
    FileAsset,
    Issue,
    IssueAssignee,
    IssueLabel,
    IssueLink,
    ModuleIssue,
)
from plane.settings.redis import redis_instance
from plane.utils.exception_logger import log_exception

WORK_ITEM_REALTIME_CHANNEL_PREFIX = "plane:work-items:"

ACTIVITY_TYPE_TO_EVENT = {
    "issue.activity.created": "issue.created",
    "issue.activity.updated": "issue.updated",
    "issue.activity.deleted": "issue.deleted",
    "cycle.activity.created": "issue.updated",
    "cycle.activity.deleted": "issue.updated",
    "module.activity.created": "issue.updated",
    "module.activity.deleted": "issue.updated",
}


def work_item_realtime_channel(project_id) -> str:
    return f"{WORK_ITEM_REALTIME_CHANNEL_PREFIX}{project_id}"


def serialize_work_item(issue: Issue) -> dict:
    module_ids = list(
        ModuleIssue.objects.filter(issue_id=issue.id, deleted_at__isnull=True).values_list("module_id", flat=True)
    )
    cycle_id = (
        CycleIssue.objects.filter(issue_id=issue.id, deleted_at__isnull=True)
        .values_list("cycle_id", flat=True)
        .first()
    )
    label_ids = list(
        IssueLabel.objects.filter(issue_id=issue.id, deleted_at__isnull=True).values_list("label_id", flat=True)
    )
    assignee_ids = list(
        IssueAssignee.objects.filter(issue_id=issue.id, deleted_at__isnull=True).values_list(
            "assignee_id", flat=True
        )
    )
    sub_issues_count = Issue.issue_objects.filter(parent_id=issue.id).count()
    attachment_count = FileAsset.objects.filter(
        issue_id=issue.id,
        entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
        is_deleted=False,
    ).count()
    link_count = IssueLink.objects.filter(issue_id=issue.id).count()

    return {
        "id": str(issue.id),
        "name": issue.name,
        "state_id": str(issue.state_id) if issue.state_id else None,
        "sort_order": issue.sort_order,
        "completed_at": issue.completed_at,
        "estimate_point": str(issue.estimate_point_id) if issue.estimate_point_id else None,
        "priority": issue.priority,
        "start_date": issue.start_date,
        "target_date": issue.target_date,
        "sequence_id": issue.sequence_id,
        "project_id": str(issue.project_id) if issue.project_id else None,
        "parent_id": str(issue.parent_id) if issue.parent_id else None,
        "cycle_id": str(cycle_id) if cycle_id else None,
        "module_ids": [str(module_id) for module_id in module_ids],
        "label_ids": [str(label_id) for label_id in label_ids],
        "assignee_ids": [str(assignee_id) for assignee_id in assignee_ids],
        "sub_issues_count": sub_issues_count,
        "attachment_count": attachment_count,
        "link_count": link_count,
        "created_at": issue.created_at,
        "updated_at": issue.updated_at,
        "created_by": str(issue.created_by_id) if issue.created_by_id else "",
        "updated_by": str(issue.updated_by_id) if issue.updated_by_id else "",
        "is_draft": issue.is_draft,
        "archived_at": issue.archived_at,
        "type_id": str(issue.type_id) if getattr(issue, "type_id", None) else None,
    }


def build_work_item_realtime_event(activity_type: str, project_id, actor_id, issue_id) -> dict | None:
    event_type = ACTIVITY_TYPE_TO_EVENT.get(activity_type)
    if not event_type or not project_id or not issue_id:
        return None

    payload = {
        "type": event_type,
        "actor_id": str(actor_id) if actor_id else "",
        "project_id": str(project_id),
        "issue_id": str(issue_id),
        "issue": None,
    }

    if event_type != "issue.deleted":
        issue = Issue.objects.filter(pk=issue_id).first()
        if issue is None:
            return None
        payload["issue"] = serialize_work_item(issue)

    return payload


def publish_work_item_activity(activity_type: str, project_id, actor_id, issue_id) -> bool:
    try:
        event = build_work_item_realtime_event(activity_type, project_id, actor_id, issue_id)
        if event is None:
            return False

        ri = redis_instance()
        ri.publish(
            work_item_realtime_channel(project_id),
            json.dumps(event, cls=DjangoJSONEncoder),
        )
        return True
    except Exception as e:
        log_exception(e)
        return False
