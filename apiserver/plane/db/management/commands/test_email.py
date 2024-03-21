from django.core.mail import EmailMultiAlternatives, get_connection
from django.core.management import BaseCommand, CommandError

from plane.license.utils.instance_value import get_email_configuration


class Command(BaseCommand):
    """Django command to pause execution until db is available"""

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument("to_email", type=str, help="receiver's email")

    def handle(self, *args, **options):
        receiver_email = options.get("to_email")

        if not receiver_email:
            raise CommandError("Reciever email is required")

        (
            EMAIL_HOST,
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            EMAIL_PORT,
            EMAIL_USE_TLS,
            EMAIL_USE_SSL,
            EMAIL_FROM,
        ) = get_email_configuration()

        connection = get_connection(
            host=EMAIL_HOST,
            port=int(EMAIL_PORT),
            username=EMAIL_HOST_USER,
            password=EMAIL_HOST_PASSWORD,
            use_tls=EMAIL_USE_TLS == "1",
            use_ssl=EMAIL_USE_SSL == "1",
            timeout=30,
        )
        # Prepare email details
        subject = "Email Notification from Plane"
        message = (
            "This is a sample email notification sent from Plane application."
        )

        self.stdout.write(self.style.SUCCESS("Trying to send test email..."))

        # Send the email
        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=message,
                from_email=EMAIL_FROM,
                to=[receiver_email],
                connection=connection,
            )
            msg.send()
            self.stdout.write(self.style.SUCCESS("Email succesfully sent"))
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f"Error: Email could not be delivered due to {e}"
                )
            )
