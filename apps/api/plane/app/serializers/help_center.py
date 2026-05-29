# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import nh3
from rest_framework import serializers

from plane.db.models import HelpArticle, HelpArticleTranslation, HelpCategory, HelpCategoryTranslation
from plane.db.models.help_center import fold_accents
from plane.utils.content_validator import ALLOWED_TAGS, ATTRIBUTES, MAX_SIZE, SAFE_PROTOCOLS

from .base import BaseSerializer

# Locale fallback order for reading (requested -> en -> vi -> any-with-content).
FALLBACK_ORDER = ("en", "vi")

# Hardened HTML allowlist for broadcast help content: reuse Plane's allowlist but
# DROP `style` from every tag. nh3 does not sanitize CSS, so a permitted style
# attribute enables overlay/clickjacking on content shown to all members. nh3's
# default tag set already excludes script/iframe/video/embed — images are the
# only embeddable media (intentional bank security posture).
HELP_ALLOWED_ATTRIBUTES = {tag: {a for a in attrs if a != "style"} for tag, attrs in ATTRIBUTES.items()}


def sanitize_help_html(html):
    """Sanitize author HTML with the hardened (style-stripped) allowlist."""
    if not html:
        return "<p></p>"
    if len(html.encode("utf-8")) > MAX_SIZE:
        raise serializers.ValidationError({"description_html": "HTML content exceeds the 10MB limit."})
    try:
        return nh3.clean(html, tags=ALLOWED_TAGS, attributes=HELP_ALLOWED_ATTRIBUTES, url_schemes=SAFE_PROTOCOLS)
    except Exception:
        raise serializers.ValidationError({"description_html": "Failed to sanitize HTML content."})


def resolve_translation(article, requested_locale):
    """Deterministic resolution: requested -> en -> vi -> any usable translation.

    Only translations with a non-empty title are usable, so a published article
    with no usable content resolves to (None, None) instead of crashing.
    """
    usable = [t for t in article.translations.all() if (t.title or "").strip()]
    by_locale = {t.locale: t for t in usable}
    for loc in (requested_locale, *FALLBACK_ORDER):
        if loc and loc in by_locale:
            return by_locale[loc], loc
    if usable:
        return usable[0], usable[0].locale
    return None, None


# ---- Reading serializers (plane/app — any authenticated user, published only) ----


class HelpCategoryReadSerializer(BaseSerializer):
    """Locale-resolved category for the reading UI."""

    name = serializers.SerializerMethodField()
    article_count = serializers.SerializerMethodField()

    class Meta:
        model = HelpCategory
        fields = ["id", "slug", "sort_order", "icon", "color", "is_active", "name", "article_count"]
        read_only_fields = fields

    def get_name(self, obj):
        requested = self.context.get("locale")
        names = {t.locale: t.name for t in obj.translations.all() if (t.name or "").strip()}
        for loc in (requested, *FALLBACK_ORDER):
            if loc and loc in names:
                return names[loc]
        return next(iter(names.values()), obj.slug)

    def get_article_count(self, obj):
        # Populated by the viewset queryset annotation (published-only).
        return getattr(obj, "article_count", 0)


class HelpArticleListSerializer(BaseSerializer):
    """Locale-resolved article row; carries search snippet/matched_locale when searching."""

    title = serializers.SerializerMethodField()
    resolved_locale = serializers.SerializerMethodField()
    matched_locale = serializers.SerializerMethodField()
    snippet = serializers.SerializerMethodField()

    class Meta:
        model = HelpArticle
        fields = [
            "id", "slug", "category", "sort_order", "status",
            "title", "resolved_locale", "matched_locale", "snippet", "updated_at",
        ]
        read_only_fields = fields

    def _resolved(self, obj):
        if not hasattr(obj, "_resolved_cache"):
            obj._resolved_cache = resolve_translation(obj, self.context.get("locale"))
        return obj._resolved_cache

    def _matched(self, obj):
        # Which locale row matched the (accent-folded) search term, plus a snippet.
        term = self.context.get("search_term")
        if not term:
            return None, None
        folded = fold_accents(term)
        for t in obj.translations.all():
            if t.search_text and folded in t.search_text:
                return t.locale, (t.description_stripped or "")[:200]
        return None, None

    def get_title(self, obj):
        translation, _ = self._resolved(obj)
        return translation.title if translation else None

    def get_resolved_locale(self, obj):
        return self._resolved(obj)[1]

    def get_matched_locale(self, obj):
        return self._matched(obj)[0]

    def get_snippet(self, obj):
        return self._matched(obj)[1]


class HelpArticleDetailSerializer(HelpArticleListSerializer):
    """Adds rich content + available locales. Readers get sanitized html only —
    `description_json` is never on the read path (authoring fidelity lives in the
    God Mode admin serializer)."""

    description_html = serializers.SerializerMethodField()
    available_locales = serializers.SerializerMethodField()
    requested_locale = serializers.SerializerMethodField()

    class Meta(HelpArticleListSerializer.Meta):
        fields = HelpArticleListSerializer.Meta.fields + [
            "description_html", "available_locales", "requested_locale",
        ]
        read_only_fields = fields

    def get_description_html(self, obj):
        translation, _ = self._resolved(obj)
        return translation.description_html if translation else None

    def get_available_locales(self, obj):
        return [t.locale for t in obj.translations.all() if (t.title or "").strip()]

    def get_requested_locale(self, obj):
        return self.context.get("locale")


# ---- Authoring serializers (God Mode / license layer — full per-locale content) ----


class HelpCategoryTranslationSerializer(BaseSerializer):
    class Meta:
        model = HelpCategoryTranslation
        fields = ["locale", "name"]


class HelpArticleTranslationFullSerializer(BaseSerializer):
    class Meta:
        model = HelpArticleTranslation
        fields = ["locale", "title", "description_html", "description_json"]


class HelpCategoryAdminSerializer(BaseSerializer):
    """All locales + raw fields for God Mode authoring."""

    translations = HelpCategoryTranslationSerializer(many=True, read_only=True)

    class Meta:
        model = HelpCategory
        fields = ["id", "slug", "sort_order", "icon", "color", "is_active", "translations"]
        read_only_fields = ["id", "slug"]


class HelpArticleAdminSerializer(BaseSerializer):
    """All locales (title + html + json) for God Mode authoring/edit fidelity."""

    translations = HelpArticleTranslationFullSerializer(many=True, read_only=True)

    class Meta:
        model = HelpArticle
        fields = ["id", "slug", "category", "sort_order", "status", "translations", "created_at", "updated_at"]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]
