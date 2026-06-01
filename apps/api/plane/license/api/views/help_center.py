# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import io
import json
import uuid
import zipfile

from django.conf import settings
from django.http import HttpResponse
from django.utils.text import slugify
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from plane.app.serializers.help_center import HelpArticleAdminSerializer, HelpCategoryAdminSerializer
from plane.app.views.help_center.base import (
    VALID_LOCALES,
    coerce_sort_order,
    generate_unique_slug,
    has_titled_translation,
    pick_slug_source,
    upsert_article_translation,
    upsert_article_translations,
    upsert_category_translations,
)
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata
from plane.db.fixtures.help_center.transfer import apply_bundle, build_bundle
from plane.db.models import FileAsset, HelpArticle, HelpCategory
from plane.db.models.help_center import fold_accents
from plane.license.api.views.base import BaseAPIView
from plane.settings.storage import S3Storage

CATEGORY_WRITABLE_FIELDS = ("icon", "color", "is_active")

# Inline help images are bitmap-only, matching the avatar/cover upload allowlist.
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif"]

# Bundle transfer limits — admin-only, occasional op; generous but bounded so a
# crafted upload can neither exhaust memory nor smuggle a decompression bomb.
# A real guide bundle is a few hundred members (categories + articles + images);
# the entry cap is the backstop against a central-directory amplification archive
# whose ZipInfo objects materialise before the uncompressed-size guard runs.
MAX_BUNDLE_UPLOAD_BYTES = 256 * 1024 * 1024
MAX_MANIFEST_BYTES = 64 * 1024 * 1024
MAX_TOTAL_UNCOMPRESSED_BYTES = 1024 * 1024 * 1024
MAX_BUNDLE_ENTRIES = 10000
# Bundle schema this importer understands; build_bundle stamps it (see transfer).
SUPPORTED_BUNDLE_VERSION = 1


class InstanceHelpCategoryEndpoint(BaseAPIView):
    """God Mode: list all categories / create a category (instance-global)."""

    def get(self, request):
        categories = HelpCategory.objects.all().prefetch_related("translations")
        return Response(HelpCategoryAdminSerializer(categories, many=True).data, status=status.HTTP_200_OK)

    def post(self, request):
        translations = [t for t in (request.data.get("translations") or []) if (t.get("name") or "").strip()]
        if not translations:
            return Response({"error": "At least one locale name is required."}, status=status.HTTP_400_BAD_REQUEST)
        category = HelpCategory(
            slug=generate_unique_slug(HelpCategory, pick_slug_source(translations, "name")),
            icon=request.data.get("icon", ""),
            color=request.data.get("color", ""),
            is_active=request.data.get("is_active", True),
        )
        category.save()
        upsert_category_translations(category, translations)
        return Response(HelpCategoryAdminSerializer(category).data, status=status.HTTP_201_CREATED)


