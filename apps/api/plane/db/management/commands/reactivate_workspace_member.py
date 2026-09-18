# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.core.management import BaseCommand, CommandError

# Module imports
from plane.db.models import ProjectMember, User, Workspace, WorkspaceMember


class Command(BaseCommand):
    help = "Reactivate a workspace member given a workspace slug and user email"

    def add_arguments(self, parser):
        # Positional arguments
        parser.add_argument("slug", type=str, help="workspace slug")
        parser.add_argument("email", type=str, help="user email")

    def handle(self, *args, **options):
        # get the workspace slug and user email from console
        slug = options.get("slug") or ""
        email = options.get("email") or ""

        # normalize before validating; emails are stored lowercased and stripped (User.save)
        slug = slug.strip()
        email = email.strip().lower()

        # raise error if slug is not present
        if not slug:
            raise CommandError("Error: Workspace slug is required")

        # raise error if email is not present
        if not email:
            raise CommandError("Error: Email is required")

        # filter the user
        user = User.objects.filter(email=email).first()

        # Raise error if the user is not present
        if not user:
            raise CommandError(f"Error: User with {email} does not exist")

        # filter the workspace
        workspace = Workspace.objects.filter(slug=slug).first()

        # Raise error if the workspace is not present
        if not workspace:
            raise CommandError(f"Error: Workspace with slug {slug} does not exist")

        # Find the workspace membership (includes inactive members; soft-deleted are excluded by default manager)
        workspace_member = WorkspaceMember.objects.filter(workspace=workspace, member=user).first()

        # Raise error if the membership is not present
        if not workspace_member:
            raise CommandError(f"Error: User {email} is not a member of workspace {slug}")

        # If already active, report without erroring
        if workspace_member.is_active:
            self.stdout.write(self.style.SUCCESS(f"User {email} is already an active member of workspace {slug}"))
            return

        # Reactivate the membership. update_fields keeps the write to the columns that change, and
        # disable_auto_set_user stops BaseModel.save from nulling created_by/updated_by when there
        # is no request user, as is the case in a management command.
        workspace_member.is_active = True
        workspace_member.save(update_fields=["is_active", "updated_at"], disable_auto_set_user=True)

        self.stdout.write(
            self.style.SUCCESS(
                f"User {email} reactivated successfully in workspace {slug} as {workspace_member.get_role_display()}"
            )
        )

        # Removing a member also deactivates their project memberships, which this command leaves alone
        inactive_projects = ProjectMember.objects.filter(workspace=workspace, member=user, is_active=False).count()
        if inactive_projects:
            self.stdout.write(
                self.style.WARNING(
                    f"Note: {inactive_projects} project membership(s) remain inactive; "
                    "removing a member also deactivates their project memberships"
                )
            )

        # A member removed by deactivating their account also has an inactive user record
        if not user.is_active:
            self.stdout.write(
                self.style.WARNING(
                    f"Note: the account for {email} is deactivated and cannot sign in. "
                    f"Run 'python manage.py activate_user {email}' to activate it."
                )
            )
