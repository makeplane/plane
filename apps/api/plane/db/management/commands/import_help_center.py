# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Import a Help Center bundle (from ``export_help_center``) into this instance.

Upserts categories + articles + translations by slug, uploads the bundled images
into THIS environment's object storage, and rewrites the inline image references
to the freshly-minted asset ids — so a guide reviewed in UAT lands fully wired in
production with no re-typing and no broken images.

Semantics:
  * Additive upsert by slug — updates/creates from the bundle, never deletes guide
    content the target already has. A slug that was soft-deleted in God Mode is
    revived (the unique-slug constraint is not conditioned on deleted_at).
  * Images are uploaded fresh and inline references rewritten to the new ids;
    previously-referenced assets simply fall out of the HTML (they become harmless
    orphans). Re-importing therefore does not break images; it can leave orphaned
    objects in storage — clean those up at the storage layer if needed.

Inputs cross a trust boundary (a bundle copied between environments), so the
import validates manifest-controlled filenames (no path traversal), allowlists the
stored content-type, and re-sanitizes the HTML defensively.

    python manage.py import_help_center --in help_center_export
"""

import json
import os
import re
import uuid

from django.core.management.base import BaseCommand
from django.db import transaction

from plane.app.serializers.help_center import sanitize_help_html
from plane.db.models import FileAsset, HelpArticle, HelpArticleTranslation, HelpCategory
from plane.settings.storage import S3Storage

DEFAULT_IN = "help_center_export"
STATIC_REF = re.compile(r"/api/assets/v2/static/([0-9a-f-]{36})/")
ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"}


class Command(BaseCommand):
    help = "Import a Help Center bundle produced by export_help_center (content + images)."

    def add_arguments(self, parser):
        parser.add_argument("--in", dest="in_dir", default=DEFAULT_IN, help="Bundle directory to import.")

    def handle(self, *args, **options):
        # NOT one global transaction: image uploads write to object storage as a side
        # effect, so each article is committed in its own small transaction — a failure
        # part-way leaves earlier articles done and only the current one to retry.
        in_dir = options["in_dir"]
        manifest_path = os.path.join(in_dir, "manifest.json")
        if not os.path.isfile(manifest_path):
            self.stderr.write(self.style.ERROR(f"manifest.json not found in '{in_dir}'."))
            return
        with open(manifest_path, encoding="utf-8") as handle:
            manifest = json.load(handle)

        assets_by_id = {a["old_id"]: a for a in manifest.get("assets", [])}
        cats = self._import_categories(manifest.get("categories", []))
        n_articles, n_images = self._import_articles(manifest.get("articles", []), assets_by_id, in_dir)

        self.stdout.write(
            self.style.SUCCESS(
                f"Imported {cats} categories, {n_articles} articles, {n_images} images into this instance."
            )
        )

    @staticmethod
    def _revive(model, slug):
        """Get (and un-soft-delete) the row for slug, or a fresh unsaved instance.

        The unique-slug constraint is NOT conditioned on deleted_at, so a slug that
        God Mode soft-deleted is invisible to the default manager but still collides
        on INSERT — look it up through all_objects and revive it instead.
        """
        obj = model.all_objects.filter(slug=slug).first()
        if obj is None:
            # Create first (saved) so the caller's later .save() is an UPDATE — the
            # model auto-sequences sort_order on ADD, which would otherwise clobber
            # the explicit value we set from the bundle.
            return model.objects.create(slug=slug)
        if getattr(obj, "deleted_at", None) is not None:
            obj.deleted_at = None
            obj.save(update_fields=["deleted_at"])
        return obj

    def _import_categories(self, categories):
        count = 0
        for entry in categories:
            with transaction.atomic():
                category = self._revive(HelpCategory, entry["slug"])
                category.sort_order = entry.get("sort_order", 65535)
                category.icon = entry.get("icon", "")
                category.color = entry.get("color", "")
                category.is_active = entry.get("is_active", True)
                category.save()
                for tr in entry.get("translations", []):
                    row, _ = category.translations.get_or_create(
                        locale=tr["locale"], defaults={"name": tr["name"]}
                    )
                    if row.name != tr["name"]:
                        row.name = tr["name"]
                        row.save(update_fields=["name"])
            count += 1
        return count

    def _import_articles(self, articles, assets_by_id, in_dir):
        cat_by_slug = {c.slug: c for c in HelpCategory.objects.all()}
        storage = S3Storage()
        n_articles = 0
        n_images = 0
        for entry in articles:
            with transaction.atomic():
                article = self._revive(HelpArticle, entry["slug"])
                article.sort_order = entry.get("sort_order", 65535)
                article.status = entry.get("status", "draft")
                article.category = cat_by_slug.get(entry.get("category_slug"))
                article.save()

                # One upload per distinct source image for this article, reused across
                # locales that reference it (no duplicate objects per translation).
                uploaded = {}
                for tr in entry.get("translations", []):
                    html = sanitize_help_html(tr.get("description_html") or "<p></p>")
                    json_str = json.dumps(tr.get("description_json") or {}, ensure_ascii=False)

                    old_ids = set(STATIC_REF.findall(html)) | set(STATIC_REF.findall(json_str))
                    for old_id in old_ids:
                        if old_id not in uploaded:
                            bundle_asset = assets_by_id.get(old_id)
                            new_id = self._upload_asset(storage, article, bundle_asset, in_dir) if bundle_asset else None
                            if new_id:
                                uploaded[old_id] = new_id
                        new_id = uploaded.get(old_id)
                        if new_id:
                            # Replacing the full UUID rewrites both the /static/<id>/ URL
                            # and any bare id in the editor JSON (UUIDs never collide).
                            html = html.replace(old_id, new_id)
                            json_str = json_str.replace(old_id, new_id)

                    row, _ = HelpArticleTranslation.objects.get_or_create(
                        article=article, locale=tr["locale"], defaults={"title": tr["title"]}
                    )
                    row.title = tr["title"]
                    row.description_html = html
                    row.description_json = json.loads(json_str)
                    row.save()  # re-derives description_stripped + search_text
                n_images += len(uploaded)
            n_articles += 1
        return n_articles, n_images

    @staticmethod
    def _safe_asset_path(in_dir, file_name):
        """Resolve a bundle asset path, rejecting traversal / absolute names."""
        if not file_name or file_name != os.path.basename(file_name) or file_name in (".", ".."):
            return None
        assets_root = os.path.realpath(os.path.join(in_dir, "assets"))
        path = os.path.realpath(os.path.join(assets_root, file_name))
        if os.path.commonpath([assets_root, path]) != assets_root or not os.path.isfile(path):
            return None
        return path

    def _upload_asset(self, storage, article, bundle_asset, in_dir):
        path = self._safe_asset_path(in_dir, bundle_asset.get("file", ""))
        if not path:
            return None
        with open(path, "rb") as handle:
            data = handle.read()
        attrs = bundle_asset.get("attributes") or {}
        safe_name = os.path.basename(str(attrs.get("name") or bundle_asset["file"]))
        content_type = bundle_asset.get("content_type", "image/png")
        if content_type not in ALLOWED_CONTENT_TYPES:
            content_type = "image/png"
        asset_key = f"{uuid.uuid4().hex}-{safe_name}"
        storage.s3_client.put_object(
            Bucket=storage.aws_storage_bucket_name,
            Key=asset_key,
            Body=data,
            ContentType=content_type,
        )
        asset = FileAsset.objects.create(
            attributes={"name": safe_name, "type": content_type, "size": len(data)},
            asset=asset_key,
            entity_type=FileAsset.EntityTypeContext.HELP_ARTICLE_CONTENT,
            entity_identifier=str(article.id),
            size=len(data),
            is_uploaded=True,
        )
        return str(asset.id)
