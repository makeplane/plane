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

ROLE_MAPPER = {
    20: "Admin",
    15: "Member",
    10: "Viewer",
    5: "Guest",
}


@shared_task
def project_add_user_email(project_member_id, invitor_id):
    try:
        # Get the invitor
        invitor = User.objects.get(pk=invitor_id)
        invitor_name = invitor.first_name + " " + invitor.last_name
        # Get the project member
        project_member = ProjectMember.objects.get(pk=project_member_id)
        # Get the project member details
        project_name = project_member.project.name
        workspace_name = project_member.workspace.name
        member_name = project_member.member.first_name
        member_email = project_member.member.email
        role = ROLE_MAPPER[project_member.role]
        # set the context
        context = {
            "project_name": project_name,
            "workspace_name": workspace_name,
            "member_name": member_name,
            "email": member_email,
            "role": role,
            "invitor_name": invitor_name,
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
        subject = f"You have been added to {project_name} in {workspace_name}"

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
