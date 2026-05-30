# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Seed the instance-global Help Center from the content-as-code source tree.

The guide is instance-wide (no workspace scope), so this runs ONCE per instance —
NOT per workspace and NOT from a migration. It is idempotent and treats the
markdown source under ``plane/db/fixtures/help_center/`` as the source of truth:
re-running refreshes bodies, it does not duplicate rows.

    python manage.py seed_help_center
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from plane.db.fixtures.help_center.loader import seed_help_content


class Command(BaseCommand):
    help = "Seed the instance-global Help Center from the markdown content tree (idempotent)."

    @transaction.atomic
    def handle(self, *args, **options):
        counts = seed_help_content()
        self.stdout.write(
            self.style.SUCCESS(
                "Help Center seeded from content tree: "
                f"{counts['categories']} categories, {counts['articles']} articles, "
                f"{counts['translations']} translations (source-of-truth refresh)."
            )
        )
