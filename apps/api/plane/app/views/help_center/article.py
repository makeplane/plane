# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from plane.app.serializers.help_center import HelpArticleDetailSerializer, HelpArticleListSerializer
from plane.app.views.base import BaseViewSet
from plane.db.models import HelpArticle

from .base import AccentInsensitiveSearchFilter, HelpCenterReadMixin


class HelpArticleViewSet(HelpCenterReadMixin, BaseViewSet):
    """Global read of the shared Help Center articles.

    Any authenticated user sees published articles (with a usable translation).
    Search is multilingual + accent-insensitive over the folded per-locale
    `search_text`. Authoring is God Mode only (license layer).
    """

    model = HelpArticle
    serializer_class = HelpArticleListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [AccentInsensitiveSearchFilter, DjangoFilterBackend]
    search_fields = ["translations__search_text"]

    def get_serializer_class(self):
        return HelpArticleDetailSerializer if self.action == "retrieve" else HelpArticleListSerializer

    def retrieve_by_slug(self, request, slug=None):
        # Stable deep links use the globally-unique slug (slugs are never reused),
        # so /help/a/<slug> resolves directly without an id round-trip.
        article = get_object_or_404(self.get_queryset(), slug=slug)
        serializer = HelpArticleDetailSerializer(article, context=self.get_serializer_context())
        return Response(serializer.data)

    def get_queryset(self):
        queryset = (
            HelpArticle.objects.filter(status="published")
            .filter(translations__title__gt="", translations__deleted_at__isnull=True)
            .select_related("category")
            .prefetch_related("translations", "category__translations")
        )
        category = self.request.GET.get("category")
        if category:
            queryset = queryset.filter(category_id=category)
        # distinct: the translations join (visibility + search) can duplicate rows.
        return queryset.distinct()
