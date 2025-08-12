# Standard Library imports
import json
import logging
import signal
import time

# Third Party imports
import pika
from django.db import IntegrityError
from django.conf import settings

# Module imports
from plane.ee.models.automation import ProcessedAutomationEvent
from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane.automations.consumer")


class AutomationConsumer:
    """Simple automation consumer for processing events from plane_event_stream."""

    def __init__(self, queue_name: str = None, prefetch_count: int = 10):
        """Initialize the automation consumer."""
        self.queue_name = queue_name or getattr(
            settings,
            "AUTOMATION_EVENT_STREAM_QUEUE_NAME",
            "plane.event_stream.automations",
        )
        self.exchange_name = getattr(
            settings, "AUTOMATION_EXCHANGE_NAME", "plane.event_stream"
        )
        self.prefetch_count = prefetch_count

        # Consumer state
        self._should_stop = False
        self._consumer_tag = None
        self._inflight_messages = 0

        # Setup
        self._setup_connection_params()
        self._setup_signal_handlers()

        logger.info(f"AutomationConsumer initialized for queue '{self.queue_name}'")

    def _setup_connection_params(self):
        """Set up RabbitMQ connection parameters."""
        if hasattr(settings, "AMQP_URL") and settings.AMQP_URL:
            self.connection_params = pika.URLParameters(settings.AMQP_URL)
        else:
            host = getattr(settings, "RABBITMQ_HOST", "localhost")
            port = int(getattr(settings, "RABBITMQ_PORT", 5672))
            username = getattr(settings, "RABBITMQ_USER", "guest")
            password = getattr(settings, "RABBITMQ_PASSWORD", "guest")
            virtual_host = getattr(settings, "RABBITMQ_VHOST", "/")

            self.connection_params = pika.ConnectionParameters(
                host=host,
                port=port,
                virtual_host=virtual_host,
                credentials=pika.PlainCredentials(username, password),
                heartbeat=600,
            )

    def _setup_signal_handlers(self):
        """Set up signal handlers for graceful shutdown."""

        def signal_handler(signum, frame):
            logger.info("Received shutdown signal, stopping consumer...")
            self._should_stop = True

        signal.signal(signal.SIGTERM, signal_handler)
        signal.signal(signal.SIGINT, signal_handler)

    def _setup_queues(self, channel):
        """Set up the automation queue bound to plane_event_stream exchange."""
        # Connect to existing exchange
        channel.exchange_declare(
            exchange=self.exchange_name,
            exchange_type="fanout",
            durable=True,
            passive=False,  # Declare/create if it doesn't exist
        )

        # Ensure the DLQ exchange exists
        # TODO: should be removed
        dlq_exchange_name = "plane_event_stream_dlq"
        channel.exchange_declare(
            exchange=dlq_exchange_name,
            exchange_type="fanout",
            durable=True,
            passive=False,
        )

        # Declare automation queue with simple DLQ
        dlq_name = f"{self.queue_name}_dlq"

        # DLQ with 7-day TTL to match existing configuration
        # TODO: Set the TTL to 1 day and move the value to the settings
        channel.queue_declare(
            queue=dlq_name,
            durable=True,
            arguments={
                "x-message-ttl": 604800000,  # 7 days TTL
            },
        )

        # Main queue with DLQ setup to match existing configuration
        # TODO: Set the TTL to 1 hour and move the value to the settings
        channel.queue_declare(
            queue=self.queue_name,
            durable=True,
            arguments={
                "x-dead-letter-exchange": dlq_exchange_name,
                "x-dead-letter-routing-key": dlq_name,
                "x-message-ttl": 3600000,  # 1 hour TTL
            },
        )

        # Bind to fanout exchange
        channel.queue_bind(exchange=self.exchange_name, queue=self.queue_name)

        logger.info(
            f"Queue '{self.queue_name}' bound to exchange '{self.exchange_name}'"
        )

    def _should_process(self, event_type: str) -> bool:
        """Check if event should be processed for automations."""
        automation_event_types = getattr(settings, "AUTOMATION_EVENT_TYPES", ["issue."])

        for prefix in automation_event_types:
            if not prefix.endswith("."):
                prefix += "."
            if event_type.startswith(prefix):
                return True
        return False

    def process_message(self, channel, method, properties, body) -> bool:
        """Process a single automation event."""
        self._inflight_messages += 1

        try:
            # Parse message
            event_data = json.loads(body.decode("utf-8"))
            event_id = event_data.get("event_id")
            event_type = event_data.get("event_type")
            initiator_type = event_data.get("initiator_type")

            if not event_id or not event_type:
                logger.error(f"Invalid message format: {event_data}")
                return False

            # Ignore system-originated events
            if initiator_type and initiator_type.startswith("SYSTEM."):
                logger.info(f"Skipping system-originated event {event_id}")
                return True

            # Filter events
            if not self._should_process(event_type):
                logger.debug(f"Skipping event: {event_type}")
                return True

            # Ensure exactly-once processing
            try:
                ProcessedAutomationEvent.objects.create(
                    event_id=event_id, event_type=event_type, status="pending"
                )
            except IntegrityError:
                logger.debug(f"Event {event_id} already processed")
                return True

            # Dispatch to Celery
            from plane.automations.tasks import execute_automation_task

            task_result = execute_automation_task.delay(event_data)

            ProcessedAutomationEvent.objects.filter(event_id=event_id).update(
                task_id=task_result.id
            )

            logger.info(f"Dispatched automation for {event_id} ({event_type})")
            return True

        except Exception as e:
            logger.error(f"Error processing message: {e}")
            log_exception(e)
            return False
        finally:
            self._inflight_messages -= 1

    def start_consuming(self):
        """Start consuming automation events."""
        retry_count = 0
        max_retries = 3

        while not self._should_stop and retry_count < max_retries:
            try:
                with pika.BlockingConnection(self.connection_params) as connection:
                    with connection.channel() as channel:
                        channel.basic_qos(prefetch_count=self.prefetch_count)
                        self._setup_queues(channel)

                        retry_count = 0  # Reset on successful connection

                        # Setup message consumer
                        def message_callback(ch, method, properties, body):
                            success = self.process_message(ch, method, properties, body)
                            if success:
                                ch.basic_ack(delivery_tag=method.delivery_tag)
                            else:
                                ch.basic_nack(
                                    delivery_tag=method.delivery_tag, requeue=False
                                )

                        self._consumer_tag = channel.basic_consume(
                            queue=self.queue_name, on_message_callback=message_callback
                        )

                        logger.info(f"Started consuming from '{self.queue_name}'")

                        # Consume messages
                        while not self._should_stop:
                            # TODO: Move the magic number to a variable at the top of the file
                            connection.process_data_events(time_limit=1.0)

                        # Graceful shutdown
                        if self._consumer_tag:
                            channel.basic_cancel(self._consumer_tag)

                        # Wait for in-flight messages
                        # TODO: Move the magic number to a variable at the top of the file
                        while self._inflight_messages > 0:
                            time.sleep(0.1)

            except KeyboardInterrupt:
                self._should_stop = True
            except Exception as e:
                logger.error(f"Connection error: {e}")
                retry_count += 1
                if retry_count < max_retries:
                    time.sleep(5 * retry_count)  # Exponential backoff

        logger.info("Consumer stopped")
