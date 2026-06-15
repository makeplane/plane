# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from celery import shared_task

from plane.mail.client import MailClient
from plane.mail.models import Mailbox
from plane.utils.exception_logger import log_exception


@shared_task
def send_mail_task(mailbox_id, payload, actor_id=None):
    try:
        mailbox = Mailbox.objects.get(pk=mailbox_id, is_active=True)
        MailClient(mailbox).send(payload)
    except Exception as error:
        log_exception(error)
        raise
