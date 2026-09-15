# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Stage review notifications on the existing notification pipeline (P1-REV-12)."""

from django.utils import timezone

from plane.db.models import Notification, User

RESEARCH_STAGE_REVIEW_ENTITY = "research_stage_review"


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
                    "action": action,
                    **(extra or {}),
                },
                entity_identifier=instance.id,
                entity_name=RESEARCH_STAGE_REVIEW_ENTITY,
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


def notify_review_assigned(instance, assignment, actor):
    receiver = User.objects.filter(pk=assignment.reviewer_id, is_active=True).first()
    return _create(
        instance,
        [receiver],
        actor=actor,
        action="review_assigned",
        title=f"科研阶段待评审：{instance.stage}",
        extra={"is_required": assignment.is_required, "reviewer_role": assignment.reviewer_role},
    )


def notify_review_reminded(instance, assignment, actor, message=""):
    receiver = User.objects.filter(pk=assignment.reviewer_id, is_active=True).first()
    return _create(
        instance,
        [receiver],
        actor=actor,
        action="review_reminded",
        title=f"科研阶段评审催办：{instance.stage}",
        extra={"message": (message or "")[:500]},
    )


def notify_review_submitted(instance, review, actor, owner_id):
    receivers = [User.objects.filter(pk=owner_id, is_active=True).first()] if owner_id else []
    return _create(
        instance,
        receivers,
        actor=actor,
        action="review_submitted",
        title=f"科研阶段评审完成：{instance.stage}",
        extra={"recommendation": review.recommendation, "reviewer_role": review.reviewer_role},
    )
