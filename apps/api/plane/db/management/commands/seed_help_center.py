# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Seed the instance-global Help Center from the content-as-code source tree.

The guide is instance-wide (no workspace scope), so this runs ONCE per instance —
NOT per workspace and NOT from a migration. It is idempotent and treats the
markdown source under ``plane/db/fixtures/help_center/`` as the source of truth:
re-running refreshes bodies, it does not duplicate rows.

Screenshots ship WITH the repo (``_screenshots/`` beside the content), so this
command also injects them by default — one command yields a fully-populated
guide, including on offline / air-gapped instances (no Playwright capture). Pass
``--skip-screenshots`` to seed article text only.

    python manage.py seed_help_center
    python manage.py seed_help_center --skip-screenshots
"""

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction

from plane.db.fixtures.help_center.loader import seed_help_content
from plane.db.models import HelpArticle


class Command(BaseCommand):
    help = "Seed the instance-global Help Center from the markdown content tree (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--skip-screenshots",
            action="store_true",
            help="Seed article text only; do not inject the committed screenshots.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Overwrite existing content from the markdown source (default: refuse if content exists).",
        )

    def handle(self, *args, **options):
        # One-time bootstrap per environment: once an instance has Help Center content
        # (biz teams then own it via God Mode), re-seeding would overwrite those edits
        # from the repo markdown. Refuse by default; require --force to re-seed.
        if not options["force"] and HelpArticle.objects.exists():
            self.stdout.write(
                self.style.WARNING(
                    "Help Center already has content in this instance — skipping to protect "
                    "God-Mode edits. Re-run with --force to overwrite from the markdown source."
                )
            )
            return
        # Keep the content upsert in its own transaction; image injection (which also
        # writes to object storage) runs afterwards in its own transaction, so a
        # storage hiccup can't roll back the seeded text.
        with transaction.atomic():
            counts = seed_help_content()
        self.stdout.write(
            self.style.SUCCESS(
                "Help Center seeded from content tree: "
                f"{counts['categories']} categories, {counts['articles']} articles, "
                f"{counts['translations']} translations (source-of-truth refresh)."
            )
        )
        # Re-seeding refreshes article bodies, restoring the raw screenshot markers,
        # so re-inject the committed images right after to keep the guide populated.
        if not options["skip_screenshots"]:
            call_command("inject_help_screenshots")
