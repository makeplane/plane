# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Import the roster from the command line (the production channel).

Usage (inside the API container):

    python manage.py import_users_from_csv --students roster.csv --dry-run
    python manage.py import_users_from_csv --students roster.xlsx \
        --advisors advisors.csv --yes

The management page of the research settings posts the very same service, so
both channels produce identical batches and reports.
"""

from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from plane.db.models import User, UserImportRow, Workspace
from plane.research.services.accounts import AccountError
from plane.research.services.user_import import parse_advisors, parse_students, run_import
from plane.research.utils.roles import PUBLIC_WORKSPACE_SLUG


class Command(BaseCommand):
    help = "Create accounts and organisation nodes from the roster spreadsheet."

    def add_arguments(self, parser):
        parser.add_argument("--workspace", default=PUBLIC_WORKSPACE_SLUG, help="workspace slug")
        parser.add_argument("--students", required=True, help="student roster (csv/xlsx)")
        parser.add_argument("--advisors", help="optional name to mailbox table (csv/xlsx)")
        parser.add_argument("--actor", help="account email recorded as the importer")
        parser.add_argument("--dry-run", action="store_true", help="validate without writing accounts")
        parser.add_argument("--yes", action="store_true", help="confirm the import")
        parser.add_argument(
            "--reset-passwords",
            action="store_true",
            help="re-issue one-time credentials for accounts that already exist",
        )
        parser.add_argument(
            "--strict",
            action="store_true",
            help="exit non-zero when the batch contains rejected rows",
        )

    def handle(self, *args, **options):
        workspace = Workspace.objects.filter(slug=options["workspace"], deleted_at__isnull=True).first()
        if workspace is None:
            raise CommandError(f"Workspace '{options['workspace']}' does not exist")

        actor = None
        if options.get("actor"):
            actor = User.objects.filter(email__iexact=options["actor"]).first()
            if actor is None:
                raise CommandError(f"Actor account '{options['actor']}' does not exist")

        students_path = Path(options["students"])
        if not students_path.exists():
            raise CommandError(f"Roster file not found: {students_path}")

        try:
            students = parse_students(students_path.read_bytes(), students_path.name)
            advisor_map = {}
            if options.get("advisors"):
                advisors_path = Path(options["advisors"])
                if not advisors_path.exists():
                    raise CommandError(f"Advisor table not found: {advisors_path}")
                advisor_map = parse_advisors(advisors_path.read_bytes(), advisors_path.name)
        except AccountError as error:
            raise CommandError(f"{error.error_code}: {error.message}")

        dry_run = bool(options["dry_run"]) or not options["yes"]
        batch = run_import(
            workspace,
            actor,
            students,
            advisor_map=advisor_map,
            dry_run=dry_run,
            source_filename=students_path.name,
            reset_passwords=bool(options["reset_passwords"]),
        )

        batch_label = "preview" if batch.id is None else str(batch.id)
        self.stdout.write(
            f"\nBatch {batch_label} ({'dry run' if batch.dry_run else 'committed'})\n"
            f"  rows={batch.rows_total} ok={batch.rows_ok} "
            f"pending={batch.rows_pending} error={batch.rows_error}"
        )
        if batch.summary.get("groups"):
            self.stdout.write(f"  groups: {', '.join(batch.summary['groups'])}")
        if batch.summary.get("credentials_issued"):
            self.stdout.write(f"  one-time credentials issued: {batch.summary['credentials_issued']}")

        report_rows = (
            [row for row in batch.rows if row.status != UserImportRow.Status.OK]
            if dry_run
            else list(batch.rows.exclude(status=UserImportRow.Status.OK).order_by("row_number")[:50])
        )
        for row in report_rows[:50]:
            self.stdout.write(f"  [{row.status}] row {row.row_number} {row.email}: {row.message}")

        if dry_run:
            self.stdout.write(self.style.WARNING("\nDry run. Re-run with --yes to import."))
            if options["strict"] and batch.rows_error:
                raise CommandError(f"{batch.rows_error} row(s) were rejected")
            return

        if options["strict"] and batch.rows_error:
            raise CommandError(f"{batch.rows_error} row(s) were rejected")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nImported. Report: /api/research/workspaces/{workspace.slug}"
                f"/user-imports/{batch.id}/report/"
            )
        )
