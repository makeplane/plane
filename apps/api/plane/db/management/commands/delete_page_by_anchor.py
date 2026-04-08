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

# Django imports
from django.core.management.base import BaseCommand, CommandError

# Module imports
from plane.db.models import DeployBoard, Page


class Command(BaseCommand):
    """
    Management command to unpublish and delete a page using its published anchor ID.

    Looks up the DeployBoard record by anchor, finds the associated page,
    unpublishes (deletes the DeployBoard), then deletes the page.

    Example usage:
        python manage.py delete_page_by_anchor <anchor_id>
        python manage.py delete_page_by_anchor <anchor_id> --hard
        python manage.py delete_page_by_anchor <anchor_id> --dry-run
    """

    help = "Unpublish and delete a page by its published anchor ID"

    def add_arguments(self, parser):
        parser.add_argument("anchor", type=str, help="The published anchor ID")
        parser.add_argument(
            "--hard",
            action="store_true",
            default=False,
            help="Hard delete the page instead of soft delete",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Show what would be done without making any changes",
        )

    def handle(self, *args, **options):
        anchor = options["anchor"]
        hard = options["hard"]
        dry_run = options["dry_run"]

        # Look up the deploy board by anchor
        try:
            deploy_board = DeployBoard.objects.get(anchor=anchor, entity_name="page")
        except DeployBoard.DoesNotExist:
            raise CommandError(f"No published page found with anchor: {anchor}")

        page_id = deploy_board.entity_identifier
        workspace_slug = deploy_board.workspace.slug

        # Look up the page
        try:
            page = Page.objects.get(id=page_id)
        except Page.DoesNotExist:
            raise CommandError(
                f"DeployBoard found but page {page_id} does not exist. " f"Cleaning up orphaned deploy board."
            )

        # Resolve who published the page
        published_by = deploy_board.created_by

        # Display page and publish info
        self.stdout.write("\nPage found:")
        self.stdout.write(f"  Name:         {page.name}")
        self.stdout.write(f"  ID:           {page.id}")
        self.stdout.write(f"  Workspace:    {workspace_slug}")
        self.stdout.write(f"  Owner:        {page.owned_by.email}")
        self.stdout.write(f"  Anchor:       {anchor}")
        self.stdout.write(f"  Published by: {published_by.email if published_by else 'Unknown'}")
        self.stdout.write(f"  Published at: {deploy_board.created_at}")
        self.stdout.write(f"  Delete mode:  {'hard' if hard else 'soft'}")

        if dry_run:
            self.stdout.write(self.style.WARNING("\n[DRY RUN] No changes made."))
            return

        confirm = input("\nAre you sure you want to unpublish and delete this page? (y/n): ").strip().lower()
        if confirm != "y":
            self.stdout.write(self.style.WARNING("Aborted."))
            return

        # Step 1: Unpublish — delete the deploy board
        deploy_board.delete()
        self.stdout.write(self.style.SUCCESS("Unpublished page (deploy board deleted)."))

        # Step 2: Delete the page
        if hard:
            page.delete(soft=False)
        else:
            page.delete()

        self.stdout.write(
            self.style.SUCCESS(f"Page '{page.name}' ({page_id}) {'hard' if hard else 'soft'} deleted successfully.")
        )
