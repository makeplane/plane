import os

from django.core.management.base import BaseCommand
from django.conf import settings


class WebhookConsumer(BaseCommand):
    """
    Django management command to run the Webhook consumer.

    This command starts the RabbitMQ consumer that processes Webhook events
    from the plane_webhook_stream exchange and dispatches them to Celery tasks.
    """

    help = "Run the Webhook consumer to process events from RabbitMQ"

    def add_arguments(self, parser):
        """Add command line arguments."""
        parser.add_argument(
            "--queue",
            type=str,
            default=os.environ.get("WEBHOOK_QUEUE_NAME", "plane.webhook"),
            help="RabbitMQ queue name to consume from (default: from Django settings)",
        )
        parser.add_argument(
            "--prefetch",
            type=int,
            default=os.environ.get("WEBHOOK_PREFETCH_COUNT", 10),
            help="Number of messages to prefetch (default: 10)",
        )

    def handle(self, *args, **options):
        print("Consuming webhooks")
        """Handle the management command execution."""

        # Get configuration info for display
        if hasattr(settings, "AMQP_URL") and settings.AMQP_URL:
            connection_info = f"AMQP URL: {settings.AMQP_URL}"
        else:
            host = getattr(settings, "RABBITMQ_HOST", "localhost")
            port = getattr(settings, "RABBITMQ_PORT", "5672")
            vhost = getattr(settings, "RABBITMQ_VHOST", "/")
            connection_info = f"Host: {host}:{port}{vhost}"

        # Get automation settings
        queue_name = options["queue"] or getattr(
            settings,
            "WEBHOOK_QUEUE_NAME",
            "plane.webhook",
        )
        exchange_name = getattr(settings, "WEBHOOK_EXCHANGE_NAME", "plane.webhook")
        event_types = getattr(settings, "WEBHOOK_EVENT_TYPES", ["issue.created", "issue.updated", "issue.deleted"])
        event_types_display = ", ".join(event_types)

        # Display startup information
        self.stdout.write(
            self.style.SUCCESS(
                f"Starting Webhook Consumer:\n"
                f"  Queue: {queue_name}\n"
                f"  Exchange: {exchange_name} (fanout)\n"
                f"  Event Types: {event_types_display}\n"
                f"  Prefetch: {options['prefetch']}\n"
                f"  {connection_info}"
            )
        )

        consumer = WebhookConsumer(queue_name, options["prefetch"])
        consumer.run()
