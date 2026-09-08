# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from typing import Any
import secrets

from django.core.management import BaseCommand, CommandError

# Module imports
from plane.db.models import User, Workspace, WorkspaceMember, Project, ProjectMember, APIToken


class Command(BaseCommand):
    """Create a bot user scoped to a single project and issue an API token for it.

    This is the per-app scoping mechanism from migration-karol.md §6.2:
    the bot is a workspace Guest (read-only at workspace level) and a project
    Member (read/write) of ONLY its own project, so its token can never touch
    other projects.

    Usage (inside the api container):
      python manage.py create_bot_user --email legaliosa-bot@questimus.local \
          --workspace-slug questimus --project-id <uuid> --label legaliosa-app
    """

    help = "Create a bot user scoped to a single project and issue an API token"

    def add_arguments(self, parser):
        parser.add_argument("--email", type=str, required=True, help="Bot email, e.g. legaliosa-bot@questimus.local")
        parser.add_argument("--workspace-slug", type=str, required=True, help="Workspace slug")
        parser.add_argument("--project-id", type=str, required=True, help="Project UUID the bot is scoped to")
        parser.add_argument("--label", type=str, default="bot", help="API token label")
        parser.add_argument("--workspace-role", type=int, default=5, help="Workspace role (5=Guest, 15=Member, 20=Admin)")
        parser.add_argument("--project-role", type=int, default=15, help="Project role (5=Guest, 15=Member, 20=Admin)")

    def handle(self, *args: Any, **options: Any):
        # argparse converts --workspace-slug to dest workspace_slug, etc.
        email = options["email"].lower()

        workspace = Workspace.objects.filter(slug=options["workspace_slug"]).first()
        if not workspace:
            raise CommandError(f"Workspace '{options['workspace_slug']}' not found")

        project = Project.objects.filter(pk=options["project_id"]).first()
        if not project:
            raise CommandError(f"Project '{options['project_id']}' not found")

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                # The User.username field is unique with no default — the normal
                # signup flow sets it elsewhere. Bots must get an explicit,
                # collision-free username (the email itself) or the second
                # bot creation fails with user_username_key = "".
                "username": email,
                "password": secrets.token_urlsafe(24),
                "is_email_verified": True,
                "is_active": True,
                "is_bot": True,
            },
        )
        if not created:
            self.stdout.write(self.style.WARNING(f"User {email} already exists — reusing it"))
        if not user.username:
            # Backfill pre-fix bot users created with username=""
            user.username = email
            user.save(update_fields=["username"])

        WorkspaceMember.objects.get_or_create(
            workspace=workspace, member=user, defaults={"role": options["workspace_role"]}
        )
        ProjectMember.objects.get_or_create(
            project=project, member=user, defaults={"role": options["project_role"]}
        )

        token = APIToken.objects.create(
            user=user, workspace=workspace, label=options["label"], is_service=True, user_type=1  # 1 = Bot
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Bot {email} ready (workspace role {options['workspace_role']}, "
                f"project role {options['project_role']}). Token (shown once): {token.token}"
            )
        )
