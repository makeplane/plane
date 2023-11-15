# Django imports
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

# Third party imports
from celery import shared_task
from sentry_sdk import capture_exception

# Module imports
from plane.db.models import Project, User, ProjectMemberInvite


@shared_task
def project_invitation(email, project_id, token, current_site, invitor):
    try:
        user = User.objects.get(email=invitor)
        project = Project.objects.get(pk=project_id)
        project_member_invite = ProjectMemberInvite.objects.get(
            token=token, email=email
        )

        relativelink = f"/project-invitations/?invitation_id={project_member_invite.id}&email={email}&slug={project.workspace.slug}&project_id={str(project_id)}"
        abs_url = current_site + relativelink

        from_email_string = settings.EMAIL_FROM

        subject = f"{user.first_name or user.display_name or user.email} invited you to join {project.name} on Plane"

        context = {
            "email": email,
            "first_name": user.first_name,
            "project_name": project.name,
            "invitation_url": abs_url,
        }

        html_content = render_to_string(
            "emails/invitations/project_invitation.html", context
        )

        text_content = strip_tags(html_content)

        project_member_invite.message = text_content
        project_member_invite.save()

        msg = EmailMultiAlternatives(subject, text_content, from_email_string, [email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        return
    except (Project.DoesNotExist, ProjectMemberInvite.DoesNotExist) as e:
        return
    except Exception as e:
        # Print logs if in DEBUG mode
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return
