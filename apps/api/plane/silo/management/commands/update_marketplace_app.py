# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# django imports
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.utils.dateparse import parse_datetime

# plane imports
from plane.authentication.models.oauth import Application, ApplicationOwner
from plane.db.models.workspace import Workspace
from plane.db.models.user import User


class Command(BaseCommand):
    """
    This command is used to manage marketplace apps.
    """

    help = """
    Marketplace app operations (assign-owner, publish, unpublish, make-app-internal, make-app-external, 
    set-app-priority, set-app-status, skip-app-authorization, mandate-app-authorization)
    """

    def add_arguments(self, parser):
        subparsers = parser.add_subparsers(dest="subcommand", required=True)

        # Subcommand: assign-owner
        assign_owner_parser = subparsers.add_parser("assign-owner", help="Assign owner to app")
        assign_owner_parser.add_argument("app_slug", type=str, help="App slug")
        assign_owner_parser.add_argument("--workspace-slug", type=str, required=True, help="Workspace slug")
        assign_owner_parser.add_argument("--user-email", type=str, required=True, help="User email")

        # Subcommand: publish
        publish_parser = subparsers.add_parser("publish", help="Publish app")
        publish_parser.add_argument("app_slug", type=str, help="App slug")
        publish_parser.add_argument(
            "--timestamp",
            type=str,
            required=False,
            help="Optional timestamp for publishing (ISO format)",
        )

        # Subcommand: unpublish
        unpublish_parser = subparsers.add_parser("unpublish", help="Unpublish app")
        unpublish_parser.add_argument("app_slug", type=str, help="App slug")

        # Subcommand: make-app-internal
        make_app_internal_parser = subparsers.add_parser("make-app-internal", help="Make app internal")
        make_app_internal_parser.add_argument("app_slug", type=str, help="App slug")

        # Subcommand: make-app-external
        make_app_external_parser = subparsers.add_parser("make-app-external", help="Make app external")
        make_app_external_parser.add_argument("app_slug", type=str, help="App slug")

        # Subcommand: set-app-priority
        set_app_priority_parser = subparsers.add_parser("set-app-priority", help="Set app priority")
        set_app_priority_parser.add_argument("app_slug", type=str, help="App slug")
        set_app_priority_parser.add_argument("priority", type=int, help="Priority")

        # Subcommand: set-app-status
        set_app_status_parser = subparsers.add_parser("set-app-status", help="Set app status")
        set_app_status_parser.add_argument("app_slug", type=str, help="App slug")
        set_app_status_parser.add_argument("status", type=str, help="Status")

        # Subcommand: skip-app-authorization
        skip_app_authorization_parser = subparsers.add_parser(
            "skip-app-authorization", help="Allow app to skip authorization"
        )
        skip_app_authorization_parser.add_argument("app_slug", type=str, help="App slug")

        # Subcommand: mandate-app-authorization
        mandate_app_authorization_parser = subparsers.add_parser(
            "mandate-app-authorization", help="Mandate app to require authorization"
        )
        mandate_app_authorization_parser.add_argument("app_slug", type=str, help="App slug")

    def handle(self, *args, **options):
        subcommand = options["subcommand"]

        if subcommand == "assign-owner":
            app_slug = options["app_slug"]
            workspace_slug = options["workspace_slug"]
            user_email = options["user_email"]
            self.stdout.write(
                self.style.SUCCESS(f"Assigning owner {user_email} to app {app_slug} in workspace {workspace_slug}")
            )
            self.assign_owner(app_slug, workspace_slug, user_email)

        elif subcommand == "publish":
            app_slug = options["app_slug"]
            timestamp = options.get("timestamp")
            self.stdout.write(
                self.style.SUCCESS(f"Publishing app {app_slug}" + (f" at {timestamp}" if timestamp else ""))
            )
            self.publish(app_slug, timestamp)

        elif subcommand == "unpublish":
            app_slug = options["app_slug"]
            self.stdout.write(self.style.SUCCESS(f"Unpublishing app {app_slug}"))
            self.unpublish(app_slug)

        elif subcommand == "make-app-internal":
            app_slug = options["app_slug"]
            self.stdout.write(self.style.SUCCESS(f"Making app {app_slug} internal"))
            self.make_app_internal(app_slug)

        elif subcommand == "make-app-external":
            app_slug = options["app_slug"]
            self.stdout.write(self.style.SUCCESS(f"Making app {app_slug} external"))
            self.make_app_external(app_slug)

        elif subcommand == "set-app-priority":
            app_slug = options["app_slug"]
            priority = options["priority"]
            self.stdout.write(self.style.SUCCESS(f"Setting app {app_slug} priority to {priority}"))
            self.set_app_priority(app_slug, priority)

        elif subcommand == "set-app-status":
            app_slug = options["app_slug"]
            status = options["status"]
            self.stdout.write(self.style.SUCCESS(f"Setting app {app_slug} status to {status}"))
            self.set_app_status(app_slug, status)

        elif subcommand == "skip-app-authorization":
            app_slug = options["app_slug"]
            self.stdout.write(self.style.SUCCESS(f"Allowing app {app_slug} to skip authorization"))
            self.allow_app_to_skip_authorization(app_slug)

        elif subcommand == "mandate-app-authorization":
            app_slug = options["app_slug"]
            self.stdout.write(self.style.SUCCESS(f"Mandating app {app_slug} to require authorization"))
            self.mandate_app_to_require_authorization(app_slug)

        else:
            raise CommandError("Unknown subcommand")

        self.stdout.write(self.style.SUCCESS("Done"))

    def assign_owner(self, app_slug, workspace_slug, user_email):
        """
        python manage.py update_marketplace_app assign-owner <app_slug>  --workspace-slug <w_slug> --user-email <user_email>
        """  # noqa: E501

        app_owner = ApplicationOwner.objects.filter(application__slug=app_slug).first()

        # Delete existing owner if it exists
        if app_owner:
            app_owner.delete()

        app = Application.objects.get(slug=app_slug)
        workspace = Workspace.objects.get(slug=workspace_slug)
        user = User.objects.get(email=user_email)

        ApplicationOwner.objects.create(application=app, workspace=workspace, user=user)

    def publish(self, app_slug, timestamp):
        """
        python manage.py update_marketplace_app publish <app_slug>
        python manage.py update_marketplace_app publish <app_slug>--timestamp 2025-05-14T00:00:00Z
        """
        app = Application.objects.get(slug=app_slug)
        # Timestamp is provided as an ISO string, do I need to parse it?
        if timestamp:
            app.published_at = parse_datetime(timestamp)
        else:
            app.published_at = timezone.now()
        app.save()

    def unpublish(self, app_slug):
        """
        python manage.py update_marketplace_app unpublish <app_slug>
        """
        app = Application.objects.get(slug=app_slug)
        app.published_at = None
        app.save()

    def make_app_internal(self, app_slug):
        """
        python manage.py update_marketplace_app make-app-internal <app_slug>
        """
        app = Application.objects.get(slug=app_slug)
        app.is_internal = True
        app.save()

    def make_app_external(self, app_slug):
        """
        python manage.py update_marketplace_app make-app-external <app_slug>
        """
        app = Application.objects.get(slug=app_slug)
        app.is_internal = False
        app.save()

    def set_app_priority(self, app_slug, priority):
        """
        python manage.py update_marketplace_app set-app-priority <app_slug> <priority>
        """
        app = Application.objects.get(slug=app_slug)
        app.priority = priority
        app.save()

    def set_app_status(self, app_slug, status):
        """
        python manage.py update_marketplace_app set-app-status <app_slug> <status>
        """
        app = Application.objects.get(slug=app_slug)
        app.status = status
        app.save()

    def allow_app_to_skip_authorization(self, app_slug):
        """
        python manage.py update_marketplace_app skip-app-authorization <app_slug>
        """
        app = Application.objects.get(slug=app_slug)
        app.skip_authorization = True
        app.save()

    def mandate_app_to_require_authorization(self, app_slug):
        """
        python manage.py update_marketplace_app mandate-app-authorization <app_slug>
        """
        app = Application.objects.get(slug=app_slug)
        app.skip_authorization = False
        app.save()
