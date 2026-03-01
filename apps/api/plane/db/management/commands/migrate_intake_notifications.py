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
from django.core.management.base import BaseCommand

# Module imports
from plane.db.models import IntakeIssue, Notification


class Command(BaseCommand):
    """
    Migrate notifications incorrectly created with entity_name='intake'.

    Background:
    -----------
    A bug existed in the `get_entity_type()` method in `apps/api/plane/utils/notifications/workitem.py`
    where the check for intake issues was incorrectly implemented:

        # Before (buggy):
        elif self.entity.issue_intake:
            return "intake"

        # After (fixed):
        elif self.entity.issue_intake.exists():
            return "intake"

    The bug caused `self.entity.issue_intake` to be evaluated as truthy (returning the RelatedManager)
    even when no actual IntakeIssue record existed for the issue. This resulted in notifications being
    incorrectly labeled with entity_name='intake' for regular issues that were never part of intake.

    This was fixed in PR #5641: [WEB-6086] fix: intake notifications
    https://github.com/makeplane/plane-ee/pull/5641

    What this command does:
    -----------------------
    This management command migrates all notifications that were incorrectly created with
    entity_name='intake' but whose entity_identifier (issue_id) does not exist in the
    intake_issues table. These notifications are updated to have entity_name='issue' instead.

    Usage:
    ------
        # Check how many notifications need migration (no changes made)
        python manage.py migrate_inbox_notifications --dry-run

        # Run the migration with default batch size (1000)
        python manage.py migrate_inbox_notifications

        # Run with custom batch size
        python manage.py migrate_inbox_notifications --batch-size 500
    """

    help = "Migrate notifications incorrectly created with entity_name='intake' to 'issue' (fixes data from bug in PR #5641)"  # noqa: E501

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show count of notifications to be migrated without making changes",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=1000,
            help="Number of records to process per batch (default: 1000)",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        batch_size = options["batch_size"]

        # Subquery to get all issue_ids from intake_issues - executed in database
        intake_issue_ids_subquery = IntakeIssue.objects.values("issue_id")

        # Base queryset for notifications that need migration
        def get_notifications_to_migrate():
            return Notification.objects.filter(entity_name="intake").exclude(
                entity_identifier__in=intake_issue_ids_subquery
            )

        total_count = get_notifications_to_migrate().count()

        if total_count == 0:
            self.stdout.write(self.style.SUCCESS("No notifications found that need migration"))
            return

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f"[DRY RUN] Found {total_count} notifications with entity_name='intake' "
                    "that are not in intake_issues table"
                )
            )
            return

        self.stdout.write(f"Found {total_count} notifications to migrate. Processing in batches of {batch_size}...")

        migrated_count = 0

        while True:
            # Get batch of IDs to update
            batch_ids = list(get_notifications_to_migrate().values_list("id", flat=True)[:batch_size])

            if not batch_ids:
                break

            updated = Notification.objects.filter(id__in=batch_ids).update(entity_name="issue")
            migrated_count += updated

            self.stdout.write(f"Migrated {migrated_count}/{total_count} notifications...")

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully migrated {migrated_count} notifications from entity_name='intake' to 'issue'"
            )
        )
