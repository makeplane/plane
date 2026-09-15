# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Experiment notifications on the existing notification pipeline (P1-EXP-14)."""

from django.utils import timezone

from plane.db.models import Notification, User
from plane.research.utils.acl import direct_advisor_ids

RESEARCH_EXPERIMENT_ENTITY = "research_experiment"
RESEARCH_AMENDMENT_ENTITY = "research_experiment_amendment"


def _create(workspace_id, project_id, entity_id, entity_name, receivers, *, actor, title, data):
    created = []
    for receiver in receivers:
        if receiver is None or receiver == actor:
            continue
        created.append(
            Notification(
                workspace_id=workspace_id,
                project_id=project_id,
                data=data,
                entity_identifier=entity_id,
                entity_name=entity_name,
                title=title,
                message={"at": timezone.now().isoformat(), **data},
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


def approver_ids(record):
    """Direct advisors and the managing roles that may approve amendments."""
    from plane.db.models import OrgUnitMember, ResearchProjectProfile

    ids = set(direct_advisor_ids(record.owner_id, record.workspace_id))
    profile = ResearchProjectProfile.objects.filter(project_id=record.project_id).first()
    if profile and profile.org_unit_id:
        ids |= set(
            OrgUnitMember.objects.filter(
                workspace_id=record.workspace_id,
                org_unit_id=profile.org_unit_id,
                org_role__in=("PI", "OWNER", "UNIT_ADMIN"),
                deleted_at__isnull=True,
            ).values_list("user_id", flat=True)
        )
    ids.discard(None)
    return list(User.objects.filter(id__in=ids, is_active=True))


def notify_experiment_submitted(record, actor):
    return _create(
        record.workspace_id,
        record.project_id,
        record.id,
        RESEARCH_EXPERIMENT_ENTITY,
        approver_ids(record),
        actor=actor,
        title=f"实验已提交：# {record.sequence_no} {record.title}",
        data={"action": "submitted", "experiment_id": str(record.id), "sequence_no": record.sequence_no},
    )


def notify_amendment_created(record, amendment, actor):
    return _create(
        record.workspace_id,
        record.project_id,
        amendment.id,
        RESEARCH_AMENDMENT_ENTITY,
        approver_ids(record),
        actor=actor,
        title=f"实验修订待审核：# {record.sequence_no} {record.title}",
        data={
            "action": "amendment_created",
            "experiment_id": str(record.id),
            "amendment_id": str(amendment.id),
        },
    )


def notify_amendment_reviewed(record, amendment, actor, *, approved):
    receiver = User.objects.filter(pk=amendment.requested_by_id, is_active=True).first()
    return _create(
        record.workspace_id,
        record.project_id,
        amendment.id,
        RESEARCH_AMENDMENT_ENTITY,
        [receiver],
        actor=actor,
        title=f"实验修订{'已通过' if approved else '被拒绝'}：# {record.sequence_no}",
        data={
            "action": "amendment_approved" if approved else "amendment_rejected",
            "experiment_id": str(record.id),
            "amendment_id": str(amendment.id),
        },
    )
