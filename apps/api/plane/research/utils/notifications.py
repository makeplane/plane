# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Report notifications built on the existing notification pipeline.

No new delivery channel is introduced: rows land in the shared
``Notification`` table with ``entity_name = research_report`` so the existing
notification centre and email fan-out keep working (P0-RPT-12, P0-APR-06).
"""

from django.utils import timezone

from plane.db.models import Notification
from plane.research.utils.acl import direct_advisor_ids, org_unit_scope_ids

RESEARCH_REPORT_ENTITY = "research_report"
RESEARCH_APPROVAL_ENTITY = "research_approval"


def _notify(report, receivers, *, actor, title, message):
    created = []
    for receiver in receivers:
        if receiver is None or receiver == actor:
            continue
        created.append(
            Notification(
                workspace_id=report.workspace_id,
                project_id=report.project_id,
                data={
                    "report_id": str(report.id),
                    "period_key": report.period_key,
                    "report_type": report.report_type,
                    "status": report.status,
                },
                entity_identifier=report.id,
                entity_name=RESEARCH_REPORT_ENTITY,
                title=title,
                message=message,
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


def report_reviewer_ids(report):
    """Direct advisors plus the managing roles of the report's node."""
    from plane.db.models import OrgUnitMember, User

    receiver_ids = set(direct_advisor_ids(report.owner_id, report.workspace_id, report.org_unit_id))
    scope = org_unit_scope_ids(report.org_unit_id, report.workspace_id)
    if scope:
        receiver_ids |= set(
            OrgUnitMember.objects.filter(
                workspace_id=report.workspace_id,
                org_unit_id__in=scope,
                org_role__in=("PI", "OWNER", "UNIT_ADMIN"),
                deleted_at__isnull=True,
            ).values_list("user_id", flat=True)
        )
    receiver_ids.discard(report.owner_id)
    return list(User.objects.filter(id__in=receiver_ids, is_active=True))


def notify_report_submitted(report, actor):
    return _notify(
        report,
        report_reviewer_ids(report),
        actor=actor,
        title=f"{report.period_key} 报告已提交",
        message={
            "action": "submitted",
            "period_key": report.period_key,
            "owner": str(report.owner_id),
            "submitted_at": timezone.now().isoformat(),
        },
    )


def notify_report_returned(report, actor, comment=""):
    from plane.db.models import User

    owner = User.objects.filter(pk=report.owner_id, is_active=True).first()
    return _notify(
        report,
        [owner] if owner else [],
        actor=actor,
        title=f"{report.period_key} 报告被退回",
        message={
            "action": "returned",
            "period_key": report.period_key,
            "comment": comment[:500],
            "reviewer": str(actor.id),
        },
    )


def notify_report_accepted(report, actor):
    from plane.db.models import User

    owner = User.objects.filter(pk=report.owner_id, is_active=True).first()
    return _notify(
        report,
        [owner] if owner else [],
        actor=actor,
        title=f"{report.period_key} 报告已验收",
        message={
            "action": "accepted",
            "period_key": report.period_key,
            "reviewer": str(actor.id),
        },
    )
