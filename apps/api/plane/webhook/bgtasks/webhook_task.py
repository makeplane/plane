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

import logging

# third party imports
from celery import shared_task

# plane imports
# from plane.db.models import Webhook

logger = logging.getLogger("plane.webhook")


@shared_task
def process_webhook_event(body: dict):
    """
    Process a webhook event from the event stream.
    """
    logger.info("Processing webhook event: ", extra={"body": body})
