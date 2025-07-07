# Django imports
from typing import Any
from django.core.management import BaseCommand, CommandError

# Module imports
from plane.db.models import (
    User,
    WorkspaceMember,
    ProjectMember,
    Project,
    IssueUserProperty,
)


class Command(BaseCommand):
    help = "Add a member to a project. If present in the workspace"

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument("--project_id", type=str, nargs="?", help="Project ID")
        parser.add_argument("--user_email", type=str, nargs="?", help="User Email")
        parser.add_argument(
            "--role", type=int, nargs="?", help="Role of the user in the project"
        )

    def handle(self, *args: Any, **options: Any):
        try:
            if not options["project_id"]:
                raise CommandError("Project ID is required")
            if not options["user_email"]:
                raise CommandError("User Email is required")

            project_id = options["project_id"]
            user_email = options["user_email"]
            role = options.get("role", 20)

            print(f"Role: {role}")

            user = User.objects.filter(email=user_email).first()
            if not user:
                raise CommandError("User not found")

            # Check if the project exists
            project = Project.objects.filter(pk=project_id).first()
            if not project:
                raise CommandError("Project not found")

            # Check if the user exists in the workspace
            if not WorkspaceMember.objects.filter(
                workspace=project.workspace, member=user, is_active=True
            ).exists():
                raise CommandError("User not member in workspace")

            # Get the smallest sort order
            smallest_sort_order = (
                ProjectMember.objects.filter(workspace_id=project.workspace_id)
                .order_by("sort_order")
                .first()
            )

            if smallest_sort_order:
                sort_order = smallest_sort_order.sort_order - 1000
            else:
                sort_order = 65535

            if ProjectMember.objects.filter(project=project, member=user).exists():
                # Update the project member
                ProjectMember.objects.filter(project=project, member=user).update(
                    is_active=True, sort_order=sort_order, role=role
                )
            else:
                # Create the project member
                ProjectMember.objects.create(
                    project=project, member=user, role=role, sort_order=sort_order
                )

            # Issue Property
            IssueUserProperty.objects.get_or_create(user=user, project=project)

            # Success message
            self.stdout.write(
                self.style.SUCCESS(f"User {user_email} added to project {project_id}")
            )
            return
        except CommandError as e:
            self.stdout.write(self.style.ERROR(e))
            return
