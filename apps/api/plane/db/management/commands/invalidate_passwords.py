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

# Python imports
import csv

# Django imports
from django.core.management import BaseCommand, CommandError

# Module imports
from plane.db.models import User


class Command(BaseCommand):
    help = "Invalidate passwords for users by email. Provide a single email or a CSV file."

    def add_arguments(self, parser):
        group = parser.add_mutually_exclusive_group(required=True)
        group.add_argument(
            "--email",
            type=str,
            help="One or more comma-separated email addresses",
        )
        group.add_argument(
            "--csv",
            type=str,
            dest="csv_file",
            help="Path to a CSV file containing email addresses",
        )
        parser.add_argument(
            "--column",
            type=str,
            default="email",
            help='Name of the CSV column containing emails (default: "email")',
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview which users would be affected without making changes",
        )

    def _get_emails(self, options):
        """Extract emails from either --email or --csv option."""
        if options["email"]:
            return {e.strip().lower() for e in options["email"].split(",") if e.strip()}

        csv_file = options["csv_file"]
        column = options["column"]
        try:
            with open(csv_file, "r") as f:
                reader = csv.DictReader(f)
                if column not in (reader.fieldnames or []):
                    raise CommandError(
                        f'Column "{column}" not found in CSV. '
                        f"Available columns: {', '.join(reader.fieldnames or [])}"
                    )
                emails = set()
                for row in reader:
                    value = row.get(column)
                    if not value:
                        continue
                    stripped = value.strip()
                    if not stripped:
                        continue
                    emails.add(stripped.lower())
                return emails
        except FileNotFoundError:
            raise CommandError(f"File not found: {csv_file}")
        except (PermissionError, UnicodeDecodeError, csv.Error) as exc:
            raise CommandError(f"Error reading CSV file '{csv_file}': {exc}")

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        emails = self._get_emails(options)

        if not emails:
            raise CommandError("No email addresses provided")

        self.stdout.write(f"Found {len(emails)} email(s) to process")

        # Find matching users
        users = User.objects.filter(email__in=emails)
        found_emails = set(users.values_list("email", flat=True))
        not_found = emails - found_emails

        if not_found:
            self.stderr.write(
                self.style.WARNING(f"{len(not_found)} email(s) not found: {', '.join(sorted(not_found))}")
            )

        if not found_emails:
            raise CommandError("No matching users found in the database")

        if dry_run:
            self.stdout.write(self.style.WARNING("[DRY RUN] No changes will be made"))
            for email in sorted(found_emails):
                self.stdout.write(f"  Would invalidate password for: {email}")
            self.stdout.write(self.style.WARNING(f"[DRY RUN] Would invalidate {len(found_emails)} password(s)"))
            return

        # Invalidate passwords
        count = 0
        for user in users:
            user.set_unusable_password()
            user.is_password_autoset = True
            user.save(update_fields=["password", "is_password_autoset"])
            count += 1
            self.stdout.write(f"  Invalidated password for: {user.email}")

        self.stdout.write(self.style.SUCCESS(f"Successfully invalidated {count} password(s)"))
