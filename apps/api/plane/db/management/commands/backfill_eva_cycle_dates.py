# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.core.management.base import BaseCommand

# Module imports
from plane.db.models import Cycle, Importer
from plane.utils.importers.eva.client import EvaApiClient
from plane.utils.importers.eva.extract import EvaExtractor
from plane.utils.importers.eva.transform import EvaTransformer


class Command(BaseCommand):
    help = (
        "Backfill start_date/end_date on cycles imported from EVA that were created without them "
        "(a bug in the original importer). Only touches cycles where both dates are still null; "
        "cycles with real dates are never modified."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would change without saving anything",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        total_updated = 0
        total_still_open = 0

        importers = Importer.objects.filter(service="eva", status="completed").select_related("project")

        for importer in importers:
            metadata = importer.metadata or {}
            url = metadata.get("url")
            token = metadata.get("token")
            eva_project_id = metadata.get("eva_project_id")
            if not url or not token or not eva_project_id:
                self.stdout.write(
                    self.style.WARNING(
                        f"Skipping importer {importer.id} ({importer.project.name}): "
                        "missing url/token/eva_project_id in metadata"
                    )
                )
                continue

            broken_cycles = list(
                Cycle.objects.filter(
                    project=importer.project,
                    external_source="eva",
                    start_date__isnull=True,
                    end_date__isnull=True,
                )
            )
            if not broken_cycles:
                continue

            client = EvaApiClient(url, token)
            extractor = EvaExtractor(client)
            transformer = EvaTransformer(base_url=url)

            try:
                eva_lists = extractor.list_lists(eva_project_id)
            except Exception as error:
                self.stdout.write(
                    self.style.ERROR(f"Failed to fetch EVA lists for project {importer.project.name}: {error}")
                )
                continue

            lists_by_code = {item["code"]: item for item in eva_lists if item.get("code")}

            to_update = []
            still_open = 0
            for cycle in broken_cycles:
                record = lists_by_code.get(cycle.external_id)
                if not record:
                    continue
                end_date = transformer.parse_date(record.get("status_closed_at"))
                start_date = transformer.parse_date(record.get("cmf_created_at"))
                if not end_date or not start_date:
                    still_open += 1
                    continue
                cycle.start_date = start_date
                cycle.end_date = end_date
                to_update.append(cycle)

            self.stdout.write(
                f"{importer.project.name}: {len(to_update)}/{len(broken_cycles)} cycles will get dates"
                f" ({still_open} still open in EVA, left untouched)"
            )
            for cycle in to_update[:5]:
                self.stdout.write(f"  - {cycle.name}: start={cycle.start_date} end={cycle.end_date}")
            if len(to_update) > 5:
                self.stdout.write(f"  ... and {len(to_update) - 5} more")

            if not dry_run and to_update:
                Cycle.objects.bulk_update(to_update, ["start_date", "end_date"])

            total_updated += len(to_update)
            total_still_open += still_open

        verb = "Would update" if dry_run else "Updated"
        self.stdout.write(
            self.style.SUCCESS(f"{verb} {total_updated} cycles ({total_still_open} still open in EVA, left untouched)")
        )
