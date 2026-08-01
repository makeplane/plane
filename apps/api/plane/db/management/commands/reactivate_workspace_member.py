# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.core.management import BaseCommand, CommandError

# Module imports
from plane.db.models import User, Workspace, WorkspaceMember


class Command(BaseCommand):
    help = "Reactivate a workspace member given a workspace slug and user email"

    def add_arguments(self, parser):
        # Positional arguments
        parser.add_argument("slug", type=str, help="workspace slug")
        parser.add_argument("email", type=str, help="user email")

    def handle(self, *args, **options):
        # get the workspace slug and user email from console
        slug = options.get("slug", False)
        email = options.get("email", False)

        # raise error if slug is not present
        if not slug:
            raise CommandError("Error: Workspace slug is required")

        # raise error if email is not present
        if not email:
            raise CommandError("Error: Email is required")

        # emails are stored lowercased and stripped (User.save)
        email = email.strip().lower()

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
            self.stdout.write(
                self.style.SUCCESS(f"User {email} is already an active member of workspace {slug}")
            )
            return

        # Reactivate the membership; limit the write so audit fields set by
        # BaseModel.save (no request user here) are not persisted
        workspace_member.is_active = True
        workspace_member.save(update_fields=["is_active"])

        self.stdout.write(
            self.style.SUCCESS(f"User {email} reactivated successfully in workspace {slug}")
        )
