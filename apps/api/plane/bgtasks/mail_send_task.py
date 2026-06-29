# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from celery import shared_task
from django.utils import timezone

from plane.mail.client import MailClient
from plane.mail.models import Mailbox, MailOutboundMessage
from plane.utils.exception_logger import log_exception


@shared_task
def send_mail_task(outbound_id, payload=None, actor_id=None):
    if payload is not None:
        return _send_legacy_payload(outbound_id, payload)

    outbound = MailOutboundMessage.objects.select_related("mailbox").get(pk=outbound_id)
    outbound.status = MailOutboundMessage.STATUS_SENDING
    outbound.error = ""
    outbound.save(update_fields=["status", "error", "updated_at"])

    try:
        MailClient(outbound.mailbox).send(outbound.payload)
    except Exception as error:
        outbound.status = MailOutboundMessage.STATUS_FAILED
        outbound.error = str(error)
        outbound.save(update_fields=["status", "error", "updated_at"])
        log_exception(error)
        raise

    outbound.status = MailOutboundMessage.STATUS_SENT
    outbound.sent_at = timezone.now()
    outbound.error = ""
    outbound.save(update_fields=["status", "sent_at", "error", "updated_at"])
    return {"sent": True, "outbound_id": str(outbound.id)}


def _send_legacy_payload(mailbox_id, payload):
    try:
        mailbox = Mailbox.objects.get(pk=mailbox_id, is_active=True)
        return MailClient(mailbox).send(payload)
    except Exception as error:
        log_exception(error)
        raise
