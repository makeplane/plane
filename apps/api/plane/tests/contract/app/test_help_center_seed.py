# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract test for the `seed_help_center` content-as-code loader.

Verifies the markdown content tree (`plane/db/fixtures/help_center/`) seeds the
full taxonomy idempotently: 11 categories (each VI/EN/KO) + 54 articles (VI-first),
published, sanitized HTML, screenshot markers preserved, "Shinhan Workspace"
terminology (never "Plane").
"""

import pytest
from django.core.management import call_command

from plane.db.models import HelpArticle, HelpArticleTranslation, HelpCategory, HelpCategoryTranslation

EXPECTED_CATEGORIES = 11
EXPECTED_ARTICLES = 54  # full taxonomy (matches the fixture tree)
ALL_LOCALES = {"vi", "en", "ko"}


@pytest.mark.contract
class TestSeedHelpCenter:
    @pytest.mark.django_db
    def test_seeds_full_taxonomy(self):
        call_command("seed_help_center")
        assert HelpCategory.objects.count() == EXPECTED_CATEGORIES
        assert HelpArticle.objects.count() == EXPECTED_ARTICLES
        # Categories carry all 3 locale names; articles are VI-first this round.
        assert HelpCategoryTranslation.objects.count() == EXPECTED_CATEGORIES * 3
        assert HelpArticleTranslation.objects.filter(locale="vi").count() == EXPECTED_ARTICLES

    @pytest.mark.django_db
    def test_is_idempotent(self):
        call_command("seed_help_center")
        call_command("seed_help_center")
        assert HelpCategory.objects.count() == EXPECTED_CATEGORIES
        assert HelpArticle.objects.count() == EXPECTED_ARTICLES
        assert HelpArticleTranslation.objects.filter(locale="vi").count() == EXPECTED_ARTICLES

    @pytest.mark.django_db
    def test_categories_have_all_three_locale_names(self):
        call_command("seed_help_center")
        for category in HelpCategory.objects.all():
            assert set(category.translations.values_list("locale", flat=True)) == ALL_LOCALES

    @pytest.mark.django_db
    def test_every_article_has_vi(self):
        call_command("seed_help_center")
        for article in HelpArticle.objects.all():
            assert article.translations.filter(locale="vi", title__gt="").exists()

    @pytest.mark.django_db
    def test_html_sanitized_and_screenshot_markers_preserved(self):
        call_command("seed_help_center")
        for tr in HelpArticleTranslation.objects.all():
            assert "<script" not in tr.description_html
            assert "style=" not in tr.description_html
        # Stub bodies carry a screenshot placeholder that survives post-sanitize.
        assert HelpArticleTranslation.objects.filter(
            description_html__contains="data-help-screenshot"
        ).exists()

    @pytest.mark.django_db
    def test_shinhan_workspace_terminology_not_plane(self):
        call_command("seed_help_center")
        for tr in HelpArticleTranslation.objects.all():
            assert "Plane" not in tr.title
            assert "Plane" not in tr.description_html
        assert HelpArticleTranslation.objects.filter(
            description_html__contains="Shinhan Workspace"
        ).exists()

    @pytest.mark.django_db
    def test_all_articles_published(self):
        call_command("seed_help_center")
        assert HelpArticle.objects.filter(status="published").count() == EXPECTED_ARTICLES
