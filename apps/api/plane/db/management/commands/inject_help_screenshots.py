# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Upload captured Help Center screenshots and inject them into article HTML.

Reads a directory of PNGs named `<screenshot-name>.png` (the name matches a
`{{screenshot:NAME}}` placeholder authored in the markdown). For each, it:
  1. finds every published-or-draft article translation carrying the marker
     `data-help-screenshot="NAME"`,
  2. uploads the PNG as an instance-global asset
     (`FileAsset` entity_type=HELP_ARTICLE_CONTENT, workspace=NULL), and
  3. replaces the marker with `<img data-help-screenshot="NAME" src="/api/assets/v2/static/{id}/">`.

The image keeps the `data-help-screenshot` attribute so a re-run finds and
replaces it again (idempotent — prior assets for the same name+article are
soft-deleted first). Asset IDs are instance-specific; inject runs once per
serving instance (run after ``seed_help_center``, which now calls it
automatically).

By default it reads the screenshots that ship WITH the repo under
``plane/db/fixtures/help_center/_screenshots/`` (leading ``_`` so the content
loader skips the folder) — so an air-gapped instance gets the images by running
the seed command alone, no Playwright capture needed. Point ``--dir`` at the
capture tool's ``out/`` only when refreshing the committed set.

    python manage.py inject_help_screenshots                 # committed images
    python manage.py inject_help_screenshots --dir <path>    # a custom set
"""

import os
import re
import uuid

from django.core.management.base import BaseCommand
from django.db import transaction

import plane.db.fixtures.help_center as _help_fixtures
from plane.db.models import FileAsset, HelpArticleTranslation
from plane.settings.storage import S3Storage

# Screenshots committed alongside the markdown content (portable, offline-ready).
DEFAULT_DIR = os.path.join(os.path.dirname(os.path.abspath(_help_fixtures.__file__)), "_screenshots")


def marker_pattern(name):
    """Match the <p>/<span> placeholder OR a previously-injected <img>, for NAME."""
    safe = re.escape(name)
    return re.compile(
        rf'<(?:p|span|img)\b[^>]*\bdata-help-screenshot="{safe}"[^>]*>(?:\s*</(?:p|span)>)?'
    )


class Command(BaseCommand):
    help = "Upload screenshot PNGs and inject them into help article HTML (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument("--dir", default=DEFAULT_DIR, help="Directory of <name>.png screenshots.")

    @transaction.atomic
    def handle(self, *args, **options):
        directory = options["dir"]
        if not os.path.isdir(directory):
            self.stderr.write(self.style.ERROR(f"Directory not found: {directory}"))
            return

        injected = 0
        unmatched = []
        for filename in sorted(os.listdir(directory)):
            if not filename.endswith(".png"):
                continue
            name = filename[:-4]
            marker = f'data-help-screenshot="{name}"'
            rows = list(HelpArticleTranslation.objects.filter(description_html__contains=marker))
            if not rows:
                unmatched.append(name)
                continue
            with open(os.path.join(directory, filename), "rb") as handle:
                data = handle.read()
            for row in rows:
                self._inject(row, name, data)
                injected += 1

        self.stdout.write(self.style.SUCCESS(f"Injected {injected} screenshot(s) into articles."))
        if unmatched:
            self.stdout.write(self.style.WARNING(f"No marker found for: {', '.join(unmatched)}"))

    def _inject(self, row, name, data):
        article_id = str(row.article_id)
        # Supersede any prior asset for this (article, screenshot) so re-runs don't orphan-grow.
        FileAsset.objects.filter(
            entity_type=FileAsset.EntityTypeContext.HELP_ARTICLE_CONTENT,
            entity_identifier=article_id,
            attributes__help_screenshot=name,
        ).update(is_deleted=True)

        # Upload bytes straight to object storage via the boto3 client (the custom
        # S3Storage doesn't support Django's FileField.save() path).
        asset_key = f"{uuid.uuid4().hex}-{name}.png"
        storage = S3Storage()
        storage.s3_client.put_object(
            Bucket=storage.aws_storage_bucket_name,
            Key=asset_key,
            Body=data,
            ContentType="image/png",
        )
        asset = FileAsset.objects.create(
            attributes={"name": f"{name}.png", "type": "image/png", "size": len(data), "help_screenshot": name},
            asset=asset_key,
            entity_type=FileAsset.EntityTypeContext.HELP_ARTICLE_CONTENT,
            entity_identifier=article_id,
            size=len(data),
            is_uploaded=True,
        )

        alt = (row.title or name).replace('"', "&quot;")
        img = f'<img data-help-screenshot="{name}" src="/api/assets/v2/static/{asset.id}/" alt="{alt}" />'
        row.description_html = marker_pattern(name).sub(img, row.description_html)
        row.save()  # re-derive description_stripped + search_text
