# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""``stack_email_notification`` must hand each per-issue email only that issue's log ids.

Previously every email for a receiver got all of the receiver's log ids, so the
concurrent send tasks updated the same ``email_notification_logs`` rows and
deadlocked (and the first email marked every issue's logs as sent).
"""

from unittest import mock
from uuid import uuid4

import pytest

from plane.bgtasks.email_notification_task import stack_email_notification
from plane.db.models import EmailNotificationLog


@pytest.mark.unit
@pytest.mark.django_db
def test_each_email_gets_only_its_issue_log_ids(create_user):
    issue_a, issue_b = uuid4(), uuid4()
    logs = {
        issue: [
            EmailNotificationLog.objects.create(
                receiver=create_user,
                triggered_by=create_user,
                entity_identifier=issue,
                entity_name="issue",
                entity="issue",
                data={},
            ).id
            for _ in range(2)
        ]
        for issue in (issue_a, issue_b)
    }

    with mock.patch("plane.bgtasks.email_notification_task.send_email_notification.delay") as delay:
        stack_email_notification()

    sent = {call.kwargs["issue_id"]: sorted(call.kwargs["email_notification_ids"]) for call in delay.call_args_list}
    assert sent == {issue: sorted(ids) for issue, ids in logs.items()}
    assert not EmailNotificationLog.objects.filter(processed_at__isnull=True).exists()
