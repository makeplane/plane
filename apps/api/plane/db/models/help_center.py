# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import unicodedata

# Django imports
from django.db import models
from django.db.models import Q

# Module imports
from plane.utils.html_processor import strip_tags

from .base import BaseModel

# Supported help-content locales. Help article/category *content* is data (these
# rows), not UI i18n — only the static UI chrome lives in @plane/i18n.
HELP_LOCALES = (("vi", "Vietnamese"), ("en", "English"), ("ko", "Korean"))

HELP_ARTICLE_STATUS = (("draft", "Draft"), ("published", "Published"))


def fold_accents(text):
    """Lowercase + reduce to ASCII letters for accent-insensitive search and
    clean URL slugs.

    Vietnamese readers type unaccented queries ("tai chinh") expecting to match
    accented content ("Tài chính"). The prod DB has no `unaccent` extension, so
    folding is done in Python: NFKD-decompose, drop combining marks, lowercase.
    `đ`/`Đ` (U+0111/U+0110) are the only Vietnamese letters NFKD does NOT
    decompose, so they are mapped to `d` explicitly — otherwise "đầu" would fold
    to "đau" (still non-ASCII) and a query like "dau" would miss it, and a slug
    derived from such a title would drop the letter entirely.
    The folded value backs `search_text` and is the base for `slugify(...)`
    (slugify strips any remaining non-ASCII, e.g. Korean, to keep URLs clean).
    """
    decomposed = unicodedata.normalize("NFKD", text or "")
    folded = "".join(ch for ch in decomposed if not unicodedata.combining(ch)).lower()
    return folded.replace("đ", "d")


class HelpCategory(BaseModel):
    """A function-area grouping of help articles.

    Instance-global: the Help Center is ONE shared user guide rendered in every
    workspace, so categories are NOT scoped to a workspace.
    """

    slug = models.SlugField(max_length=255)
    sort_order = models.FloatField(default=65535)
    icon = models.CharField(max_length=100, blank=True)  # lucide icon name, e.g. "folder-kanban"
    color = models.CharField(max_length=20, blank=True)  # hex, e.g. "#174EFD"
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            # Globally unique — intentionally NOT conditioned on deleted_at, so a
            # soft-deleted slug is never reused and old deep links resolve to a
            # clean 404.
            models.UniqueConstraint(
                fields=["slug"],
                name="help_category_unique_slug",
            )
        ]
        verbose_name = "Help Category"
        verbose_name_plural = "Help Categories"
        db_table = "help_categories"
        ordering = ("sort_order", "-created_at")

    def __str__(self):
        return self.slug

    def save(self, *args, **kwargs):
        # Sequence new categories after existing ones (instance-wide) so initial
        # order is deterministic. Reorder later rewrites sort_order between
        # neighbours via the God Mode update endpoint.
        if self._state.adding:
            largest = HelpCategory.objects.aggregate(largest=models.Max("sort_order"))["largest"]
            if largest is not None:
                self.sort_order = largest + 10000
        super().save(*args, **kwargs)


class HelpCategoryTranslation(BaseModel):
    """Per-locale display name for a help category."""

    category = models.ForeignKey(
        HelpCategory, on_delete=models.CASCADE, related_name="translations"
    )
    locale = models.CharField(max_length=2, choices=HELP_LOCALES)
    name = models.CharField(max_length=255)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["category", "locale"],
                condition=Q(deleted_at__isnull=True),
                name="help_category_translation_unique_locale_active",
            )
        ]
        verbose_name = "Help Category Translation"
        verbose_name_plural = "Help Category Translations"
        db_table = "help_category_translations"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.category_id} {self.locale}"


class HelpArticle(BaseModel):
    """A help article, optionally grouped under a category.

    Instance-global (no workspace scope). Publish is article-level only
    (`status`); translations have no status field.
    """

    category = models.ForeignKey(
        HelpCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="articles",
    )
    slug = models.SlugField(max_length=255)
    sort_order = models.FloatField(default=65535)
    status = models.CharField(max_length=10, choices=HELP_ARTICLE_STATUS, default="draft")

    class Meta:
        constraints = [
            # Globally unique slug (see HelpCategory note) — deep links stay stable.
            models.UniqueConstraint(
                fields=["slug"],
                name="help_article_unique_slug",
            )
        ]
        indexes = [
            models.Index(fields=["status"], name="help_article_status_idx"),
        ]
        verbose_name = "Help Article"
        verbose_name_plural = "Help Articles"
        db_table = "help_articles"
        ordering = ("sort_order", "-created_at")

    def __str__(self):
        return self.slug

    def save(self, *args, **kwargs):
        # Sequence new articles after existing ones in the same category bucket.
        if self._state.adding:
            largest = HelpArticle.objects.filter(category=self.category).aggregate(
                largest=models.Max("sort_order")
            )["largest"]
            if largest is not None:
                self.sort_order = largest + 10000
        super().save(*args, **kwargs)


class HelpArticleTranslation(BaseModel):
    """Per-locale title + rich content for a help article."""

    article = models.ForeignKey(
        HelpArticle, on_delete=models.CASCADE, related_name="translations"
    )
    locale = models.CharField(max_length=2, choices=HELP_LOCALES)
    title = models.CharField(max_length=255)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_json = models.JSONField(default=dict, blank=True)
    description_stripped = models.TextField(blank=True, null=True)  # snippet/display text
    # Accent-folded (title + stripped body) — the icontains search target. Kept
    # un-indexed on purpose: a btree index can't serve leading-wildcard LIKE and
    # would hit Postgres' 2704-byte btree row limit on long article bodies.
    search_text = models.TextField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["article", "locale"],
                condition=Q(deleted_at__isnull=True),
                name="help_article_translation_unique_locale_active",
            )
        ]
        verbose_name = "Help Article Translation"
        verbose_name_plural = "Help Article Translations"
        db_table = "help_article_translations"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.article_id} {self.locale}"

    def save(self, *args, **kwargs):
        # Derive stripped text (mirrors Page.save) and the accent-folded search
        # target from the html. MUST go through instance .save() (never
        # QuerySet.update) or both derived columns go stale.
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )
        self.search_text = fold_accents(f"{self.title} {self.description_stripped or ''}")
        super().save(*args, **kwargs)
