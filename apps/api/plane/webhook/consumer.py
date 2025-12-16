import logging

from plane.event_stream.consumer import BaseConsumer


logger = logging.getLogger(__name__)


class WebhookConsumer(BaseConsumer):
    """Simple automation consumer for processing events from plane_event_stream."""

    def __init__(self, queue_name: str = None, prefetch_count: int = 10):
        """Initialize the automation consumer."""
        logger.info(f"WebhookConsumer initialized for queue '{self.queue_name}'")
        super().__init__(queue_name, prefetch_count)

    def process_message(self, body):
        """Process a message from the queue."""
        logger.info(f"Processing message: {body}")

        return True
