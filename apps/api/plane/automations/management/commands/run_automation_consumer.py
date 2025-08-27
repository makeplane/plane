# Standard Library imports
import sys

# Django imports
from django.core.management.base import BaseCommand
from django.conf import settings

# Module imports
from plane.automations.consumer import AutomationConsumer


class Command(BaseCommand):
    """
    Django management command to run the automation consumer.

    This command starts the RabbitMQ consumer that processes automation events
    from the plane_event_stream exchange and dispatches them to Celery tasks.
    """

    help = "Run the automation consumer to process events from RabbitMQ"

    def add_arguments(self, parser):
        """Add command line arguments."""
        parser.add_argument(
            "--queue",
            type=str,
            default=None,
            help="RabbitMQ queue name to consume from (default: from Django settings)",
        )
        parser.add_argument(
            "--prefetch",
            type=int,
            default=10,
            help="Number of messages to prefetch (default: 10)",
        )

    def handle(self, *args, **options):
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
            "AUTOMATION_EVENT_STREAM_QUEUE_NAME",
            "plane.event_stream.automations",
        )
        exchange_name = getattr(
            settings, "AUTOMATION_EXCHANGE_NAME", "plane.event_stream"
        )
        event_types = getattr(settings, "AUTOMATION_EVENT_TYPES", ["issue."])
        event_types_display = ", ".join(event_types)

        # Display startup information
        self.stdout.write(
            self.style.SUCCESS(
                f"Starting Automation Consumer:\n"
                f"  Queue: {queue_name}\n"
                f"  Exchange: {exchange_name} (fanout)\n"
                f"  Event Types: {event_types_display}\n"
                f"  Prefetch: {options['prefetch']}\n"
                f"  {connection_info}"
            )
        )

        # Create consumer instance
        consumer = AutomationConsumer(
            queue_name=options["queue"],
            prefetch_count=options["prefetch"],
        )

        try:
            self.stdout.write(
                self.style.SUCCESS(
                    "Consumer initialized. Starting message processing..."
                )
            )

            # Start the consumer (this will block until stopped)
            consumer.start_consuming()

        except KeyboardInterrupt:
            self.stdout.write(
                self.style.WARNING("Keyboard interrupt received, stopping...")
            )

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Unexpected error: {e}"))
            sys.exit(1)

        finally:
            self.stdout.write(
                self.style.SUCCESS("Automation consumer stopped successfully.")
            )
