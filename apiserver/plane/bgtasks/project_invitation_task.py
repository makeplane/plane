# Django imports
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

# Third party imports
from django_rq import job
from sentry_sdk import capture_exception

# Module imports
from plane.db.models import Project, User, ProjectMemberInvite


@job("default")
def project_invitation(email, project_id, token, current_site):

    try:

        project = Project.objects.get(pk=project_id)
        project_member_invite = ProjectMemberInvite.objects.get(
            token=token, email=email
        )

        relativelink = f"/project-member-invitation/{project_member_invite.id}"
        abs_url = "http://" + current_site + relativelink

        from_email_string = f"Team Plane <team@mailer.plane.so>"

        subject = f"{project.created_by.first_name or project.created_by.email} invited you to join {project.name} on Plane"

        context = {
            "email": email,
            "first_name": project.created_by.first_name,
            "project_name": project.name,
            "invitation_url": abs_url,
        }

        html_content = render_to_string("emails/invitations/project_invitation.html", context)

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
        print(e)
        capture_exception(e)
        return
