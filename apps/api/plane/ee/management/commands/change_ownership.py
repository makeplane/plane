# Django imports
from django.core.management import BaseCommand, CommandError


# Module imports
from plane.db.models import User, Workspace, WorkspaceMember


class Command(BaseCommand):
    help = "Change the ownership of the workspace"

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument("--email", type=str, help="user email", required=True)
        parser.add_argument(
            "--workspace_slug", type=str, help="workspace slug", required=True
        )

    def handle(self, *args, **options):
        # get the user email from console
        email = options.get("email", False)
        workspace_slug = options.get("workspace_slug", False)

        # raise error if email is not present
        if not email or not workspace_slug:
            raise CommandError("Error: Email and workspace slug is required")

        # Fetch the user
        user = User.objects.filter(email=email).first()

        # Raise error if the user is not present
        if not user:
            raise CommandError(f"Error: User with {email} does not exists")

        # Fetch the workspace
        workspace = Workspace.objects.filter(slug=workspace_slug).first()

        # Raise error if the workspace is not present
        if not workspace:
            raise CommandError(
                f"Error: Workspace with {workspace_slug} does not exists"
            )

        # Change the ownership of the workspace
        workspace.owner = user
        workspace.save(update_fields=["owner"])

        # Add the user to the workspace
        workspace_member = WorkspaceMember.objects.filter(
            workspace=workspace, member=user
        ).first()

        # If the user is not present in the workspace, create the user
        if not workspace_member:
            workspace_member = WorkspaceMember.objects.create(
                workspace=workspace, member=user, role=20
            )
        else:
            workspace_member.role = 20
            workspace_member.save(update_fields=["role"])

        # Print the success message
        self.stdout.write(
            self.style.SUCCESS("Workspace ownership changed successfully")
        )
