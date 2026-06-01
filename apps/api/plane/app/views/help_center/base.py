# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.core.exceptions import ValidationError
from django.utils.text import slugify
from rest_framework.filters import SearchFilter

from plane.app.serializers.help_center import sanitize_help_html
from plane.db.models import HelpArticleTranslation, HelpCategoryTranslation
from plane.db.models.help_center import fold_accents

VALID_LOCALES = {"vi", "en", "ko"}
# Slug is sourced VI-first (primary audience), then EN, then KO.
SLUG_LOCALE_ORDER = ("vi", "en", "ko")


class AccentInsensitiveSearchFilter(SearchFilter):
    """Fold each search term (lowercase + strip diacritics) before icontains, so
    a query like "tai chinh" matches the folded `search_text` of "Tài chính"
    without any DB extension (prod has no `unaccent`)."""

    def get_search_terms(self, request):
        return [fold_accents(term) for term in super().get_search_terms(request)]


class HelpCenterReadMixin:
    """Locale + search-term serializer context shared by the global read viewsets."""

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["locale"] = self.request.GET.get("locale")
        context["search_term"] = self.request.GET.get("search")
        # The locale the search actually ran in (UI locale, or vi after fallback);
        # the serializer reports matched_locale + snippet from this translation.
        context["search_locale"] = getattr(self, "_resolved_search_locale", None)
        return context


# ---- Authoring helpers (reused by the God Mode / license write layer) ----


def coerce_sort_order(value):
    """Float-coerce a client sort_order; raises 400 (not 500) on a bad value."""
    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValidationError("sort_order must be a number.")


def generate_unique_slug(model, title):
    """Server-side slug from a (possibly Vietnamese) title. Folds diacritics to
    ASCII before slugify, then suffixes -2, -3… on collision. Counts soft-deleted
    rows too (slugs are globally unique and never reused), so old deep links 404
    cleanly."""
    base = slugify(fold_accents(title)) or "untitled"
    slug, suffix = base, 2
    while model.all_objects.filter(slug=slug).exists():
        slug = f"{base}-{suffix}"
        suffix += 1
    return slug


def pick_slug_source(translations, key):
    """Pick the title/name used to derive the slug, preferring VI > EN > KO."""
    by_locale = {t.get("locale"): (t.get(key) or "").strip() for t in translations}
    for loc in SLUG_LOCALE_ORDER:
        if by_locale.get(loc):
            return by_locale[loc]
    return next(((t.get(key) or "").strip() for t in translations if (t.get(key) or "").strip()), "untitled")


def upsert_category_translations(category, translations):
    """Create/update per-locale category names (instance .save())."""
    for entry in translations:
        locale = entry.get("locale")
        name = (entry.get("name") or "").strip()
        if locale not in VALID_LOCALES or not name:
            continue
        row = category.translations.filter(locale=locale).first() or HelpCategoryTranslation(
            category=category, locale=locale
        )
        row.name = name
        row.save()


def upsert_article_translation(article, locale, payload):
    """Create/update one article translation. Sanitizes html and persists via
    instance .save() so description_stripped + search_text re-derive."""
    title = (payload.get("title") or "").strip()
    row = article.translations.filter(locale=locale).first() or HelpArticleTranslation(
        article=article, locale=locale
    )
    if title:
        row.title = title
    row.description_html = sanitize_help_html(payload.get("description_html") or "<p></p>")
    row.description_json = payload.get("description_json") or {}
    row.save()
    return row


def upsert_article_translations(article, translations):
    """Bulk upsert from a create/update payload; skips entries without a title."""
    for entry in translations:
        locale = entry.get("locale")
        if locale not in VALID_LOCALES or not (entry.get("title") or "").strip():
            continue
        upsert_article_translation(article, locale, entry)


def has_titled_translation(article):
    """Fresh query (avoids stale prefetch cache) for the publish invariant."""
    return any(
        (title or "").strip()
        for title in HelpArticleTranslation.objects.filter(article=article).values_list("title", flat=True)
    )
