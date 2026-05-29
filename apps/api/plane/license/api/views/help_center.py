# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.utils.text import slugify
from rest_framework import status
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
from plane.db.models import HelpArticle, HelpCategory
from plane.db.models.help_center import fold_accents
from plane.license.api.views.base import BaseAPIView

CATEGORY_WRITABLE_FIELDS = ("icon", "color", "is_active")


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
