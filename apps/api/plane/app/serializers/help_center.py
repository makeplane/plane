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


SNIPPET_WINDOW = 200
SNIPPET_LEAD = 40


def build_search_snippet(body, folded_term):
    """Build a result snippet centered on the first match of the folded term.

    Folding (lowercase + drop diacritics) is length-preserving for typical
    precomposed Vietnamese/English text, so the index found in the folded body
    maps onto the original body. When that does not hold (folding changed the
    length — e.g. NFKD-decomposing scripts such as Korean Hangul — or the match
    was in the title rather than the body) we fall back to the head of the body
    so a snippet is always shown.
    """
    body = body or ""
    if not body:
        return ""
    folded_body = fold_accents(body)
    index = folded_body.find(folded_term)
    if index <= 0 or len(folded_body) != len(body):
        return body[:SNIPPET_WINDOW]
    start = max(0, index - SNIPPET_LEAD)
    end = min(len(body), start + SNIPPET_WINDOW)
    snippet = body[start:end].strip()
    prefix = "… " if start > 0 else ""
    suffix = " …" if end < len(body) else ""
    return f"{prefix}{snippet}{suffix}"


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
        # Cache like _resolved so get_matched_locale + get_snippet don't each
        # recompute (re-folding the whole body) for the same row.
        if not hasattr(obj, "_matched_cache"):
            obj._matched_cache = self._compute_matched(obj)
        return obj._matched_cache

    def _compute_matched(self, obj):
        # Which locale row matched the (accent-folded) search term, plus a snippet.
        term = self.context.get("search_term")
        if not term or not term.strip():
            return None, None
        folded = fold_accents(term)
        # Search is locale-scoped: report the locale it actually ran in (UI locale,
        # or vi after source fallback) so matched_locale + snippet stay consistent
        # with what was searched. Fall back to a plain scan if no scope was set.
        search_locale = self.context.get("search_locale")
        translations = list(obj.translations.all())
        if search_locale:
            scoped = next((t for t in translations if t.locale == search_locale), None)
            if scoped:
                return scoped.locale, build_search_snippet(scoped.description_stripped, folded)
        for t in translations:
            if t.search_text and folded in t.search_text:
                return t.locale, build_search_snippet(t.description_stripped, folded)
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
