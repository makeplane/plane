# Python imports
import logging

# Third party imports
from celery import shared_task

# Third party imports
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils.html import strip_tags


# Module imports
from plane.license.utils.instance_value import get_email_configuration
from plane.utils.exception_logger import log_exception
from plane.db.models import ProjectMember
from plane.db.models import User


@shared_task
def project_add_user_email(current_site, project_member_id, invitor_id):
    try:
        # Get the invitor
        invitor = User.objects.get(pk=invitor_id)
        inviter_first_name = invitor.first_name
        # Get the project member
        project_member = ProjectMember.objects.get(pk=project_member_id)
        # Get the project member details
        project_name = project_member.project.name
        workspace_name = project_member.workspace.name
        member_email = project_member.member.email
        project_url = f"{current_site}/{project_member.workspace.slug}/projects/{project_member.project_id}/issues"
        # set the context
        context = {
            "project_name": project_name,
            "workspace_name": workspace_name,
            "email": member_email,
            "inviter_first_name": inviter_first_name,
            "project_url": project_url,
        }

        # Get the email configuration
        (
            EMAIL_HOST,
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            EMAIL_PORT,
            EMAIL_USE_TLS,
            EMAIL_USE_SSL,
            EMAIL_FROM,
        ) = get_email_configuration()

        # Set the subject
        subject = "You have been invited to a Plane project"

        # Render the email template
        html_content = render_to_string(
            "emails/notifications/project_addition.html", context
        )
        text_content = strip_tags(html_content)
        # Initialize the connection
        connection = get_connection(
            host=EMAIL_HOST,
            port=int(EMAIL_PORT),
            username=EMAIL_HOST_USER,
            password=EMAIL_HOST_PASSWORD,
            use_tls=EMAIL_USE_TLS == "1",
            use_ssl=EMAIL_USE_SSL == "1",
        )
        # Send the email
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=EMAIL_FROM,
            to=[member_email],
            connection=connection,
        )
        # Attach the html content
        msg.attach_alternative(html_content, "text/html")
        # Send the email
        msg.send()
        # Log the success
        logging.getLogger("plane").info("Email sent successfully.")
        return
    except Exception as e:
        log_exception(e)
        return
