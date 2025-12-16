import logging

from plane.event_stream.consumer import BaseConsumer


logger = logging.getLogger(__name__)


class WebhookConsumer(BaseConsumer):
    """Simple automation consumer for processing events from plane_event_stream."""

    def __init__(self, queue_name: str = None, prefetch_count: int = 10):
        """Initialize the automation consumer."""
        super().__init__(queue_name, prefetch_count)
        logger.info(f"WebhookConsumer initialized for queue '{self.queue_name}'")

    def process_message(self, properties, body):
        """Process a message from the queue."""
        logger.info(f"WebhookConsumer processing message: {body}")

        return True
