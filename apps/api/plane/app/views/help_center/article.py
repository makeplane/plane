# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated

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
