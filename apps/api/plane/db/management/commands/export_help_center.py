# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Export the instance's Help Center (content + images) to a portable bundle.

Each environment owns its Help Center independently: it is seeded ONCE, then the
business team edits it in God Mode (rows in the DB, images in this instance's
object storage). To promote a reviewed UAT guide to production, export it here,
copy the bundle across (scp / USB — it is just files), and run
``import_help_center`` on the target.

Bundle layout (a plain directory; tar it if you prefer a single file):

    <out>/manifest.json          categories + articles + per-locale translations
    <out>/assets/<asset_id>.<ext>  the image bytes pulled from object storage

The translations keep their HTML/JSON exactly as stored (image URLs still point at
THIS env's asset ids); ``import_help_center`` rewrites those ids to the target
env's freshly-uploaded assets. Asset ids are per-environment — only the bytes are
portable.

    python manage.py export_help_center --out help_center_export
"""

import json
import os
import re

from django.core.management.base import BaseCommand

from plane.db.models import FileAsset, HelpArticle, HelpCategory
from plane.settings.storage import S3Storage

DEFAULT_OUT = "help_center_export"
# Inline image references written by the seed/inject pipeline and the God-Mode
# editor: /api/assets/v2/static/<uuid>/ . We export every asset id referenced in
# any translation (covers both injected screenshots and admin uploads).
STATIC_REF = re.compile(r"/api/assets/v2/static/([0-9a-f-]{36})/")


class Command(BaseCommand):
    help = "Export Help Center content + images to a portable bundle for another instance."

    def add_arguments(self, parser):
        parser.add_argument("--out", default=DEFAULT_OUT, help="Output directory for the bundle.")

    def handle(self, *args, **options):
        out_dir = options["out"]
        assets_dir = os.path.join(out_dir, "assets")
        os.makedirs(assets_dir, exist_ok=True)

        categories = self._dump_categories()
        articles, referenced_ids = self._dump_articles()
        assets = self._dump_assets(referenced_ids, assets_dir)

        manifest = {"version": 1, "categories": categories, "articles": articles, "assets": assets}
        with open(os.path.join(out_dir, "manifest.json"), "w", encoding="utf-8") as handle:
            json.dump(manifest, handle, ensure_ascii=False, indent=1)

        self.stdout.write(
            self.style.SUCCESS(
                f"Exported {len(categories)} categories, {len(articles)} articles, "
                f"{len(assets)} images to '{out_dir}/'."
            )
        )
        missing = len(referenced_ids) - len(assets)
        if missing > 0:
            self.stdout.write(self.style.WARNING(f"{missing} referenced image(s) had no stored object and were skipped."))

    @staticmethod
    def _dump_categories():
        rows = []
        for category in HelpCategory.objects.all().prefetch_related("translations"):
            rows.append(
                {
                    "slug": category.slug,
                    "sort_order": category.sort_order,
                    "icon": category.icon,
                    "color": category.color,
                    "is_active": category.is_active,
                    "translations": [
                        {"locale": t.locale, "name": t.name} for t in category.translations.all()
                    ],
                }
            )
        return rows

    @staticmethod
    def _dump_articles():
        rows = []
        referenced_ids = set()
        articles = HelpArticle.objects.all().select_related("category").prefetch_related("translations")
        for article in articles:
            translations = []
            for t in article.translations.all():
                referenced_ids.update(STATIC_REF.findall(t.description_html or ""))
                referenced_ids.update(STATIC_REF.findall(json.dumps(t.description_json or {})))
                translations.append(
                    {
                        "locale": t.locale,
                        "title": t.title,
                        "description_html": t.description_html,
                        "description_json": t.description_json,
                    }
                )
            rows.append(
                {
                    "slug": article.slug,
                    "sort_order": article.sort_order,
                    "status": article.status,
                    "category_slug": article.category.slug if article.category else None,
                    "translations": translations,
                }
            )
        return rows, referenced_ids

    def _dump_assets(self, referenced_ids, assets_dir):
        """Pull the bytes of every referenced asset from object storage."""
        storage = S3Storage()
        dumped = []
        for asset in FileAsset.objects.filter(
            id__in=referenced_ids,
            entity_type=FileAsset.EntityTypeContext.HELP_ARTICLE_CONTENT,
            is_uploaded=True,
            is_deleted=False,
        ):
            asset_key = str(asset.asset)  # FieldFile -> storage key string
            try:
                body = storage.s3_client.get_object(
                    Bucket=storage.aws_storage_bucket_name, Key=asset_key
                )["Body"].read()
            except Exception as exc:  # missing object / storage error — skip, keep going
                self.stdout.write(self.style.WARNING(f"  skip asset {asset.id}: {exc}"))
                continue
            attrs = asset.attributes or {}
            ext = os.path.splitext(asset_key)[1] or ".png"
            filename = f"{asset.id}{ext}"
            with open(os.path.join(assets_dir, filename), "wb") as handle:
                handle.write(body)
            dumped.append(
                {
                    "old_id": str(asset.id),
                    "file": filename,
                    "content_type": (attrs.get("type") or "image/png"),
                    "attributes": attrs,
                }
            )
        return dumped
