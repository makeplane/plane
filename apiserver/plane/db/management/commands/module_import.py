# Python imports
import uuid
import csv
from datetime import datetime


# Django imports
from django.core.cache import cache
from django.utils import timezone
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError


from plane.db.models import (
    Workspace,
    User,
    WorkspaceMember,
    Project,
    Module,
    State,
    Issue,
    IssueAssignee,
    ModuleIssue,
    ProjectMember,
    Label,
    IssueLabel,
    IssueActivity,
    IssueLink,
)


class Command(BaseCommand):
    help = "Import records from a CSV file"

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help="Path to the CSV file to be imported")

    def handle(self, *args, **kwargs):

        try:
            csv_file = kwargs["csv_file"]
            workspace_name = input("Enter the workspace name: ")
            workspace_slug = input("Enter the workspace slug: ")

            if workspace_slug == "":
                raise CommandError("Workspace slug is required")

            if Workspace.objects.filter(slug=workspace_slug).exists():
                raise CommandError("Workspace already exists")

            creator = input("Enter your email: ")

            if (
                creator == ""
                or not User.objects.filter(email=creator).exists()
            ):
                raise CommandError(
                    "User email is required and should have signed in plane"
                )

            user = User.objects.get(email=creator)

            # Create workspace
            workspace = Workspace.objects.create(
                slug=workspace_slug,
                name=workspace_name,
                owner=user,
            )
            # Create workspace member
            WorkspaceMember.objects.create(
                workspace=workspace, role=20, member=user
            )
            project_name = input("Enter the project name: ")
            project_identifier = input("Enter the project identifier: ")

            if Project.objects.filter(identifier=project_identifier).exists():
                raise CommandError("Project identifier already exists")

            project = Project.objects.create(
                workspace=workspace,
                name=project_name,
                identifier=project_identifier,
                created_by_id=user.id,
            )
            _ = ProjectMember.objects.create(
                project=project,
                workspace=workspace,
                member=user,
                role=20,
            )
            print("Started importing the data")

            csv_file = csv_file

            with open(csv_file, newline="", encoding="utf-8") as file:
                reader = csv.reader(file)
                total_rows = sum(1 for row in reader)
                file.seek(0)
                next(reader)  # Skip the header row
                next(reader)  # Skip the second row

                print_counter = 0
                print_percent = 0

                state_mapper = {
                    "In Progress": "started",
                    "Resolved": "completed",
                    "Closed": "completed",
                    "Waiting for customer": "started",
                    "Review": "started",
                    "Waiting for analysis": "unstarted",
                    "Analysis": "unstarted",
                    "Confirmation of cost": "started",
                    "Niim approve": "started",
                    "Hold": "started",
                }

                for row in reader:
                    print_counter += 1  # Increment the counter

                    # Print progress every 10%
                    if print_counter >= total_rows // 10:
                        print(f"{print_percent}% is completed")
                        print_counter = 0  # Reset the counter
                        print_percent += 10  # Increment the percentage to print

                    (
                        module_name,
                        link_name,
                        link_url,
                        issue_status,
                        issue_created_by,
                        issue_title,
                        issue_assignee,
                        issue_created_at,
                        issue_completed_at,
                        issue_description,
                        issue_label1,
                        issue_label2,
                        issue_label3,
                    ) = row

                    module, _ = Module.objects.get_or_create(
                        name=module_name,
                        project_id=project.id,
                        workspace_id=workspace.id,
                    )
                    state_group = state_mapper.get(issue_status)
                    state, _ = State.objects.get_or_create(
                        name=issue_status,
                        group=state_group,
                        workspace=workspace,
                        project=project,
                    )

                    if issue_created_by:
                        issue_created_by, _ = User.objects.get_or_create(
                            email=issue_created_by.strip().lower(),
                            defaults={
                                "password": make_password(uuid.uuid4().hex),
                                "username": uuid.uuid4().hex,
                            },
                        )
                        _ = WorkspaceMember.objects.get_or_create(
                            workspace=workspace,
                            member=issue_created_by,
                            role=20,
                        )
                        _ = ProjectMember.objects.get_or_create(
                            project=project,
                            workspace=workspace,
                            member=issue_created_by,
                            role=20,
                        )

                    issue = Issue.objects.create(
                        name=issue_title,
                        description_html=f"<p>{issue_description}</p>",
                        project=project,
                        workspace=workspace,
                        created_by=issue_created_by,
                        state=state,
                        created_at=(
                            datetime.strptime(
                                issue_created_at, "%y/%m/%d - %H:%M"
                            )
                            if issue_created_at
                            else None
                        ),
                        completed_at=(
                            datetime.strptime(
                                issue_completed_at, "%y/%m/%d - %H:%M"
                            )
                            if issue_completed_at
                            else None
                        ),
                    )

                    issue_activity = IssueActivity.objects.create(
                        issue=issue,
                        actor=issue_created_by,
                        project=project,
                        workspace=workspace,
                        comment="created the issue",
                        verb="created",
                        created_by=issue_created_by,
                    )
                    issue_activity.created_at = timezone.make_aware(
                        datetime.strptime(issue_created_at, "%d/%m/%y - %H:%M")
                    )
                    issue_activity.updated_at = timezone.make_aware(
                        datetime.strptime(
                            issue_created_at, "%d/%m/%y - %H:%M"
                        ),
                    )
                    issue_activity.save(
                        update_fields=["created_at", "updated_at"]
                    )

                    if issue_assignee:
                        # check the assignee is a user or not
                        issue_assignee, _ = User.objects.get_or_create(
                            email=issue_assignee.strip().lower(),
                            defaults={
                                "password": make_password(uuid.uuid4().hex),
                                "username": uuid.uuid4().hex,
                            },
                        )
                        # check the assignee is present in the workspace or not
                        _ = WorkspaceMember.objects.get_or_create(
                            workspace=workspace,
                            member=issue_assignee,
                            role=20,
                        )
                        # check the assignee is present in the project or not
                        _ = ProjectMember.objects.get_or_create(
                            project=project,
                            workspace=workspace,
                            member=issue_assignee,
                            role=20,
                        )
                        # add assignee to the issue
                        _ = IssueAssignee.objects.get_or_create(
                            issue=issue,
                            assignee=issue_assignee,
                            project=project,
                            workspace=workspace,
                        )

                    # add label to the issue
                    for label in [
                        issue_label1,
                        issue_label2,
                        issue_label3,
                    ]:
                        if label:
                            label, _ = Label.objects.get_or_create(
                                name=label,
                                project=project,
                                workspace=workspace,
                            )
                            _ = IssueLabel.objects.create(
                                issue=issue,
                                label=label,
                                project=project,
                                workspace=workspace,
                            )

                    # add module to the issue
                    _ = ModuleIssue.objects.create(
                        module=module,
                        issue=issue,
                        project=project,
                        workspace=workspace,
                    )

                    # add link to the issue
                    _ = IssueLink.objects.create(
                        title=link_name,
                        url=link_url,
                        project=project,
                        workspace=workspace,
                    )

            cache.clear()
            self.stdout.write(
                self.style.SUCCESS("Successfully imported the data")
            )

        except FileNotFoundError:
            raise CommandError('File "%s" does not exist' % csv_file)
        except Exception as e:
            raise CommandError(
                'Error processing file "%s": %s' % (csv_file, e)
            )
