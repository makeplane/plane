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

# Python imports
import logging

# Django imports
from django.db.models import F

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import Issue
from plane.utils.exception_logger import log_exception


logger = logging.getLogger("plane.worker")

BATCH_SIZE = 5000


@shared_task
def backfill_issue_last_activity_at():
    """Backfill last_activity_at from updated_at for issues where it is null."""
    total_updated = 0
    try:
        total_count = Issue.objects.filter(last_activity_at__isnull=True).count()
        logger.info(f"Found {total_count} issues to backfill")

        for offset in range(0, total_count, BATCH_SIZE):
            batch_ids = list(
                Issue.objects.filter(last_activity_at__isnull=True)
                .order_by("created_at")
                .values_list("id", flat=True)[:BATCH_SIZE]
            )
            if not batch_ids:
                break
            updated = Issue.objects.filter(id__in=batch_ids).update(
                last_activity_at=F("updated_at")
            )
            total_updated += updated
            logger.info(
                f"Backfilled last_activity_at for {updated} issues "
                f"(total: {total_updated}/{total_count})"
            )
    except Exception as e:
        logger.error(
            f"Failed backfilling last_activity_at after {total_updated} issues: {e}"
        )
        log_exception(e)
        raise

    logger.info(f"Backfill last_activity_at completed: {total_updated} issues updated")
