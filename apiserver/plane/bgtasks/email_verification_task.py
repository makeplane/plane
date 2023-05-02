# Django imports
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

# Third party imports
from celery import shared_task


from sentry_sdk import capture_exception

# Module imports
from plane.db.models import User


@shared_task
def email_verification(first_name, email, token, current_site):

    try:
        realtivelink = "/request-email-verification/" + "?token=" + str(token)
        abs_url = "http://" + current_site + realtivelink

        from_email_string = settings.EMAIL_FROM

        subject = f"Verify your Email!"

        context = {
            "first_name": first_name,
            "verification_url": abs_url,
        }

        html_content = render_to_string("emails/auth/email_verification.html", context)

        text_content = strip_tags(html_content)

        msg = EmailMultiAlternatives(subject, text_content, from_email_string, [email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        return
    except Exception as e:
        capture_exception(e)
        return
