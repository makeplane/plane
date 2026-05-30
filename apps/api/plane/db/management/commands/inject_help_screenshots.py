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
soft-deleted first). Asset IDs are instance-specific; capture+inject runs once
per serving instance.

    python manage.py inject_help_screenshots --dir tools/help-screenshots/out
"""

import os
import re
import uuid

from django.core.management.base import BaseCommand
from django.db import transaction

from plane.db.models import FileAsset, HelpArticleTranslation
from plane.settings.storage import S3Storage

DEFAULT_DIR = "tools/help-screenshots/out"


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
