# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.


# Third party imports
from celery import shared_task

# Django imports
from django.conf import settings
from django.template.loader import render_to_string

# Module imports
from plane.bgtasks.email_notification_task import send_email
from plane.db.models import User
from plane.utils.email import generate_plain_text_from_html
from plane.utils.exception_logger import log_exception


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_auto_reminder_email_with_template(self, subscriber_id: str, context: list):
    try:
        if not context:
            return

        receiver = User.objects.filter(id=subscriber_id).first()
        if not receiver or not receiver.email:
            return

        web_base_url = settings.WEB_URL

        # Link directly to the work item for single reminders; fall back to the
        # notifications page when multiple work items are batched together.
        workspace_slug = context[0]["workspace"]["slug"]
        project_identifier = context[0]["project"]["identifier"]
        if len(context) == 1:
            workitem_sequence_id = context[0]["workitem"]["sequence_id"]
            entity_url = f"{web_base_url}/{workspace_slug}/browse/{project_identifier}-{workitem_sequence_id}"
        else:
            entity_url = f"{web_base_url}/{workspace_slug}/notifications"

        template_context = {
            "summary": "Reminder for your workitem",
            "data": context,
            "receiver": {"email": receiver.email},
            "entity_url": entity_url,
            "user_preference": f"{web_base_url}/{workspace_slug}/settings/account/notifications/",
        }

        template_name = "emails/automation/workitem-auto-reminder.html"
        html_content = render_to_string(template_name, template_context)
        text_content = generate_plain_text_from_html(html_content)

        send_email(
            subject="Workitem Auto Reminder",
            text_content=text_content,
            receiver=receiver,
            html_content=html_content,
            # Auto-reminder emails are not tied to individual notification log rows.
            email_notification_ids=[],
        )
    except Exception as e:
        log_exception(e)
        raise self.retry(exc=e)
