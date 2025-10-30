# Django imports
from typing import Any
from django.core.management.base import BaseCommand, CommandError

# Module imports
from plane.db.models import User, Workspace, WorkspaceMember


class Command(BaseCommand):
    help = "Create dump issues, cycles etc. for a project in a given workspace"

    def handle(self, *args: Any, **options: Any) -> str | None:
        try:
            workspace_name = input("Workspace Name: ")
            workspace_slug = input("Workspace slug: ")

            if workspace_slug == "":
                raise CommandError("Workspace slug is required")

            if Workspace.objects.filter(slug=workspace_slug).exists():
                raise CommandError("Workspace already exists")

            creator = input("Your email: ")

            if creator == "" or not User.objects.filter(email=creator).exists():
                raise CommandError("User email is required and should have signed in plane")

            user = User.objects.get(email=creator)

            members = input("Enter Member emails (comma separated): ")
            members = members.split(",") if members != "" else []
            # Create workspace
            workspace = Workspace.objects.create(slug=workspace_slug, name=workspace_name, owner=user)
            # Create workspace member
            WorkspaceMember.objects.create(workspace=workspace, role=20, member=user)
            user_ids = User.objects.filter(email__in=members)

            _ = WorkspaceMember.objects.bulk_create(
                [WorkspaceMember(workspace=workspace, member=user_id, role=20) for user_id in user_ids],
                ignore_conflicts=True,
            )

            project_count = int(input("Number of projects to be created: "))

            for i in range(project_count):
                print(f"Please provide the following details for project {i + 1}:")
                issue_count = int(input("Number of issues to be created: "))
                cycle_count = int(input("Number of cycles to be created: "))
                module_count = int(input("Number of modules to be created: "))
                pages_count = int(input("Number of pages to be created: "))
                intake_issue_count = int(input("Number of intake issues to be created: "))

                from plane.bgtasks.dummy_data_task import create_dummy_data

                create_dummy_data(
                    slug=workspace_slug,
                    email=creator,
                    members=members,
                    issue_count=issue_count,
                    cycle_count=cycle_count,
                    module_count=module_count,
                    pages_count=pages_count,
                    intake_issue_count=intake_issue_count,
                )

            self.stdout.write(self.style.SUCCESS("Data is pushed to the queue"))
            return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Command errored out {str(e)}"))
            return
