# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from plane.app.serializers.help_center import HelpArticleDetailSerializer, HelpArticleListSerializer
from plane.app.views.base import BaseViewSet
from plane.db.models import HelpArticle
from plane.db.models.help_center import fold_accents

from .base import HelpCenterReadMixin

# Source locale: when the user's UI language has no match, search falls back here
# so an incompletely-translated guide still surfaces (labeled) instead of empty.
SOURCE_LOCALE = "vi"


class HelpArticleViewSet(HelpCenterReadMixin, BaseViewSet):
    """Global read of the shared Help Center articles.

    Any authenticated user sees published articles (with a usable translation).
    Search is LOCALE-SCOPED + accent-insensitive: it matches the user's UI-locale
    translation first, and only falls back to the source locale (vi) when the UI
    locale yields nothing — so results stay in the language the user reads, with a
    clear fallback when their language has no match. Authoring is God Mode only.
    """

    model = HelpArticle
    serializer_class = HelpArticleListSerializer
    permission_classes = [IsAuthenticated]
    # search + category filtering are handled explicitly in get_queryset (locale
    # scoping needs custom logic), so no generic filter backend is applied.
    filter_backends = []

    def get_serializer_class(self):
        return HelpArticleDetailSerializer if self.action == "retrieve" else HelpArticleListSerializer

    def retrieve_by_slug(self, request, slug=None):
        # Stable deep links use the globally-unique slug (slugs are never reused),
        # so /help/a/<slug> resolves directly without an id round-trip.
        article = get_object_or_404(self.get_queryset(), slug=slug)
        serializer = HelpArticleDetailSerializer(article, context=self.get_serializer_context())
        return Response(serializer.data)

    def _folded_terms(self):
        """Accent-fold each whitespace-separated query token (Vietnamese readers
        type unaccented; the stored search_text is folded too)."""
        raw = (self.request.GET.get("search") or "").strip()
        return [folded for token in raw.split() if (folded := fold_accents(token))]

    @staticmethod
    def _locale_match(terms, locale):
        """Q matching ALL folded terms within the SAME `locale` translation row.
        (article, locale) is unique, so a single filter() pins one row and ANDs
        every term against its folded search_text."""
        q = Q(translations__locale=locale, translations__deleted_at__isnull=True)
        for term in terms:
            q &= Q(translations__search_text__icontains=term)
        return q

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

        terms = self._folded_terms()
        if terms:
            ui_locale = self.request.GET.get("locale") or SOURCE_LOCALE
            scoped = queryset.filter(self._locale_match(terms, ui_locale)).distinct()
            if scoped.exists():
                self._resolved_search_locale = ui_locale
                return scoped
            if ui_locale != SOURCE_LOCALE:
                # source fallback: surface the vi guide when the UI locale has none
                self._resolved_search_locale = SOURCE_LOCALE
                return queryset.filter(self._locale_match(terms, SOURCE_LOCALE)).distinct()
            self._resolved_search_locale = ui_locale
            return scoped  # vi already searched; genuinely empty

        # distinct: the translations join (visibility) can duplicate rows.
        return queryset.distinct()
