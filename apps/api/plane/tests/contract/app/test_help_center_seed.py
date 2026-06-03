# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract test for the `seed_help_center` content-as-code loader.

Verifies the markdown content tree (`plane/db/fixtures/help_center/`) seeds the
full taxonomy idempotently: 11 categories (each VI/EN/KO) + 58 articles (VI-first),
published, sanitized HTML, screenshot markers preserved, "Shinhan Workspace"
terminology (never "Plane").
"""

import pytest
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status

from plane.db.models import HelpArticle, HelpArticleTranslation, HelpCategory, HelpCategoryTranslation

EXPECTED_CATEGORIES = 11
EXPECTED_ARTICLES = 58  # full taxonomy (matches the fixture tree)
ALL_LOCALES = {"vi", "en", "ko"}


@pytest.mark.contract
class TestSeedHelpCenter:
    @pytest.mark.django_db
    def test_seeds_full_taxonomy(self):
        call_command("seed_help_center", skip_screenshots=True, force=True)
        assert HelpCategory.objects.count() == EXPECTED_CATEGORIES
        assert HelpArticle.objects.count() == EXPECTED_ARTICLES
        # Categories carry all 3 locale names; articles are VI-first this round.
        assert HelpCategoryTranslation.objects.count() == EXPECTED_CATEGORIES * 3
        assert HelpArticleTranslation.objects.filter(locale="vi").count() == EXPECTED_ARTICLES

    @pytest.mark.django_db
    def test_is_idempotent(self):
        call_command("seed_help_center", skip_screenshots=True, force=True)
        call_command("seed_help_center", skip_screenshots=True, force=True)
        assert HelpCategory.objects.count() == EXPECTED_CATEGORIES
        assert HelpArticle.objects.count() == EXPECTED_ARTICLES
        assert HelpArticleTranslation.objects.filter(locale="vi").count() == EXPECTED_ARTICLES

    @pytest.mark.django_db
    def test_reseed_refuses_without_force_protecting_god_mode_edits(self):
        # One-time bootstrap: after content exists, a plain re-seed must NOT overwrite
        # edits (the business team owns the guide via God Mode); --force still does.
        call_command("seed_help_center", skip_screenshots=True, force=True)
        tr = HelpArticleTranslation.objects.filter(locale="vi").first()
        tr.title = "EDITED IN GOD MODE"
        tr.save()

        call_command("seed_help_center", skip_screenshots=True)  # no --force → skipped
        tr.refresh_from_db()
        assert tr.title == "EDITED IN GOD MODE"

        call_command("seed_help_center", skip_screenshots=True, force=True)  # --force → overwrites
        tr.refresh_from_db()
        assert tr.title != "EDITED IN GOD MODE"

    @pytest.mark.django_db
    def test_categories_have_all_three_locale_names(self):
        call_command("seed_help_center", skip_screenshots=True, force=True)
        for category in HelpCategory.objects.all():
            assert set(category.translations.values_list("locale", flat=True)) == ALL_LOCALES

    @pytest.mark.django_db
    def test_every_article_has_vi(self):
        call_command("seed_help_center", skip_screenshots=True, force=True)
        for article in HelpArticle.objects.all():
            assert article.translations.filter(locale="vi", title__gt="").exists()

    @pytest.mark.django_db
    def test_html_sanitized_and_screenshot_markers_preserved(self):
        call_command("seed_help_center", skip_screenshots=True, force=True)
        for tr in HelpArticleTranslation.objects.all():
            assert "<script" not in tr.description_html
            assert "style=" not in tr.description_html
        # Stub bodies carry a screenshot placeholder that survives post-sanitize.
        assert HelpArticleTranslation.objects.filter(
            description_html__contains="data-help-screenshot"
        ).exists()

    @pytest.mark.django_db
    def test_shinhan_workspace_terminology_not_plane(self):
        call_command("seed_help_center", skip_screenshots=True, force=True)
        # "Images in Plane" is the real God-Mode sidebar label (admin UI,
        # apps/admin/hooks/use-sidebar-menu/core.ts) — quoting it accurately is
        # allowed; the guard only forbids referring to the product as "Plane".
        god_mode_label = "Images in Plane"
        for tr in HelpArticleTranslation.objects.all():
            assert "Plane" not in tr.title
            assert "Plane" not in tr.description_html.replace(god_mode_label, "")
        assert HelpArticleTranslation.objects.filter(
            description_html__contains="Shinhan Workspace"
        ).exists()

    @pytest.mark.django_db
    def test_all_articles_published(self):
        call_command("seed_help_center", skip_screenshots=True, force=True)
        assert HelpArticle.objects.filter(status="published").count() == EXPECTED_ARTICLES


@pytest.mark.contract
class TestSeededContentReachesReader:
    """End-to-end regression: content seeded by the loader must surface through
    the global read API — every category visible, known articles listed, and
    accent-folded search hitting real Vietnamese titles."""

    @pytest.mark.django_db
    def test_all_eleven_categories_visible_with_published_articles(self, session_client):
        call_command("seed_help_center", skip_screenshots=True, force=True)
        response = session_client.get(reverse("help-categories"))
        assert response.status_code == status.HTTP_200_OK
        rows = {row["slug"]: row for row in response.data}
        # Every authored category has ≥1 published article, so none is hidden.
        assert len(rows) == EXPECTED_CATEGORIES
        for category in HelpCategory.objects.values_list("slug", flat=True):
            assert category in rows
            assert rows[category]["article_count"] >= 1

    @pytest.mark.django_db
    def test_seeded_article_retrievable_by_slug(self, session_client):
        call_command("seed_help_center", skip_screenshots=True, force=True)
        response = session_client.get(
            reverse("help-article-by-slug", kwargs={"slug": "tao-va-quan-ly-cycles"})
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["slug"] == "tao-va-quan-ly-cycles"
        assert response.data["title"] == "Tạo & quản lý Cycles"

    @pytest.mark.django_db
    def test_accent_folded_search_hits_seeded_titles(self, session_client):
        call_command("seed_help_center", skip_screenshots=True, force=True)
        # ASCII query (no diacritics) must match the folded Vietnamese title.
        cycles = session_client.get(reverse("help-articles"), {"search": "quan ly cycles"})
        projects = session_client.get(reverse("help-articles"), {"search": "lam viec voi du an"})
        assert "tao-va-quan-ly-cycles" in {row["slug"] for row in cycles.data}
        assert "lam-viec-voi-du-an" in {row["slug"] for row in projects.data}
