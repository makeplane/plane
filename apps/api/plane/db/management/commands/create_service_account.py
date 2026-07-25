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
        """Register the command's arguments on the parser."""
        parser.add_argument("--workspace", type=str, required=True, help="Workspace slug")
        parser.add_argument("--name", type=str, required=True, help="Name for the service account (token label)")
        parser.add_argument(
            "--role",
            type=str,
            choices=list(SERVICE_ACCOUNT_ROLES),
            default=DEFAULT_SERVICE_ACCOUNT_ROLE,
            help=f"Workspace role (default: {DEFAULT_SERVICE_ACCOUNT_ROLE})",
        )
        parser.add_argument(
            "--username",
            type=str,
            default=None,
            help="Optional globally-unique username; a synthetic svc_<uuid> is generated when omitted",
        )
        parser.add_argument(
            "--display-name",
            type=str,
            default=None,
            dest="display_name",
            help="Optional display name shown in the members UI; falls back to --name when omitted",
        )
        parser.add_argument(
            "--email",
            type=str,
            default=None,
            help="Optional email; a unique synthetic one is generated when omitted",
        )
        parser.add_argument(
            "--description",
            type=str,
            default=None,
            help="Optional token description; a default is generated when omitted",
        )

    def handle(self, *args, **options):
        """Create the service account and print its details and API token."""
        if not options["name"].strip():
            raise CommandError("--name must not be empty")

        workspace = Workspace.objects.filter(slug=options["workspace"]).first()
        if workspace is None:
            raise CommandError(f"Workspace with slug '{options['workspace']}' does not exist")

        # Normalize identity options: strip surrounding whitespace and treat a
        # blank (or whitespace-only) value as omitted, so " " cannot slip past the
        # synthetic-fallback checks and create an all-whitespace username/email.
        email = (options.get("email") or "").strip() or None
        username = (options.get("username") or "").strip() or None
        display_name = (options.get("display_name") or "").strip() or None

        # Mirror the serializer's max_length checks so an over-long value fails
        # with a clear CommandError instead of a raw DB DataError. Lengths are
        # read from the model fields rather than hardcoded.
        length_limits = {
            "--name": (options["name"], User._meta.get_field("first_name").max_length),
            "--username": (username, User._meta.get_field("username").max_length),
            "--display-name": (display_name, User._meta.get_field("display_name").max_length),
            "--email": (email, User._meta.get_field("email").max_length),
        }
        for flag, (value, limit) in length_limits.items():
            if value and len(value) > limit:
                raise CommandError(f"{flag} must be at most {limit} characters")

        if email and User.objects.filter(email=email).exists():
            raise CommandError(f"A user with email '{email}' already exists")

        if username and User.objects.filter(username=username).exists():
            raise CommandError(f"A user with username '{username}' already exists")

        try:
            service_account = create_service_account(
                workspace=workspace,
                name=options["name"],
                role=options["role"],
                email=email,
                description=options["description"],
                username=username,
                display_name=display_name,
            )
        except IntegrityError as exc:
            # A concurrent insert (email/username race that slipped past the checks
            # above) or an extremely unlikely synthetic collision surfaces here —
            # report it readably instead of a raw traceback. The helper's
            # @transaction.atomic has already rolled back, so no partial account
            # remains.
            raise CommandError(f"Could not create the service account — the email or username is already in use: {exc}")

        user = service_account.user
        self.stdout.write(self.style.SUCCESS("Service account created successfully"))
        self.stdout.write(f"  user_id     : {user.id}")
        self.stdout.write(f"  username    : {user.username}")
        self.stdout.write(f"  display_name: {user.display_name}")
        self.stdout.write(f"  email       : {user.email}")
        self.stdout.write(f"  role        : {options['role']}")
        self.stdout.write(f"  workspace   : {workspace.slug}")
        self.stdout.write(self.style.WARNING("API token (shown once — store it securely):"))
        self.stdout.write(f"  {service_account.token}")
