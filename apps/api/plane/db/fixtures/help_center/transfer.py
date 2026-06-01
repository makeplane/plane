# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Shared, framework-neutral Help Center transfer core (export + import).

Each environment owns its Help Center independently: seeded once, then edited in
God Mode (rows in the DB, images in this instance's object storage). To promote a
reviewed guide to another environment you build a portable bundle here and apply
it on the target.

Both callers go through this module so the hardening lives in ONE place:
  * CLI:   export_help_center / import_help_center management commands (bundle = a
           directory: manifest.json + assets/<id>.<ext>).
  * God Mode: the license export/import endpoints (bundle = the same layout zipped).

A bundle is pure data — this module never touches the filesystem or zip archives:
  * ``build_bundle()`` returns (manifest dict, list of {file, data: bytes}); the
    caller writes those to a directory or a zip.
  * ``apply_bundle(manifest, get_asset_bytes)`` upserts everything; the caller
    supplies image bytes by (already-basename-safe) file name.

Hardened invariants (why each exists):
  * A slug soft-deleted in God Mode still reserves the unique constraint, so revive
    it through all_objects instead of colliding on INSERT (``revive_by_slug``).
  * A bundle crosses a trust boundary — asset file names are reduced to a bare
    basename so a crafted ``../`` name can never escape the assets root
    (``safe_basename``); the content-type is allowlisted before it is stored.
  * Image uploads write to object storage as a side effect, so each article is its
    own transaction (a mid-run failure leaves earlier articles done) and each
    distinct source image is uploaded once per article, reused across locales.
  * Imported HTML is re-sanitized defensively.
"""

import json
import os
import re
import uuid

from django.db import transaction

from plane.app.serializers.help_center import sanitize_help_html
from plane.db.models import FileAsset, HelpArticle, HelpArticleTranslation, HelpCategory
from plane.settings.storage import S3Storage

# Inline image references written by the seed/inject pipeline and the God-Mode
# editor: /api/assets/v2/static/<uuid>/ . Every asset id referenced in any
# translation is part of the bundle (covers injected screenshots + admin uploads).
STATIC_REF = re.compile(r"/api/assets/v2/static/([0-9a-f-]{36})/")
ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"}


def revive_by_slug(model, slug):
    """Return the row for slug (un-soft-deleting a God-Mode-deleted one), else create it.

    The unique-slug constraint is NOT conditioned on deleted_at, so a soft-deleted
    slug is invisible to the default manager but still collides on INSERT — look it
    up through all_objects. Creating-when-missing (vs returning an unsaved instance)
    keeps the caller's later .save() an UPDATE, so the model's add-time sort_order
    auto-sequencing does not clobber the explicit order.
    """
    obj = model.all_objects.filter(slug=slug).first()
    if obj is None:
        return model.objects.create(slug=slug)
    if getattr(obj, "deleted_at", None) is not None:
        obj.deleted_at = None
        obj.save(update_fields=["deleted_at"])
    return obj


def safe_basename(file_name):
    """Reduce a bundle-controlled asset name to a safe basename, or None.

    Rejects absolute paths, traversal segments, and the . / .. specials. The result
    is a pure file name with no directory component, so neither a directory read nor
    a zip member lookup can escape the bundle's assets root.
    """
    if not file_name or file_name != os.path.basename(file_name) or file_name in (".", ".."):
        return None
    return file_name


# ── Export ─────────────────────────────────────────────────────────────────────


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
                "translations": [{"locale": t.locale, "name": t.name} for t in category.translations.all()],
            }
        )
    return rows


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


def _dump_assets(referenced_ids):
    """Pull the bytes of every referenced asset from object storage.

    Returns (manifest_entries, blobs) where blobs is [{file, data: bytes}] so the
    caller decides how to persist them (files on disk or zip members). A referenced
    id is absent from the result if it has no uploaded FileAsset row or its object
    fetch fails — build_bundle derives the "missing" count from that difference.
    """
    storage = S3Storage()
    manifest_entries = []
    blobs = []
    for asset in FileAsset.objects.filter(
        id__in=referenced_ids,
        entity_type=FileAsset.EntityTypeContext.HELP_ARTICLE_CONTENT,
        is_uploaded=True,
        is_deleted=False,
    ):
        asset_key = str(asset.asset)  # FieldFile -> storage key string
        try:
            body = storage.s3_client.get_object(Bucket=storage.aws_storage_bucket_name, Key=asset_key)["Body"].read()
        except Exception:  # missing object / storage error — skip, keep going
            continue
        attrs = asset.attributes or {}
        ext = os.path.splitext(asset_key)[1] or ".png"
        filename = f"{asset.id}{ext}"
        manifest_entries.append(
            {
                "old_id": str(asset.id),
                "file": filename,
                "content_type": (attrs.get("type") or "image/png"),
                "attributes": attrs,
            }
        )
        blobs.append({"file": filename, "data": body})
    return manifest_entries, blobs


def build_bundle():
    """Build a portable bundle of the instance's Help Center.

    Returns (manifest, blobs, missing):
      * manifest: {version, categories, articles, assets} — assets carry metadata
        only (old_id/file/content_type/attributes), no bytes.
      * blobs: [{file, data: bytes}] — the image bytes, keyed by the manifest file name.
      * missing: count of referenced images not in the bundle (no uploaded FileAsset
        row, or the storage fetch failed) — surfaced as an operator warning.
    """
    categories = _dump_categories()
    articles, referenced_ids = _dump_articles()
    assets, blobs = _dump_assets(referenced_ids)
    manifest = {"version": 1, "categories": categories, "articles": articles, "assets": assets}
    missing = len(referenced_ids) - len(assets)
    return manifest, blobs, missing


# ── Import ───────────────────────────────────────────────────────────────────


def _import_categories(categories):
    count = 0
    for entry in categories:
        with transaction.atomic():
            category = revive_by_slug(HelpCategory, entry["slug"])
            category.sort_order = entry.get("sort_order", 65535)
            category.icon = entry.get("icon", "")
            category.color = entry.get("color", "")
            category.is_active = entry.get("is_active", True)
            category.save()
            for tr in entry.get("translations", []):
                row, _ = category.translations.get_or_create(locale=tr["locale"], defaults={"name": tr["name"]})
                if row.name != tr["name"]:
                    row.name = tr["name"]
                    row.save(update_fields=["name"])
        count += 1
    return count


def _upload_asset(storage, article, bundle_asset, get_asset_bytes):
    """Upload one bundled image into this instance's storage; return its new asset id."""
    safe = safe_basename(bundle_asset.get("file", ""))
    if not safe:
        return None
    data = get_asset_bytes(safe)
    if not data:
        return None
    attrs = bundle_asset.get("attributes") or {}
    safe_name = os.path.basename(str(attrs.get("name") or safe))
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


def _import_articles(articles, assets_by_id, get_asset_bytes):
    cat_by_slug = {c.slug: c for c in HelpCategory.objects.all()}
    storage = S3Storage()
    n_articles = 0
    n_images = 0
    for entry in articles:
        with transaction.atomic():
            article = revive_by_slug(HelpArticle, entry["slug"])
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
                        new_id = (
                            _upload_asset(storage, article, bundle_asset, get_asset_bytes) if bundle_asset else None
                        )
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


def apply_bundle(manifest, get_asset_bytes):
    """Import a bundle into this instance.

    ``get_asset_bytes(safe_file_name)`` -> bytes | None supplies an image's bytes;
    it is only ever called with a basename already validated by ``safe_basename``.

    Additive upsert by slug — updates/creates from the bundle, never deletes guide
    content the target already has. Images are uploaded fresh and inline references
    rewritten to the new ids; previously-referenced assets become harmless orphans.

    Returns {"categories": int, "articles": int, "images": int}.
    """
    assets_by_id = {a["old_id"]: a for a in manifest.get("assets", [])}
    n_categories = _import_categories(manifest.get("categories", []))
    n_articles, n_images = _import_articles(manifest.get("articles", []), assets_by_id, get_asset_bytes)
    return {"categories": n_categories, "articles": n_articles, "images": n_images}
