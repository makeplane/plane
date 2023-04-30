# Django imports
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

# Third party imports
from celery import shared_task
from sentry_sdk import capture_exception
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

@shared_task
def send_welcome_email(instance, created, message):
    try:
        if created and not instance.is_bot:
            first_name = instance.first_name.capitalize()
            to_email = instance.email
            from_email_string = settings.EMAIL_FROM

            subject = f"Welcome to Plane ✈️!"

            context = {"first_name": first_name, "email": instance.email}

            html_content = render_to_string(
                "emails/auth/user_welcome_email.html", context
            )

            text_content = strip_tags(html_content)

            msg = EmailMultiAlternatives(
                subject, text_content, from_email_string, [to_email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()

            # Send message on slack as well
            if settings.SLACK_BOT_TOKEN:
                client = WebClient(token=settings.SLACK_BOT_TOKEN)
                try:
                    _ = client.chat_postMessage(
                        channel="#trackers",
                        text=message,
                    )
                except SlackApiError as e:
                    print(f"Got an error: {e.response['error']}")
        return
    except Exception as e:
        capture_exception(e)
        return
