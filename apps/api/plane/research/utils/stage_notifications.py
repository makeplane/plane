# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Stage notifications on the existing notification pipeline (P1-STG-13).

No new delivery channel: rows land in the shared ``Notification`` table with a
new ``entity_name`` so the existing notification centre keeps working (T-06).
"""

from django.utils import timezone

from plane.db.models import Notification
from plane.research.utils.acl import direct_advisor_ids, org_unit_scope_ids

RESEARCH_STAGE_ENTITY = "research_stage"


def _create(instance, receivers, *, actor, action, title, extra=None):
    created = []
    for receiver in receivers:
        if receiver is None or receiver == actor:
            continue
        created.append(
            Notification(
                workspace_id=instance.workspace_id,
                project_id=instance.project_id,
                data={
                    "stage_id": str(instance.id),
                    "stage": instance.stage,
                    "stage_status": instance.status,
                    "action": action,
                    **(extra or {}),
                },
                entity_identifier=instance.id,
                entity_name=RESEARCH_STAGE_ENTITY,
                title=title,
                message={"action": action, "stage": instance.stage, "at": timezone.now().isoformat()},
                message_html=f"<p>{title}</p>",
                message_stripped=title,
                sender="research",
                triggered_by=actor,
                receiver=receiver,
            )
        )
    if created:
        Notification.objects.bulk_create(created, batch_size=100)
    return created


def stage_audience_ids(instance, owner_id):
    """The research owner, the reviewing roles and the project followers."""
    from plane.db.models import OrgUnitMember, ProjectMember, User

    receiver_ids = set(
        direct_advisor_ids(owner_id, instance.workspace_id, instance.org_unit_id)
    )
    scope = org_unit_scope_ids(instance.org_unit_id, instance.workspace_id)
    if scope:
        receiver_ids |= set(
            OrgUnitMember.objects.filter(
                workspace_id=instance.workspace_id,
                org_unit_id__in=scope,
                org_role__in=("PI", "OWNER", "UNIT_ADMIN"),
                deleted_at__isnull=True,
            ).values_list("user_id", flat=True)
        )
    receiver_ids |= set(
        ProjectMember.objects.filter(
            workspace_id=instance.workspace_id,
            project_id=instance.project_id,
            is_active=True,
        ).values_list("member_id", flat=True)
    )
    if owner_id:
        receiver_ids.add(owner_id)
    receiver_ids.discard(None)
    return list(User.objects.filter(id__in=receiver_ids, is_active=True))


def notify_stage_entered(instance, actor, owner_id):
    return _create(
        instance,
        stage_audience_ids(instance, owner_id),
        actor=actor,
        action="entered",
        title=f"科研阶段已进入：{instance.stage}",
    )


def notify_stage_submitted(instance, actor, owner_id):
    return _create(
        instance,
        stage_audience_ids(instance, owner_id),
        actor=actor,
        action="submitted",
        title=f"科研阶段已提交：{instance.stage}",
        extra={"attempt": instance.attempt_count},
    )


def notify_stage_returned(instance, actor, owner_id, reason=""):
    return _create(
        instance,
        stage_audience_ids(instance, owner_id),
        actor=actor,
        action="returned",
        title=f"科研阶段被退回：{instance.stage}",
        extra={"reason": (reason or "")[:500]},
    )


def notify_stage_passed(instance, actor, owner_id):
    return _create(
        instance,
        stage_audience_ids(instance, owner_id),
        actor=actor,
        action="passed",
        title=f"科研阶段已通过：{instance.stage}",
    )
