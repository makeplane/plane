# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.core.management import BaseCommand, CommandError
from django.db import IntegrityError

# Module imports
from plane.db.models import User, Workspace
from plane.utils.service_account import (
    DEFAULT_SERVICE_ACCOUNT_ROLE,
    SERVICE_ACCOUNT_ROLES,
    create_service_account,
)


class Command(BaseCommand):
    help = (
        "Create a service (machine) account in a workspace and mint an API token for it. "
        "The account is active and email-verified, needs no invite/accept flow, and can "
        "authenticate only through the printed token."
    )

    def add_arguments(self, parser):
        parser.add_argument("--workspace", type=str, required=True, help="Workspace slug")
        parser.add_argument("--name", type=str, required=True, help="Display name for the service account")
        parser.add_argument(
            "--role",
            type=str,
            choices=list(SERVICE_ACCOUNT_ROLES),
            default=DEFAULT_SERVICE_ACCOUNT_ROLE,
            help=f"Workspace role (default: {DEFAULT_SERVICE_ACCOUNT_ROLE})",
        )
        parser.add_argument(
            "--email",
            type=str,
            default=None,
            help="Optional email; a unique synthetic one is generated when omitted",
        )
        parser.add_argument("--description", type=str, default="", help="Optional token description")

    def handle(self, *args, **options):
        workspace = Workspace.objects.filter(slug=options["workspace"]).first()
        if workspace is None:
            raise CommandError(f"Workspace with slug '{options['workspace']}' does not exist")

        email = options.get("email")
        if email and User.objects.filter(email=email).exists():
            raise CommandError(f"A user with email '{email}' already exists")

        try:
            service_account = create_service_account(
                workspace=workspace,
                name=options["name"],
                role=options["role"],
                email=options["email"],
                description=options["description"],
            )
        except IntegrityError as exc:
            # A concurrent insert (email race that slipped past the check above)
            # or an extremely unlikely synthetic username/email collision surfaces
            # here — report it readably instead of a raw traceback. The helper's
            # @transaction.atomic has already rolled back, so no partial account
            # remains.
            raise CommandError(f"Could not create the service account — the email is already in use: {exc}")

        user = service_account.user
        self.stdout.write(self.style.SUCCESS("Service account created successfully"))
        self.stdout.write(f"  user_id  : {user.id}")
        self.stdout.write(f"  username : {user.username}")
        self.stdout.write(f"  email    : {user.email}")
        self.stdout.write(f"  role     : {options['role']}")
        self.stdout.write(f"  workspace: {workspace.slug}")
        self.stdout.write(self.style.WARNING("API token (shown once — store it securely):"))
        self.stdout.write(f"  {service_account.token}")
