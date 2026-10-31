# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Module imports
from plane.team_ops.models import CalendarAudit


def build_audit(
    *,
    workspace,
    entity,
    action,
    changed_by=None,
    subject_user_id=None,
    work_date=None,
    old=None,
    new=None,
):
    """An unsaved audit row. `old` / `new` are JSON-serialisable (dates and times are fine)."""
    return CalendarAudit(
        workspace=workspace,
        entity=entity,
        action=action,
        changed_by=changed_by,
        subject_user_id=subject_user_id,
        work_date=work_date,
        old_value=old,
        new_value=new,
    )


def record_audit(**kwargs):
    audit = build_audit(**kwargs)
    audit.save()
    return audit


def record_audits(rows):
    """Write many audit rows in one query."""
    return CalendarAudit.objects.bulk_create(list(rows))