class InstanceHelpCategoryDetailEndpoint(BaseAPIView):
    """God Mode: retrieve / update / soft-delete one category."""

    def get(self, request, pk):
        category = HelpCategory.objects.prefetch_related("translations").get(pk=pk)
        return Response(HelpCategoryAdminSerializer(category).data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        category = HelpCategory.objects.get(pk=pk)
        for field in CATEGORY_WRITABLE_FIELDS:
            if field in request.data:
                setattr(category, field, request.data[field])
        if "sort_order" in request.data:
            category.sort_order = coerce_sort_order(request.data["sort_order"])
        category.save()
        if request.data.get("translations"):
            upsert_category_translations(category, request.data["translations"])
        category = HelpCategory.objects.prefetch_related("translations").get(pk=category.id)
        return Response(HelpCategoryAdminSerializer(category).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        category = HelpCategory.objects.get(pk=pk)
        category.delete()  # soft delete (AuditModel)
        return Response(status=status.HTTP_204_NO_CONTENT)


class InstanceHelpArticleEndpoint(BaseAPIView):
    """God Mode: list all articles (incl. drafts) / create an article."""

    def get(self, request):
        articles = HelpArticle.objects.all().select_related("category").prefetch_related("translations")
        category = request.query_params.get("category")
        if category:
            articles = articles.filter(category_id=category)
        status_param = request.query_params.get("status")
        if status_param in ("draft", "published"):
            articles = articles.filter(status=status_param)
        return Response(HelpArticleAdminSerializer(articles, many=True).data, status=status.HTTP_200_OK)

    def post(self, request):
        translations = [t for t in (request.data.get("translations") or []) if (t.get("title") or "").strip()]
        if not translations:
            return Response({"error": "At least one locale title is required."}, status=status.HTTP_400_BAD_REQUEST)
        category = self._resolve_category(request.data.get("category"))
        if category is False:
            return Response({"error": "Invalid category."}, status=status.HTTP_400_BAD_REQUEST)
        article = HelpArticle(
            category=category,
            slug=generate_unique_slug(HelpArticle, pick_slug_source(translations, "title")),
            status="draft",
        )
        article.save()
        upsert_article_translations(article, translations)
        if request.data.get("status") == "published":
            article.status = "published"
            article.save()
        return Response(self._detail(article.id), status=status.HTTP_201_CREATED)

    @staticmethod
    def _resolve_category(category_id):
        if not category_id:
            return None
        category = HelpCategory.objects.filter(pk=category_id).first()
        return category if category else False

    @staticmethod
    def _detail(article_id):
        article = HelpArticle.objects.select_related("category").prefetch_related("translations").get(pk=article_id)
        return HelpArticleAdminSerializer(article).data


class InstanceHelpArticleDetailEndpoint(BaseAPIView):
    """God Mode: retrieve / update / soft-delete one article."""

    def get(self, request, pk):
        article = HelpArticle.objects.select_related("category").prefetch_related("translations").get(pk=pk)
        return Response(HelpArticleAdminSerializer(article).data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        article = HelpArticle.objects.get(pk=pk)
        if request.data.get("translations"):
            upsert_article_translations(article, request.data["translations"])
        new_slug = request.data.get("slug")
        if new_slug and article.status == "draft":
            candidate = slugify(fold_accents(new_slug)) or article.slug
            if candidate != article.slug and HelpArticle.all_objects.filter(slug=candidate).exists():
                return Response({"error": "Slug already in use."}, status=status.HTTP_400_BAD_REQUEST)
            article.slug = candidate
        if "category" in request.data:
            category = InstanceHelpArticleEndpoint._resolve_category(request.data.get("category"))
            if category is False:
                return Response({"error": "Invalid category."}, status=status.HTTP_400_BAD_REQUEST)
            article.category = category
        if "sort_order" in request.data:
            article.sort_order = coerce_sort_order(request.data["sort_order"])
        if "status" in request.data:
            if request.data["status"] == "published" and not has_titled_translation(article):
                return Response(
                    {"error": "Cannot publish an article with no translated title."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            article.status = request.data["status"]
        article.save()
        return Response(InstanceHelpArticleEndpoint._detail(article.id), status=status.HTTP_200_OK)

    def delete(self, request, pk):
        article = HelpArticle.objects.get(pk=pk)
        article.delete()  # soft delete (AuditModel)
        return Response(status=status.HTTP_204_NO_CONTENT)


class InstanceHelpArticleTranslationEndpoint(BaseAPIView):
    """God Mode: upsert one locale's title + rich content for an article."""

    def put(self, request, pk, locale):
        return self._upsert(request, pk, locale)

    def patch(self, request, pk, locale):
        return self._upsert(request, pk, locale)

    def _upsert(self, request, pk, locale):
        if locale not in VALID_LOCALES:
            return Response({"error": "Invalid locale."}, status=status.HTTP_400_BAD_REQUEST)
        if not (request.data.get("title") or "").strip():
            return Response({"error": "Title is required."}, status=status.HTTP_400_BAD_REQUEST)
        article = HelpArticle.objects.get(pk=pk)
        upsert_article_translation(article, locale, request.data)
        return Response(InstanceHelpArticleEndpoint._detail(article.id), status=status.HTTP_200_OK)


class InstanceHelpArticleAssetEndpoint(BaseAPIView):
    """God Mode: presigned upload + completion for an article's inline image.

    The guide is instance-global, so images are stored with no workspace
    (workspace_id=NULL) and served from the workspace-agnostic public static
    endpoint. Asset rows are bound to the article so a missing parent never
    leaves an orphan.
    """

    def post(self, request, pk):
        # Parent must exist before we mint an asset row for it.
        article = HelpArticle.objects.get(pk=pk)
        name = request.data.get("name")
        file_type = request.data.get("type", "image/jpeg")
        size = int(request.data.get("size", settings.FILE_SIZE_LIMIT))
        if not name:
            return Response({"error": "File name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if file_type not in ALLOWED_IMAGE_TYPES:
            return Response(
                {"error": "Invalid file type. Only JPEG, PNG, WebP, JPG and GIF files are allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        size_limit = min(size, settings.FILE_SIZE_LIMIT)
        asset_key = f"{uuid.uuid4().hex}-{name}"
        asset = FileAsset.objects.create(
            attributes={"name": name, "type": file_type, "size": size_limit},
            asset=asset_key,
            size=size_limit,
            entity_type=FileAsset.EntityTypeContext.HELP_ARTICLE_CONTENT,
            entity_identifier=str(article.id),
            user=request.user,
            created_by=request.user,
        )
        storage = S3Storage(request=request)
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key, file_type=file_type, file_size=size_limit
        )
        return Response(
            {"upload_data": presigned_url, "asset_id": str(asset.id), "asset_url": asset.asset_url},
            status=status.HTTP_200_OK,
        )

    def patch(self, request, pk, asset_id):
        # Confirm the S3 upload finished; only then will the static endpoint serve it.
        asset = FileAsset.objects.get(
            id=asset_id, entity_type=FileAsset.EntityTypeContext.HELP_ARTICLE_CONTENT
        )
        asset.is_uploaded = True
        if not asset.storage_metadata:
            get_asset_object_metadata.delay(asset_id=str(asset.id))
        asset.save(update_fields=["is_uploaded"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class InstanceHelpCenterExportEndpoint(BaseAPIView):
    """God Mode: export the whole Help Center (content + images) as a .zip bundle.

    Same layout as the ``export_help_center`` CLI command, zipped: a manifest.json
    plus assets/<asset_id>.<ext>. Use it to promote a reviewed guide to another
    environment via this UI's import (or the CLI's import_help_center).
    """

    def get(self, request):
        manifest, blobs, _missing = build_bundle()
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as bundle:
            bundle.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=1))
            for blob in blobs:
                bundle.writestr(f"assets/{blob['file']}", blob["data"])
        response = HttpResponse(buffer.getvalue(), content_type="application/zip")
        response["Content-Disposition"] = 'attachment; filename="help_center_bundle.zip"'
        return response


class InstanceHelpCenterImportEndpoint(BaseAPIView):
    """God Mode: import a .zip bundle (from this UI's export, or the CLI).

    Additive upsert by slug — overwrites matching articles in THIS instance with the
    bundle's content and uploads its images here; it never deletes guide content the
    target already has. The upload crosses a trust boundary, so it is size-capped,
    the archive is read (never extracted to disk), and asset members are looked up
    by basename only (no path traversal).
    """

    parser_classes = [MultiPartParser]

    def post(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response({"error": "A .zip bundle file is required."}, status=status.HTTP_400_BAD_REQUEST)
        if upload.size and upload.size > MAX_BUNDLE_UPLOAD_BYTES:
            return Response({"error": "Bundle exceeds the 256 MB limit."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            bundle = zipfile.ZipFile(upload)
        except zipfile.BadZipFile:
            return Response(
                {"error": "The uploaded file is not a valid .zip bundle."}, status=status.HTTP_400_BAD_REQUEST
            )
        with bundle:
            entries = bundle.infolist()
            if len(entries) > MAX_BUNDLE_ENTRIES:
                return Response({"error": "Bundle has too many entries."}, status=status.HTTP_400_BAD_REQUEST)
            if sum(info.file_size for info in entries) > MAX_TOTAL_UNCOMPRESSED_BYTES:
                return Response({"error": "Bundle contents are too large."}, status=status.HTTP_400_BAD_REQUEST)
            try:
                manifest_info = bundle.getinfo("manifest.json")
            except KeyError:
                return Response({"error": "Bundle is missing manifest.json."}, status=status.HTTP_400_BAD_REQUEST)
            if manifest_info.file_size > MAX_MANIFEST_BYTES:
                return Response({"error": "Bundle manifest.json is too large."}, status=status.HTTP_400_BAD_REQUEST)
            try:
                manifest = json.loads(bundle.read("manifest.json"))
            except ValueError:
                return Response(
                    {"error": "Bundle manifest.json is not valid JSON."}, status=status.HTTP_400_BAD_REQUEST
                )
            # Fail fast on a malformed manifest BEFORE any DB write, so a crafted
            # bundle yields a clean 400 rather than a partial import + 500.
            if not isinstance(manifest, dict):
                return Response({"error": "Bundle manifest.json is malformed."}, status=status.HTTP_400_BAD_REQUEST)
            if manifest.get("version", SUPPORTED_BUNDLE_VERSION) != SUPPORTED_BUNDLE_VERSION:
                return Response(
                    {"error": "Unsupported bundle version."}, status=status.HTTP_400_BAD_REQUEST
                )
            if not isinstance(manifest.get("categories", []), list) or not isinstance(
                manifest.get("articles", []), list
            ):
                return Response({"error": "Bundle manifest.json is malformed."}, status=status.HTTP_400_BAD_REQUEST)

            def get_asset_bytes(safe_name):
                # safe_name is a validated basename (transfer.safe_basename); reading a
                # named archive member touches no filesystem path.
                try:
                    return bundle.read(f"assets/{safe_name}")
                except KeyError:
                    return None

            stats = apply_bundle(manifest, get_asset_bytes)
        return Response(stats, status=status.HTTP_200_OK)
