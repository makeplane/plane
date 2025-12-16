import os
import sys

from django.core.management.base import BaseCommand

from plane.webhook.consumer import WebhookConsumer


class Command(BaseCommand):
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
        """Handle the management command execution."""
        consumer = WebhookConsumer(options["queue"], options["prefetch"])

        try:
            self.stdout.write(self.style.SUCCESS(f"Webhook consumer initialized for queue '{options['queue']}'"))
            # Start the consumer (this will block until stopped)
            consumer.start_consuming()

        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING("Keyboard interrupt received, stopping..."))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Unexpected error: {e}"))
            sys.exit(1)

        finally:
            self.stdout.write(self.style.SUCCESS(f"Webhook consumer stopped for queue '{options['queue']}'"))
