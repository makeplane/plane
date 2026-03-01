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

from plane.event_stream.consumer import BaseConsumer
from plane.webhook.bgtasks import process_webhook_event

logger = logging.getLogger("plane.webhook")


class WebhookConsumer(BaseConsumer):
    """Simple webhook consumer for processing events from plane_event_stream."""

    def __init__(self, queue_name: str = None, prefetch_count: int = 10):
        """Initialize the webhook consumer."""
        super().__init__(queue_name, prefetch_count)
        logger.info(f"WebhookConsumer initialized for queue '{self.queue_name}'")

    def process_message(self, properties, body):
        """Process a message from the queue."""
        logger.info("WebhookConsumer processing message: ", extra={"body": body})
        process_webhook_event.delay(body=body)
        return True
