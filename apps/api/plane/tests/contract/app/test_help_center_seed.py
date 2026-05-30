# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract test for the `seed_help_center` management command.

Verifies the starter seed is idempotent (re-runnable without duplicates),
covers all 3 locales for every record, and uses "Shinhan Workspace"
terminology (never "Plane").
"""

import pytest
from django.core.management import call_command

from plane.db.models import HelpArticle, HelpArticleTranslation, HelpCategory, HelpCategoryTranslation

EXPECTED_CATEGORIES = 5
EXPECTED_ARTICLES = 5
LOCALES = {"vi", "en", "ko"}


@pytest.mark.contract
class TestSeedHelpCenter:
    @pytest.mark.django_db
    def test_seed_is_idempotent_and_trilingual(self):
        call_command("seed_help_center")

        assert HelpCategory.objects.count() == EXPECTED_CATEGORIES
        assert HelpArticle.objects.count() == EXPECTED_ARTICLES
        # 3 locales per category and per article.
        assert HelpCategoryTranslation.objects.count() == EXPECTED_CATEGORIES * 3
        assert HelpArticleTranslation.objects.count() == EXPECTED_ARTICLES * 3

        # Re-running must not duplicate or overwrite.
        call_command("seed_help_center")
        assert HelpCategory.objects.count() == EXPECTED_CATEGORIES
        assert HelpArticleTranslation.objects.count() == EXPECTED_ARTICLES * 3

    @pytest.mark.django_db
    def test_every_record_has_all_three_locales(self):
        call_command("seed_help_center")
        for category in HelpCategory.objects.all():
            assert set(category.translations.values_list("locale", flat=True)) == LOCALES
        for article in HelpArticle.objects.all():
            assert set(article.translations.values_list("locale", flat=True)) == LOCALES

    @pytest.mark.django_db
    def test_uses_shinhan_workspace_terminology_not_plane(self):
        call_command("seed_help_center")
        translations = HelpArticleTranslation.objects.all()
        assert translations.exists()
        for tr in translations:
            assert "Plane" not in tr.title
            assert "Plane" not in tr.description_html
        # At least the getting-started body names the unified platform.
        assert HelpArticleTranslation.objects.filter(
            description_html__contains="Shinhan Workspace"
        ).exists()

    @pytest.mark.django_db
    def test_seeded_articles_published(self):
        call_command("seed_help_center")
        assert HelpArticle.objects.filter(status="published").count() == EXPECTED_ARTICLES
