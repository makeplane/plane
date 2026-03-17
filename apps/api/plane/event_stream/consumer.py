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

import sys
import time
import os
import pika
import signal
import logging
from pika.exceptions import ProbableAuthenticationError

from django.db import close_old_connections, connection
from django.db.utils import OperationalError

from plane.utils.exception_logger import log_exception

logger = logging.getLogger(__name__)


class BaseConsumer:
    """Simple base consumer for processing events from plane_event_stream."""

    def __init__(
        self,
        queue_name: str = None,
        prefetch_count: int = 10,
        consumer_time_limit: float = 1.0,
        consumer_backoff_delay: float = 0.1,
    ):
        """Initialize the base consumer."""
        self.queue_name = queue_name

        if not self.queue_name:
            raise ValueError("queue_name must be provided")

        self.exchange_name = "plane.event_stream"
        self.dlq_exchange_name = "plane.event_stream.dlq"

        self.queue_message_ttl = os.environ.get("EVENT_STREAM_QUEUE_MESSAGE_TTL", 3600000)
        self.dlq_message_ttl = os.environ.get("EVENT_STREAM_DLQ_MESSAGE_TTL", 604800000)

        self.consumer_time_limit = consumer_time_limit
        self.consumer_backoff_delay = consumer_backoff_delay

        self.dlq_name = f"{self.queue_name}_dlq"

        self.prefetch_count = prefetch_count

        # Consumer state
        self._should_stop = False
        self._consumer_tag = None
        self._inflight_messages = 0

        # Setup
        self._setup_connection_params()
        self._setup_signal_handlers()

        logger.info(f"BaseConsumer initialized for queue '{self.queue_name}'")

    def _setup_connection_params(self):
        """Set up RabbitMQ connection parameters from Django settings or AWS Secrets Manager."""
        from plane.utils.amqp import get_amqp_connection_params

        self.connection_params = get_amqp_connection_params()

    def _setup_signal_handlers(self):
        """Set up signal handlers for graceful shutdown."""

        def signal_handler(signum, frame):
            logger.info("Received shutdown signal, stopping consumer...")
            self._should_stop = True

        signal.signal(signal.SIGTERM, signal_handler)
        signal.signal(signal.SIGINT, signal_handler)

    def ensure_database_connection(self):
        """Ensure database connection is alive, reconnect if necessary."""
        try:
            if not connection.is_usable():
                close_old_connections()
        except Exception as e:
            logger.warning(f"Database connection lost, reconnecting... {e}")
            close_old_connections()

    def _setup_queues(self, channel):
        """Set up the base queue bound to the event stream exchange."""
        # Connect to existing exchange
        channel.exchange_declare(
            exchange=self.exchange_name,
            exchange_type="fanout",
            durable=True,
            passive=False,  # Declare/create if it doesn't exist
        )

        # Ensure the DLQ exchange exists
        channel.exchange_declare(
            exchange=self.dlq_exchange_name,
            exchange_type="fanout",
            durable=True,
            passive=False,
        )

        # DLQ with 7-day TTL to match existing configuration
        channel.queue_declare(
            queue=self.dlq_name,
            durable=True,
            arguments={
                "x-message-ttl": self.dlq_message_ttl,  # 7 days TTL
            },
        )

        # Main queue with DLQ setup to match existing configuration
        channel.queue_declare(
            queue=self.queue_name,
            durable=True,
            arguments={
                "x-dead-letter-exchange": self.dlq_exchange_name,
                "x-dead-letter-routing-key": self.dlq_name,
                "x-message-ttl": self.queue_message_ttl,  # 1 hour TTL
            },
        )

        # Bind to fanout exchange
        channel.queue_bind(exchange=self.exchange_name, queue=self.queue_name)

        logger.info(f"Queue '{self.queue_name}' bound to exchange '{self.exchange_name}'")

    def process_message(self, properties, body):
        """
        Process a message from the queue. Implement this method in the subclass.
        """
        raise NotImplementedError("process_message must be implemented in the subclass")

    def start_consuming(self):
        """Start consuming events from the queue."""
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
                            success = self.process_message(properties, body)
                            if success:
                                logger.info("Message acknowledged...")
                                ch.basic_ack(delivery_tag=method.delivery_tag)
                            else:
                                logger.info("Message not acknowledged...")
                                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

                        self._consumer_tag = channel.basic_consume(
                            queue=self.queue_name, on_message_callback=message_callback
                        )

                        logger.info(f"Started consuming from '{self.queue_name}'")

                        # Consume messages
                        while not self._should_stop:
                            connection.process_data_events(time_limit=self.consumer_time_limit)

                        # Graceful shutdown
                        if self._consumer_tag:
                            channel.basic_cancel(self._consumer_tag)

                        # Wait for in-flight messages
                        while self._inflight_messages > 0:
                            time.sleep(self.consumer_backoff_delay)

            except KeyboardInterrupt:
                self._should_stop = True
            except OperationalError:
                logger.warning("Database connection lost permanently, stopping consumer")
                sys.exit(1)
            except ProbableAuthenticationError:
                if os.environ.get("AMAZONMQ_SECRET_ARN") and (
                    os.environ.get("AWS_ROLE_ARN")
                    or os.environ.get("AWS_CONTAINER_CREDENTIALS_FULL_URI")
                ):
                    logger.warning("Auth failure — refreshing AMQP secret")
                    from plane.utils.amqp import get_amqp_connection_params

                    self.connection_params = get_amqp_connection_params(
                        force_refresh=True
                    )
                    retry_count += 1
                else:
                    raise
            except Exception as e:
                log_exception(e)
                retry_count += 1
                if retry_count < max_retries:
                    time.sleep(5 * retry_count)  # Exponential backoff

        logger.info("Consumer stopped")
