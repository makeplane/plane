# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from celery import shared_task

from plane.mail.models import Mailbox
from plane.mail.sieve import sync_sieve
from plane.utils.exception_logger import log_exception


@shared_task
def sync_sieve_task(mailbox_id):
    """Recompile and upload a mailbox's Sieve script after a config change."""
    try:
        mailbox = Mailbox.objects.get(pk=mailbox_id, is_active=True)
    except Mailbox.DoesNotExist:
        return
    try:
        sync_sieve(mailbox)
    except Exception as error:
        # A ManageSieve outage must not break the API response; the next config
        # change re-triggers the sync.
        log_exception(error)
