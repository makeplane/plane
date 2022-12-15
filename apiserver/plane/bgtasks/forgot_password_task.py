# Django imports
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

# Third party imports
from django_rq import job
from sentry_sdk import capture_exception

# Module imports
from plane.db.models import User


@job("default")
def forgot_password(first_name, email, uidb64, token, current_site):

    try:
        realtivelink = f"/email-verify/?uidb64={uidb64}&token={token}/"
        abs_url = "http://" + current_site + realtivelink

        from_email_string = f"Team Plane <team@mailer.plane.so>"

        subject = f"Verify your Email!"

        context = {
            "first_name": first_name,
            "forgot_password_url": abs_url,
        }

        html_content = render_to_string("emails/auth/forgot_password.html", context)

        text_content = strip_tags(html_content)

        msg = EmailMultiAlternatives(subject, text_content, from_email_string, [email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        return
    except Exception as e:
        capture_exception(e)
        return
