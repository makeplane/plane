# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Q
from django.utils.text import slugify
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.permissions.workspace import WorkspaceUserPermission
from plane.app.serializers.help_center import HelpArticleDetailSerializer, HelpArticleListSerializer
from plane.app.views.base import BaseViewSet
from plane.db.models import HelpArticle, HelpArticleTranslation, HelpCategory, Workspace
from plane.db.models.help_center import fold_accents

from .base import (
    VALID_LOCALES,
    AccentInsensitiveSearchFilter,
    HelpCenterViewSetMixin,
    coerce_sort_order,
    generate_unique_slug,
    pick_slug_source,
    upsert_article_translation,
    upsert_article_translations,
)


def _has_titled_translation(article):
    # Fresh query (avoids stale prefetch cache) for the publish invariant.
    return any(
        (title or "").strip()
        for title in HelpArticleTranslation.objects.filter(article=article).values_list("title", flat=True)
    )


class HelpArticleViewSet(HelpCenterViewSetMixin, BaseViewSet):
    model = HelpArticle
    serializer_class = HelpArticleListSerializer
    permission_classes = [WorkspaceUserPermission]
    # Accent-folded search over the precomputed per-locale folded column. The
    # JOIN spans all VI/EN/KO rows, so search is multilingual + accent-insensitive.
    filter_backends = [AccentInsensitiveSearchFilter, DjangoFilterBackend]
    search_fields = ["translations__search_text"]

    def get_serializer_class(self):
        return HelpArticleDetailSerializer if self.action == "retrieve" else HelpArticleListSerializer

    def get_queryset(self):
        slug = self.kwargs.get("slug")
        queryset = (
            HelpArticle.objects.filter(workspace__slug=slug)
            .select_related("category")
            .prefetch_related("translations", "category__translations")
        )
        if self.is_admin():
            # ?status= is a list filter only — applying it on write actions would
            # make the refetch spuriously miss a row whose status differs.
            status_param = self.request.GET.get("status")
            if self.action == "list" and status_param in ("draft", "published"):
                queryset = queryset.filter(status=status_param)
        else:
            # Members never see drafts or articles with no usable translation —
            # enforced here so list + retrieve + search all inherit it.
            queryset = queryset.filter(
                status="published",
                translations__title__gt="",
                translations__deleted_at__isnull=True,
            )
        category = self.request.GET.get("category")
        if category:
            queryset = queryset.filter(category_id=category)
        # distinct: the translations join (visibility + search) can duplicate rows.
        return queryset.distinct()

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        translations = [t for t in (request.data.get("translations") or []) if (t.get("title") or "").strip()]
        if not translations:
            return Response(
                {"error": "At least one locale title is required."}, status=status.HTTP_400_BAD_REQUEST
            )
        category = self._resolve_category(workspace, request.data.get("category"))
        if category is False:
            return Response({"error": "Invalid category."}, status=status.HTTP_400_BAD_REQUEST)
        article = HelpArticle(
            workspace=workspace,
            category=category,
            slug=generate_unique_slug(HelpArticle, workspace, pick_slug_source(translations, "title")),
            status="draft",
        )
        article.save()
        upsert_article_translations(article, translations)
        if request.data.get("status") == "published":
            article.status = "published"
            article.save()
        article = self.get_queryset().get(pk=article.id)
        return Response(self._detail(article), status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        article = self.get_queryset().get(pk=pk)
        if request.data.get("translations"):
            upsert_article_translations(article, request.data["translations"])
        new_slug = request.data.get("slug")
        if new_slug and article.status == "draft":
            candidate = slugify(fold_accents(new_slug)) or article.slug
            if candidate != article.slug and HelpArticle.all_objects.filter(
                workspace=article.workspace, slug=candidate
            ).exists():
                return Response({"error": "Slug already in use."}, status=status.HTTP_400_BAD_REQUEST)
            article.slug = candidate
        if "category" in request.data:
            category = self._resolve_category(article.workspace, request.data.get("category"))
            if category is False:
                return Response({"error": "Invalid category."}, status=status.HTTP_400_BAD_REQUEST)
            article.category = category
        if "sort_order" in request.data:
            article.sort_order = coerce_sort_order(request.data["sort_order"])
        if "status" in request.data:
            if request.data["status"] == "published" and not _has_titled_translation(article):
                return Response(
                    {"error": "Cannot publish an article with no translated title."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            article.status = request.data["status"]
        article.save()
        article = self.get_queryset().get(pk=article.id)
        return Response(self._detail(article))

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        article = self.get_queryset().get(pk=pk)
        article.delete()  # soft delete (AuditModel)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def translation(self, request, slug, pk, locale):
        if locale not in VALID_LOCALES:
            return Response({"error": "Invalid locale."}, status=status.HTTP_400_BAD_REQUEST)
        if not (request.data.get("title") or "").strip():
            return Response({"error": "Title is required."}, status=status.HTTP_400_BAD_REQUEST)
        article = self.get_queryset().get(pk=pk)  # workspace-scoped (cross-workspace -> 404)
        upsert_article_translation(article, locale, request.data)
        article = self.get_queryset().get(pk=article.id)
        return Response(self._detail(article))

    def _resolve_category(self, workspace, category_id):
        """Return a category, None (cleared), or False (invalid id)."""
        if not category_id:
            return None
        category = HelpCategory.objects.filter(workspace=workspace, pk=category_id).first()
        return category if category else False

    def _detail(self, article):
        return HelpArticleDetailSerializer(article, context=self.get_serializer_context()).data
